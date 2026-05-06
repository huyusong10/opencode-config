# Design 入口

## 定位

`design/` 描述当前稳定设计边界与公开契约，不描述实现流水账。它帮助 Agent 和维护者在修改前理解边界，在修改后判断哪些验证必须同步。

## 索引

| 范围 | 设计边界 | 验证入口 |
| --- | --- | --- |
| 配置系统 CLI、安装、渲染、备份 | `design/config-system.md` | `tests/agentcfg.test.ts` |
| 全局指令共享规则 | `instructions/shared/core.md` | `agentcfg render <target>`、`tests/agentcfg.test.ts` |
| Codex 全局指令 | `AGENTS.md`、`instructions/codex/main.md` | `agentcfg render codex`、`tests/agentcfg.test.ts` |
| 目标工具独占规则 | `instructions/<target>/main.md`，仅在确有有效独占内容时存在 | `agentcfg render <target>`、`tests/agentcfg.test.ts` |
| 重要设计取舍 | `design/decisions/README.md` | 关联到对应设计或测试 |
| 复发型历史坑 | `design/regressions/README.md` | 优先关联自动验证 |

## 写作边界

- 应写：模块职责、对外契约、数据流、依赖边界、错误语义、验证入口。
- 不写：内部函数、临时变量、缓存 key、CSS 类名、框架技巧、实现步骤、具体展示文案。
- 一份文档覆盖一个稳定边界；边界重叠时合并，边界过大时拆分。
- 若某条规则能被测试、类型、schema 或 lint 表达，优先自动化，不把 design 写成检查清单。

## 预算与重构

预算按项目大小相对计算：稳定边界、公开契约、核心流程、高风险历史坑越多，允许的设计与验证资产才相应增长。

触发重构的信号：

- 同一稳定边界有多份互相重叠的 design。
- design 找不到对应代码或验证入口。
- 小改动需要阅读大量文档才能定位设计边界。
- 文档记录实现细节多于稳定边界。
- 历史记录长期没有转化为当前设计或自动验证。

## 修改流程

1. 修改前从本索引进入，找到当前设计边界、验证入口和相关历史记录。
2. 若 design 缺失、过期、重叠或无法指导本次变更，先整理到足以指导实施与验证的状态。
3. 若影响对外契约或稳定设计边界，同步更新 design 与 tests。
4. 若只是内部重构，不为迁就实现细节改 design 或契约测试。
5. 完成后删除、合并或标记过期的低价值设计资产。
