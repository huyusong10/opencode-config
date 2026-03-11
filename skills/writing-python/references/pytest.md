# Pytest - Python测试框架

现代、功能丰富的Python测试框架。Python测试的行业标准。

## 为什么选择Pytest

- **简单语法**：使用普通的 `assert` 语句（无需 `self.assertEqual`）
- **自动发现**：自动查找测试
- **丰富的生态系统**：提供数千个插件
- **详细的输出**：带有上下文的清晰失败消息
- **Fixtures**：强大的依赖注入机制用于测试设置

## 核心命令

```bash
# 运行所有测试
uv run pytest

# 运行特定文件
uv run pytest path/to/test_file.py

# 运行特定测试类
uv run pytest path/to/test_file.py::TestClass

# 运行特定测试函数
uv run pytest path/to/test_file.py::TestClass::test_method

# 详细输出
uv run pytest -v

# 显示打印语句
uv run pytest -s

# 第一次失败时停止
uv run pytest -x

# 运行上次失败的测试
uv run pytest --lf
```

## 测试发现

Pytest自动查找匹配以下模式的测试：

- 文件：`test_*.py` 或 `*_test.py`
- 类：`Test*`
- 函数：`test_*`

## 测试结构

```python
# test_example.py
import subprocess
from pathlib import Path

# 辅助函数（每个文件运行一次）
SCRIPT_PATH = Path(__file__).parent.parent / "script.py"

def run_script(*args):
    """使用 uv run 执行脚本并返回输出。"""
    cmd = ["uv", "run", str(SCRIPT_PATH)] + list(args)
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout, result.stderr, result.returncode

# 测试类（分组相关测试）
class TestVersion:
    """测试 --version 标志。"""

    def test_version_flag(self):
        """--version 应该输出版本并以 0 退出。"""
        stdout, stderr, code = run_script("--version")
        assert code == 0
        assert "version" in stdout.lower()

    def test_version_short_flag(self):
        """--V 应该等同于 --version。"""
        stdout, stderr, code = run_script("-V")
        assert code == 0
        assert "version" in stdout.lower()
```

## 断言

```python
# 基本断言
assert value == expected
assert value != unexpected
assert value in collection
assert value is None
assert value is not None

# 字符串断言
assert "substring" in text
assert text.startswith("prefix")
assert text.endswith("suffix")

# 数值断言
assert count > 0
assert 0 <= percentage <= 100

# 异常断言
import pytest
with pytest.raises(ValueError):
    function_that_should_raise()

with pytest.raises(ValueError, match="specific message"):
    function_that_should_raise()
```

## 退出码测试模式

```python
class TestExitCodes:
    """测试退出码标准。"""

    def test_success_returns_zero(self):
        """成功执行返回 0。"""
        stdout, stderr, code = run_script("--help")
        assert code == 0

    def test_validation_error_returns_two(self):
        """验证错误返回 2。"""
        stdout, stderr, code = run_script("--invalid-flag")
        assert code == 2

    def test_runtime_error_returns_one(self):
        """运行时错误返回 1。"""
        stdout, stderr, code = run_script("--api-call")
        assert code == 1
```

## Fixtures

Fixtures提供可重用的设置/清理：

```python
import pytest
import tempfile
from pathlib import Path

@pytest.fixture
def temp_file():
    """创建用于测试的临时文件。"""
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
        temp_path = Path(f.name)

    yield temp_path  # 测试在此运行

    # 测试后清理
    temp_path.unlink(missing_ok=True)

def test_file_processing(temp_file):
    """测试正确处理文件。"""
    temp_file.write_text("test content")
    stdout, stderr, code = run_script("--input", str(temp_file))
    assert code == 0
```

## 参数化测试

使用不同输入运行相同测试：

```python
import pytest

@pytest.mark.parametrize("size,expected", [
    ("1024x1024", 0),
    ("512x512", 0),
    ("invalid", 2),
])
def test_size_validation(size, expected):
    """测试 size 参数验证。"""
    stdout, stderr, code = run_script("--size", size)
    assert code == expected
```

## 配置

位于 `pyproject.toml`：

```toml
[tool.pytest.ini_options]
testpaths = [
    ".opencode/skill/my-skill/scripts/tests",
]
python_files = "test_*.py"
python_functions = "test_*"
addopts = "-v --tb=short"
```

选项：

- `testpaths` - 搜索测试的目录
- `python_files` - 测试文件模式
- `python_functions` - 测试函数模式
- `addopts` - 默认命令行选项
  - `-v` - 详细输出
  - `--tb=short` - 较短的回溯格式
  - `-x` - 第一次失败时停止
  - `--lf` - 运行上次失败的测试

## 输出解释

```bash
# 成功
test_example.py::TestVersion::test_version_flag PASSED

# 失败
test_example.py::TestVersion::test_version_flag FAILED
>       assert code == 0
E       assert 1 == 0

# 摘要
===== 5 passed, 1 failed in 0.50s =====
```

## 常见模式

### 测试CLI脚本

```python
def run_script(*args, env=None):
    """执行脚本并支持可选的环境变量。"""
    cmd = ["uv", "run", str(SCRIPT_PATH)] + list(args)
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        env=env
    )
    return result.stdout, result.stderr, result.returncode
```

### 测试环境变量

```python
import os

def test_missing_api_key():
    """脚本在没有 API key 时优雅地失败。"""
    env = os.environ.copy()
    env.pop("API_KEY", None)
    stdout, stderr, code = run_script(env=env)
    assert code == 1
    assert "API_KEY" in stderr
```

### 测试文件操作

```python
import tempfile
from pathlib import Path

def test_output_file():
    """脚本创建输出文件。"""
    with tempfile.TemporaryDirectory() as tmpdir:
        output = Path(tmpdir) / "output.txt"
        stdout, stderr, code = run_script("--output", str(output))
        assert code == 0
        assert output.exists()
        assert output.read_text() == "expected content"
```

## 测试组织

```
.opencode/skill/my-skill/
├── SKILL.md
└── scripts/
    ├── my_script.py
    └── tests/
        ├── test_my_script.py
        ├── TEST_PLAN.md       # 可选：计划中的测试
        └── README.md          # 可选：测试文档
```

## 最佳实践

1. **每个测试一个断言** - 使失败更清晰
2. **描述性的测试名称** - `test_invalid_size_returns_error`
3. **使用类分组** - `TestVersion`、`TestValidation`
4. **测试退出码** - 验证成功 (0) 和错误码 (1, 2)
5. **测试错误消息** - 确保有有用的错误输出
6. **使用fixtures进行设置** - 避免重复的设置代码
7. **清理资源** - 使用fixtures或try/finally

## 与测试目录集成

从 `/tests` 目录运行：

```bash
cd tests
uv run pytest                    # 运行所有测试
uv run pytest --collect-only     # 列出所有测试
uv run pytest -v                 # 详细输出
```

## 常见问题

### 测试未找到

- 检查文件命名：`test_*.py`
- 检查函数命名：`test_*`
- 验证 `pyproject.toml` 中的 `testpaths`

### 导入错误

- 确保脚本依赖已安装
- 检查 `SCRIPT_PATH` 指向正确的文件
- 验证从正确的目录运行

### 断言失败

- 使用 `-v` 获取详细输出
- 使用 `-s` 查看打印语句
- 检查输出中的实际值与预期值

## 资源

- 文档：https://docs.pytest.org/
- Fixtures：https://docs.pytest.org/en/stable/fixture.html
- 参数化：https://docs.pytest.org/en/stable/parametrize.html
- 插件：https://docs.pytest.org/en/stable/plugins.html
