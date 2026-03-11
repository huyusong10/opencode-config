# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 仓库概述

这是一个用于创建自定义 Claude Code 技能的模板仓库。它提供了一个结构化框架，用于构建能够扩展 Claude Code 能力的技能，包括专业知识、工作流程或工具集成。

## 核心架构

### 技能结构

Claude Code 技能遵循渐进式披露模式，包含三种资源类型：

1. **SKILL.md**（必需）- 带有 YAML 前置数据的主技能配置
   - 包含 `name` 和 `description` 字段，决定 Claude 何时激活该技能
   - 全文使用祈使/不定式形式（动词优先的指令）
   - 保持精简（<5k 字），详细信息移至 references/

2. **scripts/** - 用于确定性、可重用操作的可执行代码
   - 当相同代码被反复重写时使用
   - 可以在不加载到上下文的情况下执行

3. **references/** - 根据需要加载到上下文中的文档
   - 用于模式、API 文档、领域知识、策略
   - 保持 SKILL.md 专注，同时提供详细信息

4. **assets/** - 用于输出的文件（不加载到上下文）
   - 模板、图像、样板代码、字体
   - 在最终输出中复制/修改

### GitHub Actions 工作流

仓库包含 `.github/workflows/release-skill.yml`，它会自动：

- 从 VERSION 文件提取版本号
- 验证 SKILL.md 结构（包含 name/description 的前置数据）
- 构建技能分发包 ZIP
- 附加到 GitHub 发布

## 开发命令

### 本地测试技能

将技能安装到 Claude Code 技能目录：

```bash
# Windows (Git Bash)
cp -r . "$USERPROFILE/.claude/skills/your-skill-name"

# Unix/Mac
cp -r . ~/.claude/skills/your-skill-name
```

通过向 Claude 提问与技能描述匹配的问题来测试激活。

### Markdown 代码检查

仓库使用 markdownlint-cli2，并禁用了行长度检查：

```bash
# Configuration in .markdownlint-cli2.jsonc
# MD013 (line length) is disabled to prevent linter warnings on long lines
```

### Git 配置

对于新仓库，在本地配置 git 用户：

```bash
git config --local user.name "your-username"
git config --local user.email "your-email@users.noreply.github.com"
```

### 发布流程

1. 使用新版本更新 VERSION 文件（例如 `1.0.0`）
2. 提交并推送：`git commit -m "Release v1.0.0" && git push`
3. 创建发布：`gh release create v1.0.0 --generate-notes`
4. GitHub Actions 自动构建并附加技能 ZIP

详细说明请参见 `docs/tasks/release/how-to-release.md`。

## 重要文件

- **SKILL.md** - 带有 YAML 前置数据的主技能文件（name、description）
- **VERSION** - 用于发布的单一版本号（例如 `0.0.1`）
- **README.md** - 面向用户的文档和安装说明
- **SETUP.md** - 自定义模板的分步设置指南
- **.markdownlint-cli2.jsonc** - Markdown 代码检查器配置（MD013 已禁用）
- **docs/tasks/release/how-to-release.md** - 发布工作流文档
- **docs/tasks/tests/how-to-test-skill.md** - 测试框架和测试用例

## 技能开发最佳实践

### SKILL.md 描述字段

描述字段决定 Claude 何时激活技能。使其：

- 具体说明用户可能说的触发词
- 清楚说明何时使用该技能的场景
- 包含与技能相关的文件类型、操作或主题
- 使用第三人称形式："This skill should be used when..."

示例：

```yaml
---
name: docker-helper
description: This skill should be used when the user asks about Docker containers, needs to run docker commands, or wants to manage Docker images and containers. Use when queries mention docker, containerization, or container management.
---
```

### 写作风格

- 在 SKILL.md 中全程使用祈使/不定式形式（动词优先的指令）
  - 好："Run the script to process files"
  - 坏："You should run the script" 或 "You can run the script"
- 保持 SKILL.md 专注且简洁（<5k 字）
- 将详细文档移至 `references/` 文件
- 提供真实示例，而非假设性示例

### 打包资源指南

#### 何时包含 scripts/

- 代码被 Claude 反复重写
- 确定性行为至关重要
- 不应重新生成的复杂逻辑

#### 何时包含 references/

- 详细的模式、API 文档、策略
- 领域特定知识
- 为 Claude 流程提供信息的内容
- 对于 >10k 字的文件，在 SKILL.md 中包含 grep 模式

#### 何时包含 assets/

- 模板、图像、样板代码
- 将在输出中复制/修改的文件
- 不加载到上下文，用于最终交付物

### 测试方法

遵循 `docs/tasks/tests/how-to-test-skill.md` 中的框架：

1. 在本地安装技能
2. 使用各种措辞测试激活
3. 验证核心功能
4. 测试错误处理
5. 验证文档准确性

为每个技能功能创建具有预期输入/输出的具体测试用例。

## 常见工作流

### 从模板创建新技能

1. 更新 SKILL.md 前置数据（name 和 description）
2. 自定义 SKILL.md 内容（目的、用法、先决条件）
3. 添加实现（scripts、references 或 assets）
4. 使用技能特定信息更新 README.md
5. 更新 VERSION 文件（从 `0.0.1` 开始）
6. 通过安装到 Claude 技能目录在本地测试
7. 初始化 git 并推送到 GitHub
8. 准备就绪时创建发布

完整的分步说明请参见 `SETUP.md`。

### 发布前验证

必需检查：

- SKILL.md 具有包含 `name` 和 `description` 的有效 YAML 前置数据
- VERSION 文件存在且包含语义版本号
- README.md 已自定义（无模板占位符）
- 技能正确安装到 `~/.claude/skills/`
- Claude 在预期时激活技能
- 所有文档化的命令/脚本都能工作
- 文档与实际行为匹配

## 故障排除

### 技能未激活

1. 验证 SKILL.md 具有有效的 YAML 前置数据：`head -10 SKILL.md`
2. 检查描述是否具体并包含触发词
3. 尝试明确请求："Use the [skill-name] skill to..."
4. 重启 Claude Code（技能在启动时加载）

### GitHub Actions 发布失败

常见问题：

- VERSION 文件缺失或为空
- SKILL.md 缺少 YAML 前置数据
- 无效的前置数据（缺少 `name` 或 `description`）

检查工作流日志：`gh run view --log`

### 脚本无法执行

1. 验证脚本是否可执行：`chmod +x scripts/*.py`
2. 检查所需工具是否已安装：`which python`、`which jq` 等
3. 手动测试脚本：`python scripts/example_script.py`

## 文档结构

```text
docs/
├── guides/              # 附加文档（可选）
│   └── README.md
└── tasks/
    ├── release/
    │   └── how-to-release.md    # 发布工作流
    └── tests/
        └── how-to-test-skill.md # 测试框架
```

## 版本号

遵循语义化版本控制（MAJOR.MINOR.PATCH）：

- `0.0.1` - 初始开发
- `0.1.0` - 首个功能完整版本
- `1.0.0` - 首个稳定发布
- `1.1.0` - 新功能（向后兼容）
- `1.1.1` - 错误修复
- `2.0.0` - 破坏性变更

## 参考资料

- [Claude Code Skills Documentation](https://docs.claude.com/en/docs/claude-code/skills)
- [Skill Authoring Best Practices](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices)
- [skill-creator Skill](https://github.com/anthropics/example-skills) - Official skill creation tool
