import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { parse as parseYaml } from "yaml"

/**
 * Deep Explore Guide Plugin
 *
 * Injects guidance prompts when tool operations fail,
 * encouraging deeper investigation rather than skipping errors.
 *
 * Philosophy: Guide, don't force. Let AI decide the action.
 *
 * Configuration: plugin/deep-explore-prompts.yaml
 */

// ============================================================================
// Types
// ============================================================================

interface FailureGuidanceConfig {
  template: string
  threshold?: number
}

interface SuccessGuidanceConfig {
  enabled: boolean
  tools: string[]
  template: string
}

interface DebuggerHintConfig {
  enabled: boolean
  verification_patterns: string[]
  template: string
}

interface Config {
  max_injections: number
  first_failure: FailureGuidanceConfig
  multiple_failures: FailureGuidanceConfig
  repetition: FailureGuidanceConfig
  tool_tips: Record<string, string>
  success_guidance: SuccessGuidanceConfig
  debugger_hint: DebuggerHintConfig
}

interface FailureRecord {
  tool: string
  signature: string
  count: number
}

interface SessionState {
  failures: Map<string, FailureRecord>
  injections: number
}

// ============================================================================
// Session State Management
// ============================================================================

const MAX_SESSIONS = 100 // Prevent unbounded memory growth
const sessions = new Map<string, SessionState>()

function getSession(sessionId: string): SessionState {
  if (sessions.size >= MAX_SESSIONS) {
    const oldestKey = sessions.keys().next().value
    if (oldestKey) sessions.delete(oldestKey)
  }
  let state = sessions.get(sessionId)
  if (!state) {
    state = { failures: new Map(), injections: 0 }
    sessions.set(sessionId, state)
  }
  return state
}

function cleanupSession(sessionId: string): void {
  sessions.delete(sessionId)
}

// ============================================================================
// Configuration Loading
// ============================================================================

function defaultConfig(): Config {
  return {
    max_injections: 0,
    first_failure: {
      template: `
---
## Investigate Before Retrying

The operation failed. DO NOT immediately retry.

1. Understand what went wrong
2. Verify your assumptions
3. Form a hypothesis
4. Test before fixing
---
`,
    },
    multiple_failures: {
      threshold: 2,
      template: `
---
## Multiple Failures

This operation has failed multiple times.

You may be missing something fundamental.
---
`,
    },
    repetition: {
      threshold: 3,
      template: `
---
## Repeated Failure

Same error occurred multiple times.

Stop and reconsider your approach.
---
`,
    },
    tool_tips: {
      default: "Read the error carefully and check assumptions.",
    },
    success_guidance: {
      enabled: false,
      tools: [],
      template: "",
    },
    debugger_hint: {
      enabled: true,
      verification_patterns: [],
      template: "",
    },
  }
}

function loadConfig(pluginDir: string): Config {
  const configPath = join(pluginDir, "deep-explore-prompts.yaml")

  if (!existsSync(configPath)) {
    return defaultConfig()
  }

  try {
    const content = readFileSync(configPath, "utf-8")
    const parsed = parseYaml(content)

    // Merge with defaults to ensure all fields exist
    return {
      ...defaultConfig(),
      ...parsed,
    }
  } catch (error) {
    console.error("[deep-explore-guide] Failed to load config:", error)
    return defaultConfig()
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function getErrorSignature(error: string): string {
  // Extract first meaningful line as signature
  const lines = error.split("\n").filter((l) => l.trim())
  if (lines.length === 0) return "unknown"
  return lines[0].slice(0, 80)
}

function isVerificationCommand(command: string, patterns: string[]): boolean {
  const cmd = command.toLowerCase()
  return patterns.some((p) => cmd.includes(p.toLowerCase()))
}

function renderTemplate(
  template: string,
  params: Record<string, string>
): string {
  return Object.entries(params).reduce(
    (t, [k, v]) => t.replace(new RegExp(`\\{${k}\\}`, "g"), v),
    template
  )
}

// ============================================================================
// Plugin Implementation
// ============================================================================

export const DeepExploreGuidePlugin: Plugin = async ({ directory, client }) => {
  // Determine plugin directory
  // The plugin file is in plugin/ directory, config is in same directory
  const pluginDir = join(directory, "plugin")

  // Load configuration
  const config = loadConfig(pluginDir)

  console.log("[deep-explore-guide] Plugin initialized")

  return {
    "tool.execute.after": async (input, output) => {
      const sessionId = input.sessionID || "unknown"
      const tool = input.tool?.toLowerCase() || "unknown"
      const state = getSession(sessionId)

      // Check injection limit
      if (config.max_injections > 0 && state.injections >= config.max_injections) {
        return
      }

      let template = ""
      const params: Record<string, string> = { tool }

      // Handle failure case
      if (output.error) {
        const errorStr = String(output.error)
        const signature = getErrorSignature(errorStr)
        const key = `${tool}:${signature}`

        // Update failure record
        const record = state.failures.get(key) || {
          tool,
          signature,
          count: 0,
        }
        record.count++
        state.failures.set(key, record)

        params.count = String(record.count)
        params.tool_tips = config.tool_tips[tool] || config.tool_tips.default || ""

        // Select template based on failure pattern
        const repetitionThreshold = config.repetition.threshold || 3
        const multipleThreshold = config.multiple_failures.threshold || 2

        if (record.count >= repetitionThreshold) {
          template = config.repetition.template
        } else if (record.count >= multipleThreshold) {
          template = config.multiple_failures.template
        } else {
          template = config.first_failure.template
        }

        // Add debugger hint for verification commands
        if (
          config.debugger_hint.enabled &&
          tool === "bash" &&
          output.args?.command
        ) {
          const cmd = String(output.args.command)
          if (isVerificationCommand(cmd, config.debugger_hint.verification_patterns)) {
            template += "\n" + config.debugger_hint.template
          }
        }
      }
      // Handle success case (optional)
      else if (
        config.success_guidance.enabled &&
        config.success_guidance.tools.includes(tool)
      ) {
        template = config.success_guidance.template
      }

      // No template to inject
      if (!template) return

      // Render template with parameters
      const guidance = renderTemplate(template, params)

      // Inject guidance into session
      try {
        await client.session.prompt({
          id: sessionId,
          body: {
            noReply: false,
            parts: [{ type: "text", text: guidance }],
          },
        })

        state.injections++
      } catch (error) {
        console.error("[deep-explore-guide] Failed to inject guidance:", error)
      }
    },

    // Cleanup on session deletion
    event: async ({ event }) => {
      if (event.type === "session.deleted") {
        const props = event.properties as { info?: { id?: string } } | undefined
        const sessionId = props?.info?.id
        if (sessionId) {
          cleanupSession(sessionId)
        }
      }
    },
  }
}

export default DeepExploreGuidePlugin