---
name: uv
description: 当用户询问UV（Python包管理器）、需要设置Python虚拟环境、安装/管理Python CLI工具、使用UVX运行MCP服务器、决定使用uv tool install还是uvx、配置VS Code或IDE进行MCP服务器集成、从pip/pipx/poetry迁移到UV，或解决UV相关问题时，应使用此技能。当查询中提到UV、UVX、Python包管理、虚拟环境、MCP服务器、工具安装或Python版本管理时使用。
---

# UV - Python包管理器技能

## 概述

UV是一个用Rust编写的极速Python包和项目管理器。本技能提供使用UV进行Python开发的指导，特别关注MCP（模型上下文协议）服务器集成和现代工具管理工作流。

UV替代多个工具：pip、pip-tools、pipx、poetry、pyenv、twine、virtualenv等 - 通过智能缓存和并行操作实现10-100倍的性能提升。

## 版本说明

**推荐版本：UV 0.9.7+**（2025年10月最新版）

开始之前，检查您的UV版本：

```bash
uv --version
```

**重要版本特定变更：**

- **UV 0.9.6+**：Python 3.14现为默认版本（之前为3.13）
- **UV 0.9.6+**：无需显式选择即可支持自由线程Python 3.14+
- **UV 0.9.6+**：`uv build --clear`标志可用于清理构建产物
- **UV 0.9.7+**：tar/ZIP存档处理的安全更新

如果您的版本低于0.9.0，请升级以获得最佳体验：

```bash
# 使用pip
pip install --upgrade uv

# 或使用官方安装程序重新安装
# Windows
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Unix/Mac
curl -LsSf https://astral.sh/uv/install.sh | sh
```

有关详细的版本信息和迁移指导，请参阅[最近变更参考](references/recent-changes.md)。

## 何时使用此技能

在以下情况下使用此技能：

- 设置Python虚拟环境和管理Python版本
- 安装和管理Python CLI工具（开发工具、实用程序）
- 使用UVX运行MCP服务器
- 在`uv tool install`与`uvx`之间决定包执行方式
- 配置VS Code或其他IDE进行MCP服务器集成
- 从pip、pipx或poetry迁移到UV
- 解决UV相关问题

在以下情况下跳过此技能：

- 您只需要基本的Python包安装（标准pip文档可能就足够了）
- 处理遗留的Python 2.x项目

## 核心概念

### 1. UV命令概述

UV为不同的用例提供多个命令：

| 命令 | 用途 | 示例 |
|---------|---------|---------|
| `uv pip install` | 在当前环境中安装包 | `uv pip install requests` |
| `uv tool install` | 全局安装CLI工具并隔离 | `uv tool install black` |
| `uvx` | 在临时环境中执行包 | `uvx mcp-server-sqlite` |
| `uv venv` | 创建虚拟环境 | `uv venv .venv` |
| `uv python install` | 安装Python版本 | `uv python install 3.12` |

### 2. Tool与UVX决策树

```text
需要运行Python包吗？
|
├─ 每日/频繁使用？
|  └─ 是 → `uv tool install package`
|     示例：black, pytest, flake8, mypy
|
├─ MCP服务器？
|  └─ 是 → `uvx package` 或 `uvx --from path script.py`
|     示例：mcp-server-sqlite, 自定义MCP服务器
|
├─ 测试/一次性执行？
|  └─ 是 → `uvx package`
|     示例：测试新工具、版本比较
|
└─ 本地开发脚本？
   └─ 是 → `uvx --from . script.py`
      示例：项目特定脚本
```

### 3. MCP服务器执行模式

**已发布的包（无需工作目录）：**

```json
{
  "servers": {
    "sqlite": {
      "command": "uvx",
      "args": ["mcp-server-sqlite", "--db-path", "/path/to/db"]
    }
  }
}
```

**本地开发（使用--from标志）：**

```json
{
  "servers": {
    "my-server": {
      "command": "uvx",
      "args": [
        "--from", "/absolute/path/to/project",
        "server.py",
        "--config", "config.json"
      ]
    }
  }
}
```

**关键洞察**：`--from`标志就是UVX的工作目录引用。

