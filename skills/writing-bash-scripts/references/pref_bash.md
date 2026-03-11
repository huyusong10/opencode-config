# Bash 偏好设置

本部分概述了我对bash脚本编写约定的个人偏好。截至：2025-05-20

**这些偏好应遵循于所有新的bash脚本以及在重构本项目中的现有脚本时，可能会覆盖其他一般来源的指导。**

## 1. 函数命名约定

- **约定**：函数名应以 `fct_` 为前缀，后跟描述性的小写蛇形命名法名称（例如，`fct_calculate_total`）。
- **声明**：使用 `name() { ... }` 语法。避免使用 `function` 关键字以获得更广泛的POSIX兼容性，尽管它在Bash中是可接受的。
- **一致性**：强调项目中命名的一致性。

```bash
# USE:
fct_clean_up_temporary_files() {
    # Function body
}

# NOT:
# function CleanUpTemporaryFiles { ... }
# other_prefix_myFunction() { ... }
```

## 2. 变量处理

- **引号**：始终使用带花括号的双引号进行变量扩展（例如，`"${variable}"`），以防止单词分割和路径名扩展。当变量与其他字符相邻时，花括号也有助于消除歧义（例如，`"${variable}_suffix"`）。
- **路径**：路径变量必须始终使用引号和花括号。
- **输出**：优先使用 `printf` 而非 `echo`，以获得更安全和更可移植的字符串输出。

```bash
# USE:
printf '%s\n' "${variable}"
cp "${source_file}" "${destination_directory}/"
filename="report_${year}.txt"
mv "${filename}" "${archive_dir}/${filename}"

# NOT:
# echo $variable
# cp $source $destination
# filename="report_$year.txt" # Potentially problematic if $year_txt exists
```

## 3. 错误处理和脚本严谨性

- **Shebang**：所有脚本以 `#!/usr/bin/env bash` 开头。
- **严格模式**：在所有脚本的开头启用严格模式。
  ```bash
  set -euo pipefail
  # -e: Exit immediately if a command exits with a non-zero status.
  # -u: Treat unset variables and parameters as an error when performing expansion.
  # -o pipefail: The return value of a pipeline is the status of the last command to exit with a non-zero status,
  #              or zero if no command exited with a non-zero status.
  ```
- **显式错误处理**：对于预期会失败的命令，显式处理这些失败以防止 `set -e` 过早退出脚本。

  ```bash
  # USE:
  if ! command_that_might_fail --option; then
      printf 'Command failed, but we are handling it.\n' >&2
      # Perform alternative actions or log the error
  fi

  # OR, if you just want to ignore the failure:
  command_that_might_fail --another-option || true
  ```

- **清理陷阱**：使用 `trap` 确保在脚本退出时执行清理操作（例如，删除临时文件），无论是正常退出、错误还是中断。

  ```bash
  trap 'cleanup_function "Script exiting"' EXIT
  trap 'error_handler_function "An error occurred on line $LINENO"' ERR

  fct_cleanup_resources() {
    printf 'Cleaning up resources...\n' >&2
    rm -f "${TEMP_FILE_1}" "${TEMP_FILE_2}"
  }
  trap fct_cleanup_resources EXIT SIGINT SIGTERM
  ```

## 4. 变量作用域和命名

- **全局变量**：
  - 将全局常量声明为 `readonly` 并使用 `UPPERCASE_SNAKE_CASE` 命名。
  - 尽早初始化它们。
  ```bash
  # USE:
  readonly SCRIPT_NAME=$(basename "$0")
  readonly DEFAULT_CONFIG_PATH="/etc/my_app/config.conf"
  ```
- **局部变量**：
  - 始终在函数内将变量声明为 `local` 以限制其作用域。
  - 局部变量名使用 `lowercase_snake_case` 命名。
  ```bash
  fct_process_data() {
      local input_file="$1"
      local line_count=0
      # ...
  }
  ```

## 5. 命令替换

- **语法**：始终使用 `$(command)` 语法进行命令替换。它比反引号更易读且嵌套更好。

  ```bash
  # USE:
  local current_date=$(date +%Y-%m-%d)
  local num_files=$(find . -type f -name "*.log" | wc -l)

  # NOT:
  # local current_date=`date +%Y-%m-%d`
  ```

## 6. 条件表达式

- **测试**：对于涉及字符串比较、文件测试和模式匹配的条件表达式，优先使用 `[[ ... ]]`。它比 `[ ... ]` 更健壮且功能更丰富。

  ```bash
  # USE:
  if [[ -f "${file_path}" && "${user_name}" == "admin" ]]; then
      # ...
  fi

  if [[ "${input_string}" =~ ^[0-9]+$ ]]; then
      printf 'Input is numeric.\n'
  fi

  # AVOID:
  # if [ -f "$file_path" -a "$user_name" = "admin" ]; then ... fi
  ```

- **算术**：使用 `(( ... ))` 进行算术表达式和比较。

  ```bash
  # USE:
  local counter=0
  ((counter++))
  if (( counter > 10 )); then
      # ...
  fi

  # AVOID:
  # counter=$[$counter+1]
  # if [ "$counter" -gt 10 ]; then ... fi
  ```

## 7. IFS 操作

