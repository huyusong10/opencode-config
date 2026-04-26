# coding-agent-config

个人 Coding Agent 综合配置仓库，统一管理 Codex、Claude Code、OpenCode 的配置、规则、skills、commands、agents、plugins 和安装状态。

核心入口是 `agentcfg`。仓库内容以“资产 -> 目标工具 -> profile -> 安装记录”组织，而不是为每个工具维护一套互相复制的目录。

## 安装

```bash
curl -fsSL https://raw.githubusercontent.com/huyusong10/coding-agent-config/main/install.sh | bash
```

本地调试：

```bash
bin/agentcfg validate
bin/agentcfg install all --profile full --dry-run
bin/agentcfg install all --profile full
```

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `agentcfg install all --profile full` | 安装完整配置 |
| `agentcfg install codex --profile minimal --dry-run` | 预览 Codex 最小安装 |
| `agentcfg uninstall opencode --dry-run` | 预览删除 OpenCode 托管配置 |
| `agentcfg status` | 查看 manifest 托管状态 |
| `agentcfg diff all` | 比较仓库期望输出与本机已安装内容 |
| `agentcfg doctor` | 体检配置结构与敏感文件风险 |
| `agentcfg backup all` | 备份当前托管配置 |
| `agentcfg restore latest` | 恢复最近一次主动备份 |
| `agentcfg import claude --plan` | 生成 Claude Code 配置导入候选计划 |
| `agentcfg render codex` | 输出 Codex 指令文件内容 |
| `agentcfg validate` | 校验 target/profile/JSONC/TOML/YAML/frontmatter |

## Git 抽象命令

| 命令 | 展开行为 |
| --- | --- |
| `agentcfg save "message"` | `validate` 后 stage 仓库变更并 commit |
| `agentcfg sync` | `git pull --rebase` 后 `git push` |
| `agentcfg publish "message"` | `save` 后 `sync` |
| `agentcfg history` | 查看最近配置版本 |
| `agentcfg rollback <ref>` | 只展示回滚计划 |
| `agentcfg rollback <ref> --apply` | 用 `git revert <ref>..HEAD` 执行非破坏性回滚 |

Git 命令只管理本仓库，不直接修改 `~/.codex`、`~/.claude`、`~/.config/opencode`。用户配置目录的变化必须通过 `install`、`uninstall`、`backup` 或 `restore` 完成。

## 目录模型

```text
assets/
    instructions/          # 共享主干与工具 overlay
    skills/                # 可共享 Agent Skills
    config/opencode/       # OpenCode JSONC/TUI 配置
    agents/opencode/       # OpenCode agents
    commands/opencode/     # OpenCode commands
    plugins/opencode/      # OpenCode plugins
    rules/shared/          # 共享规则文件
targets/
    codex.yaml             # Codex 安装适配器
    claude.yaml            # Claude Code 安装适配器
    opencode.yaml          # OpenCode 安装适配器
profiles/
    minimal.yaml           # 最小安装组合
    full.yaml              # 完整安装组合
    codex-heavy.yaml       # Codex 专用组合
    opencode-full.yaml     # OpenCode 专用组合
templates/
    instructions.md        # AGENTS.md/CLAUDE.md 渲染模板
design/
    config-system.md       # 配置系统契约
tests/
    *.test.ts              # CLI 契约测试
```

## 安全边界

- 安装会写入 `~/.agentcfg/manifest.json`，卸载只删除 manifest 中托管的路径。
- 覆盖已有目标文件前会先备份到 `~/.agentcfg/backups/`。
- 目标文件被用户改动后再卸载，也会先备份再删除。
- `auth.json`、token、secret、`.env*`、history、transcripts、sessions、cache、logs、sqlite、node_modules 等默认不进入普通备份、导入候选或 Git。
- 默认安装模式是 copy；`--link` 仅用于本机调试。

## Profiles

| Profile | 目标 |
| --- | --- |
| `minimal` | 共享指令、共享规则、少量核心 skills |
| `full` | Codex、Claude Code、OpenCode 的完整当前配置 |
| `codex-heavy` | Codex 指令与共享 skills |
| `opencode-full` | OpenCode 配置、agents、commands、plugins、rules、scripts、skills |

## 命名迁移

计划中的最终仓库名是 `coding-agent-config`。为避免当前工作区失效，本地文件夹和远端重命名应在内容迁移、测试和提交完成后最后执行。
