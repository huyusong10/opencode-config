import type { Plugin, Hooks, PluginInput } from "@opencode-ai/plugin"
import { appendFileSync, existsSync, mkdirSync, readFileSync, realpathSync } from "fs"
import { basename, dirname, isAbsolute, join, normalize, relative, resolve } from "path"

/**
 * Guard Plugin for OpenCode
 *
 * Implements safety guards for Architect-Maker workflow:
 *
 * Layer 1: File Safety Guards
 *   - write-existing-file-guard: Require reading file before writing
 *
 * Layer 2: Workflow Enforcement Guards
 *   - architect-first-guard: Require Architect planning before Maker execution
 *   - execution-mode-guard: Require execution_mode specification
 *   - test-first-guard: TDD enforcement - require tests before implementation
 *   - plan-completion-guard: Require all tasks completed before plan completion
 *
 * Layer 3: Continuity Guards
 *   - todo-continuation-enforcer: Force continuation on incomplete todos
 */

// ============================================================================
// Types
// ============================================================================

type GuardArgs = {
  filePath?: string
  path?: string
  file_path?: string
  overwrite?: boolean | string
  content?: string
  newString?: string
  pattern?: string
  command?: string
  args?: string[]
  todos?: unknown
}

// ============================================================================
// Decision Types (for automatic inference)
// ============================================================================

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

interface DecisionContext {
  decision_type: DecisionType
  decision_reason: DecisionReason
  inference: string
  confidence: "high" | "medium" | "low"
  related_hook_event?: string
  task_context?: string
  file_purpose?: string
}

interface ReadPermissionTracker {
  readPermissionsBySession: Map<string, Set<string>>
  sessionLastAccess: Map<string, number>
  canonicalSessionRoot: string
}

interface TodoContinuationState {
  sessionsWithTodos: Map<string, { todos: string[]; lastCheck: number }>
  maxConsecutiveFailures: number
  consecutiveFailures: Map<string, number>
}

interface PlannerState {
  status: "planning" | "ready" | "executing" | "completed" | "blocked"
  execution_mode?: "tdd" | "ralph" | "standard" | "spike" | "debug" | "refactor" | "migrate"
  architect?: {
    completed_at: string
    plan_files: string[]
  }
  maker?: {
    started_at: string | null
    current_phase: string
    current_plan: string
    current_task: string | null
    test_files_created: string[]
    commits: Array<{ hash: string; task: string }>
  }
  archive?: Array<{
    plan: string
    archived_at: string
    summary: string
  }>
}

interface PlanTask {
  name: string
  file?: string
  completed: boolean
}

interface PlanFrontmatter {
  phase: string
  plan: string
  execution_mode?: string
  status?: string
  completed_at?: string
}

// ============================================================================
// Constants
// ============================================================================

const MAX_TRACKED_SESSIONS = 256
const MAX_TRACKED_PATHS_PER_SESSION = 1024

// File guard message
const BLOCK_MESSAGE = "File already exists. Use edit tool instead."

// Architect-Maker workflow messages
const ARCHITECT_REQUIRED_MESSAGE = `
========================================
BLOCKED: Architect Planning Required
========================================

This operation modifies source code and requires prior planning by Architect.

What you need to do:
  1. Call @architect with your requirement
  2. Architect will create execution plan
  3. Architect will specify execution_mode (default: tdd)
  4. Then Maker can proceed with implementation

Example:
  @architect
  Implement user login with JWT authentication
`

const EXECUTION_MODE_MISSING_MESSAGE = `
========================================
BLOCKED: Missing execution_mode
========================================

STATE.md must specify execution_mode. Valid options:

  - tdd: Test-Driven Development (default)
  - ralph: Deterministic verification loop  
  - standard: Linear execution
  - debug: Systematic debugging
  - refactor: Safe refactoring with tests
  - migrate: Migration with verification

Architect must update STATE.md with execution_mode.
`

const ARCHITECT_NOT_COMPLETE_MESSAGE = (status: string) => `
========================================
BLOCKED: Architect Planning Not Complete
========================================

Current status: ${status}
Required status: ready

Architect must finish planning before implementation.
Please wait for Architect to complete the plan.
`

const TDD_TEST_FIRST_MESSAGE = (sourceFile: string, testFile: string) => `
========================================
BLOCKED: TDD Violation - Write Test First
========================================

Execution mode: TDD (ATDD - Feature-Level)

Target file: ${sourceFile}
Required test: ${testFile}

TDD/ATDD requires acceptance tests BEFORE implementation:
  1. Write a failing acceptance test for the feature
  2. Run test to confirm it fails
  3. Write minimal implementation
  4. Run test to confirm it passes
  5. Refactor if needed

Create the test file first:
  ${testFile}
`

const PLAN_INCOMPLETE_MESSAGE = (tasks: string[]) => `
========================================
BLOCKED: Plan Incomplete
========================================

The following tasks are not completed:
${tasks.map(t => `  - ${t}`).join("\n")}

You must complete ALL tasks in the plan before marking it complete.

Rules:
  1. Every task must be implemented
  2. Every test must pass
  3. Every verification must succeed
  4. All success criteria must be met

Continue with remaining tasks before proceeding.
`

const VERIFICATION_INCOMPLETE_MESSAGE = (verifications: string[]) => `
========================================
BLOCKED: Verification Not Passed
========================================

The following verifications have not passed:
${verifications.map(v => `  - ${v}`).join("\n")}

Run verification commands and ensure all pass.
`

// Simple task path patterns (skip architect-first-guard)
const SIMPLE_TASK_PATTERNS: RegExp[] = [
  /^\.git\//,
  /\.md$/,
  /\.txt$/,
  /package\.json$/,
  /package-lock\.json$/,
  /\.env\.example$/,
  /README/,
  /LICENSE/,
  /\.github\//,
  /\.husky\//,
  /node_modules\//,
]

