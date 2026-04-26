import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, mkdirSync, appendFileSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"

/**
 * Delegation Logger Plugin for OpenCode
 *
 * Incremental Markdown-based delegation log with interrupt detection.
 * Uses append-only writes for concurrent safety.
 *
 * Features:
 * - Real-time event logging via append-only writes
 * - User interrupt detection (MessageAbortedError)
 * - Recovery hints generation
 * - Human-readable Markdown format
 *
 * Log file location: .log/delegation/YYYY-MM-DD/YYYY-MM-DD_HH-MM_title_sessionId.md
 */

// ============================================================================
// Types
// ============================================================================

interface SessionNode {
  id: string
  parentId: string | null
  title: string
  depth: number | null
  agentType: string
  description: string
  startedAt: number
  status: "running" | "completed" | "interrupted"
  result?: {
    durationMs: number
    tokens?: { input: number; output: number }
    outputSummary: string
  }
}

interface InterruptInfo {
  sessionId: string
  reason: string
  depth: number | null
  parentChain: string[]
  lastOutput: string
  lastThinking: string | null
  recoveryHint: string
}

// ============================================================================
// Constants
// ============================================================================

const LOG_DIR_NAME = ".log"
const DELEGATION_DIR_NAME = "delegation"
const OUTPUT_SUMMARY_LENGTH = 500

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse DEPTH from text
 * Format: DEPTH=N or [ADAPTOR] DEPTH=N | ...
 */
