## Checkpoint System

When tasks require user intervention, return structured checkpoint messages.

### Core Principle

```
Automation-First: If Claude can do it via CLI/API, Claude MUST do it.
Checkpoints verify AFTER automation, not replace automation.
```

### Checkpoint Types

| Type | Purpose | Frequency | Handling |
|------|---------|-----------|----------|
| `human-verify` | Visual/functional verification | 90% | Pause after automation complete |
| `decision` | Implementation choice | 9% | Provide options for user |
| `human-action` | Cannot be automated | 1% | True manual step |
| `auth-gate` | Auth/credential issues | Dynamic | User provides credentials |

### Automation-First Judgment

| Operation | Automation | Needs Checkpoint? |
|-----------|-----------|-------------------|
| Deploy to Vercel | `vercel --yes` | No |
| Create database | Provider CLI | No |
| Run build | `npm run build` | No |
| Verify UI functionality | Requires human click | Yes: `human-verify` |
| Choose tech approach | Requires human decision | Yes: `decision` |
| Click email verification | No API available | Yes: `human-action` |
| Input API Key | Requires human | Yes: `auth-gate` |

### Processing Flow

```
Checkpoint reached → Classify type → Execute per type:

human-verify: Ensure automation done → provide verification steps → wait "Pass" or issue description
decision:     Provide options table with pros/cons → wait user selection → continue per choice
human-action: Describe steps + verification command → wait "Done"
auth-gate:    Identify credentials needed → provide obtain steps → wait "Configured"

→ Resume execution
```

### Auth Gates

Auth errors are gates, not failures. Signals: "Not authenticated", "Unauthorized", "401", "403", "Please run {tool} login", "Set {ENV_VAR}".

Handle: identify credential → provide steps to obtain → provide verification command → wait for user.

### Checkpoint Return Format

```markdown
## CHECKPOINT REACHED

**Type:** {human-verify|decision|human-action|auth-gate}
**Plan:** {phase}-{plan}
**Progress:** {completed}/{total} tasks complete

### Context
[What was done / what needs to happen]

### Action Required
- human-verify: List verification steps + expected result
- decision: Options table (Option | Pros | Cons) + recommendation
- human-action: Manual steps + verification command
- auth-gate: Credential name + obtain steps + config command

### Awaiting
[What response is expected from user]
```

### Auto-Mode Support

| Checkpoint Type | Auto-Mode Behavior |
|----------------|-------------------|
| `human-verify` | Auto-pass, log it |
| `decision` | Choose recommended option |
| `human-action` | Normal STOP (cannot automate) |
| `auth-gate` | Normal STOP (needs credentials) |

### Resume Protocol

After user responds: verify response → process result (pass/issue/choice) → continue next task.
