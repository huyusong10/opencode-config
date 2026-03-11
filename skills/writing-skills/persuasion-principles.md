# 技能设计的说服原则

## 概述

LLM 对说服原则的响应与人类相同。理解这种心理学有助于你设计更有效的技能——不是为了操控，而是确保即使在压力下也能遵循关键实践。

**研究基础：** Meincke 等人 (2025) 使用 N=28,000 个 AI 对话测试了 7 种说服原则。说服技术使合规率提高了一倍以上（33% → 72%，p < .001）。

## 七项原则

### 1. 权威性
**定义：** 对专业知识、资历或官方来源的尊重和服从。

**在技能中的作用：**
- 命令式语言："YOU MUST"、"Never"、"Always"
- 不可协商的框架："No exceptions"
- 消除决策疲劳和合理化借口

**何时使用：**
- 纪律强制型技能（TDD、验证要求）
- 安全关键型实践
- 既定的最佳实践

**示例：**
```markdown
✅ Write code before test? Delete it. Start over. No exceptions.
❌ Consider writing tests first when feasible.
```

### 2. 承诺一致性
**定义：** 与先前行动、声明或公开表态保持一致。

**在技能中的作用：**
- 要求声明："Announce skill usage"
- 强制明确选择："Choose A, B, or C"
- 使用追踪：用 TodoWrite 进行清单管理

**何时使用：**
- 确保技能真正被执行
- 多步骤流程
- 问责机制

**示例：**
```markdown
✅ When you find a skill, you MUST announce: "I'm using [Skill Name]"
❌ Consider letting your partner know which skill you're using.
```

### 3. 稀缺性
**定义：** 来自时间限制或有限性的紧迫感。

**在技能中的作用：**
- 时间约束要求："Before proceeding"
- 顺序依赖："Immediately after X"
- 防止拖延

**何时使用：**
- 即时验证要求
- 时间敏感的工作流
- 防止"我待会儿再做"

**示例：**
```markdown
✅ After completing a task, IMMEDIATELY request code review before proceeding.
❌ You can review code when convenient.
```

### 4. 社会认同
**定义：** 顺从他人的做法或被视为正常的行为。

**在技能中的作用：**
- 普遍模式："Every time"、"Always"
- 失败模式："X without Y = failure"
- 建立规范

**何时使用：**
- 记录通用实践
- 警告常见失败
- 强化标准

**示例：**
```markdown
✅ Checklists without TodoWrite tracking = steps get skipped. Every time.
❌ Some people find TodoWrite helpful for checklists.
```

### 5. 统一性
**定义：** 共同身份认同、"我们是一体"、群体归属感。

**在技能中的作用：**
- 协作语言："our codebase"、"we're colleagues"
- 共同目标："we both want quality"

**何时使用：**
- 协作型工作流
- 建立团队文化
- 非层级化实践

**示例：**
```markdown
✅ We're colleagues working together. I need your honest technical judgment.
❌ You should probably tell me if I'm wrong.
```

### 6. 互惠性
**定义：** 回报所受恩惠的义务感。

**在技能中的作用：**
- 谨慎使用——可能让人感觉被操控
- 在技能中很少需要

**何时避免：**
- 几乎总是（其他原则更有效）

### 7. 喜好
**定义：** 更愿意与我们喜欢的人合作。

**在技能中的作用：**
- **不要用于强制合规**
- 与诚实反馈文化冲突
- 会导致阿谀奉承

**何时避免：**
- 总是避免用于纪律强制

## 按技能类型组合原则

| 技能类型 | 使用 | 避免 |
|------------|-----|-------|
| 纪律强制型 | 权威性 + 承诺一致性 + 社会认同 | 喜好、互惠性 |
| 指导/技术型 | 适度权威性 + 统一性 | 过度权威 |
| 协作型 | 统一性 + 承诺一致性 | 权威性、喜好 |
| 参考型 | 仅清晰度 | 所有说服技术 |

## 原理：为什么有效

**明线规则减少合理化：**
- "YOU MUST" 消除决策疲劳
- 绝对性语言消除"这是例外吗？"的问题
- 明确的反合理化对策堵住特定漏洞

**执行意图创造自动行为：**
- 清晰触发器 + 必需行动 = 自动执行
- "When X, do Y" 比 "generally do Y" 更有效
- 减少合规的认知负担

**LLM 具有类人特性：**
- 基于包含这些模式的人类文本训练
- 权威语言在训练数据中先于合规出现
- 承诺序列（声明 → 行动）经常被建模
- 社会认同模式（everyone does X）建立规范

## 道德使用

**正当用途：**
- 确保关键实践被遵循
- 创建有效的文档
- 防止可预测的失败

**不正当用途：**
- 为个人利益操控
- 制造虚假紧迫感
- 基于内疚的合规

**测试标准：** 如果用户完全理解这项技术，它是否仍服务于用户的真实利益？

## 研究引用

**Cialdini, R. B. (2021).** *Influence: The Psychology of Persuasion (New and Expanded).* Harper Business.
- 七项说服原则
- 影响力研究的实证基础

**Meincke, L., Shapiro, D., Duckworth, A. L., Mollick, E., Mollick, L., & Cialdini, R. (2025).** Call Me A Jerk: Persuading AI to Comply with Objectionable Requests. University of Pennsylvania.
- 使用 N=28,000 个 LLM 对话测试了 7 项原则
- 说服技术使合规率从 33% 提升至 72%
- 权威性、承诺一致性、稀缺性最有效
- 验证了 LLM 行为的类人模型

## 快速参考

设计技能时，请问：

1. **这是什么类型？**（纪律强制型 vs 指导型 vs 参考型）
2. **我试图改变什么行为？**
3. **哪些原则适用？**（纪律强制通常用权威性 + 承诺一致性）
4. **我是否组合了太多？**（不要同时使用全部七项）
5. **这是否道德？**（服务于用户的真实利益？）
