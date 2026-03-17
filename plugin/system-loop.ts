import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from "fs"
import { join } from "path"

/**
 * System Loop Plugin
 *
 * Implements iterative development cycles through @system-engineer subagent.
 *
 * Workflow:
 * 1. Primary agent (Maestro/Architect/Maker) outputs <system-review-request>
 * 2. Plugin detects tag on session.idle event
 * 3. Plugin invokes @system-engineer subagent
 * 4. Plugin parses <system-feedback> output
 * 5. Based on decision: continue iteration or complete
 *
 * Configuration: plugin/system-loop-config.yaml
 *
 * Based on ralph.ts implementation pattern.
 */

// ============================================================================
// Types
// ============================================================================

interface MessagePart {
  type: string
  text?: string
}

interface Message {
  role: string
  parts?: MessagePart[]
}

interface Session {
  messages?: Message[]
}

interface SystemLoopClient {
  session: {
    get: (params: { id: string }) => Promise<Session>
    send: (params: { id: string; text: string }) => Promise<void>
  }
  app: {
    log: (params: { service: string; level: string; message: string }) => Promise<void>
  }
}

interface SystemLoopConfig {
  enabled: boolean
  max_iterations: number
  trigger_agents: string[]
  auto_trigger: boolean
  skip_tags: string[]
}

interface LoopState {
  active: boolean
  iteration: number
  maxIterations: number
  triggeredBy: string
  startedAt: string
  context: string
}

interface SystemAdvisory {
  content: string
  score: number
}

// ============================================================================
// Constants
// ============================================================================

const STATE_FILE = "system-loop.state.md"
const CONFIG_FILE = "system-loop-config.yaml"

const TAG_REVIEW_REQUEST = "<system-review-request>"
const TAG_REVIEW_REQUEST_END = "</system-review-request>"
const TAG_ADVISORY = "<system-advisory>"
const TAG_ADVISORY_END = "</system-advisory>"

// ============================================================================
// Configuration
// ============================================================================

function defaultConfig(): SystemLoopConfig {
  return {
    enabled: true,
    max_iterations: 3,
    trigger_agents: ["maestro", "architect", "maker"],
    auto_trigger: true,
    skip_tags: ["skip-system-review", "quick-fix", "docs-only", "minor-change"]
  }
}

