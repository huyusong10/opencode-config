---
name: tdd-workflow
description: |
    使用此技能进行TDD（测试驱动开发）软件开发。
---

# TDD 工作流

## 概述

一个严格的7步TDD循环，用于产生高质量、经过充分测试的代码。每一步必须**验证并确认**后才能继续。状态仅在真实验证后更新——绝不凭空捏造。

核心原则：**红（失败测试）-> 绿（最小实现）-> 重构**。

---

## 步骤 0 - 检查现有进度

在每次会话开始时，在执行任何其他操作之前：

- 列出 `tdd-summary/` 以检查现有的步骤报告（例如 `step-1.md`、`step-2.md`）。
- 如果报告存在，阅读它们以了解先前的上下文，然后**从下一步继续**。

---

## 步骤 1 - 理解意图

- 探索代码库以获取相关上下文。
- 从可用信息（用户提示 + 代码库）中推导功能需求。
- 如果任何需求模糊不清，请在 `step-1.md` 的"假设"部分明确记录假设，而不是请求澄清。

编写 `tdd-summary/step-1.md`：

```markdown
# Step 1 - Understand Intent

## Functional Requirements

### FR-1: <title>
<description>

### FR-2: <title>
<description>

## Assumptions

- <any ambiguous point and the assumption made>
```

---

## 步骤 2 - 编写场景文档

为每个功能需求创建一个场景文档，位于 `docs/scenario/<name>.md`：

```markdown
# Scenario: <Title>
- Given: <precondition>
- When: <action>
- Then: <expected outcome>

## Test Steps

- Case 1 (happy path): <brief description>
- Case 2 (edge case): <brief description>
- Case N: ...

## Status
- [x] Write scenario document
- [ ] Write solid test according to document
- [ ] Run test and watch it failing
- [ ] Implement to make test pass
- [ ] Run test and confirm it passed
- [ ] Refactor implementation without breaking test
- [ ] Run test and confirm still passing after refactor

**IMPORTANT**: Only update above status when a step is confirmed complete. Do not hallucinate.
```

**不变量**：功能需求数量 = 场景文档数量。在继续之前验证。

编写 `tdd-summary/step-2.md`：

```markdown
# Step 2 - Write Scenario Docs

## Scenario Documents Created

- FR-1: <title> - `docs/scenario/<name>.md`
- ...
```

---

## 步骤 3 - 编写失败测试（红）

对于每个场景文档：

- 在 `tests/scenario/test_<name>.py`（或等效位置）编写测试。
- 每个场景必须**至少有2个测试用例**。如果缺少边界情况，请添加。
- 场景文档中的所有验收标准必须被覆盖。
- 测试**不能**是空测试或假测试。
- 更新场景状态：勾选 `- [x] Write solid test according to document`。

编写后，**运行每个测试**并验证其失败：

- **预期失败**（例如功能未找到、端点缺失）——这是正确的。
    - 更新场景状态：勾选 `- [x] Run test and watch it failing`。
- **意外失败**（例如导入错误、依赖缺失）——先修复环境。
- **测试通过**——功能尚未实现；没有理由它会通过。修复测试。

**不变量**：场景文档数量 = 测试文件数量。在继续之前验证。

编写 `tdd-summary/step-3.md`：

```markdown
# Step 3 - Write Failing Test

## Failing Tests Created

- FR-1: <title> - `docs/scenario/<name>.md` - `tests/scenario/test_<name>.py`
- ...
```

---

## 步骤 4 - 实现以使测试通过（绿）

对于每个失败的测试：

- 编写**最少的生产代码**以使测试通过。不要更多。
- 不要引入与当前功能需求无关的更改。
- 更新场景状态：勾选 `- [x] Implement to make test pass`。
- 运行测试。如果失败，修复实现并重试。
- 确认通过后，更新场景状态：勾选 `- [x] Run test and confirm it passed`。

编写 `tdd-summary/step-4.md`：

```markdown
# Step 4 - Implement to Make Tests Pass

## Implementations Completed

- FR-1: <title> - `docs/scenario/<name>.md` - Implementation in `<module>`
- ...

All tests now pass. Scenario documents updated.
```

---

## 步骤 5 - 重构以提高可维护性

对于每个测试现已通过的场景：

- 在**不改变外部行为**的前提下，提高可读性、结构和可维护性。
- 更新场景状态：勾选 `- [x] Refactor implementation without breaking test`。
- 重构后再次运行测试。
    - 如果测试失败：修复重构。如果无法修复，**回滚到重构前版本**。
- 确认测试仍然通过后，更新场景状态：勾选 `- [x] Run test and confirm still passing after refactor`。

编写 `tdd-summary/step-5.md`：

```markdown
# Step 5 - Refactor for Maintainability

## Refactorings Completed

- FR-1: <title> - `docs/scenario/<name>.md` - <what was improved>
- ...

All tests still pass after refactoring. Scenario documents updated.
```

---

## 步骤 6 - 回归测试

运行**完整测试套件**（所有测试，不仅仅是本次会话添加的测试）：

- 如果在不相关的测试中出现回归：
    - 分析失败并理解其对现有功能的影响。
    - 修复实现以恢复所有通过的测试。
    - 重新运行完整套件直到一切通过。

**绝不要修改与当前功能需求无关的现有测试。**

编写 `tdd-summary/step-6.md`：

```markdown
# Step 6 - Regression Test

## Regression Test Results

- Complete test suite executed: `<command>`
- All tests pass: Yes / No
- If regression found: <brief description of fix applied>
```

---

## 步骤 7 - 最终审查

验证**每个场景文档的所有状态复选框都已勾选**。

审查：
- 每个功能需求都有对应的场景文档和测试文件。
- 所有测试通过且代码整洁。

编写 `tdd-summary/step-7.md`：

```markdown
# Step 7 - Final Review

## Summary

- Functional requirements addressed:
    - FR-1: ...
- Scenario documents: `docs/scenario/...`
- Test files: `tests/scenario/...`
- Implementation complete and all tests passing after refactoring.

## How to Test

Run: `<test command>`
```

最后，归档摘要文件夹：

```bash
mv tdd-summary/ completed-tdd-archives/tdd-$(date +%Y%m%d-%H%M%S)
```

TDD工作流完成。

---

## 铁律

- **不要跳过步骤。** 每一步必须在下一步开始前验证。
- **不要在实现或重构步骤中编辑测试**，除非测试本身在步骤3中明显写错了。
- **不要捏造状态。** 仅在真实、确认的验证后勾选状态复选框。
- **保持数量相等。** 功能需求数量 = 场景文档数量 = 测试文件数量，始终保持。
- **步骤关卡**：如果以交互方式运行，展示每个步骤报告并在继续前等待确认。如果作为委托子代理运行，自动完成所有步骤。
- **如果在任何步骤请求更改**，返回到适当的步骤并相应调整所有后续产物。
