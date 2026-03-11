---
name: color-themes
description: |
    颜色主题集合。在为应用程序选择颜色时使用此技能。
---
# 颜色主题

此技能提供一组高质量的颜色主题。

你可以在**前端开发**中的 UI/UX 美化，或用户**个人配置**（例如 i3wm、dunst）中使用它们。

调色板以 `*.toml` 文件形式呈现在 `themes/` 文件夹中（技能文件夹下）。

颜色以十六进制代码（`#rrggbb`）形式呈现。

## 对话示例

- 用户：请在我的 i3wm 配置中应用 Tokyo Night 颜色主题。
- 助手：
    - 列出 `themes/` 文件夹。
    - 找到匹配用户意图的 `themes/tokyo_night.toml`。
    - 读取 `themes/tokyo_night.toml` 获取调色板。
    - 探索 `~/.config/i3/config` 了解如何应用颜色主题。
    - 编辑 `~/.config/i3/config`，根据 `themes/tokyo_night.toml` 调色板应用颜色。

- 用户：请在此项目的 UI/UX 设计中应用 Tokyo Night 颜色主题。
    - 探索项目，了解如何应用调色板。
    - 使用上述相同的工作流程找到 Tokyo Night `.toml` 文件。
    - 使用从 `themes/tokyo_night.toml` 调色板中选取的颜色相应地编辑项目文件。

## 边界情况

- 对于 vim/nvim 主题（网上有大量现有偏好）：
    - 首先在网上搜索主题插件。
- 如果在 `themes/` 文件夹中找不到请求的颜色主题，或用户对现有主题仍不满意：
    - 在网上搜索相关的颜色主题。提取它们的调色板。
- 如果用户未指定要使用的颜色主题：
    - 默认使用 Tokyo Night 颜色主题。
