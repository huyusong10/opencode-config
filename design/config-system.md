# Coding Agent 配置系统契约

## 模块职责

`agentcfg` 管理个人 Coding Agent 配置资产，并把同一套资产安装到 Codex、Claude Code、OpenCode 等目标工具的实际配置目录。

## 核心模型

| 概念 | 职责 | 契约 |
| --- | --- | --- |
| 资产 | 仓库内可复用内容 | 只描述内容本身，不绑定目标工具目录 |
| 目标 | 某个 Coding Agent 工具的适配器 | 声明指令文件、资产安装路径、支持的安装方式 |
| Profile | 一组安装选择 | 声明目标工具集合、启用资产、可选资产过滤 |
| Manifest | 已安装状态记录 | 记录目标路径、来源资产、checksum、安装模式、备份位置 |
| Backup | 可恢复快照 | 保存被覆盖或主动备份的托管/非托管目标文件 |

## 对外 CLI 契约

| 命令 | 行为 |
| --- | --- |
| `install <target> --profile <name>` | 渲染并安装 profile 选中的资产，写入 manifest |
| `uninstall <target>` | 只删除 manifest 中属于该 target 的托管路径 |
| `status` | 展示 manifest 条目与目标路径当前状态 |
| `diff <target>` | 比较仓库期望输出与目标路径当前内容 |
| `doctor` | 检查仓库结构、配置解析、常见敏感文件风险 |
| `backup <target>` | 备份当前 manifest 托管路径 |
| `restore <id\|latest>` | 从 `backup` 命令生成的备份恢复目标文件，并恢复对应 manifest 托管条目 |
| `import <target> --plan` | 扫描目标工具目录并输出候选导入计划，不写仓库 |
| `render <target>` | 输出目标工具指令文件渲染结果，不写目标目录 |
| `validate` | 校验 target/profile/JSONC/TOML/YAML/frontmatter 基础合法性 |
| `save "message"` | 校验后提交仓库当前配置变更 |
| `sync` | 执行 `git pull --rebase` 与 `git push` |
| `publish "message"` | 等价于 `save` 后 `sync` |
| `history` | 展示最近配置版本 |
| `rollback <ref>` | 默认只展示回滚计划；带 `--apply` 才执行 revert |

`all` 是 target 聚合别名，展开为 profile 允许的目标集合；显式 target 若不在 profile targets 中，应拒绝执行。`--profile <name>` 与 `--profile=<name>` 表达同一个 profile 选择。`--dry-run` 只输出计划，不修改目标目录或 manifest。

## 指令文件契约

指令源文件在仓库内按共享内容和目标工具独占内容拆分。共享规则位于 `instructions/shared/`，目标工具独占规则可放在 `instructions/<target>/`。安装到目标工具后的 `AGENTS.md` / `CLAUDE.md` 必须是完整单体文件，不得依赖仓库源码路径。每个 target 在 `targets/<target>.yaml` 的 `instruction.fragments` 中声明拼接顺序。

单个 target 的 `render` 输出必须是可直接写入目标指令文件的纯内容，不添加生成注释头，避免占用目标工具上下文窗口。渲染顺序固定为：

1. shared core
2. 可选的 target 专属片段

生成文件不得把具体中文或英文文案当成稳定契约；测试应断言结构、标记和目标路径，而不是大段文案。

不同工具共享核心规则。target 专属片段只有在存在真实、有效、不可共享的要求时才新增；安装路径、目录说明、空泛提醒这类信息不得伪装成规则占用上下文。若用户删除某个 target 的独占内容，不得通过 shared 片段绕回来。

`validate` 必须检查指令片段存在、片段行数预算、渲染后文件行数预算，以及渲染结果是否引用 `assets/` 等源码路径。预算是结构约束；若超过预算，优先合并、删除、重构旧内容或下沉到对应 README，而不是继续追加。

## 安装与删除安全边界

- 默认安装模式是 copy；link 只用于调试或本机联动。
- 目标路径存在且不是当前 manifest 托管内容时，必须先备份再覆盖。
- 目标路径是坏符号链接时，也视为需要备份和替换的已有目标，不能让写入跟随坏链接失败。
- 目标路径存在且内容与 manifest checksum 不一致时，删除前必须备份。
- `uninstall` 不扫描删除未知文件，只处理 manifest 中的路径。
- `restore` 只恢复由 `agentcfg backup` 生成且带索引的备份，并只合并被恢复目标路径对应的 manifest 条目。
- link 模式用于调试；`status` 与 `diff` 应按目标内容判断一致性，不应因为 symlink 形态本身误报差异。

## 默认排除内容

以下内容默认不进入普通备份、导入候选或 Git 版本管理。排除规则应按路径片段和文件类型判断，不应把普通文件名里的子串当作排除依据。

- 凭据：`auth.json`、token、secret、key、`.env*`
- 历史与会话：history、transcripts、sessions、todos、plans、projects
- 缓存与运行时：cache、logs、sqlite、database、node_modules、lockfile、`.DS_Store`
- 工具运行状态：OpenCode notifier state、Claude/Codex 临时状态、agent 工作区快照

## Git 抽象契约

Git 命令只管理当前配置仓库，不直接修改用户 home 下已安装配置。修改目标工具配置必须通过 `install`、`uninstall`、`backup` 或 `restore` 完成。

`rollback <ref> --apply` 使用 `git revert <ref>..HEAD`，不使用破坏性 reset。无 `--apply` 时只能展示计划。
