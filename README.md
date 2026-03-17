# OpenCode 配置仓库

AI 编程助手配置，提供多层级杠铃工作流：两端并发发散，中间串行执行。

## 安装

```bash
curl -fsSL https://raw.githubusercontent.com/huyusong10/opencode-config/main/install.sh | bash
```

---

## Agent 对比

| Agent | 适合场景 | 两端角色 | 中间执行 |
|-------|----------|----------|----------|
| `@fluid` | 任意任务，角色完全自主 | LLM 动态生成 | 直接工具调用 |
| `@janus` | 中等复杂度，快速启动 | system-designer / system-reviewer | 已有 subagent |
| `@maestro` | 复杂多阶段项目（推荐） | design team / reviewer team | 已有 subagent + 状态文件 |
| `@architect` + `@maker` | 规划与执行需要分离时 | design team / reviewer team | 已有 subagent + 状态文件 |

---

## Fluid

最极简的杠铃：角色、视角数量、审查维度全部由 Fluid 根据当前任务自主决定。
中间直接调用工具，不经过任何具名 subagent。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Fluid Workflow                                    │
├──────────────────────────┬──────────────────────────┬───────────────────────┤
│      LEFT (expand)       │     MIDDLE (execute)     │     RIGHT (verify)    │
│                          │                          │                       │
│ Fluid self-decides:      │ Direct tool calls only:  │ Fluid self-decides:   │
│ - how many perspectives  │ read / write / edit      │ - which dimensions    │
│ - what each one covers   │ bash (test, lint, build) │   to review based on  │
│                          │ git commit via bash      │   what changed        │
│ Spawns N parallel tasks: │ ralph loop (no cap)      │                       │
│ @fluid-worker × N        │                          │ Spawns N parallel     │
│ (roles defined inline,   │ No named subagents.      │ @fluid-worker × N     │
│  not in agent files)     │ All tools direct.        │ delivery_gate inline  │
└──────────────────────────┴──────────────────────────┴───────────────────────┘
```

**出口**：Fluid 自己聚合所有审查结果，Fatal = 0 AND Important = 0 才交付。

---

## Janus

固定路由杠铃：两端由 system 角色统一调度，中间复用已有 subagent。无状态文件。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Janus Workflow                                    │
├──────────────────────────┬──────────────────────────┬───────────────────────┤
│      LEFT (expand)       │     MIDDLE (execute)     │     RIGHT (verify)    │
│                          │                          │                       │
│ @system-designer         │ Delegates to subagents:  │ @system-reviewer      │
│  Step 0: spawn           │ @coder → @tester         │  auto-routes:         │
│    @researcher if needed │ fail? → @debugger        │  planning / normal /  │
│  Then 4 designers in     │ @committer               │  arch_change /        │
│  parallel:               │ ralph loop (no cap)      │  small_change         │
│  arch/ux/risk/impl       │                          │                       │
│  → <design-synthesis>    │ No .planning/ files.     │  → delivery_gate      │
│  → task list             │ State in context only.   │  Fatal/Important=0    │
└──────────────────────────┴──────────────────────────┴───────────────────────┘
```

**出口**：`@system-reviewer` 输出 `delivery_gate: pass`，循环直到通过。

---

## Maestro

全量状态驱动 Agent，自动检测 `.planning/` 状态并切换规划 / 执行模式。
内部行为等同于 Architect + Maker 的顺序组合，无需手动切换。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Maestro Workflow                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Read .planning/STATE.md → decide mode:                                     │
│                                                                             │
│  .planning/ missing     ──▶  Planning Mode  (identical to Architect below)  │
│  status: planning       ──▶  Planning Mode  (continue)                      │
│  status: ready          ──▶  Execution Mode (identical to Maker below)      │
│  status: in_progress    ──▶  Execution Mode (resume interrupted session)    │
│  status: completed      ──▶  Check ROADMAP.md for next phase                │
│  status: blocked        ──▶  Report blockers to user, wait                  │
│                                                                             │
│  Lifecycle:                                                                 │
│  planning ──▶ ready ──▶ in_progress ──▶ completed ──▶ (next phase / done)   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Architect + Maker

