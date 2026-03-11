# 测试 UV 技能

本指南提供了用于手动测试 UV 技能的具体测试用例，以确保其与 Claude Code 正确配合工作。

## 概述

测试重点在于验证 Claude Code 是否正确调用 UV 技能，并为 Python 包管理、工具安装、MCP 服务器集成和虚拟环境管理提供准确的指导。

## 前提条件

- [ ] UV 技能已安装在 `~/.claude/skills/uv/` 或 `$USERPROFILE/.claude/skills/uv/`
- [ ] UV 已安装并可在 PATH 中访问（`uv --version` 可运行）
- [ ] 已安装 Python 3.8+
- [ ] Claude Code 已配置并正在运行

## 测试安装

### Claude Code CLI

```bash
# Windows (Git Bash)
cd "$USERPROFILE/.claude/skills"
cp -r /path/to/uv-skill/ ./uv/

# Unix/Mac
cd ~/.claude/skills
cp -r /path/to/uv-skill/ ./uv/
```

### 验证安装

```bash
# Check skill directory
ls -la ~/.claude/skills/uv/

# Verify SKILL.md exists
cat ~/.claude/skills/uv/SKILL.md | head -20
```

## 测试场景

### 测试用例 1：基本 UV 安装指导

**用户请求：**

```text
"How do I install UV on Windows?"
```

**替代变体：**

- "Set up UV for Python development"
- "Install UV package manager"
- "Get started with UV"

**预期行为：**

1. Claude 应该识别出这与 UV 技能匹配
2. Claude 应该提供 Windows 的安装说明
3. 应该提到将 UV 添加到 PATH
4. 应该参考安装与设置参考文档

**预期输出：**

- 安装命令（例如，PowerShell 安装程序或 Scoop）
- PATH 配置说明
- 验证命令（`uv --version`）

**验证：**

- [ ] 技能自动激活
- [ ] 提供特定平台的安装说明
- [ ] 包含 PATH 设置说明
- [ ] 包含验证步骤

### 测试用例 2：工具安装与 UVX 决策

**用户请求：**

```text
"Should I use uv tool install or uvx for Black formatter?"
```

**替代变体：**

- "How to install Black with UV?"
- "Difference between uv tool install and uvx"
- "Best way to install development tools with UV"

**预期行为：**

1. Claude 应该识别出这涉及工具管理决策
2. 应该解释 `uv tool install` 适用于日常工具
3. 应该提供示例：`uv tool install black`
4. 应该解释 UVX 用于临时/一次性执行

**预期输出：**

```text
For Black formatter (daily development tool):
- Use: uv tool install black
- Reason: Used frequently, benefits from persistent installation
```

**验证：**

- [ ] 正确推荐使用 `uv tool install` 安装 Black
- [ ] 解释理由（频繁使用）
- [ ] 提供示例命令
- [ ] 如需要则参考决策树

### 测试用例 3：MCP 服务器配置

**用户请求：**

```text
"How do I configure mcp-server-sqlite with uvx in VS Code?"
```

**替代变体：**

- "Set up MCP server with UV in VS Code"
- "Configure .vscode/mcp.json for UV"
- "Run MCP server using UVX"

**预期行为：**

1. Claude 应该识别出这是 MCP 集成
2. 应该提供 VS Code 配置示例
3. 应该使用 `uvx` 命令（不是 `uv tool install`）
4. 应该展示 .vscode/mcp.json 的正确 JSON 结构

**预期输出：**

```json
{
  "servers": {
    "sqlite": {
      "type": "stdio",
      "command": "uvx",
      "args": ["mcp-server-sqlite", "--db-path", "${workspaceFolder}/db.sqlite"]
    }
  }
}
```

**验证：**

- [ ] 使用 `uvx`（不是 `uv tool install`）
- [ ] 正确的 JSON 结构
- [ ] 包含必需字段（type、command、args）
- [ ] 如适用则使用 VS Code 变量

### 测试用例 4：本地 MCP 服务器开发

**用户请求：**

