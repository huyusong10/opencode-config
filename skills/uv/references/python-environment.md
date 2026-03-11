# Python 环境管理参考

## 概述

本参考文档涵盖了使用 UV 进行 Python 版本管理，包括安装路径、版本固定和跨平台兼容性。还包括与 pyenv 和系统 Python 的集成。

## Python 安装路径

### UV Python 安装

UV 将管理的 Python 安装存储在特定于平台的位置：

**Linux/macOS:**

```text
~/.local/share/uv/python/cpython-<version>-<platform>/bin/python3
```

**Windows:**

```text
%LOCALAPPDATA%\uv\python\cpython-<version>-<platform>\python.exe
```

**示例路径：**

Linux:

```text
~/.local/share/uv/python/cpython-3.12.6-linux-x86_64-gnu/bin/python3
~/.local/share/uv/python/cpython-3.11.8-linux-x86_64-gnu/bin/python3
```

Windows:

```text
C:\Users\username\AppData\Local\uv\python\cpython-3.12.6-windows-x86_64\python.exe
C:\Users\username\AppData\Local\uv\python\cpython-3.11.8-windows-x86_64\python.exe
```

macOS:

```text
~/.local/share/uv/python/cpython-3.12.6-macos-aarch64/bin/python3
~/.local/share/uv/python/cpython-3.12.6-macos-x86_64/bin/python3
```

### Pyenv Python 安装

Pyenv 将 Python 安装存储在：

**Linux/macOS:**

```text
~/.pyenv/versions/<version>/bin/python
```

**Windows (pyenv-win):**

```text
%USERPROFILE%\.pyenv\pyenv-win\versions\<version>\python.exe
```

**示例路径：**

```text
~/.pyenv/versions/3.12.4/bin/python3.12
~/.pyenv/versions/3.11.8/bin/python3.11
~/.pyenv/versions/3.10.13/bin/python3.10
```

### 系统 Python

系统 Python 的位置因平台而异：

**Linux (Debian/Ubuntu):**

```text
/usr/bin/python3
/usr/bin/python3.8
/usr/bin/python3.10
```

**Linux (Fedora/RHEL):**

```text
/usr/bin/python3
/usr/bin/python3.9
```

**macOS:**

```text
/usr/bin/python3
/Library/Frameworks/Python.framework/Versions/3.x/bin/python3
```

**Windows:**

```text
C:\Python311\python.exe
C:\Program Files\Python311\python.exe
```

## UV Python 版本管理

### 安装命令

```bash
# 安装最新 Python 版本
uv python install

# 安装特定版本
uv python install 3.12

# 安装特定补丁版本
uv python install 3.12.6

# 安装多个版本
uv python install 3.11 3.12 3.13

# 从版本文件安装
uv python install --from-version-file .python-version
```

### 列出 Python 版本

```bash
# 列出所有可用的 Python 版本
uv python list

# 仅列出已安装的版本
uv python list --installed

# 列出详细信息
uv python list --all-versions
```

### 查找 Python 路径

```bash
# 查找特定 Python 版本的路径
uv python find 3.12

# 查找特定补丁版本的路径
uv python find 3.12.6

# 查找路径并显示详细信息
uv python find 3.12 --verbose
```

### 版本固定

```bash
# 为项目固定 Python 版本
uv python pin 3.12

# 固定特定补丁版本
uv python pin 3.12.6

# 创建 .python-version 文件：
# 3.12.6

# 使用固定版本
uv run python script.py  # 使用 .python-version 中的版本
```

### 环境变量

```bash
# 设置自定义 Python 安装目录
export UV_PYTHON_INSTALL_DIR=/custom/path/to/pythons

# 在 Windows 上
set UV_PYTHON_INSTALL_DIR=C:\custom\path\to\pythons
```

## 直接路径执行

### 使用直接路径

当 shell 包装器（如 pyenv）不可用时，使用直接路径：

**UV Python:**

```bash
# Linux/macOS
~/.local/share/uv/python/cpython-3.12.6-linux-x86_64-gnu/bin/python3 script.py

# Windows
%LOCALAPPDATA%\uv\python\cpython-3.12.6-windows-x86_64\python.exe script.py
```

**Pyenv Python:**

```bash
# Linux/macOS
~/.pyenv/versions/3.12.4/bin/python3.12 script.py

# Windows (pyenv-win)
%USERPROFILE%\.pyenv\pyenv-win\versions\3.12.4\python.exe script.py
```

**系统 Python:**

```bash
# Linux
/usr/bin/python3.10 script.py

# Windows
C:\Python311\python.exe script.py
```

### 配合工作目录使用

```bash
# 切换目录后执行
cd /path/to/working/directory && ~/.pyenv/versions/3.12.4/bin/python3.12 script.py

# 使用 UV run 配合目录
uv run --directory /path/to/working/directory --python 3.12 script.py

# 使用 Python 的 os.chdir（在脚本内）
python -c "import os; os.chdir('/path/to/dir'); exec(open('script.py').read())"
```

