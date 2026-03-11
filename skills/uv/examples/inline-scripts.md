# 内联脚本元数据 (PEP 723)

## 概述

UV 支持内联脚本元数据，允许你直接在 Python 脚本注释中定义依赖。UV 会在运行脚本时自动安装这些依赖。

## 基本内联依赖

```python
# /// script
# dependencies = [
#   "requests",
#   "pandas",
#   "numpy",
# ]
# ///

import requests
import pandas as pd
import numpy as np

def main():
    response = requests.get("https://api.example.com/data")
    df = pd.DataFrame(response.json())
    print(df.describe())

if __name__ == "__main__":
    main()
```

**使用 UV 运行：**

```bash
# UV automatically installs dependencies and runs the script
uv run script.py

# Or with uvx
uvx script.py
```

## 带有 Python 版本要求

```python
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "fastapi>=0.100.0",
#   "uvicorn[standard]>=0.24.0",
# ]
# ///

from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**使用指定 Python 版本运行：**

```bash
uv run --python 3.11 server.py
```

## 带有内联依赖的 MCP 服务器

```python
# /// script
# dependencies = [
#   "mcp>=0.1.0",
#   "anthropic-sdk>=0.3.0",
# ]
# ///

from mcp.server import Server
from mcp.types import Tool

server = Server("my-mcp-server")

@server.list_tools()
async def list_tools():
    return [
        Tool(name="echo", description="Echo a message", input_schema={})
    ]

if __name__ == "__main__":
    server.run()
```

**VS Code 配置：**

```json
{
  "mcpServers": {
    "my-server": {
      "command": "uv",
      "args": ["run", "/path/to/server.py"]
    }
  }
}
```

## 数据处理脚本

```python
# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "polars>=0.19.0",
#   "matplotlib>=3.8.0",
#   "seaborn>=0.12.0",
# ]
# ///

import polars as pl
import matplotlib.pyplot as plt
import seaborn as sns

def analyze_data(file_path: str):
    # Read data with polars (faster than pandas)
    df = pl.read_csv(file_path)

    # Perform analysis
    summary = df.describe()
    print(summary)

    # Create visualization
    sns.histplot(df.to_pandas()["column_name"])
    plt.savefig("output.png")

if __name__ == "__main__":
    import sys
    analyze_data(sys.argv[1])
```

**使用方法：**

```bash
# UV installs polars, matplotlib, seaborn automatically
uv run analyze.py data.csv
```

## 内联脚本元数据的优势

1. **自包含脚本** - 依赖随脚本一起传递
2. **无需 pyproject.toml** - 完美适用于单文件脚本
3. **自动依赖管理** - UV 处理安装
4. **版本控制友好** - 所有内容在一个文件中
5. **易于分享** - 发送脚本，UV 处理其余工作

## 何时使用内联元数据

**应该使用：**

- 单文件实用脚本
- 转换为脚本的数据分析笔记本
- 快速自动化任务
- 可分享的示例和演示
- 没有完整项目结构的脚本

**不应该使用：**

- 多文件项目（改用 pyproject.toml）
- 有许多依赖的脚本（难以阅读）
- 生产应用程序（使用正规项目结构）
- 需要单独的开发依赖的脚本

## 相关文档

- [内联脚本元数据参考](../references/inline-script-metadata.md)
- [Python 环境管理](../references/python-environment.md)
- [MCP 集成](../references/mcp-integration.md)
