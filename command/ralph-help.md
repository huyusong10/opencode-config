---
description: Ralph Loop 帮助信息
---

# Ralph Loop 帮助

详细文档见：`skills/ralph-loop/SKILL.md`

## 可用命令

| 命令 | 描述 |
|------|------|
| `/ralph-loop` | 启动 Ralph Loop 规划流程（调用 @architect） |
| `/ralph-start` | 启动执行已规划的任务（调用 @maker） |
| `/cancel-ralph` | 取消活动的 Ralph 循环 |
| `/ralph-help` | 显示此帮助信息 |

## 可用 Agent

| Agent | 描述 |
|-------|------|
| `@architect` | 规划代理：需求探索、推荐执行模式、创建规划文件 |
| `@maker` | 执行代理：以 ralph 模式协调 @coder, @tester, @debugger 循环 |

## 快速开始

```
1. /ralph-loop   → @architect 规划
2. /ralph-start  → @maker 执行
3. 自动循环直到 <promise> 满足
```

## 适用场景

✅ 有明确可程序化验证完成标准的任务（测试、lint、迁移）
❌ 需要主观判断或频繁人工确认的任务