// Source file patterns (trigger architect-first-guard)
const SOURCE_FILE_PATTERNS: RegExp[] = [
  /\.ts$/,
  /\.tsx$/,
  /\.js$/,
  /\.jsx$/,
  /\.py$/,
  /\.go$/,
  /\.rs$/,
  /\.java$/,
  /\.rb$/,
]

// Test file patterns
const TEST_FILE_PATTERNS: RegExp[] = [
  /\.test\.(ts|tsx|js|jsx|py)$/,
  /\.spec\.(ts|tsx|js|jsx|py)$/,
  /\/__tests__\//,
  /\/tests?\//,
]

// ============================================================================
// Task Logger Integration (Enhanced)
// ============================================================================

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

interface LogEvent {
  type: "hook_block" | "hook_pass"
  session: string
  hook: string
  phase?: string
  plan?: string
  task?: string
  message: string
  file?: string
  // Enhanced fields
  rule?: string
  violation?: ViolationDetail
  tool_context?: ToolContext
  state_context?: StateContext
}

// ============================================================================
// Decision Logging Types
// ============================================================================

interface DecisionLogEvent {
  type: "decision"
  session: string
  phase?: string
  plan?: string
  task?: string
  decision: DecisionContext
  tool_invocation: {
    tool: string
    target?: string
    operation?: string
    success: boolean
    duration_ms?: number
  }
  context_snapshot: {
    recent_hook_blocks: Array<{ hook: string; rule: string; ts: string }>
    files_in_scope: string[]
    execution_mode?: string
  }
}

// Track recent hook blocks per session for decision context
const recentHookBlocks = new Map<string, Array<{ hook: string; rule: string; ts: string }>>()

function recordHookBlock(session: string, hook: string, rule: string): void {
  const blocks = recentHookBlocks.get(session) || []
  blocks.unshift({ hook, rule, ts: new Date().toISOString() })
  // Keep only last 10 blocks
  if (blocks.length > 10) blocks.pop()
  recentHookBlocks.set(session, blocks)
}

function getRecentHookBlocks(session: string): Array<{ hook: string; rule: string; ts: string }> {
  return recentHookBlocks.get(session) || []
}

function logToFile(ctx: PluginInput, event: LogEvent): void {
  try {
    const logsDir = join(ctx.directory, ".planning", ".logs")
    const dailyDir = join(logsDir, "daily")
    const date = new Date().toISOString().split("T")[0]
    const logFile = join(dailyDir, `${date}.jsonl`)

    if (!existsSync(dailyDir)) {
      mkdirSync(dailyDir, { recursive: true })
    }

    const entry = {
      ts: new Date().toISOString(),
      type: event.type,
      session: event.session,
      hook: event.hook,
      rule: event.rule,
      phase: event.phase,
      plan: event.plan,
      task: event.task,
      violation: event.violation,
      tool_context: event.tool_context,
      state_context: event.state_context,
      data: {
        message: event.message,
        file: event.file,
      },
    }

    appendFileSync(logFile, JSON.stringify(entry) + "\n", "utf-8")

    // Record hook block for decision context
    if (event.type === "hook_block" && event.rule) {
      recordHookBlock(event.session, event.hook, event.rule)
    }
  } catch {
    // Silently fail
  }
}

function buildToolContext(
  tool: string,
  operation: "create" | "modify" | "read" | "delete",
  targetFile: string
): ToolContext {
  const fileExists = existsSync(targetFile)
  const isSource = isSourceFilePath(targetFile)
  const expectedTest = isSource ? inferTestFile(targetFile) : null
  const testExists = expectedTest ? existsSync(expectedTest) : false

  return {
    tool,
    operation,
    target_file: targetFile,
    file_exists: fileExists,
    test_file_exists: testExists,
    is_source_file: isSource,
  }
}

function buildStateContext(ctx: PluginInput): StateContext {
  const statePath = join(ctx.directory, ".planning", "STATE.md")
  const state = parseStateFile(statePath)

  if (!state) {
    return {}
  }

  const context: StateContext = {
    execution_mode: state.execution_mode,
    current_status: state.status,
  }

  // Count tasks from plan if available
  if (state.maker?.current_phase && state.maker?.current_plan) {
    const planPath = join(
      ctx.directory,
      ".planning",
      "phases",
      state.maker.current_phase,
      `${state.maker.current_plan}-PLAN.md`
    )
    if (existsSync(planPath)) {
      const planResult = parsePlanFile(planPath)
      if (planResult) {
        context.plan_tasks_total = planResult.tasks.length
        context.plan_tasks_completed = planResult.tasks.filter(t => t.completed).length
      }
    }
  }

  return context
}

// ============================================================================
// Decision Inference Engine
// ============================================================================

