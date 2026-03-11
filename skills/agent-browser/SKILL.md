---
name: agent-browser
description: 使用此技能进行浏览器自动化。
---

# agent-browser

一个用于浏览器自动化的CLI工具。它维护一个带有cookie的持久浏览器会话 - 登录一次，在所有后续导航中保持认证状态。

## 开始之前

### 仅在需要交互时使用agent-browser
对于读取或获取网页内容，优先使用标准的网页搜索和
获取工具。仅在任务需要交互时使用agent-browser：
点击、表单提交或有状态导航。

### 子代理安全门
如果作为子代理运行，在使用agent-browser之前必须加载`testing-safety-protocol`
技能。只有在协议允许时才继续。
如果不允许，停止并不要使用agent-browser。

### --headed
- 主代理（与用户的交互式会话）：始终使用`--headed`
- 子代理：默认无头模式；仅在明确指示时使用`--headed`

## 先决条件

如果未安装`agent-browser`，它是一个系统级CLI工具。加载`installing-dependencies`技能，告知用户需要安装什么以及它写入到哪里，并在继续之前等待明确许可。

## 会话

agent-browser保持单个浏览器会话。只要会话存活，cookie就会在所有`open`调用之间持久保存。

```bash
agent-browser session --json                   # 显示当前会话名称
agent-browser session list --json              # 列出所有活跃会话
```

### 打开浏览器

```bash
# 首次打开：重置任何过期状态，然后设置一致的视口
agent-browser close && agent-browser open https://example.com [--headed]
agent-browser set viewport 1920 1080

# 后续导航：只需打开，cookie会被保留
agent-browser open https://example.com/dashboard [--headed]
```

`--headed`遵循"开始之前"中的决定。

### 浏览器设置

```bash
agent-browser set viewport 1920 1080                         # 视口大小
agent-browser set media dark                                 # 深色模式
agent-browser set media light                                # 浅色模式
agent-browser set headers '{"Accept-Language": "en-US"}'    # 请求头
```

### 关闭会话

`close`销毁会话并删除所有cookie。仅在需要完全重新开始或完全完成任务时使用它。关闭后，任何已认证的站点都需要重新登录。

```bash
agent-browser close
```

## 快照

快照返回当前页面的交互元素，每个元素都分配了一个引用句柄（`@e1`、`@e2`等）。在交互之前始终获取新的快照，并在页面内容发生变化时重新获取快照（导航、模态框打开/关闭、AJAX更新）。

```bash
agent-browser snapshot -i --json               # 获取带有@refs的交互元素
```

## 交互

所有交互命令都使用最新快照中的`@ref`句柄。

```bash
agent-browser click @e1                        # 点击元素
agent-browser fill @e2 "text"                  # 清空字段并填充文本
agent-browser type @e2 "text"                  # 在字段中输入文本而不先清空
agent-browser press Enter                      # 按下键盘按键
agent-browser select @e3 "option-value"        # 选择下拉选项
agent-browser check @e4                        # 勾选复选框
agent-browser hover @e5                        # 悬停在元素上
agent-browser scroll down 500                  # 按像素滚动页面
```

### Cookie横幅

打开任何面向公众的页面后，检查是否存在cookie同意横幅并在继续之前关闭它 - 除非用户明确要求保留它以进行调试。

```bash
agent-browser snapshot -i --json               # 检查是否存在cookie横幅
agent-browser click @eX                        # 点击"接受"/"全部接受"（使用正确的@ref）
```

## 导航

```bash
agent-browser open https://example.com         # 导航到URL（会话和cookie被保留）
agent-browser back                             # 后退
agent-browser forward                          # 前进
agent-browser reload                           # 重新加载当前页面
```

## 等待

```bash
agent-browser wait @e1                         # 等待元素在DOM中存在
agent-browser wait 2000                        # 等待固定毫秒数（谨慎使用）
agent-browser wait --text "Success"            # 等待文本出现在页面上
```

优先使用`wait @ref`或`wait --text`而不是固定时间等待 - 它们会在条件满足时立即解决，如果条件从未满足则会快速失败。

## 提取数据

```bash
agent-browser get text @e1 --json             # 元素的文本内容
agent-browser get value @e2 --json            # 输入框的当前值
agent-browser get html @e1 --json             # 元素的外部HTML
agent-browser get attr data-id @e1 --json     # 属性值
agent-browser get title --json                # 页面标题
agent-browser get url --json                  # 当前URL
agent-browser get box @e1 --json              # 边界框（x, y, width, height）
```

### 读取页面文本

```bash
agent-browser eval "document.body.innerText.split('\n').slice(0, 80).join('\n')"
```

## 截图

始终保存到`/tmp/agent-screenshots/`以避免污染项目目录。将`YYYYMMDD-HHMMSS`替换为实际时间戳（例如`20260220-143000`）。

```bash
mkdir -p /tmp/agent-screenshots
agent-browser screenshot /tmp/agent-screenshots/YYYYMMDD-HHMMSS-description.png
agent-browser screenshot /tmp/agent-screenshots/YYYYMMDD-HHMMSS-description.png --full
```

## 开发者工具

### 控制台和错误

`console`捕获所有日志级别（log、warn、error、debug）。`errors`是仅显示页面错误的子集。

```bash
agent-browser console --json                  # 所有控制台输出
agent-browser console --clear                 # 清空控制台缓冲区
agent-browser errors --json                   # 仅页面错误
```

### Cookie和存储

```bash
agent-browser cookies get --json              # 当前会话的所有cookie
agent-browser cookies clear                   # 删除所有cookie
agent-browser storage local --json            # localStorage内容
agent-browser storage session --json          # sessionStorage内容
```

### 网络

```bash
agent-browser network requests --json         # 所有捕获的网络请求
agent-browser network requests --filter "api" --json   # 按URL子字符串过滤
agent-browser network requests --clear        # 清空请求缓冲区
agent-browser network route "*/api/*" --abort          # 阻止匹配的请求
agent-browser network route "*/api/*" --body '{"mock":true}'  # 模拟响应
agent-browser network unroute                 # 移除所有路由规则
```

### JavaScript评估

```bash
agent-browser eval "window.location.href"            # 从页面读取值
agent-browser eval "localStorage.getItem('token')"   # 检查存储
agent-browser eval "document.title"                  # 任何JS表达式
```

## 认证

对于基于表单的登录：

```bash
agent-browser open https://example.com/login [--headed]
agent-browser snapshot -i --json
agent-browser fill @eUsername "user@example.com"
agent-browser fill @ePassword "secret"
agent-browser click @eSubmit
# Cookie会自动保存 - 未来的open调用将保持认证状态
```

对于基于令牌的API或本地化内容，在导航之前注入请求头：

```bash
agent-browser set headers '{"Authorization": "Bearer <token>"}'
agent-browser set headers '{"Accept-Language": "zh-CN"}'
agent-browser open https://example.com/api/resource [--headed]
```

## 调试

```bash
agent-browser highlight @e1                   # 在浏览器中可视化高亮元素
agent-browser trace start                     # 开始录制Playwright追踪
agent-browser trace stop /tmp/trace.zip       # 保存追踪以供检查
```

### 浏览器停止响应时的恢复

`pkill`会丢失所有cookie。恢复后，需要重新登录任何已认证的站点。

```bash
pkill -x agent-browser
sleep 5
agent-browser open https://example.com --headed
agent-browser set viewport 1920 1080
```
