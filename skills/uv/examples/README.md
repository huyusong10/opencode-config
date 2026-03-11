# UV 实际应用示例

## 概述

本目录包含 UV 在不同场景下的实际应用示例、常见模式和反模式。

## 示例分类

### [内联脚本元数据](inline-scripts.md)

使用 UV 的 PEP 723 内联脚本元数据示例。学习如何创建包含嵌入式依赖的自包含 Python 脚本。

**主题：**

- 基本内联依赖
- Python 版本要求
- 带内联依赖的 MCP 服务器
- 数据处理脚本
- 何时使用内联元数据

### [MCP 服务器示例](mcp-servers.md)

各种平台和用例的完整 MCP 服务器配置示例。

**主题：**

- 已发布的 MCP 服务器（官方、AWS 等）
- VS Code 和 Continue IDE 配置
- 本地开发环境设置
- 多配置开发

### [开发工作流](development-workflows.md)

完整的开发工具设置和日常工作流模式。

**主题：**

- Python 开发环境设置
- 项目特定脚本执行
- 多版本测试工作流

### [虚拟环境工作流](virtual-environments.md)

虚拟环境管理模式和最佳实践。

**主题：**

- 基本项目设置
- 现有项目迁移
- 多环境项目

### [CI/CD 示例](ci-cd.md)

持续集成和部署配置。

**主题：**

- GitHub Actions 工作流
- GitLab CI 流水线

### [迁移示例](migrations.md)

从其他 Python 工具迁移到 UV 的指南。

**主题：**

- 从 pip 迁移到 UV
- 从 pipx 迁移到 UV tool
- 从 poetry 迁移到 UV

### [常见模式](common-patterns.md)

常用的模式和配置。

**主题：**

- 开发工具套件设置
- Pre-commit 集成
- Shell 配置

### [反模式](anti-patterns.md)

使用 UV 时应避免的常见错误。

**主题：**

- 全局 pip 安装
- 使用 uv tool 安装 MCP 服务器
- 使用 uvx 作为日常工具
- 混合工具管理
- 忘记使用虚拟环境

### [完整工作流](complete-workflow.md)

使用 UV 设置新 Python 项目的端到端示例。

**主题：**

- 完整项目初始化
- Git 设置
- 依赖管理
- 测试和格式化
- 文档

## 如何使用这些示例

1. **按主题浏览** - 使用上方的分类链接查找相关示例
2. **复制并调整** - 所有示例都设计为可复制并根据您的需求修改
3. **遵循模式** - 使用"DO"示例并避免"DON'T"反模式
4. **参考相关文档** - 每个示例文件都链接到相关的参考文档

## 相关文档

- [安装和设置](../references/installation-and-setup.md)
- [工具管理](../references/tool-management.md)
- [Python 环境管理](../references/python-environment.md)
- [内联脚本元数据](../references/inline-script-metadata.md)
- [MCP 集成](../references/mcp-integration.md)
