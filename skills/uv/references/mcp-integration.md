# UV MCP 服务器集成参考

## 概述

本参考文档涵盖了使用 UVX 执行模型上下文协议(MCP)服务器的方法,包括已发布包模式、本地开发工作流程以及 IDE 集成策略。

## 核心概念:工作目录与 --from

### 为什么大多数示例不显示工作目录

大多数 MCP 服务器示例使用**已发布的 PyPI 包**,不需要工作目录引用:

```json
{
  "servers": {
    "sqlite": {
      "command": "uvx",
      "args": ["mcp-server-sqlite", "--db-path", "/path/to/database.db"]
    }
  }
}
```

**为什么没有工作目录?**

- `mcp-server-sqlite` 已在 PyPI 上发布
- UVX 自动下载并缓存包
- 创建隔离的临时环境用于执行
- 不需要本地项目文件

**关键洞察**:对于本地开发,`--from` 标志就是工作目录引用。

## 已发布包 vs 本地开发

### 已发布包(无需工作目录)

对 PyPI 上可用的包使用此模式:

```json
{
  "servers": {
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "/path/to/repo"]
    },
    "aws-core": {
      "command": "uvx",
      "args": ["awslabs.core-mcp-server@latest"]
    },
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"]
    },
    "sqlite": {
      "command": "uvx",
      "args": ["mcp-server-sqlite", "--db-path", "/path/to/db.sqlite"]
    }
  }
}
```

**工作原理:**

1. UVX 在 PyPI 上检查包
2. 将包及依赖项下载到隔离缓存
3. 创建临时环境
4. 从缓存运行 - 无需本地文件

**优势:**

- 无需配置工作目录
- 自动依赖管理
- 支持版本固定(`package@version`)
- 跨机器一致性

### 本地开发(使用 --from 标志)

对自己开发的 MCP 服务器使用此模式:

```json
{
  "servers": {
    "my-local-server": {
      "command": "uvx",
      "args": [
        "--from", "/absolute/path/to/project",
        "server_script.py",
        "--arg1", "value1"
      ]
    }
  }
}
```

**工作原理:**

1. UVX 在指定目录中查找 `pyproject.toml`
2. 创建包含项目依赖的隔离环境
3. 在项目上下文中运行本地脚本
4. **`--from` 标志就是工作目录引用**

**优势:**

- 代码更改立即生效(无需重新安装)
- 访问本地项目依赖
- 完整的开发工作流程支持
- 易于调试

## 命令模式

### 已发布包模式

```bash
# 基本执行
uvx mcp-server-sqlite --db-path /path/to/db

# 指定版本
uvx mcp-server-git@1.0.0 --repository /path/to/repo

# 最新版本(自动更新)
uvx awslabs.core-mcp-server@latest

# 带包特定参数
uvx mcp-server-fetch --user-agent "MyApp/1.0"
```

### 本地开发模式

```bash
# 从绝对路径执行
uvx --from /d/mcp/my-server server.py

# 从当前目录执行
uvx --from . main.py

# 带配置文件
uvx --from /project server.py --env config.env

# 带多个参数
uvx --from /project server.py --db /path/to/db --port 8080
```

### 包执行矩阵

| 模式 | 用例 | 示例 |
|---------|----------|---------|
| `uvx package` | 已发布包 | `uvx mcp-server-sqlite` |
| `uvx package@version` | 特定版本 | `uvx mcp-server-git@1.0.0` |
| `uvx package@latest` | 自动更新 | `uvx awslabs.core@latest` |
| `uvx --from path script.py` | 本地开发 | `uvx --from . server.py` |

## IDE 集成

### VS Code 配置

#### 位置选项

**用户设置**(全局):

- Windows: `%APPDATA%\Code\User\globalStorage\ms-vscode.vscode-mcp\settings.json`
- macOS: `~/Library/Application Support/Code/User/globalStorage/ms-vscode.vscode-mcp/settings.json`
- Linux: `~/.config/Code/User/globalStorage/ms-vscode.vscode-mcp/settings.json`

**工作区设置**(项目特定):

```text
.vscode/mcp.json
```

#### 已发布包示例

```json
{
  "mcpServers": {
    "sqlite": {
      "type": "stdio",
      "command": "uvx",
      "args": ["mcp-server-sqlite", "--db-path", "${workspaceFolder}/database.db"]
    },
    "git": {
      "type": "stdio",
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "${workspaceFolder}"]
    },
    "fetch": {
      "type": "stdio",
      "command": "uvx",
      "args": ["mcp-server-fetch"]
    }
  }
}
```

