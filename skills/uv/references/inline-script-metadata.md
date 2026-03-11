# UV 内联脚本元数据参考 (PEP 723)

## 概述

UV 支持 PEP 723 内联脚本元数据，允许你直接在 Python 脚本注释中定义依赖项。这消除了为单文件脚本使用单独的 `pyproject.toml` 文件的需求，使得 Python 脚本可以自包含、可共享。

## 什么是内联脚本元数据？

内联脚本元数据是一种标准化方式 (PEP 723)，用于将依赖信息直接嵌入到 Python 脚本注释中。UV 会读取这些元数据块，并在运行脚本时自动管理依赖项。

### 基本语法

```python
# /// script
# dependencies = [
#   "package-name",
#   "another-package>=1.0.0",
# ]
# requires-python = ">=3.10"
# ///

# Your Python code here
```

**关键元素：**

- `# /// script` - 开始标记（必须精确匹配）
- `# dependencies = [...]` - 包依赖项列表
- `# requires-python = "..."` - 可选的 Python 版本约束
- `# ///` - 结束标记（必须精确匹配）

**重要：** 标记 `# /// script` 和 `# ///` 必须独占一行，且空格必须精确匹配。

## 基本示例

### 带依赖项的简单脚本

```python
# /// script
# dependencies = [
#   "requests",
#   "beautifulsoup4",
# ]
# ///

import requests
from bs4 import BeautifulSoup

def scrape_website(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    return soup.title.string

if __name__ == "__main__":
    title = scrape_website("https://example.com")
    print(f"Page title: {title}")
```

**使用 UV 运行：**

```bash
# UV automatically installs requests and beautifulsoup4
uv run scraper.py
```

### 指定特定版本

```python
# /// script
# dependencies = [
#   "requests>=2.28.0,<3.0.0",
#   "pandas==2.1.0",
#   "numpy>=1.24.0",
# ]
# requires-python = ">=3.10"
# ///

import pandas as pd
import numpy as np
import requests

def fetch_and_analyze(api_url):
    response = requests.get(api_url)
    data = response.json()
    df = pd.DataFrame(data)
    return df.describe()

if __name__ == "__main__":
    stats = fetch_and_analyze("https://api.example.com/data")
    print(stats)
```

**使用 UV 运行：**

```bash
# UV ensures Python 3.10+ and specific package versions
uv run analysis.py
```

## 数据处理示例

### Polars 数据分析

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
import sys

def analyze_csv(file_path: str):
    # Read data with polars (faster than pandas)
    df = pl.read_csv(file_path)

    # Print summary statistics
    print(df.describe())

    # Create visualization
    plt.figure(figsize=(10, 6))
    data_pandas = df.to_pandas()
    sns.histplot(data=data_pandas, x="column_name", bins=30)
    plt.title("Data Distribution")
    plt.savefig("distribution.png")
    print("Saved visualization to distribution.png")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analyze.py <file.csv>")
        sys.exit(1)
    analyze_csv(sys.argv[1])
```

**用法：**

```bash
uv run analyze.py data.csv
```

### Excel 处理

```python
# /// script
# dependencies = [
#   "openpyxl>=3.1.0",
#   "pandas>=2.0.0",
# ]
# ///

import pandas as pd
import sys

def process_excel(input_file: str, output_file: str):
    # Read Excel file
    df = pd.read_excel(input_file)

    # Perform transformations
    df['total'] = df['quantity'] * df['price']
    summary = df.groupby('category')['total'].sum()

    # Write to new Excel file
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Data', index=False)
        summary.to_excel(writer, sheet_name='Summary')

    print(f"Processed data saved to {output_file}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python process.py input.xlsx output.xlsx")
        sys.exit(1)
    process_excel(sys.argv[1], sys.argv[2])
```

**用法：**

```bash
uv run process.py input.xlsx output.xlsx
```

## Web 应用示例

### FastAPI 服务器

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

app = FastAPI(title="Simple API")

@app.get("/")
def read_root():
    return {"message": "Hello World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "query": q}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**运行服务器：**

```bash
uv run server.py
# Visit http://localhost:8000
```

### Flask 应用

```python
# /// script
# dependencies = [
#   "flask>=3.0.0",
#   "flask-cors>=4.0.0",
# ]
# ///

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({"message": "Welcome to Flask API"})

@app.route('/data', methods=['GET', 'POST'])
def handle_data():
    if request.method == 'POST':
        data = request.json
        return jsonify({"received": data}), 201
    else:
        return jsonify({"data": ["item1", "item2", "item3"]})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

**运行服务器：**

```bash
uv run app.py
```

## MCP 服务器示例

### 基础 MCP 服务器

