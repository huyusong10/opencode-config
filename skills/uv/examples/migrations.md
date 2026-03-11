# 迁移示例

## 概述

从其他 Python 工具迁移到 UV 的指南。

## 从 pip 迁移到 UV

**迁移前:**

```bash
# Old workflow
pip install requests pandas numpy
pip freeze > requirements.txt

# Problems:
# - Slow installation
# - Dependency conflicts
# - No isolation
```

**迁移后:**

```bash
# New workflow
python -m venv .venv
. .venv/Scripts/activate
uv pip install requests pandas numpy
uv pip freeze > requirements.txt

# Benefits:
# - 10-100x faster
# - Better dependency resolution
# - Virtual environment isolation
```

## 从 pipx 迁移到 UV tool

**迁移前:**

```bash
# Old tool management
pipx install black
pipx install flake8
pipx install pytest
pipx upgrade-all
```

**迁移后:**

```bash
# New tool management
uv tool install black
uv tool install flake8
uv tool install pytest
uv tool upgrade --all

# Migration:
pipx list --short > tools.txt
cat tools.txt | xargs -n1 uv tool install
```

## 从 poetry 迁移到 UV

**迁移前:**

```bash
# Old project management
poetry new my-project
cd my-project
poetry add requests
poetry install
poetry run python script.py
```

**迁移后:**

```bash
# New project management
uv init my-project
cd my-project
uv add requests
uv sync
uv run python script.py

# Migration from existing poetry project:
poetry export -f requirements.txt -o requirements.txt
python -m venv .venv
. .venv/Scripts/activate
uv pip install -r requirements.txt
```

## 相关文档

- [安装与设置参考](../references/installation-and-setup.md)
- [工具管理](../references/tool-management.md)
- [Python 环境管理](../references/python-environment.md)