```text
"I'm developing a custom MCP server locally. How do I configure it with UV?"
```

**替代变体：**

- "Run local Python MCP server with UVX"
- "Use --from flag with UVX for local development"
- "Configure local MCP server in VS Code with UV"

**预期行为：**

1. Claude 应该识别出本地开发场景
2. 应该推荐 `--from` 标志方法
3. 应该提供示例配置
4. 应该强调绝对路径

**预期输出：**

```json
{
  "servers": {
    "my-server": {
      "type": "stdio",
      "command": "uvx",
      "args": [
        "--from", "/absolute/path/to/project",
        "server.py",
        "--config", "config.json"
      ]
    }
  }
}
```

**验证：**

- [ ] 正确使用 `--from` 标志
- [ ] 解释绝对路径要求
- [ ] 正确的参数结构
- [ ] 如需要则参考 MCP 集成参考文档

### 测试用例 5：虚拟环境设置

**用户请求：**

```text
"How do I create and activate a virtual environment with UV?"
```

**替代变体：**

- "Set up Python venv with UV"
- "Create virtual environment for Python project"
- "Activate virtual environment on Windows"

**预期行为：**

1. Claude 应该提供 venv 创建命令
2. 应该提供特定平台的激活说明
3. 应该解释在激活环境中使用 `uv pip install`
4. 应该提到相比普通 pip 的性能提升

**预期输出：**

```bash
# Create virtual environment
python -m venv .venv

# Activate (Windows Git Bash)
. .venv/Scripts/activate

# Install packages with UV
uv pip install -r requirements.txt
```

**验证：**

- [ ] 显示 venv 创建
- [ ] 特定平台激活
- [ ] 显示在激活环境中使用 UV
- [ ] 提及性能优势

### 测试用例 6：Python 版本管理

**用户请求：**

```text
"How do I install and use Python 3.12 with UV?"
```

**替代变体：**

- "Manage Python versions with UV"
- "Switch Python version in UV project"
- "Install specific Python version"

**预期行为：**

1. Claude 应该解释 Python 版本安装
2. 应该展示 `uv python install` 命令
3. 应该展示 `uv python pin` 用于项目特定版本
4. 应该提到列出可用版本

**预期输出：**

```bash
# Install Python 3.12
uv python install 3.12

# Pin to project
uv python pin 3.12

# List available versions
uv python list
```

**验证：**

- [ ] 显示安装命令
- [ ] 显示固定命令
- [ ] 提及列出版本
- [ ] 解释项目特定配置

### 测试用例 7：内联脚本依赖（PEP 723）

**用户请求：**

```text
"How can I create a single Python script with dependencies using UV?"
```

**替代变体：**

- "Use PEP 723 inline dependencies with UV"
- "Self-contained Python script with dependencies"
- "UV inline script metadata"

**预期行为：**

1. Claude 应该解释 PEP 723 内联依赖
2. 应该提供基于注释的依赖示例
3. 应该展示 `uv run script.py` 命令
4. 应该参考内联脚本元数据参考文档

**预期输出：**

```python
# /// script
# dependencies = [
#   "requests",
#   "pandas",
# ]
# ///

import requests
import pandas as pd
```

Run with: `uv run script.py`

**验证：**

- [ ] 显示正确的注释语法
- [ ] 解释自动依赖安装
- [ ] 提供执行命令
- [ ] 提及参考文档

### 测试用例 8：从 pip/pipx 迁移

**用户请求：**

```text
"I'm currently using pip and pipx. How do I migrate to UV?"
```

**替代变体：**

- "Switch from pipx to UV"
- "Convert pip commands to UV"
- "Migrate Python tools to UV"

**预期行为：**

1. Claude 应该提供迁移对比
2. 应该展示前后示例
3. 应该解释优势（速度、隔离）
4. 应该涵盖包和工具安装

**预期输出：**

```bash
# Old way (pip)
pip install requests

# New way (UV)
uv pip install requests

# Old way (pipx)
pipx install black

# New way (UV)
uv tool install black
```

