# OpenCode 配置仓库

个人 OpenCode AI 编程助手配置，基于 **杠铃架构**：规划（并行设计团队）→ 执行（状态驱动）→ 审查（并行评审团队），两端专项团队并行扩散，中间聚焦确定性执行。

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

### 杠铃架构总览

```
     Planning (wide)         Execution (narrow)          Review (wide)
┌────────────────────┐   ┌───────────────────────┐   ┌────────────────────┐
│    Design Team     │   │       Maestro         │   │   Reviewer Team    │
│                    │   │  Auto-mode switching  │   │                    │
│ arch-designer      │──▶│  Planning Mode        │──▶│ arch-reviewer      │
│ ux-designer        │   │  Execution Mode       │   │ security-reviewer  │
│ risk-designer      │   │  Resume Mode          │   │ perf-reviewer      │
│ impl-designer      │   │                       │   │ test-reviewer      │
│ ────────────────── │   │  Delegates:           │   │ maintain-reviewer  │
│ (system-designer   │   │  @coder @tester       │   │ api-reviewer       │
│  orchestrates 4↑   │   │  @debugger @reviewer  │   │ impact-reviewer    │
│  in parallel)      │   │  @researcher          │   │ qa-reviewer        │
│                    │   │  @committer           │   │ ────────────────── │
│ 4 specialists      │   │                       │   │ 8 specialists      │
│ Output <design-    │   │  Fast Path: ≤2 files  │   │ Required, no skip  │
│ synthesis>         │   │  Direct execute       │   │ Output <system-    │
│ for Goal-Backward  │   │                       │   │ advisory>          │
└────────────────────┘   └───────────────────────┘   └────────────────────┘
         │                          │                          │
    Goal-Backward              Wave Dispatch              Quality Gate
    Goal-Backward method       Wave parallel/serial       Weighted X.X/5
```

---

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
│  State-Driven: auto-detect STATE.md status, determine mode                  │
│  - .planning/ missing → Planning Mode (create plan)                         │
│  - status: ready → Execution Mode (execute plan)                            │
│  - status: in_progress → Resume Mode (resume interrupted)                   │
│                                                                             │
│  Temperature 0.35 balances creativity and determinism:                      │
│  - Planning Mode: creative exploration, broad divergence                    │
│  - Execution Mode: deterministic execution, strict validation               │
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
| @reviewer | 审查代码规格合规与质量（执行流内） | 只读 |
| @researcher | 研究技术、模式和解决方案 | 只读 |
| @committer | 原子化 git 提交 | 只读 + bash |

### 设计团队（Design Team）

在规划阶段由 `@system-designer` 编排，并行进行多维度方案探索，输出供 Goal-Backward 使用的 `<design-synthesis>`：

| Designer | 职责 |
|----------|------|
| system-designer | 编排者：并行派发 4 位专家、综合为 `<design-synthesis>` |
| arch-designer | 架构结构与模块边界设计 |
| ux-designer | 用户体验与 API 人机工程学设计 |
| risk-designer | 风险、边界条件与约束设计 |
| impl-designer | 技术可行性与实现路径设计 |

**触发条件：** 有架构决策的复杂任务（由 Architect/Maestro 在 Phase 2.5 触发）
**跳过条件：** 单文件 ≤ 20 行 / 配置文档 typo / 无架构决策空间

### 系统评审团队（System Reviewer Team）

作为杠铃架构的**右端**，在 Architect/Maker/Maestro 完成每次规划或执行归档后**强制触发**，不可跳过：

| Reviewer | 职责 |
|----------|------|
| system-reviewer | 编排者：上下文路由、并行派发、结果汇总 |
| arch-reviewer | 架构与模块边界审查 |
| security-reviewer | 安全漏洞审查（OWASP Top 10）|
| perf-reviewer | 性能与 I/O 效率审查 |
| test-reviewer | 测试覆盖与质量审查 |
| maintain-reviewer | 可维护性与代码气味审查 |
| api-reviewer | 接口设计与契约审查 |
| impact-reviewer | 现有功能影响分析（变更波及范围）|
| qa-reviewer | 规则遵从度审查，**强制**，所有路由均派发 |

### 执行模式选择

由 Maestro 在规划阶段推荐，执行阶段自动调度：

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
│  Phase 2.5: Design Team (complex tasks, barbell left end)                   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ - Emit <design-request> (goal + context + requirements + signals)   │    │
│  │ - @system-designer dispatches 4 specialists in parallel:            │    │
│  │   arch-designer | ux-designer | risk-designer | impl-designer       │    │
│  │ - Collect <design-synthesis> with Goal-Backward inputs              │    │
│  │ Skip if: single-file ≤20 lines / config/docs/typo / no arch choice  │    │
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
│  │ - Fast Path Check: ≤2 files, ≤20 lines, no architecture impact?     │    │
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

### System Reviewer Workflow

