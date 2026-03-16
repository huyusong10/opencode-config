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

import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs"
import { dirname, join, extname, basename } from "path"

import { execSync } from "child_process"

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
  | "decision"

type DecisionType =
  | "create_test_file"
  | "create_source_file"
  | "create_config_file"
  | "create_documentation"
  | "modify_source_file"
  | "modify_test_file"
  | "modify_config_file"
  | "read_file"
  | "search_code"
  | "run_tests"
  | "run_linter"
  | "run_build"
  | "run_command"
  | "git_operation"
  | "create_todo"
  | "update_todo"
  | "spawn_agent"
  | "other"

type DecisionReason =
  | "tdd_write_test_first"
  | "tdd_implement_after_test"
  | "tdd_refactor"
  | "fix_failing_test"
  | "implement_feature"
  | "fix_bug"
  | "add_configuration"
  | "update_documentation"
  | "explore_codebase"
  | "understand_context"
  | "verify_implementation"
  | "run_quality_check"
  | "commit_changes"
  | "track_progress"
  | "delegate_task"
  | "unknown"

interface ViolationDetail {
  rule_id: string
  expected: string
  actual: string
  expected_path?: string
  actual_path?: string | null
}

interface ToolContext {
  tool: string
  operation: "create" | "modify" | "read" | "delete"
  target_file: string
  file_exists: boolean
  test_file_exists: boolean
  is_source_file: boolean
}

interface StateContext {
  execution_mode?: string
  current_status?: string
  plan_tasks_total?: number
  plan_tasks_completed?: number
}

interface FileStats {
  path: string
  lines: number
  size_bytes: number
  exists: boolean
}

interface GitDiffStats {
  files_changed: string[]
  lines_added: number
  lines_deleted: number
}

interface GitCommitInfo {
  hash: string
  message: string
  author: string
  timestamp: string
}

interface TaskChecklist {
  total: number
  completed: number
  items: Array<{ text: string; completed: boolean }>
}

interface LogEntry {
  ts: string
  type: LogType
  session: string
  phase?: string
  plan?: string
  task?: string
  agent?: "architect" | "maker" | "coder" | "tester" | "debugger" | "reviewer"
  rule?: string
  violation?: ViolationDetail
  tool_context?: ToolContext
  state_context?: StateContext
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
    // Enhanced fields
    lines_added?: number
    lines_deleted?: number
    files_created?: FileStats[]
    files_modified?: Array<{ path: string; lines_before: number; lines_after: number }>
    test_files?: string[]
    commits?: GitCommitInfo[]
    checklist?: TaskChecklist
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
    // Enhanced fields
    lines_added?: number
    lines_deleted?: number
    test_files?: string[]
    checklist_total?: number
    checklist_completed?: number
  }[]
  hooks_blocked: number
  hooks_passed: number
  errors: number
  total_duration_ms?: number
  // Enhanced summary
  total_lines_added: number
  total_lines_deleted: number
  total_files_created: number
  total_files_modified: number
  total_test_files: number
  total_commits: number
  hook_block_reasons: Array<{ hook: string; count: number }>
  // Decision statistics
  total_decisions: number
  decisions_by_type: Array<{ type: string; count: number }>
  decisions_by_reason: Array<{ reason: string; count: number }>
  decision_chain: Array<{
    ts: string
    type: string
    reason: string
    inference: string
    tool: string
    target?: string
    related_hook?: string
  }>
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
// Git Data Collection
// ============================================================================

