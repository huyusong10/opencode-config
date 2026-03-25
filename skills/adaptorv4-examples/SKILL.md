---
name: adaptorv4-examples
description: |
  Task type examples for Adaptor v4 workflow. Load this skill when:
  - You need to classify a task type (execution/exploration/discovery/composite)
  - You need reference examples for OODA loops
  - You need examples of conversational iteration patterns
  
  Examples include DEPTH 1-5 scenarios with full OODA cycles.
---

# Adaptor v4 Task Type Examples

This skill provides reference examples for each task type in the Adaptor v4 workflow.

## Example Files

| Task Type | File | Description |
|-----------|------|-------------|
| Execution | `examples/execution.md` | Feature implementation, code fixes, config deployment |
| Exploration | `examples/exploration.md` | Tech selection, architecture design, root cause analysis |
| Discovery | `examples/discovery.md` | Business analysis, problem discovery, data mining |
| Composite | `examples/composite.md` | Multi-phase tasks with stage dependencies |

## How to Use

1. Classify task type based on: **Is goal clear? Is path clear?**
2. Load corresponding example file using `read` tool
3. Follow the OODA loop pattern from the example
4. Apply conversational iteration when encountering key discoveries

## Key Patterns

### Conversational Iteration

Child agents can pause and report when discovering:
- Premise failure (assumptions proved wrong)
- Dependency discovery (affects other parallel tasks)
- Blocking request (needs additional info/permission)
- Path divergence (found better approach)

### Cross-Task Impact Assessment

When receiving a report, parent agent should:
1. Evaluate impact on other parallel tasks
2. Apply conservative serialization (don't interrupt running tasks)
3. Reuse task_id to continue conversation
4. Adjust subsequent tasks as needed