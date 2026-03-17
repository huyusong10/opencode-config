# 系统评审触发规则

本文档定义何时以及如何触发 `@system-reviewer` 进行系统级评审。

---

## 触发时机

以下场景可选触发系统评审：

1. **Architect 规划完成后** — 规划内容已确定，Status 为 ready，希望在开始执行前做系统级审查
2. **Maestro 阶段完成后** — 执行阶段归档完成，希望对本阶段整体质量进行系统评估
3. **Maker 执行完成后** — 单个任务执行并验证完成，希望做执行质量评审

系统评审是**可选的**，适合以下条件之一：
- 涉及架构变更、新增模块或新依赖
- 执行阶段超过 3 个任务
- 涉及安全敏感逻辑（认证、加密、权限）
- 规划阶段完成，需要专业审查才能放心进入执行

---

## 触发方式

在你的响应中输出 `<system-review-request>` 标签块，`system-loop.ts` 会自动检测并触发 `@system-reviewer`：

```markdown
<system-review-request>

## 阶段信息

- **Phase:** [阶段名称]
- **Status:** [ready | completed]
- **Execution Mode:** [parallel | sequential]（仅执行阶段）

## 完成的工作

[工作摘要，3-5 条要点]

## 关键变更

[文件变更列表，包含文件路径和变更类型（新增/修改/删除）]

## 验证结果

[测试、构建、lint 命令和结果]

## 规划内容（仅规划阶段）

[规划摘要，包含技术栈和关键决策]

</system-review-request>
```

---

## Skip 条件

以下情况**不触发**系统评审：

- 纯文档或注释变更（无代码逻辑变更）
- 单行 bugfix（如修改一个 typo 或配置值）
- 测试文件变更（不涉及源码逻辑）
- 明确标记为 "快速通道" 的任务

如果当前变更符合上述 skip 条件，则省略 `<system-review-request>` 标签，无需触发评审。

---

## 收到 `<system-advisory>` 后

`@system-reviewer` 完成后会返回 `<system-advisory>` 格式报告，包含：

- 多维度评审结果和评分
- 加权综合总分（1-5 分制）
- P0/P1/P2 优先级建议

**处理原则：**

- `<system-advisory>` 是**建议性报告**，你自行决定是否采纳
- **P0 问题**（安全漏洞、功能正确性）：强烈建议立即处理，或向用户说明为何可接受
- **P1 问题**（质量/架构）：建议在适当时机处理，可加入 backlog
- **P2 问题**（优化/创新）：可选，纳入 backlog 或忽略

---

## 与旧 system-engineer 的关系

`@system-reviewer` 完全替代了旧的 `@system-engineer`。触发格式（`<system-review-request>` 标签）和输出格式（`<system-advisory>` 标签）完全相同，对调用方透明。

内部实现变化：system-reviewer 会根据上下文类型和变更范围自动路由到 2-6 个专项评审 agent 并行执行，然后汇总结果。
