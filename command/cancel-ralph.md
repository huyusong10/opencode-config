---
description: 取消活动的 Ralph Wiggum 循环
---

# 取消 Ralph 循环

要取消 Ralph 循环，请执行以下步骤：

1. 检查 Ralph 状态文件是否存在于 `ralph-loop.local.md`

2. 如果文件不存在：
   - 报告："No active Ralph loop found."

3. 如果文件存在：
   - 读取文件以从 frontmatter 中的 `iteration:` 字段获取当前迭代次数
   - 删除文件 `ralph-loop.local.md`
   - 报告："Cancelled Ralph loop (was at iteration N)"，其中 N 是迭代值

执行：
```bash
if [ -f ralph-loop.local.md ]; then
  ITERATION=$(grep '^iteration:' ralph-loop.local.md | sed 's/iteration: *//')
  rm ralph-loop.local.md
  echo "已取消 Ralph 循环（当前在第 $ITERATION 次迭代）"
else
  echo "未找到活动的 Ralph 循环。"
fi
```
