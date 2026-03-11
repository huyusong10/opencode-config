# UV 安装与设置参考

## 概述

本参考文档涵盖了跨平台的 UV 安装和虚拟环境设置，特别关注 Windows 兼容性和最佳实践。

## 安装

### Windows

**PowerShell（推荐）：**

```powershell
powershell -c "irm https://install.python-uv.org | iex"
```

**替代方法：**

```powershell
# Using installer script
Invoke-WebRequest -Uri https://install.astral.sh/uv -OutFile install.ps1
.\install.ps1

# Using pipx (if available)
pipx install uv
```

### Linux

```bash
# Standalone installer (Recommended)
curl -LsSf https://install.python-uv.org | sh

# Using pipx
pipx install uv

# Manual download
curl -sSL https://install.astral.sh/uv | sh
```

### macOS

```bash
# Homebrew (Recommended)
brew install astral-sh/tap/uv

# Standalone installer
curl -LsSf https://install.python-uv.org | sh
```

### 验证

安装后，验证 UV 是否正常工作：

```bash
uv --version
uvx --version

# Should output version number (e.g., uv 0.7.8)
```

## 虚拟环境设置

### Windows Git Bash（Windows 推荐）

**状态**：已测试 - UV 与 venv 虚拟环境完美配合

```bash
# 1. Create virtual environment
python -m venv .venv

# 2. Activate environment
. .venv/Scripts/activate

# 3. Use UV for package management
uv pip install -r requirements.txt

# 4. Verify environment is active
echo $VIRTUAL_ENV
# Output: /d/path/to/project/.venv

# 5. Install packages
uv pip install requests numpy pandas
```

**Git Bash 激活说明：**

`.` 和 `source` 工作方式相同：

```bash
# These are equivalent:
. .venv/Scripts/activate         # Recommended (shorter, POSIX standard)
source .venv/Scripts/activate    # Also works
```

### Windows CMD

```cmd
# 1. Create virtual environment
python -m venv .venv

# 2. Activate environment
.venv\Scripts\activate.bat

# 3. Use UV for package management
uv pip install -r requirements.txt
```

### Linux/macOS

```bash
# 1. Create virtual environment
python -m venv .venv

# 2. Activate environment
source .venv/bin/activate

# 3. Use UV for package management
uv pip install -r requirements.txt
```

## 项目初始化

### 方法一：UV 项目创建

```bash
# Create new project with UV
uv init my-project
cd my-project

# Project structure created:
# my-project/
# ├── .python-version
# ├── pyproject.toml
# ├── README.md
# └── src/
#     └── my_project/
#         └── __init__.py

# Add dependencies
uv add requests numpy

# Run project
uv run python src/my_project/main.py
```

### 方法二：使用虚拟环境手动设置

```bash
# Create project directory
mkdir my-project
cd my-project

# Create virtual environment
python -m venv .venv

# Activate (Windows Git Bash)
. .venv/Scripts/activate

# Activate (Linux/Mac)
source .venv/bin/activate

# Create requirements.txt
cat > requirements.txt << EOF
requests
numpy
pandas
EOF

# Install dependencies
uv pip install -r requirements.txt
```

### 方法三：现有项目迁移

```bash
# Navigate to existing project
cd existing-project

# Create virtual environment
python -m venv .venv

# Activate environment
. .venv/Scripts/activate  # Windows Git Bash
source .venv/bin/activate  # Linux/Mac

# Install from existing requirements
uv pip install -r requirements.txt

# Or install from poetry/pipenv
uv pip install poetry
poetry export -f requirements.txt -o requirements.txt
uv pip install -r requirements.txt
```

## 常用 UV 命令

### 包管理

```bash
# Install single package
uv pip install requests

# Install from requirements file
uv pip install -r requirements.txt

# Install with version constraint
uv pip install "requests>=2.28.0"

# Install multiple packages
uv pip install requests numpy pandas

# Uninstall package
uv pip uninstall requests

# List installed packages
uv pip list

# Show package information
uv pip show requests

# Freeze dependencies
uv pip freeze > requirements.txt
```

