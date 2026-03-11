# Bash 脚本模板需求

## 目标

- 提供一个通用的 Bash 脚本模板，默认安全且易于定制。
- 支持常见的 CLI 标志（`--help`、`--verbose` 等）和清晰的自文档化。
- 添加可靠的错误处理（失败的命令、管道、信号）以及清理机制。
- 确保在 macOS（Darwin）和 Linux 之间的可移植性，无需修改代码。
- 确保 `shellcheck -x -o all` 在模板上返回 **零** 个问题。

## 非目标

- 实现任何特定的"业务逻辑"，除了一个清晰标记的存根函数。
- 添加 CI/CD、pre-commit 钩子或仓库范围的 lint 工具（可选的未来工作）。
- 重构其他技能或更改 `AGENTS.md` 中的技能触发系统。

## 需求

### 功能需求

- Shebang 使用 env Bash：`#!/usr/bin/env bash`。
- 严格模式使用 `set -euo pipefail`，并为每个标志提供简短的"原因"说明。
- 脚本元数据存在（版本、作者、描述），并通过 `--help/--version` 显示。
- 依赖检查存在（一个验证所需命令是否存在的函数）。
- 参数解析至少支持：
  - `-h` / `--help`
  - `-v` / `--verbose`
  - （推荐）`-V` / `--version`
  - （推荐）`--no-color` 和 `--log-file <path>`
- 日志函数存在，具有以下名称和行为：
  - `log_info`、`log_warn`、`log_error`、`log_debug`
  - 包含时间戳
  - 仅在适当时向终端（stderr）输出彩色内容
  - 遵守 `NO_COLOR`（设置时禁用颜色）
- 清理模式存在：
  - `cleanup()` 函数
  - `trap cleanup EXIT`
  - 清理包括临时文件/目录和可选的锁资源
- `die()` 存在用于致命错误，并支持显式退出码。
- 主函数模式存在：
  - `main()` 封装执行
  - 脚本仅在直接执行时以调用 `main "$@"` 结束
- 使用 `${BASH_SOURCE[0]}` 的可移植路径解析存在，用于计算脚本目录。
- 当被 source 时，脚本不得自动运行 `main`，也不得 `exit` 调用者 shell。

### 非功能需求

- 对函数作用域变量使用 `local`。
- 引用所有变量扩展，除非故意需要分割。
- 避免不必要的不可移植依赖；保持 macOS/Linux 兼容性。
- 为每个部分添加简短注释说明"原因"（不仅是"什么"）。
- 必须通过 `shellcheck -x -o all .opencode/skill/bash/scripts/pref_bash_script_template.sh` 且 **零** 个问题。
- 删除现有的 Raycast 头部（模板必须是通用的，而非应用特定的）。

## 假设与约束

- 模板是 Bash（而非 POSIX `sh`），并使用 `#!/usr/bin/env bash`。
- ShellCheck 可供执行此计划的开发人员使用；如果不可用，他们必须在最终验证之前安装它。
- Bash 脚本的仓库约定（函数前缀 `fct_`、引用、`printf`）已记录，在不与用户需求冲突的情况下必须遵守：
  - `.opencode/skill/bash/SKILL.md`
  - `.opencode/skill/bash/references/pref_bash.md`

### CLI 约定

- `-h`、`--help`：将 `usage()` 打印到 stdout 并以退出码 0 退出。
- `-V`、`--version`：打印版本行并以退出码 0 退出。
- `-v`、`--verbose`：启用调试日志（`log_debug` 输出）。
- `--no-color`：禁用彩色输出（也遵守预设的 `NO_COLOR`）。
- `--log-file PATH`：将纯文本（无颜色）日志追加到 PATH；如果不可写则报错。
- `--`：停止选项解析；所有剩余参数为位置参数。

### 环境约定

- `NO_COLOR`：设置时（任何值），禁用彩色终端输出。
- `TMPDIR`：如果设置，用作 `mktemp -d` 的基础目录；否则默认为 `/tmp`。

### 输出约定

- 日志输出到 stderr（人类可读，可选彩色）。
- Stdout 保留用于命令输出或机器可读结果（模板使用 stdout 输出 `--help/--version`）。

### 退出码

- `0`：成功。
- `1`：一般失败（`die` 未提供显式代码时的默认值）。
- `2`：CLI 用法/参数错误（未知选项、缺少选项参数）。
- `4`：缺少依赖（找不到所需命令）。
- `130`：被 SIGINT 中断。
- `143`：被 SIGTERM 终止。
- 在严格模式下意外命令失败：以失败命令的状态退出（通过 `ERR` trap）。

## 验证清单

- [ ] 模板包含所需的元数据和 `usage()` 块。
- [ ] `set -euo pipefail` 存在并带有解释注释。
- [ ] `log_info`、`log_warn`、`log_error`、`log_debug` 存在并包含时间戳。
- [ ] 设置 `NO_COLOR` 时颜色被禁用，且从不写入 `--log-file`。
- [ ] `cleanup()` 在正常退出、错误退出和 Ctrl+C 时运行。
- [ ] 未知选项返回退出码 2 并带有错误消息。
- [ ] 脚本在 source 时不会自动运行，也不会 `exit`。
- [ ] ShellCheck 使用 `-x -o all` 报告零个问题。

## 完整性审计

- 验证目标模板路径存在：`.opencode/skill/bash/scripts/pref_bash_script_template.sh`。
- 验证仓库 Bash 约定和工作流文档存在：`.opencode/skill/bash/SKILL.md`、`.opencode/skill/bash/references/pref_bash.md`。
- 从仓库任务提示中提取需求：`INSTRUCT/instruct_v15.md`。
- 定义了明确的 CLI、环境、日志和退出码约定。
- 包含 ShellCheck 命令和需要避免的常见陷阱（以达到零问题）。
- 包含手动验证场景：无参数、`--help`、执行中途失败、SIGINT、source 与执行。
