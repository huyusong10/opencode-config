# 完整工作流示例

## 概述

使用 UV 设置新 Python 项目的端到端示例。

## 设置新的 Python 项目

```bash
# 1. Create project directory
mkdir my-awesome-project
cd my-awesome-project

# 2. Initialize git
git init

# 3. Create .gitignore
cat > .gitignore << EOF
.venv/
__pycache__/
*.pyc
.pytest_cache/
.coverage
EOF

# 4. Create virtual environment
python -m venv .venv

# 5. Activate virtual environment
. .venv/Scripts/activate  # Windows Git Bash
# source .venv/bin/activate  # Linux/Mac

# 6. Install project dependencies
uv pip install requests fastapi uvicorn

# 7. Freeze dependencies
uv pip freeze > requirements.txt

# 8. Install development tools (globally with UV tool)
uv tool install black
uv tool install flake8
uv tool install mypy
uv tool install pytest

# 9. Create project structure
mkdir src tests
touch src/__init__.py
touch tests/__init__.py

# 10. Create main application
cat > src/main.py << EOF
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}
EOF

# 11. Create test
cat > tests/test_main.py << EOF
from src.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}
EOF

# 12. Format code
black .

# 13. Lint code
flake8 src/ tests/

# 14. Run tests
pytest tests/

# 15. Create README
cat > README.md << EOF
# My Awesome Project

## Setup

\`\`\`bash
python -m venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
\`\`\`

## Run

\`\`\`bash
uvicorn src.main:app --reload
\`\`\`

## Test

\`\`\`bash
pytest tests/
\`\`\`
EOF

# 16. Commit
git add .
git commit -m "Initial project setup"

echo "Project setup complete!"
```

## 此工作流演示的内容

- 从零开始完成项目初始化
- Git 仓库设置及正确的 .gitignore
- 虚拟环境创建和激活
- 使用 UV 进行依赖管理
- 开发工具安装
- 项目结构创建
- 应用程序和测试代码创建
- 代码格式化和检查
- 测试执行
- 文档创建
- 初始 git 提交

## 相关文档

- [安装与设置参考](../references/installation-and-setup.md)
- [工具管理](../references/tool-management.md)
- [Python 环境管理](../references/python-environment.md)
- [虚拟环境工作流](virtual-environments.md)
- [开发工作流](development-workflows.md)