### 工具管理

```bash
# Install persistent CLI tool
uv tool install black

# List installed tools
uv tool list

# Upgrade tool
uv tool upgrade black

# Upgrade all tools
uv tool upgrade --all

# Uninstall tool
uv tool uninstall black

# Run tool temporarily with uvx
uvx black my_file.py
```

### Python 版本管理

```bash
# List available Python versions
uv python list

# List installed Python versions
uv python list --installed

# Install Python version
uv python install 3.12

# Install specific minor version
uv python install 3.12.1

# Pin Python version for project
uv python pin 3.12

# Show pinned version
cat .python-version
```

## 测试安装

### 完整验证脚本

**适用于 Windows Git Bash：**

```bash
#!/bin/bash

echo "=== UV Installation Test ==="

# Check UV version
echo "1. UV Version:"
uv --version

# Create test environment
echo "2. Creating test virtual environment..."
python -m venv test-venv

# Activate environment
echo "3. Activating environment..."
. test-venv/Scripts/activate

# Verify activation
echo "4. Virtual environment path:"
echo $VIRTUAL_ENV

# Install test package
echo "5. Installing test package with UV..."
uv pip install requests

# Verify installation
echo "6. Testing package import..."
python -c "import requests; print(f'Requests version: {requests.__version__}')"

# List packages
echo "7. Installed packages:"
uv pip list

# Cleanup
echo "8. Cleanup..."
deactivate
rm -rf test-venv

echo "=== Test Complete ==="
```

**适用于 Linux/macOS：**

```bash
#!/bin/bash

echo "=== UV Installation Test ==="

# Check UV version
echo "1. UV Version:"
uv --version

# Create test environment
echo "2. Creating test virtual environment..."
python -m venv test-venv

# Activate environment
echo "3. Activating environment..."
source test-venv/bin/activate

# Verify activation
echo "4. Virtual environment path:"
echo $VIRTUAL_ENV

# Install test package
echo "5. Installing test package with UV..."
uv pip install requests

# Verify installation
echo "6. Testing package import..."
python -c "import requests; print(f'Requests version: {requests.__version__}')"

# List packages
echo "7. Installed packages:"
uv pip list

# Cleanup
echo "8. Cleanup..."
deactivate
rm -rf test-venv

echo "=== Test Complete ==="
```

## 平台特定注意事项

### Windows 缓存和环境

**路径分隔符：**

- 根据上下文在路径中使用 `/` 或 `\\`
- Git Bash 接受 Unix 风格（`/`）和 Windows 风格（`\\`）路径
- CMD 需要 Windows 风格路径（`\\`）

**虚拟环境激活：**

- Git Bash: `. .venv/Scripts/activate`
- CMD: `.venv\Scripts\activate.bat`
- PowerShell: `.venv\Scripts\Activate.ps1`

**UV 缓存位置：**

```text
%LOCALAPPDATA%\uv\cache\
```

### Linux/macOS 缓存和环境

**虚拟环境激活：**

```bash
source .venv/bin/activate
```

**UV 缓存位置：**

```text
~/.cache/uv/
```

**权限：**

```bash
# If permission errors occur
chmod +x ~/.local/bin/uv
chmod +x ~/.local/bin/uvx
```

## 故障排除

### 安装后找不到 UV

**Windows：**

```powershell
# Check if UV is in PATH
$env:PATH -split ';' | Select-String "uv"

# Add to PATH manually if needed
$env:PATH += ";$env:LOCALAPPDATA\Programs\uv"
```

**Linux/macOS：**

```bash
# Check if UV is in PATH
echo $PATH | tr ':' '\n' | grep uv

# Add to PATH in ~/.bashrc or ~/.zshrc
export PATH="$HOME/.local/bin:$PATH"

# Reload shell configuration
source ~/.bashrc  # or source ~/.zshrc
```

### 虚拟环境未激活

**症状：**

- `$VIRTUAL_ENV` 为空
- 包安装到全局 Python

