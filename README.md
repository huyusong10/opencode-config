# OpenCode 配置仓库

个人 OpenCode AI 编程助手配置，聚焦于**双前端 Agent 架构**和**Hook 强制约束机制**。

## 安装

### 一键安装 (macOS/Linux)

```bash
# 复制模式（默认，独立安装，不会与现有配置冲突）
curl -fsSL https://raw.githubusercontent.com/huyusong10/opencode-config/main/install.sh | bash

# 软链接模式（仅用于调试，可能导致配置冲突）
curl -fsSL https://raw.githubusercontent.com/huyusong10/opencode-config/main/install.sh | bash -s -- --link
```

### 手动安装

```bash
# macOS/Linux - 复制模式（默认）
git clone https://github.com/huyusong10/opencode-config.git ~/opencode-config && cd ~/opencode-config && ./install.sh

# macOS/Linux - 软链接模式（仅用于调试）
git clone https://github.com/huyusong10/opencode-config.git ~/opencode-config && cd ~/opencode-config && ./install.sh --link
```

### 更新配置

```bash
# 复制模式：重新运行安装脚本
curl -fsSL https://raw.githubusercontent.com/huyusong10/opencode-config/main/install.sh | bash

# 软链接模式：git pull 更新（仅用于调试）
cd ~/opencode-config && git pull
```

---

## 核心架构

### 双前端模式

采用 **Architect + Maker** 双前端架构，清晰分离规划与执行：

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              User Request                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Architect                                         │
│                                                                             │
│  Responsibilities: Understand requirements, design solution, create plan    │
│  Outputs: .planning/ directory (PROJECT.md, REQUIREMENTS.md, etc.)          │
│  Delegates: @researcher for technical research                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Maker                                           │
│                                                                             │
│  Responsibilities: Execute plan, coordinate subagents, manage state         │
│  Modes: ralph | tdd | standard | spike | debug | refactor | migrate         │
│  Coordinates: @coder, @tester, @debugger, @reviewer, @researcher,           │
│               @committer                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 功能型 Subagent

| Subagent | 职责 | 工具权限 |
|----------|------|---------|
| @coder | 根据规格说明实现代码 | 读写 |
| @tester | 编写和运行测试验证实现 | 读写 + PTY |
| @debugger | 系统性诊断和修复 bug | 读写 + PTY |
| @reviewer | 审查代码正确性和质量 | 只读 |
| @researcher | 研究技术、模式和解决方案 | 只读 |
| @committer | 原子化 git 提交 | 只读 + bash |

### 执行模式选择

由 Architect 在规划阶段推荐，Maker 执行：

| 模式 | 使用时机 | 流程 |
|------|----------|------|
| **ralph** (默认) | 大多数开发任务 | @coder → @tester → 循环直到通过 |
| **tdd** | 业务逻辑、算法、API | RED → GREEN → REFACTOR |
| **standard** | 简单配置、脚本、样式 | @coder → @reviewer → 完成 |
| **spike** | 技术验证、POC | @researcher → @coder → 完成 |
| **debug** | Bug 修复 | @debugger → @tester → 完成 |
| **refactor** | 代码改进 | @reviewer → @coder → @tester → 完成 |
| **migrate** | 版本/数据迁移 | @coder → @tester → 完成 |

---

## 工作流

### Architect 工作流

Architect 负责理解需求、设计解决方案并创建可执行的开发计划。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Architect Workflow                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Phase 1: Exploration                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ - Ask clarifying questions (What/Why/Who/Constraints)               │   │
│  │ - Collect project context (git status, tech stack)                  │   │
│  │ - Interactive requirement exploration (user stories, edge cases)    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     ↓                                       │
│  Phase 2: Research                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ - Level 0: Skip (follow existing patterns)                          │   │
│  │ - Level 1: Use context7 for quick validation                        │   │
│  │ - Level 2: Delegate to @researcher (choose between options)         │   │
│  │ - Level 3: Full research cycle (architecture decisions)             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     ↓                                       │
│  Phase 3: Planning                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ - Goal-Backward Methodology:                                        │   │
│  │   State goal -> Derive truths -> Derive artifacts                   │   │
│  │   -> Derive connections -> Identify key links                       │   │
│  │ - Create .planning/ directory structure:                            │   │
│  │   PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     ↓                                       │
│  Phase 4: Phase Planning                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ - Dependency analysis and Wave grouping (parallel vs serial)        │   │
│  │ - Create phases/[phase-name]/:                                      │   │
│  │   CONTEXT.md (phase decisions), PLAN.md (execution plan)            │   │
│  │ - Recommend execution mode (ralph/tdd/standard/spike/debug/...)     │   │
│  │ - Set STATE.md status = ready                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     ↓                                       │
│  Output: .planning/ ready for Maker execution                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Maker 工作流

