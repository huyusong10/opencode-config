---
name: adaptorv4-examples
description: |
  Adaptor v4 任务类型样例。仅由 adaptorv4 agent 在识别任务类型后主动加载，不应被其他流程触发。
---

# Adaptor v4 任务类型样例

此 skill 提供 Adaptor v4 工作流各任务类型的参考样例。

## 样例文件

| 任务类型 | 文件 | 说明 |
|----------|------|------|
| 执行型 | `examples/execution.md` | 功能实现、代码修复、配置部署 |
| 探索型 | `examples/exploration.md` | 技术选型、架构设计、根因排查 |
| 发现型 | `examples/discovery.md` | 业务分析、问题发现、数据挖掘 |
| 复合型 | `examples/composite.md` | 多阶段任务，阶段间有依赖 |

## 使用方式

1. 根据「目标明确？路径明确？」判断任务类型
2. 使用 `read` 工具加载对应样例
3. 参照样例的 OODA 循环模式执行