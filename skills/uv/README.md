# UV Skill for Claude Code

一个用于使用 UV 的综合技能，UV 是一个极速的 Python 包和项目管理器。本技能提供 Python 环境管理、MCP 服务器集成和现代 Python 开发工作流程的指导。

**保持最新：** 本技能了解最近的 UV 变化，包括 Python 3.14 默认版本、自由线程 Python 支持，以及 UV 0.9.6+ 中的新功能。

## 概述

UV 是一个由 Rust 驱动的 Python 包管理器，可以替代 pip、pipx、poetry、pyenv 等工具——提供 10-100 倍的性能提升。本技能帮助 Claude Code 用户：

- 设置和管理 Python 虚拟环境
- 高效安装和管理 Python CLI 工具
- 使用 UVX 运行 MCP（模型上下文协议）服务器
- 配置 VS Code 和其他 IDE 进行 MCP 集成
- 从 pip、pipx 或 poetry 迁移到 UV
- 了解最新的 UV 功能和版本特定的变化
- 排查 UV 相关问题

## 功能特性

- **版本感知指导** - 跟踪最近的 UV 变化（0.9.6+），包括 Python 3.14 默认版本和自由线程 Python
- **完整的 UV 命令参考** - 覆盖 uv pip、uv tool、uvx、uv venv 和 uv python
- **内联脚本元数据（PEP 723）** - 在注释中包含依赖项的单文件脚本
- **MCP 服务器集成** - 发布包和本地开发的详细模式
- **跨平台支持** - Windows、Linux 和 macOS 的说明
- **真实示例** - GitHub Actions、VS Code、Continue IDE 配置
- **迁移指南** - 从 pip、pipx 和 poetry 的逐步迁移
- **性能洞察** - 了解 UV 的 10-100 倍速度提升
- **故障排除** - 常见问题和解决方案

## 安装

### 安装技能

将技能复制到您的 Claude Code 技能目录：

**Windows (Git Bash):**

```bash
cp -r . "$USERPROFILE/.claude/skills/uv"
```

**Linux/macOS:**

```bash
cp -r . ~/.claude/skills/uv
```

### 验证安装

向 Claude Code 提问："How do I install UV?" 或 "Help me set up a Python virtual environment with UV"

Claude 应该会激活此技能并提供 UV 特定的指导。

## 技能结构

```text
uv-skill/
├── SKILL.md                          # 包含核心 UV 概念的主技能文件
├── references/
│   ├── recent-changes.md             # 最新 UV 版本变化（0.9.6+）
│   ├── installation-and-setup.md     # 安装和虚拟环境设置
│   ├── tool-management.md            # UV tool install 与 uvx 对比
│   ├── mcp-integration.md            # MCP 服务器执行模式
│   ├── python-environment.md         # Python 版本管理
│   ├── inline-script-metadata.md     # PEP 723 内联依赖项
│   └── examples.md                   # 真实配置示例
├── docs/
│   └── guides/
│       └── testing-the-uv-skill.md   # 包含测试用例的测试框架
├── README.md                         # 本文件
├── VERSION                           # 当前版本
└── LICENSE                           # MIT 许可证
```

## Claude 何时使用此技能

当您执行以下操作时，Claude 将自动激活此技能：

- 询问关于 UV 或 UVX 的问题
- 需要安装或管理 Python 包
- 想要设置虚拟环境
- 使用 MCP 服务器
- 询问 Python 工具管理
- 需要从 pip、pipx 或 poetry 迁移的帮助
- 排查 UV 相关错误

## 快速入门示例

### 向 Claude 提问

**版本和最新变化：**

- "What version of UV should I be using?"
- "What's new in UV 0.9.6?"
- "How do I use free-threaded Python with UV?"
- "What Python version will UV install by default?"

**虚拟环境：**

- "How do I create a Python virtual environment with UV?"
- "Help me activate my venv and install packages using UV"

**工具管理：**

- "Should I use uv tool install or uvx for black?"
- "How do I install development tools with UV?"

**MCP 服务器：**

- "How do I run mcp-server-sqlite with uvx?"
- "Configure VS Code to use uvx for MCP servers"
- "How do I run a local MCP server with uvx --from?"

**迁移：**

- "Help me migrate from pip to UV"
- "Convert my pipx installations to UV tool"

**故障排除：**

- "I'm getting spawn uvx ENOENT error"
- "UV can't find my package"

## 包含内容

### 核心概念（SKILL.md）

- UV 命令概述（uv pip、uv tool、uvx、uv venv、uv python）
- 工具与 UVX 决策树
- MCP 服务器执行模式
- 虚拟环境管理
- 常见工作流程和集成模式
- 最佳实践和反模式

### 参考文档

1. **最新变化** - 最新 UV 版本信息（0.9.6+）、Python 3.14 默认版本、自由线程 Python、新功能
2. **安装与设置** - 跨平台安装、虚拟环境设置
3. **工具管理** - 持久化与临时执行、维护工作流程
4. **MCP 集成** - 发布包、本地开发、IDE 配置
5. **Python 环境** - 版本管理、跨平台路径
6. **内联脚本元数据** - 注释中的 PEP 723 依赖项、单文件脚本
7. **示例** - 真实 GitHub 配置、工作流程模式

