## System Engineer Trigger Rules

### 概述

系统工程师 (@system-engineer) 在 Maestro、Architect、Maker 完成主要工作后自动触发，进行系统级别的深度思考和架构分析。

---

### 触发条件

**自动触发：** 当以下 Agent 完成主要工作时，输出 `<system-review-request>` 标签：

| Agent | 触发时机 |
|-------|---------|
| Maestro | 阶段归档完成后 |
| Architect | 规划完成后（STATE.md status = ready） |
| Maker | Plan 执行归档完成后 |

---

### 输出标签格式

在完成主要工作后，输出以下标签触发系统工程师：

```markdown
<system-review-request>

## 阶段信息
- Phase: [phase-id]
- Plan: [plan-id]
- Status: [completed/ready]

## 完成的工作
[简要描述完成的主要任务]

## 关键变更
- [文件1]: [变更描述]
- [文件2]: [变更描述]

## 验证结果
- Tests: [pass/fail]
- Build: [pass/fail]
- Lint: [pass/fail]

## 验收标准达成情况
- [x] 标准1: [描述]
- [x] 标准2: [描述]

</system-review-request>
```

---

### 跳过条件

以下情况在输出末尾添加 `<!-- skip-system-review -->` 或使用其他跳过标签：

| 跳过标签 | 适用场景 |
|---------|---------|
| `skip-system-review` | 明确跳过系统评审 |
| `quick-fix` | 快速修复，无需系统审查 |
| `docs-only` | 纯文档更新 |
| `minor-change` | 小范围变更 |
| `typo-fix` | 错别字修复 |
| `config-update` | 配置文件微调 |

**判断标准：**

- 变更 ≤ 20 行
- 不涉及架构变化
- 无新增文件
- 无新增依赖
- 纯文档或配置变更

---

### 迭代控制

| 配置项 | 默认值 | 说明 |
|-------|-------|------|
| `max_iterations` | 3 | 最大迭代次数 |
| `enabled` | true | 是否启用 |
| `auto_trigger` | true | 自动触发 |

**迭代状态文件：** `.planning/system-loop.state.md`

**退出条件：**
1. 系统工程师返回 `decision="done"`
2. 达到最大迭代次数
3. 检测到跳过标签

---

### 完整工作流程

```
┌─────────────────────────────────────────────────────────────┐
│                 System Engineer Workflow                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Primary Agent 完成工作                                  │
│     │                                                       │
│     ▼                                                       │
│  2. 输出 <system-review-request> 标签                       │
│     │                                                       │
│     ▼                                                       │
│  3. system-loop 插件检测标签                                 │
│     │                                                       │
│     ├── 有跳过标签 → 结束                                    │
│     │                                                       │
│     └── 无跳过标签 → 继续                                    │
│         │                                                   │
│         ▼                                                   │
│  4. 检查迭代次数                                             │
│     │                                                       │
│     ├── 超过最大值 → 输出总结，结束                           │
│     │                                                       │
│     └── 未超过 → 触发 @system-engineer                       │
│         │                                                   │
│         ▼                                                   │
│  5. @system-engineer 进行系统分析                            │
│     │                                                       │
│     ▼                                                       │
│  6. 输出 <system-feedback decision="...">                   │
│     │                                                       │
│     ├── decision="done" → 清理状态，结束                     │
│     │                                                       │
│     └── decision="continue" → 注入迭代提示词                 │
│         │                                                   │
│         ▼                                                   │
│  7. Primary Agent 根据反馈改进                               │
│     │                                                       │
│     └── 返回步骤 2                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 示例

#### Maestro 完成阶段后

```markdown
## 阶段完成

**Phase:** 01-authentication
**Status:** completed

### 完成的任务
- 实现用户登录功能
- 添加 JWT 认证中间件
- 编写单元测试

<system-review-request>

## 阶段信息
- Phase: 01-authentication
- Plan: 01-jwt-auth
- Status: completed

## 完成的工作
- 实现了基于 JWT 的用户认证系统
- 添加了登录、登出、token 刷新 API
- 实现了认证中间件保护路由

## 关键变更
- src/api/auth/login.ts: 新增登录 API
- src/api/auth/logout.ts: 新增登出 API
- src/middleware/auth.ts: 新增 JWT 验证中间件
- src/types/user.ts: 新增用户类型定义

## 验证结果
- Tests: 12 passed, 0 failed
- Build: success
- Lint: no errors

## 验收标准达成情况
- [x] 用户可以登录并获取 JWT token
- [x] Token 过期后自动刷新
- [x] 无效 token 返回 401 错误

</system-review-request>
```

#### 快速修复跳过评审

```markdown
## 快速修复

修复了 README.md 中的错别字。

<!-- skip-system-review -->
```