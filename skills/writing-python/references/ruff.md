# Ruff - Python 代码检查器与格式化工具

用 Rust 编写的快速 Python 代码检查器和格式化工具。可替代 Black、isort 和多个 Flake8 插件。

## 为什么选择 Ruff

- **Ruff > Black**: 快 10-100 倍，包含代码检查 + 格式化
- **Ruff > isort**: 内置导入排序，具有相同的速度优势
- **Ruff > Flake8/Pylint**: 单一工具，速度更快，支持自动修复

## 核心命令

```bash
# Lint code (check for issues)
uv run ruff check .

# Auto-fix issues
uv run ruff check --fix .

# Format code
uv run ruff format .

# Lint + format in one go
uv run ruff check --fix . && uv run ruff format .
```

## 常用工作流

### 提交前检查

```bash
uv run ruff check --fix .
uv run ruff format .
```

### CI/CD 集成

```bash
# Check only (no modifications)
uv run ruff check .
uv run ruff format --check .
```

### 指定文件/目录

```bash
uv run ruff check path/to/file.py
uv run ruff format scripts/
```

## 配置

配置文件位于 `pyproject.toml` 或 `ruff.toml`:

```toml
[tool.ruff]
target-version = "py310"
line-length = 100

[tool.ruff.lint]
select = [
    "E",      # pycodestyle errors
    "F",      # pyflakes
    "I",      # isort (import sorting)
    "UP",     # pyupgrade (modern Python syntax)
    "B",      # flake8-bugbear (common bugs)
    "SIM",    # flake8-simplify (simplification)
]
ignore = [
    "E501",   # line too long (formatter handles this)
]
```

## 规则类别

常用规则前缀：

- `E`, `W` - pycodestyle（样式违规）
- `F` - Pyflakes（逻辑错误）
- `I` - isort（导入排序）
- `UP` - pyupgrade（语法现代化）
- `B` - bugbear（可能的错误）
- `SIM` - simplify（代码简化）
- `C90` - mccabe（复杂度）
- `N` - pep8-naming（命名规范）

## 退出码

- `0` - 未发现问题
- `1` - 发现问题（或执行过程中出错）

## 输出解读

```bash
# Example output
path/to/file.py:10:5: F841 Local variable `x` is assigned but never used
path/to/file.py:15:1: E302 Expected 2 blank lines, found 1
```

格式：`文件:行:列: 代码 消息`

## 与测试集成

从 `/tests` 目录运行：

```bash
cd tests
uv run ruff check ../.opencode/skill
uv run ruff format ../.opencode/skill
```

## 最佳实践

1. **提交前运行** - 尽早发现问题
2. **使用 --fix** - 自动修复大多数问题
3. **最后格式化** - 在 `format` 之前运行 `check --fix`
4. **谨慎忽略** - 仅在有充分理由时忽略规则
5. **项目级配置** - 将配置保存在 `pyproject.toml` 中

## 常见问题

### 导入排序冲突

Ruff 会自动处理导入排序。如果存在 isort，请将其移除。

### 行长度

格式化工具遵循 `line-length` 设置。默认值为 88（Black 的默认值）。

### 忽略特定行

```python
# ruff: noqa: E501
very_long_line_that_should_not_be_checked()

# Or specific rule
x = 1  # noqa: F841
```

## 性能

Ruff 比其他工具快 10-100 倍：

- 大型代码库（约 5 万行）：约 0.1 秒 vs 10 秒以上（Black/Flake8）
- 增量检查：近乎即时

## 资源

- 文档：https://docs.astral.sh/ruff/
- 规则：https://docs.astral.sh/ruff/rules/
- 配置：https://docs.astral.sh/ruff/configuration/