function getGitDiffStats(sinceCommit?: string): GitDiffStats {
  try {
    const baseRef = sinceCommit || "HEAD~1"
    const output = execSync(`git diff --stat ${baseRef}`, {
      encoding: "utf-8",
      timeout: 5000,
    }).trim()

    if (!output) {
      return { files_changed: [], lines_added: 0, lines_deleted: 0 }
    }

    // Parse diffstat output
    const lines = output.split("\n")
    const filesChanged: string[] = []
    let linesAdded = 0
    let linesDeleted = 0

    for (const line of lines) {
      // Match file lines: " path/to/file |  12 +--"
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

function getGitCommits(limit: number = 5, since?: string): GitCommitInfo[] {
  try {
    const sinceArg = since ? `--since="${since}"` : ""
    const output = execSync(
      `git log --pretty=format:"%H|%s|%an|%aI" -n ${limit} ${sinceArg}`,
      { encoding: "utf-8", timeout: 5000 }
    ).trim()

    if (!output) return []

    return output.split("\n").map(line => {
      const [hash, message, author, timestamp] = line.split("|")
      return { hash: hash || "", message: message || "", author: author || "", timestamp: timestamp || "" }
    })
  } catch {
    return []
  }
}

function getGitFileHistory(filePath: string, limit: number = 3): GitCommitInfo[] {
  try {
    const output = execSync(
      `git log --pretty=format:"%H|%s|%an|%aI" -n ${limit} -- "${filePath}"`,
      { encoding: "utf-8", timeout: 5000 }
    ).trim()

    if (!output) return []

    return output.split("\n").map(line => {
      const [hash, message, author, timestamp] = line.split("|")
      return { hash: hash || "", message: message || "", author: author || "", timestamp: timestamp || "" }
    })
  } catch {
    return []
  }
}

// ============================================================================
// File System Statistics
// ============================================================================

function getFileStats(filePath: string): FileStats {
  try {
    if (!existsSync(filePath)) {
      return { path: filePath, lines: 0, size_bytes: 0, exists: false }
    }

    const stats = statSync(filePath)
    const content = readFileSync(filePath, "utf-8")
    const lines = content.split("\n").length

    return {
      path: filePath,
      lines,
      size_bytes: stats.size,
      exists: true,
    }
  } catch {
    return { path: filePath, lines: 0, size_bytes: 0, exists: false }
  }
}

function getFilesStats(filePaths: string[]): FileStats[] {
  return filePaths.map(getFileStats)
}

function inferTestFilePath(sourcePath: string): string | null {
  const normalized = sourcePath.replace(/\\/g, "/")
  const dir = dirname(normalized)
  const ext = extname(normalized)
  const base = basename(normalized, ext)

  const testPatterns = [
    join(dir, `${base}.test${ext}`),
    join(dir, `${base}.spec${ext}`),
    join(dir, "__tests__", `${base}${ext}`),
  ]

  for (const testPath of testPatterns) {
    if (existsSync(testPath)) return testPath
  }

  return null
}

function isTestFile(path: string): boolean {
  return /\.(test|spec)\.(ts|tsx|js|jsx|py)$/.test(path) || path.includes("/__tests__/")
}

function isSourceFile(path: string): boolean {
  return /\.(ts|tsx|js|jsx|py|go|rs|java|rb)$/.test(path) && !isTestFile(path)
}

// ============================================================================
// Plan File Parsing
// ============================================================================

function parsePlanChecklist(planPath: string): TaskChecklist | null {
  if (!existsSync(planPath)) return null

  try {
    const content = readFileSync(planPath, "utf-8")
    const items: Array<{ text: string; completed: boolean }> = []

    // Match checkbox patterns: - [ ] or - [x]
    const checkboxRegex = /^-\s*\[([ xX])\]\s*(.+)$/gm
    let match

    while ((match = checkboxRegex.exec(content)) !== null) {
      items.push({
        text: match[2].trim(),
        completed: match[1].toLowerCase() === "x",
      })
    }

    return {
      total: items.length,
      completed: items.filter(i => i.completed).length,
      items,
    }
  } catch {
    return null
  }
}

function extractTaskSection(planPath: string, taskName: string): string | null {
  if (!existsSync(planPath)) return null

  try {
    const content = readFileSync(planPath, "utf-8")
    const taskRegex = new RegExp(`###\\s+Task[^:]*:\\s*${escapeRegex(taskName)}[\\s\\S]*?(?=###\\s+Task|$)`, "i")
    const match = content.match(taskRegex)
    return match ? match[0] : null
  } catch {
    return null
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
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
  const files = opts.files ? opts.files.split(",").map(f => f.trim()) : []

  // Collect Git statistics
  const gitStats = getGitDiffStats()

  // Collect file statistics
  const fileStats = getFilesStats(files)
  const filesCreated = fileStats.filter(f => f.exists)
  const testFiles = files.filter(f => isTestFile(f))

  // Get recent commits
  const commits = getGitCommits(3)

  // Parse checklist from plan if available
  let checklist: TaskChecklist | undefined
  if (opts.phase && opts.plan) {
    const planPath = join(PLANNING_DIR, "phases", opts.phase, `${opts.plan}-PLAN.md`)
    checklist = parsePlanChecklist(planPath) || undefined
  }

  const entry: LogEntry = {
    ts: getTimestamp(),
    type: "task_complete",
    session: opts.session || "unknown",
    agent: (opts.agent as LogEntry["agent"]) || "maker",
    phase: opts.phase,
    plan: opts.plan,
    task: opts.task,
    data: {
      files,
      files_created: filesCreated,
      test_files: testFiles,
      lines_added: gitStats.lines_added,
      lines_deleted: gitStats.lines_deleted,
      commits,
      checklist,
      duration_ms: opts.duration ? parseInt(opts.duration, 10) : undefined,
      status: (opts.status as LogEntry["data"]["status"]) || "pass",
      message: opts.message,
      commit: opts.commit,
    },
  }

  logToSession(entry)
  logToDaily(entry)
  logToTask(entry)

  console.log(
    JSON.stringify({
      status: "logged",
      type: "task_complete",
      task: entry.task,
      stats: {
        files: files.length,
        lines_added: gitStats.lines_added,
        lines_deleted: gitStats.lines_deleted,
        tests: testFiles.length,
      },
    })
  )
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

  console.log(JSON.stringify({ status: "logged", type: "test_run", testStatus: entry.data.status }))
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
    total_lines_added: 0,
    total_lines_deleted: 0,
    total_files_created: 0,
    total_files_modified: 0,
    total_test_files: 0,
    total_commits: 0,
    hook_block_reasons: [],
    total_decisions: 0,
    decisions_by_type: [],
    decisions_by_reason: [],
    decision_chain: [],
  }

  // Parse architect.jsonl and maker.jsonl
  const logFiles = ["architect.jsonl", "maker.jsonl"]
  const tasksMap = new Map<string, SessionSummary["tasks"][0]>()
  const hookBlockReasons = new Map<string, number>()
  const decisionsByType = new Map<string, number>()
  const decisionsByReason = new Map<string, number>()

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
            // Enhanced fields
            if (entry.data.lines_added) {
              task.lines_added = entry.data.lines_added
              summary.total_lines_added += entry.data.lines_added
            }
            if (entry.data.lines_deleted) {
              task.lines_deleted = entry.data.lines_deleted
              summary.total_lines_deleted += entry.data.lines_deleted
            }
            if (entry.data.test_files) {
              task.test_files = entry.data.test_files
              summary.total_test_files += entry.data.test_files.length
            }
            if (entry.data.checklist) {
              task.checklist_total = entry.data.checklist.total
              task.checklist_completed = entry.data.checklist.completed
            }
            if (entry.data.files_created) {
              summary.total_files_created += entry.data.files_created.filter(f => f.exists).length
            }
          }
          if (entry.data.files) {
            summary.total_files_modified += entry.data.files.length
          }
          if (entry.data.commits) {
            summary.total_commits += entry.data.commits.length
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
          const hookName = entry.data.hook || entry.rule || "unknown"
          hookBlockReasons.set(hookName, (hookBlockReasons.get(hookName) || 0) + 1)
        }

        if (entry.type === "hook_pass") {
          summary.hooks_passed++
        }

        if (entry.type === "error") {
          summary.errors++
        }

        // Handle decision entries
        if (entry.type === "decision") {
          summary.total_decisions++
          const decision = (entry as unknown as { decision?: { decision_type?: string; decision_reason?: string; inference?: string; related_hook_event?: string } }).decision
          const toolInvocation = (entry as unknown as { tool_invocation?: { tool?: string; target?: string } }).tool_invocation

          if (decision?.decision_type) {
            decisionsByType.set(decision.decision_type, (decisionsByType.get(decision.decision_type) || 0) + 1)
          }
          if (decision?.decision_reason) {
            decisionsByReason.set(decision.decision_reason, (decisionsByReason.get(decision.decision_reason) || 0) + 1)
          }

          // Add to decision chain (last 20 decisions)
          if (decision && summary.decision_chain.length < 20) {
            summary.decision_chain.push({
              ts: entry.ts,
              type: decision.decision_type || "unknown",
              reason: decision.decision_reason || "unknown",
              inference: decision.inference || "",
              tool: toolInvocation?.tool || "unknown",
              target: toolInvocation?.target,
              related_hook: decision.related_hook_event,
            })
          }
        }
      } catch {
        // Skip malformed lines
      }
    }
  }

  summary.tasks = Array.from(tasksMap.values())
  summary.hook_block_reasons = Array.from(hookBlockReasons.entries()).map(([hook, count]) => ({
    hook,
    count,
  }))
  summary.decisions_by_type = Array.from(decisionsByType.entries()).map(([type, count]) => ({
    type,
    count,
  }))
  summary.decisions_by_reason = Array.from(decisionsByReason.entries()).map(([reason, count]) => ({
    reason,
    count,
  }))

  // Write summary
  const summaryPath = join(sessionDir, "summary.json")
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8")

  console.log(JSON.stringify(summary, null, 2))
}

