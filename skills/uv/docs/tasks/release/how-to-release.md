# 如何发布你的技能

本指南介绍如何使用 GitHub Actions 创建新版本。

## 前提条件

- 仓库已推送到 GitHub
- GitHub Actions 工作流已配置 (`.github/workflows/release-skill.yml`)
- `gh` CLI 已安装并认证
- Git 已配置正确的凭证

## 发布流程

### 步骤 1: 更新版本号

使用新的发布版本更新 VERSION 文件：

```bash
# 进入仓库目录
cd /path/to/your-skill-name

# 更新版本（示例：1.0.0）
echo "1.0.0" > VERSION

# 验证版本
cat VERSION
```

### 步骤 2: 提交版本更改

```bash
# 暂存版本文件
git add VERSION

# 使用清晰的消息提交
git commit -m "Release v1.0.0"

# 推送到 GitHub
git push origin main
```

### 步骤 3: 创建 GitHub 发布

**使用 gh CLI（推荐）：**

```bash
# 创建发布并自动生成说明
gh release create v1.0.0 \
  --title "v1.0.0" \
  --generate-notes

# 或使用自定义说明
gh release create v1.0.0 \
  --title "Your Skill v1.0.0" \
  --notes "First stable release.

## Features
- Feature 1
- Feature 2
- Feature 3

## Installation
Download {skill-name}-skill.zip from assets and extract to your Claude Code skills directory."
```

**使用 GitHub Web 界面：**

1. 进入你的仓库发布页面
2. 点击"起草新发布"
3. 点击"选择标签" → 输入 `v1.0.0` → "在发布时创建新标签：v1.0.0"
4. 将"发布标题"设置为 `v1.0.0`
5. 点击"生成发布说明"或编写自定义说明
6. 点击"发布"

### 步骤 4: 监控 GitHub Actions

GitHub Actions 将自动：

1. 检出发布标签处的代码
2. 从 VERSION 文件提取版本
3. 验证技能结构（SKILL.md 及前置元数据）
4. 构建分发文件（创建 {skill-name}-skill.zip）
5. 验证归档结构
6. 上传构件（90 天保留期）
7. 附加到发布

**监控工作流：**

```bash
# 观察工作流状态
gh run watch

# 或在浏览器中查看
gh run view --web
```

### 步骤 5: 验证发布

```bash
# 在浏览器中打开发布页面
gh release view v1.0.0 --web

# 查看发布详情
gh release view v1.0.0
```

**验证资源：**

1. 检查发布页面是否附加了 `{skill-name}-skill.zip`
2. 下载并测试：

```bash
# 下载发布资源
gh release download v1.0.0

# 测试解压
mkdir -p test-install
unzip {skill-name}-skill.zip -d test-install

# 验证结构
ls -la test-install/{skill-name}/
```

## 版本号规范

遵循[语义化版本](https://semver.org/)：

- **主版本.次版本.补丁版本**（例如：1.0.0）
  - **主版本**：破坏性更改
  - **次版本**：新功能（向后兼容）
  - **补丁版本**：Bug 修复（向后兼容）

**示例：**

- `0.0.1` - 初始开发
- `0.1.0` - 首个完整功能
- `1.0.0` - 首个稳定版本
- `1.1.0` - 新增功能
- `1.1.1` - Bug 修复
- `2.0.0` - 破坏性更改

## 故障排除

### 工作流失败

```bash
# 检查日志
gh run list --workflow=release-skill.yml
gh run view <failed-run-id> --log
```

**常见问题：**

- 找不到 VERSION 文件 → 确保 VERSION 存在于根目录
- SKILL.md 验证失败 → 检查 YAML 前置元数据
- 归档验证失败 → 验证必需文件是否存在

### 重新运行失败的发布

```bash
# 删除并重新创建发布
gh release delete v1.0.0 --yes
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
# 然后重新创建发布（步骤 3）
```

## 发布检查清单

- [ ] 更新 VERSION 文件
- [ ] 如需要，更新 README.md
- [ ] 本地测试
- [ ] 提交所有更改
- [ ] 推送到 GitHub
- [ ] 创建发布标签
- [ ] 监控 GitHub Actions
- [ ] 验证发布资源
- [ ] 从发布 ZIP 测试安装

## 其他资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [GitHub CLI 参考](https://cli.github.com/manual/)
- [语义化版本](https://semver.org/)