### 4. 虚拟环境管理

UV与Python内置的venv无缝协作：

```bash
# 创建虚拟环境
python -m venv .venv

# 激活（Windows Git Bash）
. .venv/Scripts/activate

# 激活（Windows CMD）
.venv\Scripts\activate.bat

# 激活（Linux/Mac）
source .venv/bin/activate

# 使用UV安装包
uv pip install -r requirements.txt
```

## 常见工作流

### 开发工具设置

```bash
# 一次性安装开发工具
uv tool install black
uv tool install flake8
uv tool install mypy
uv tool install pytest

# 日常使用
black .
flake8 src/
mypy src/
pytest tests/
```

### MCP服务器使用

```bash
# 测试已发布的MCP服务器
uvx mcp-server-sqlite --db-path test.db
uvx mcp-server-git --repository /path/to/repo

# 本地MCP服务器开发
uvx --from /path/to/project server.py --env config.env
```

### 项目初始化

```bash
# 使用UV创建新项目
uv init my-project
cd my-project

# 添加依赖
uv add requests fastapi

# 运行项目
uv run python main.py
```

### Python版本管理

```bash
# 列出可用的Python版本
uv python list

# 安装默认Python版本（UV 0.9.6+中为3.14）
uv python install

# 安装特定Python版本
uv python install 3.12
uv python install 3.13

# 在项目中使用
uv python pin 3.12
```

**注意：** 从UV 0.9.6开始，Python 3.14是默认版本。如果您需要Python 3.13或更早版本，请明确指定版本。

### 内联脚本依赖（PEP 723）

UV支持直接在Python脚本注释中定义依赖：

```python
#!/usr/bin/env -S uv run --script
# /// script
# dependencies = [
#   "requests",
#   "pandas",
# ]
# ///

import requests
import pandas as pd

# Your code here
```

自动安装依赖并运行：

```bash
# UV自动安装依赖
uv run script.py
```

**优势：**

- 自包含的单文件脚本
- 无需pyproject.toml
- 易于共享和分发
- 非常适合实用程序和自动化

有关包含MCP服务器、Web应用、数据处理和CLI工具的综合示例，请参阅[内联脚本元数据参考](references/inline-script-metadata.md)。

## 集成模式

### VS Code MCP配置

用于`.vscode/mcp.json`或用户设置：

```json
{
  "servers": {
    "published-server": {
      "type": "stdio",
      "command": "uvx",
      "args": ["mcp-server-sqlite", "--db-path", "${workspaceFolder}/db.sqlite"]
    },
    "local-dev": {
      "type": "stdio",
      "command": "uvx",
      "args": [
        "--from", "${workspaceFolder}",
        "src/server.py"
      ]
    }
  }
}
```

### Continue IDE配置

用于`.continue/config.json`：

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "uvx",
          "args": ["mcp-server-fetch"]
        }
      }
    ]
  }
}
```

### GitHub Actions CI/CD

```yaml
- name: Setup UV
  uses: astral-sh/setup-uv@v1

- name: Install dependencies
  run: uv pip install -r requirements.txt

- name: Run tests
  run: uv run pytest
