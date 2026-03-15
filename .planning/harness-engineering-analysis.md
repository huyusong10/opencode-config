# Harness Engineering 对比分析

## 概述

本文档对比分析 `oh-my-openagent`、`superpowers`、`get-shit-done` 三个项目的 harness engineering 技巧，并提出本项目的优化方向。

---

## 项目概览

| 维度 | oh-my-openagent | superpowers | get-shit-done | 本项目 |
|------|-----------------|-------------|---------------|--------|
| **规模** | 160k LOC, 1268 files | 16 skills | 15 agents | 2 agents + 6 subagents |
| **定位** | 完整插件系统 | Skills 工作流 | Spec-driven 开发 | 双前端 Agent 架构 |
| **核心理念** | Lifecycle hooks + Multi-agent | 自动触发 skills | Context engineering | 职责分离 + 迭代机制 |

---

## 深度对比

### 1. Hook 系统 (oh-my-openagent 的核心优势)

**oh-my-openagent 拥有 46 个 lifecycle hooks，分为 5 层：**

```
Tier 1: Session Hooks (23)
  → contextWindowMonitor, thinkMode, ralphLoop, modelFallback...

Tier 2: Tool Guard Hooks (10)
  → commentChecker, toolOutputTruncator, writeExistingFileGuard...

Tier 3: Transform Hooks (4)
  → keywordDetector, contextInjector, thinkingBlockValidator...

Tier 4: Continuation Hooks (7)
  → todoContinuationEnforcer, atlas, stopContinuationGuard...

Tier 5: Skill Hooks (2)
  → categorySkillReminder, autoSlashCommand
```

**关键 hooks 及其价值：**

| Hook | 功能 | 价值 |
|------|------|------|
| `context-window-monitor` | 监控上下文使用率 | 提前预警 context rot |
| `preemptive-compaction` | 主动触发 compaction | 避免硬性截断 |
| `anthropic-context-window-limit-recovery` | 多策略恢复 | 自动处理 context 溢出 |
| `todo-continuation-enforcer` | 强制完成 TODO | 防止半途而废 |
| `write-existing-file-guard` | 写前强制读取 | 避免覆盖问题 |
| `comment-checker` | 检测 AI 注释模式 | 提高代码质量 |
| `rules-injector` | 条件规则注入 | 上下文感知指导 |

**本项目现状：** 无 hook 系统，所有逻辑都在 Agent 定义中。

---

### 2. Subagent 编排模式

**superpowers - Subagent-Driven Development:**

```
┌─────────────────────────────────────────────────────────────┐
│  Controller (主 session)                                    │
│    ↓                                                        │
│  Dispatch implementer subagent (fresh context)              │
│    ↓                                                        │
│  Implementer: implements → tests → commits → self-reviews   │
│    ↓                                                        │
│  Stage 1 Review: Spec compliance (does it match the plan?)  │
│    ↓                                                        │
│  Stage 2 Review: Code quality (is it well-built?)           │
│    ↓                                                        │
│  Mark complete → Next task                                  │
└─────────────────────────────────────────────────────────────┘
```

**get-shit-done - Wave Execution:**

```
WAVE 1 (parallel)          WAVE 2 (parallel)          WAVE 3
┌─────────┐ ┌─────────┐    ┌─────────┐ ┌─────────┐    ┌─────────┐
│ Plan 01 │ │ Plan 02 │ →  │ Plan 03 │ │ Plan 04 │ →  │ Plan 05 │
│ User    │ │ Product │    │ Orders  │ │ Cart    │    │ Checkout│
│ Model   │ │ Model   │    │ API     │ │ API     │    │ UI      │
└─────────┘ └─────────┘    └─────────┘ └─────────┘    └─────────┘
     │           │              ↑           ↑              ↑
     └───────────┴──────────────┴───────────┘              │
            Dependencies: Plan 03 needs Plan 01            │
                        Plan 04 needs Plan 02              │
                        Plan 05 needs Plans 03 + 04        │
```