#### 本地开发示例

```json
{
  "mcpServers": {
    "my-server": {
      "type": "stdio",
      "command": "uvx",
      "args": [
        "--from", "${workspaceFolder}",
        "src/server.py",
        "--config", "${workspaceFolder}/config.json"
      ]
    },
    "dev-server": {
      "type": "stdio",
      "command": "uvx",
      "args": [
        "--from", "d:/mcp/projects/my-mcp-server",
        "main.py",
        "--debug"
      ]
    }
  }
}
```

#### 环境变量

```json
{
  "mcpServers": {
    "aws-server": {
      "type": "stdio",
      "command": "uvx",
      "args": ["awslabs.core-mcp-server@latest"],
      "env": {
        "AWS_PROFILE": "default",
        "AWS_REGION": "us-east-1",
        "FASTMCP_LOG_LEVEL": "ERROR"
      }
    },
    "github-server": {
      "type": "stdio",
      "command": "uvx",
      "args": ["mcp-server-github"],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    }
  }
}
```

### Continue IDE 配置

位置: `.continue/config.json`

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "uvx",
          "args": ["mcp-server-sqlite", "--db-path", "/Users/NAME/test.db"]
        }
      },
      {
        "transport": {
          "type": "stdio",
          "command": "uvx",
          "args": ["mcp-server-fetch"]
        }
      }
    ]
  }
}
```

### 其他 IDE 模式

**通用 MCP 客户端配置:**

```json
{
  "servers": {
    "server-name": {
      "command": "uvx",
      "args": ["package-name", "--arg", "value"],
      "env": {
        "VAR": "value"
      }
    }
  }
}
```

## 实际示例

### 官方 MCP 服务器仓库

来源: `modelcontextprotocol/servers`

```json
{
  "mcpServers": {
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "path/to/git/repo"]
    },
    "filesystem": {
      "command": "uvx",
      "args": [
        "mcp-server-filesystem",
        "/allowed/path1",
        "/allowed/path2"
      ]
    }
  }
}
```

### AWS MCP 服务器

来源: `awslabs/mcp`

```json
{
  "mcpServers": {
    "core": {
      "command": "uvx",
      "args": ["awslabs.core-mcp-server@latest"],
      "env": {
        "FASTMCP_LOG_LEVEL": "ERROR"
      }
    },
    "lambda": {
      "command": "uvx",
      "args": ["awslabs.lambda-mcp-server@latest"],
      "env": {
        "AWS_REGION": "us-east-1"
      }
    },
    "nova-canvas": {
      "command": "uvx",
      "args": ["awslabs.nova-canvas-mcp-server@latest"]
    }
  }
}
```

### 数据库服务器

```json
{
  "mcpServers": {
    "sqlite": {
      "command": "uvx",
      "args": ["mcp-server-sqlite", "--db-path", "/path/to/database.sqlite"]
    },
    "postgres": {
      "command": "uvx",
      "args": [
        "mcp-server-postgres",
        "postgresql://user:pass@localhost/dbname"
      ]
    },
    "mysql": {
      "command": "uvx",
      "args": [
        "mcp-server-mysql",
        "--host", "localhost",
        "--database", "mydb"
      ]
    }
  }
}
```

### 云服务集成

```json
{
  "mcpServers": {
    "aws-bedrock": {
      "command": "uvx",
      "args": ["awslabs.bedrock-mcp-server@latest"],
      "env": {
        "AWS_PROFILE": "default"
      }
    },
    "github": {
      "command": "uvx",
      "args": ["mcp-server-github"],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    },
    "slack": {
      "command": "uvx",
      "args": ["mcp-server-slack"],
      "env": {
        "SLACK_TOKEN": "${env:SLACK_TOKEN}"
      }
    }
  }
}
```

## 开发工作流程

### 本地 MCP 服务器开发

**项目结构:**

```text
my-mcp-server/
├── pyproject.toml
├── src/
│   └── my_server/
│       ├── __init__.py
│       ├── server.py
│       └── handlers.py
├── tests/
│   └── test_server.py
├── config.env
└── README.md
```

**pyproject.toml:**

```toml
[project]
name = "my-mcp-server"
version = "0.1.0"
dependencies = [
    "mcp>=0.1.0",
    "fastapi>=0.100.0"
]