function inferDecision(
  tool: string,
  args: GuardArgs | undefined,
  session: string,
  stateContext: StateContext
): DecisionContext {
  const targetPath = getPathFromArgs(args)
  const recentBlocks = getRecentHookBlocks(session)

  // Determine decision type
  let decisionType: DecisionType = "other"
  let decisionReason: DecisionReason = "unknown"
  let inference = ""
  let confidence: "high" | "medium" | "low" = "medium"
  let filePurpose = ""

  if (tool === "write" || tool === "edit") {
    if (targetPath) {
      const isTest = isTestFilePath(targetPath)
      const isSource = isSourceFilePath(targetPath)
      const isConfig = /\.(json|yaml|yml|toml|ini|env)$/.test(targetPath)
      const isDoc = /\.md$/.test(targetPath)
      const fileExists = existsSync(targetPath)

      if (isTest) {
        decisionType = fileExists ? "modify_test_file" : "create_test_file"
        filePurpose = "test file"
      } else if (isSource) {
        decisionType = fileExists ? "modify_source_file" : "create_source_file"
        filePurpose = "source file"
      } else if (isConfig) {
        decisionType = fileExists ? "modify_config_file" : "create_config_file"
        filePurpose = "configuration file"
      } else if (isDoc) {
        decisionType = "create_documentation"
        filePurpose = "documentation"
      }

      // Infer reason based on context
      const lastBlock = recentBlocks[0]

      if (stateContext.execution_mode === "tdd") {
        if (isTest && !fileExists) {
          decisionReason = "tdd_write_test_first"
          inference = `Create test file following TDD workflow (test-first for ${getFeatureName(targetPath)})`
          confidence = "high"
        } else if (isSource && !fileExists) {
          // Check if test was recently created
          const testExistsForSource = checkTestExistsForSource(targetPath)
          if (testExistsForSource) {
            decisionReason = "tdd_implement_after_test"
            inference = `Implement source code after test exists (TDD workflow for ${getFeatureName(targetPath)})`
            confidence = "high"
          } else {
            decisionReason = "implement_feature"
            inference = `Create new source file for ${getFeatureName(targetPath)}`
            confidence = "medium"
          }
        } else if (isSource && fileExists) {
          decisionReason = "tdd_refactor"
          inference = `Modify existing source file (likely refactoring or extending ${getFeatureName(targetPath)})`
          confidence = "medium"
        }
      } else if (lastBlock?.hook === "test-first-guard") {
        // Previous block was TDD violation, now creating test
        if (isTest) {
          decisionReason = "tdd_write_test_first"
          inference = `Create test file after TDD violation (complying with guard rule)`
          confidence = "high"
        }
      } else if (lastBlock?.rule?.startsWith("ARCH")) {
        decisionReason = "implement_feature"
        inference = `Implementation following architect planning`
        confidence = "medium"
      }

      // Default inference if not set
      if (!inference) {
        if (fileExists) {
          decisionReason = "implement_feature"
          inference = `Modify ${filePurpose}: ${basename(targetPath)}`
        } else {
          decisionReason = "implement_feature"
          inference = `Create ${filePurpose}: ${basename(targetPath)}`
        }
      }
    }
  } else if (tool === "read") {
    decisionType = "read_file"
    if (targetPath) {
      decisionReason = "understand_context"
      inference = `Read file to understand context: ${basename(targetPath)}`
      confidence = "medium"
    }
  } else if (tool === "grep" || tool === "glob") {
    decisionType = "search_code"
    decisionReason = "explore_codebase"
    const pattern = args?.pattern || ""
    inference = `Search codebase for: ${pattern}`
    confidence = "high"
  } else if (tool === "bash") {
    const command = args?.command || ""
    if (command.includes("test") || command.includes("spec")) {
      decisionType = "run_tests"
      decisionReason = "verify_implementation"
      inference = "Run tests to verify implementation"
      confidence = "high"
    } else if (command.includes("lint") || command.includes("eslint") || command.includes("ruff")) {
      decisionType = "run_linter"
      decisionReason = "run_quality_check"
      inference = "Run linter for code quality check"
      confidence = "high"
    } else if (command.includes("build") || command.includes("compile")) {
      decisionType = "run_build"
      decisionReason = "verify_implementation"
      inference = "Build project to verify compilation"
      confidence = "high"
    } else if (command.startsWith("git ")) {
      decisionType = "git_operation"
      if (command.includes("commit")) {
        decisionReason = "commit_changes"
        inference = "Commit changes to version control"
      } else {
        decisionReason = "explore_codebase"
        inference = `Git operation: ${command.split(" ")[1] || "unknown"}`
      }
      confidence = "high"
    } else {
      decisionType = "run_command"
      decisionReason = "unknown"
      inference = `Execute command: ${command.slice(0, 50)}`
      confidence = "low"
    }
  } else if (tool === "todowrite") {
    decisionType = "update_todo"
    decisionReason = "track_progress"
    inference = "Update task progress tracking"
    confidence = "high"
  } else if (tool === "task") {
    decisionType = "spawn_agent"
    decisionReason = "delegate_task"
    inference = "Spawn subagent for specialized task"
    confidence = "high"
  }

  return {
    decision_type: decisionType,
    decision_reason: decisionReason,
    inference,
    confidence,
    related_hook_event: recentBlocks[0]?.hook,
    file_purpose: filePurpose || undefined,
  }
}

function checkTestExistsForSource(sourcePath: string): boolean {
  const testPath = inferTestFile(sourcePath)
  return existsSync(testPath)
}

function getFeatureName(filePath: string): string {
  const base = basename(filePath)
  const name = base.replace(/\.(test|spec)\.(ts|tsx|js|jsx|py)$/, "").replace(/\.(ts|tsx|js|jsx|py|go|rs)$/, "")
  return name || "feature"
}

function logDecision(ctx: PluginInput, event: DecisionLogEvent): void {
  try {
    const logsDir = join(ctx.directory, ".planning", ".logs")
    const dailyDir = join(logsDir, "daily")
    const date = new Date().toISOString().split("T")[0]
    const logFile = join(dailyDir, `${date}.jsonl`)

    if (!existsSync(dailyDir)) {
      mkdirSync(dailyDir, { recursive: true })
    }

    const entry = {
      ts: new Date().toISOString(),
      type: "decision",
      session: event.session,
      phase: event.phase,
      plan: event.plan,
      task: event.task,
      decision: event.decision,
      tool_invocation: event.tool_invocation,
      context_snapshot: event.context_snapshot,
    }

    appendFileSync(logFile, JSON.stringify(entry) + "\n", "utf-8")
  } catch {
    // Silently fail
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined
  }
  return value as Record<string, unknown>
}