```python
# /// script
# dependencies = [
#   "mcp>=0.1.0",
# ]
# ///

from mcp.server import Server
from mcp.types import Tool, TextContent

server = Server("example-server")

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="greet",
            description="Greet someone by name",
            input_schema={
                "type": "object",
                "properties": {
                    "name": {"type": "string"}
                },
                "required": ["name"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "greet":
        person_name = arguments.get("name", "World")
        return [TextContent(
            type="text",
            text=f"Hello, {person_name}!"
        )]

if __name__ == "__main__":
    import asyncio
    asyncio.run(server.run())
```

**VS Code 配置：**

```json
{
  "mcpServers": {
    "example": {
      "command": "uv",
      "args": ["run", "/path/to/mcp_server.py"]
    }
  }
}
```

### 带数据库的 MCP 服务器

```python
# /// script
# dependencies = [
#   "mcp>=0.1.0",
#   "aiosqlite>=0.19.0",
# ]
# ///

from mcp.server import Server
from mcp.types import Tool, TextContent
import aiosqlite
import os

server = Server("database-server")
DB_PATH = os.getenv("DB_PATH", "data.db")

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="query_db",
            description="Execute SQL query",
            input_schema={
                "type": "object",
                "properties": {
                    "query": {"type": "string"}
                },
                "required": ["query"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "query_db":
        query = arguments.get("query")
        async with aiosqlite.connect(DB_PATH) as db:
            cursor = await db.execute(query)
            results = await cursor.fetchall()
            return [TextContent(
                type="text",
                text=str(results)
            )]

if __name__ == "__main__":
    import asyncio
    asyncio.run(server.run())
```

**带环境变量的 VS Code 配置：**

```json
{
  "mcpServers": {
    "database": {
      "command": "uv",
      "args": ["run", "/path/to/db_server.py"],
      "env": {
        "DB_PATH": "/path/to/database.db"
      }
    }
  }
}
```

## 自动化和 CLI 工具

### 文件处理器

```python
# /// script
# dependencies = [
#   "typer>=0.9.0",
#   "rich>=13.0.0",
# ]
# ///

import typer
from rich.console import Console
from pathlib import Path

app = typer.Typer()
console = Console()

@app.command()
def process(
    input_dir: Path = typer.Argument(..., help="Input directory"),
    output_dir: Path = typer.Argument(..., help="Output directory"),
    pattern: str = typer.Option("*.txt", help="File pattern to match")
):
    """Process files matching pattern from input to output directory."""
    files = list(input_dir.glob(pattern))

    with console.status(f"Processing {len(files)} files..."):
        for file in files:
            # Your processing logic here
            output_path = output_dir / file.name
            output_path.write_text(file.read_text().upper())

    console.print(f"[green]✓[/green] Processed {len(files)} files")

if __name__ == "__main__":
    app()
```

**用法：**

```bash
uv run processor.py input/ output/ --pattern "*.txt"
```

### AWS 资源列表器

```python
# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "boto3>=1.28.0",
#   "rich>=13.0.0",
# ]
# ///

import boto3
from rich.console import Console
from rich.table import Table

def list_s3_buckets():
    s3 = boto3.client('s3')
    response = s3.list_buckets()

    console = Console()
    table = Table(title="S3 Buckets")
    table.add_column("Name", style="cyan")
    table.add_column("Creation Date", style="magenta")

    for bucket in response['Buckets']:
        table.add_row(
            bucket['Name'],
            bucket['CreationDate'].strftime('%Y-%m-%d %H:%M:%S')
        )

    console.print(table)

if __name__ == "__main__":
    list_s3_buckets()
```

**用法：**

```bash
# Assumes AWS credentials are configured
uv run list_buckets.py
```

## 运行内联脚本

### 基本执行

```bash
# UV installs dependencies and runs the script
uv run script.py

# With arguments
uv run script.py arg1 arg2 --flag

# With specific Python version
uv run --python 3.11 script.py
```

### 使用 uvx

```bash
# Run from any location
uvx /path/to/script.py

# With arguments
uvx script.py --input data.csv --output results.csv
```

### 在 IDE 配置中使用

**VS Code tasks.json：**

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Run Script with UV",
      "type": "shell",
      "command": "uv",
      "args": ["run", "${file}"],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    }
  ]
}
```

**VS Code launch.json：**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "UV Run",
      "type": "python",
      "request": "launch",
      "module": "uv",
      "args": ["run", "${file}"]
    }
  ]
}
```

## 最佳实践

### 何时使用内联脚本元数据

**适用于：**

- 单文件工具脚本
- 快速自动化任务
- 数据分析脚本
- 可共享的示例和演示
- 无需复杂项目结构的脚本
- 可放入单文件的 CLI 工具
- 学习和实验

**不适用于：**

- 多文件项目（改用 `pyproject.toml`）
- 依赖项较多的应用（>10-15 个包）
- 需要分离开发/测试依赖的项目
- 复杂部署的生产应用
- 需要包 extras 或复杂配置的脚本

