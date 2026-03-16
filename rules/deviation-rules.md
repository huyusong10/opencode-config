## Deviation Rules (偏差处理规则)

执行计划时，必然会发现计划中未预见的工作。

### 核心原则

计划是指导，不是枷锁。自动修复小问题，询问用户大变更。记录所有偏差到 SUMMARY.md。

### 自动修复规则 (Rules 1-3) - 无需用户确认

| Rule | Trigger | Examples | Action |
|------|---------|----------|--------|
| **1** | Code doesn't work | Logic errors, type errors, null pointer, race conditions | @debugger auto-fix |
| **2** | Missing critical functionality | Error handling, validation, auth, null checks, indexing | @coder auto-add |
| **3** | Blocking issues | Missing deps, type mismatch, import errors, env vars | Auto-resolve |

**Critical functionality = correctness, security, performance requirements (not feature requirements).**

#### Rules 1-3 Handling Flow

1. Discover → fix immediately
2. Add/update tests (if applicable)
3. Verify fix works
4. Continue current task
5. Record in SUMMARY.md: `[Rule N - Type] description`

### User Escalation (Rule 4) - Must Ask User

| Trigger | Examples | Action |
|---------|----------|--------|
| Architecture changes | New DB tables, schema changes, new service layers, framework switch | **STOP** → checkpoint |
| External dependencies | API keys, third-party services, paid services | **STOP** → checkpoint |
| Unclear requirements | Multiple valid approaches, no clear choice | **STOP** → checkpoint |

### Priority

1. Rule 4 applies? → **STOP** (architecture decision)
2. Rules 1-3 apply? → auto-fix
3. Genuinely uncertain? → Rule 4 (ask user)

### Boundary Cases

| Situation | Rule |
|-----------|------|
| Missing validation | Rule 2 (security) |
| Null crash | Rule 1 (bug) |
| Need new DB table | Rule 4 (architecture) |
| Need new field | Rule 1 or 2 (context-dependent) |
| Performance issue | Rule 1 (functional) or Rule 4 (redesign) |

**Heuristic:** "Does this affect correctness, security, or task completion?"
- **Yes** → Rules 1-3
- **Maybe** → Rule 4

### Scope Boundary

**Only auto-fix issues directly caused by the current task.**

Pre-existing issues: record to `deferred-items.md`, do NOT fix, do NOT re-run builds hoping they disappear.

### Fix Attempt Limit

After **3 failed auto-fix attempts** on a single task:
- **STOP** fixing
- Record "Deferred Issues" in SUMMARY.md
- Continue to next task (or return checkpoint if blocked)

### Deviation Recording

In SUMMARY.md, use format: `[Rule N - Type] Brief description` with fields: Found during, Issue, Fix, Files modified, Commit.
