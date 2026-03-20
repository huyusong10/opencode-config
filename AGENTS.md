## 联网搜索
优先采用**MCP 服务**进行联网搜索，再考虑使用Webfetch等其他工具

## Language & Encoding

- 使用 **中文** 回复和编写文档
- 代码注释使用 **英文** 编写

## Indentation

- **新项目**：使用 4 个空格缩进
- **现有项目**：检测并遵循现有风格
  - 风格配置文件（`.editorconfig`、`pyproject.toml`、`.stylua.json`、`.clang-format` 等）
  - 现有代码缩进模式

---

## ASCII Diagrams

ASCII 框图内的内容必须使用 **英文**，禁止中文。

原因：
1. 中文字符在 GitHub 等宽字体中宽度不一致，导致框图对齐错位。
2. 多层嵌套模型修改时更易错位，需整体精确补齐空格。

修复建议：将内容翻译为纯英文，或运行 `scripts/align_ascii.py` 对齐嵌套的框图结构。

详细规范：`rules/ascii-diagrams.md`

---

## Codeact Mode

对于 **复杂流程**，优先编写并执行代码脚本，而非直接调用工具。

适用场景：
- 需要多步骤数据处理或转换
- 需要循环、条件分支等复杂逻辑
- 需要状态跟踪或错误恢复

详细指南：`rules/codeact.md`

---

## Opencode功能拓展

一定要参考官方文档：`https://opencode.ai/docs/zh-cn/sdk/`
若需要SDK，使用以下命令安装：`npm install @opencode-ai/sdk`