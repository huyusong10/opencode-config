# UV 工具管理参考

## 概述

UV 的工具管理系统提供了 Python CLI 应用程序的隔离安装和执行。本参考涵盖了 `uv tool` 命令、`uvx` 执行模式以及选择正确方法的决策框架。

## 快速决策指南

| 场景 | 使用方法 | 原因 |
|----------|----------|-----|
| 安装 black 代码格式化器 | `uv tool install black` | 每日使用，需要持久化 |
| 测试 MCP 服务器 | `uvx mcp-server-sqlite` | 临时性，测试用途 |
| 从本地项目运行脚本 | `uvx --from . script.py` | 一次性执行 |
| 安装开发工具 | `uv tool install pytest` | 常规使用 |
| 尝试不同的包版本 | `uvx package@1.0.0` | 版本测试 |
| 安装 CLI 实用工具 | `uv tool install httpie` | 频繁使用 |

## UV Tool Install - 持久化安装

### 目的

在隔离环境中全局安装 Python 应用程序，使其命令在系统范围内可用，同时防止依赖冲突。

### 基本命令

```bash
# Install tool from PyPI
uv tool install package-name

# Install specific version
uv tool install package-name==1.2.3

# Install from local project (editable)
uv tool install -e .

# Install from git repository
uv tool install git+https://github.com/user/repo.git

# Install with extras
uv tool install "package-name[extra1,extra2]"
```

### 管理操作

```bash
# List installed tools
uv tool list

# Show tool details
uv tool show package-name

# Upgrade a tool
uv tool upgrade package-name

# Upgrade all tools
uv tool upgrade --all

# Uninstall a tool
uv tool uninstall package-name

# Reinstall (force)
uv tool install package-name --force
```

### 最佳使用场景

**开发工具：**

```bash
uv tool install black      # Code formatter
uv tool install flake8     # Linter
uv tool install mypy       # Type checker
uv tool install pytest     # Testing framework
```

**CLI 实用工具：**

```bash
uv tool install httpie         # HTTP client
uv tool install rich-cli       # Terminal formatting
uv tool install tldr           # Command help
uv tool install cookiecutter   # Project templates
```

**依赖配置的工具：**

```bash
uv tool install pre-commit     # Git hooks
uv tool install commitizen     # Commit conventions
```

### 安装位置

**Windows:**

```text
C:\Users\{username}\AppData\Roaming\uv\tools\
├── black\
│   ├── pyvenv.cfg
│   ├── Scripts\black.exe
│   └── Lib\site-packages\
├── flake8\
│   └── ...
└── pytest\
    └── ...
```

**Linux/macOS:**

```text
~/.local/share/uv/tools/
├── black/
│   ├── pyvenv.cfg
│   ├── bin/black
│   └── lib/python3.x/site-packages/
├── flake8/
│   └── ...
└── pytest/
    └── ...
```

### 工作原理

1. **隔离**：每个工具都有自己的虚拟环境
2. **持久化**：工具在会话间保持安装状态
3. **PATH 集成**：工具命令添加到系统 PATH
4. **快速执行**：安装后无需设置时间
5. **手动更新**：运行 `uv tool upgrade` 来更新

## UVX - 临时执行

### UVX 目的

在临时隔离环境中执行 Python 包，无需永久安装。适用于一次性执行、测试和 MCP 服务器。

### UVX 基本命令

```bash
# Execute package from PyPI
uvx package-name

# Execute specific version
uvx package-name@1.2.3

# Execute with arguments
uvx package-name arg1 arg2 --flag

# Execute from local project
uvx --from /path/to/project script.py

# Execute latest version
uvx package-name@latest
```

### UVX 最佳使用场景

**MCP 服务器（推荐模式）：**

```bash
uvx mcp-server-sqlite --db-path /path/to/db
uvx mcp-server-git --repository /path/to/repo
uvx awslabs.core-mcp-server@latest
```

**一次性执行：**

```bash
uvx create-react-app my-app
uvx cookiecutter gh:user/template
```

**版本测试：**

