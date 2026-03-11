# MCP 服务器示例

## 概述

各种平台和用例的完整 MCP 服务器配置示例。

## 已发布的 MCP 服务器

### 官方 MCP 服务器仓库

来源：`github.com/modelcontextprotocol/servers`

```json
{
  "mcpServers": {
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "/path/to/repo"]
    },
    "sqlite": {
      "command": "uvx",
      "args": ["mcp-server-sqlite", "--db-path", "/path/to/database.db"]
    },
    "filesystem": {
      "command": "uvx",
      "args": [
        "mcp-server-filesystem",
        "/allowed/path1",
        "/allowed/path2"
      ]
    },
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"]
    }
  }
}
```

### AWS MCP 服务器

来源：`github.com/awslabs/mcp`

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
    "bedrock": {
      "command": "uvx",
      "args": ["awslabs.bedrock-mcp-server@latest"],
      "env": {
        "AWS_PROFILE": "default"
      }
    },
    "nova-canvas": {
      "command": "uvx",
      "args": ["awslabs.nova-canvas-mcp-server@latest"]
    }
  }
}
```

### VS Code MCP 文档

来源：`code.visualstudio.com/docs/copilot/chat/mcp-servers`

```json
{
  "servers": {
    "fetch": {
      "type": "stdio",
      "command": "uvx",
      "args": ["mcp-server-fetch"]
    }
  }
}
```

### Continue IDE

来源：Continue IDE 文档

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

## 本地 MCP 服务器开发

### 基础本地开发

```json
{
  "mcpServers": {
    "sql-plugins": {
      "type": "stdio",
      "command": "uvx",
      "args": [
        "--from", "d:/mcp/my.python/sqlplugins",
        "mcp_server.py",
        "--env", "d:/mcp/my.python/sqlplugins/hr2.env"
      ]
    }
  }
}
```

### 多配置开发

```json
{
  "mcpServers": {
    "dev-server": {
      "command": "uvx",
      "args": [
        "--from", "${workspaceFolder}",
        "src/server.py",
        "--debug"
      ]
    },
    "test-server": {
      "command": "uvx",
      "args": [
        "--from", "${workspaceFolder}",
        "src/server.py",
        "--config", "test_config.json"
      ]
    },
    "prod-server": {
      "command": "uvx",
      "args": ["my-mcp-server@1.0.0"]
    }
  }
}
```

## 相关文档

- [MCP 集成参考](../references/mcp-integration.md)
- [内联脚本元数据](../references/inline-script-metadata.md)
- [安装和设置](../references/installation-and-setup.md)