```

## 最佳实践

### 工具管理

**应该：**

- 对频繁使用的开发工具使用`uv tool install`
- 对MCP服务器使用`uvx`（遵循社区模式）
- 将工具隔离在各自的环境中
- 定期使用`uv tool upgrade --all`升级工具

**不应该：**

- 使用全局pip安装CLI工具（会导致依赖冲突）
- 使用`uv tool install`安装MCP服务器（违背社区模式）
- 对日常开发工具使用`uvx`（不必要的开销）
- 混用pip和uv工具安装

### MCP服务器模式

**应该：**

- 所有MCP服务器执行都使用UVX
- 本地开发使用`--from`
- 生产环境固定版本（`package@1.2.3`）
- 使用环境变量进行配置

**不应该：**

- 全局安装MCP服务器
- 混用工作目录方法
- 在生产环境中使用`@latest`（不稳定）
- 忘记使用`--from`指定绝对路径

### 虚拟环境

**应该：**

- 使用`python -m venv`创建项目环境
- 安装包之前先激活
- 使用`uv pip install`进行更快的包安装
- 在README中记录激活命令

**不应该：**

- 全局安装包
- 混用venv和系统Python包
- 开发前忘记激活
- 将.venv目录提交到版本控制

## 性能特征

UV的性能优势：

- 包操作比pip**快10-100倍**
- **并行下载**和安装
- 具有去重功能的**全局缓存**
- **Rust驱动**的依赖解析
- 使用硬链接的**磁盘高效**存储

典型操作时间：

- 包安装：比pip快100-1000倍
- 依赖解析：缓存包几乎瞬间完成
- 虚拟环境创建：<1秒
- UVX首次运行：包下载时间 + 执行
- UVX缓存运行：<1秒启动

## 故障排除

### 常见问题

**"spawn uvx ENOENT"错误：**

- UV/UVX不在PATH中
- 解决方案：重新安装UV或手动添加到PATH

**找不到包：**

- 在PyPI上检查包名
- 对于本地开发，验证`--from`路径
- 确保存在`pyproject.toml`

**权限错误：**

- UV缓存目录不可写
- 解决方案：检查`~/.cache/uv/`的权限

**版本冲突：**

- 多个Python版本
- 解决方案：使用`uv python pin`设置项目版本

详细故障排除请参阅：

- [安装与设置参考](references/installation-and-setup.md#troubleshooting)
- [工具管理参考](references/tool-management.md#troubleshooting)
- [MCP集成参考](references/mcp-integration.md#troubleshooting)

## 参考文档

本技能包含详细的参考文档：

1. **[最近变更](references/recent-changes.md)** ⭐ 新增
   - 最新版本信息（0.9.7+）
   - Python 3.14默认版本和自由线程支持
   - 新功能和破坏性变更
   - 版本兼容性矩阵
   - 升级指导

2. **[安装与设置](references/installation-and-setup.md)**
   - 安装方法（Windows、Linux、Mac）
   - 虚拟环境设置
   - 平台特定注意事项

3. **[工具管理](references/tool-management.md)**
   - UV tool install与UVX比较
   - 持久与临时执行
   - 维护工作流

4. **[MCP集成](references/mcp-integration.md)**
   - 已发布包模式
   - 使用--from进行本地开发
   - VS Code和IDE配置

5. **[Python环境](references/python-environment.md)**
   - Python版本管理
   - 系统路径（pyenv、uv、系统）
   - 跨平台兼容性

6. **[内联脚本元数据](references/inline-script-metadata.md)**
   - PEP 723注释中的内联依赖
   - 具有自动依赖管理的单文件脚本
   - MCP服务器、Web应用和CLI工具
   - 最佳实践和故障排除

7. **[示例](examples/README.md)**
   - 真实的GitHub配置
   - 常见工作流模式
   - 应避免的反模式

## 外部资源

- **UV官方文档**：<https://docs.astral.sh/uv/>
- **UV GitHub仓库**：<https://github.com/astral-sh/uv>
- **MCP官方文档**：<https://modelcontextprotocol.io/>
- **MCP服务器仓库**：<https://github.com/modelcontextprotocol/servers>
- **VS Code MCP支持**：<https://code.visualstudio.com/docs/copilot/chat/mcp-servers>

## 迁移指南

### 从pip迁移

```bash
# 旧方式
pip install requests

# 新方式
uv pip install requests
```

### 从pipx迁移

```bash
# 旧方式
pipx install black

# 新方式
uv tool install black
```

### 从poetry迁移

```bash
# 旧方式
poetry add requests
poetry install

# 新方式
uv add requests
uv sync
```

## 总结

UV为Python包管理提供了统一、快速和现代的方法。有效使用UV的关键是：

1. **了解工具生态**：uv pip、uv tool、uvx各司其职
2. **遵循社区模式**：MCP服务器使用UVX，开发工具使用uv tool
3. **利用隔离**：每个工具都有自己的环境，防止冲突
4. **本地开发使用--from**：MCP服务器开发的必备模式
5. **保持工具更新**：定期维护可防止问题

通过遵循这些模式并利用参考文档，您将拥有一个干净、高效且可维护的Python开发环境。