function loadConfig(pluginDir: string): SystemLoopConfig {
  const configPath = join(pluginDir, CONFIG_FILE)

  if (!existsSync(configPath)) {
    return defaultConfig()
  }

  try {
    const content = readFileSync(configPath, "utf-8")
    const config = defaultConfig()

    const getValue = (key: string): string | null => {
      const match = content.match(new RegExp(`^${key}:\\s*(.*)$`, "m"))
      return match ? match[1].trim() : null
    }

    const enabled = getValue("enabled")
    if (enabled) config.enabled = enabled === "true"

    const maxIterations = getValue("max_iterations")
    if (maxIterations) config.max_iterations = parseInt(maxIterations, 10)

    const triggerAgents = getValue("trigger_agents")
    if (triggerAgents) {
      config.trigger_agents = triggerAgents
        .replace(/[\[\]]/g, "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    }

    const autoTrigger = getValue("auto_trigger")
    if (autoTrigger) config.auto_trigger = autoTrigger === "true"

    const skipTags = getValue("skip_tags")
    if (skipTags) {
      config.skip_tags = skipTags
        .replace(/[\[\]]/g, "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    }

    return config
  } catch (error) {
    console.error("[system-loop] Failed to load config:", error)
    return defaultConfig()
  }
}

// ============================================================================
// State Management
// ============================================================================

function parseLoopState(directory: string): LoopState | null {
  const statePath = join(directory, ".planning", STATE_FILE)

  if (!existsSync(statePath)) {
    return null
  }

  try {
    const content = readFileSync(statePath, "utf-8")
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    if (!frontmatterMatch) return null

    const [, frontmatter, context] = frontmatterMatch

    const getValue = (key: string): string | null => {
      const match = frontmatter.match(new RegExp(`^${key}:\\s*(.*)$`, "m"))
      return match ? match[1].replace(/^["'](.*)["']$/, "$1") : null
    }

    return {
      active: getValue("active") === "true",
      iteration: parseInt(getValue("iteration") || "1", 10),
      maxIterations: parseInt(getValue("max_iterations") || "3", 10),
      triggeredBy: getValue("triggered_by") || "unknown",
      startedAt: getValue("started_at") || new Date().toISOString(),
      context: context.trim()
    }
  } catch {
    return null
  }
}

function writeLoopState(directory: string, state: LoopState): void {
  const planningDir = join(directory, ".planning")
  const statePath = join(planningDir, STATE_FILE)

  if (!existsSync(planningDir)) {
    mkdirSync(planningDir, { recursive: true })
  }

  const content = `---
active: ${state.active}
iteration: ${state.iteration}
max_iterations: ${state.maxIterations}
triggered_by: "${state.triggeredBy}"
started_at: "${state.startedAt}"
---

${state.context}
`

  writeFileSync(statePath, content, "utf-8")
}

function deleteLoopState(directory: string): void {
  const statePath = join(directory, ".planning", STATE_FILE)
  if (existsSync(statePath)) {
    unlinkSync(statePath)
  }
}

// ============================================================================
// Tag Parsing
// ============================================================================

function extractReviewRequest(text: string): string | null {
  const startIdx = text.indexOf(TAG_REVIEW_REQUEST)
  const endIdx = text.indexOf(TAG_REVIEW_REQUEST_END)

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return null
  }

  return text
    .slice(startIdx + TAG_REVIEW_REQUEST.length, endIdx)
    .trim()
}

function parseSystemAdvisory(text: string): SystemAdvisory | null {
  const startIdx = text.indexOf(TAG_ADVISORY)
  const endIdx = text.indexOf(TAG_ADVISORY_END, startIdx)

  if (startIdx === -1 || endIdx === -1) return null

  const content = text.slice(startIdx, endIdx + TAG_ADVISORY_END.length)

  // Extract score
  const scoreMatch = content.match(/\*\*总分\*\*\s*\|\s*\|\s*\*\*([\d.]+)/)
  const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0

  return { content, score }
}

function hasSkipTag(text: string, skipTags: string[]): boolean {
  const lowerText = text.toLowerCase()
  return skipTags.some((tag) => lowerText.includes(tag.toLowerCase()))
}

// ============================================================================
// Plugin Implementation
// ============================================================================

export const SystemLoopPlugin: Plugin = async ({ directory, client }) => {
  const pluginDir = join(directory, "plugin")
  const config = loadConfig(pluginDir)

  console.log("[system-loop] Plugin initialized with config:", {
    enabled: config.enabled,
    max_iterations: config.max_iterations,
    trigger_agents: config.trigger_agents
  })

  return {
    /**
     * Handle session.idle event - triggers system engineer review
     */
    event: async ({ event }) => {
      if (event.type !== "session.idle") return
      if (!config.enabled) return

      const sessionId = event.properties.sessionID

      try {
        // Get the last assistant message
        const session: Session = await client.session.get({ id: sessionId })
        if (!session.messages || session.messages.length === 0) return

        const lastAssistantMsg = [...session.messages]
          .reverse()
          .find((m: Message) => m.role === "assistant")

        if (!lastAssistantMsg) return

        const textContent = lastAssistantMsg.parts
          ?.filter((p: MessagePart) => p.type === "text")
          .map((p: MessagePart) => p.text || "")
          .join("\n") || ""

        // Check for skip tags
        if (hasSkipTag(textContent, config.skip_tags)) {
          await client.app.log({
            service: "system-loop",
            level: "info",
            message: "Skipped due to skip tag detected"
          })
          return
        }

        // Check for review request tag (start of loop)
        const reviewContext = extractReviewRequest(textContent)

        if (reviewContext) {
          // Review request detected - trigger system engineer once
          const loopState: LoopState = {
            active: true,
            iteration: 1,
            maxIterations: 1,
            triggeredBy: "auto",
            startedAt: new Date().toISOString(),
            context: reviewContext
          }
          writeLoopState(directory, loopState)

          // Trigger system reviewer team for advisory review
          await triggerSystemReviewer(sessionId, reviewContext, client)
          return
        }

        // No review request - check if we're waiting for advisory
        const loopState = parseLoopState(directory)
        if (loopState && loopState.active) {
          // Check for system advisory
          const advisory = parseSystemAdvisory(textContent)
          if (advisory) {
            await handleAdvisory(sessionId, advisory, directory, client)
          }
        }

      } catch (error) {
        await client.app.log({
          service: "system-loop",
          level: "error",
          message: `Error in event handler: ${error}`
        })
      }
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function triggerSystemReviewer(
  sessionId: string,
  context: string,
  client: SystemLoopClient
): Promise<void> {
  const prompt = `@system-reviewer

## 系统评审请求

### 上下文
${context}

### 任务
请对以上工作进行系统级别的深度分析，并输出结构化的评审报告。

**注意：** 使用 \`<system-advisory>\` 格式输出建议报告。`

  await client.session.send({
    id: sessionId,
    text: prompt
  })

  await client.app.log({
    service: "system-loop",
    level: "info",
    message: "Triggered system-reviewer for advisory review"
  })
}

async function handleAdvisory(
  sessionId: string,
  advisory: SystemAdvisory,
  directory: string,
  client: SystemLoopClient
): Promise<void> {
  await client.app.log({
    service: "system-loop",
    level: "info",
    message: `Received advisory: score=${advisory.score}`
  })

  // Clean up state - advisory is one-shot, no loop
  deleteLoopState(directory)

  const summaryMsg = `[系统评审建议已收到]

**评分:** ${advisory.score}/5

以上为 @system-reviewer 评审团队的建议报告，供参考。如需根据建议进行改进，请自行决定。`

  await client.session.send({
    id: sessionId,
    text: summaryMsg
  })
}

export default SystemLoopPlugin