function cmdHelp(): void {
  console.log(`
Task Logger v2 - Record task execution logs with automatic context collection

Usage:
  npx tsx scripts/task-logger.ts <command> [options]

Commands:
  start       Record session start
  end         Record session end
  task-start  Record task start
  complete    Record task completion (auto-collects git stats, file stats)
  test        Record test run
  commit      Record git commit
  hook        Record hook event
  error       Record error
  checkpoint  Record checkpoint
  archive     Record plan archive
  summary     Generate session summary (includes all metrics)

Options:
  --session <id>       Session ID
  --phase <id>         Phase ID
  --plan <id>          Plan ID
  --task <name>        Task name
  --agent <name>       Agent name (architect|maker|coder|tester|debugger|reviewer)
  --files <files>      Comma-separated files
  --duration <ms>      Duration in ms
  --status <status>    pass|fail|blocked
  --message <msg>      Message
  --commit <hash>      Commit hash
  --hook <name>        Hook name
  --rule <id>          Rule ID (e.g., TDD-001)
  --passed <n>         Tests passed
  --failed <n>         Tests failed

Auto-Collected Data (on task complete):
  - Git diff stats (lines added/deleted)
  - File statistics (lines, size)
  - Recent commits
  - Test file detection
  - Plan checklist status

Examples:
  # Start a session
  npx tsx scripts/task-logger.ts start --session abc123 --agent maker

  # Record task start
  npx tsx scripts/task-logger.ts task-start --session abc123 --phase 01-foundation --plan 01-01 --task "Task 1"

  # Complete task (auto-collects git/file stats)
  npx tsx scripts/task-logger.ts complete --session abc123 --phase 01-foundation --plan 01-01 --task "Task 1" --files "src/auth.ts" --duration 300000

  # Record hook block with structured violation
  npx tsx scripts/task-logger.ts hook --session abc123 --hook test-first-guard --rule TDD-001 --status blocked --message "Test not found"

  # Generate summary with all metrics
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