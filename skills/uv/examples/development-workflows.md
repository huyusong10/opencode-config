# 开发工具工作流程

## 概述

使用UV完成开发工具设置和日常工作流程模式。

## Python开发环境

```bash
# 一次性设置：安装开发工具
uv tool install black
uv tool install flake8
uv tool install mypy
uv tool install pytest
uv tool install coverage

# 日常开发工作流程
# 格式化代码
black .

# 代码检查
flake8 src/

# 类型检查
mypy src/

# 运行测试
pytest tests/

# 运行测试并生成覆盖率报告
coverage run -m pytest
coverage report
```

## 项目特定脚本执行

```bash
# 项目结构：
# my-project/
# ├── scripts/
# │   ├── setup_database.py
# │   ├── generate_docs.py
# │   └── deploy.py
# └── pyproject.toml

# 无需全局安装即可运行脚本
uvx --from . scripts/setup_database.py
uvx --from . scripts/generate_docs.py --format html
uvx --from . scripts/deploy.py --environment production
```

## 多版本测试

```bash
# 针对多个Python版本测试代码
uv python install 3.10 3.11 3.12

# 使用Python 3.10测试
uv python pin 3.10
uvx --from . tests/run_tests.py

# 使用Python 3.11测试
uv python pin 3.11
uvx --from . tests/run_tests.py

# 使用Python 3.12测试
uv python pin 3.12
uvx --from . tests/run_tests.py

# 比较结果
diff <(uv run --python 3.10 tests/test.py) \
     <(uv run --python 3.12 tests/test.py)
```

## 相关文档

- [工具管理参考](../references/tool-management.md)
- [Python环境管理](../references/python-environment.md)
- [安装和设置](../references/installation-and-setup.md)
