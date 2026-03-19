import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync, renameSync } from "fs"
import { join } from "path"
import { Bun } from "bun"

/**
 * Delegation Logger Plugin for OpenCode
 *
 * Records delegation hierarchy for adaptorv4 multi-level agent workflow.
 * Tracks parent-child session relationships, DEPTH levels, and execution results.
 *
 * Log file location: .log/delegation/YYYY-MM-DD/YYYY-MM-DD_HH-MM_title_sessionId.json
 */

// ============================================================================
// Types
// ============================================================================

interface DelegationNode {
  id: string
  parent_id: string | null
  session_id: string
  child_session_ids: string[]
  depth: number | null
  agent_type: string
  description: string
  prompt_summary: string
  result?: {
    status: "success" | "error"
    duration_ms: number
    output_summary: string
    tokens?: { input: number; output: number }
  }
}

interface DelegationLog {
  session: {
    id: string
    title: string
    started_at: number
    completed_at: number | null
    root_agent: string
    max_depth: number | null
  }
  delegations: DelegationNode[]
  stats: {
    total_nodes: number
    max_actual_depth: number
    total_tokens: { input: number; output: number }
    total_duration_ms: number
    by_agent: Record<string, number>
  }
}

interface SessionInfo {
  id: string
  parentId: string | null
  title: string
  agentType: string
  depth: number | null
  description: string
  promptSummary: string
  startedAt: number
  children: string[]
}

// ============================================================================
// Constants
// ============================================================================

const LOG_DIR_NAME = ".log"
const DELEGATION_DIR_NAME = "delegation"
const LOCK_TIMEOUT_MS = 5000
const LOCK_RETRY_MS = 50
const PROMPT_SUMMARY_LENGTH = 200
const OUTPUT_SUMMARY_LENGTH = 1000

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse DEPTH from prompt string
 * Format: DEPTH=N at the beginning of prompt
 */
function parseDepth(prompt: string): number | null {
  if (!prompt) return null
  const match = prompt.match(/^DEPTH=(\d+)/i)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Parse ADAPTOR declaration from text
 * Format: [ADAPTOR] DEPTH=N | 任务描述
 */
function parseAdaptorDeclaration(text: string): { depth: number | null; description: string } | null {
  if (!text) return null
  const match = text.match(/^\[ADAPTOR\]\s*DEPTH=(\d+)\s*\|\s*(.+)$/m)
  if (!match) return null
  return {
    depth: parseInt(match[1], 10),
    description: match[2].trim(),
  }
}

/**
 * Truncate string to specified length
 */
function truncate(str: string, maxLength: number): string {
  if (!str) return ""
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength) + "..."
}

/**
 * Generate node ID
 */
function generateNodeId(index: number): string {
  return `node_${index + 1}`
}

/**
 * Format date for filename
 */