function getPathFromArgs(args: GuardArgs | undefined): string | undefined {
  return args?.filePath ?? args?.path ?? args?.file_path
}

function resolveInputPath(ctx: PluginInput, inputPath: string): string {
  return normalize(isAbsolute(inputPath) ? inputPath : resolve(ctx.directory, inputPath))
}

function isPathInsideDirectory(pathToCheck: string, directory: string): boolean {
  const relativePath = relative(directory, pathToCheck)
  return relativePath === "" || (!relativePath.startsWith("..") && !isAbsolute(relativePath))
}

function toCanonicalPath(absolutePath: string): string {
  let canonicalPath = absolutePath

  if (existsSync(absolutePath)) {
    try {
      canonicalPath = realpathSync.native(absolutePath)
    } catch {
      canonicalPath = absolutePath
    }
  } else {
    const absoluteDir = dirname(absolutePath)
    const resolvedDir = existsSync(absoluteDir) ? realpathSync.native(absoluteDir) : absoluteDir
    canonicalPath = join(resolvedDir, basename(absolutePath))
  }

  return normalize(canonicalPath)
}

function isOverwriteEnabled(value: boolean | string | undefined): boolean {
  if (value === true) return true
  if (typeof value === "string") return value.toLowerCase() === "true"
  return false
}

function matchesPatterns(path: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(path))
}

function isSimpleTaskPath(path: string): boolean {
  return matchesPatterns(path, SIMPLE_TASK_PATTERNS)
}

function isSourceFilePath(path: string): boolean {
  return matchesPatterns(path, SOURCE_FILE_PATTERNS) && !isTestFilePath(path)
}

function isTestFilePath(path: string): boolean {
  return matchesPatterns(path, TEST_FILE_PATTERNS)
}

// ============================================================================
// State File Parsing
// ============================================================================

function parseStateFile(statePath: string): PlannerState | null {
  if (!existsSync(statePath)) return null

  try {
    const content = readFileSync(statePath, "utf-8")
    return parseStateContent(content)
  } catch {
    return null
  }
}

function parseStateContent(content: string): PlannerState {
  const state: PlannerState = {
    status: "planning",
  }

  const lines = content.split("\n")
  let currentSection = ""

  for (const line of lines) {
    const trimmed = line.trim()

    // Section headers
    if (trimmed.startsWith("## ")) {
      currentSection = trimmed.slice(3).toLowerCase()
      continue
    }

    // Parse status
    if (trimmed.startsWith("状态:") || trimmed.startsWith("status:")) {
      const value = trimmed.split(":")[1]?.trim()
      if (value && ["planning", "ready", "executing", "completed", "blocked"].includes(value)) {
        state.status = value as PlannerState["status"]
      }
    }

    // Parse execution_mode
    if (trimmed.startsWith("execution_mode:")) {
      const value = trimmed.split(":")[1]?.trim()
      if (value) {
        state.execution_mode = value as PlannerState["execution_mode"]
      }
    }

    // Parse current_phase
    if (trimmed.startsWith("阶段:") || trimmed.includes("current_phase:")) {
      const value = trimmed.split(":").pop()?.trim()
      if (value && currentSection.includes("位置")) {
        state.maker = state.maker || { current_phase: value, current_plan: "", test_files_created: [], commits: [], started_at: null, current_task: null }
        state.maker.current_phase = value
      }
    }

    // Parse current_plan
    if (trimmed.startsWith("计划:") || trimmed.includes("current_plan:")) {
      const value = trimmed.split(":").pop()?.trim()
      if (value && currentSection.includes("位置")) {
        state.maker = state.maker || { current_phase: "", current_plan: value, test_files_created: [], commits: [], started_at: null, current_task: null }
        state.maker.current_plan = value
      }
    }
  }

  return state
}

// ============================================================================
// Plan File Parsing
// ============================================================================

function parsePlanFile(planPath: string): { frontmatter: PlanFrontmatter; tasks: PlanTask[] } | null {
  if (!existsSync(planPath)) return null

  try {
    const content = readFileSync(planPath, "utf-8")
    return parsePlanContent(content)
  } catch {
    return null
  }
}

