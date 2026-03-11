# 常用模式

## 概述

UV 开发中常用的模式和配置。

## 开发工具套件

```bash
# 安装完整的开发套件
uv tool install black         # 代码格式化工具
uv tool install flake8        # 代码检查工具
uv tool install mypy          # 类型检查工具
uv tool install pytest        # 测试框架
uv tool install coverage      # 覆盖率工具
uv tool install pre-commit    # Git 钩子
uv tool install commitizen    # 提交规范工具
uv tool install cookiecutter  # 项目模板

# 验证安装
uv tool list

# 每周维护
uv tool upgrade --all
uv cache clean
```

## Pre-commit 集成

**.pre-commit-config.yaml:**

```yaml
repos:
  - repo: local
    hooks:
      - id: black
        name: 使用 black 格式化
        entry: black
        language: system
        types: [python]

      - id: flake8
        name: 使用 flake8 检查
        entry: flake8
        language: system
        types: [python]

      - id: mypy
        name: 使用 mypy 类型检查
        entry: mypy
        language: system
        types: [python]
```

**设置:**

```bash
# 安装工具
uv tool install black flake8 mypy pre-commit

# 安装钩子
pre-commit install

# 测试钩子
pre-commit run --all-files
```

## Shell 配置

**~/.bashrc 或 ~/.zshrc:**

```bash
# UV 别名
alias uv-update='uv tool upgrade --all'
alias uv-clean='uv cache clean'

# 开发别名
alias fmt='black'
alias lint='flake8'
alias type='mypy'
alias test='pytest'

# 项目快捷方式
alias venv-activate='. .venv/Scripts/activate'  # 或 source .venv/bin/activate
alias venv-create='python -m venv .venv'
alias deps-install='uv pip install -r requirements.txt'
alias deps-freeze='uv pip freeze > requirements.txt'

# 确保 UV 工具在 PATH 中
export PATH="$HOME/.local/bin:$PATH"
```

## 相关文档

- [工具管理参考](../references/tool-management.md)
- [安装与设置](../references/installation-and-setup.md)
- [开发工作流](development-workflows.md)
