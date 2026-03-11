# 虚拟环境工作流程

## 概述

使用 UV 进行虚拟环境管理的模式和最佳实践。

## 基础项目设置

```bash
# Create new project directory
mkdir my-project
cd my-project

# Create virtual environment
python -m venv .venv

# Activate (Windows Git Bash)
. .venv/Scripts/activate

# Activate (Linux/Mac)
source .venv/bin/activate

# Install dependencies with UV
uv pip install requests pandas numpy

# Freeze dependencies
uv pip freeze > requirements.txt

# Deactivate when done
deactivate
```

## 现有项目迁移

```bash
# Clone existing project
git clone https://github.com/user/project.git
cd project

# Create virtual environment
python -m venv .venv

# Activate
. .venv/Scripts/activate  # Windows Git Bash
source .venv/bin/activate  # Linux/Mac

# Install from requirements with UV (much faster than pip)
uv pip install -r requirements.txt

# Verify installation
python -c "import requests; print('Success!')"
```

## 多环境项目

```bash
# Development environment
python -m venv .venv-dev
. .venv-dev/Scripts/activate
uv pip install -r requirements-dev.txt
deactivate

# Production environment
python -m venv .venv-prod
. .venv-prod/Scripts/activate
uv pip install -r requirements.txt
deactivate

# Testing environment
python -m venv .venv-test
. .venv-test/Scripts/activate
uv pip install -r requirements.txt pytest coverage
deactivate

# Use specific environment
. .venv-test/Scripts/activate
pytest tests/
```

## 相关文档

- [Python 环境管理参考](../references/python-environment.md)
- [安装和设置](../references/installation-and-setup.md)
- [工具管理](../references/tool-management.md)