## 临时 PATH 修改

### 针对单个命令

```bash
# 为单个命令将 Python 添加到 PATH 前
PATH=~/.pyenv/versions/3.12.4/bin:$PATH python script.py

# Linux 上的 UV Python
PATH=~/.local/share/uv/python/cpython-3.12.6-linux-x86_64-gnu/bin:$PATH python script.py

# 配合工作目录
cd /path/to/dir && PATH=~/.pyenv/versions/3.12.4/bin:$PATH python script.py
```

**Windows:**

```cmd
set PATH=C:\Users\username\AppData\Local\uv\python\cpython-3.12.6-windows-x86_64;%PATH% && python script.py
```

## UV Run 命令

### 基本用法

```bash
# 使用特定 Python 版本运行
uv run --python 3.12 script.py

# 使用特定补丁版本运行
uv run --python 3.12.6 script.py

# 使用直接路径运行
uv run --python /path/to/python script.py

# 配合工作目录运行
uv run --directory /path/to/dir --python 3.12 script.py
```

### 高级模式

```bash
# 带参数运行
uv run --python 3.12 script.py arg1 arg2 --flag

# 带环境变量运行
ENV_VAR=value uv run --python 3.12 script.py

# 运行模块
uv run --python 3.12 -m module_name

# 带特定依赖运行
uv run --python 3.12 --with requests --with pandas script.py
```

## Shebang 行

### 直接路径 Shebang

**UV Python:**

```python
#!/home/user/.local/share/uv/python/cpython-3.12.6-linux-x86_64-gnu/bin/python3
import sys
print(sys.version)
```

**Pyenv Python:**

```python
#!/home/user/.pyenv/versions/3.12.4/bin/python3.12
import sys
print(sys.version)
```

**系统 Python:**

```python
#!/usr/bin/python3
import sys
print(sys.version)
```

### 基于 env 的 Shebang

```python
#!/usr/bin/env python3
# 使用 PATH 中找到的第一个 python3

#!/usr/bin/env python
# 使用 PATH 中找到的第一个 python
```

## 跨平台兼容性

### 路径分隔符

**Linux/macOS:**

```bash
# 使用正斜杠
~/.local/share/uv/python/cpython-3.12.6-linux-x86_64-gnu/bin/python3
```

**Windows:**

```cmd
# 使用反斜杠或正斜杠
%LOCALAPPDATA%\uv\python\cpython-3.12.6-windows-x86_64\python.exe
C:/Users/username/AppData/Local/uv/python/cpython-3.12.6-windows-x86_64/python.exe
```

### 平台检测

```python
import platform
import sys

# 获取平台信息
print(platform.system())      # Windows, Linux, Darwin
print(platform.machine())     # x86_64, aarch64, AMD64
print(sys.version_info)       # (3, 12, 6, 'final', 0)

# 构建 UV Python 路径
import os
from pathlib import Path

if platform.system() == "Windows":
    uv_python_dir = Path(os.environ["LOCALAPPDATA"]) / "uv" / "python"
else:
    uv_python_dir = Path.home() / ".local" / "share" / "uv" / "python"
```

## 查找 Python 安装

### UV Python 发现

```bash
# 查找特定版本
uv python find 3.12

# 输出：
# /home/user/.local/share/uv/python/cpython-3.12.6-linux-x86_64-gnu/bin/python3

# 列出所有已安装版本
uv python list --installed

# 输出：
# cpython-3.12.6-linux-x86_64-gnu    /home/user/.local/share/uv/python/...
# cpython-3.11.8-linux-x86_64-gnu    /home/user/.local/share/uv/python/...
```

### Pyenv Python 发现

```bash
# 获取全局版本
pyenv global

# 获取全局 Python 的路径
pyenv which python

# 列出所有版本
pyenv versions

# 查找特定版本路径
echo ~/.pyenv/versions/$(pyenv global | head -1)/bin/python
```

### 系统 Python 发现

```bash
# 在 PATH 中查找 Python
which python3       # Linux/macOS
where python        # Windows

# 查找所有 Python 安装
whereis python3     # Linux

# 检查 Python 版本
python3 --version
```

## 创建符号链接和包装器

### 符号链接 (Linux/macOS)

```bash
# 为特定 UV Python 创建符号链接
ln -s ~/.local/share/uv/python/cpython-3.12.6-linux-x86_64-gnu/bin/python3 \
      ~/bin/python3.12

# 为 pyenv Python 创建符号链接
ln -s ~/.pyenv/versions/3.12.4/bin/python3.12 \
      ~/bin/python3.12.4

# 在 .bashrc 或 .zshrc 中将 ~/bin 添加到 PATH
export PATH="$HOME/bin:$PATH"
```

### 包装器脚本

**Linux/macOS:**

