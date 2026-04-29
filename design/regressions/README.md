# Regressions 入口

## 定位

`design/regressions/` 一事一档记录高价值复发型历史坑。它解释哪些旧路已经被证明危险，并把教训连接到当前约束和防复发机制。

## 准入

只有同时满足以下条件才新增 regression：

- 问题有复发风险，且不是一次性实现失误。
- 当前 design、tests、类型、schema 或 lint 还不能完整表达教训。
- 记录后能帮助 Agent 避免走回旧路径。

能自动化的教训必须优先转成测试、类型、schema、lint 或当前契约。

## 文件规则

- 文件名使用 `R-xxx-short-name.md`。
- 每条保持短文档，不写排查流水账。
- 每条必须有关联的当前约束或防复发机制。
- 状态使用 `Active`、`Superseded` 或 `Replaced by ...`。

## 模板

```md
# R-001: 标题

## 背景

曾经出现过什么复发型问题。

## 破坏的不变量

哪个稳定边界或约束被破坏。

## 当前约束

现在应该遵守什么契约。

## 防复发机制

- 相关 design：
- 相关 tests/schema/lint：

## 状态

Active
```

## 维护

- 同一稳定边界出现多条 regression 时，应优先重构 design、tests 或代码。
- `Superseded` 条目定期删除或归档，不长期堆积。