```bash
uvx black@22.0.0 --check .
uvx black@23.0.0 --check .
uvx black@24.0.0 --check .
```

**本地开发脚本：**

```bash
uvx --from . manage.py migrate
uvx --from . scripts/data_processing.py
```

### UVX 工作原理

1. **临时环境**：每次执行创建隔离环境
2. **缓存**：环境缓存以加快后续运行
3. **无持久化**：没有永久的全局安装
4. **自动更新**：使用 `@latest` 自动版本更新
5. **设置时间**：首次运行下载包（之后缓存）

## 详细对比

### 功能矩阵

| 功能 | `uv tool install` | `uvx` |
|---------|------------------|-------|
| **目的** | 全局安装 | 临时执行 |
| **持久化** | 永久 | 临时（缓存） |
| **使用场景** | 日常工具 | 一次性执行 |
| **存储** | 持久磁盘空间 | 临时缓存 |
| **更新** | 手动 (`uv tool upgrade`) | 自动 (`@latest`) |
| **执行速度** | 即时（已安装） | 首次运行有设置时间 |
| **版本切换** | 需要重新安装 | 简单 (`@version`) |
| **本地开发** | 可编辑安装 (`-e`) | `--from` 标志 |

### 存储对比

**UV Tool Install:**

```text
~/.local/share/uv/tools/
├── black/              # ~15 MB
├── flake8/             # ~8 MB
├── mypy/               # ~25 MB
└── pytest/             # ~12 MB

Total: ~60 MB persistent storage
```

**UVX Execution:**

```text
~/.cache/uv/
├── cached-environments/
│   ├── black-23.1.0-a1b2c3/    # Temporary
│   ├── flake8-6.0.0-d4e5f6/    # Temporary
│   └── ...
└── downloaded-packages/
    └── ... # Shared package cache

Cache automatically managed by UV
```

## 实际工作流程

### 开发环境设置

```bash
# Install core development tools once
uv tool install black
uv tool install flake8
uv tool install mypy
uv tool install pytest
uv tool install coverage

# Use daily without setup time
black .
flake8 src/
mypy src/
pytest tests/
coverage run -m pytest
```

### MCP 服务器配置

**VS Code `.vscode/mcp.json`:**

```json
{
  "servers": {
    "sqlite": {
      "command": "uvx",
      "args": ["mcp-server-sqlite", "--db-path", "/path/to/db"]
    },
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "/path/to/repo"]
    },
    "local-dev": {
      "command": "uvx",
      "args": [
        "--from", "/path/to/project",
        "server.py",
        "--config", "config.json"
      ]
    }
  }
}
```

### 本地开发工作流程

```bash
# Develop a CLI tool
cd my-cli-project

# Install in development mode
uv tool install -e .

# Tool globally available during development
my-tool --help

# Make code changes...
# Changes immediately reflected (editable install)
my-tool --version  # Shows updated version
```

### 版本测试工作流程

```bash
# Test multiple versions without installing
uvx black@22.0.0 --check src/
uvx black@23.0.0 --check src/
uvx black@24.0.0 --check src/

# Find preferred version
uvx black@23.0.0 src/  # Works best

# Install preferred version permanently
uv tool install black==23.0.0
```

## 迁移模式

### 错误的全局 Pip 安装

```bash
# DON'T DO THIS - causes conflicts
pip install black flake8 mypy

# Problems:
# - Dependency conflicts between tools
# - Difficult to uninstall cleanly
# - Pollutes global Python environment
# - Version conflicts with projects
```

### 正确的 UV Tool 安装

```bash
# DO THIS - isolated tools
uv tool install black
uv tool install flake8
uv tool install mypy

# Benefits:
# - Each tool in own environment
# - Clean uninstall: uv tool uninstall
# - No dependency conflicts
# - Fast 10-100x vs pip
```

### 错误的 MCP 服务器持久化安装

```bash
# NOT RECOMMENDED for MCP servers
uv tool install mcp-server-sqlite

# Problems:
# - Goes against community patterns
# - Less flexible for version testing
# - Requires reinstall for updates
# - Not what documentation recommends
```