[project.scripts]
my-server = "my_server.server:main"
```

**VS Code 配置:**

```json
{
  "mcpServers": {
    "my-server-dev": {
      "command": "uvx",
      "args": [
        "--from", "${workspaceFolder}",
        "src/my_server/server.py",
        "--env", "${workspaceFolder}/config.env"
      ]
    }
  }
}
```

**优势:**

- 代码更改立即生效(无需重新安装)
- 完整的调试器支持
- 访问本地依赖
- 快速迭代周期

### 测试不同版本

```bash
# 测试开发版本
uvx --from . server.py

# 测试已发布版本
uvx my-mcp-server@0.1.0

# 测试最新 PyPI 版本
uvx my-mcp-server@latest

# 比较行为
diff <(uvx --from . server.py --test) <(uvx my-mcp-server@latest --test)
```

### 多服务器开发

```json
{
  "mcpServers": {
    "server-stable": {
      "command": "uvx",
      "args": ["my-mcp-server@1.0.0"]
    },
    "server-dev": {
      "command": "uvx",
      "args": ["--from", "${workspaceFolder}/servers/dev", "server.py"]
    },
    "server-experimental": {
      "command": "uvx",
      "args": ["--from", "${workspaceFolder}/servers/experimental", "server.py"]
    }
  }
}
```

## UVX 用于 MCP 服务器的优势

### 1. 自动依赖管理

- 自动下载所需的包
- 隔离处理版本冲突
- 无全局包污染
- 一致的环境

### 2. 开发友好

- 代码更改立即可用(使用 `--from`)
- 无需重新安装
- 隔离环境防止冲突
- 易于调试

### 3. 跨平台一致性

- 在 Windows、macOS、Linux 上工作方式相同
- 自动处理路径差异
- 跨环境行为一致
- 配置格式相同

### 4. 性能

- 包操作比 pip 快 10-100 倍
- 智能缓存和并行下载
- 优化的依赖解析
- 最小的启动开销

### 5. 版本管理

- 轻松固定版本(`package@version`)
- 自动更新能力(`@latest`)
- 轻松测试多个版本
- 无版本冲突

## 故障排除

### "spawn uvx ENOENT" 错误

**症状:**

- IDE 找不到 uvx 命令
- 服务器无法启动

**解决方案:**

```bash
# 验证 UVX 安装
uvx --version

# 检查 PATH 是否包含 UV 二进制文件
echo $PATH | grep uv  # Linux/Mac
echo %PATH% | findstr uv  # Windows

# 如果缺失则添加到 PATH
export PATH="$HOME/.local/bin:$PATH"  # Linux/Mac

# Windows: 添加到系统 PATH
# %LOCALAPPDATA%\Programs\uv
```

**IDE 特定:**

对于 VS Code:

```json
{
  "mcpServers": {
    "sqlite": {
      "command": "/full/path/to/uvx",
      "args": ["mcp-server-sqlite", "--db-path", "/path/to/db"]
    }
  }
}
```

### 找不到包

**症状:**

- "Package not found on PyPI"
- 404 错误

**解决方案:**

```bash
# 在 PyPI 上验证包名
uvx --help mcp-server-name

# 检查包是否存在
curl https://pypi.org/pypi/mcp-server-name/json

# 对于本地开发,确保 pyproject.toml 存在
ls -la /path/to/project/pyproject.toml

# 验证 --from 路径是否正确
uvx --from /absolute/path/to/project server.py
```

### 权限错误

**症状:**

- 无法写入缓存
- 拒绝访问错误

**解决方案:**

```bash
# 检查 UV 缓存权限
ls -la ~/.cache/uv/  # Linux/Mac
dir %LOCALAPPDATA%\uv\cache  # Windows

# 修复权限
chmod -R u+w ~/.cache/uv/  # Linux/Mac

# 清除并重建缓存
uv cache clean
uvx package-name
```

### 连接/启动失败

**症状:**

- 服务器启动但不响应
- IDE 中出现超时错误

**解决方案:**

```bash
# 手动测试服务器
uvx mcp-server-sqlite --db-path test.db

# 检查服务器日志(如果可用)
uvx package-name --verbose

# 验证参数是否正确
# 检查路径、标志中的拼写错误