```bash
# 创建包装器脚本
cat > ~/bin/python3.12 << 'EOF'
#!/bin/bash
exec ~/.local/share/uv/python/cpython-3.12.6-linux-x86_64-gnu/bin/python3 "$@"
EOF

chmod +x ~/bin/python3.12
```

**Windows (Batch):**

```batch
@echo off
C:\Users\username\AppData\Local\uv\python\cpython-3.12.6-windows-x86_64\python.exe %*
```

**Windows (PowerShell):**

```powershell
# 保存为 python3.12.ps1
& "C:\Users\username\AppData\Local\uv\python\cpython-3.12.6-windows-x86_64\python.exe" @args
```

## PYTHONPATH 配置

### 添加模块搜索路径

```bash
# 将目录添加到 Python 模块搜索路径
export PYTHONPATH=/path/to/modules:$PYTHONPATH

# Windows
set PYTHONPATH=C:\path\to\modules;%PYTHONPATH%

# 在命令中使用
PYTHONPATH=/path/to/modules python script.py
```

**注意：** PYTHONPATH 添加到模块搜索路径，但不会更改工作目录。

## 最佳实践

### 版本管理

1. **使用 UV 进行 Python 版本管理** - 比手动下载更快更可靠
2. **在项目中固定版本** - 创建 `.python-version` 文件以保持一致性
3. **使用 `uv python list --installed`** - 跟踪已安装的内容
4. **清理旧版本** - 定期删除未使用的 Python 安装

### 路径管理

1. **需要时使用直接路径** - 比 PATH 操作更可靠
2. **记录所需的 Python 版本** - 在 README.md 或 requirements 中
3. **使用 `uv run --python`** - 当脚本需要特定版本时
4. **创建包装器脚本** - 用于频繁使用的特定版本

### 跨平台

1. **使用 pathlib** - 在 Python 中进行跨平台路径处理
2. **记录平台差异** - 在配置或设置指南中
3. **在目标平台上测试** - 不要假设路径兼容性
4. **使用环境变量** - 用于特定于平台的路径

## 故障排除

### 找不到 Python 版本

**症状：**

- "Python 3.x not found"
- 版本不匹配错误

**解决方案：**

```bash
# 列出已安装版本
uv python list --installed

# 安装缺失版本
uv python install 3.12

# 验证安装
uv python find 3.12

# 检查 PATH
echo $PATH | grep python
```

### 版本冲突

**症状：**

- 执行了错误的 Python 版本
- 意外的模块未找到错误

**解决方案：**

```bash
# 为项目固定版本
uv python pin 3.12

# 在命令中使用显式版本
uv run --python 3.12 script.py

# 检查正在使用的 Python
which python
python --version

# 使用完整路径避免歧义
~/.local/share/uv/python/cpython-3.12.6-linux-x86_64-gnu/bin/python3 script.py
```

### PATH 问题

**症状：**

- 找不到命令
- 执行了错误的版本

**解决方案：**

```bash
# 检查当前 PATH
echo $PATH

# 将 UV Python 添加到 PATH（临时）
export PATH="$HOME/.local/share/uv/python/cpython-3.12.6-linux-x86_64-gnu/bin:$PATH"

# 永久添加到 shell 配置文件（.bashrc, .zshrc）
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### 权限错误

**症状：**

- 无法写入 Python 目录
- 安装失败

**解决方案：**

```bash
# 检查 Python 安装目录权限
ls -la ~/.local/share/uv/python/

# 修复权限
chmod -R u+w ~/.local/share/uv/python/

# 使用自定义安装目录
export UV_PYTHON_INSTALL_DIR=$HOME/python-versions
uv python install 3.12
```

## 推荐方法

### 针对不同用例

**一次性命令：**

```bash
# 使用 uv run
uv run --python 3.12 script.py
```

**带 shebang 的脚本：**

```python
#!/usr/bin/env python3
# 或使用直接路径指定特定版本
```

**需要特定版本的应用程序：**

```bash
# 在配置中使用直接路径
python_path = "/home/user/.local/share/uv/python/cpython-3.12.6-linux-x86_64-gnu/bin/python3"
```

**处理特定目录：**

```bash
# 使用 uv run 配合 --directory
uv run --directory /path/to/project --python 3.12 script.py
```

**全面的 Python 管理：**

```bash
# 使用 UV 进行安装和管理
uv python install 3.12
uv python pin 3.12
uv run python script.py
```

## 总结

UV 提供了全面的 Python 版本管理：

- **自动安装** Python 版本
- **版本固定** 使用 `.python-version` 文件
- **直接路径访问** 用于独立于 shell 的执行
- **跨平台兼容性** 具有一致的接口
- **快速性能** 相比手动下载
- **集成** 现有的 Python 工具（pyenv、系统 Python）

使用 `uv python install` 进行版本管理，使用 `uv run --python` 进行特定版本的脚本执行。
