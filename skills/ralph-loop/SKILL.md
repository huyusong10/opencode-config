---
name: ralph-loop
description: |
    Ralph Loop 是一种让 AI 持续迭代直到任务真正完成的机制。
    适用于有明确、可程序化验证完成标准的长任务。
---

# Ralph Loop 技能

## 核心概念

### 什么是 Ralph Loop？

Ralph Loop 是一种自主迭代循环机制，核心思想是：

```
while 任务未完成:
    AI 接收相同的提示词
    AI 看到之前的工作（文件、git历史）
    AI 继续推进任务
    Stop Hook 拦截 AI 的"退出"尝试
    重新注入提示词 → 继续循环
```

### 名称由来

Ralph Wiggum 是《辛普森一家》中的角色——一个看起来不太聪明但异常执着、永不放弃的小孩。正如这个角色的特质，Ralph Loop 让 AI 变得异常"执着"。

### 解决的核心问题

| 问题 | 传统 Agent | Ralph Loop |
|------|-----------|------------|
| 自我评估 | 主观判断"完成" → 过早退出 | 外部客观标准 → 强制继续 |
| 上下文管理 | 会话重启丢失进度 | 文件/git持久化记忆 |
| 人工干预 | 需要频繁介入 | 真正的无人值守 |

## 防止过早退出

### 为什么会过早退出？

Ralph Loop 的核心目标是"持续迭代直到真正完成"，但实际上经常会过早退出。原因如下：

| 问题 | 症状 | 根因 |
|------|------|------|
| **主观判断完成** | 标记 `complete: true` 但验证失败 | AI 自我感觉良好 |
| **跳过验证** | 不运行验证命令就退出 | 验证被视为可选 |
| **忽略 errors** | 只看 "build 成功" 忽略 lint errors | 验证不全面 |
| **状态不同步** | PROGRESS.md 显示完成但实际未完成 | 状态是主观标记 |

### 强制规则

```
🔴 绝对规则 1：每次迭代结束时必须运行所有 required 验证命令
🔴 绝对规则 2：只有验证结果为 errors == 0 才算通过
🔴 绝对规则 3：所有任务 complete=true 且所有 required 验证通过才能输出 <promise>
🔴 绝对规则 4：验证结果必须写入 PROGRESS.md，不能只靠主观标记
```

### 验证结果判断

| 验证命令 | 通过条件 | 失败条件 |
|---------|---------|---------|
| lint | errors == 0 | errors > 0 |
| test | 0 failed | N failed |
| build | exit_code == 0 | exit_code != 0 |
| coverage | value >= threshold | value < threshold |

**注意**：warnings 是可接受的，但应该尽量减少。

---

## 关键三要素

1. **明确任务 + 完成条件**：可验证的成功标准
2. **Stop Hook**：拦截退出，强制继续
3. **max-iterations**：安全阀，防止无限循环

## 适用性判断

### ✅ 适合 Ralph Loop

- 有明确的、可程序化验证的完成标准
- 任务可以拆解为增量式改进
- 编程、测试、迁移、重构等机械性任务
- 有现成的验证方法（测试套件、lint、类型检查等）

**示例**：
- "为项目添加单元测试，覆盖率 >= 80%"
- "修复所有 lint 错误"
- "将项目从 JavaScript 迁移到 TypeScript"
- "重构认证模块，所有测试必须通过"

### ❌ 不适合 Ralph Loop

- 需要人工判断或设计决策
- 成功标准模糊或主观
- 需要频繁人工确认的交互式任务
- 没有自动化验证方法

**示例**：
- "设计一个漂亮的 UI"（主观）
- "写一个好的架构文档"（模糊）
- "和用户讨论需求"（交互式）

## 核心概念：Context Rot vs In-Context Learning

### Context Rot（上下文腐化）

当上下文中充满了重复、错误或无价值的信息时，AI 会陷入思维定势。

**症状**：
- AI 重复相同的错误
- AI 忽略之前的正确解决方案
- AI 输出越来越冗余

**判断标准**：删除前 N 次尝试记录后，问题是否更容易解决？

### In-Context Learning（上下文学习）

当上下文中增加了有价值的新信息时，AI 能从中学习。

**特征**：
- 明确的错误反馈
- 成功的尝试记录
- 对问题空间的有效探索

**判断标准**：删除前 N 次尝试记录后，问题是否更难解决？

## Ralph Loop 架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     RALPH LOOP 系统架构                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   用户请求                                                        │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────┐                    │
│  │         ralph-planner Agent             │                    │
│  │         （规划代理）                      │                    │
│  │                                         │                    │
│  │  1. 需求探索与澄清（不断提问）            │                    │
│  │  2. 目标用例设计（Given-When-Then）      │                    │
│  │  3. 异常场景分析                         │                    │
│  │  4. 创建 .ralph/ 工作目录                │                    │
│  │  5. 定义完成承诺                         │                    │
│  │  6. 用户确认后启动                        │                    │
│  └─────────────────────────────────────────┘                    │
│       │                                                          │
│       │  用户确认启动                                            │
│       ▼                                                          │
│  ┌─────────────────────────────────────────┐                    │
│  │         ralph-executor Agent            │                    │
│  │         （执行代理）                      │                    │
│  │                                         │                    │
│  │  while (iteration < max_iterations &&   │                    │
│  │         !completion_promise_met):       │                    │
│  │                                         │                    │
│  │    执行任务 → 验证 → 记录 → 检查承诺      │                    │
│  │                                         │                    │
│  └─────────────────────────────────────────┘                    │
│       │                                                          │
│       ▼                                                          │
│   最终验收报告                                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 文件结构

