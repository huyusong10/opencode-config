---
description: 启动 Ralph Loop 规划流程
---

# Ralph Loop 启动

调用 **@architect** 开始规划：

```
@architect
```

Architect 强制流程：
1. 读取 `.planning/` 目录（如果存在）
2. 需求探索对话
3. 输出 `.planning/` 目录结构并设置 `execution_mode`
4. 将 STATE.md 状态设为 `ready`

规划完成后执行：

```
@maker
```

**或直接带任务描述：**

```
/ralph-loop [任务描述]
```

详细说明见 `skills/ralph-loop/SKILL.md`。

让我先检查当前项目状态：
