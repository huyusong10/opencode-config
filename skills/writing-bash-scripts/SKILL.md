---
name: writing-bash-scripts
description: Create and refactor Bash scripts following conventions (strict mode, fct_ naming, quoting). Includes shellcheck linting. Use when creating shell scripts, refactoring existing scripts, debugging shell errors, or linting scripts.
---

# Bash

当用户要求创建/更新/重构Bash脚本（`.sh`）或检查shell脚本时，使用此技能。

## 默认设置

- Shebang：`#!/usr/bin/env bash`
- 严格模式：`set -Eeuo pipefail`
- 函数：`fct_<descriptive_snake_case>() { ... }`
- 变量：引用展开如 `"${var}"`，优先使用 `printf`，常量使用 `readonly`，函数内使用 `local`

## 工作流程

### 创建/重构脚本

1. 将 `scripts/pref_bash_script_template.sh` 复制到目标路径并重命名。
2. 更新 SCRIPT INFO / USAGE 头部块。
3. 在 `fct_execute_this` 中实现行为，保持 `fct_main` + `trap` 结构。
4. 遵循 `references/pref_bash.md` 中的详细约定。
5. 运行 shellcheck 检查（见下文）。

### 检查脚本

使用提供的包装器运行 shellcheck：

```bash
# Lint all scripts in scripts/ directory (default)
.opencode/skill/bash/scripts/run_shellck.sh

# Lint specific files or directories
.opencode/skill/bash/scripts/run_shellck.sh path/to/script.sh
.opencode/skill/bash/scripts/run_shellck.sh scripts/ other/dir/
```

检查脚本：

- 通过扩展名（`.sh`、`.bash`、`.zsh`）或 shebang 自动检测 shell 脚本
- shellcheck 失败时以非零状态退出
- 未提供参数时默认扫描 `scripts/`

详见 `references/pref_bash.md` 第14节的 shellcheck 集成详情。
