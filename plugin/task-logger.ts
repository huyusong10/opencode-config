import type { Plugin, PluginInput } from "@opencode-ai/plugin"
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "fs"
import { join } from "path"

type LogType =
  | "session_start"
  | "session_end"
  | "task_start"
  | "task_complete"
  | "subagent_spawn"
  | "test_run"
  | "commit"
  | "error"

interface TaskCompleteData {
  lines_added: number
  lines_deleted: number
  commits: GitCommitInfo[]
  status: "pass" | "fail"
}

interface SubagentSpawnData {
  subagent: string       // e.g. "coder", "tester", "debugger"
  description: string   // truncated task description (≤120 chars)
}

interface SessionEndData {
  tool_budget: Record<string, number>  // { bash: 42, read: 18, ... }
  errors_suppressed: number            // errors throttled during session
}

interface TestRunData {
  command: string
  success: boolean
}

interface CommitData {
  command: string
  output?: string
}

interface ErrorData {
  error: string
  count: number  // how many times this signature occurred (1 = first time)
}

type LogData =
  | Record<string, unknown>
  | TaskCompleteData
  | SubagentSpawnData
  | SessionEndData
  | TestRunData
  | CommitData
  | ErrorData

interface LogEntry {
  ts: string
  type: LogType
  session: string
  phase?: string
  plan?: string
  task?: string
  agent?: string
  data: LogData
}

interface GitCommitInfo {
  hash: string
  message: string
  author: string
  timestamp: string
}

interface GitDiffStats {
  files_changed: string[]
  lines_added: number
  lines_deleted: number
}

// Error throttle: max logged occurrences per unique error signature per session
const ERROR_LOG_LIMIT = 3

interface SessionState {
  activeTask: string
  activePhase: string
  activePlan: string
  taskHadError: boolean
  // tool_budget: counts every tool call for the session-end summary
  toolBudget: Record<string, number>
  // error throttle: signature -> times logged
  errorCounts: Map<string, number>
  // total errors suppressed (for session_end reporting)
  errorsSuppressed: number
}

const MAX_SESSIONS = 100
const sessionStates = new Map<string, SessionState>()

function getSessionState(sessionId: string): SessionState {
  if (sessionStates.size >= MAX_SESSIONS) {
    const oldestKey = sessionStates.keys().next().value
    if (oldestKey) sessionStates.delete(oldestKey)
  }
  let state = sessionStates.get(sessionId)
  if (!state) {
    state = {
      activeTask: "",
      activePhase: "",
      activePlan: "",
      taskHadError: false,
      toolBudget: {},
      errorCounts: new Map(),
      errorsSuppressed: 0,
    }
    sessionStates.set(sessionId, state)
  }
  return state
}

function cleanupSessionState(sessionId: string) {
  sessionStates.delete(sessionId)
}

// Returns true if this error should be logged; false if throttled
function shouldLogError(state: SessionState, errorMsg: string): boolean {
  // Signature = first non-empty line, capped at 80 chars
  const sig = errorMsg.split("\n").find(l => l.trim()) ?? errorMsg
  const key = sig.slice(0, 80)
  const count = (state.errorCounts.get(key) ?? 0) + 1
  state.errorCounts.set(key, count)
  if (count > ERROR_LOG_LIMIT) {
    state.errorsSuppressed++
    return false
  }
  return true
}

async function getGitDiffStats(ctx: PluginInput): Promise<GitDiffStats> {
  try {
    const result = await ctx.$`git diff --numstat HEAD~1`
    const output = result.stdout.trim()
    if (!output) return { files_changed: [], lines_added: 0, lines_deleted: 0 }

    const filesChanged: string[] = []
    let linesAdded = 0
    let linesDeleted = 0
    for (const line of output.split("\n")) {
      const parts = line.split("\t")
      if (parts.length >= 3) {
        linesAdded += parseInt(parts[0] || "0", 10) || 0
        linesDeleted += parseInt(parts[1] || "0", 10) || 0
        filesChanged.push(parts[2].trim())
      }
    }
    return { files_changed: filesChanged, lines_added: linesAdded, lines_deleted: linesDeleted }
  } catch (err) {
    console.error(`[task-logger] Failed to get git diff stats: ${err}`)
    return { files_changed: [], lines_added: 0, lines_deleted: 0 }
  }
}