**本项目现状：** Maker 协调 subagents，但缺乏：
- 任务依赖图分析
- Wave 分组执行
- 两阶段审查机制

---

### 3. Deviation 处理 (get-shit-done 的亮点)

**自动修复规则 (无需用户确认)：**

| Rule | 触发条件 | 示例 |
|------|----------|------|
| **Rule 1** | 代码不按预期工作 | 逻辑错误、类型错误、安全漏洞 |
| **Rule 2** | 缺失关键功能 | 错误处理、输入验证、认证缺失 |
| **Rule 3** | 阻塞问题 | 缺少依赖、配置错误、环境问题 |

**需要询问的规则：**

| Rule | 触发条件 | 示例 |
|------|----------|------|
| **Rule 4** | 架构级变更 | 新数据库表、服务层重构、框架切换 |

**本项目现状：** 无明确的 deviation 处理规则，依赖 Agent 自行判断。

---

### 4. Checkpoint 系统

**get-shit-done 的 Checkpoint 类型：**

| Type | 用途 | 频率 |
|------|------|------|
| `checkpoint:human-verify` | 视觉/功能验证 | 90% |
| `checkpoint:decision` | 实现选择 | 9% |
| `checkpoint:human-action` | 无法自动化的步骤 | 1% |

**Automation-first 原则：**
> 如果 Claude CAN 通过 CLI/API 做，Claude MUST 做。Checkpoint 用于验证 AFTER 自动化，而非替代自动化。

**本项目现状：** 无 checkpoint 概念，执行过程缺乏暂停点。

---

### 5. Goal-Backward Methodology

**get-shit-done 的目标反推法：**

```
Goal: "Working chat interface"
    ↓
Observable Truths (用户视角):
  - User can see existing messages
  - User can send a message
  - Messages persist across refresh
    ↓
Required Artifacts (具体文件):
  - src/components/Chat.tsx (Message list rendering)
  - src/app/api/chat/route.ts (CRUD operations)
  - prisma/schema.prisma (Message model)
    ↓
Required Wiring (连接):
  - Chat.tsx fetches from /api/chat via useEffect
  - route.ts queries prisma.message
    ↓
Key Links (关键断点):
  - Input onSubmit → API call
  - API save → database
```

**输出 `must_haves` 结构：**

```yaml
must_haves:
  truths: ["User can see messages", "User can send message"]
  artifacts:
    - path: "src/components/Chat.tsx"
      provides: "Message list rendering"
      min_lines: 30
  key_links:
    - from: "src/components/Chat.tsx"
      to: "/api/chat"
      via: "fetch in useEffect"
```

**本项目现状：** Architect 创建计划，但缺乏 goal-backward 推导。

---

### 6. 状态管理与持久化

| 项目 | 状态存储 | 内容 |
|------|----------|------|
| **oh-my-openagent** | `.sisyphus/ralph-loop.local.md` | sessionID, iteration, maxIterations, completionPromise |
| **get-shit-done** | `.planning/STATE.md` | position, decisions, blockers, metrics |
| **本项目** | `.planning/STATE.md` | 阶段、进度、决策 |

**get-shit-done 的 STATE.md 内容更丰富：**
- Performance Metrics (已完成计划数、平均时长)
- Decisions (关键决策记录)
- Blockers (当前阻塞)
- Session history

---

### 7. 调试方法论

**superpowers - Systematic Debugging 四阶段：**

```
Phase 1: Root Cause Investigation
  - 阅读错误信息
  - 稳定复现
  - 检查最近变更
  - 多组件系统：每个边界添加诊断
  - 追踪数据流

Phase 2: Pattern Analysis
  - 找到工作示例
  - 对比差异
  - 理解依赖

Phase 3: Hypothesis and Testing
  - 形成单一假设
  - 最小化测试
  - 验证后继续

Phase 4: Implementation
  - 创建失败测试
  - 实现单一修复
  - 验证修复
  - 如果 3+ 修复失败：质疑架构
```

