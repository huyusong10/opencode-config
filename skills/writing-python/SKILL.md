---
name: writing-python
description: 使用 uv 开发 Python 项目（PEP 723 内联元数据、虚拟环境管理、脚本执行）。当用户提到 uv、创建 Python 脚本或需要 Python 环境设置时使用。
---

# 使用 UV 进行 Python 开发

现代 Python 开发使用 `uv` 进行包管理，使用 PEP 723 处理单文件脚本，以及业界最佳工具。

## 快速开始

### 单文件脚本（默认）

默认情况下，使用 PEP 723 格式创建自包含脚本：

```python
#!/usr/bin/env -S uv run --script
# /// script
# dependencies = [
#     "typer",
#     "rich",
# ]
# ///
"""
Script description and usage examples.

Usage:
    uv run python3 script.py --help
    uv run python3 script.py --option value
"""

import sys
# ... rest of script
```

**运行方式**: `uv run python3 script.py`

### 多文件项目

对于需要多个文件的较大项目：

```bash
# Pin Python version
uv python pin 3.12

# Create virtual environment
uv venv --python 3.12

# Activate environment
source .venv/bin/activate

# Add dependencies
uv add package-name

# Run script
uv run python script.py
```

## 开发工具

### 测试、Lint、类型检查

所有工具配置都集中在 `/tests/pyproject.toml`。

**从 `/tests` 目录运行：**

```bash
cd tests

# Run tests
uv run pytest
uv run pytest -v  # verbose

# Type checking
uv run pyright
uv run pyright --stats

# Linting & formatting
uv run ruff check ../.opencode/skill
uv run ruff check --fix ../.opencode/skill
uv run ruff format ../.opencode/skill
```

**工具选择：**

- **Ruff** - Linter/formatter（替代 Black、isort、Flake8）
- **Pyright** - 类型检查器（替代 MyPy）
- **Pytest** - 测试运行器

详细用法请参考：

- `references/ruff.md` - Lint 和格式化
- `references/pyright.md` - 静态类型检查
- `references/pytest.md` - 测试框架

## 脚本开发工作流

### 从小开始 - 增量构建

1. **基本结构** - 创建带有 `--help` 标志的脚本
2. **立即测试** - 使用 `uv run python3 script.py --help` 运行
3. **添加 `--dry-run`** - 显示将要执行的操作而不实际执行
4. **再次测试** - 验证 dry-run 输出
5. **添加 `--verbose`** - 详细输出用于调试
6. **再次测试** - 验证 verbose 模式
7. **继续增量开发** - 逐个添加功能，每次都进行测试

### Shebang 格式

```python
#!/usr/bin/env uv run python3
```

### PEP 723 依赖

```python
# /// script
# dependencies = [
#     "typer",      # Modern CLI framework
#     "rich",       # Beautiful terminal output
#     "httpx",      # Modern HTTP client
# ]
# ///
```

**最小化依赖** - 优先尝试使用标准库。

## UV 命令参考

### 包管理

```bash
uv add <package>           # Add package to pyproject.toml
uv remove <package>        # Remove package
uv sync                    # Install/sync dependencies
uv lock                    # Create/update lock file
```

### Python 版本管理

```bash
uv python install <version>  # Install Python version
uv python list               # List installed versions
uv python pin <version>      # Set project Python version
```

### 运行脚本

```bash
uv run python script.py      # Run with project environment
uvx <tool>                   # Run tool in isolated environment
uv tool install <package>    # Install global tool
```

## 首选库

### 核心工具

- **uv** - 包管理器（永远不要直接使用 pip/python3）
- **typer** - 现代 CLI 框架（基于 click 构建）
- **rich** - 美观的终端输出
- **python-dotenv** - 环境变量（或 Pydantic-Settings）

### 开发工具

- **pytest** - 测试框架
- **ruff** - 快速 lint 和格式化
- **pyright** - 静态类型检查

### 按需使用

- **httpx** - 现代 HTTP 客户端（替代 requests）
- **Pydantic-Settings** - 带验证的类型安全配置
- **Polars** - 快速 DataFrame 库（pandas 替代品）
- **DuckDB** - 嵌入式分析数据库
- **Loguru** - 简单、强大的日志记录

## 测试驱动开发

### TDD 循环

1. **红灯** - 为新功能编写失败的测试
2. **绿灯** - 编写最少代码使测试通过
3. **重构** - 改进代码，保持测试通过

### 何时使用 TDD

**常规方法**：直接编写你认为合适的代码。

**使用 TDD 的时机**：遇到问题或构建复杂组件时。

### 开发顺序（使用 TDD 时）

