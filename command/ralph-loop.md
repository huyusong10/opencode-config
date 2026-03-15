---
description: 启动 Ralph Loop 规划流程
---

# Ralph Loop 启动命令

你正在启动 Ralph Loop —— 一种让 AI 持续迭代直到任务真正完成的机制。

## 使用方式

### 显式调用 Architect（需求设计模式）

```
@architect
```

**强制流程：**
1. 读取 `.planning` 目录（如果存在）
2. 需求探索对话
3. 输出 `.planning` 目录结构
4. Ralph Loop 持续完善计划（如计划不完善）

**无退出例外。** 用户需求不明确时，指出并等待，不要退出。

---

### 方式 1：完整规划流程（推荐）

调用 architect agent：

```
@architect
```

Architect 会引导你完成：
1. 需求探索与澄清
2. 推荐执行模式（默认 ralph）
3. 创建规划文件
4. 定义完成承诺
5. 确认后启动执行

### 方式 2：直接执行（已有规划）

如果规划已完成，直接调用 maker：

```
@maker
```

Maker 会以 ralph 模式执行，协调 @coder, @tester, @debugger 循环。

### 方式 3：命令行参数

```
/ralph-loop [任务描述]
```

参数说明：
- `[任务描述]`：可选，任务的简要描述

## 核心机制

Ralph Loop 依赖 **plugin/ralph.ts** 实现 Stop Hook：

```
while 任务未完成:
    AI 执行任务
    Plugin 拦截 session.idle
    检查 <promise> 标签
    未检测到 → 重新注入提示词继续
```

## 当前状态检查

让我先检查当前项目状态：