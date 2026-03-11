---
name: interactive-test
description: |
    Use this skill before testing interactive applications (GUI/TUI).
---

# 交互式应用测试指南

在测试交互式应用时使用此技能。

此技能不适用于非交互式应用。

## 关键规则

**重要：**
- 你是一个 **CLI 代理**。
- 你默认在 **终端** 中运行。
- 你无法直接操作 GUI。
- 永远不要在没有用户许可的情况下启动 **非无头 GUI 应用** - 意外弹出的窗口会困扰和烦扰用户。

## 测试 GUI 应用

GUI 应用通常需要交互式测试，这在终端中不可用。

以下是常见解决方案：

- Web-based GUI（如 Vite、Vue、React）：
    - 如果项目提供标准非交互式测试套件（如 `vite test`），先运行它。
    - 如果非交互式测试通过：
        - 检查是否有必要进行交互式测试。
        - 使用浏览器自动化工具进行无头交互式测试。
        - 使用浏览器自动化工具截取屏幕截图，然后读取保存的图像进行视觉分析（如果代理具有视觉能力）。

- 传统本地 GUI（如 Qt、Pygame）：
    - 如果项目为非交互功能提供标准单元测试，先运行它。
    - 对于需要运行 GUI 的端到端测试：
        - 必须请求人类用户进行手动测试。

### 浏览器自动化工具

- `playwright`
- `chrome-dev-tools`
- `agent-browser`

## 测试 TUI 应用

TUI 应用通常通过终端按键进行交互。

内置的 `bash` 工具不支持交互式 TTY/PTY。

使用 `tmux-guide` 技能在 PTY 中启动 TUI 应用并发送按键。
