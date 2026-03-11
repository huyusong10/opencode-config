# UV 最新变更和版本信息

## 当前推荐版本

**最新稳定版本: 0.9.7** (发布于 2025年10月30日)

本文档跟踪 UV 中的最新变更，这些变更可能会影响您的工作流程，特别是那些尚不为人熟知或未在其他地方记录的功能。

## 版本检查

在使用 UV 之前，请验证您安装的版本:

```bash
uv --version
```

### 最低推荐版本: 0.9.0

如果您使用的是旧版本，请使用以下命令升级:

```bash
# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Unix/Mac
curl -LsSf https://astral.sh/uv/install.sh | sh

# 使用 pip
pip install --upgrade uv

# 使用 pipx
pipx upgrade uv
```

## 近期版本的主要变更

### 版本 0.9.7 (2025年10月30日)

#### 安全更新 - Tar 解压

**变更内容:**
升级到 `astral-tokio-tar` 以解决在大小信息不匹配的畸形归档文件上进行 tar 解压的漏洞。

**影响:**

- 更安全的 tar 归档文件处理
- 防止畸形归档文件的漏洞利用

**所需操作:**
如果您经常处理 tar 归档文件或从不受信任的来源安装包，请更新到 0.9.7 或更高版本。

#### Windows x86-32 模拟支持

**变更内容:**
为解释器架构检查添加了 Windows x86-32 模拟支持。

**影响:**

- Windows 系统上的兼容性更好
- 改进了架构检测

**示例:**

```bash
# 现在可以在 Windows x86-32 模拟上正常工作
uv python install 3.14
uv python list
```

### 版本 0.9.6 (2025年10月29日)

#### Python 3.14 现为默认版本

**变更内容:**
默认 Python 版本从 **3.13 更改为 3.14**。

**影响:**
当您运行 `uv python install` 而不指定版本时，UV 现在将安装 Python 3.14 而不是 3.13。

**示例:**

```bash
# 旧行为 (0.9.6 之前)
uv python install
# 会安装 Python 3.13

# 新行为 (0.9.6+)
uv python install
# 安装 Python 3.14

# 显式安装特定版本
uv python install 3.13
uv python install 3.12
```

**迁移说明:**

如果您的项目需要 Python 3.13 或更早版本:

```bash
# 将项目固定到特定 Python 版本
cd your-project
uv python pin 3.13

# 验证固定版本
cat .python-version
# 输出: 3.13
```

**测试用例:**

```bash
# 创建新项目 - 应默认使用 Python 3.14
mkdir test-project
cd test-project
uv init

# 检查正在使用的 Python 版本
uv run python --version
# 应显示: Python 3.14.x
```

#### 自由线程 Python 3.14+ 支持

**变更内容:**
Python 3.14+ 的自由线程变体不再是实验性的，不需要显式选择启用。

**之前的行为:**

```bash
# 需要使用 't' 后缀显式选择
uv python install 3.14t
```

**新行为:**

```bash
# 自由线程 Python 自动允许
uv python install 3.14
# UV 将在可用且适当的情况下使用自由线程变体

# 如果需要，您仍然可以显式选择
uv python install 3.14t
```

**什么是自由线程 Python?**

自由线程 Python (PEP 703) 移除了全局解释器锁 (GIL)，使得 Python 代码能够在多个 CPU 核心上真正并行执行。

**优势:**

- 真正的多核并行
- CPU 密集型任务性能更好
- 多线程应用程序的并发性改进

**何时使用:**

在以下情况下使用自由线程 Python:

- 运行 CPU 密集型多线程代码
- 并行处理对性能至关重要
- 使用支持自由线程的库

**示例:**

```python
# /// script
# requires-python = ">=3.14"
# dependencies = []
# ///

import threading
import time

def cpu_intensive_task(n):
    """Simulate CPU-intensive work"""
    result = 0
    for i in range(n):
        result += i ** 2
    return result

# With free-threaded Python 3.14+, these threads run in parallel
threads = []
for i in range(4):
    t = threading.Thread(target=cpu_intensive_task, args=(10_000_000,))
    threads.append(t)
    t.start()

for t in threads:
    t.join()

print("All threads completed in parallel")
```

