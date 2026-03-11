# 应避免的反模式

## 概述

使用 UV 时应避免的常见错误。

## 全局 pip 安装

**不要这样做:**

```bash
# 错误：全局 pip 安装
pip install black flake8 mypy
# 问题：
# - 依赖冲突
# - 污染全局 Python 环境
# - 难以卸载
# - 与项目版本冲突
```

**应该这样做:**

```bash
# 正确：UV tool 安装
uv tool install black
uv tool install flake8
uv tool install mypy
# 优点：
# - 隔离的环境
# - 无冲突
# - 易于管理
# - 干净卸载
```

## 使用 uv tool 安装 MCP 服务器

**不要这样做:**

```bash
# 错误：持久安装 MCP 服务器
uv tool install mcp-server-sqlite
# 问题：
# - 不符合社区模式
# - 测试灵活性较差
# - 更新需要重新安装
# - 不是文档推荐的方式
```

**应该这样做:**

```bash
# 正确：使用 uvx 运行 MCP 服务器
uvx mcp-server-sqlite --db-path /path/to/db

# 在 VS Code 配置中：
{
  "command": "uvx",
  "args": ["mcp-server-sqlite", "--db-path", "/path/to/db"]
}
# 优点：
# - 符合社区模式
# - 便于版本测试
# - 与文档一致
# - 即时更新
```

## 使用 uvx 运行日常工具

**不要这样做:**

```bash
# 错误：使用 uvx 运行频繁使用的工具
uvx black my_file.py  # 每次都要运行
uvx flake8 .         # 每次都要运行
uvx pytest          # 每次都要运行
# 问题：
# - 不必要的开销
# - 执行速度慢
# - 需要缓存管理
# - 不是最佳使用场景
```

**应该这样做:**

```bash
# 正确：使用 uv tool 安装工具
uv tool install black flake8 pytest

# 然后直接使用
black my_file.py
flake8 .
pytest
# 优点：
# - 即时执行
# - 无开销
# - 持久安装
# - 最佳性能
```

## 混合工具管理

**不要这样做:**

```bash
# 错误：混用 pip 和 uv tool
pip install --user black
uv tool install flake8
pipx install pytest
# 问题：
# - 管理不一致
# - 难以追踪
# - 潜在冲突
# - 维护困难
```

**应该这样做:**

```bash
# 正确：统一使用 UV tool
uv tool install black
uv tool install flake8
uv tool install pytest
# 优点：
# - 管理一致
# - 易于追踪
# - 无冲突
# - 维护简单
```

## 忘记使用虚拟环境

**不要这样做:**

```bash
# 错误：全局安装包
cd my-project
uv pip install requests  # 安装到全局 Python
# 问题：
# - 污染全局环境
# - 版本冲突
# - 难以复现
# - 无隔离
```

**应该这样做:**

```bash
# 正确：始终使用虚拟环境
cd my-project
python -m venv .venv
. .venv/Scripts/activate
uv pip install requests
# 优点：
# - 项目隔离
# - 环境干净
# - 易于复现
# - 不污染全局
```

## 相关文档

- [工具管理参考](../references/tool-management.md)
- [MCP 集成](../references/mcp-integration.md)
- [Python 环境管理](../references/python-environment.md)
