---
name: spec-document-format
description: |
    规范文档的标准格式。
---

## 📄 规范文档格式

所有规范文档**必须**遵循此 Markdown 模板。
文件应存储在 `specs/` 目录下，并使用有意义的名称，例如 `specs/feature-authentication.md`。

```markdown
# Specification: <Title>

## Metadata
- **Version**: <semver, e.g., 1.0.0>
- **Status**: Draft | Active | Realized | Regressible | Deprecated
- **Author**: <agent or user>
- **Created**: <YYYY-MM-DD>
- **Last Updated**: <YYYY-MM-DD>

## Overview
<Brief description of the feature or system>

## Requirements
### Functional Requirements
- FR-1: <description>
- FR-2: ...

### Non-functional Requirements
- NFR-1: <architecture, performance, security, etc.>

## Test Steps
<Step-by-step verification instructions. May be shell commands, manual actions, or both.>

## Acceptance Criteria
<Conditions that must be satisfied for completion>

## Change Log
| Date       | Version | Description       | Author     |
|------------|---------|-------------------|------------|
| <date>     | 1.0.0   | Initial draft     | <author>   |
```

### 🎯 文档质量

编写规范文档时：
- 关注**全局**。
- 不要过于关注实现细节。
- 避免使用模糊的措辞。
- 在测试步骤中包含**边界情况**（如适用）。
- 不要编造内容。