**验证：**

- [ ] 显示清晰的前后对比
- [ ] 涵盖 pip 和 pipx 迁移
- [ ] 解释优势
- [ ] 提及工具隔离

### 测试用例 9：错误处理 - UV 未找到

**设置：**

模拟 UV 未安装或不在 PATH 中的场景。

**用户请求：**

```text
"I'm getting 'spawn uvx ENOENT' error when running MCP server"
```

**替代变体：**

- "UV command not found"
- "uvx not in PATH"
- "Can't find UV executable"

**预期行为：**

1. Claude 应该识别出这是 PATH/安装问题
2. 应该建议验证 UV 安装
3. 应该提供 PATH 验证命令
4. 应该建议如需要则重新安装

**预期输出：**

- Check UV installation: `uv --version`
- Check PATH configuration
- Reinstallation instructions if needed
- Link to troubleshooting in references

**验证：**

- [ ] 识别 PATH/安装问题
- [ ] 提供验证命令
- [ ] 建议解决方案
- [ ] 参考故障排除文档

### 测试用例 10：高级 - GitHub Actions 集成

**用户请求：**

```text
"How do I use UV in GitHub Actions for CI/CD?"
```

**替代变体：**

- "Set up UV in GitHub Actions workflow"
- "CI/CD configuration for UV"
- "Install dependencies with UV in Actions"

**预期行为：**

1. Claude 应该提供 GitHub Actions 工作流示例
2. 应该使用官方 `astral-sh/setup-uv` 操作
3. 应该展示依赖安装和测试执行
4. 应该解释 CI 性能优势

**预期输出：**

```yaml
- name: Setup UV
  uses: astral-sh/setup-uv@v1

- name: Install dependencies
  run: uv pip install -r requirements.txt

- name: Run tests
  run: uv run pytest
```

**验证：**

- [ ] 使用官方操作
- [ ] 显示正确的工作流结构
- [ ] 包含依赖安装
- [ ] 显示测试执行示例

### 测试用例 11：Python 3.14 默认版本（UV 0.9.6+）

**用户请求：**

```text
"What Python version will UV install by default?"
```

**替代变体：**

- "Install Python with UV without specifying version"
- "What's the default Python version in UV?"
- "Create new UV project - which Python version?"

**预期行为：**

1. Claude 应该提到 Python 3.14 现在是默认版本（UV 0.9.6 起）
2. 应该解释如何检查 UV 版本
3. 应该展示如何显式固定到不同版本
4. 应该参考最新变更文档

**预期输出：**

```bash
# Check UV version first
uv --version

# UV 0.9.6+ installs Python 3.14 by default
uv python install
# Installs Python 3.14

# To use a specific version
uv python install 3.13
uv python pin 3.13
```

**验证：**

- [ ] 提到 Python 3.14 为默认版本（UV 0.9.6+）
- [ ] 显示版本检查命令
- [ ] 解释如何固定特定版本
- [ ] 参考版本兼容性

### 测试用例 12：自由线程 Python 支持（UV 0.9.6+）

**用户请求：**

```text
"How do I use free-threaded Python with UV?"
```

**替代变体：**

- "Does UV support Python without GIL?"
- "Install free-threaded Python 3.14"
- "How to enable parallel threading in Python with UV?"

**预期行为：**

1. Claude 应该解释自由线程 Python 概念（PEP 703）
2. 应该提到它在 Python 3.14+ 中可用且无需显式选择
3. 应该提供展示并行执行优势的示例
4. 应该参考最新变更文档

**预期输出：**

```bash
# Install Python 3.14 (includes free-threading support)
uv python install 3.14

# Verify installation
uv python list

# Use in project
uv python pin 3.14
```

Example showing benefits:

```python
# Multi-threaded code runs in true parallel with Python 3.14+
import threading

def cpu_task():
    result = sum(i**2 for i in range(10_000_000))
    return result

threads = [threading.Thread(target=cpu_task) for _ in range(4)]
for t in threads:
    t.start()
for t in threads:
    t.join()
```