### 正确的 MCP 服务器 UVX 使用

```bash
# RECOMMENDED for MCP servers
uvx mcp-server-sqlite --db-path /path/to/db

# Or in VS Code config:
{
  "command": "uvx",
  "args": ["mcp-server-sqlite", "--db-path", "/path/to/db"]
}

# Benefits:
# - Follows established MCP patterns
# - Easy version testing with @version
# - Immediate code changes with --from
# - Matches GitHub examples
```

## 高级模式

### 项目特定脚本

```bash
# Run management scripts without global install
uvx --from . scripts/setup_database.py
uvx --from . scripts/generate_docs.py
uvx --from . scripts/deploy.py

# Scripts run with project dependencies
# No need to install scripts globally
```

### 多版本开发

```bash
# Test tool against multiple Python versions
uv python install 3.10 3.11 3.12

# Test with each version
uv python pin 3.10
uvx --from . my_tool.py

uv python pin 3.11
uvx --from . my_tool.py

uv python pin 3.12
uvx --from . my_tool.py
```

### CI/CD 集成

```yaml
# GitHub Actions
- name: Install development tools
  run: |
    curl -LsSf https://astral.sh/uv/install.sh | sh
    uv tool install black
    uv tool install flake8
    uv tool install pytest

- name: Run checks
  run: |
    black --check .
    flake8 .
    pytest tests/
```

## 维护工作流程

### 常规维护

```bash
# Weekly maintenance routine
uv tool list                    # Check installed tools
uv tool upgrade --all           # Update all tools
uv cache clean                  # Clean old cache

# Check for outdated tools
uv tool list  # Shows current versions

# Remove unused tools
uv tool uninstall unused-tool

# Check tool details
uv tool show black              # See version, dependencies
```

### 缓存管理

```bash
# UVX automatically manages cache
# Manual cleanup if needed

# Clean all caches
uv cache clean

# Check cache size
du -sh ~/.cache/uv/                    # Linux/Mac
dir /s "%LOCALAPPDATA%\uv\cache"       # Windows

# Selective cleanup (manual)
rm -rf ~/.cache/uv/cached-environments/old-env/
```

### 工具文档

创建 `tools.txt` 以保持团队一致性：

```text
# Development tools
black==23.1.0
flake8==6.0.0
mypy==1.0.0
pytest==7.2.0
coverage==7.0.0

# Utilities
httpie==3.2.0
rich-cli==1.8.0
tldr==3.1.0
```

从文件安装：

```bash
cat tools.txt | grep -v '^#' | xargs -n1 uv tool install
```

## 最佳实践总结

### 使用 UV Tool Install 的场景

1. **开发工具**：black, flake8, mypy, pytest
2. **日常实用工具**：httpie, rich-cli, tldr
3. **项目生成器**：cookiecutter, copier
4. **CLI 应用**：youtube-dl, magic-wormhole
5. **带配置文件的工具**：pre-commit, commitizen

### 使用 UVX 的场景

1. **MCP 服务器**：所有 MCP 服务器执行
2. **脚本测试**：运行不熟悉的包
3. **版本测试**：比较工具版本
4. **本地脚本**：项目特定的可执行文件
5. **一次性任务**：临时包执行

### 需要避免的反模式

1. **不要**：使用全局 pip 安装 CLI 工具
2. **不要**：使用 `uv tool install` 安装 MCP 服务器
3. **不要**：对日常开发工具使用 uvx
4. **不要**：混合使用 pip 和 uv tool 安装
5. **不要**：忘记定期升级工具

## 故障排除

### 工具命令未找到

**症状：**

- 安装后命令未被识别
- PATH 不包含 UV tools

**解决方案：**

```bash
# Check if tool is installed
uv tool list

# Check PATH (Linux/Mac)
echo $PATH | grep -o '[^:]*uv[^:]*'

# Check PATH (Windows)
echo %PATH% | findstr uv

# Add to PATH manually if needed
export PATH="$HOME/.local/bin:$PATH"  # Linux/Mac bashrc/zshrc
```

### 依赖冲突

**症状：**

