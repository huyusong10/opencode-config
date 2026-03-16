## When to Use Subagent

| Scenario | Criteria | Example |
|----------|----------|---------|
| Independent subtask | Clear boundaries, can complete independently | `@researcher` research technical feasibility |
| Context isolation | Needs extensive exploration, avoid polluting main context | `@coder` batch execute independent tasks |
| Specialized role | Requires domain knowledge or specific role | `@committer` handle git commits |
| Read-only review | Needs impartial third-party perspective | `@reviewer` verify implementation matches spec |

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

| Subagent | Role |
|----------|------|
| `@coder` | Write/modify code per specification |
| `@tester` | Write and run tests |
| `@debugger` | Systematic bug diagnosis and fixes |
| `@reviewer` | Code review for correctness and quality |
| `@researcher` | Research technologies and patterns |
| `@committer` | Atomic git commits with smart messages |
