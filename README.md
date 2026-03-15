# OpenCode 配置仓库

个人 OpenCode AI 编程助手配置，聚焦于**双前端 Agent 架构**和**Ralph Loop 迭代机制**。

## 安装

### 一键安装 (macOS/Linux)

```bash
# 软链接模式（推荐，便于 git pull 更新）
curl -fsSL https://raw.githubusercontent.com/huyusong10/opencode-config/main/install.sh | bash

# 复制模式（独立安装）
curl -fsSL https://raw.githubusercontent.com/huyusong10/opencode-config/main/install.sh | bash -s -- --copy
```

### 手动安装

```bash
# macOS/Linux - 软链接模式
git clone https://github.com/huyusong10/opencode-config.git ~/opencode-config && cd ~/opencode-config && ./install.sh

# macOS/Linux - 复制模式
git clone https://github.com/huyusong10/opencode-config.git ~/opencode-config && cd ~/opencode-config && ./install.sh --copy

# Windows (PowerShell 管理员) - 复制模式
git clone https://github.com/huyusong10/opencode-config.git $env:USERPROFILE\opencode-config; Copy-Item -Recurse -Force $env:USERPROFILE\opencode-config\* $env:APPDATA\opencode\
```

### 更新配置

```bash
cd ~/opencode-config && git pull   # 软链接模式
curl -fsSL https://raw.githubusercontent.com/huyusong10/opencode-config/main/install.sh | bash  # 重新安装
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

### 工作流一：标准开发流程

```
@architect <requirement>
    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. Requirements Exploration (user stories + acceptance criteria)           │
│  2. Technical Research (delegate to @researcher)                            │
│  3. Create .planning/ directory structure                                   │
│  4. Recommend execution mode                                                │
└─────────────────────────────────────────────────────────────────────────────┘
    ↓
@maker
    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. Read PLAN.md                                                            │
│  2. Dispatch to appropriate subagent                                        │
│  3. Validate acceptance criteria                                            │
│  4. Coordinate @committer for commit                                        │
│  5. Update STATE.md                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 工作流二：Ralph Loop 迭代

**适用场景**：需要 AI 自我观察、持续改进的复杂任务

```
/ralph-loop --max-iterations 10 --completion-promise "<completion-flag>"
    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  Loop until:                                                                │
│    - AI writes <promise> completion flag in output                          │
│    - Max iterations reached                                                 │
│                                                                             │
│  AI can see each iteration:                                                 │
│    - Previous output history                                                │
│    - Git commit history                                                     │
│    - File change history                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**停止方式**：AI 输出包含 `<promise>` 标签，或执行 `/cancel-ralph`

### 工作流三：系统化调试

**适用场景**：遇到 bug、测试失败、意外行为

```
@debugger
    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  Phase 1: Root Cause Investigation                                          │
│    - Read error messages                                                    │
│    - Reproduce the issue                                                    │
│    - Trace data flow                                                        │
│  Phase 2: Pattern Analysis                                                  │
│    - Find working examples                                                  │
│    - Compare differences                                                    │
│  Phase 3: Hypothesis & Testing                                              │
│    - Form single hypothesis                                                 │
│    - Minimal verification test                                              │
│  Phase 4: Implement Fix                                                     │
│    - Write failing test first                                               │
│    - Fix and verify                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

**铁律**：没有根因调查就没有修复。

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
│                         Hook Enforcement Layer                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Hook 1: architect-first-guard                                              │
│  Trigger: Write/Edit source code files                                      │
│  Check: .planning/STATE.md exists with status = ready                       │
│  Block: Reject execution without Architect plan                             │
│                                                                             │
│  Hook 2: execution-mode-guard                                               │
│  Trigger: Same as above                                                     │
│  Check: execution_mode field exists in STATE.md                             │
│  Block: Reject execution without specified mode                             │
│                                                                             │
│  Hook 3: test-first-guard (TDD mode)                                        │
│  Trigger: Write implementation in TDD mode                                  │
│  Check: Corresponding test file exists                                      │
│  Block: Must write test before implementation                               │
│                                                                             │
│  Hook 4: plan-completion-guard                                              │
│  Trigger: Mark plan as complete                                             │
│  Check: All tasks completed + verified                                      │
│  Block: Reject marking partial work as complete                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### STATE.md 必填字段

```yaml
## 当前位置
阶段：[phase-id]           # 必填
计划：[plan-id]            # 必填
状态：ready                 # 必填：ready 才能执行

## 执行模式（必填）
execution_mode: tdd        # 必填：tdd | ralph | standard | debug | refactor | migrate
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
├── AGENTS.md              # AI 行为偏好
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
│   └── guard.ts           # Hook 强制约束插件
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

### 自引用迭代

让 AI 看到自己的历史工作，形成自我改进的反馈循环。适用于需要多次迭代的复杂任务。