在 Architect/Maker/Maestro 完成每次规划或执行归档后**强制触发**，不可跳过。小改动自动路由到轻量级评审。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       System Reviewer Workflow                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Primary Agent: output <system-review-request> tag (required)               │
│       |                                                                     │
│       v                                                                     │
│  system-loop plugin detects tag, triggers @system-reviewer                  │
│       |                                                                     │
│       v                                                                     │
│  system-reviewer analyzes context, auto-routes:                             │
│  +---------------------------------------------------------------------+    │
│  | planning context  → arch + security + api + qa                      |    │
│  | execution/arch_change → all 8 specialists (incl. impact + qa)       |    │
│  | execution/normal  → arch + security + test + maintain + impact + qa |    │
│  | execution/small_change → maintain + test + impact + qa (light)      |    │
│  +---------------------------------------------------------------------+    │
│       |                                                                     │
│       v                                                                     │
│  Parallel dispatch: @task(subagent: xxx, parallel: true) × N                │
│  Each specialist returns <reviewer-report id="xxx">                         │
│       |                                                                     │
│       v                                                                     │
│  system-reviewer aggregates: dedup, force P0, weighted score                │
│       |                                                                     │
│       v                                                                     │
│  Output <system-advisory> (includes **total score** X.X/5)                  │
│  Primary Agent receives advice, decides whether to adopt                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**强制 P0 规则：**
- `security`: INJECTION / SENSITIVE_DATA → P0
- `api`: BREAKING_CHANGE → P0
- `impact`: CALLER_BREAK → P0
- `qa`: DEVIATION_VIOLATION / CHECKPOINT_MISSING / VALIDATION_SKIPPED / REQUIREMENT_MISSED → P0

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
Always verify before claiming.

BEFORE claiming any status:
1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command
3. READ: Full output, check exit code
4. VERIFY: Does output confirm the claim?
5. ONLY THEN: Make the claim
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
.log/
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
├── opencode.jsonc         # 主配置（provider、model、mcp、plugins、instructions）
├── tui.json               # TUI 主题配置
├── AGENTS.md              # AI 行为偏好
├── install.sh             # 安装脚本
├── agent/
│   ├── maestro.md         # 统一 Agent（推荐）
│   ├── architect.md       # 架构师 Agent（向后兼容）
│   ├── maker.md           # 制造者 Agent（向后兼容）
│   ├── subagent/          # 执行流功能型子代理（杠铃中间）
│   │   ├── coder.md
│   │   ├── tester.md
│   │   ├── debugger.md
│   │   ├── reviewer.md    # 执行流规格合规审查
│   │   ├── researcher.md
│   │   └── committer.md
│   ├── designer/          # 设计团队：规划阶段并行扩散（杠铃左端）
│   │   ├── system-designer.md   # 编排者
│   │   ├── arch-designer.md     # 架构结构与模块边界
│   │   ├── ux-designer.md       # 用户/开发者体验
│   │   ├── risk-designer.md     # 风险与约束
│   │   └── impl-designer.md     # 实现可行性
│   └── reviewer/          # 评审团队：执行后并行评审（杠铃右端）
│       ├── system-reviewer.md   # 编排者
│       ├── arch-reviewer.md     # 架构与模块边界
│       ├── security-reviewer.md # 安全漏洞（OWASP）
│       ├── perf-reviewer.md     # 性能与 I/O
│       ├── test-reviewer.md     # 测试覆盖与质量
│       ├── maintain-reviewer.md # 可维护性
│       ├── api-reviewer.md      # 接口设计与契约
│       ├── impact-reviewer.md   # 现有功能影响分析
│       └── qa-reviewer.md       # 规则遵从度（强制）
├── command/               # 自定义 Command 定义
├── skills/
│   └── ralph-loop/        # Ralph Loop 技能
├── plugin/
│   ├── deep-explore-guide.ts   # 深度探索引导插件
│   ├── deep-explore-prompts.yaml
│   ├── ralph.ts                # Ralph Loop 插件
│   ├── task-logger.ts          # 任务自动日志记录插件
│   ├── system-loop.ts          # 系统评审触发插件
│   └── system-loop-config.yaml # 系统评审配置
├── rules/                 # 补充规则（自动加载到所有 agent 上下文）
│   ├── ascii-diagrams.md
│   ├── codeact.md
│   ├── subagent.md
│   ├── deviation-rules.md   # 偏差处理规则
│   ├── checkpoint-system.md # Checkpoint 系统
│   ├── state-validation.md  # STATE.md 验证
│   ├── planning-mode.md     # 规划模式
│   └── execution-mode.md    # 执行模式
├── .log/                  # 任务日志目录（运行时生成，task-logger 插件写入）
└── .planning/             # 项目规划目录（运行时生成）
    ├── PROJECT.md
    ├── REQUIREMENTS.md
    ├── ROADMAP.md
    ├── STATE.md
    └── phases/
```

---

## 设计理念

### 杠铃架构原则

```
两头大（并行扩散），中间细（聚焦执行）
```

- **规划端（左）**：设计团队 4 专家并行探索，多视角发散，防止单一视角遗漏关键约束
- **执行段（中）**：Maestro 聚焦确定性执行，状态驱动，最小化不确定性
- **评审端（右）**：评审团队 8 专家并行检查，多维度收敛，确保质量门禁

**价值**：扩散发生在最便宜的时机（规划期），收敛发生在最重要的位置（质量门禁），中间执行保持最小摩擦。

### 职责分离

每个 Agent/Subagent 只做一件事：
- `maestro` 统筹规划与执行，像指挥家协调乐队
- `architect` 只规划，不碰代码（向后兼容）
- `maker` 只协调，不直接实现（向后兼容）
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