- 工具安装失败
- 报告版本冲突

**解决方案：**

```bash
# Tools are isolated, but if issues occur:
uv tool uninstall package-name
uv cache clean
uv tool install package-name

# Use specific version
uv tool install package-name==1.2.3

# Install with force
uv tool install package-name --force
```

### UVX 执行错误

**症状：**

- 包未找到
- 本地脚本使用 --from 失败

**解决方案：**

```bash
# Verify package exists on PyPI
uvx --help package-name

# For local development, ensure pyproject.toml exists
ls -la /path/to/project/pyproject.toml

# Check --from path is absolute
uvx --from /absolute/path/to/project script.py

# Clear cache and retry
uv cache clean
uvx package-name
```

### 权限错误

**症状：**

- 无法写入工具目录
- 安装失败，权限被拒绝

**解决方案：**

```bash
# Check tool directory permissions
ls -la $(uv tool dir)

# Fix permissions (Linux/Mac)
chmod -R u+w ~/.local/share/uv/tools/

# Windows: Run as Administrator or check folder permissions
```

### 工具过时

**症状：**

- 工具行为与预期不同
- 缺少新功能

**解决方案：**

```bash
# Check installed versions
uv tool list

# Upgrade specific tool
uv tool upgrade package-name

# Upgrade all tools
uv tool upgrade --all

# Force reinstall latest
uv tool uninstall package-name
uv tool install package-name
```

## 性能特征

### UV Tool Install 性能

**安装速度：**

- 比 pip 快 10-100 倍
- 并行依赖解析
- 缓存包下载

**示例：**

```bash
# pip
time pip install black
# ~15 seconds

# uv tool
time uv tool install black
# ~2 seconds (first install)
# <1 second (cached)
```

**执行速度：**

- 即时启动（已安装）
- 无环境创建开销
- 直接二进制执行

### UVX 性能

**首次执行：**

- 包下载时间
- 环境创建（约 2-5 秒）
- 执行时间

**缓存执行：**

- 从缓存重用环境
- 启动 <1 秒
- 小包近乎即时

**示例：**

```bash
# First run
time uvx black --version
# ~5 seconds (download + setup)

# Second run
time uvx black --version
# <1 second (cached)
```

## 集成模式

### Shell 配置

添加到 `.bashrc`、`.zshrc` 或 `.bash_profile`：

```bash
# Ensure UV tools in PATH
export PATH="$HOME/.local/bin:$PATH"

# Aliases for common tools
alias fmt="black"
alias lint="flake8"
alias type="mypy"
alias test="pytest"

# Quick UVX execution
alias uvrun="uvx"

# Tool maintenance
alias uv-update="uv tool upgrade --all"
alias uv-clean="uv cache clean"
```

### VS Code 集成

```json
{
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "python.linting.mypyEnabled": true,

  "python.formatting.blackPath": "black",
  "python.linting.flake8Path": "flake8",
  "python.linting.mypyPath": "mypy"
}
```

使用 `uv tool install` 安装的工具自动对 VS Code 可用。

### Pre-commit 集成

`.pre-commit-config.yaml`:

```yaml
repos:
  - repo: local
    hooks:
      - id: black
        name: black
        entry: black
        language: system
        types: [python]

      - id: flake8
        name: flake8
        entry: flake8
        language: system
        types: [python]
```

安装工具：

```bash
uv tool install black flake8
uv tool install pre-commit
pre-commit install
```

## 总结

UV 工具管理提供两种互补的方法：

1. **`uv tool install`** - 持久化、快速、隔离安装，用于日常工具
2. **`uvx`** - 临时、灵活、缓存执行，用于测试和 MCP 服务器

选择依据：

- **使用频率**：每日使用 → `uv tool install`；偶尔使用 → `uvx`
- **工具类型**：开发工具 → `uv tool install`；MCP 服务器 → `uvx`
- **版本需求**：稳定版 → `uv tool install`；测试版 → `uvx @version`
- **社区模式**：遵循既有模式（MCP = uvx）

遵循这些模式，您可以维护一个干净、高效且无冲突的工具管理系统。