Maker 负责执行 Architect 创建的计划，协调 subagent 并管理状态。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Maker Workflow                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Phase 1: Initialization                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ - Load .planning/STATE.md                                           │   │
│  │ - Parse current PLAN.md (execution_mode, wave, tasks)               │   │
│  │ - Build Wave execution graph (parallel/serial grouping)             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     ↓                                       │
│  Phase 2: Mode Dispatch                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Coordinate subagents based on execution_mode:                       │   │
│  │                                                                     │   │
│  │ ralph:   @coder -> @tester -> (pass?) -> done / @debugger -> loop   │   │
│  │ tdd:     RED(@tester) -> GREEN(@coder) -> REFACTOR(@reviewer)       │   │
│  │ standard: @coder -> @reviewer -> done                               │   │
│  │ spike:   @researcher -> @coder -> done                              │   │
│  │ debug:   @debugger -> @tester -> done                               │   │
│  │ refactor: @reviewer -> @coder -> @tester -> done                    │   │
│  │ migrate: @coder -> @tester -> done                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     ↓                                       │
│  Phase 3: Task Execution                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ For each task:                                                      │   │
│  │ - Prepare context -> Delegate to subagent -> Two-stage review       │   │
│  │   Stage 1: Spec Compliance, Stage 2: Code Quality                   │   │
│  │ - Verify completion -> @committer commit                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     ↓                                       │
│  Phase 4: State Management                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ - Update STATE.md (current position, progress, metrics)             │   │
│  │ - Update ROADMAP.md (phase completion status)                       │   │
│  │ - Update REQUIREMENTS.md (mark requirements complete)               │   │
│  │ - Archive completed PLAN.md to archive/                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     ↓                                       │
│  Phase 5: Verification                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ - Run all tests (unit/integration/e2e)                              │   │
│  │ - Check quality gates (lint/typecheck/build)                        │   │
│  │ - Verify acceptance criteria                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Debugger 工作流

当遇到 bug、测试失败或意外行为时，使用 @debugger 进行系统性调试。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Debugger Workflow                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Phase 1: Root Cause Investigation                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ - Read error messages (full stack trace)                            │   │
│  │ - Reproduce the issue reliably                                      │   │
│  │ - Check recent changes (git diff, git log)                          │   │
│  │ - Multi-component systems: collect boundary evidence                │   │
│  │ - Trace data flow to the source                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     ↓                                       │
│  Phase 2: Pattern Analysis                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ - Find working example code                                         │   │
│  │ - Compare with reference implementation                             │   │
│  │ - Identify differences                                              │   │
│  │ - Understand dependencies                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     ↓                                       │
│  Phase 3: Hypothesis & Testing                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ - Form single hypothesis ("I think X is root cause because Y")      │   │
│  │ - Minimal verification test                                         │   │
│  │ - Valid -> Phase 4 / Invalid -> new hypothesis                      │   │
│  │ - 3+ failures -> Question the architecture                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     ↓                                       │
│  Phase 4: Implementation                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ - Create failing test case (must have test before fix)              │   │
│  │ - Implement single fix (address root cause, not symptom)            │   │
│  │ - Verify fix works                                                  │   │
│  │ - Check for regressions                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Iron Rule: NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Skills

当前仅保留一个核心 Skill：

| Skill | 何时使用 |
|-------|----------|
| `ralph-loop` | 需要持续迭代直到任务真正完成的长任务 |

其他能力已整合到 Agent/Subagent 中：
- 需求探索 → architect.md
- TDD 流程 → maker.md
- 调试方法论 → debugger.md
- Git 提交 → @committer
- 外部研究 → @researcher

---

## 铁律

### 完成前验证

```
声明之前先求证，始终如此。

BEFORE claiming any status:
1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command
3. READ: Full output, check exit code
4. VERIFY: Does output confirm the claim?
5. ONLY THEN: Make the claim
```

### 调试铁律

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

### 提交铁律

- 每个提交应该是一个逻辑变更单元
- 永远不要提交密钥、API 密钥或凭据
- 完成每个任务后提交，而不是多个任务后才提交

---

## Hook 强制约束