**铁律：** `NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST`

**本项目现状：** `debugger.md` 有类似理念，但缺少具体流程图和检查点。

---

### 8. 配置系统

**oh-my-openagent 的多级配置：**

```
Project (.opencode/oh-my-opencode.jsonc)
    ↓ merge
User (~/.config/opencode/oh-my-opencode.jsonc)
    ↓ merge + defaults
Final Config
```

- `agents`, `categories`: deep merge
- `disabled_*` arrays: Set union
- 其他字段: override

**本项目现状：** 无配置系统，所有设置硬编码在 Agent 定义中。

---

## 优化建议

### 高优先级 (核心增强)

#### 1. 引入 Hook 系统

**建议实现的核心 hooks：**

```yaml
# .opencode/hooks.yaml
hooks:
  - name: context-window-monitor
    event: session.idle
    action: check_context_usage()
    threshold: 70%

  - name: write-existing-file-guard
    event: tool.execute.before
    matcher: "Write|Edit"
    action: ensure_file_read_first()

  - name: todo-continuation-enforcer
    event: session.idle
    condition: "has_incomplete_todos"
    action: prompt_continuation()

  - name: deviation-handler
    event: tool.execute.after
    action: apply_deviation_rules()
```

**实现路径：**
1. 在 `plugin/` 目录创建 hook 系统框架
2. 从 `write-existing-file-guard` 开始（价值最高）
3. 逐步添加其他 hooks

---

#### 2. 两阶段审查机制

**在 Maker 中增强：**

```markdown
## 任务完成流程

1. @coder 实现任务
2. @reviewer 第一阶段审查 (Spec Compliance)
   - 是否符合 PLAN.md 要求？
   - 是否遗漏或过度实现？
3. @reviewer 第二阶段审查 (Code Quality)
   - 代码质量、可维护性
   - 是否遵循项目规范？
4. @committer 提交
```

---

#### 3. Deviation Rules 集成

**在 Maker 中添加 deviation 处理：**

```markdown
<deviation_rules>

**RULE 1-3: 自动修复**
- Bug 修复、缺失关键功能、阻塞问题
- 修复后继续任务，记录到 SUMMARY

**RULE 4: 询问用户**
- 架构级变更、新数据库表、框架切换
- STOP → 返回 checkpoint → 等待用户决策

**修复尝试限制：** 单个任务 3 次自动修复后 STOP

</deviation_rules>
```

---

### 中优先级 (效率提升)

#### 4. Wave Execution 支持

**在 Maker 中添加依赖分析：**

```markdown
<dependency_analysis>
For each task:
  - needs: 依赖的前置任务
  - creates: 产出的文件/接口
  - has_checkpoint: 是否需要用户确认

Wave 分配:
  - Wave 1: 无依赖任务 (并行)
  - Wave N: 依赖 Wave N-1 的任务
</dependency_analysis>
```

---

#### 5. Goal-Backward Planning

**在 Architect 中增强：**

```markdown
<goal_backward_methodology>

**Step 1:** 从 ROADMAP 提取阶段目标
**Step 2:** 推导 Observable Truths (3-7 条)
**Step 3:** 推导 Required Artifacts (具体文件)
**Step 4:** 推导 Required Wiring (连接关系)
**Step 5:** 识别 Key Links (关键断点)

输出到 PLAN.md 的 `must_haves` 字段。

</goal_backward_methodology>
```

---

#### 6. Checkpoint 系统

**在 Maker 中添加：**

```markdown
<checkpoint_types>

**checkpoint:human-verify** (90%)
  - 视觉/UI 验证
  - 交互流程测试

**checkpoint:decision** (9%)
  - 技术选型
  - 架构决策

**checkpoint:human-action** (1%)
  - 真正无法自动化的步骤

</checkpoint_types>
```

---

### 低优先级 (锦上添花)

#### 7. 配置系统