function parseDepth(text: string): number | null {
  if (!text) return null
  const match = text.match(/DEPTH=(\d+)/i)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Parse ADAPTOR declaration from title
 * Format: [ADAPTOR] DEPTH=N | 任务描述
 */
function parseAdaptorDeclaration(text: string): { depth: number | null; description: string } | null {
  if (!text) return null
  const match = text.match(/\[ADAPTOR\]\s*DEPTH=(\d+)\s*\|\s*(.+)$/m)
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
 * Format date as ISO string without timezone
 */
function formatDate(date: Date): string {
  return date.toISOString().replace("T", " ").substring(0, 19)
}

/**
 * Format date for filename: YYYY-MM-DD_HH-MM
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
 * Format date for directory name: YYYY-MM-DD
 */
function formatDateForDir(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Sanitize filename by removing invalid characters
 */
function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, "_").substring(0, 50)
}

// ============================================================================
// Task Args Cache (for tool.execute.before -> after communication)
// ============================================================================

/**
 * Cache for task tool arguments
 * Used to pass args from tool.execute.before to tool.execute.after
 * Key: callID, Value: task args
 */
const taskArgsCache = new Map<string, {
  subagent_type?: string
  description?: string
  prompt?: string
}>()

// ============================================================================
// Markdown Log Manager
// ============================================================================

class MarkdownLogManager {
  private baseDir: string
  private sessions: Map<string, SessionNode> = new Map()
  private rootSessions: Set<string> = new Set()
  private logPaths: Map<string, string> = new Map()

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
   * Get log file path for a root session
   */
  private getLogPath(sessionId: string, title: string): string {
    if (this.logPaths.has(sessionId)) {
      return this.logPaths.get(sessionId)!
    }

    const logDir = this.getLogDir()
    const timestamp = formatDateForFilename(new Date())
    const sanitizedTitle = sanitizeFilename(title)
    const filename = `${timestamp}_${sanitizedTitle}_${sessionId}.md`
    const path = join(logDir, filename)
    this.logPaths.set(sessionId, path)
    return path
  }

  /**
   * Find root session ID by traversing parent chain
   */
  private findRootSessionId(sessionId: string): string {
    let current = sessionId
    const visited = new Set<string>()
    while (true) {
      const node = this.sessions.get(current)
      if (!node || !node.parentId) break
      if (visited.has(current)) break
      visited.add(current)
      current = node.parentId
    }
    return current
  }

  /**
   * Get parent chain from root to specified session
   */
  private getParentChain(sessionId: string): string[] {
    const chain: string[] = []
    let current = sessionId
    const visited = new Set<string>()

    while (true) {
      const node = this.sessions.get(current)
      if (!node || !node.parentId) break
      if (visited.has(current)) break
      visited.add(current)
      chain.unshift(node.parentId)
      current = node.parentId
    }

    return chain
  }

  /**
   * Append event to root session's log file
   * Uses atomic append operation for concurrent safety
   */
  private appendEvent(rootSessionId: string, event: string): void {
    const rootNode = this.sessions.get(rootSessionId)
    if (!rootNode) return

    const logPath = this.getLogPath(rootSessionId, rootNode.title)
    appendFileSync(logPath, event + "\n", "utf-8")
  }

  /**
   * Register a new session
   */
  registerSession(info: {
    id: string
    parentId: string | null
    title: string
    agentType: string
    depth: number | null
    description: string
  }): void {
    const node: SessionNode = {
      id: info.id,
      parentId: info.parentId,
      title: info.title,
      depth: info.depth,
      agentType: info.agentType,
      description: info.description,
      startedAt: Date.now(),
      status: "running",
    }
    this.sessions.set(info.id, node)

    // Track root sessions
    if (!info.parentId) {
      this.rootSessions.add(info.id)
      this.createLogFile(info.id, info.title, info.agentType, info.depth)
    } else {
      // Append CREATED event to root session log
      const rootId = this.findRootSessionId(info.id)
      this.appendEvent(rootId, this.formatCreatedEvent(node))
    }
  }

  /**
   * Create new log file with header
   */
  private createLogFile(sessionId: string, title: string, agentType: string, depth: number | null): void {
    const logPath = this.getLogPath(sessionId, title)
    const header = `# Delegation Log

## Session Info
- **ID**: ${sessionId}
- **Title**: ${title}
- **Agent**: ${agentType}
- **Depth**: ${depth ?? "N/A"}
- **Started**: ${formatDate(new Date())}
- **Status**: running

## Event Log
`
    writeFileSync(logPath, header, "utf-8")
  }

  /**
   * Format CREATED event line
   */
  private formatCreatedEvent(node: SessionNode): string {
    const ts = formatDate(new Date())
    const depthStr = node.depth !== null ? `depth=${node.depth}` : "depth=N/A"
    const parentStr = node.parentId ? `parent=${node.parentId}` : "parent=root"
    return `[CREATED] ${ts} | ${node.id} | ${depthStr} | ${parentStr} | ${node.description}`
  }

  /**
   * Format COMPLETED event line
   */
  private formatCompletedEvent(node: SessionNode): string {
    const ts = formatDate(new Date())
    const duration = node.result ? Math.round(node.result.durationMs / 1000) : 0
    const tokens = node.result?.tokens
      ? `${node.result.tokens.input + node.result.tokens.output}`
      : "N/A"
    return `[COMPLETED] ${ts} | ${node.id} | duration=${duration}s | tokens=${tokens} | ${truncate(node.description, 50)}`
  }

  /**
   * Format INTERRUPTED event line
   */
  private formatInterruptedEvent(sessionId: string, info: InterruptInfo): string {
    const ts = formatDate(new Date())
    const depthStr = info.depth !== null ? `depth=${info.depth}` : "depth=N/A"
    return `[INTERRUPTED] ${ts} | ${sessionId} | ${depthStr} | reason=${info.reason}`
  }

  /**
   * Mark session as completed
   */
  markCompleted(sessionId: string, result: SessionNode["result"]): void {
    const node = this.sessions.get(sessionId)
    if (!node) return

    node.status = "completed"
    node.result = result

    // Only append to log if not root session (root gets final summary)
    if (node.parentId) {
      const rootId = this.findRootSessionId(sessionId)
      this.appendEvent(rootId, this.formatCompletedEvent(node))
    }
  }

  /**
   * Handle user interrupt
   */
  async handleInterrupt(
    sessionId: string,
    client: any,
    lastOutput: string,
    lastThinking: string | null
  ): Promise<void> {
    const node = this.sessions.get(sessionId)
    if (!node) return

    node.status = "interrupted"

    const rootId = this.findRootSessionId(sessionId)
    const rootNode = this.sessions.get(rootId)
    if (!rootNode) return

    // Build interrupt info
    const info: InterruptInfo = {
      sessionId,
      reason: "user_abort",
      depth: node.depth,
      parentChain: this.getParentChain(sessionId),
      lastOutput,
      lastThinking,
      recoveryHint: await this.generateRecoveryHint(sessionId, lastThinking, lastOutput),
    }

    // Append interrupted event
    this.appendEvent(rootId, this.formatInterruptedEvent(sessionId, info))

    // Append interrupt report section
    const report = this.formatInterruptReport(info, rootNode, node)
    const logPath = this.getLogPath(rootId, rootNode.title)
    appendFileSync(logPath, report, "utf-8")

    // Update status in header
    this.updateStatusInLog(rootId, "interrupted")

    // Clean up root session tracking
    this.rootSessions.delete(rootId)

    // Clean up all sessions in this tree
    this.cleanupSessions(rootId)
  }

  /**
   * Format interrupt report section
   */
  private formatInterruptReport(info: InterruptInfo, rootNode: SessionNode, interruptedNode: SessionNode): string {
    const parentChainStr = info.parentChain.length > 0
      ? info.parentChain.join(" → ") + ` → ${info.sessionId}`
      : info.sessionId

    // Count completed and pending tasks
    let completedCount = 0
    let pendingCount = 0
    for (const [, n] of this.sessions) {
      if (n.status === "completed") completedCount++
      else if (n.status === "running") pendingCount++
    }

    return `
## Interrupt Report

**Interrupted At**: ${formatDate(new Date())}
**Reason**: ${info.reason}
**Interrupted Session**: ${info.sessionId}
**Depth**: ${info.depth ?? "N/A"}
**Current Task**: ${interruptedNode.description}
**Parent Chain**: ${parentChainStr}
**Completed Nodes**: ${completedCount}
**Pending Nodes**: ${pendingCount}

### Last Output
\`\`\`
${info.lastOutput || "(no output)"}
\`\`\`

${info.lastThinking ? `### Last Thinking
\`\`\`
${truncate(info.lastThinking, 1000)}
\`\`\`
` : ""}
### Recovery Hint
${info.recoveryHint}
`
  }

  /**
   * Generate recovery hint based on current state
   */
  private async generateRecoveryHint(
    sessionId: string,
    lastThinking: string | null,
    lastOutput: string
  ): Promise<string> {
    const node = this.sessions.get(sessionId)
    if (!node) return "Unable to generate recovery hint - session not found."

    // Find completed and pending sibling tasks
    const completedTasks: string[] = []
    const pendingTasks: string[] = []

    for (const [, n] of this.sessions) {
      if (n.parentId === node.parentId && n.id !== node.id) {
        if (n.status === "completed") {
          completedTasks.push(n.description)
        } else if (n.status === "running") {
          pendingTasks.push(n.description)
        }
      }
    }

    const lines: string[] = []

    lines.push(`**Interrupted Task**: ${node.description}`)
    lines.push("")

    if (completedTasks.length > 0) {
      lines.push("**Completed Tasks:**")
      completedTasks.forEach(t => lines.push(`- ✅ ${t}`))
      lines.push("")
    }

    if (pendingTasks.length > 0) {
      lines.push("**Pending Tasks:**")
      pendingTasks.forEach(t => lines.push(`- ⏳ ${t}`))
      lines.push("")
    }

    // Add last thinking if available
    if (lastThinking) {
      lines.push("**Last Thinking (truncated):**")
      lines.push(truncate(lastThinking, 300))
      lines.push("")
    }

    // Generate suggestion based on context
    lines.push("**Suggestion:**")
    if (lastOutput && lastOutput.length > 50) {
      lines.push(`Resume from "${node.description}" - there appears to be partial progress that can be continued.`)
    } else {
      lines.push(`Resume from "${node.description}" - restart this task with the context of completed work.`)
    }

    return lines.join("\n")
  }

  /**
   * Update status field in log file header
   */
  private updateStatusInLog(rootSessionId: string, status: string): void {
    const rootNode = this.sessions.get(rootSessionId)
    if (!rootNode) return

    const logPath = this.getLogPath(rootSessionId, rootNode.title)
    if (!existsSync(logPath)) return

    let content = readFileSync(logPath, "utf-8")
    content = content.replace(/- \*\*Status\*\*: \w+/, `- **Status**: ${status}`)

    if (status === "completed" || status === "interrupted") {
      content = content.replace(
        /(- \*\*Started\*\*: .+)/,
        `$1\n- **Completed**: ${formatDate(new Date())}`
      )
    }

    writeFileSync(logPath, content, "utf-8")
  }

  /**
   * Finalize root session (mark as completed)
   */
  finalizeRootSession(rootSessionId: string): void {
    const rootNode = this.sessions.get(rootSessionId)
    if (!rootNode || rootNode.status !== "running") return

    rootNode.status = "completed"
    this.updateStatusInLog(rootSessionId, "completed")

    // Append final summary
    const stats = this.calculateStats(rootSessionId)
    const summary = this.formatFinalSummary(stats)
    const logPath = this.getLogPath(rootSessionId, rootNode.title)
    appendFileSync(logPath, summary, "utf-8")

    // Clean up root session tracking
    this.rootSessions.delete(rootSessionId)

    // Clean up all sessions belonging to this root session tree
    this.cleanupSessions(rootSessionId)
  }

  /**
   * Clean up all sessions in the tree rooted at the given session
   * Called after root session is finalized or interrupted
   */
  private cleanupSessions(rootSessionId: string): void {
    // Find all sessions that belong to this root's tree
    const sessionsToDelete: string[] = [rootSessionId]

    // Find all descendants
    for (const [id, node] of this.sessions) {
      if (this.findRootSessionId(id) === rootSessionId && id !== rootSessionId) {
        sessionsToDelete.push(id)
      }
    }

    // Delete from memory
    for (const id of sessionsToDelete) {
      this.sessions.delete(id)
    }

    // Clean up log path cache (keep file path for reference, but clear from memory)
    this.logPaths.delete(rootSessionId)
  }

  /**
   * Calculate statistics for a root session
   */
  private calculateStats(rootSessionId: string): {
    totalNodes: number
    completedNodes: number
    totalDurationMs: number
    totalTokens: { input: number; output: number }
    maxDepth: number
  } {
    const stats = {
      totalNodes: 0,
      completedNodes: 0,
      totalDurationMs: 0,
      totalTokens: { input: 0, output: 0 },
      maxDepth: 0,
    }

    for (const [, node] of this.sessions) {
      stats.totalNodes++
      if (node.status === "completed") stats.completedNodes++
      if (node.depth !== null && node.depth > stats.maxDepth) {
        stats.maxDepth = node.depth
      }
      if (node.result) {
        stats.totalDurationMs += node.result.durationMs
        if (node.result.tokens) {
          stats.totalTokens.input += node.result.tokens.input
          stats.totalTokens.output += node.result.tokens.output
        }
      }
    }

    return stats
  }

  /**
   * Format final summary section
   */
  private formatFinalSummary(stats: {
    totalNodes: number
    completedNodes: number
    totalDurationMs: number
    totalTokens: { input: number; output: number }
    maxDepth: number
  }): string {
    const duration = Math.round(stats.totalDurationMs / 1000)
    const totalTokens = stats.totalTokens.input + stats.totalTokens.output

    return `
## Final Summary

- **Total Nodes**: ${stats.totalNodes}
- **Completed Nodes**: ${stats.completedNodes}
- **Max Depth**: ${stats.maxDepth}
- **Total Duration**: ${duration}s
- **Total Tokens**: ${totalTokens} (input: ${stats.totalTokens.input}, output: ${stats.totalTokens.output})
`
  }

  /**
   * Check if session is a root session
   */
  isRootSession(sessionId: string): boolean {
    return this.rootSessions.has(sessionId)
  }

  /**
   * Get session node by ID
   */
  getSession(sessionId: string): SessionNode | undefined {
    return this.sessions.get(sessionId)
  }
}

// ============================================================================
// Plugin Implementation
// ============================================================================

export const DelegationLoggerPlugin: Plugin = async ({ directory, client }) => {
  const manager = new MarkdownLogManager(directory)

  return {
    /**
     * Handle session lifecycle events
     */
    event: async ({ event }) => {
      // Track session creation
      if (event.type === "session.created") {
        const info = event.properties.info
        const parentId = info.parentID || null
        const title = info.title || ""

        // Parse DEPTH and description
        const adaptorDecl = parseAdaptorDeclaration(title)
        const depth = adaptorDecl?.depth ?? parseDepth(title)
        const description = adaptorDecl?.description ?? title

        // Extract agent type from title if present
        const agentMatch = title.match(/@(\w+)\s+subagent/)
        const agentType = agentMatch ? agentMatch[1] : "adaptorv4"

        manager.registerSession({
          id: info.id,
          parentId,
          title,
          agentType,
          depth,
          description,
        })

        await client.app.log({
          service: "delegation-logger",
          level: "info",
          message: `Session created: ${info.id} (depth=${depth ?? "N/A"}, parent=${parentId ?? "root"})`,
        })
      }

      // Handle session completion or interrupt
      if (event.type === "session.idle") {
        const sessionId = event.properties.sessionID
        const node = manager.getSession(sessionId)
        if (!node) return

        try {
          // Get session messages using the correct API
          // session.messages returns Array<{ info: Message; parts: Part[] }>
          const messages = await client.session.messages({ path: { id: sessionId } })
          if (!messages || messages.length === 0) return

          // Find last assistant message
          const lastAssistantData = [...messages]
            .reverse()
            .find((m) => m.info.role === "assistant")

          if (lastAssistantData) {
            const lastAssistant = lastAssistantData.info
            const parts = lastAssistantData.parts

            // Check for interrupt (AbortedError)
            const isInterrupted = lastAssistant.error?.name === "MessageAbortedError"

            if (isInterrupted) {
              // Extract last output and thinking from parts
              const textParts = parts
                ?.filter((p: any) => p.type === "text")
                .map((p: any) => p.text)
                .join("\n") || ""

              const reasoningParts = parts
                ?.filter((p: any) => p.type === "reasoning")
                .map((p: any) => p.text)
                .join("\n") || null

              await manager.handleInterrupt(sessionId, client, textParts, reasoningParts)

              await client.app.log({
                service: "delegation-logger",
                level: "warn",
                message: `Session interrupted: ${sessionId} - Interrupt report written to log`,
              })
            } else {
              // Normal completion
              const stepFinish = parts?.find((p: any) => p.type === "step-finish")

              manager.markCompleted(sessionId, {
                durationMs: Date.now() - node.startedAt,
                tokens: stepFinish?.tokens
                  ? {
                      input: stepFinish.tokens.input || 0,
                      output: stepFinish.tokens.output || 0,
                    }
                  : undefined,
                outputSummary: truncate(
                  parts
                    ?.filter((p: any) => p.type === "text")
                    .map((p: any) => p.text)
                    .join("\n") || "",
                  OUTPUT_SUMMARY_LENGTH
                ),
              })

              // Finalize root session
              if (manager.isRootSession(sessionId)) {
                manager.finalizeRootSession(sessionId)

                await client.app.log({
                  service: "delegation-logger",
                  level: "info",
                  message: `Root session completed: ${sessionId}`,
                })
              }
            }
          }
        } catch (err) {
          await client.app.log({
            service: "delegation-logger",
            level: "error",
            message: `Failed to process session.idle for ${sessionId}: ${err}`,
          })
        }
      }
    },

    /**
     * Track task tool executions
     * Use tool.execute.before to capture args, then tool.execute.after to log
     */
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "task") return

      // Store args for use in tool.execute.after
      // output.args contains the tool arguments
      const args = output.args as {
        subagent_type?: string
        description?: string
        prompt?: string
      } | undefined

      if (args) {
        taskArgsCache.set(input.callID, args)
      }
    },

    "tool.execute.after": async (input) => {
      if (input.tool !== "task") return

      // Retrieve args stored by tool.execute.before
      const args = taskArgsCache.get(input.callID)
      if (!args) return

      // Clean up cache
      taskArgsCache.delete(input.callID)

      const depth = parseDepth(args.prompt || "")

      await client.app.log({
        service: "delegation-logger",
        level: "info",
        message: `Task delegated: ${args.description} (depth=${depth ?? "N/A"}, agent=${args.subagent_type})`,
      })
    },
  }
}