---
description: 解释 Ralph Wiggum 技术和可用命令
---

# Ralph Wiggum 插件帮助

请向用户解释以下内容：

## 什么是 Ralph Wiggum 技术？

Ralph Wiggum 技术是一种基于持续 AI 循环的迭代开发方法论，由 Geoffrey Huntley 开创。

**核心概念：**
```bash
while :; do
  cat PROMPT.md | opencode --continue
done
```

相同的提示词会被重复传递给 AI。"自引用"的特性来源于 AI 在文件和 git 历史中看到自己之前的工作，而不是将输出反馈作为输入。

**每次迭代：**
1. AI 接收相同的提示词
2. 处理任务，修改文件
3. 完成响应
4. 插件拦截空闲状态并再次传递相同的提示词
5. AI 在文件中看到自己之前的工作
6. 迭代改进直到完成

该技术被描述为"在不确定的世界中确定性地失败"——失败是可以预测的，从而能够通过调整提示词进行系统性改进。

## 可用命令

### /ralph-loop <提示词> [选项]

在当前会话中启动 Ralph 循环。

**用法：**
```
/ralph-loop "重构缓存层" --max-iterations 20
/ralph-loop "添加测试" --completion-promise "测试完成"
```

**选项：**
- `--max-iterations <n>` - 自动停止前的最大迭代次数
- `--completion-promise <文本>` - 标记完成的承诺短语

**工作原理：**
1. 创建 `.opencode/ralph-loop.local.md` 状态文件
2. 你开始处理任务
3. 当你完成响应时，插件会拦截
4. 相同的提示词再次传递
5. 你看到自己之前的工作
6. 持续进行，直到检测到承诺或达到最大迭代次数

---

### /cancel-ralph

取消活动的 Ralph 循环（删除循环状态文件）。

**用法：**
```
/cancel-ralph
```

**工作原理：**
- 检查活动的循环状态文件
- 删除 `.opencode/ralph-loop.local.md`
- 报告取消并显示迭代次数

---

## 核心概念

### 完成承诺

要标记完成，AI 必须输出一个 `<promise>` 标签：

```
<promise>任务完成</promise>
```

插件会查找这个特定的标签。如果没有它（或 `--max-iterations`），Ralph 将无限运行。

### 自引用机制

"循环"并不意味着 AI 与自己对话。它的意思是：
- 相同的提示词重复
- AI 的工作持久保存在文件中
- 每次迭代都能看到之前的尝试
- 增量式地朝着目标前进

## 示例

### 交互式 Bug 修复

```
/ralph-loop "修复 auth.ts 中的 token 刷新逻辑。当所有测试通过时输出 <promise>已修复</promise>。" --completion-promise "已修复" --max-iterations 10
```

你会看到 Ralph：
- 尝试修复
- 运行测试
- 查看失败
- 迭代解决方案
- 在你当前的会话中

## 何时使用 Ralph

**适用于：**
- 有明确成功标准的定义清晰的任务
- 需要迭代和改进的任务
- 带有自我纠正的迭代开发
- 全新项目

**不适用于：**
- 需要人工判断或设计决策的任务
- 一次性操作
- 成功标准不清晰的任务
- 调试生产环境问题（改用针对性调试）

## 了解更多

- 原始技术：https://ghuntley.com/ralph/
- Ralph 协调器：https://github.com/mikeyobrien/ralph-orchestrator