function formatDateForFilename(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hour = String(date.getHours()).padStart(2, "0")
  const minute = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}_${hour}-${minute}`
}

/**
 * Format date for directory name (YYYY-MM-DD)
 */
function formatDateForDir(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Sanitize filename (remove invalid characters)
 */
function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, "_").substring(0, 50)
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================================================
// File Operations with Locking
// ============================================================================

/**
 * Acquire file lock with timeout
 */
async function acquireLock(lockPath: string): Promise<boolean> {
  const startTime = Date.now()
  while (existsSync(lockPath)) {
    if (Date.now() - startTime > LOCK_TIMEOUT_MS) {
      return false
    }
    await sleep(LOCK_RETRY_MS)
  }
  writeFileSync(lockPath, `locked:${Date.now()}`)
  return true
}

/**
 * Release file lock
 */
function releaseLock(lockPath: string): void {
  if (existsSync(lockPath)) {
    unlinkSync(lockPath)
  }
}

/**
 * Safely read JSON file
 */
async function safeReadJson<T>(filePath: string): Promise<T | null> {
  if (!existsSync(filePath)) return null
  try {
    const content = await Bun.file(filePath).text()
    return JSON.parse(content) as T
  } catch {
    return null
  }
}

/**
 * Safely write JSON file with atomic write (temp file + rename)
 */
async function safeWriteJson(filePath: string, data: object): Promise<boolean> {
  const tempPath = filePath + ".tmp"
  try {
    writeFileSync(tempPath, JSON.stringify(data, null, 2))
    renameSync(tempPath, filePath)
    return true
  } catch (err) {
    if (existsSync(tempPath)) {
      unlinkSync(tempPath)
    }
    return false
  }
}

// ============================================================================
// Log Management
// ============================================================================

class DelegationLogManager {
  private baseDir: string
  private sessionCache: Map<string, SessionInfo> = new Map()
  private parentChildMap: Map<string, string[]> = new Map() // parent -> children
  private childParentMap: Map<string, string> = new Map() // child -> parent
  private taskInfoCache: Map<string, { agentType: string; description: string; prompt: string }> = new Map()
  private nodeIndexCounter: number = 0

  constructor(baseDir: string) {
    this.baseDir = baseDir
  }

  /**
   * Get or create log directory for today
   */
  private getLogDir(): string {
    const dateDir = formatDateForDir(new Date())
    const logDir = join(this.baseDir, LOG_DIR_NAME, DELEGATION_DIR_NAME, dateDir)
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true })
    }
    return logDir
  }

  /**
   * Generate log filename
   */
  private generateLogFilename(sessionId: string, title: string): string {
    const timestamp = formatDateForFilename(new Date())
    const sanitizedTitle = sanitizeFilename(title)
    return `${timestamp}_${sanitizedTitle}_${sessionId}.json`
  }

  /**
   * Get log file path for a session
   */
  private getLogFilePath(sessionId: string, title: string): string {
    const logDir = this.getLogDir()
    const filename = this.generateLogFilename(sessionId, title)
    return join(logDir, filename)
  }

  /**
   * Register a session
   */
  registerSession(info: SessionInfo): void {
    this.sessionCache.set(info.id, info)

    // Build parent-child relationship
    if (info.parentId) {
      this.childParentMap.set(info.id, info.parentId)
      const children = this.parentChildMap.get(info.parentId) || []
      if (!children.includes(info.id)) {
        children.push(info.id)
        this.parentChildMap.set(info.parentId, children)
      }
    }
  }

  /**
   * Register task tool execution info
   */
  registerTaskInfo(sessionId: string, info: { agentType: string; description: string; prompt: string }): void {
    this.taskInfoCache.set(sessionId, info)
  }

  /**
   * Find root session ID
   */
  private findRootSession(sessionId: string): string {
    let current = sessionId
    let visited = new Set<string>()
    while (this.childParentMap.has(current) && !visited.has(current)) {
      visited.add(current)
      current = this.childParentMap.get(current)!
    }
    return current
  }

  /**
   * Collect all descendant sessions
   */
  private collectDescendants(sessionId: string): string[] {
    const result: string[] = []
    const queue = [sessionId]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current)) continue
      visited.add(current)

      const children = this.parentChildMap.get(current) || []
      for (const child of children) {
        result.push(child)
        queue.push(child)
      }
    }

    return result
  }

  /**
   * Build delegation node from session info
   */
  private buildNode(sessionId: string, result?: DelegationNode["result"]): DelegationNode {
    const info = this.sessionCache.get(sessionId)
    const taskInfo = this.taskInfoCache.get(sessionId)
    const children = this.parentChildMap.get(sessionId) || []

    const depth = info?.depth ?? (taskInfo ? parseDepth(taskInfo.prompt) : null)
    const description = info?.description ?? taskInfo?.description ?? "Unknown task"
    const promptSummary = taskInfo ? truncate(taskInfo.prompt, PROMPT_SUMMARY_LENGTH) : ""
    const agentType = info?.agentType ?? taskInfo?.agentType ?? "unknown"

    return {
      id: generateNodeId(this.nodeIndexCounter++),
      parent_id: info?.parentId ?? null,
      session_id: sessionId,
      child_session_ids: children,
      depth,
      agent_type: agentType,
      description,
      prompt_summary: promptSummary,
      result,
    }
  }

  /**
   * Calculate stats from nodes
   */
  private calculateStats(nodes: DelegationNode[]): DelegationLog["stats"] {
    const stats: DelegationLog["stats"] = {
      total_nodes: nodes.length,
      max_actual_depth: 0,
      total_tokens: { input: 0, output: 0 },
      total_duration_ms: 0,
      by_agent: {},
    }

    for (const node of nodes) {
      // Max depth
      if (node.depth !== null && node.depth > stats.max_actual_depth) {
        stats.max_actual_depth = node.depth
      }

      // Tokens
      if (node.result?.tokens) {
        stats.total_tokens.input += node.result.tokens.input
        stats.total_tokens.output += node.result.tokens.output
      }

      // Duration
      if (node.result?.duration_ms) {
        stats.total_duration_ms += node.result.duration_ms
      }

      // By agent
      const agent = node.agent_type
      stats.by_agent[agent] = (stats.by_agent[agent] || 0) + 1
    }

    return stats
  }

  /**
   * Write log for a completed session
   */
  async writeLog(rootSessionId: string, messages: any[]): Promise<void> {
    const rootInfo = this.sessionCache.get(rootSessionId)
    if (!rootInfo) return

    const allSessionIds = [rootSessionId, ...this.collectDescendants(rootSessionId)]
    const nodes: DelegationNode[] = []
    this.nodeIndexCounter = 0

    for (const sessionId of allSessionIds) {
      // Extract result from messages
      const result = this.extractResultFromMessages(sessionId, messages)
      const node = this.buildNode(sessionId, result)
      nodes.push(node)
    }

    const log: DelegationLog = {
      session: {
        id: rootSessionId,
        title: rootInfo.title,
        started_at: rootInfo.startedAt,
        completed_at: Date.now(),
        root_agent: rootInfo.agentType,
        max_depth: rootInfo.depth,
      },
      delegations: nodes,
      stats: this.calculateStats(nodes),
    }

    const logPath = this.getLogFilePath(rootSessionId, rootInfo.title)
    const lockPath = logPath + ".lock"

    const acquired = await acquireLock(lockPath)
    if (!acquired) {
      console.error(`[delegation-logger] Failed to acquire lock for ${logPath}`)
      return
    }

    try {
      await safeWriteJson(logPath, log)
    } finally {
      releaseLock(lockPath)
    }
  }

  /**
   * Extract result from session messages
   */
  private extractResultFromMessages(
    sessionId: string,
    messages: any[],
  ): DelegationNode["result"] | undefined {
    // Find the last text part from assistant messages
    const lastAssistantText = messages
      .filter((m: any) => m.role === "assistant")
      .flatMap((m: any) => m.parts || [])
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("\n")

    // Find step-finish part for tokens and cost
    const stepFinish = messages
      .filter((m: any) => m.role === "assistant")
      .flatMap((m: any) => m.parts || [])
      .find((p: any) => p.type === "step-finish")

    const info = this.sessionCache.get(sessionId)
    const now = Date.now()
    const durationMs = info ? now - info.startedAt : 0

    return {
      status: "success",
      duration_ms: durationMs,
      output_summary: truncate(lastAssistantText, OUTPUT_SUMMARY_LENGTH),
      tokens: stepFinish?.tokens
        ? {
            input: stepFinish.tokens.input || 0,
            output: stepFinish.tokens.output || 0,
          }
        : undefined,
    }
  }
}

// ============================================================================
// Plugin Implementation
// ============================================================================

export const DelegationLoggerPlugin: Plugin = async ({ directory, client }) => {
  const manager = new DelegationLogManager(directory)
  const rootSessionIds = new Set<string>()

  return {
    /**
     * Handle events for session lifecycle
     */
    event: async ({ event }) => {
      // Track session creation
      if (event.type === "session.created") {
        const info = event.properties.info
        const parentId = info.parentID || null

        // Try to extract DEPTH and description from title
        const title = info.title || ""
        let depth: number | null = null
        let description = title

        // Check if title contains [ADAPTOR] DEPTH=N | description
        const adaptorDecl = parseAdaptorDeclaration(title)
        if (adaptorDecl) {
          depth = adaptorDecl.depth
          description = adaptorDecl.description
        }

        // Extract agent type from title if present (@agent_name subagent)
        const agentMatch = title.match(/@(\w+)\s+subagent/)
        const agentType = agentMatch ? agentMatch[1] : "adaptorv4"

        manager.registerSession({
          id: info.id,
          parentId,
          title: info.title,
          agentType,
          depth,
          description,
          promptSummary: "",
          startedAt: info.time?.created || Date.now(),
          children: [],
        })

        // Track root sessions
        if (!parentId) {
          rootSessionIds.add(info.id)
        }
      }

      // Handle session completion
      if (event.type === "session.idle") {
        const sessionId = event.properties.sessionID

        // Check if this is a root session
        if (rootSessionIds.has(sessionId)) {
          try {
            // Get all messages for this session
            const result = await client.session.messages({ path: { id: sessionId } })
            const messages = result.data || []

            await manager.writeLog(sessionId, messages)

            // Clean up
            rootSessionIds.delete(sessionId)
          } catch (err) {
            await client.app.log({
              service: "delegation-logger",
              level: "error",
              message: `Failed to write log for session ${sessionId}: ${err}`,
            })
          }
        }
      }
    },

    /**
     * Track task tool executions
     */
    "tool.execute.after": async (input, output) => {
      if (input.tool !== "task") return

      const args = input.args as {
        subagent_type?: string
        description?: string
        prompt?: string
        task_id?: string
      }

      if (!args) return

      // Extract child session ID from output
      const outputText = output.output || ""
      const sessionIdMatch = outputText.match(/task_id:\s*([^\s]+)/)
      const childSessionId = sessionIdMatch ? sessionIdMatch[1] : null

      if (childSessionId && args.prompt) {
        manager.registerTaskInfo(childSessionId, {
          agentType: args.subagent_type || "unknown",
          description: args.description || "Unknown task",
          prompt: args.prompt,
        })

        // Try to extract DEPTH from prompt
        const depth = parseDepth(args.prompt)

        await client.app.log({
          service: "delegation-logger",
          level: "info",
          message: `Task delegated: ${args.description} (DEPTH=${depth ?? "N/A"}, agent=${args.subagent_type})`,
        })
      }
    },
  }
}