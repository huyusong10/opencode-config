## STATE.md Validation

Before reading or updating STATE.md, validate required fields.

### Required Fields

| Field | Valid Values | Validation |
|-------|-------------|------------|
| `阶段` / `current_phase` | Phase identifier | Must match an existing `.planning/phases/` directory (empty during planning) |
| `计划` / `current_plan` | Plan identifier | Must reference an existing PLAN.md or archived PLAN.md (empty during planning) |
| `状态` / `status` | `planning`, `ready`, `in_progress`, `completed`, `blocked` | Must be one of these values |
| `最后活动` / `last_activity` | ISO timestamp | Must be parseable as a valid date |

### Status Lifecycle

```
planning → ready → in_progress → completed → (next phase: ready or done)
                ↑                ↓
            blocked ←───────────┘
```

### Validation Failure

If any field fails validation:
1. Report the specific field and actual value
2. Suggest: delete `.planning/` to restart, or manually fix the issue
3. Stop execution, wait for user decision

### Inconsistency Detection

| Signal | Meaning | Recovery |
|--------|---------|----------|
| `status: in_progress` but no matching active plan | Interrupted session | Read PLAN.md to find last completed task, reset status |
| PLAN.md has partial `[x]` tasks but no archive | Interrupted mid-plan | Resume from last completed task |
| Archive has PLAN.md without SUMMARY.md | Interrupted during archive | Generate SUMMARY.md from archived PLAN.md |
| `current_plan` references non-existent file | Stale state | Check archive, update to next plan or mark completed |