function parsePlanContent(content: string): { frontmatter: PlanFrontmatter; tasks: PlanTask[] } {
  const frontmatter: PlanFrontmatter = {
    phase: "",
    plan: "",
  }
  const tasks: PlanTask[] = []

  // Parse frontmatter (between ---)
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (frontmatterMatch) {
    const fmLines = frontmatterMatch[1].split("\n")
    for (const line of fmLines) {
      const [key, ...valueParts] = line.split(":")
      const value = valueParts.join(":").trim()
      if (key === "phase") frontmatter.phase = value
      if (key === "plan") frontmatter.plan = value
      if (key === "execution_mode") frontmatter.execution_mode = value
      if (key === "status") frontmatter.status = value
    }
  }

  // Parse tasks (looking for ### Task N: and checkboxes)
  const taskRegex = /###\s+Task\s+(\d+):\s*(.+)/g
  let taskMatch
  let lastTaskName = ""

  while ((taskMatch = taskRegex.exec(content)) !== null) {
    lastTaskName = taskMatch[2].trim()
    tasks.push({
      name: lastTaskName,
      completed: false,
    })
  }

  // Check for completed tasks ([x] vs [ ])
  const checkboxRegex = /^-\s*\[([ xX])\]\s*(.+)$/gm
  let checkMatch
  let taskIndex = 0

  while ((checkMatch = checkboxRegex.exec(content)) !== null) {
    const isChecked = checkMatch[1].toLowerCase() === "x"
    const itemText = checkMatch[2].trim()

    // If this looks like a file reference, associate with current task
    if (itemText.includes("文件:") || itemText.includes("File:")) {
      if (taskIndex < tasks.length) {
        tasks[taskIndex].file = itemText.split(":").pop()?.trim()
      }
    }

    // Count completed items per task section
    // This is simplified - a more robust parser would track section boundaries
    if (isChecked && taskIndex < tasks.length) {
      // Mark task as having some completion
    }
  }

  // Better approach: check if ALL items under each task are [x]
  const sections = content.split(/###\s+Task\s+\d+:/)
  for (let i = 1; i < sections.length && i <= tasks.length; i++) {
    const section = sections[i]
    const checkboxes = section.match(/^-\s*\[[ xX]\]/gm) || []
    const completed = section.match(/^-\s*\[xX\]/gm) || []
    tasks[i - 1].completed = checkboxes.length > 0 && checkboxes.length === completed.length
  }

  return { frontmatter, tasks }
}

function extractIncompleteTasks(planContent: string): string[] {
  const incomplete: string[] = []
  const sections = planContent.split(/###\s+Task\s+\d+:\s*/)

  for (let i = 1; i < sections.length; i++) {
    const taskName = sections[i].split("\n")[0]?.trim()
    const section = sections[i]
    const checkboxes = section.match(/^-\s*\[[ xX]\]/gm) || []
    const completed = section.match(/^-\s*\[xX\]/gm) || []

    if (checkboxes.length > 0 && checkboxes.length !== completed.length) {
      incomplete.push(taskName || `Task ${i}`)
    }
  }

  return incomplete
}

// ============================================================================
// Test File Inference (ATDD Feature-Level)
// ============================================================================

function inferTestFile(sourcePath: string): string {
  // Normalize path separators
  const normalized = sourcePath.replace(/\\/g, "/")
  const dir = dirname(normalized)
  const ext = extname(normalized)
  const base = basename(normalized, ext)

  // Priority 1: Same directory with .test.ts or .spec.ts
  const sameDirTest = join(dir, `${base}.test${ext}`)
  if (existsSync(sameDirTest)) return sameDirTest

  const sameDirSpec = join(dir, `${base}.spec${ext}`)
  if (existsSync(sameDirSpec)) return sameDirSpec

  // Priority 2: __tests__ subdirectory
  const testsDir = join(dir, "__tests__", `${base}${ext}`)
  if (existsSync(testsDir)) return testsDir

  // Priority 3: Central tests directory
  const centralTest = normalized.replace(/^src\//, "tests/").replace(/\.(ts|tsx|js|jsx)$/, ".test.$1")
  if (existsSync(centralTest)) return centralTest

  // Default: Return same directory test path (expected location)
  return sameDirTest
}

function extname(path: string): string {
  const match = path.match(/\.(ts|tsx|js|jsx|py|go|rs|java|rb)$/)
  return match ? match[0] : ""
}

// ============================================================================
// Read Permission Tracker
// ============================================================================

function createReadPermissionTracker(ctx: PluginInput): ReadPermissionTracker {
  return {
    readPermissionsBySession: new Map<string, Set<string>>(),
    sessionLastAccess: new Map<string, number>(),
    canonicalSessionRoot: toCanonicalPath(resolveInputPath(ctx, ctx.directory)),
  }
}

function touchSession(tracker: ReadPermissionTracker, sessionID: string): void {
  tracker.sessionLastAccess.set(sessionID, Date.now())
}

function evictLeastRecentlyUsedSession(tracker: ReadPermissionTracker): void {
  let oldestSessionID: string | undefined
  let oldestSeen = Number.POSITIVE_INFINITY

  for (const [sessionID, lastSeen] of tracker.sessionLastAccess.entries()) {
    if (lastSeen < oldestSeen) {
      oldestSeen = lastSeen
      oldestSessionID = sessionID
    }
  }

  if (oldestSessionID) {
    tracker.readPermissionsBySession.delete(oldestSessionID)
    tracker.sessionLastAccess.delete(oldestSessionID)
  }
}

function ensureSessionReadSet(tracker: ReadPermissionTracker, sessionID: string): Set<string> {
  let readSet = tracker.readPermissionsBySession.get(sessionID)
  if (!readSet) {
    if (tracker.readPermissionsBySession.size >= MAX_TRACKED_SESSIONS) {
      evictLeastRecentlyUsedSession(tracker)
    }
    readSet = new Set<string>()
    tracker.readPermissionsBySession.set(sessionID, readSet)
  }
  touchSession(tracker, sessionID)
  return readSet
}

function trimSessionReadSet(readSet: Set<string>): void {
  while (readSet.size > MAX_TRACKED_PATHS_PER_SESSION) {
    const oldestPath = readSet.values().next().value
    if (!oldestPath) return
    readSet.delete(oldestPath)
  }
}

function registerReadPermission(tracker: ReadPermissionTracker, sessionID: string, canonicalPath: string): void {
  const readSet = ensureSessionReadSet(tracker, sessionID)
  if (readSet.has(canonicalPath)) {
    readSet.delete(canonicalPath)
  }
  readSet.add(canonicalPath)
  trimSessionReadSet(readSet)
}

function consumeReadPermission(tracker: ReadPermissionTracker, sessionID: string, canonicalPath: string): boolean {
  const readSet = tracker.readPermissionsBySession.get(sessionID)
  if (!readSet || !readSet.has(canonicalPath)) {
    return false
  }
  readSet.delete(canonicalPath)
  touchSession(tracker, sessionID)
  return true
}

function invalidateOtherSessions(tracker: ReadPermissionTracker, canonicalPath: string, writingSessionID?: string): void {
  for (const [sessionID, readSet] of tracker.readPermissionsBySession.entries()) {
    if (writingSessionID && sessionID === writingSessionID) continue
    readSet.delete(canonicalPath)
  }
}

// ============================================================================
// Hook 1: Write Existing File Guard
// ============================================================================

function createWriteExistingFileGuardHook(ctx: PluginInput, tracker: ReadPermissionTracker): Hooks {
  return {
    "tool.execute.before": async (input, output) => {
      const toolName = input.tool?.toLowerCase()
      if (toolName !== "write" && toolName !== "read") return

      const argsRecord = asRecord(output.args)
      const args = argsRecord as GuardArgs | undefined
      const filePath = getPathFromArgs(args)
      if (!filePath) return

      const resolvedPath = resolveInputPath(ctx, filePath)
      const canonicalPath = toCanonicalPath(resolvedPath)
      const isInsideSessionDirectory = isPathInsideDirectory(canonicalPath, tracker.canonicalSessionRoot)

      if (!isInsideSessionDirectory) return

      // Track read permissions
      if (toolName === "read") {
        if (!existsSync(resolvedPath) || !input.sessionID) return
        registerReadPermission(tracker, input.sessionID, canonicalPath)
        return
      }

      // Handle write tool
      const overwriteEnabled = isOverwriteEnabled(args?.overwrite)

      // Remove overwrite from args (hook-only bypass)
      if (argsRecord && "overwrite" in argsRecord) {
        delete argsRecord.overwrite
      }

      // Allow new files
      if (!existsSync(resolvedPath)) return

      // Allow .sisyphus/ paths (internal state)
      const isSisyphusPath = canonicalPath.includes("/.sisyphus/")
      if (isSisyphusPath) {
        invalidateOtherSessions(tracker, canonicalPath, input.sessionID)
        return
      }

      // Allow .planning/ paths (planning state)
      const isPlanningPath = canonicalPath.includes("/.planning/")
      if (isPlanningPath) {
        invalidateOtherSessions(tracker, canonicalPath, input.sessionID)
        return
      }

      // Allow explicit overwrite bypass
      if (overwriteEnabled) {
        invalidateOtherSessions(tracker, canonicalPath, input.sessionID)
        return
      }

      // Allow if file was read in this session
      if (input.sessionID && consumeReadPermission(tracker, input.sessionID, canonicalPath)) {
        invalidateOtherSessions(tracker, canonicalPath, input.sessionID)
        return
      }

      // Block write to existing file without prior read
      throw new Error(BLOCK_MESSAGE)
    },
    event: async ({ event }) => {
      if (event.type !== "session.deleted") return

      const props = event.properties as { info?: { id?: string } } | undefined
      const sessionID = props?.info?.id
      if (!sessionID) return

      tracker.readPermissionsBySession.delete(sessionID)
      tracker.sessionLastAccess.delete(sessionID)
    },
  }
}

// ============================================================================
// Hook 2: Architect First Guard
// ============================================================================

function createArchitectFirstGuardHook(ctx: PluginInput): Hooks {
  return {
    "tool.execute.before": async (input, output) => {
      const toolName = input.tool?.toLowerCase()
      if (toolName !== "write" && toolName !== "edit") return

      const argsRecord = asRecord(output.args)
      const args = argsRecord as GuardArgs | undefined
      const filePath = getPathFromArgs(args)
      if (!filePath) return

      const resolvedPath = resolveInputPath(ctx, filePath)

      // Skip simple task paths
      if (isSimpleTaskPath(resolvedPath)) return

      // Skip .planning/ directory (Architect workspace)
      if (resolvedPath.includes("/.planning/")) return

      // Skip .sisyphus/ directory
      if (resolvedPath.includes("/.sisyphus/")) return

      // Skip non-source files
      if (!isSourceFilePath(resolvedPath)) return

      const sessionId = input.sessionID || "unknown"
      const toolContext = buildToolContext(
        toolName,
        existsSync(resolvedPath) ? "modify" : "create",
        resolvedPath
      )

      // Check STATE.md existence
      const statePath = join(ctx.directory, ".planning", "STATE.md")
      if (!existsSync(statePath)) {
        logToFile(ctx, {
          type: "hook_block",
          session: sessionId,
          hook: "architect-first-guard",
          rule: "ARCH-001: state-file-required",
          message: "STATE.md not found",
          file: resolvedPath,
          violation: {
            rule_id: "ARCH-001",
            expected: "STATE.md file exists in .planning/",
            actual: "STATE.md not found",
          },
          tool_context: toolContext,
          state_context: buildStateContext(ctx),
        })
        throw new Error(ARCHITECT_REQUIRED_MESSAGE)
      }

      // Parse and validate state
      const state = parseStateFile(statePath)
      if (!state) {
        logToFile(ctx, {
          type: "hook_block",
          session: sessionId,
          hook: "architect-first-guard",
          rule: "ARCH-002: state-parse-valid",
          message: "STATE.md parse failed",
          file: resolvedPath,
          violation: {
            rule_id: "ARCH-002",
            expected: "Valid STATE.md content",
            actual: "Failed to parse STATE.md",
          },
          tool_context: toolContext,
          state_context: buildStateContext(ctx),
        })
        throw new Error(ARCHITECT_REQUIRED_MESSAGE)
      }

      // Validate status
      if (state.status !== "ready" && state.status !== "executing") {
        logToFile(ctx, {
          type: "hook_block",
          session: sessionId,
          hook: "architect-first-guard",
          rule: "ARCH-003: status-ready-required",
          phase: state.maker?.current_phase,
          plan: state.maker?.current_plan,
          message: `Status not ready: ${state.status}`,
          file: resolvedPath,
          violation: {
            rule_id: "ARCH-003",
            expected: "status: ready or executing",
            actual: `status: ${state.status}`,
          },
          tool_context: toolContext,
          state_context: buildStateContext(ctx),
        })
        throw new Error(ARCHITECT_NOT_COMPLETE_MESSAGE(state.status))
      }

      // Validate execution_mode
      if (!state.execution_mode) {
        logToFile(ctx, {
          type: "hook_block",
          session: sessionId,
          hook: "execution-mode-guard",
          rule: "EXEC-001: mode-specified",
          phase: state.maker?.current_phase,
          plan: state.maker?.current_plan,
          message: "execution_mode not specified",
          file: resolvedPath,
          violation: {
            rule_id: "EXEC-001",
            expected: "execution_mode specified in STATE.md",
            actual: "execution_mode not found",
          },
          tool_context: toolContext,
          state_context: buildStateContext(ctx),
        })
        throw new Error(EXECUTION_MODE_MISSING_MESSAGE)
      }

      // TDD mode: enforce test-first
      if (state.execution_mode === "tdd") {
        enforceTDDGuard(ctx, resolvedPath, sessionId, state)
      }
    },
  }
}

// ============================================================================
// Hook 3: TDD Guard (ATDD Feature-Level)
// ============================================================================

function enforceTDDGuard(ctx: PluginInput, filePath: string, sessionId: string, state: PlannerState): void {
  // Skip test files themselves
  if (isTestFilePath(filePath)) {
    return
  }

  // Only check source files
  if (!isSourceFilePath(filePath)) return

  // Check if test exists
  const expectedTestFile = inferTestFile(filePath)

  // For new files, require test to exist first
  if (!existsSync(filePath) && !existsSync(expectedTestFile)) {
    const toolContext = buildToolContext("write", "create", filePath)
    logToFile(ctx, {
      type: "hook_block",
      session: sessionId,
      hook: "test-first-guard",
      rule: "TDD-001: test-first",
      phase: state.maker?.current_phase,
      plan: state.maker?.current_plan,
      message: `TDD violation: test file not found`,
      file: filePath,
      violation: {
        rule_id: "TDD-001",
        expected: "Test file exists before source file creation",
        actual: "Test file not found",
        expected_path: expectedTestFile,
        actual_path: null,
      },
      tool_context: toolContext,
      state_context: {
        execution_mode: state.execution_mode,
        current_status: state.status,
      },
    })
    throw new Error(TDD_TEST_FIRST_MESSAGE(filePath, expectedTestFile))
  }

  // For existing files being edited, check if test exists
  if (existsSync(filePath) && !existsSync(expectedTestFile)) {
    const toolContext = buildToolContext("edit", "modify", filePath)
    logToFile(ctx, {
      type: "hook_block",
      session: sessionId,
      hook: "test-first-guard",
      rule: "TDD-002: test-required-for-edit",
      phase: state.maker?.current_phase,
      plan: state.maker?.current_plan,
      message: `TDD violation: editing file without test`,
      file: filePath,
      violation: {
        rule_id: "TDD-002",
        expected: "Test file exists for source file being edited",
        actual: "Test file not found",
        expected_path: expectedTestFile,
        actual_path: null,
      },
      tool_context: toolContext,
      state_context: {
        execution_mode: state.execution_mode,
        current_status: state.status,
      },
    })
    throw new Error(TDD_TEST_FIRST_MESSAGE(filePath, expectedTestFile))
  }
}

// ============================================================================
// Hook 4: Plan Completion Guard
// ============================================================================

function createPlanCompletionGuardHook(ctx: PluginInput): Hooks {
  return {
    "tool.execute.before": async (input, output) => {
      const toolName = input.tool?.toLowerCase()
      if (toolName !== "write" && toolName !== "edit") return

      const argsRecord = asRecord(output.args)
      const args = argsRecord as GuardArgs | undefined
      const filePath = getPathFromArgs(args)
      if (!filePath) return

      const resolvedPath = resolveInputPath(ctx, filePath)

      // Only check STATE.md edits that mark completion
      if (!resolvedPath.endsWith("STATE.md")) return

      const content = args?.content || args?.newString || ""
      if (!content.includes("status: completed") && !content.includes("status: archived")) {
        return
      }

      const sessionId = input.sessionID || "unknown"

      // Validate plan completion
      const statePath = join(ctx.directory, ".planning", "STATE.md")
      const state = parseStateFile(statePath)

      if (!state?.maker?.current_phase || !state?.maker?.current_plan) {
        return // No current plan to validate
      }

      const planPath = join(
        ctx.directory,
        ".planning",
        "phases",
        state.maker.current_phase,
        `${state.maker.current_plan}-PLAN.md`
      )

      if (!existsSync(planPath)) return

      const planContent = readFileSync(planPath, "utf-8")
      const incompleteTasks = extractIncompleteTasks(planContent)

      if (incompleteTasks.length > 0) {
        const toolContext = buildToolContext(toolName, "modify", resolvedPath)
        const planResult = parsePlanFile(planPath)
        logToFile(ctx, {
          type: "hook_block",
          session: sessionId,
          hook: "plan-completion-guard",
          rule: "PLAN-001: all-tasks-complete",
          phase: state.maker.current_phase,
          plan: state.maker.current_plan,
          message: `Incomplete tasks: ${incompleteTasks.join(", ")}`,
          file: resolvedPath,
          violation: {
            rule_id: "PLAN-001",
            expected: "All tasks in plan marked complete",
            actual: `${incompleteTasks.length} tasks incomplete: ${incompleteTasks.slice(0, 3).join(", ")}${incompleteTasks.length > 3 ? "..." : ""}`,
          },
          tool_context: toolContext,
          state_context: {
            execution_mode: state.execution_mode,
            current_status: state.status,
            plan_tasks_total: planResult?.tasks.length,
            plan_tasks_completed: planResult?.tasks.filter(t => t.completed).length,
          },
        })
        throw new Error(PLAN_INCOMPLETE_MESSAGE(incompleteTasks))
      }
    },
  }
}

// ============================================================================
// Hook 5: Todo Continuation Enforcer
// ============================================================================

interface TodoContinuationState {
  sessionsWithTodos: Map<string, { todos: string[]; lastCheck: number }>
  maxConsecutiveFailures: number
  consecutiveFailures: Map<string, number>
}

const MAX_CONSECUTIVE_FAILURES = 3

function createTodoContinuationEnforcerHook(): Hooks {
  const state: TodoContinuationState = {
    sessionsWithTodos: new Map(),
    maxConsecutiveFailures: MAX_CONSECUTIVE_FAILURES,
    consecutiveFailures: new Map(),
  }

  return {
    "tool.execute.after": async (input, output) => {
      const toolName = input.tool?.toLowerCase()
      if (toolName !== "todowrite" || !input.sessionID) return

      // Parse todo items from output
      const outputStr = typeof output.output === "string" ? output.output : ""
      const incompleteTodos = extractIncompleteTodos(outputStr)

      if (incompleteTodos.length > 0) {
        state.sessionsWithTodos.set(input.sessionID, {
          todos: incompleteTodos,
          lastCheck: Date.now(),
        })
      } else {
        state.sessionsWithTodos.delete(input.sessionID)
      }
    },
    event: async ({ event }) => {
      if (event.type === "session.deleted") {
        const props = event.properties as { info?: { id?: string } } | undefined
        const sessionID = props?.info?.id
        if (sessionID) {
          state.sessionsWithTodos.delete(sessionID)
          state.consecutiveFailures.delete(sessionID)
        }
      }
    },
  }
}

function extractIncompleteTodos(output: string): string[] {
  const incompleteTodos: string[] = []

  // Match patterns like "- [ ] task" or "* [ ] task"
  const regex = /^[*\-]\s*\[\s*\]\s*(.+)$/gm
  let match

  while ((match = regex.exec(output)) !== null) {
    incompleteTodos.push(match[1].trim())
  }

  return incompleteTodos
}

// ============================================================================
// Hook 6: Decision Logger (tool.execute.after)
// ============================================================================

function createDecisionLoggerHook(ctx: PluginInput): Hooks {
  return {
    "tool.execute.after": async (input, output) => {
      const toolName = input.tool?.toLowerCase()
      if (!toolName) return

      const sessionId = input.sessionID || "unknown"
      const argsRecord = asRecord(output.args)
      const args = argsRecord as GuardArgs | undefined

      // Get state context
      const stateContext = buildStateContext(ctx)

      // Infer decision
      const decision = inferDecision(toolName, args, sessionId, stateContext)

      // Build tool invocation record
      const targetPath = getPathFromArgs(args)
      const startTime = output.startTime ? new Date(output.startTime).getTime() : Date.now()
      const endTime = Date.now()
      const duration = endTime - startTime

      const toolInvocation = {
        tool: toolName,
        target: targetPath,
        operation: getOperationType(toolName, targetPath),
        success: !output.error,
        duration_ms: duration,
      }

      // Build context snapshot
      const contextSnapshot = {
        recent_hook_blocks: getRecentHookBlocks(sessionId).slice(0, 3),
        files_in_scope: getFilesInScope(ctx),
        execution_mode: stateContext.execution_mode,
      }

      // Log decision
      logDecision(ctx, {
        type: "decision",
        session: sessionId,
        phase: stateContext.current_status,
        plan: undefined,
        task: undefined,
        decision,
        tool_invocation: toolInvocation,
        context_snapshot: contextSnapshot,
      })
    },
    event: async ({ event }) => {
      if (event.type === "session.deleted") {
        const props = event.properties as { info?: { id?: string } } | undefined
        const sessionID = props?.info?.id
        if (sessionID) {
          recentHookBlocks.delete(sessionID)
        }
      }
    },
  }
}

function getOperationType(tool: string, targetPath?: string): string {
  if (tool === "read") return "read"
  if (tool === "write") return targetPath && existsSync(targetPath) ? "modify" : "create"
  if (tool === "edit") return "modify"
  if (tool === "bash") return "execute"
  if (tool === "grep" || tool === "glob") return "search"
  return "unknown"
}

function getFilesInScope(ctx: PluginInput): string[] {
  const files: string[] = []
  try {
    const statePath = join(ctx.directory, ".planning", "STATE.md")
    if (existsSync(statePath)) {
      const state = parseStateFile(statePath)
      if (state?.maker?.current_phase && state?.maker?.current_plan) {
        const planPath = join(
          ctx.directory,
          ".planning",
          "phases",
          state.maker.current_phase,
          `${state.maker.current_plan}-PLAN.md`
        )
        if (existsSync(planPath)) {
          const planResult = parsePlanFile(planPath)
          if (planResult) {
            for (const task of planResult.tasks) {
              if (task.file) files.push(task.file)
            }
          }
        }
      }
    }
  } catch {
    // Ignore errors
  }
  return files
}

// ============================================================================
// Plugin Export
// ============================================================================

export const GuardPlugin: Plugin = async (ctx) => {
  const tracker = createReadPermissionTracker(ctx)

  return {
    // File safety
    ...createWriteExistingFileGuardHook(ctx, tracker),

    // Workflow enforcement
    ...createArchitectFirstGuardHook(ctx),
    ...createPlanCompletionGuardHook(ctx),

    // Continuity
    ...createTodoContinuationEnforcerHook(),

    // Decision logging
    ...createDecisionLoggerHook(ctx),
  }
}

export default GuardPlugin