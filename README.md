# OpenCode 配置仓库

个人 OpenCode AI 编程助手配置文件集合。

## 目录结构

```
opencode-config/
├── opencode.json          # 主配置文件
├── tui.json               # TUI 主题配置
├── AGENTS.md              # 用户偏好设置
├── agent/                 # 自定义 Agent
├── command/               # 自定义 Command
├── skills/                # 技能定义
├── plugin/                # 插件
└── ref/                   # 参考文档
```

## 主配置文件

### opencode.json

#### Provider（AI 提供商）

| Provider | SDK | API 端点 |
|----------|-----|----------|
| alibaba-coding-plan | @ai-sdk/anthropic | DashScope Anthropic API |
| tencent-coding-plan | @ai-sdk/openai-compatible | 腾讯云 LKEAP API |

#### Models（可用模型）

**阿里云**: Qwen3.5 Plus, Qwen3 Max, Qwen3 Coder Next/Plus, MiniMax-M2.5, GLM-5/4.7, Kimi K2.5

**腾讯云**: tc-code-latest, Hunyuan 2.0 (Instruct/Thinking), Hunyuan-T1/Turbos, MiniMax-M2.5, Kimi K2.5, GLM-5

#### MCP（Model Context Protocol）

| 服务 | 类型 | 默认状态 |
|------|------|----------|
| WebSearch | remote | disabled |
| playwright | local | disabled |
| context7 | remote | disabled |

#### Permission（权限）

- 默认策略：询问用户
- 白名单：`~/.config/opencode/*`, `~/.zshrc`, `/tmp/*`

#### Plugin（插件）

- `@mohak34/opencode-notifier` - 通知插件
- `opencode-pty` - PTY 支持
- `@my-org/custom-plugin` - 自定义插件

### tui.json

TUI 主题配置，当前使用 `tokyonight` 主题。

### AGENTS.md

AI 助手用户偏好：
- 使用 ASCII 连字符
- 中文回复，英文文档
- Python 使用 uv
- 遵循项目现有编码风格

## 自定义 Agent

### 核心工作流

| Agent | 用途 |
|-------|------|
| **paraller-expert** | 并行任务协调 - 协调工作流程、委托子代理、跟踪任务进度 |
| **worker** | 工作代理 - 实现单一任务，遵循验收标准 |
| **committer** | 提交代理 - 处理 git 提交，唯一职责 |

### 探索与研究

| Agent | 用途 |
|-------|------|
| **discover** | 头脑风暴 - 明确目标、分解需求、创建 tasks.json |
| **web-scraper** | 网页抓取 - 研究外部仓库、文档、最佳实践 |

### 规范驱动开发

基于状态机的完整开发框架：

| Agent | 用途 |
|-------|------|
| **spec-orchestrator** | 规范编排 - 协调功能从请求到实现的完整生命周期 |
| **spec-write** | 规范编写 - 创建 specs/*.md 文档 |
| **spec-feasible** | 可行性研究 - 幻觉检查、外部验证、TDD 可行性分析 |
| **spec-implement** | 规范实现 - 根据规范实现代码 |
| **spec-review** | 规范审查 - 检查实现是否符合规范 |
| **spec-test** | 规范测试 - 执行测试步骤，报告状态 |

状态流转：`Draft → Active → Realized → Regressible → Realized`

## 自定义 Command

### Ralph Wiggum 循环

| Command | 用途 |
|---------|------|
| **/ralph-loop** | 启动迭代开发循环 - AI 重复处理同一任务，看到之前的工作 |
| **/ralph-help** | 解释 Ralph Wiggum 技术 |
| **/cancel-ralph** | 取消活动的 Ralph 循环 |

### 工具命令

| Command | 用途 |
|---------|------|
| **/review-custom-command** | 审查 opencode 命令文件 |
| **/prompt-engineering** | 提示词工程审查 |
| **/repo-analyser** | 仓库分析 - 生成 CODEBASE.md |
| **/code-review** | 代码审查 - 逆向工程为提示规范 |

## Skills

| Skill | 用途 | 触发条件 |
|-------|------|----------|
| **writing-skills** | Skills 编写方法论（TDD for docs） | 创建/编辑/验证 Skills |
| **writing-python** | Python 开发指南（uv, Ruff, Pyright） | 使用 uv 开发 Python 项目 |
| **writing-bash-scripts** | Bash 脚本编写（严格模式、Shellcheck） | 创建/重构 Shell 脚本 |
| **verification-before-completion** | 完成前验证流程 | 声称工作完成之前 |
| **uv** | UV 包管理器全面指南 | Python 包管理、MCP 服务器 |
| **testing-safe-protocol** | 测试安全协议 | 测试和调试软件之前 |
| **tdd-workflow** | 7 步 TDD 循环 | 测试驱动开发 |
| **spec-document** | 规范文档标准模板 | 编写规范文档 |
| **systematic-debugging** | 系统化调试（4 阶段） | 遇到 bug 或失败 |
| **mistake-notebook** | 错误笔记本 | 查询/记录错误解决方案 |
| **interactive-test** | 交互式应用测试 | 测试 GUI/TUI 应用 |
| **defining-requirements** | 需求定义方法论 | 作为产品经理定义需求 |
| **color-themes** | 颜色主题集合 | 为应用选择颜色 |
| **agent-browser** | 浏览器自动化 | 需要浏览器交互 |

## Plugin

### ralph.ts

实现 Ralph Wiggum 技术 - 持续自引用 AI 循环用于迭代开发。

- 监听 `session.idle` 事件
- 读取状态文件 `ralph-loop.local.md`
- 检测 `<promise>` 标签停止循环
- 支持最大迭代次数限制

## 环境变量

| 变量名 | 用途 |
|--------|------|
| `OPENCODE_ALIBABA_API_KEY` | 阿里云 Coding Plan API Key |
| `OPENCODE_TENCENT_API_KEY` | 腾讯 Coding Plan API Key |
| `OPENCODE_MCP_WEBSEARCH_KEY` | WebSearch MCP 认证 Key |
| `OPENCODE_CONTEXT7_KEY` | Context7 API Key |

## 设计亮点

1. **职责分离**：每个代理有明确的单一职责
2. **只读审查**：spec-feasible、spec-review、spec-test 为只读，确保公正性
3. **子代理委派**：通过 `@agent-name` 语法形成代理层级
4. **状态机管理**：规范驱动开发使用明确的状态流转
5. **测试左移**：在最早层捕获 bug
6. **TDD for Docs**：Skills 编写遵循 RED-GREEN-REFACTOR 循环
