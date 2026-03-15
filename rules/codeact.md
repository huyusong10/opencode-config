## Principle

对于 **复杂流程**，优先编写并执行代码脚本，而非直接调用工具。

## Applicable Scenarios

- 需要多步骤数据处理或转换
- 需要循环、条件分支等复杂逻辑
- 需要状态跟踪或错误恢复
- 操作之间存在依赖关系

## Comparison

### Direct Tool Calls (Inefficient)

```
Task: Analyze all TypeScript files in src/, find unused exports

Wrong approach:
1. Use glob to find all .ts files
2. Read each file individually
3. Manually analyze import/export in context
4. Memorize and compare dependencies
5. Manually summarize results
```

### Codeact Mode (Efficient)

```python
# scripts/find_unused_exports.py
import subprocess
import json
from pathlib import Path

# Use ts-morph or regex to analyze all exports
exports = {}  # { file: { export_name: line } }
imports = set()  # All imported names

# Output JSON report after analysis
print(json.dumps({"unused": unused_exports}, indent=2))
```

Then execute script to get results. Code is reusable, debuggable, and verifiable.