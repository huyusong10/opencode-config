---
description: 启动 Ralph Executor 执行已规划的循环任务
---

# Ralph Loop 执行启动

此命令用于启动 ralph-executor agent，执行已规划好的 Ralph Loop 任务。

## 前置条件

在运行此命令之前，必须确保 `.ralph/` 目录存在并包含以下文件：

```
.ralph/
├── tasks.json          # 任务列表
├── SCENARIOS.md        # 目标用例场景
├── PROGRESS.md         # 进度记录
├── LEARNING.md         # 学习笔记
└── ralph-config.json   # Ralph 配置
```

如果文件不存在，请先运行：

```
@ralph-planner
```

## 检查规划文件

让我检查规划文件是否存在：