**验证：**

- [ ] 解释自由线程 Python 概念
- [ ] 提到无需显式选择（UV 0.9.6+）
- [ ] 显示安装命令
- [ ] 提供实际示例
- [ ] 解释性能优势

### 测试用例 13：构建 --clear 标志（UV 0.9.6+）

**用户请求：**

```text
"How do I clean old build artifacts before building with UV?"
```

**替代变体：**

- "Remove dist folder before building"
- "Clean build with UV"
- "UV build with automatic cleanup"

**预期行为：**

1. Claude 应该提到 UV 0.9.6 中添加的 `--clear` 标志
2. 应该展示命令用法
3. 应该解释它会自动删除旧的构建产物
4. 应该提到版本要求

**预期输出：**

```bash
# Check UV version (needs 0.9.6+)
uv --version

# Build with automatic cleanup
uv build --clear

# Old workflow (no longer needed)
# rm -rf dist/
# uv build
```

**验证：**

- [ ] 提到 `--clear` 标志
- [ ] 显示正确的命令语法
- [ ] 解释自动清理行为
- [ ] 提到版本要求（0.9.6+）

### 测试用例 14：UV 版本检查和升级

**用户请求：**

```text
"How do I check if my UV is up to date?"
```

**替代变体：**

- "Check UV version"
- "Upgrade UV to latest version"
- "What version of UV do I have?"

**预期行为：**

1. Claude 应该展示版本检查命令
2. 应该提供升级说明
3. 应该提到最新版本（截至 2025 年 10 月为 0.9.7）
4. 应该参考最新变更文档

**预期输出：**

```bash
# Check current version
uv --version

# Upgrade using pip
pip install --upgrade uv

# Or reinstall using official installer
# Windows
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Unix/Mac
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**验证：**

- [ ] 显示版本检查命令
- [ ] 提供升级说明
- [ ] 提到最新稳定版本
- [ ] 显示特定平台的安装程序

### 测试用例 15：特定版本功能指导

**用户请求：**

```text
"I'm using UV 0.9.5. Can I use the --clear flag?"
```

**替代变体：**

- "What features are available in my UV version?"
- "Do I need to upgrade UV for Python 3.14?"
- "Version compatibility check"

**预期行为：**

1. Claude 应该识别出 `--clear` 需要 UV 0.9.6+
2. 应该建议如需要则升级
3. 应该解释用户版本中有哪些功能可用
4. 应该参考版本兼容性矩阵

**预期输出：**

```text
The --clear flag was added in UV 0.9.6. Your version (0.9.5) doesn't support it yet.

To use this feature, upgrade UV:

pip install --upgrade uv

