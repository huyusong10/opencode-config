---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always
---

# 完成前验证

## 概述

在未经验证的情况下声称工作已完成是不诚实，而非高效。

**核心原则：声明之前先求证，始终如此。**

**违反规则的字面意思就是违反规则的精神实质。**

## 铁律

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

如果你没有在本次消息中运行验证命令，就不能声称它通过了。

## 关卡函数

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

## 常见失败

| 声明 | 要求 | 不充分 |
|-------|----------|----------------|
| 测试通过 | 测试命令输出：0 个失败 | 之前的运行，"应该通过" |
| Linter 无错误 | Linter 输出：0 个错误 | 部分检查，推测 |
| 构建成功 | 构建命令：退出码 0 | Linter 通过，日志看起来不错 |
| Bug 已修复 | 测试原始症状：通过 | 代码已更改，假设已修复 |
| 回归测试有效 | 红绿循环已验证 | 测试通过一次 |
| Agent 已完成 | VCS diff 显示更改 | Agent 报告"成功" |
| 需求已满足 | 逐行检查清单 | 测试通过 |

## 危险信号 - 停止

- 使用"应该"、"可能"、"似乎"
- 在验证前表达满意（"太好了！"、"完美！"、"完成了！"等）
- 准备提交/推送/创建 PR 但未验证
- 信任 agent 成功报告
- 依赖部分验证
- 想"就这一次"
- 疲惫想结束工作
- **任何暗示成功但未运行验证的措辞**

## 防止合理化借口

| 借口 | 现实 |
|--------|---------|
| "现在应该可以了" | 运行验证 |
| "我有信心" | 信心 ≠ 证据 |
| "就这一次" | 没有例外 |
| "Linter 通过了" | Linter ≠ 编译器 |
| "Agent 说成功了" | 独立验证 |
| "我累了" | 疲惫 ≠ 借口 |
| "部分检查就够了" | 部分证明不了什么 |
| "措辞不同所以规则不适用" | 精神高于字面 |

## 关键模式

**测试：**
```
✅ [Run test command] [See: 34/34 pass] "All tests pass"
❌ "Should pass now" / "Looks correct"
```

**回归测试（TDD 红绿）：**
```
✅ Write → Run (pass) → Revert fix → Run (MUST FAIL) → Restore → Run (pass)
❌ "I've written a regression test" (without red-green verification)
```

**构建：**
```
✅ [Run build] [See: exit 0] "Build passes"
❌ "Linter passed" (linter doesn't check compilation)
```

**需求：**
```
✅ Re-read plan → Create checklist → Verify each → Report gaps or completion
❌ "Tests pass, phase complete"
```

**Agent 委托：**
```
✅ Agent reports success → Check VCS diff → Verify changes → Report actual state
❌ Trust agent report
```

## 为什么这很重要

来自 24 次失败记忆：
- 你的合作伙伴说"我不相信你" - 信任破裂
- 发布了未定义的函数 - 会崩溃
- 发布了缺失的需求 - 功能不完整
- 浪费时间在虚假完成上 → 重定向 → 返工
- 违反："诚实是核心价值观。如果你撒谎，你会被替换。"

## 何时应用

**始终在以下情况之前：**
- 任何形式的成功/完成声明
- 任何满意的表达
- 任何关于工作状态的正面陈述
- 提交、创建 PR、完成任务
- 转移到下一个任务
- 委托给 agents

**规则适用于：**
- 精确短语
- 释义和同义词
- 成功的暗示
- 任何暗示完成/正确性的沟通

## 底线

**验证没有捷径。**

运行命令。阅读输出。然后声明结果。

这是不可协商的。