运行方式:

```bash
uv run --python 3.14 script.py
```

#### Build --clear 标志

**变更内容:**
为 `uv build` 命令添加了 `--clear` 标志，用于在构建前删除旧的构建产物。

**用法:**

```bash
# 旧工作流 - 手动清理
rm -rf dist/
uv build

# 新工作流 - 自动清理
uv build --clear
```

**示例用例:**

```bash
# 构建用于分发的 Python 包
cd my-package

# 自动清理旧产物后构建
uv build --clear

# 产物现在位于 dist/ 目录中
ls dist/
# 输出: my-package-1.0.0.tar.gz  my-package-1.0.0-py3-none-any.whl
```

**优势:**

- 防止新旧构建产物混合
- 确保干净的构建
- 简化 CI/CD 工作流程

**GitHub Actions 示例:**

```yaml
- name: Build package
  run: uv build --clear

- name: Upload artifacts
  uses: actions/upload-artifact@v3
  with:
    name: dist
    path: dist/
```

#### 安全更新 - ZIP 解析

**变更内容:**
升级到 Astral 的 `async_zip` 分支，以解决 UV 与其他 Python 打包工具之间的 ZIP 解析差异。

**影响:**

- 更一致的包安装行为
- 减少 pip、poetry 等工具的解析差异
- 更好地防御畸形 ZIP 归档文件

**所需操作:**
更新到 0.9.6 或更高版本以获得更好的安全性和兼容性。

### 版本 0.9.5 (2025年10月21日)

#### 改进的错误消息

**变更内容:**
增强了外部管理的 Python 环境和 HTTP 403 Forbidden 响应的错误消息。

**示例:**

**之前:**

```text
error: Failed to install package
```

**之后:**

```text
error: Cannot install package in externally managed environment
hint: This Python environment is managed by your system package manager.
hint: Use --system flag to override, or create a virtual environment:
      python -m venv .venv && source .venv/bin/activate
```

**HTTP 403 Forbidden:**

```text
error: Failed to download package from https://pypi.org/simple/package-name/
error: 403 Forbidden
hint: This may be due to authentication required or network restrictions.
hint: Check your network connection and PyPI credentials.
```

### 版本 0.9.0 (2025年10月7日)

#### Docker 镜像更新

**变更内容:**
将基础镜像更新为 Alpine 3.22 和 Debian 13 "Trixie"。

**影响:**

- 更安全的基础镜像
- 最新的系统包
- 更好的兼容性

**Dockerfile 示例:**

```dockerfile
FROM ghcr.io/astral-sh/uv:latest

WORKDIR /app

# Copy project files
COPY pyproject.toml .
COPY src/ src/

# Install dependencies
RUN uv pip install -e .

CMD ["uv", "run", "python", "-m", "src.main"]
```

## 重大变更

### Python 3.14 默认版本 (版本 0.9.6)

**破坏性影响:**

如果您有依赖默认安装 Python 3.13 的脚本或 CI/CD 流程:

```bash
# 这现在安装的是 3.14 而不是 3.13
uv python install
```

**解决方案:**

显式固定您的 Python 版本:

```bash
# 在项目中 - 使用 .python-version
uv python pin 3.13

# 在脚本中 - 显式指定版本
uv python install 3.13
uv run --python 3.13 script.py

# 在 CI/CD 中 - 在工作流中添加版本
- name: Install Python
  run: uv python install 3.13
```

## 测试新功能

### 测试 Python 3.14 默认版本

```bash
# 删除现有的 Python 版本 (可选)
rm -rf ~/.local/share/uv/python/

# 安装默认版本
uv python install

# 验证是否为 3.14
uv python list
# 应显示 3.14.x 已安装

# 创建测试项目
mkdir test-py314
cd test-py314
uv init
uv run python --version
# 应输出: Python 3.14.x
```

### 测试自由线程 Python

