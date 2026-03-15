#!/usr/bin/env npx tsx
/**
 * Task Logger - Record task execution logs for retrospective analysis
 *
 * Usage:
 *   npx tsx scripts/task-logger.ts <command> [options]
 *
 * Commands:
 *   start       Record task start
 *   complete    Record task completion
 *   test        Record test run
 *   commit      Record git commit
 *   hook        Record hook event
 *   error       Record error
 *   summary     Generate session summary
 *
 * Options:
 *   --session <id>       Session ID (required)
 *   --phase <id>         Phase ID (e.g., 01-foundation)
 *   --plan <id>          Plan ID (e.g., 01-01)
 *   --task <name>        Task name
 *   --agent <name>       Agent name (architect|maker)
 *   --files <files>      Comma-separated file list
 *   --duration <ms>      Duration in milliseconds
 *   --status <status>    Status (pass|fail|blocked)
 *   --message <msg>      Additional message
 *   --commit <hash>      Commit hash
 *
 * Examples:
 *   npx tsx scripts/task-logger.ts start --session abc123 --phase 01-foundation --plan 01-01 --task "Task 1: Create types"
 *   npx tsx scripts/task-logger.ts complete --session abc123 --phase 01-foundation --plan 01-01 --task "Task 1" --files "src/types/auth.ts" --duration 300000
 *   npx tsx scripts/task-logger.ts hook --session abc123 --type blocked --message "TDD violation"
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { homedir } from "os"

// ============================================================================
// Types
// ============================================================================

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
  | "checkpoint"
  | "archive"

interface LogEntry {
  ts: string // ISO timestamp
  type: LogType
  session: string
  phase?: string
  plan?: string
  task?: string
  agent?: "architect" | "maker" | "coder" | "tester" | "debugger" | "reviewer"
  data: {
    files?: string[]
    duration_ms?: number
    status?: "pass" | "fail" | "blocked" | "pending"
    message?: string
    commit?: string
    test_file?: string
    test_passed?: number
    test_failed?: number
    hook?: string
    error?: string
    [key: string]: unknown
  }
}

interface SessionSummary {
  session_id: string
  started_at: string
  ended_at?: string
  agent: string
  phase?: string
  plan?: string
  tasks: {
    name: string
    started_at: string
    completed_at?: string
    duration_ms?: number
    status: string
    files: string[]
    commits: string[]
  }[]
  hooks_blocked: number
  hooks_passed: number
  errors: number
  total_duration_ms?: number
}

// ============================================================================
// Configuration
// ============================================================================

const PLANNING_DIR = process.env.PLANNING_DIR || join(process.cwd(), ".planning")
const LOGS_DIR = join(PLANNING_DIR, ".logs")
const SESSIONS_DIR = join(LOGS_DIR, "sessions")
const DAILY_DIR = join(LOGS_DIR, "daily")
const TASKS_DIR = join(LOGS_DIR, "tasks")

// ============================================================================
// Utilities
// ============================================================================

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function getTimestamp(): string {
  return new Date().toISOString()
}

function getDateString(): string {
  return new Date().toISOString().split("T")[0]
}

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith("--")) {
      const key = arg.slice(2)
      const value = args[i + 1]
      if (value && !value.startsWith("--")) {
        result[key] = value
        i++
      } else {
        result[key] = "true"
      }
    }
  }
  return result
}

function writeLogEntry(entry: LogEntry, paths: string[]): void {
  const line = JSON.stringify(entry) + "\n"

  for (const path of paths) {
    ensureDir(dirname(path))
    appendFileSync(path, line, "utf-8")
  }
}

// ============================================================================
// Log Writers
// ============================================================================

function logToSession(entry: LogEntry): void {
  const sessionFile = join(SESSIONS_DIR, entry.session, `${entry.agent || "maker"}.jsonl`)
  writeLogEntry(entry, [sessionFile])
}

function logToDaily(entry: LogEntry): void {
  const dailyFile = join(DAILY_DIR, `${getDateString()}.jsonl`)
  writeLogEntry(entry, [dailyFile])
}

function logToTask(entry: LogEntry): void {
  if (entry.phase && entry.plan) {
    const taskFile = join(TASKS_DIR, `${entry.phase}-${entry.plan}.jsonl`)
    writeLogEntry(entry, [taskFile])
  }
}

// ============================================================================
// Commands
// ============================================================================

function cmdStart(opts: Record<string, string>): void {
  const entry: LogEntry = {
    ts: getTimestamp(),
    type: "session_start",
    session: opts.session || "unknown",
    agent: (opts.agent as LogEntry["agent"]) || "maker",
    phase: opts.phase,
    plan: opts.plan,
    data: {
      message: opts.message,
    },
  }

  logToSession(entry)
  logToDaily(entry)

  console.log(JSON.stringify({ status: "logged", type: "session_start", session: entry.session }))
}

function cmdEnd(opts: Record<string, string>): void {
  const entry: LogEntry = {
    ts: getTimestamp(),
    type: "session_end",
    session: opts.session || "unknown",
    agent: (opts.agent as LogEntry["agent"]) || "maker",
    phase: opts.phase,
    plan: opts.plan,
    data: {
      duration_ms: opts.duration ? parseInt(opts.duration, 10) : undefined,
      message: opts.message,
    },
  }

  logToSession(entry)
  logToDaily(entry)

  console.log(JSON.stringify({ status: "logged", type: "session_end", session: entry.session }))
}

function cmdTaskStart(opts: Record<string, string>): void {
  const entry: LogEntry = {
    ts: getTimestamp(),
    type: "task_start",
    session: opts.session || "unknown",
    agent: (opts.agent as LogEntry["agent"]) || "maker",
    phase: opts.phase,
    plan: opts.plan,
    task: opts.task,
    data: {
      message: opts.message,
    },
  }

  logToSession(entry)
  logToDaily(entry)
  logToTask(entry)

  console.log(JSON.stringify({ status: "logged", type: "task_start", task: entry.task }))
}

function cmdTaskComplete(opts: Record<string, string>): void {
  const entry: LogEntry = {
    ts: getTimestamp(),
    type: "task_complete",
    session: opts.session || "unknown",
    agent: (opts.agent as LogEntry["agent"]) || "maker",
    phase: opts.phase,
    plan: opts.plan,
    task: opts.task,
    data: {
      files: opts.files ? opts.files.split(",").map(f => f.trim()) : undefined,
      duration_ms: opts.duration ? parseInt(opts.duration, 10) : undefined,
      status: (opts.status as LogEntry["data"]["status"]) || "pass",
      message: opts.message,
      commit: opts.commit,
    },
  }

  logToSession(entry)
  logToDaily(entry)
  logToTask(entry)

  console.log(JSON.stringify({ status: "logged", type: "task_complete", task: entry.task }))
}

function cmdTest(opts: Record<string, string>): void {
  const entry: LogEntry = {
    ts: getTimestamp(),
    type: "test_run",
    session: opts.session || "unknown",
    agent: (opts.agent as LogEntry["agent"]) || "tester",
    phase: opts.phase,
    plan: opts.plan,
    task: opts.task,
    data: {
      test_file: opts.files,
      status: (opts.status as LogEntry["data"]["status"]) || "pass",
      test_passed: opts.passed ? parseInt(opts.passed, 10) : undefined,
      test_failed: opts.failed ? parseInt(opts.failed, 10) : undefined,
      duration_ms: opts.duration ? parseInt(opts.duration, 10) : undefined,
      message: opts.message,
    },
  }

  logToSession(entry)
  logToDaily(entry)

  console.log(JSON.stringify({ status: "logged", type: "test_run", status: entry.data.status }))
}

function cmdCommit(opts: Record<string, string>): void {
  const entry: LogEntry = {
    ts: getTimestamp(),
    type: "commit",
    session: opts.session || "unknown",
    agent: (opts.agent as LogEntry["agent"]) || "maker",
    phase: opts.phase,
    plan: opts.plan,
    task: opts.task,
    data: {
      commit: opts.commit,
      files: opts.files ? opts.files.split(",").map(f => f.trim()) : undefined,
      message: opts.message,
    },
  }

  logToSession(entry)
  logToDaily(entry)
  logToTask(entry)

  console.log(JSON.stringify({ status: "logged", type: "commit", hash: opts.commit }))
}

function cmdHook(opts: Record<string, string>): void {
  const isBlocked = opts.status === "blocked" || opts.type === "blocked"

  const entry: LogEntry = {
    ts: getTimestamp(),
    type: isBlocked ? "hook_block" : "hook_pass",
    session: opts.session || "unknown",
    agent: (opts.agent as LogEntry["agent"]) || "maker",
    phase: opts.phase,
    plan: opts.plan,
    task: opts.task,
    data: {
      hook: opts.hook,
      status: isBlocked ? "blocked" : "pass",
      message: opts.message,
    },
  }

  logToSession(entry)
  logToDaily(entry)

  console.log(JSON.stringify({ status: "logged", type: entry.type, hook: opts.hook }))
}

function cmdError(opts: Record<string, string>): void {
  const entry: LogEntry = {
    ts: getTimestamp(),
    type: "error",
    session: opts.session || "unknown",
    agent: (opts.agent as LogEntry["agent"]) || "maker",
    phase: opts.phase,
    plan: opts.plan,
    task: opts.task,
    data: {
      error: opts.message,
      status: "fail",
    },
  }

  logToSession(entry)
  logToDaily(entry)

  console.log(JSON.stringify({ status: "logged", type: "error", error: opts.message }))
}

function cmdCheckpoint(opts: Record<string, string>): void {
  const entry: LogEntry = {
    ts: getTimestamp(),
    type: "checkpoint",
    session: opts.session || "unknown",
    agent: (opts.agent as LogEntry["agent"]) || "maker",
    phase: opts.phase,
    plan: opts.plan,
    task: opts.task,
    data: {
      status: (opts.status as LogEntry["data"]["status"]) || "pending",
      message: opts.message,
    },
  }

  logToSession(entry)
  logToDaily(entry)

  console.log(JSON.stringify({ status: "logged", type: "checkpoint" }))
}

function cmdArchive(opts: Record<string, string>): void {
  const entry: LogEntry = {
    ts: getTimestamp(),
    type: "archive",
    session: opts.session || "unknown",
    agent: (opts.agent as LogEntry["agent"]) || "maker",
    phase: opts.phase,
    plan: opts.plan,
    data: {
      files: opts.files ? opts.files.split(",").map(f => f.trim()) : undefined,
      message: opts.message,
    },
  }

  logToSession(entry)
  logToDaily(entry)

  console.log(JSON.stringify({ status: "logged", type: "archive", phase: opts.phase, plan: opts.plan }))
}

function cmdSummary(opts: Record<string, string>): void {
  const sessionId = opts.session
  if (!sessionId) {
    console.error("Error: --session is required for summary")
    process.exit(1)
  }

  const sessionDir = join(SESSIONS_DIR, sessionId)
  if (!existsSync(sessionDir)) {
    console.error(`Error: No logs found for session ${sessionId}`)
    process.exit(1)
  }

  // Read all log files for this session
  const summary: SessionSummary = {
    session_id: sessionId,
    started_at: "",
    agent: "maker",
    tasks: [],
    hooks_blocked: 0,
    hooks_passed: 0,
    errors: 0,
  }

  // Parse architect.jsonl and maker.jsonl
  const logFiles = ["architect.jsonl", "maker.jsonl"]
  const tasksMap = new Map<string, SessionSummary["tasks"][0]>()

  for (const logFile of logFiles) {
    const filePath = join(sessionDir, logFile)
    if (!existsSync(filePath)) continue

    const content = readFileSync(filePath, "utf-8")
    const lines = content.trim().split("\n")

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as LogEntry

        if (entry.type === "session_start") {
          summary.started_at = entry.ts
          summary.agent = entry.agent || "maker"
          summary.phase = entry.phase
          summary.plan = entry.plan
        }

        if (entry.type === "session_end") {
          summary.ended_at = entry.ts
          if (entry.data.duration_ms) {
            summary.total_duration_ms = entry.data.duration_ms
          }
        }

        if (entry.type === "task_start" && entry.task) {
          tasksMap.set(entry.task, {
            name: entry.task,
            started_at: entry.ts,
            status: "pending",
            files: [],
            commits: [],
          })
        }

        if (entry.type === "task_complete" && entry.task) {
          const task = tasksMap.get(entry.task)
          if (task) {
            task.completed_at = entry.ts
            task.status = entry.data.status || "pass"
            if (entry.data.files) task.files = entry.data.files
            if (entry.data.duration_ms) task.duration_ms = entry.data.duration_ms
          }
        }

        if (entry.type === "commit" && entry.task) {
          const task = tasksMap.get(entry.task)
          if (task && entry.data.commit) {
            task.commits.push(entry.data.commit)
          }
        }

        if (entry.type === "hook_block") {
          summary.hooks_blocked++
        }

        if (entry.type === "hook_pass") {
          summary.hooks_passed++
        }

        if (entry.type === "error") {
          summary.errors++
        }
      } catch {
        // Skip malformed lines
      }
    }
  }

  summary.tasks = Array.from(tasksMap.values())

  // Write summary
  const summaryPath = join(sessionDir, "summary.json")
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8")

  console.log(JSON.stringify(summary, null, 2))
}

function cmdHelp(): void {
  console.log(`
Task Logger - Record task execution logs

Usage:
  npx tsx scripts/task-logger.ts <command> [options]

Commands:
  start       Record session start
  end         Record session end
  task-start  Record task start
  complete    Record task completion
  test        Record test run
  commit      Record git commit
  hook        Record hook event
  error       Record error
  checkpoint  Record checkpoint
  archive     Record plan archive
  summary     Generate session summary

Options:
  --session <id>       Session ID
  --phase <id>         Phase ID
  --plan <id>          Plan ID
  --task <name>        Task name
  --agent <name>       Agent name
  --files <files>      Comma-separated files
  --duration <ms>      Duration in ms
  --status <status>    pass|fail|blocked
  --message <msg>      Message
  --commit <hash>      Commit hash
  --hook <name>        Hook name
  --passed <n>         Tests passed
  --failed <n>         Tests failed

Examples:
  npx tsx scripts/task-logger.ts start --session abc123 --agent maker
  npx tsx scripts/task-logger.ts task-start --session abc123 --phase 01-foundation --plan 01-01 --task "Task 1"
  npx tsx scripts/task-logger.ts complete --session abc123 --task "Task 1" --files "src/auth.ts" --duration 300000
  npx tsx scripts/task-logger.ts hook --session abc123 --hook test-first-guard --status blocked --message "Test not found"
  npx tsx scripts/task-logger.ts summary --session abc123
`)
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === "help" || args[0] === "--help") {
    cmdHelp()
    return
  }

  const command = args[0]
  const opts = parseArgs(args.slice(1))

  // Ensure log directories exist
  ensureDir(LOGS_DIR)
  ensureDir(SESSIONS_DIR)
  ensureDir(DAILY_DIR)
  ensureDir(TASKS_DIR)

  switch (command) {
    case "start":
    case "session-start":
      cmdStart(opts)
      break
    case "end":
    case "session-end":
      cmdEnd(opts)
      break
    case "task-start":
      cmdTaskStart(opts)
      break
    case "complete":
    case "task-complete":
      cmdTaskComplete(opts)
      break
    case "test":
      cmdTest(opts)
      break
    case "commit":
      cmdCommit(opts)
      break
    case "hook":
      cmdHook(opts)
      break
    case "error":
      cmdError(opts)
      break
    case "checkpoint":
      cmdCheckpoint(opts)
      break
    case "archive":
      cmdArchive(opts)
      break
    case "summary":
      cmdSummary(opts)
      break
    default:
      console.error(`Unknown command: ${command}`)
      cmdHelp()
      process.exit(1)
  }
}

main()