async function getGitCommits(ctx: PluginInput, limit: number = 5): Promise<GitCommitInfo[]> {
  try {
    const result = await ctx.$`git log --pretty=format:"%H%x00%s%x00%an%x00%aI" -n ${limit}`
    const output = result.stdout.trim()
    if (!output) return []
    return output.split("\n").map(line => {
      const parts = line.split("\x00")
      return {
        hash: parts[0] || "",
        message: parts[1] || "",
        author: parts[2] || "",
        timestamp: parts[3] || "",
      }
    })
  } catch (err) {
    console.error(`[task-logger] Failed to get git commits: ${err}`)
    return []
  }
}

function parseStateFile(filePath: string) {
  if (!existsSync(filePath)) return null
  try {
    const content = readFileSync(filePath, "utf-8")
    let phase = ""
    let plan = ""
    let task = ""
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      const colonIdx = trimmed.indexOf(":")
      if (colonIdx === -1) continue
      const key = trimmed.slice(0, colonIdx).trim()
      const value = trimmed.slice(colonIdx + 1).trim()
      if (key === "阶段" || key === "current_phase") phase = value || phase
      if (key === "计划" || key === "current_plan") plan = value || plan
      if (key === "任务" || key === "current_task") task = value || task
    }
    return { phase, plan, task }
  } catch (err) {
    console.error(`[task-logger] Failed to parse state file: ${err}`)
    return null
  }
}

// Extract subagent name from a task tool command string.
// The task tool is typically called with text like "@coder\n\n## Task\n..."
function extractSubagent(command: string): string {
  const match = command.match(/@(\w+)/)
  return match ? match[1].toLowerCase() : "unknown"
}

// Truncate a multi-line command to a single meaningful description line
function extractDescription(command: string): string {
  const lines = command.split("\n").map(l => l.trim()).filter(Boolean)
  // Skip the @subagent line itself, take the next meaningful line
  const descLine = lines.find(l => !l.startsWith("@") && !l.startsWith("#")) ?? lines[1] ?? ""
  return descLine.slice(0, 120)
}