1. **桩代码** - 定义基本结构和接口
2. **伪代码** - 在桩代码中规划详细逻辑
3. **数据层** - 实现数据持久化和管理
4. **业务逻辑** - 实现核心应用规则
5. **CLI/前端** - 实现用户交互

## 测试结构

详细测试指南请参考 `references/pytest.md`。

### 目录结构

```
.opencode/skill/<skill>/
├── SKILL.md
└── scripts/
    ├── <script>.py
    └── tests/
        └── test_<script>.py
```

### 辅助函数模式

```python
from pathlib import Path
import subprocess

SCRIPT_PATH = Path(__file__).parent.parent / "script.py"

def run_script(*args, env=None):
    """Execute script with uv run."""
    cmd = ["uv", "run", str(SCRIPT_PATH)] + list(args)
    result = subprocess.run(cmd, capture_output=True, text=True, env=env)
    return result.stdout, result.stderr, result.returncode
```

### 测试类组织

```python
class TestVersion:
    """Test --version flag."""

    def test_version_flag(self):
        """--version should output version and exit with 0."""
        stdout, stderr, code = run_script("--version")
        assert code == 0
        assert "version" in stdout.lower()
```

### 退出码标准

| Code | Meaning                          |
| ---- | -------------------------------- |
| 0    | Success (version, help, dry-run) |
| 1    | Runtime/API error                |
| 2    | Validation error                 |
| 130  | Keyboard interrupt               |

## 类型检查

详细类型检查指南请参考 `references/pyright.md`。

### 基本类型提示

```python
def greet(name: str) -> str:
    return f"Hello, {name}"

def find_user(id: int) -> str | None:
    return None

def process(items: list[str]) -> dict[str, int]:
    return {item: len(item) for item in items}
```

### 文档字符串

使用结构化的文档字符串，包含 Args、Returns 和 Raises 部分：

```python
def calculate_total(items: list[dict], tax_rate: float = 0.0) -> float:
    """Calculate the total cost of items including tax.

    Args:
        items: List of item dictionaries with 'price' keys
        tax_rate: Tax rate as decimal (e.g., 0.08 for 8%)

    Returns:
        Total cost including tax

    Raises:
        ValueError: If items is empty or tax_rate is negative
    """
    if not items:
        raise ValueError("Items list cannot be empty")
    if tax_rate < 0:
        raise ValueError("Tax rate cannot be negative")
    
    subtotal = sum(item["price"] for item in items)
    return subtotal * (1 + tax_rate)
```

## 最佳实践

1. **仅使用 uv** - 永远不要直接运行 `python3` 或 `pip`
2. **从 PEP 723 开始** - 默认使用单文件脚本
3. **最小化依赖** - 优先尝试标准库
4. **增量测试** - 逐个功能构建和测试
5. **使用类型提示** - 使用 pyright 提前捕获错误
6. **使用 ruff 格式化** - 统一代码风格
7. **遵循退出码** - 0 表示成功，1 表示运行时错误，2 表示验证错误

## 常见陷阱

### 可变默认参数

永远不要使用可变对象（列表、字典）作为默认参数值：

```python
# BAD - The list persists across calls!
def add_item(item, items=[]):
    items.append(item)
    return items

add_item("a")  # ['a']
add_item("b")  # ['a', 'b'] - Unexpected!

# GOOD - Use None and create inside function
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
```

### 裸 except 子句

永远不要使用裸 `except:` - 始终捕获特定异常：

```python
# BAD - Catches everything including KeyboardInterrupt
try:
    do_something()
except:
    pass

# GOOD - Catch specific exceptions
try:
    do_something()
except (ValueError, TypeError) as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
```

### 与 None 比较

对 None 比较使用 `is` / `is not`：

```python
# BAD
if value == None:
    ...

# GOOD
if value is None:
    ...
```

## 安全

### 环境变量

将密钥存储在 `.env` 文件中，永远不要写在代码里：

```python
# Load from .env file
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv("API_KEY")

if not api_key:
    print("Error: API_KEY not set", file=sys.stderr)
    sys.exit(1)
```

### 必要实践

- **永远不要提交密钥** - 将 `.env` 添加到 `.gitignore`
- **永远不要记录密钥** - 不要打印 API 密钥、密码或令牌
- **永远不要硬编码** - 所有凭据都使用环境变量
- **尽早验证** - 启动时检查必需的环境变量

### .gitignore 条目

```gitignore
# Environment variables
.env
.env.local
.env.*.local
```

## 打包资源

- `references/ruff.md` - Lint 和格式化指南
- `references/pyright.md` - 类型检查指南
- `references/pytest.md` - 测试框架指南