- **本地化**：当修改内部字段分隔符（`IFS`）时，始终保存其原始值并在不再需要时尽快恢复。
- **子shell**：或者，在子shell中执行需要修改 `IFS` 的操作，以自动本地化更改。

  ```bash
  # USE: Save and restore
  local old_ifs="${IFS}"
  IFS=","
  # Example: reading CSV fields into an array
  # local line="field1,field2,field3"
  # read -ra fields <<< "${line}"
  IFS="${old_ifs}"

  # USE: Subshell for localization
  # (
  #   IFS=":"
  #   # Commands using modified IFS, e.g., splitting PATH
  #   for item in $PATH; do printf '%s\n' "$item"; done
  # )
  # IFS remains unchanged here
  ```

## 8. 循环

- **读取行**：当逐行读取输入时（例如，从文件或命令输出），优先使用 `while read` 循环。
  - 使用 `read -r` 防止反斜杠解释。
  - 通过检查 `read` 的退出状态或在适当时追加 `|| [[ -n "${line}" ]]`，确保处理最后一行即使它不以换行符结尾。

  ```bash
  # USE:
  while IFS= read -r line || [[ -n "${line}" ]]; do
      printf 'Processing line: %s\n' "${line}"
  done < "input.txt"

  # Processing command output:
  # find . -type f -print0 | while IFS= read -r -d $'\0' file_path; do
  #   printf 'Found file: %s\n' "${file_path}"
  # done
  ```

## 9. 脚本参数

- **解析**：对于接受选项和参数的脚本，使用 `getopts` 进行解析。避免手动解析，因为这容易出错。
  ```bash
  # Example structure for getopts:
  # local verbose=0
  # local output_file=""
  #
  # while getopts ":vo:" opt; do
  #   case ${opt} in
  #     v )
  #       verbose=1
  #       ;;
  #     o )
  #       output_file="${OPTARG}"
  #       ;;
  #     \? )
  #       printf 'Invalid option: %s\n' "-${OPTARG}" >&2
  #       # usage_function
  #       exit 1
  #       ;;
  #     : )
  #       printf 'Option -%s requires an argument.\n' "${OPTARG}" >&2
  #       # usage_function
  #       exit 1
  #       ;;
  #   esac
  # done
  # shift $((OPTIND -1))
  #
  # Remaining arguments are in "$@"
  ```

## 10. 脚本退出

- **显式退出**：始终使用适当的状态码显式退出脚本。
  - `exit 0` 表示成功。
  - `exit N`（其中N为1-255）表示错误。如果有用，为不同的错误类型使用不同的代码。
  ```bash
  # USE:
  if some_condition_is_met; then
    printf 'Operation successful.\n'
    exit 0
  else
    printf 'Error: Condition not met.\n' >&2
    exit 1 # General error
  fi
  ```

## 11. 幂等性

- **原则**：在可能的情况下，将操作设计为幂等的。多次运行幂等操作应产生相同的最终状态，而不会产生意外的副作用。这对可靠的自动化至关重要。
- **示例**：
  - 仅在目录不存在时创建它：
    ```bash
    mkdir -p "/path/to/needed/directory"
    ```
  - 仅在行不存在时将其添加到文件中：
    ```bash
    local config_file="/etc/myapp/settings.conf"
    local setting_line="feature_enabled=true"
    if ! grep -qFx "${setting_line}" "${config_file}"; then
        printf '%s\n' "${setting_line}" >> "${config_file}"
    fi
    ```

## 12. 临时文件和目录

- **安全创建**：使用 `mktemp` 安全地创建临时文件和目录。这可以避免竞争条件和可预测性问题。

  ```bash
  # USE:
  local temp_file
  temp_file=$(mktemp) || { printf 'Failed to create temp file.\n' >&2; exit 1; }
  # Ensure cleanup, e.g., via trap: trap 'rm -f "${temp_file}"' EXIT

  local temp_dir
  temp_dir=$(mktemp -d) || { printf 'Failed to create temp directory.\n' >&2; exit 1; }
  # Ensure cleanup: trap 'rm -rf "${temp_dir}"' EXIT
  ```

## 13. 注释

- **清晰性**：编写注释以解释复杂的逻辑、假设或不明显的步骤。
- **风格**：
  - 使用 `#` 进行整行或行尾注释。
  - 为函数添加注释，描述其目的、参数以及任何副作用或返回值。

  ```bash
  # This is a full-line comment explaining the next block of code.
  local important_variable="value" # End-of-line comment for this variable.

  # fct_process_item: Processes a single item.
  # Arguments:
  #   $1: The item ID to process.
  # Outputs:
  #   Writes processing status to stdout.
  # Returns:
  #   0 on success, 1 on failure.
  fct_process_item() {
      # ...
  }
  ```

## 14. 静态分析

- **工具**：强烈建议使用 `shellcheck`（可在 [https://www.shellcheck.net/](https://www.shellcheck.net/) 获取）对所有Bash脚本进行代码检查。它有助于识别常见的陷阱、语法错误和风格问题。
- **集成**：将 `shellcheck` 集成到您的开发工作流中，例如作为预提交钩子或CI/CD管道的一部分。
- **便捷包装器**：使用 `scripts/run_shellck.sh` 自动检测和检查shell脚本：

  ```bash
  # Lint all scripts in scripts/ directory (default)
  .opencode/skill/bash/scripts/run_shellck.sh

  # Lint specific files or directories
  .opencode/skill/bash/scripts/run_shellck.sh path/to/script.sh
  .opencode/skill/bash/scripts/run_shellck.sh scripts/ other/dir/
  ```

  该包装器自动通过扩展名或shebang识别shell脚本，并使用 `-x` 标志运行shellcheck以跟随source指令。
