---
description: 取消活动的 Ralph Loop 循环
---

# 取消 Ralph Loop

此命令用于取消正在运行的 Ralph Loop 循环。

## 执行步骤

1. 检查 `.ralph/` 目录是否存在

2. 如果目录不存在：
   - 输出："未找到活动的 Ralph Loop。"
   - 停止

3. 如果目录存在：
   - 读取 `.ralph/PROGRESS.md` 获取当前迭代次数
   - 读取 `.ralph/tasks.json` 获取任务完成状态
   - 删除 `.ralph/` 目录
   - 输出取消报告

## 执行命令

```bash
# 检查目录
if [ -d .ralph ]; then
    # 读取迭代次数
    if [ -f .ralph/PROGRESS.md ]; then
        ITERATION=$(grep -E '^iteration:' .ralph/PROGRESS.md | head -1 | sed 's/iteration: *//')
    else
        ITERATION="未知"
    fi
    
    # 统计任务完成情况
    if [ -f .ralph/tasks.json ]; then
        TOTAL=$(grep -c '"task"' .ralph/tasks.json 2>/dev/null || echo "未知")
        COMPLETE=$(grep -c '"complete": true' .ralph/tasks.json 2>/dev/null || echo "未知")
    else
        TOTAL="未知"
        COMPLETE="未知"
    fi
    
    # 删除目录
    rm -rf .ralph
    
    # 输出报告
    echo "================================================================================"
    echo "RALPH LOOP - 已取消"
    echo "================================================================================"
    echo ""
    echo "当前迭代次数：$ITERATION"
    echo "任务完成情况：$COMPLETE / $TOTAL"
    echo ""
    echo ".ralph/ 目录已删除"
    echo "================================================================================"
else
    echo "未找到活动的 Ralph Loop。"
    echo ""
    echo "如需启动新的 Ralph Loop，请使用："
    echo "  /ralph-loop 或 @ralph-planner"
fi
```

## 注意事项

- 取消后，所有进度和学习记录将丢失
- 如需保留记录，请在取消前手动备份 `.ralph/` 目录
- 已提交的代码变更不会被撤销