### 依赖项管理

**优先使用特定版本以确保可复现性：**

```python
# Good - reproducible
# dependencies = [
#   "requests==2.31.0",
#   "pandas==2.1.0",
# ]
```

**使用版本范围以获得灵活性：**

```python
# Good for utilities - allows newer compatible versions
# dependencies = [
#   "requests>=2.28.0,<3.0.0",
#   "pandas>=2.0.0",
# ]
```

**避免在生产环境中使用未固定版本：**

```python
# Risky - behavior can change unexpectedly
# dependencies = [
#   "requests",
#   "pandas",
# ]
```

### Python 版本约束

```python
# Require minimum Python version
# requires-python = ">=3.10"

# Require specific version range
# requires-python = ">=3.10,<3.13"

# Require exact version (rarely needed)
# requires-python = "==3.11"
```

### 组织依赖项

**按字母顺序排列以提高可读性：**

```python
# /// script
# dependencies = [
#   "aiohttp>=3.9.0",
#   "beautifulsoup4>=4.12.0",
#   "pandas>=2.0.0",
#   "requests>=2.28.0",
# ]
# ///
```

**按用途分组并添加注释：**

```python
# /// script
# dependencies = [
#   # Web scraping
#   "requests>=2.28.0",
#   "beautifulsoup4>=4.12.0",
#   # Data processing
#   "pandas>=2.0.0",
#   "numpy>=1.24.0",
#   # Visualization
#   "matplotlib>=3.8.0",
#   "seaborn>=0.12.0",
# ]
# ///
```

## 性能考虑

### 首次运行

- UV 下载并安装所有依赖项
- 创建隔离环境
- 缓存包以供将来使用
- 典型时间：5-30 秒，取决于依赖项

### 后续运行

- UV 使用缓存的包
- 如果依赖项未更改，则重用环境
- 典型启动时间：<1 秒

### 缓存管理

```bash
# Check UV cache size
du -sh ~/.cache/uv/  # Linux/Mac
dir /s %LOCALAPPDATA%\uv\cache  # Windows

# Clean UV cache
uv cache clean
```

## 故障排除

### 无效的元数据格式

**错误：**

```text
Failed to parse inline script metadata
```

**解决方案：**
确保语法精确：

```python
# /// script    <- Must be exactly "# /// script"
# dependencies = [
#   "package",  <- Proper TOML array format
# ]
# ///           <- Must be exactly "# ///"
```

### 找不到依赖项

**错误：**

```text
Package 'package-name' not found on PyPI
```

**解决方案：**

- 在 PyPI 上验证包名
- 检查包名是否有拼写错误
- 确保包在 PyPI 上可用

### 版本冲突

**错误：**

```text
Unable to resolve dependencies
```

**解决方案：**

- 检查版本约束是否兼容
- 如果过于严格，放宽版本要求
- 移除版本约束以查找兼容版本

### Python 版本不匹配

**错误：**

```text
Requires Python >=3.11 but found 3.10
```

**解决方案：**

```bash
# Install required Python version
uv python install 3.11

# Run with specific version
uv run --python 3.11 script.py
```

## 与其他方法的比较

### 与 pyproject.toml 比较

**内联脚本元数据：**

- ✅ 单文件 - 易于共享
- ✅ 无需项目结构
- ✅ 完美适用于工具脚本
- ❌ 仅限于单文件
- ❌ 无法分离开发依赖

**pyproject.toml：**

- ✅ 支持多文件项目
- ✅ 可分离开发依赖
- ✅ 更多配置选项
- ❌ 需要项目结构
- ❌ 需要共享多个文件

### 与 requirements.txt 比较

**内联脚本元数据：**

- ✅ 依赖项与代码在同一文件中
- ✅ UV 自动管理一切
- ✅ 版本控制友好
- ✅ 自文档化

**requirements.txt：**

- ✅ 与代码分离
- ✅ 大多数 Python 开发者熟悉
- ❌ 需要手动管理
- ❌ 需要维护两个文件

### 与 Docker 比较

**内联脚本元数据：**

- ✅ 无需 Docker
- ✅ 更快的启动
- ✅ 原生 Python 执行
- ✅ 对用户更简单

**Docker：**

- ✅ 完整的环境隔离
- ✅ 包含系统依赖
- ✅ 保证跨平台
- ❌ 更重
- ❌ 启动更慢

## 总结

内联脚本元数据 (PEP 723) 非常适合：

- **单文件脚本** - 需要依赖项
- **快速工具** 和自动化任务
- **可共享示例** - "开箱即用"
- **学习和实验**
- **CLI 工具** - 可放入单文件

使用 `uv run script.py`，UV 会处理其余一切 - 无需虚拟环境、无需 pip install、无需项目设置。只需编写脚本并运行。

对于多文件项目或复杂应用，请使用传统的 `pyproject.toml`。
