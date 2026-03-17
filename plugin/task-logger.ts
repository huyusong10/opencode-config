import type { Plugin, PluginInput } from "@opencode-ai/plugin"
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "fs"
import { join } from "path"

type LogType =
  | "session_start"
  | "session_end"
  | "task_start"
  | "task_complete"
  | "test_run"
  | "commit"
  | "error"

interface TaskCompleteData {
  lines_added: number
  lines_deleted: number
  commits: GitCommitInfo[]
  status: "pass" | "fail"
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
}

// Fix #9: Record<string, unknown> instead of Record<string, never>
type LogData = Record<string, unknown> | TaskCompleteData | TestRunData | CommitData | ErrorData

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

// Session-scoped state: tracks active task context and whether any error
// occurred during that task (used to derive task_complete status)
const MAX_SESSIONS = 100
const sessionStates = new Map<string, {
  activeTask: string
  activePhase: string
  activePlan: string
  taskHadError: boolean  // Fix #3: track errors to derive meaningful status
}>()

function getSessionState(sessionId: string) {
  if (sessionStates.size >= MAX_SESSIONS) {
    const oldestKey = sessionStates.keys().next().value
    if (oldestKey) sessionStates.delete(oldestKey)
  }
  let state = sessionStates.get(sessionId)
  if (!state) {
    state = { activeTask: "", activePhase: "", activePlan: "", taskHadError: false }
    sessionStates.set(sessionId, state)
  }
  return state
}

function cleanupSessionState(sessionId: string) {
  sessionStates.delete(sessionId)
}

// Fix #1: use --numstat for exact added/deleted counts (--stat truncates to terminal width)
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

// Fix #4: use NUL byte as separator so commit messages with special chars parse correctly
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

// Fix #2: only split on the first colon so values containing ":" are preserved
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

export const TaskLoggerPlugin: Plugin = async (ctx) => {
  // Fix #8: create stable directories once at init; only session dirs are created on demand
  const logsDir = join(ctx.directory, ".log")
  mkdirSync(join(logsDir, "daily"), { recursive: true })
  mkdirSync(join(logsDir, "tasks"), { recursive: true })

  function writeLog(entry: LogEntry) {
    // Session directory is dynamic — create on first write for that session
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

  // Shared helper: flush the active task as task_complete then clear state
  async function flushActiveTask(sid: string, state: ReturnType<typeof getSessionState>) {
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
        status: state.taskHadError ? "fail" : "pass",  // Fix #3
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

        // Fix #7: flush any active task before the session ends
        await flushActiveTask(sid, state)

        cleanupSessionState(sid)
        writeLog({ ts: new Date().toISOString(), type: "session_end", session: sid, data: {} })
      }
    },

    "tool.execute.after": async (input, output) => {
      const sid = input.sessionID || "unknown"
      const state = getSessionState(sid)
      const tool = input.tool?.toLowerCase()

      // Track task transitions via any STATE.md write
      if (tool === "write" || tool === "edit") {
        const args = output?.args as any
        const p = args?.filePath || args?.path || args?.file_path
        if (p && p.endsWith("STATE.md")) {
          const absPath = p.startsWith("/") ? p : join(ctx.directory, p)
          const parsed = parseStateFile(absPath)
          if (parsed) {
            const { activeTask, activePhase, activePlan } = state

            if (activeTask && activeTask !== parsed.task) {
              await flushActiveTask(sid, state)
            }

            if (parsed.task && activeTask !== parsed.task) {
              state.taskHadError = false  // reset error flag for new task
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

      // Track bash commands: git commits and test runs
      // Fix #5: commands tracked here are NOT re-logged as generic errors below
      let bashHandled = false
      if (tool === "bash") {
        const args = output?.args as any
        const cmd = args?.command || ""

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

      // Log unexpected errors; skip if already captured by a specific handler above
      if (output?.error && !bashHandled) {
        state.taskHadError = true  // Fix #3: mark task as failed
        writeLog({
          ts: new Date().toISOString(),
          type: "error",
          session: sid,
          task: state.activeTask,
          data: { error: String(output.error) }
        })
      }
    }
  }
}

export default TaskLoggerPlugin
