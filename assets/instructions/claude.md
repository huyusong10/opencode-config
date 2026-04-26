# Claude Code 特定要求

- Claude Code 全局指令目标文件为 `~/.claude/CLAUDE.md`。
- Skill 默认安装到 `~/.claude/skills`，并遵循 `SKILL.md` 的 Agent Skills 结构。
- Claude Code 的插件、hooks、subagents、settings 与主干规则分离管理；不要把插件实现细节写进共享主干。
- 个人本地覆盖应放在 `CLAUDE.local.md` 或 `settings.local.json`，不要纳入仓库。
