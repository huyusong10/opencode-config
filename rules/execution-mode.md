## Execution Mode

当 STATE.md status 为 `ready` 或 `in_progress` 时，进入执行模式。

### 流程

```
加载状态 → 解析计划 → 模式调度 → 执行任务 → 归档
```

### 1. 状态初始化

**一致性检查：**
| Signal | Recovery |
|--------|----------|
| `in_progress` but no active plan | Read PLAN.md, find last completed task |
| PLAN.md has partial `[x]` but no archive | Resume from last completed task |
| Archive has PLAN.md without SUMMARY.md | Generate SUMMARY.md |

### 2. 模式调度

| Mode | Flow | Use Case |
|------|------|----------|
| **ralph** (默认) | @coder → @tester → (pass? done : @debugger → loop) | 确定性验证循环 |
| **tdd** | RED(@tester) → GREEN(@coder) → REFACTOR(@coder) | 测试驱动 |
| **standard** | @coder → done | 常规开发 |
| **spike** | @researcher → @coder → done | 技术原型 |
| **debug** | @debugger → @tester → done | Bug 修复 |
| **refactor** | @coder → @tester → done | 代码重构 |
| **migrate** | @coder → @tester → done | 迁移任务 |

### 3. 快速通道

**条件（全部满足）：**
1. 涉及文件 ≤ 2 个
2. 预估变更 ≤ 20 行
3. 无架构影响
4. 不需要新测试文件
5. 变更类型：配置、文档、import 修复、typo、简单 bug

**流程：** 直接执行 → 验证 → 通过则提交 / 失败则降级到完整流程

### 4. Wave 执行

**并行条件：** 同 Wave + 无文件冲突 + 无 Wave 内依赖 + 所有 autonomous: true

**写安全协议：**
- STATE.md 仅在 Wave barrier 后写入
- 子代理通过报告返回结果，不修改共享文件
- 日志使用 session-scoped 路径

### 5. 状态更新

| 字段 | 更新时机 |
|------|----------|
| 当前位置 | 每个计划开始/完成时 |
| 进度条 | 每个阶段完成时 |
| 性能指标 | 每个计划完成时 |
| 决策记录 | Rule 4 或关键决策时 |
| 当前阻塞 | 发现/解决时 |

### 6. 归档流程

**时机：** 所有任务 `[x]` → 验证通过 → 更新 frontmatter → 创建 SUMMARY.md → 移动到 archive/ → 更新 STATE.md

**SUMMARY.md 骨架：**
```markdown
# Plan 执行摘要

## 元信息
- Phase / Plan / Mode / Duration

## 任务完成情况
| 任务 | 文件 | 提交 |

## 验证结果
- [x] tests / build

## 偏差记录
[Deviations if any]
```

### 7. 铁律

- 遵循 PLAN.md 的 execution_mode
- 每个任务后提交
- 永不跳过验证
- 偏差处理参见 `rules/deviation-rules.md`
- Checkpoint 处理参见 `rules/checkpoint-system.md`