After upgrading, you can use:
uv build --clear
```

**验证：**

- [ ] 正确识别版本要求
- [ ] 在需要时建议升级
- [ ] 提供清晰的升级路径
- [ ] 参考兼容性信息

## 故障排除

### 技能未激活

**症状：**

- Claude 在预期时未使用 UV 技能
- Claude 说"I don't have access to that information"

**检查：**

1. **验证安装：**

   ```bash
   ls ~/.claude/skills/uv/SKILL.md
   ```

2. **检查 SKILL.md 格式：**

   ```bash
   head -10 ~/.claude/skills/uv/SKILL.md
   ```

   Should show:

   ```yaml
   ---
   name: uv
   description: This skill should be used when...
   ---
   ```

3. **尝试明确指定：**
   Instead of: "How do I install packages?"
   Try: "Use the UV skill to help me install Python packages"

4. **重启 Claude Code：**
   - 技能在启动时加载
   - 安装后可能需要重启

### 提供了错误的指导

**症状：**

- Claude 为 MCP 服务器推荐 `uv tool install`（错误）
- Claude 建议错误的配置模式

**检查：**

1. **验证技能版本：**
   检查 VERSION 文件并确保是最新版本

2. **检查参考文档：**
   确保 references/ 目录已包含且可访问

3. **报告问题：**
   如果指导持续不正确，请在 GitHub issues 中报告

## 测试检查清单

### 测试前设置

- [ ] 技能安装在正确目录
- [ ] UV 已安装并在 PATH 中
- [ ] SKILL.md 有有效的 frontmatter
- [ ] 参考文档存在

### 核心功能

- [ ] 测试用例 1：基本 UV 安装 ✓
- [ ] 测试用例 2：工具安装 vs UVX ✓
- [ ] 测试用例 3：MCP 服务器配置 ✓
- [ ] 测试用例 4：本地 MCP 开发 ✓
- [ ] 测试用例 5：虚拟环境设置 ✓
- [ ] 测试用例 6：Python 版本管理 ✓
- [ ] 测试用例 7：内联脚本依赖 ✓
- [ ] 测试用例 8：迁移指导 ✓
- [ ] 测试用例 9：错误处理 ✓
- [ ] 测试用例 10：GitHub Actions 集成 ✓

### 最新功能（UV 0.9.6+）

- [ ] 测试用例 11：Python 3.14 默认版本 ✓
- [ ] 测试用例 12：自由线程 Python 支持 ✓
- [ ] 测试用例 13：构建 --clear 标志 ✓
- [ ] 测试用例 14：UV 版本检查和升级 ✓
- [ ] 测试用例 15：特定版本功能指导 ✓

### 文档质量

- [ ] SKILL.md 描述正确触发技能
- [ ] 说明清晰准确
- [ ] 示例按文档工作
- [ ] 参考文档可访问且相关

## 测试结果模板

```markdown
# UV Skill Test Results

**Date:** YYYY-MM-DD
**Platform:** Windows/macOS/Linux
**Claude Code Version:** X.X.X
**UV Version:** X.X.X
**Tester:** [Name]

## Environment

- OS: [OS details]
- Shell: [bash/zsh/Git Bash/PowerShell]
- Python Version: [version]
- UV Version: [version]

## Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1. Basic UV installation | ✓ PASS | |
| 2. Tool install vs UVX | ✓ PASS | |
| 3. MCP server config | ✓ PASS | |
| 4. Local MCP development | ✓ PASS | |
| 5. Virtual environment | ✓ PASS | |
| 6. Python version mgmt | ✓ PASS | |
| 7. Inline script deps | ✓ PASS | |
| 8. Migration guidance | ✓ PASS | |
| 9. Error handling | ✓ PASS | |
| 10. GitHub Actions | ✓ PASS | |
| 11. Python 3.14 default | ✓ PASS | |
| 12. Free-threaded Python | ✓ PASS | |
| 13. Build --clear flag | ✓ PASS | |
| 14. Version check/upgrade | ✓ PASS | |
| 15. Version-specific features | ✓ PASS | |

## Issues Found

[List any issues with detailed descriptions]

## Recommendations

[Suggestions for improvements to SKILL.md or reference documents]

## Overall Assessment

☐ Ready for release
☐ Needs minor fixes
☐ Needs major revision
```

## 最佳实践

### 1. 增量测试

- 在每次更改 SKILL.md 或参考文档后测试
- 不要在测试前构建所有内容
- 及早发现问题

### 2. 使用真实场景

- 使用 UV 文档中的实际用例进行测试
- 从真实 UV 用户那里获取反馈
- 根据官方 UV 模式进行验证

### 3. 跨平台测试

- 在 Windows（Git Bash 和 PowerShell）上测试
- 在 macOS 上测试（如果可用）
- 在 Linux 上测试（如果可用）
- 记录特定平台的问题

### 4. 版本测试

- 在发布前测试每个版本
- 保留每个版本的测试结果
- 跟踪回归问题

### 5. 参考文档测试

- 验证参考文档正确加载
- 检查 grep 模式是否工作
- 确保参考文档中的示例准确

## 资源

- [UV Official Documentation](https://docs.astral.sh/uv/)
- [Claude Code Skills Documentation](https://docs.claude.com/en/docs/claude-code/skills)
- [Skill Authoring Best Practices](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices)