采用 Hook 机制强制执行工作流程规范，无法绕过：

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Hook Enforcement Layer                               │
│                     (via composeHooks chaining)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Hook 1: write-existing-file-guard                                          │
│  Trigger: Write to existing files                                           │
│  Check: File must be read before write (per-session tracking)               │
│  Block: Prevent blind overwrites without prior read                         │
│                                                                             │
│  Hook 2: architect-first-guard                                              │
│  Trigger: Write/Edit source code files                                      │
│  Check: .planning/STATE.md exists with status = ready                       │
│  Block: Reject execution without Architect plan                             │
│                                                                             │
│  Hook 3: execution-mode-guard                                               │
│  Trigger: Same as above                                                     │
│  Check: execution_mode field exists in STATE.md                             │
│  Block: Reject execution without specified mode                             │
│                                                                             │
│  Hook 4: test-first-guard (TDD mode)                                        │
│  Trigger: Write implementation in TDD mode                                  │
│  Check: Corresponding test file exists                                      │
│  Block: Must write test before implementation                               │
│                                                                             │
│  Hook 5: plan-completion-guard                                              │
│  Trigger: Mark plan as complete                                             │
│  Check: All tasks completed + verified                                      │
│  Block: Reject marking partial work as complete                             │
│                                                                             │
│  Hook 6: todo-continuation-enforcer                                         │
│  Trigger: TodoWrite tool output                                             │
│  Check: Track incomplete todo items per session                             │
│                                                                             │
│  Hook 7: decision-logger                                                    │
│  Trigger: All tool executions (after)                                       │
│  Action: Log decisions, tool invocations, and context snapshots             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### STATE.md 必填字段

```yaml
## 当前位置
阶段: [phase-id]           # 必填
计划: [plan-id]            # 必填
状态: ready                 # 必填: ready 才能执行

## 执行模式（必填）
execution_mode: tdd        # 必填: tdd | ralph | standard | debug | refactor | migrate
```

---

## 任务日志系统

每个任务执行自动记录日志，用于复盘和优化：

### 日志目录

```
.planning/.logs/
├── sessions/[session-id]/*.jsonl  # 按会话
├── daily/YYYY-MM-DD.jsonl         # 按日期
└── tasks/[phase-plan].jsonl       # 按任务
```

### 使用方式

```bash
# 记录任务开始
npx tsx scripts/task-logger.ts task-start \
  --session abc123 --phase 01-foundation --plan 01-01 \
  --task "Task 1: Create auth types"

# 记录任务完成
npx tsx scripts/task-logger.ts complete \
  --session abc123 --task "Task 1" \
  --files "src/types/auth.ts" --duration 300000

# 生成会话摘要
npx tsx scripts/task-logger.ts summary --session abc123
```

---

## 目录结构

```
opencode-config/
├── opencode.json          # 主配置（provider、model、mcp）
├── tui.json               # TUI 主题配置
├── AGENTS.md              # AI 行为偏好
├── install.sh             # 安装脚本
├── agent/
│   ├── architect.md       # 架构师 Agent
│   ├── maker.md           # 制造者 Agent
│   └── subagent/          # 功能型子代理
│       ├── coder.md
│       ├── tester.md
│       ├── debugger.md
│       ├── reviewer.md
│       ├── researcher.md
│       └── committer.md
├── command/               # 自定义 Command 定义
├── skills/
│   └── ralph-loop/        # Ralph Loop 技能
├── plugin/
│   ├── guard.ts           # Hook 强制约束插件
│   └── ralph.ts           # Ralph Loop 插件
├── rules/                 # 补充规则
│   ├── ascii-diagrams.md
│   ├── codeact.md
│   └── subagent.md
└── scripts/
    └── task-logger.ts     # 任务日志记录脚本
```

---

## 设计理念

### 职责分离

每个 Agent/Subagent 只做一件事：
- `architect` 只规划，不碰代码
- `maker` 只协调，不直接实现
- `@coder` 只实现，不修改规范
- `@reviewer` 只审查，只读权限

**价值**：通过只读约束保证审查的公正性，通过单一职责降低错误率。

### Agent-Skill 依赖原则

```
Agent 可以依赖 Skill，但 Skill 不能依赖 Agent
```

- **Skill 是被动资源**：提供方法论和模板，被 Agent 加载使用
- **Agent 是主动执行者**：调用 Skill 获取能力，但不被 Skill 定义
- **单向依赖保证解耦**：Skill 可独立演化，不破坏 Agent 结构