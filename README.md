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

### Maestro Agent（推荐）

**一键式调用：** 使用 `@maestro` 完成从规划到执行的全流程，无需手动切换 agent。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              User Request                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Maestro                                           │
│                                                                             │
│  State-Driven: 自动检测 STATE.md status 决定模式                            │
│  - .planning/ 不存在 → Planning Mode (创建规划)                             │
│  - status: ready → Execution Mode (执行计划)                                │
│  - status: in_progress → Resume Mode (恢复中断)                             │
│                                                                             │
│  温度 0.35 平衡创造力与确定性:                                               │
│  - Planning Mode: 创造性探索，广泛发散                                       │
│  - Execution Mode: 确定性执行，严格验证                                     │
│                                                                             │
│  Delegates: @coder, @tester, @debugger, @reviewer, @researcher, @committer  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 向后兼容

仍可单独使用：
- `@architect` - 仅规划，不执行
- `@maker` - 仅执行已有计划

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
│                        Architect Workflow                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Phase 1: Exploration                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ - Ask clarifying questions (What/Why/Who/Constraints)               │    │
│  │ - Collect project context (git status, tech stack)                  │    │
│  │ - Interactive requirement exploration (user stories, edge cases)    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     ↓                                       │
│  Phase 2: Research                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ - Level 0: Skip (follow existing patterns)                          │    │
│  │ - Level 1: Use context7 for quick validation                        │    │
│  │ - Level 2: Delegate to @researcher (choose between options)         │    │
│  │ - Level 3: Full research cycle (architecture decisions)             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     ↓                                       │
│  Phase 3: Planning                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ - Goal-Backward Methodology:                                        │    │
│  │   State goal -> Derive truths -> Derive artifacts                   │    │
│  │   -> Derive connections -> Identify key links                       │    │
│  │ - Create .planning/ directory structure:                            │    │
│  │   PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     ↓                                       │
│  Phase 4: Phase Planning                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ - Dependency analysis and Wave grouping (parallel vs serial)        │    │
│  │ - Create phases/[phase-name]/:                                      │    │
│  │   CONTEXT.md (phase decisions), PLAN.md (execution plan)            │    │
│  │ - Recommend execution mode (ralph/tdd/standard/spike/debug/...)     │    │
│  │ - Set STATE.md status = ready                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     ↓                                       │
│  Output: .planning/ ready for Maker execution                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Maker 工作流

Maker 负责执行 Architect 创建的计划，协调 subagent 并管理状态。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Maker Workflow                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Phase 1: Initialization                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ - Load .planning/STATE.md                                           │    │
│  │ - State consistency check: detect interrupted session               │    │
│  │ - Parse current PLAN.md (execution_mode, wave, tasks)               │    │
│  │ - Build Wave execution graph (parallel/serial grouping)             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     ↓                                       │
│  Phase 2: Mode Dispatch                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Coordinate subagents based on execution_mode:                       │    │
│  │                                                                     │    │
│  │ ralph:   @coder -> @tester -> (pass?) -> done / @debugger -> loop   │    │
│  │ tdd:     RED(@tester) -> GREEN(@coder) -> REFACTOR(@reviewer)       │    │
│  │ standard: @coder -> @reviewer -> done                               │    │
│  │ spike:   @researcher -> @coder -> done                              │    │
│  │ debug:   @debugger -> @tester -> done                               │    │
│  │ refactor: @reviewer -> @coder -> @tester -> done                    │    │
│  │ migrate: @coder -> @tester -> done                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     ↓                                       │
│  Phase 3: Task Execution                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ For each task:                                                      │    │
│  │ - Fast Path Check: ≤2 files, ≤20 lines, no architecture impact?    │    │
│  │   Yes -> Maker direct execute -> verify -> commit                   │    │
│  │   No  -> Delegate to subagent -> Two-stage review                   │    │
│  │ - Verify completion -> @committer commit                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     ↓                                       │
│  Phase 4: State Management                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ - Update STATE.md (current position, progress, metrics)             │    │
│  │ - Update ROADMAP.md (phase completion status)                       │    │
│  │ - Update REQUIREMENTS.md (mark requirements complete)               │    │
│  │ - Archive completed PLAN.md to archive/                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     ↓                                       │
│  Phase 5: Verification                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ - Run all tests (unit/integration/e2e)                              │    │
│  │ - Check quality gates (lint/typecheck/build)                        │    │
│  │ - Verify acceptance criteria                                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Debugger 工作流

当遇到 bug、测试失败或意外行为时，使用 @debugger 进行系统性调试。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Debugger Workflow                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Phase 1: Root Cause Investigation                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ - Read error messages (full stack trace)                            │    │
│  │ - Reproduce the issue reliably                                      │    │
│  │ - Check recent changes (git diff, git log)                          │    │
│  │ - Multi-component systems: collect boundary evidence                │    │
│  │ - Trace data flow to the source                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     ↓                                       │
│  Phase 2: Pattern Analysis                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ - Find working example code                                         │    │
│  │ - Compare with reference implementation                             │    │
│  │ - Identify differences                                              │    │
│  │ - Understand dependencies                                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     ↓                                       │
│  Phase 3: Hypothesis & Testing                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ - Form single hypothesis ("I think X is root cause because Y")      │    │
│  │ - Minimal verification test                                         │    │
│  │ - Valid -> Phase 4 / Invalid -> new hypothesis                      │    │
│  │ - 3+ failures -> Question the architecture                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     ↓                                       │
│  Phase 4: Implementation                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ - Create failing test case (must have test before fix)              │    │
│  │ - Implement single fix (address root cause, not symptom)            │    │
│  │ - Verify fix works                                                  │    │
│  │ - Check for regressions                                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
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

现在作为 Opencode 插件自动执行。在 `opencode.json` 中配置即可：

```json
  "plugin": [
    "./plugin/task-logger.ts"
  ]
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
│   ├── deep-explore-guide.ts   # 深度探索引导插件
│   ├── deep-explore-prompts.yaml
│   ├── ralph.ts                # Ralph Loop 插件
│   └── task-logger.ts          # 任务自动日志记录插件
├── rules/                 # 补充规则
│   ├── ascii-diagrams.md
│   ├── codeact.md
│   ├── subagent.md
│   ├── deviation-rules.md   # 偏差处理规则
│   ├── checkpoint-system.md # Checkpoint 系统
│   └── state-validation.md  # STATE.md 验证
└── .planning/             # 项目规划目录（运行时生成）
    ├── PROJECT.md
    ├── REQUIREMENTS.md
    ├── ROADMAP.md
    ├── STATE.md
    ├── phases/
    └── .logs/
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