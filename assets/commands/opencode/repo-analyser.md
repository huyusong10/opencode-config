---
description: repo-analyser
---

# 引导仓库文档

使用 10 个并行运行的专业探索代理来探索此仓库。每个代理专注于代码库的一个特定方面。所有代理完成后，将发现综合成一个全面的 `CODEBASE[.]md` 文档。

## 目标

$ARGUMENTS

如果未指定目标，则分析整个仓库。

## 步骤 1：并行启动所有 10 个代理

**重要**：在单条消息中启动所有 10 个任务工具调用，以实现真正的并行执行。每个代理使用 `@ explore` 子代理。

同时启动这些探索代理：

### 代理 1：仓库结构
```
@ explore Map the complete directory structure of this repository. Identify:
- Top-level directories and their purposes
- Key entry points (main files, index files)
- Overall architecture pattern (monorepo, microservices, monolith, etc.)
- File naming conventions
Return a structured summary of the repository layout.
```

### 代理 2：文档发现
```
@ explore Find all existing documentation in this repository:
- README files at all levels
- Doc folders and their contents
- Inline documentation patterns
- API documentation
- Architecture decision records (ADRs)
- Contributing guidelines
Summarize what documentation exists and any gaps.
```

### 代理 3：配置与环境
```
@ explore Analyze all configuration and environment setup:
- Config files (tsconfig, eslint, prettier, etc.)
- Environment variables and .env patterns
- Build configuration (webpack, vite, esbuild, etc.)
- Package manager setup (npm, yarn, pnpm)
- Required environment setup steps
Document the configuration landscape.
```

### 代理 4：数据层
```
@ explore Explore the data layer of this repository:
- Database schemas and models
- ORM/ODM usage (Prisma, TypeORM, Mongoose, etc.)
- Migration files and patterns
- Data validation schemas
- Caching strategies
- Data flow patterns
Summarize how data is structured and managed.
```

### 代理 5：核心业务逻辑
```
@ explore Identify and map the core business logic:
- Main services and their responsibilities
- Key algorithms and computations
- Business rules and validation
- Domain models and entities
- State management patterns
Document the heart of the application logic.
```

### 代理 6：接口层（API 与路由）
```
@ explore Map the interface layer:
- API endpoints and routes
- Request/response patterns
- Authentication and authorization
- Middleware usage
- GraphQL schemas (if applicable)
- WebSocket handlers (if applicable)
Document how the application exposes its functionality.
```

### 代理 7：测试模式
```
@ explore Analyze the testing strategy:
- Test frameworks in use (Jest, Vitest, Mocha, etc.)
- Test file organization
- Unit vs integration vs e2e test patterns
- Mocking strategies
- Test utilities and helpers
- Coverage configuration
Summarize testing patterns and coverage approach.
```

### 代理 8：部署与运维
```
@ explore Explore deployment and operations setup:
- CI/CD pipelines (GitHub Actions, GitLab CI, etc.)
- Docker configuration
- Kubernetes manifests (if any)
- Infrastructure as code
- Deployment scripts
- Monitoring and logging setup
Document the deployment and operational patterns.
```

### 代理 9：依赖分析
```
@ explore Analyze the dependency landscape:
- Key runtime dependencies and their purposes
- Development dependencies
- Peer dependencies and version constraints
- Internal packages (in monorepos)
- Dependency update strategies
- Security considerations
Provide a dependency overview with notable packages explained.
```

### 代理 10：领域知识
```
@ explore Extract domain-specific knowledge:
- Business domain terminology used in code
- Domain entities and their relationships
- Industry-specific patterns
- Glossary of project-specific terms
- Key abstractions and metaphors
Build a domain knowledge glossary.
```

## 步骤 2：收集代理结果

通过任务工具启动所有代理后，收集它们完成后的发现。

## 步骤 3：综合生成 CODEBASE[.]md

所有代理返回发现后，在仓库根目录创建 `CODEBASE[.]md`：

```markdown
# Codebase Documentation

> Auto-generated repository documentation

## Overview
[High-level summary synthesized from all agents]

## Repository Structure
[From Agent 1]

## Getting Started
[Synthesized from Agents 2, 3]

## Architecture
[Synthesized from Agents 1, 5, 6]

## Data Layer
[From Agent 4]

## Core Logic
[From Agent 5]

## API Reference
[From Agent 6]

## Testing
[From Agent 7]

## Deployment
[From Agent 8]

## Dependencies
[From Agent 9]

## Domain Glossary
[From Agent 10]

## Documentation Index
[From Agent 2 - links to existing docs]
```

## 重要说明

- 在单条消息中启动所有代理以实现真正的并行
- 每个代理有自己的上下文窗口，防止上下文污染
- 如果代理失败，在最终文档中注明缺失部分
- 多个并行代理运行时，界面闪烁是正常现象

## 用法

```
/bootstrap-repo
/bootstrap-repo src/
```

<!-- source https://x.com/cloudxdev -->