# 使用最小配置测试
{
  "command": "uvx",
  "args": ["package-name"]  # 无额外参数
}
```

### 环境变量问题

**症状:**

- 服务器无法访问凭据
- 配置未加载

**解决方案:**

```json
{
  "mcpServers": {
    "server": {
      "command": "uvx",
      "args": ["package-name"],
      "env": {
        "API_KEY": "actual-value-not-reference",
        "LOG_LEVEL": "DEBUG"
      }
    }
  }
}

# 或使用 IDE 变量替换
{
  "env": {
    "API_KEY": "${env:MY_API_KEY}"  # 引用系统环境变量
  }
}
```

### 调试命令

```bash
# 验证 UVX 工作
uvx --version

# 测试包可用性
uvx --help mcp-server-name

# 检查本地项目
ls -la /path/to/project/pyproject.toml
cat /path/to/project/pyproject.toml

# 清除缓存
uv cache clean

# 带详细输出测试
uvx --verbose package-name

# 检查 UV 配置
uv --version
```

## 性能考虑

### 已发布包

**首次运行:**

- 从 PyPI 下载包
- 安装依赖
- 创建缓存环境
- 典型时间:5-15 秒

**后续运行:**

- 使用缓存环境
- 无需下载
- 典型启动:<1 秒

**使用 @latest:**

- 每次运行检查更新
- 如有新版本则下载
- 生产环境中谨慎使用

### 本地开发

**启动性能:**

- 比已发布包更快(无需下载)
- 从本地 pyproject.toml 创建环境
- 典型启动:首次运行 1-3 秒
- 缓存运行:<1 秒

**代码更改:**

- 立即生效(无需缓存失效)
- 无需重新安装
- 完美适合开发迭代

## 最佳实践

### 1. 生产环境使用已发布包

```json
{
  "production-server": {
    "command": "uvx",
    "args": ["mcp-server-name"]  // 为了稳定性不使用 @latest
  }
}
```

**原因:**

- 稳定、经过测试的版本
- 可预测的行为
- 无意外更改

### 2. 开发环境使用 --from

```json
{
  "dev-server": {
    "command": "uvx",
    "args": ["--from", "/absolute/path", "server.py"]
  }
}
```

**原因:**

- 代码更改立即生效
- 易于调试
- 快速迭代

### 3. 固定版本以确保可靠性

```json
{
  "stable-server": {
    "command": "uvx",
    "args": ["awslabs.core-mcp-server@1.2.3"]  // 特定版本
  }
}
```

**原因:**

- 行为一致
- 无破坏性更改
- 更容易排除故障

### 4. 使用环境变量进行配置

```json
{
  "configurable-server": {
    "command": "uvx",
    "args": ["server-name"],
    "env": {
      "CONFIG_PATH": "/path/to/config",
      "LOG_LEVEL": "INFO",
      "API_KEY": "${env:API_KEY}"
    }
  }
}
```

**原因:**

- 安全的凭据管理
- 轻松更改配置
- 无硬编码的机密

### 5. 使用绝对路径

```json
{
  "my-server": {
    "command": "uvx",
    "args": [
      "--from", "/d/mcp/projects/server",  // 绝对路径
      "server.py",
      "--db", "/d/data/database.db"  // 绝对路径
    ]
  }
}
```

**原因:**

- 无路径解析问题
- 从任何工作目录都能工作
- 跨机器一致

## 从其他工具迁移

### 从 uv run 迁移

```bash
# 旧方式
uv run python server.py

# 新方式
uvx --from . server.py
```

### 从 pip + python 迁移

```bash
# 旧方式
pip install package && python -m package

# 新方式
uvx package
```

### 从 uv tool install 迁移

```bash
# 旧方式(不推荐用于 MCP 服务器)
uv tool install mcp-server-sqlite
mcp-server-sqlite --db-path /path/to/db

# 新方式(推荐)
uvx mcp-server-sqlite --db-path /path/to/db
```

## 总结

UVX 提供了运行 MCP 服务器的最佳方式:

- **已发布包**无需工作目录配置即可工作
- **本地开发**使用 `--from` 获取项目上下文
- **隔离环境**防止依赖冲突
- **自动依赖管理**简化部署
- **跨平台一致性**确保可靠运行
- **快速性能**配合智能缓存

大多数 GitHub 示例中缺少工作目录引用是**有意为之**的 - UVX 为已发布包自动处理包解析和环境创建,仅在本地开发场景中需要显式路径(`--from`)。