### .ralph/ 目录

```
.ralph/
├── tasks.json          # 任务列表
├── SCENARIOS.md        # 目标用例场景（Gherkin 格式）
├── PROGRESS.md         # 进度记录
├── LEARNING.md         # 学习笔记
└── ralph-config.json   # Ralph 配置
```

### tasks.json 格式

```json
{
  "project": {
    "name": "项目名称",
    "description": "项目描述",
    "created_at": "ISO时间戳"
  },
  "config": {
    "completion_promise": "完成承诺文本",
    "max_iterations": 50,
    "verification_command": "验证命令"
  },
  "tasks": [
    {
      "task": "任务名称",
      "description": "任务描述",
      "steps": [],
      "acceptance-criteria": "验收标准",
      "test-plan": {
        "unit": [],
        "integration": [],
        "e2e-manual": []
      },
      "scenarios": [],
      "skills": [],
      "complete": false
    }
  ]
}
```

### ralph-config.json 格式

```json
{
  "completion_promise": "所有测试通过，覆盖率 >= 80%",
  "max_iterations": 50,
  "verification_commands": [
    {
      "name": "代码检查",
      "command": "npm run lint",
      "required": true,
      "error_pattern": "(\\d+) error",
      "warning_pattern": "(\\d+) warning"
    },
    {
      "name": "单元测试",
      "command": "npm run test:unit",
      "required": true
    },
    {
      "name": "覆盖率检查",
      "command": "npm run test:coverage",
      "required": false,
      "threshold": 80
    }
  ],
  "stop_conditions": [
    "所有 required 验证命令通过（errors == 0）",
    "所有任务标记为 complete",
    "coverage >= 80%（如果配置了 threshold）"
  ]
}
```

**关键说明**：

- 只有 `errors == 0` 才算验证通过
- `warnings` 是可接受的（但不应该太多）
- 每次迭代结束必须运行所有 required 验证命令
- 验证结果必须写入 PROGRESS.md

## 完成承诺

### 要求

- **具体**：不要用"完成"、"好了"等模糊词
- **可验证**：可以通过命令或检查确认
- **可达成**：在合理迭代次数内可以达成
- **全面**：覆盖所有关键验收标准

### 好的 vs 坏的示例

| 坏的完成承诺 | 好的完成承诺 |
|-------------|-------------|
| "功能完成" | "所有 API 端点返回正确的状态码，单元测试覆盖率 >= 85%" |
| "测试通过" | "pytest tests/ 通过，无失败用例，覆盖率 >= 80%" |
| "代码写好了" | "所有 functions 都有类型注解，mypy 检查通过，无错误" |

## 使用方法

### 1. 启动规划

```
@ralph-planner
```

或使用命令：

```
/ralph-loop [任务描述]
```

### 2. 完成规划确认

ralph-planner 会引导你：
1. 明确需求
2. 设计场景
3. 创建文件
4. 定义承诺
5. 确认启动

### 3. 开始执行

确认后，ralph-executor 会自动启动或手动调用：

```
@ralph-executor
```

### 4. 查看进度

随时查看 `.ralph/PROGRESS.md` 了解进度。

### 5. 查看学习

查看 `.ralph/LEARNING.md` 了解发现。

## 最佳实践

### 规划阶段

1. **不要跳过需求探索**：花时间理解真正要做什么
2. **设计完整场景**：包括正常、异常、边界情况
3. **明确验证方法**：每个场景都要有可执行的验证命令
4. **合理设置迭代次数**：简单任务 10-20，复杂任务 50-100

### 执行阶段

1. **信任规划**：按照 tasks.json 执行，不要偏离
2. **记录学习**：发现模式或陷阱时立即记录
3. **保持耐心**：Ralph Loop 可能需要多次迭代

### 验证阶段

1. **自动验证**：使用测试、lint、类型检查等自动化工具
2. **覆盖率优先**：高覆盖率能发现更多问题
3. **持续集成**：配合 CI 确保质量

## 常见问题

### Q: Ralph Loop 适合所有任务吗？

A: 不适合。只有有明确、可程序化验证完成标准的任务才适合。

### Q: 为什么 Ralph Loop 会过早退出？

A: 常见原因：

| 问题 | 症状 | 解决方案 |
|------|------|---------|
| 主观判断完成 | 标记 complete 但验证失败 | 必须基于验证结果判断 |
| 跳过验证 | 不运行验证就退出 | 强制每次迭代都验证 |
| 忽略 errors | 只看 build 忽略 lint | 区分 errors 和 warnings |
| 状态不同步 | PROGRESS 不反映实际 | 验证结果写入文件 |

**核心原则**：
- `errors == 0` 才算通过（warnings 可接受）
- 所有任务 complete=true 且所有 required 验证通过才能输出 `<promise>`
- 验证结果必须持久化到 PROGRESS.md

### Q: 迭代次数用完了还没完成怎么办？

A: 检查：
1. 任务分解是否合理
2. 完成承诺是否过于严格
3. 是否有外部阻塞

可以调整后重新启动。

### Q: 如何判断是否发生了 Context Rot？

A: 如果发现 AI 开始重复相同的错误，或者输出变得越来越冗余，可能是 Context Rot。检查 LEARNING.md 是否有有效积累。

### Q: 可以中途干预吗？

A: 可以通过修改 `.ralph/tasks.json` 或 `.ralph/ralph-config.json` 来干预。但应该避免频繁干预。

## 参考资料

- 原始技术：https://ghuntley.com/ralph/
- Ralph 协调器：https://github.com/mikeyobrien/ralph-orchestrator
- Claude Code 插件：ralph-wiggum
