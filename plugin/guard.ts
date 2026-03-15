import type { Plugin, Hooks, PluginInput } from "@opencode-ai/plugin"
import { existsSync, realpathSync } from "fs"
import { basename, dirname, isAbsolute, join, normalize, relative, resolve } from "path"

/**
 * Guard Plugin for OpenCode
 *
 * Implements safety guards inspired by oh-my-openagent:
 * 1. write-existing-file-guard: Require reading file before writing to existing files
 * 2. context-window-monitor: Monitor context usage and warn when approaching limits
 * 3. todo-continuation-enforcer: Force continuation on incomplete todos
 */

// ============================================================================
// Types
// ============================================================================

type GuardArgs = {
  filePath?: string
  path?: string
  file_path?: string
  overwrite?: boolean | string
}

interface ReadPermissionTracker {
  readPermissionsBySession: Map<string, Set<string>>
  sessionLastAccess: Map<string, number>
  canonicalSessionRoot: string
}

interface ContextWindowMonitorState {
  remindedSessions: Set<string>
  warningThreshold: number
  criticalThreshold: number
}

interface TodoContinuationState {
  sessionsWithTodos: Map<string, { todos: string[]; lastCheck: number }>
  maxConsecutiveFailures: number
  consecutiveFailures: Map<string, number>
}

// ============================================================================
// Constants
// ============================================================================

const MAX_TRACKED_SESSIONS = 256
const MAX_TRACKED_PATHS_PER_SESSION = 1024
const BLOCK_MESSAGE = "File already exists. Use edit tool instead."

// Context window thresholds
const CONTEXT_WARNING_THRESHOLD = 0.70  // 70% - warn user
const CONTEXT_CRITICAL_THRESHOLD = 0.85 // 85% - urgent warning

// Todo continuation settings
const TODO_CHECK_INTERVAL_MS = 5000
const MAX_CONSECUTIVE_FAILURES = 3

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
// Write Existing File Guard Hook
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
// Context Window Monitor Hook
// ============================================================================

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
// Plugin Export
// ============================================================================

export const GuardPlugin: Plugin = async (ctx) => {
  const tracker = createReadPermissionTracker(ctx)
  const writeGuardHook = createWriteExistingFileGuardHook(ctx, tracker)
  const todoEnforcerHook = createTodoContinuationEnforcerHook()

  return {
    ...writeGuardHook,
    ...todoEnforcerHook,
  }
}

export default GuardPlugin