## 最新变化感知

本技能紧跟最新的 UV 发展。Claude Code 将了解：

### UV 0.9.6+ 功能

- **Python 3.14 默认版本** - UV 现在默认安装 Python 3.14（之前是 3.13）
- **自由线程 Python** - 无 GIL 的 Python 3.14+，实现真正的并行执行
- **Build --clear 标志** - 使用 `uv build --clear` 自动清理旧的构建产物

### UV 0.9.7 功能

- **安全更新** - 改进的 tar/ZIP 归档处理
- **Windows x86-32 支持** - Windows 系统上更好的兼容性

### 版本感知指导

Claude Code 将：

- 如果您的 UV 版本缺少所需功能，建议升级
- 提供版本特定的说明
- 警告已弃用的功能
- 解释破坏性变更和迁移路径

询问以下问题：

- "What Python version will UV install by default?"
- "How do I use free-threaded Python with UV?"
- "Do I need to upgrade UV for Python 3.14?"
- "What's new in UV 0.9.6?"

## 核心概念

### UV 命令

| 命令 | 用途 | 使用场景 |
|---------|---------|----------|
| `uv pip install` | 安装包 | 在虚拟环境中 |
| `uv tool install` | 安装 CLI 工具 | 日常开发工具 |
| `uvx` | 临时执行 | MCP 服务器、测试 |
| `uv venv` | 创建 venv | 项目隔离 |
| `uv python install` | 安装 Python | 版本管理 |

### 工具与 UVX 决策

- **使用 `uv tool install`** 用于：black、flake8、mypy、pytest（日常工具）
- **使用 `uvx`** 用于：MCP 服务器、一次性执行、测试

### MCP 服务器模式

- **发布包**：`uvx mcp-server-sqlite --db-path /path/to/db`
- **本地开发**：`uvx --from /path/to/project server.py`

## 最佳实践

### 应该做

- 使用 `python -m venv` 创建项目虚拟环境
- 使用 `uv tool install` 安装频繁使用的开发工具
- 使用 `uvx` 执行所有 MCP 服务器
- 使用 `--from` 标志进行本地 MCP 服务器开发
- 在生产环境中固定版本（`package@1.2.3`）

### 不应该做

- 在没有虚拟环境的情况下全局安装包
- 混合使用 pip 和 uv tool 安装
- 使用 `uv tool install` 安装 MCP 服务器
- 使用 `uvx` 安装日常开发工具
- 在生产环境中使用 `@latest`

## 性能

UV 提供卓越的性能：

- **比 pip 快 10-100 倍**用于包操作
- **并行下载**和安装
- **全局缓存**与去重
- **Rust 驱动**的依赖解析
- **亚秒级**虚拟环境创建

## 故障排除

涵盖的常见问题：

- "spawn uvx ENOENT" 错误（PATH 问题）
- 找不到包（PyPI 与本地）
- 权限错误（缓存目录）
- 版本冲突（Python 版本）

请参阅参考文档中的详细故障排除内容。

## 开发

### 本地测试技能

1. 将技能复制到 Claude 技能目录
2. 重启 Claude Code（如需要）
3. 询问 UV 相关问题
4. 验证 Claude 激活技能
5. 检查响应与文档是否匹配

### 更新技能

1. 编辑 SKILL.md 或参考文件
2. 本地测试更改
3. 更新 VERSION 文件
4. 提交并推送更改

## 版本历史

- **0.1.0** - 初始版本
  - 完整的 UV 命令参考
  - UV 0.9.6+ 功能的版本感知指导
  - Python 3.14 默认版本文档
  - 自由线程 Python 支持（PEP 703）
  - 新的 `uv build --clear` 标志文档
  - 安全更新感知（tar/ZIP 处理）
  - MCP 服务器集成模式
  - 跨平台安装指南
  - 从 pip/pipx/poetry 的迁移指南
  - 真实示例和配置
  - 包含版本特定测试用例的增强测试指南
  - 全面的版本兼容性矩阵

## 贡献

欢迎贡献！改进领域：

- 更多真实示例
- 更多故障排除场景
- 其他 IDE 的集成模式
- 性能基准测试
- 平台特定优化

## 资源

### 官方文档

- [UV Official Docs](https://docs.astral.sh/uv/)
- [UV GitHub Repository](https://github.com/astral-sh/uv)
- [MCP Official Documentation](https://modelcontextprotocol.io/)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
- [VS Code MCP Support](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)

### Claude Code

- [Claude Code Skills Documentation](https://docs.claude.com/en/docs/claude-code/skills)
- [Skill Best Practices](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices)

## 许可证

MIT 许可证 - 请参阅 LICENSE 文件

## 支持

如有问题或疑问：

- 查看 `references/` 中的参考文档
- 使用此技能向 Claude Code 提问
- 查看故障排除部分
- 查阅官方 UV 文档

## 致谢

本技能基于：

- 官方 UV 文档和社区实践
- 真实的 MCP 服务器集成模式
- Claude Code 技能最佳实践
- 社区反馈和测试