```bash
# 安装自由线程 Python
uv python install 3.14

# 检查自由线程变体是否可用
uv python list --all-versions | grep 3.14

# 创建测试脚本
cat > test_threads.py << 'EOF'
import sys
import threading

def worker():
    print(f"Thread {threading.current_thread().name} running")

threads = [threading.Thread(target=worker, name=f"Worker-{i}") for i in range(4)]
for t in threads:
    t.start()
for t in threads:
    t.join()

print(f"Python version: {sys.version}")
print(f"Thread-safe: {sys.flags.no_gil if hasattr(sys.flags, 'no_gil') else 'N/A'}")
EOF

# 使用 Python 3.14 运行
uv run --python 3.14 test_threads.py
```

### 测试 Build --clear 标志

```bash
# 创建测试包
mkdir test-package
cd test-package

# 创建 pyproject.toml
cat > pyproject.toml << 'EOF'
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "test-package"
version = "0.1.0"
EOF

# 创建源代码
mkdir src
echo 'print("Hello from test package")' > src/__init__.py

# 使用 --clear 标志构建
uv build --clear

# 验证产物
ls dist/
# 应显示: test-package-0.1.0.tar.gz, test-package-0.1.0-py3-none-any.whl
```

## 兼容性矩阵

| UV 版本 | Python 3.10 | Python 3.11 | Python 3.12 | Python 3.13 | Python 3.14 | 自由线程 |
|---------|-------------|-------------|-------------|-------------|-------------|----------|
| 0.9.0-0.9.5 | 完全支持 | 完全支持 | 完全支持 | 完全支持 (默认) | 测试版 | 实验性 |
| 0.9.6+ | 完全支持 | 完全支持 | 完全支持 | 完全支持 | 完全支持 (默认) | 稳定版 |
| 0.9.7+ | 完全支持 | 完全支持 | 完全支持 | 完全支持 | 完全支持 (默认) | 稳定版 |

## 弃用警告

目前没有弃用的主要功能。UV 在添加新功能的同时保持向后兼容性。

## 未来变更

根据 UV 开发路线图:

- 增强的缓存机制
- 改进的依赖解析
- 更好的 IDE 集成
- 扩展的 MCP 服务器支持

通过以下渠道保持更新:

- UV GitHub 发布页面: <https://github.com/astral-sh/uv/releases>
- UV 文档: <https://docs.astral.sh/uv/>

## 特定版本的故障排除

### 问题: 找不到 Python 3.14

**症状:**

```text
error: Python 3.14 not found
```

**解决方案:**

```bash
# 将 UV 更新到最新版本
pip install --upgrade uv

# 或重新安装
curl -LsSf https://astral.sh/uv/install.sh | sh

# 然后安装 Python 3.14
uv python install 3.14
```

### 问题: 自由线程 Python 不工作

**症状:**
代码没有显示并行执行的改进。

**诊断:**

```bash
# 检查是否安装了自由线程变体
uv python list --all-versions | grep -i "free\|gil"

# 验证 Python 构建
uv run python -c "import sys; print(sys.flags)"
```

**解决方案:**
某些库可能还不支持自由线程。在生产环境中使用自由线程 Python 之前，请检查库的兼容性。

### 问题: Build --clear 不工作

**症状:**

```text
error: unrecognized option '--clear'
```

**解决方案:**
更新到 UV 0.9.6 或更高版本:

```bash
pip install --upgrade uv
uv --version  # 应为 0.9.6 或更高
```

## 其他资源

- **UV 更新日志**: <https://github.com/astral-sh/uv/blob/main/CHANGELOG.md>
- **Python 3.14 发布说明**: <https://docs.python.org/3.14/whatsnew/3.14.html>
- **PEP 703 (自由线程)**: <https://peps.python.org/pep-0703/>
- **UV Discord 社区**: <https://discord.gg/astral-sh>

## 总结

保持 UV 更新以获得:

1. **安全改进** (tar/ZIP 解析修复)
2. **Python 3.14 支持** 与自由线程
3. **更好的工具** (build --clear 标志)
4. **增强的错误消息** 用于故障排除
5. **每个版本的性能优化**

定期检查您的版本，并在有新版本可用时进行升级。