规划与执行分离，适合需要人工审查计划后再执行的场景。

### Architect

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Architect Workflow                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Phase 1  Exploration                                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Clarifying questions · codebase context · user stories · edge cases   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                       ↓                                     │
│  Phase 2  Research                                                          │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ L0: skip · L1: context7 · L2+: pass research needs to system-designer │  │
│  │ (system-designer Step 0 spawns @researcher internally if needed)      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                       ↓                                     │
│  Phase 2.5  Design Team  (barbell LEFT — skip for simple tasks)             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ @system-designer → 4 parallel: arch/ux/risk/impl designers            │  │
│  │ Collect <design-synthesis> → Goal-Backward inputs                     │  │
│  │ Skip if: single-file ≤20 lines / config/docs/typo / no arch choice    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                       ↓                                     │
│  Phase 3  Goal-Backward Planning                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Goal → Observable Truths → Required Artifacts → Key Links             │  │
│  │ Output: PROJECT.md · REQUIREMENTS.md · ROADMAP.md · STATE.md          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                       ↓                                     │
│  Phase 4  Wave Planning                                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Dependency analysis · wave grouping (parallel vs serial tasks)        │  │
│  │ Create PLAN.md · recommend execution_mode · STATE.md = ready          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Maker

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Maker Workflow                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Phase 1  Init                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Load STATE.md · consistency check · parse PLAN.md · build wave graph  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                       ↓                                     │
│  Phase 2  Mode Dispatch                                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ ralph:    @coder → @tester → (fail? @debugger → loop)                 │  │
│  │ tdd:      RED(@tester) → GREEN(@coder) → REFACTOR(@coder)             │  │
│  │ standard: @coder → done                                               │  │
│  │ debug:    @debugger → @tester → done                                  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                       ↓                                     │
│  Phase 3  Task Execution                                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Per task: delegate to subagent → verify → @committer commit           │  │
│  │ Update STATE.md · archive completed PLAN.md                           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                       ↓                                     │
│  Phase 4  System Review  (barbell RIGHT — mandatory, no skip)               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ @system-reviewer → parallel specialists → <system-advisory>           │  │
│  │ delivery_gate: pass → archive  ·  fail → fix loop (no cap)            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 目录结构

```
opencode-config/
├── opencode.jsonc              # Provider, model, plugins, instructions
├── agent/
│   ├── fluid.md                # Fluid — fully dynamic barbell
│   ├── janus.md                # Janus — fixed-role barbell
│   ├── maestro.md              # Maestro — full pipeline (recommended)
│   ├── architect.md            # Architect — planning only
│   ├── maker.md                # Maker — execution only
│   ├── designer/               # Planning left end — design & research
│   │   ├── system-designer.md  # Orchestrator: spawns 4 designers + researcher
│   │   ├── arch-designer.md
│   │   ├── ux-designer.md
│   │   ├── risk-designer.md
│   │   ├── impl-designer.md
│   │   └── researcher.md       # Technology research (routed via system-designer)
│   ├── executor/               # Middle execution — implement, test, debug, commit
│   │   ├── coder.md
│   │   ├── tester.md
│   │   ├── debugger.md
│   │   ├── committer.md
│   │   └── fluid-worker.md     # Zero-persona executor for Fluid
│   └── reviewer/               # Review right end — delivery gate
│       ├── system-reviewer.md  # Orchestrator: routes to specialists
│       ├── arch-reviewer.md
│       ├── security-reviewer.md
│       ├── perf-reviewer.md
│       ├── test-reviewer.md
│       ├── maintain-reviewer.md
│       ├── api-reviewer.md
│       ├── impact-reviewer.md
│       └── qa-reviewer.md
├── rules/                      # Auto-loaded rules for all agents
├── plugin/                     # Opencode plugins
└── .planning/                  # Runtime: project plan (generated)
```
