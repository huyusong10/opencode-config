---
description: 启动 Maker 执行已规划的 Ralph Loop 任务
---

# Ralph Loop 执行启动

此命令用于启动 Maker agent，以 ralph 模式执行已规划好的任务。

## 前置条件

在运行此命令之前，必须确保规划已完成。规划文件可能在以下位置：

### 选项 1: .ralph/ 目录（Ralph Loop 专用）

```
.ralph/
├── tasks.json          # 任务列表
├── SCENARIOS.md        # 目标用例场景
├── PROGRESS.md         # 进度记录
├── LEARNING.md         # 学习笔记
└── ralph-config.json   # Ralph 配置
```

### 选项 2: .planning/ 目录（标准规划）

```
.planning/
├── PROJECT.md          # 项目愿景、约束、决策
├── REQUIREMENTS.md     # 需求列表
├── ROADMAP.md          # 阶段路线图
├── STATE.md            # 项目状态记忆
└── phases/
    └── 01-name/
        ├── 01-CONTEXT.md
        └── 01-01-PLAN.md
```

## 如果文件不存在

请先运行：

```
@architect
```

## 执行

调用 Maker 以 ralph 模式执行：

```
@maker
```

Maker 会：
1. 读取规划文件
2. 协调 @coder, @tester, @debugger 循环
3. 验证验收标准
4. 协调 @committer 提交

## Stop Hook

plugin/ralph.ts 会自动：
- 拦截每次迭代结束
- 检查 `<promise>` 标签
- 未完成则继续循环