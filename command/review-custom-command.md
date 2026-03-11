# Review 命令

你的任务是审查一个 opencode 命令文件，确保它遵循最佳实践，正确使用 opencode 功能，并遵守 Anthropic 的提示指南。

## 审查说明

根据以下标准仔细分析提供的命令文件：

### 1. 命令结构与格式

- 验证命令具有清晰、描述性的标题
- 检查正确的 markdown 格式和结构
- 确保命令开头有明确的目的说明
- 验证各部分逻辑组织清晰、易于理解

### 2. Opencode 命令特定功能

- **Shell 输出注入**:
  - 验证使用反引号包裹的 !`command` 语法来嵌入 shell 输出（例如：!`npm test`, !`git status`）
  - 检查注入的输出是否用描述性的 XML 标签包裹（例如：`<git-status>`, `<file-list>`, `<test-results>`）
  - 确保在输出能为任务提供有价值上下文时使用 shell 注入
  - 验证命令没有指示模型去运行命令，而是应该使用 shell 注入
  - 确认反引号正确地包围了 !command 语法
- **$ARGUMENTS 处理**:
  - 检查 `$ARGUMENTS` 是否被正确地包裹在 XML 标签中
  - 验证特定输入是否使用了特定的 XML 标签名（例如：`<file-path>`, `<component-name>`）
  - 确保一般/未指定的输入使用默认的 `<user-query>` 标签
  - 确认命令在整个文件中正确引用参数标签
- **工具说明**:
  - 验证清晰、明确地提到要使用哪些工具（bash、read、write、edit、grep、glob、list 等）
  - 检查工具使用说明是否具体，而不是模糊的建议
- **子代理使用**:
  - 确保在适当的时候明确命名子代理（codebase-analyzer、codebase-locator 等）
  - 验证关于向子代理提示提供什么输入的清晰说明
  - 检查是否指定了子代理的预期输出格式

### 3. 提示最佳实践（Anthropic 指南）

- **清晰性**：指令应当清晰、具体且无歧义
- **上下文设置**：命令应为任务正确设置上下文
- **分步说明**：复杂任务应分解为清晰的步骤
- **示例**：检查是否有用的情况下提供了示例
- **输出格式**：验证预期输出格式的清晰说明
- **错误处理**：检查是否有处理边缘情况或错误的说明
- **语气指南**：确保有适当的语气说明（简洁、直接、有帮助）

### 4. 性能与效率

- **并行操作**：检查独立操作是否批量执行以实现并行处理
- **资源使用**：验证工具的有效使用，以最小化不必要的操作
- **上下文优化**：确保命令不会不必要地消耗上下文
- **代理委派**：检查复杂任务是否正确委派给专门的代理
- **输出结构**：验证命令产生结构良好、可解析的输出

## 审查流程

1. 仔细阅读整个命令文件
2. 检查正确的 !`command` shell 注入和 $ARGUMENTS 使用
3. 验证明确的工具和子代理说明
4. 分析提示的清晰度和结构
5. 提供具体、可操作的反馈和示例

## 审查报告模板

审查命令文件后，按以下格式提供反馈：

```markdown
# Command Review Report

## Command: [Command Name]

### Summary
[Brief 2-3 sentence overview of the command's purpose and overall quality]

### Strengths ✅
- [List positive aspects of the command]
- [Things that are well-implemented]
- [Good practices being followed]

### Issues Found 🔍

#### Critical Issues (Must Fix)
1. **[Issue Category]**: [Specific issue description]
   - Location: [Where in the file]
   - Impact: [Why this is critical]
   - Suggested Fix: [Concrete improvement suggestion]

#### Recommended Improvements
1. **[Improvement Area]**: [Description]
   - Current: [What exists now]
   - Suggested: [What would be better]
   - Example: [Code/text example if applicable]

#### Minor Suggestions
- [Less critical improvements or style suggestions]

### Opencode Command Compliance
- [ ] Shell injection !`command` syntax used correctly
- [ ] Shell output wrapped in descriptive XML tags
- [ ] $ARGUMENTS properly wrapped in XML tags
- [ ] Specific XML tag names for specific inputs
- [ ] Tools explicitly mentioned by name
- [ ] Subagents clearly identified with input instructions

### Anthropic Prompting Guidelines Compliance
- [ ] Clear and specific instructions
- [ ] Proper context setting
- [ ] Step-by-step breakdown for complex tasks
- [ ] Appropriate tone guidelines
- [ ] Output format specification

### Overall Score
**[Score]/10** - [Brief justification]

### Priority Actions
1. [Most important fix]
2. [Second priority]
3. [Third priority]
```

## 示例问题与修复

### 示例 1：缺少 Shell 输出注入

**问题**：命令告诉模型"运行 git status"而不是嵌入输出
**修复**：使用反引号包裹的 !command 语法并加上适当的 XML 标签

```markdown
# Instead of:
First, run git status to see what files have changed.

# Use:
<git-status>
!`git status --porcelain`
</git-status>

Analyze the changes shown in <git-status> above.
```

### 示例 2：不当的 $ARGUMENTS 处理

**问题**：命令使用 $ARGUMENTS 时没有 XML 包裹，或对特定输入使用了通用标签
**修复**：将 $ARGUMENTS 包裹在适当的 XML 标签中

```markdown
# Instead of:
Analyze the file at $ARGUMENTS

# Use (for specific file input):
<file-path>
$ARGUMENTS
</file-path>

Analyze the file at <file-path>.

# Or use (for general query):
<user-query>
$ARGUMENTS
</user-query>
```

### 示例 3：模糊的工具说明

**问题**：命令说"搜索模式"而没有指定使用哪个工具
**修复**：明确指定要使用的工具

```markdown
# Instead of:
Search the codebase for usages of this function.

# Use:
Use the grep tool to search for "functionName(" pattern across all .ts and .tsx files.
```

### 示例 4：缺少子代理说明

**问题**：命令提到使用子代理但没有清晰的输入说明
**修复**：提供明确的子代理名称和输入格式

```markdown
# Instead of:
Use an agent to analyze the codebase structure.

# Use:
Use the codebase-analyzer subagent with the following prompt:
"Analyze the authentication flow starting from login.tsx, including all middleware and API routes involved. Focus on security checks and token handling."
```

## 附加说明

- 特别注意正确的 !`command` shell 注入语法（带反引号）与指示模型运行命令的区别
- 理解 !`agentic metadata` 或类似命令是有效的 shell 注入，而不是给模型的指令
- 验证 XML 标签命名在整个命令中是语义化的且一致的
- 确保 $ARGUMENTS 始终被包裹并一致地引用
- 检查注入的 shell 输出提供有价值的上下文，而不仅仅是噪音
- 验证子代理提示是完整的且自包含的

记住：目标是确保命令遵循 opencode 的特定功能和最佳实践

## 要审查的命令文件

**重要**：首先，使用 Read 工具读取下面的整个文件，不要有任何行数限制，以确保在开始评估之前你有完整的上下文。

<file>
$ARGUMENTS
</file>

**关键**：如果下面的 <file> 标签只包含 $ARGUMENTS（意味着没有提供文件路径），立即停止并要求用户提供要审查的命令文件路径。