export const TaskLoggerPlugin: Plugin = async (ctx) => {
  const logsDir = join(ctx.directory, ".log")
  mkdirSync(join(logsDir, "daily"), { recursive: true })
  mkdirSync(join(logsDir, "tasks"), { recursive: true })

  function writeLog(entry: LogEntry) {
    const sessionDir = join(logsDir, "sessions", entry.session)
    if (!existsSync(sessionDir)) mkdirSync(sessionDir, { recursive: true })

    const dateStr = new Date().toISOString().split("T")[0]
    const line = JSON.stringify(entry) + "\n"
    const sessionPrefix = entry.session.slice(0, 8)

    const targets: [string, string][] = [
      ["daily", join(logsDir, "daily", `${dateStr}-${sessionPrefix}.jsonl`)],
      ["session", join(sessionDir, `${entry.agent || "default"}.jsonl`)],
    ]
    if (entry.phase && entry.plan) {
      targets.push(["task", join(logsDir, "tasks", `${entry.phase}-${entry.plan}.jsonl`)])
    }

    for (const [label, path] of targets) {
      try {
        appendFileSync(path, line)
      } catch (err) {
        console.error(`[task-logger] Failed to write ${label} log to ${path}: ${err}`)
      }
    }
  }

  async function flushActiveTask(sid: string, state: SessionState) {
    if (!state.activeTask) return
    const gitStats = await getGitDiffStats(ctx)
    const commits = await getGitCommits(ctx, 3)
    writeLog({
      ts: new Date().toISOString(),
      type: "task_complete",
      session: sid,
      phase: state.activePhase,
      plan: state.activePlan,
      task: state.activeTask,
      data: {
        lines_added: gitStats.lines_added,
        lines_deleted: gitStats.lines_deleted,
        commits,
        status: state.taskHadError ? "fail" : "pass",
      }
    })
  }

  return {
    event: async ({ event }) => {
      if (event.type === "session.created") {
        const props = event.properties as any
        const sid = props?.info?.id || "unknown"
        writeLog({ ts: new Date().toISOString(), type: "session_start", session: sid, data: {} })

      } else if (event.type === "session.deleted") {
        const props = event.properties as any
        const sid = props?.info?.id || "unknown"
        const state = getSessionState(sid)

        await flushActiveTask(sid, state)

        // Write session_end with accumulated tool_budget summary
        writeLog({
          ts: new Date().toISOString(),
          type: "session_end",
          session: sid,
          data: {
            tool_budget: state.toolBudget,
            errors_suppressed: state.errorsSuppressed,
          } satisfies SessionEndData
        })

        cleanupSessionState(sid)
      }
    },

    "tool.execute.after": async (input, output) => {
      const sid = input.sessionID || "unknown"
      const state = getSessionState(sid)
      const tool = input.tool?.toLowerCase() ?? ""

      // Always accumulate tool call counts for session_end summary
      state.toolBudget[tool] = (state.toolBudget[tool] ?? 0) + 1

      // Track task transitions via any STATE.md write
      if (tool === "write" || tool === "edit") {
        const args = output?.args as any
        const p = args?.filePath || args?.path || args?.file_path
        if (p && p.endsWith("STATE.md")) {
          const absPath = p.startsWith("/") ? p : join(ctx.directory, p)
          const parsed = parseStateFile(absPath)
          if (parsed) {
            if (state.activeTask && state.activeTask !== parsed.task) {
              await flushActiveTask(sid, state)
            }
            if (parsed.task && state.activeTask !== parsed.task) {
              state.taskHadError = false
              writeLog({
                ts: new Date().toISOString(),
                type: "task_start",
                session: sid,
                phase: parsed.phase,
                plan: parsed.plan,
                task: parsed.task,
                data: {}
              })
            }
            state.activePhase = parsed.phase
            state.activePlan = parsed.plan
            state.activeTask = parsed.task
          }
        }
      }

      // Track subagent spawns via the task tool
      if (tool === "task") {
        const args = output?.args as any
        const command: string = args?.description || args?.content || args?.text || ""
        if (command) {
          writeLog({
            ts: new Date().toISOString(),
            type: "subagent_spawn",
            session: sid,
            phase: state.activePhase,
            plan: state.activePlan,
            task: state.activeTask,
            data: {
              subagent: extractSubagent(command),
              description: extractDescription(command),
            } satisfies SubagentSpawnData
          })
        }
      }

      // Track bash commands: git commits and test runs
      let bashHandled = false
      if (tool === "bash") {
        const args = output?.args as any
        const cmd: string = args?.command || ""

        if (cmd.includes("git commit")) {
          writeLog({
            ts: new Date().toISOString(),
            type: "commit",
            session: sid,
            task: state.activeTask,
            data: { command: cmd, output: output?.output }
          })
          bashHandled = true
        }

        if (cmd.includes("npm test") || cmd.includes("vitest") || cmd.includes("jest")) {
          writeLog({
            ts: new Date().toISOString(),
            type: "test_run",
            session: sid,
            task: state.activeTask,
            data: { command: cmd, success: !output.error }
          })
          bashHandled = true
        }
      }

      // Log errors not already captured by a specific handler above.
      // Throttle repeated identical errors to prevent log bloat.
      if (output?.error && !bashHandled) {
        const errorMsg = String(output.error)
        if (shouldLogError(state, errorMsg)) {
          const sig = errorMsg.split("\n").find(l => l.trim()) ?? errorMsg
          const timesLogged = state.errorCounts.get(sig.slice(0, 80)) ?? 1
          state.taskHadError = true
          writeLog({
            ts: new Date().toISOString(),
            type: "error",
            session: sid,
            task: state.activeTask,
            data: { error: errorMsg, count: timesLogged } satisfies ErrorData
          })
        }
      }
    }
  }
}

export default TaskLoggerPlugin
