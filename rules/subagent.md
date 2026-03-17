## When to Use Subagent

| Scenario | Criteria | Example |
|----------|----------|---------|
| Independent subtask | Clear boundaries, can complete independently | `@researcher` research technical feasibility |
| Context isolation | Needs extensive exploration, avoid polluting main context | `@coder` batch execute independent tasks |
| Specialized role | Requires domain knowledge or specific role | `@committer` handle git commits |
| Read-only review | Needs impartial third-party perspective | `@system-reviewer` end-of-plan delivery gate |

## When to Handle Directly

| Scenario | Criteria | Example |
|----------|----------|---------|
| Simple operation | 1-3 steps to complete | Read single file, edit config |
| Real-time feedback | User needs to see live process | Interactive debugging, step-by-step explanation |
| Context dependency | Task needs full conversation context | Complex cross-file refactoring decisions |

## Decision Flow

```
Task requires > 5 tool calls?
    ↓ Yes
Task has clear boundaries and can complete independently?
    ↓ Yes
Needs context isolation or specialized role?
    ↓ Yes
→ Use Subagent
```

## Available Subagents

| Subagent | Folder | Role |
|----------|--------|------|
| `@coder` | executor/ | Write/modify code per specification |
| `@tester` | executor/ | Write and run tests |
| `@debugger` | executor/ | Systematic bug diagnosis and fixes |
| `@committer` | executor/ | Atomic git commits with smart messages |
| `@fluid-worker` | executor/ | Zero-persona generic executor for Fluid |
| `@researcher` | designer/ | Research technologies and patterns |
| `@system-designer` | designer/ | Multi-perspective design orchestrator |
| `@system-reviewer` | reviewer/ | End-of-plan delivery gate (routes to specialists) |