**解决方案：**

**对于 Git Bash：**

```bash
# Ensure using correct activation command
. .venv/Scripts/activate

# Check if activate script exists
ls .venv/Scripts/activate

# Recreate if missing
rm -rf .venv
python -m venv .venv
```

**对于 CMD：**

```cmd
# Use .bat extension
.venv\Scripts\activate.bat

# Check script exists
dir .venv\Scripts\activate.bat
```

### UV Pip 安装失败

**症状：**

- "No virtual environment found"
- 包安装到错误位置

**解决方案：**

```bash
# Ensure virtual environment is activated
echo $VIRTUAL_ENV  # Should show path

# If not activated, activate it
. .venv/Scripts/activate  # Windows Git Bash
source .venv/bin/activate  # Linux/Mac

# Verify activation
which python  # Should point to .venv

# Then install
uv pip install package-name
```

### 权限错误

**Windows：**

```powershell
# Run PowerShell as Administrator
# Then reinstall UV
powershell -c "irm https://install.python-uv.org | iex"
```

**Linux/macOS：**

```bash
# Check UV cache permissions
ls -la ~/.cache/uv/

# Fix permissions if needed
chmod -R u+w ~/.cache/uv/

# Or install with different permissions
curl -LsSf https://install.python-uv.org | sh
```

### 包安装缓慢

**潜在原因：**

- 网络代理问题
- 杀毒软件扫描
- 大型包依赖

**解决方案：**

```bash
# Clear UV cache
uv cache clean

# Use specific index
uv pip install --index-url https://pypi.org/simple package-name

# Check cache size
du -sh ~/.cache/uv/  # Linux/Mac
dir /s %LOCALAPPDATA%\uv\cache  # Windows
```

## 性能优势

### 测试结果（UV 0.7.8 + Python 3.13.0）

**包安装速度：**

- 比标准 pip 快 10-100 倍
- 并行下载和安装
- 智能缓存与去重

**示例比较：**

```bash
# Standard pip
time pip install pandas numpy scipy
# ~45 seconds

# UV
time uv pip install pandas numpy scipy
# ~2 seconds (after first download)
```

**优势：**

- UV 自动检测虚拟环境
- 完美的环境隔离
- 与 pip 相同的命令（直接替换）
- 卓越的依赖冲突解决

## 最佳实践

### 环境管理

1. **始终使用虚拟环境**进行项目开发
2. **安装包前先激活**环境
3. **使用 `python -m venv`** 以保证兼容性
4. **在 README.md 中记录激活方式**

### 包管理最佳实践

1. **在虚拟环境中始终使用 UV 安装**
2. **定期冻结依赖**（`uv pip freeze`）
3. **保持 requirements.txt 更新**
4. **在全新环境中测试安装**

### 工具管理最佳实践

1. **使用 `uv tool install` 安装开发工具**
2. **使用 uvx 进行临时执行**
3. **定期升级工具**（`uv tool upgrade --all`）
4. **保持工具隔离**（不要使用全局 pip）

## 快速参考卡

```bash
# Installation
curl -LsSf https://install.python-uv.org | sh  # Linux/Mac
powershell -c "irm https://install.python-uv.org | iex"  # Windows

# Virtual Environment
python -m venv .venv
. .venv/Scripts/activate  # Windows Git Bash
source .venv/bin/activate  # Linux/Mac

# Package Management
uv pip install package-name
uv pip install -r requirements.txt
uv pip list
uv pip freeze > requirements.txt

# Tool Management
uv tool install black
uvx black file.py

# Python Versions
uv python list
uv python install 3.12
uv python pin 3.12
```

## 总结

UV 在所有平台上提供快速、可靠的 Python 包管理。推荐的工作流程是：

1. 全局安装一次 UV
2. 使用 `python -m venv` 创建虚拟环境
3. 工作前激活环境
4. 所有包操作使用 UV
5. CLI 工具使用 UV tool/uvx

这种组合提供最大的兼容性、性能和可靠性。
