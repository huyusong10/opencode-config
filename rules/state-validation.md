## STATE.md Validation

Before reading or updating STATE.md, validate required fields.

### Required Fields

| Field | Valid Values | Validation |
|-------|-------------|------------|
| `阶段` / `current_phase` | Phase identifier | Must match an existing `.planning/phases/` directory |
| `计划` / `current_plan` | Plan identifier | Must reference an existing PLAN.md or archived PLAN.md |
| `状态` / `status` | `ready`, `in_progress`, `completed`, `blocked` | Must be one of these four values |
| `最后活动` / `last_activity` | ISO timestamp | Must be parseable as a valid date |

### Validation Failure

If any field fails validation:
1. Report the specific field and actual value
2. Stop execution immediately
3. Wait for user to fix the inconsistency

### Inconsistency Detection

| Signal | Meaning | Recovery |
|--------|---------|----------|
| `status: in_progress` but no matching active plan | Interrupted session | Read PLAN.md to find last completed task, reset status |
| PLAN.md has partial `[x]` tasks but no archive | Interrupted mid-plan | Resume from last completed task |
| Archive has PLAN.md without SUMMARY.md | Interrupted during archive | Generate SUMMARY.md from archived PLAN.md |
| `current_plan` references non-existent file | Stale state | Check archive, update to next plan or mark completed |
