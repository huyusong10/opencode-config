---
description: Ralph Loop 帮助信息
---

# Ralph Loop 帮助

## 什么是 Ralph Loop？

Ralph Loop 是一种让 AI 持续迭代直到任务真正完成的机制。

### 核心思想

```
while 任务未完成:
    AI 接收相同的提示词
    AI 看到之前的工作
    AI 继续推进任务
    Plugin 检查 <promise> 标签
    直到检测到完成承诺
```

### 解决的问题

| 问题 | 传统 Agent | Ralph Loop |
|------|-----------|------------|
| 自我评估 | 主观判断"完成" | 外部客观标准 |
| 上下文管理 | 会话重启丢失 | 文件持久化 |
| 人工干预 | 需要频繁介入 | 真正无人值守 |

## 适用场景

### ✅ 适合

- 有明确的、可程序化验证的完成标准
- 编程、测试、迁移、重构等机械性任务
- 有现成的验证方法（测试套件、lint 等）

### ❌ 不适合

- 需要人工判断或设计决策
- 成功标准模糊或主观
- 需要频繁人工确认的交互式任务

## 可用命令

| 命令 | 描述 |
|------|------|
| `/ralph-loop` | 启动 Ralph Loop 规划流程 |
| `/ralph-start` | 启动执行已规划的任务 |
| `/ralph-help` | 显示此帮助信息 |
| `/cancel-ralph` | 取消活动的 Ralph 循环 |

## 可用 Agent

| Agent | 描述 |
|-------|------|
| `@architect` | 规划代理：需求探索、推荐执行模式、创建规划文件 |
| `@maker` | 执行代理：以 ralph 模式协调 @coder, @tester, @debugger 循环 |

## 使用流程

```
1. 启动规划
   /ralph-loop 或 @architect

2. 完成规划
   - 明确需求
   - 推荐执行模式（默认 ralph）
   - 定义完成承诺
   - 确认启动

3. 执行任务
   @maker 或 /ralph-start

4. 自动循环
   plugin/ralph.ts 拦截 session.idle
   检查 <promise> 标签
   未完成则继续

5. 查看进度
   cat .ralph/PROGRESS.md
```

## 文件结构

### Ralph Loop 专用

```
.ralph/
├── tasks.json          # 任务列表
├── SCENARIOS.md        # 目标用例场景
├── PROGRESS.md         # 进度记录
├── LEARNING.md         # 学习笔记
└── ralph-config.json   # 配置（完成承诺、迭代限制）
```

### 标准规划

```
.planning/
├── PROJECT.md          # 项目愿景
├── REQUIREMENTS.md     # 需求列表
├── ROADMAP.md          # 路线图
├── STATE.md            # 状态
└── phases/             # 阶段计划
```

## 核心概念

### 完成承诺

完成承诺是 Ralph Loop 的核心控制机制。必须是：
- **具体**：明确可验证的条件
- **可验证**：可通过命令确认
- **可达成**：合理迭代次数内可达成

示例：
- "所有测试通过，覆盖率 >= 80%"
- "pytest tests/ 通过，无失败用例"

### Stop Hook 机制

plugin/ralph.ts 实现：
1. 拦截 `session.idle` 事件
2. 提取最后一条 assistant 消息
3. 检查 `<promise>` 标签
4. 未检测到 → 重新注入提示词

## 学习更多

- 技能文档：`skills/ralph-loop/SKILL.md`
- 规划代理：`agent/architect.md`
- 执行代理：`agent/maker.md`
- 插件实现：`plugin/ralph.ts`
- 原始技术：https://ghuntley.com/ralph/