```yaml
# .opencode/config.yaml
agents:
  architect:
    model: opus
  maker:
    model: sonnet
    
hooks:
  disabled:
    - comment-checker  # 如果不需要

workflow:
  auto_advance: false
  research_enabled: true
```

---

#### 8. Context Engineering 增强

借鉴 get-shit-done 的 XML prompt 格式：

```xml
<task type="auto">
  <name>Create login endpoint</name>
  <files>src/app/api/auth/login/route.ts</files>
  <action>
    Use jose for JWT (not jsonwebtoken - CommonJS issues).
    Validate credentials against users table.
    Return httpOnly cookie on success.
  </action>
  <verify>curl -X POST localhost:3000/api/auth/login returns 200 + Set-Cookie</verify>
  <done>Valid credentials return cookie, invalid return 401</done>
</task>
```

---

## 实施路线图

### Phase 1: 基础增强 (Week 1-2) ✅ 已完成

- [x] 引入 `write-existing-file-guard` hook → `plugin/guard.ts`
- [x] 在 Maker 中添加 deviation rules → `agent/maker.md`
- [x] 增强 debugger.md 的系统化调试流程 → `agent/subagent/debugger.md`

### Phase 2: 审查机制 (Week 3-4) ✅ 已完成

- [x] 实现两阶段审查机制 → `agent/subagent/reviewer.md` + `agent/maker.md`
- [x] 在 Architect 中添加 goal-backward methodology → `agent/architect.md`
- [x] 增强 STATE.md 的内容结构 → `agent/architect.md` + `agent/maker.md`

### Phase 3: 执行优化 (Week 5-6) ✅ 已完成

- [x] 实现依赖分析和 wave execution → `agent/architect.md` + `agent/maker.md`
- [x] 添加 checkpoint 系统 → `agent/maker.md` (增强版)
- [x] 实现 todo-continuation-enforcer hook → `plugin/guard.ts`

### Phase 4: 系统化 (Week 7-8) - 待实施

- [ ] 创建配置系统
- [ ] 实现 XML prompt 格式
- [ ] 完善文档和测试

---

## 已完成优化详情

### Phase 1 成果

| 优化项 | 文件 | 关键内容 |
|--------|------|----------|
| write-existing-file-guard | `plugin/guard.ts` | 追踪 session 内读取的文件，写入前验证 |
| Deviation Rules | `agent/maker.md` | Rule 1-3 自动修复，Rule 4 询问用户 |
| 系统化调试 | `agent/subagent/debugger.md` | 四阶段调试流程 + Red Flags |

### Phase 2 成果

| 优化项 | 文件 | 关键内容 |
|--------|------|----------|
| 两阶段审查 | `agent/subagent/reviewer.md` | Stage 1: Spec Compliance, Stage 2: Code Quality |
| Goal-Backward | `agent/architect.md` | 五步流程 + must_haves 输出 |
| STATE.md 增强 | `agent/architect.md` | 性能指标、决策记录、阻塞追踪 |

### Phase 3 成果

| 优化项 | 文件 | 关键内容 |
|--------|------|----------|
| Wave Execution | `agent/architect.md` + `agent/maker.md` | 依赖图构建、Wave 分组算法、并行执行 |
| Checkpoint 系统 | `agent/maker.md` | human-verify/decision/human-action/auth-gate |
| todo-continuation-enforcer | `plugin/guard.ts` | 追踪未完成的 TODO 项 |

---

## 总结

| 来源 | 关键收获 |
|------|----------|
| **oh-my-openagent** | Hook 系统、状态持久化、模型 fallback |
| **superpowers** | Subagent-driven development、两阶段审查、系统化调试 |
| **get-shit-done** | Wave execution、Deviation rules、Goal-backward、Checkpoint |

**核心改进方向：**
1. **Hook 系统** → 增强自动化和错误预防
2. **两阶段审查** → 提高实现质量
3. **Deviation Rules** → 明确自动修复边界
4. **Goal-Backward** → 确保计划覆盖关键需求
5. **Wave Execution** → 优化并行执行效率