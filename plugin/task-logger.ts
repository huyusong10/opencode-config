import type { Plugin, Hooks, PluginInput } from "@opencode-ai/plugin"
import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync } from "fs"
import { basename, dirname, extname, join } from "path"

type LogType =
  | "session_start"
  | "session_end"
  | "task_start"
  | "task_complete"
  | "test_run"
  | "commit"
  | "hook_block"
  | "hook_pass"
  | "error"

interface LogEntry {
  ts: string
  type: LogType
  session: string
  phase?: string
  plan?: string
  task?: string
  agent?: string
  data: any
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

// Global states to track transitions
const activeTask = new Map<string, string>();
const activePhase = new Map<string, string>();
const activePlan = new Map<string, string>();

async function getGitDiffStats(ctx: PluginInput, sinceCommit?: string): Promise<GitDiffStats> {
  try {
    const baseRef = sinceCommit || "HEAD~1"
    const result = await ctx.$`git diff --stat ${baseRef}`
    const output = result.stdout.trim()

    if (!output) {
      return { files_changed: [], lines_added: 0, lines_deleted: 0 }
    }

    const lines = output.split("\n")
    const filesChanged: string[] = []
    let linesAdded = 0
    let linesDeleted = 0

    for (const line of lines) {
      const fileMatch = line.match(/^\s*(.+?)\s*\|\s*(\d+)\s*([+-]+)/)
      if (fileMatch) {
        filesChanged.push(fileMatch[1].trim())
        const changeStr = fileMatch[3] || ""
        linesAdded += (changeStr.match(/\+/g) || []).length
        linesDeleted += (changeStr.match(/-/g) || []).length
      }
    }

    return { files_changed: filesChanged, lines_added: linesAdded, lines_deleted: linesDeleted }
  } catch {
    return { files_changed: [], lines_added: 0, lines_deleted: 0 }
  }
}

async function getGitCommits(ctx: PluginInput, limit: number = 5): Promise<GitCommitInfo[]> {
  try {
    const result = await ctx.$`git log --pretty=format:"%H|_%s|_%an|_%aI" -n ${limit}`
    const output = result.stdout.trim()

    if (!output) return []

    return output.split("\n").map(line => {
      const parts = line.split("|_")
      return {
        hash: parts[0] || "",
        message: parts[1] || "",
        author: parts[2] || "",
        timestamp: parts[3] || "",
      }
    })
  } catch {
    return []
  }
}

function parseStateFile(ctx: PluginInput) {
  const statePath = join(ctx.directory, ".planning", "STATE.md")
  if (!existsSync(statePath)) return null

  try {
    const content = readFileSync(statePath, "utf-8")
    let phase = ""
    let plan = ""
    let task = ""

    const lines = content.split("\n")
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith("阶段:") || trimmed.includes("current_phase:")) {
        phase = trimmed.split(":").pop()?.trim() || phase
      }
      if (trimmed.startsWith("计划:") || trimmed.includes("current_plan:")) {
        plan = trimmed.split(":").pop()?.trim() || plan
      }
      if (trimmed.startsWith("任务:") || trimmed.includes("current_task:")) {
        task = trimmed.split(":").pop()?.trim() || task
      }
    }

    return { phase, plan, task }
  } catch {
    return null
  }
}

function writeLog(ctx: PluginInput, entry: LogEntry) {
  const planningDir = join(ctx.directory, ".planning")
  const logsDir = join(planningDir, ".logs")
  const dailyDir = join(logsDir, "daily")
  const sessionDir = join(logsDir, "sessions", entry.session)
  const taskDir = join(logsDir, "tasks")

  if (!existsSync(dailyDir)) mkdirSync(dailyDir, { recursive: true })
  if (!existsSync(sessionDir)) mkdirSync(sessionDir, { recursive: true })
  if (!existsSync(taskDir)) mkdirSync(taskDir, { recursive: true })

  const dateStr = new Date().toISOString().split("T")[0]
  const line = JSON.stringify(entry) + "\n"

  try {
    appendFileSync(join(dailyDir, `${dateStr}.jsonl`), line)
    appendFileSync(join(sessionDir, `${entry.agent || "maker"}.jsonl`), line)
    if (entry.phase && entry.plan) {
      appendFileSync(join(taskDir, `${entry.phase}-${entry.plan}.jsonl`), line)
    }
  } catch {
    // silently fail logging if fs error
  }
}

export const TaskLoggerPlugin: Plugin = async (ctx) => {
  return {
    event: async ({ event }) => {
      if (event.type === "session.created") {
        const props = event.properties as any
        const sid = props?.info?.id || "unknown"
        writeLog(ctx, {
          ts: new Date().toISOString(),
          type: "session_start",
          session: sid,
          data: {}
        })
      } else if (event.type === "session.deleted") {
        const props = event.properties as any
        const sid = props?.info?.id || "unknown"
        writeLog(ctx, {
          ts: new Date().toISOString(),
          type: "session_end",
          session: sid,
          data: {}
        })
      }
    },

    "tool.execute.after": async (input, output) => {
      const sid = input.sessionID || "unknown"
      const tool = input.tool?.toLowerCase()
      
      // Auto-track state transitions by diffing STATE.md reads
      if (tool === "write" || tool === "edit") {
        const args = output?.args as any
        const p = args?.filePath || args?.path || args?.file_path
        if (p && p.endsWith("STATE.md")) {
          const state = parseStateFile(ctx)
          if (state) {
            const currentPhase = activePhase.get(sid)
            const currentPlan = activePlan.get(sid)
            const currentTask = activeTask.get(sid)

            // If task changed or is new, complete old and start new
            if (currentTask && currentTask !== state.task) {
              const gitStats = await getGitDiffStats(ctx)
              const commits = await getGitCommits(ctx, 3)

              writeLog(ctx, {
                ts: new Date().toISOString(),
                type: "task_complete",
                session: sid,
                agent: "maker",
                phase: currentPhase,
                plan: currentPlan,
                task: currentTask,
                data: {
                  lines_added: gitStats.lines_added,
                  lines_deleted: gitStats.lines_deleted,
                  commits,
                  status: "pass"
                }
              })
            }

            if (state.task && currentTask !== state.task) {
              writeLog(ctx, {
                ts: new Date().toISOString(),
                type: "task_start",
                session: sid,
                agent: "maker",
                phase: state.phase,
                plan: state.plan,
                task: state.task,
                data: {}
              })
            }

            activePhase.set(sid, state.phase)
            activePlan.set(sid, state.plan)
            activeTask.set(sid, state.task)
          }
        }
      }

      // Auto-track bash commands: tests and commits
      if (tool === "bash") {
        const args = output?.args as any
        const cmd = args?.command || ""
        if (cmd.includes("git commit")) {
          writeLog(ctx, {
            ts: new Date().toISOString(),
            type: "commit",
            session: sid,
            task: activeTask.get(sid),
            data: { command: cmd, output: output?.output }
          })
        }
        if (cmd.includes("npm test") || cmd.includes("vitest") || cmd.includes("jest")) {
          writeLog(ctx, {
            ts: new Date().toISOString(),
            type: "test_run",
            session: sid,
            task: activeTask.get(sid),
            data: { command: cmd, success: !output.error }
          })
        }
      }

      if (output?.error) {
        writeLog(ctx, {
          ts: new Date().toISOString(),
          type: "error",
          session: sid,
          task: activeTask.get(sid),
          data: { error: String(output.error) }
        })
      }
    }
  }
}

export default TaskLoggerPlugin;
