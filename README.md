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
┌─────────────────────────────────────────────────────────────────┐
│                        用户请求                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Architect (架构师)                          │
│                                                                 │
│  职责：理解需求、设计解决方案、创建可执行计划                     │
│  输出：.planning/ 目录结构（PROJECT.md, REQUIREMENTS.md, etc.）  │
│  委托：@researcher 进行技术研究                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Maker (制造者)                            │
│                                                                 │
│  职责：执行计划、协调子代理、管理状态                             │
│  模式：ralph | tdd | standard | spike | debug | refactor | migrate │
│  协调：@coder, @tester, @debugger, @reviewer, @researcher,      │
│        @committer                                               │
└─────────────────────────────────────────────────────────────────┘
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
@architect <需求描述>
    ↓
┌─────────────────────────────────────────────────────────────────┐
│  1. 需求探索（用户故事 + 验收标准）                              │
│  2. 技术研究（委托 @researcher）                                │
│  3. 创建 .planning/ 目录结构                                    │
│  4. 推荐执行模式                                                │
└─────────────────────────────────────────────────────────────────┘
    ↓
@maker
    ↓
┌─────────────────────────────────────────────────────────────────┐
│  1. 读取 PLAN.md                                                │
│  2. 调度到对应 subagent                                         │
│  3. 验证验收标准                                                │
│  4. 协调 @committer 提交                                        │
│  5. 更新 STATE.md                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 工作流二：Ralph Loop 迭代

**适用场景**：需要 AI 自我观察、持续改进的复杂任务

```
/ralph-loop --max-iterations 10 --completion-promise "<完成标志>"
    ↓
┌─────────────────────────────────────────────────────────────────┐
│  循环执行直到：                                                  │
│    - AI 在输出中写入 <promise> 完成标志                          │
│    - 达到最大迭代次数                                            │
│                                                                  │
│  每次 AI 都能看到：                                              │
│    - 之前的输出历史                                              │
│    - git 提交历史                                                │
│    - 文件变更记录                                                │
└─────────────────────────────────────────────────────────────────┘
```

**停止方式**：AI 输出包含 `<promise>` 标签，或执行 `/cancel-ralph`

### 工作流三：系统化调试

**适用场景**：遇到 bug、测试失败、意外行为

```
@debugger
    ↓
┌─────────────────────────────────────────────────────────────────┐
│  阶段一：根本原因调查                                            │
│    - 阅读错误信息                                                │
│    - 复现问题                                                    │
│    - 追踪数据流                                                  │
│  阶段二：模式分析                                                │
│    - 找到可工作的示例                                            │
│    - 比较差异                                                    │
│  阶段三：假设与测试                                              │
│    - 形成单一假设                                                │
│    - 最小化测试验证                                              │
│  阶段四：实施修复                                                │
│    - 先写失败测试用例                                            │
│    - 修复并验证                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**铁律**：没有根本原因调查就没有修复。

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
└── plugin/                # 插件
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