## Planning Mode

当 `.planning/` 不存在或 STATE.md status 为 `planning` 时，进入规划模式。

### 流程

```
探索需求 → 研究技术 → 创建规划 → 推荐执行模式 → 等待用户确认
```

### 1. 需求探索

**初始问题：**
- 你想构建**什么**？
- **为什么**需要它？
- **谁**会使用它？
- 存在**哪些约束**（时间、技术、资源）？

**上下文收集：**
```bash
ls -la                           # 项目结构
git status && git log --oneline -10
cat package.json 2>/dev/null | head -30
```

### 2. 技术研究

| 级别 | 时机 | 行动 |
|------|------|------|
| Level 0 | 遵循既定模式 | 跳过 |
| Level 1 | 单一库验证 | 使用 context7 |
| Level 2 | 在选项间选择 | 委托 @researcher |
| Level 3 | 架构决策 | 完整研究周期 |

### 3. Goal-Backward Methodology

**核心思想：** "目标要达成，什么必须为真？"

1. **State the Goal** - 从 ROADMAP.md 提取阶段目标（outcome-oriented）
2. **Derive Observable Truths** - 列出 3-7 个用户可验证的行为
3. **Derive Required Artifacts** - 每个真理需要哪些文件/组件
4. **Derive Required Connections** - 产物之间如何连接
5. **Identify Critical Links** - 哪些连接断裂会导致级联失败

**输出：must_haves 结构**
```yaml
must_haves:
  truths: ["User can X", "User can Y"]
  artifacts:
    - path: "src/X.ts"
      provides: "X functionality"
  key_links:
    - from: "src/X.ts"
      to: "/api/x"
      via: "fetch"
```

### 4. Wave 分组

**依赖图构建：** 记录每个任务的 `needs` 和 `creates`

**分组算法：**
```
for each plan:
  if depends_on is empty → wave = 1
  else → wave = max(waves[dep] for dep in depends_on) + 1
```

**优先垂直切片：** 每个计划包含完整功能（model + API + UI），而非水平分层（所有 model → 所有 API → 所有 UI）

### 5. 输出产物

```
.planning/
├── PROJECT.md          # 愿景、约束、技术栈
├── REQUIREMENTS.md     # REQ-IDs 需求列表
├── ROADMAP.md          # 阶段路线图
├── STATE.md            # status: ready
└── phases/[phase]/
    ├── *-CONTEXT.md    # 阶段决策
    └── *-PLAN.md       # 执行计划（含 frontmatter）
```

### 6. PLAN.md Frontmatter

```yaml
---
phase: 01-name
plan: 01
execution_mode: ralph | tdd | standard | spike | debug | refactor | migrate
wave: 1
depends_on: []
files_modified: []
autonomous: true
requirements: [REQ-01]
must_haves: {...}
---
```

### 7. 完成条件

- [ ] 已进行需求探索对话
- [ ] 已创建 .planning/ 结构
- [ ] STATE.md status = `ready`
- [ ] 已推荐执行模式
- [ ] 用户确认开始执行