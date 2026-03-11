---
name: mistake-notebook
description: |
    查询和更新错误笔记本以记忆错误的技能。在以下情况下使用此技能：
    1. 遇到严重问题，需要回顾历史问题解决经验
    2. 修复了严重错误并有明确的解决方案值得记录
    3. 用户请求"不要再犯这个错误"
---
# 错误笔记本

## 位置

错误笔记本出现在两个位置：

- 项目本地错误笔记本：项目根目录下的 `MISTAKE.md`。
- 通用错误笔记本：用户主目录下的 `~/MISTAKE.md`。

错误笔记本用于记录之前对话中犯过的常见错误，记忆问题解决经验以供将来使用。Agent 可以：

1. 读取错误笔记本以快速查找问题 -> 解决方案。
2. 在解决新问题时追加到错误笔记本。

这可以防止 Agent 再次犯同样的错误。

### 项目本地 vs 通用

项目本地错误笔记本 `MISTAKE.md`：
- 记录**与项目相关**的错误，不具有通用性。
- 如果在 git 仓库中，会被 git 跟踪。

通用错误笔记本 `~/MISTAKE.md`：
- 记录**通用的**、**编程相关的**错误，没有项目本地上下文。
- 出现在用户主目录中。

## 触发器

### 触发器 1：遇到严重问题

当遇到严重问题时：

- 在 `MISTAKE.md` 和 `~/MISTAKE.md` 中查找解决方案。
- 如果找到：
    - 尝试使用错误笔记本中找到的解决方案修复问题。
    - 如果问题已修复：
        - 完成。
    - 如果问题仍然存在：
        - 找出错误笔记本中现有解决方案无效的原因。
        - 如果问题已解决：
            - 跳转到"触发器 2：严重问题已修复"
- 如果未找到：
    - 自己解决问题。
    - 如果问题已解决：
        - 跳转到"触发器 2：严重问题已修复"

### 触发器 2：严重问题已修复

在你修复了严重错误后：

- 如果问题已通过**明确的解决方案**解决，且**值得记录**：
    - 跳转到"记录问题解决方案"。

### 触发器 3：用户请求记录错误

当用户请求"不要再犯这个错误"时：

- 如果根据对话上下文问题尚未解决：
    - 先解决问题。
    - 如果问题已解决：
        - 向用户报告你的发现。
        - 跳转到"记录问题解决方案"。
- 如果问题已按用户意图解决：
    - 跳转到"记录问题解决方案"。

## 记录问题解决方案

- 如果问题已通过明确的解决方案解决：
    - 检查此问题是否已记录在 `MISTAKE.md` 和 `~/MISTAKE.md` 中：
        - 已记录：
            - 如果记录的解决方案无效或过时：
                - 按照"错误解决方案格式"更新记录的解决方案。
        - 尚未记录：
            - 如果问题与此项目相关：
                - 选择 `MISTAKE.md`。
            - 如果问题是通用的：
                - 选择 `~/MISTAKE.md`。
            - 按照"错误解决方案格式"将解决方案追加到选择的错误笔记本中。
            - 在响应中简要报告：
                - 你犯的错误。
                - 你从这个错误中学到了什么。
                - 问题的解决方案是什么。
                - 报告你已更新错误笔记本。

## 错误解决方案格式

错误笔记本维护一个快速的问题 -> 解决方案查找参考，格式如下：

```markdown
# Mistake Notebook

This is the Mistake Notebook, use the mistake-notebook skill to retrive more details.

Below is a list of mistakes I previously made and solved:

## Mistake - [A short title]

- Creation Date: YYYY-MM-DD
- Last Update Date: YYYY-MM-DD
- Project: [project folder path when this mistake was found]
- Branch: [branch when this mistake was happening]
- Commit: [commit SHA when this mistake was happening]

### Problem:

[list situations when the problem occurred:]
- XXX fails.
- YYY reports ZZZ.
- ...

### Insights:

[list your insights and discoveries when solving this problem:]
- This is because XXX lacks AAA.
- I found that YYY depends on BBB for CCC.
- ...

### Solution:

[A brief explaination (<10 words) on how this problem was solved.]

[list steps how this problem was solved:]
- Try turn on AAA.
- Try add BBB for CCC.
- ...
- And XXX fixed.
```

## 边缘情况

- 如果错误笔记本不存在，创建一个。
- 如果错误笔记本已存在，追加到其中。
- 如果由于权限问题写入错误笔记本失败，以"错误"格式输出响应进行报告。
