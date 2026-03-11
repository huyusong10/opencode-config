---
description: 启动 Ralph Wiggum 循环用于迭代开发
---

# Ralph 循环命令

你正在启动一个 Ralph Wiggum 循环。这是一种迭代开发技术，你可以重复处理同一任务，并在文件和 git 历史记录中查看之前的工作。

## 设置说明

执行以下步骤来初始化 Ralph 循环：

1. 从 `$ARGUMENTS` 中解析参数

   参数格式：`<PROMPT> [--max-iterations N] [--completion-promise TEXT]`

   - 提取主提示词（所有不是标志或标志值的内容）
   - 如果提供了 `--max-iterations` 值则提取（默认：0 表示无限制）
   - 如果提供了 `--completion-promise` 值则提取（默认：null）

2. 在 `ralph-loop.local.md`（项目根目录下）创建状态文件，格式如下：

```markdown
---
active: true
iteration: 1
max_iterations: <MAX_ITERATIONS_VALUE>
completion_promise: <COMPLETION_PROMISE_VALUE_OR_null>
started_at: "<CURRENT_ISO_TIMESTAMP>"
---

<THE_PROMPT_TEXT>
```

3. 输出激活消息：

```
Ralph 循环已激活！

迭代次数：1
最大迭代次数：<N 或 "无限制">
完成承诺：<文本 或 "无（将永久运行）">

Ralph 插件现在会监控会话空闲事件。当你完成响应后，
相同的提示词会被重新推送以继续循环。

停止循环的方式：
- 如果设置了完成承诺，输出 <promise>你的承诺</promise>
- 等待达到最大迭代次数
- 运行 /cancel-ralph 手动取消
```

4. 如果设置了完成承诺，显示此关键警告：

```
关键提示 - Ralph 循环完成承诺

要完成此循环，请输出以下确切的文本：
  <promise>你的承诺内容</promise>

严格要求：
  - 必须完全按照上述格式使用 <promise> XML 标签
  - 该声明必须完全且明确地为真
  - 禁止输出虚假声明来退出循环
  - 即使你认为应该退出，也不要撒谎

重要提示：即使你认为自己陷入困境或任务不可能完成，
也绝不能输出虚假承诺。循环会持续进行，直到承诺
真正变为真实。
```

5. 现在开始处理提示词中的任务。Ralph 插件会在你完成响应后自动继续向你推送相同的提示词。

## 使用示例

```
/ralph-loop 构建待办事项 REST API --completion-promise "完成" --max-iterations 20
/ralph-loop 修复认证 bug --max-iterations 10
/ralph-loop 重构缓存层
```
