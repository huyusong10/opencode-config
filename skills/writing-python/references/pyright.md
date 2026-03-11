# Pyright - Python 静态类型检查器

快速的 Python 静态类型检查器。在运行前捕获类型错误。

## 为什么选择 Pyright 而不是 MyPy

- **速度**：比 MyPy 快 5-10 倍（使用 TypeScript/Node.js 编写）
- **现代化**：更好地支持最新的 Python 特性
- **IDE 集成**：为 VS Code 的 Python 扩展提供支持
- **零配置**：开箱即用，提供合理的默认设置

## 核心命令

```bash
# Check all files
uv run pyright

# Check specific files
uv run pyright path/to/file.py

# Show statistics
uv run pyright --stats

# Watch mode (re-check on file changes)
uv run pyright --watch
```

## 类型检查模式

在 `pyproject.toml` 中设置：

```toml
[tool.pyright]
typeCheckingMode = "basic"  # or "standard" or "strict"
```

- **basic**：最小化类型检查（推荐大多数项目使用）
- **standard**：中等程度的类型检查（捕获更多问题）
- **strict**：最大化类型检查（需要大量的类型注解）

## 配置

位于 `pyproject.toml`：

```toml
[tool.pyright]
pythonVersion = "3.10"
typeCheckingMode = "basic"

include = [
    ".opencode/skill",
    ".agents/scripts",
]

exclude = [
    "**/__pycache__",
    "**/.venv",
    "**/node_modules",
]

# Downgrade specific diagnostics
reportAttributeAccessIssue = "warning"  # error -> warning
reportMissingImports = "none"           # Disable entirely
```

## 常见错误类型

### 导入错误

```
ERROR: Import "requests" could not be resolved
```

**原因**：包未安装或不在虚拟环境中
**解决**：使用 `uv add requests` 安装包

### 类型不匹配

```
ERROR: Argument of type "str" cannot be assigned to parameter "x" of type "int"
```

**原因**：向函数传递了错误的类型
**解决**：转换类型或更新类型提示

### 属性访问

```
WARNING: "error" is not a known attribute of module "urllib"
```

**原因**：缺少导入或属性访问不正确
**解决**：导入正确的子模块（例如 `urllib.error`）

### 可选成员访问

```
ERROR: "read" is not a known attribute of "None"
```

**原因**：访问可能为 None 的值的属性
**解决**：在访问前添加 None 检查

## 退出代码

- `0` - 未发现错误
- `1` - 发现错误

## 输出解读

```bash
# Example output
path/to/file.py:10:5 - error: "str" is not assignable to "int" (reportArgumentType)
path/to/file.py:15:8 - warning: Import "requests" could not be resolved (reportMissingImports)
```

格式：`文件:行号:列号 - 级别: 消息 (规则代码)`

## 诊断规则

常见的诊断规则：

- `reportMissingImports` - 未解析的导入
- `reportArgumentType` - 函数参数类型不匹配
- `reportAttributeAccessIssue` - 无效的属性访问
- `reportOptionalMemberAccess` - 访问 Optional 类型的成员
- `reportGeneralTypeIssues` - 一般类型不一致

## 抑制错误

### 行内抑制

```python
# pyright: ignore[reportArgumentType]
result = function("string")  # Expects int

# Or suppress all errors on line
result = function("string")  # pyright: ignore
```

### 文件级抑制

```python
# pyright: reportMissingImports=false
import some_untyped_package
```

### 配置级抑制

```toml
[tool.pyright]
reportMissingImports = "none"
reportAttributeAccessIssue = "warning"
```

## 与测试集成

从 `/tests` 目录运行：

```bash
cd tests
uv run pyright
uv run pyright --stats
```

## 类型提示快速参考

```python
# Basic types
def greet(name: str) -> str:
    return f"Hello, {name}"

# Optional types
from typing import Optional
def find_user(id: int) -> Optional[str]:
    return None

# Lists, dicts
from typing import List, Dict
def process(items: List[str]) -> Dict[str, int]:
    return {item: len(item) for item in items}

# Modern syntax (Python 3.10+)
def process(items: list[str]) -> dict[str, int]:
    return {item: len(item) for item in items}
```

## 最佳实践

1. **从 basic 模式开始** - 逐步提高严格程度
2. **优先修复错误而非警告** - 优先处理实际的类型错误
3. **渐进式使用类型提示** - 不要一次性注解所有内容
4. **排除生成的代码** - 在配置中添加到排除列表
5. **在 CI/CD 中运行** - 在部署前捕获类型错误

## 常见模式

### 处理 PEP 723 脚本

带有内联依赖的脚本可能会显示导入错误（预期行为）：

```toml
[tool.pyright]
reportMissingImports = "warning"  # Downgrade to warning
```

### 检查特定目录

```toml
[tool.pyright]
include = [
    "../.opencode/skill/**/scripts/*.py",  # Only check scripts
]
```

### 排除虚拟环境

```toml
[tool.pyright]
exclude = [
    "**/.venv/**",
    "**/venv/**",
]
```

## 性能

Pyright 速度很快：

- 大型代码库（约 5 万行）：约 1-2 秒
- 增量检查：在监视模式下几乎即时

## 资源

- 文档：https://microsoft.github.io/pyright/
- 配置：https://microsoft.github.io/pyright/#/configuration
- 类型检查模式：https://microsoft.github.io/pyright/#/type-checking-modes
