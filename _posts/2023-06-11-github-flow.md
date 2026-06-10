---
title: Git 分支模型（二）：GitHub Flow
author: 唐明
categories: [code]
tags: [Git, GitHub Flow, 分支模型]
---

## 1、为什么需要更轻量的模型

上一篇介绍了 Git Flow，它虽然严谨，但流程繁琐。对于 Web 应用这种需要快速迭代、持续部署的项目来说，Git Flow 的 `develop` → `release` → `main` 流程太重了。

GitHub 作为全球最大的代码托管平台，他们的开发团队也面临这个问题。于是 GitHub Flow 应运而生——这是 GitHub 内部使用的分支模型，极其简洁，只有一条核心原则：

> **`main` 分支上的任何代码都是可部署的。**

## 2、GitHub Flow 的核心规则

GitHub Flow 只有六条规则，非常容易理解和执行：

1. **`main` 分支始终可部署**：`main` 上的代码必须是可以随时部署到生产环境的。
2. **从 `main` 拉出特性分支**：每次开发新功能或修复 bug，都从 `main` 创建一个描述性的分支。
3. **在特性分支上开发并频繁提交**：定期推送分支到远程仓库。
4. **随时发起 Pull Request**：即使功能还没做完，也可以创建 PR 来讨论代码。
5. **通过审查后合并到 `main`**：PR 经过代码审查和 CI 检查后合并。
6. **合并后立即部署**：合并到 `main` 后就应该部署，保持 `main` 始终处于可部署状态。

没有 `develop`、没有 `release`、没有 `hotfix`——只有 `main` 和无数个短命的特性分支。

## 3、工作流程

```
main:    ●────●────●────●────●────●────●
         │    │         │         │
         │    │         │         │
feature/A┘    │         │         │
              │         │         │
       feature/B────────┘         │
                                  │
                           feature/C──────┘
```

每一步具体操作：

```bash
# 1. 从 main 拉出分支
git checkout -b add-search-feature main

# 2. 开发并提交
git add .
git commit -m "Add search feature"

# 3. 推送到远程，创建 Pull Request
git push origin add-search-feature
# 在 GitHub 上创建 PR，等待审查

# 4. 审查通过后合并（在 GitHub 上操作）
# 或者本地合并：
git checkout main
git pull origin main
git merge --no-ff add-search-feature
git push origin main

# 5. 部署后删除分支
git branch -d add-search-feature
git push origin --delete add-search-feature
```

## 4、Pull Request 的作用

GitHub Flow 的核心机制是 Pull Request（PR），它不只是合并代码，更是团队协作的枢纽：

- **代码审查**：其他人可以在 PR 中逐行评论，提出问题或建议。
- **讨论上下文**：PR 的描述和评论完整记录了"为什么这样改"。
- **CI/CD 触发**：PR 的创建和更新会自动触发 CI 检查，合并到 `main` 后触发自动部署。
- **早期反馈**：即使是半成品也可以创建 PR，让团队提前看到设计方向。

一个好的 PR 应该包含：

- 清晰的标题和描述（做了什么、为什么做）
- 相关的 Issue 链接
- 截图或演示（如果涉及 UI 变更）

## 5、部署策略

GitHub Flow 强调持续部署，常用的部署方式：

**自动部署**：合并到 `main` 后，CI 自动构建并部署到生产环境。GitHub Actions、Jenkins 等工具都可以实现。

```yaml
# 示例：GitHub Actions 自动部署
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install && npm run build
      - run: ./deploy.sh
```

**特性分支预览部署**：每个 PR 创建一个独立的预览环境，方便在合并前验证效果。Netlify、Vercel 等平台原生支持这种模式。

## 6、适用场景

GitHub Flow 适合以下场景：

- **Web 应用和 SaaS 产品**：需要快速迭代、持续部署。
- **小到中型团队**：流程简单，沟通成本低。
- **持续部署实践**：团队具备完善的自动化测试和部署流水线。
- **开源项目**：PR 机制天然适合社区贡献。

## 7、与 Git Flow 的对比

| 对比维度 | Git Flow | GitHub Flow |
|---------|----------|-------------|
| 长期分支 | `main` + `develop` | 仅 `main` |
| 短期分支 | `feature`、`release`、`hotfix` | `feature` |
| 发布流程 | release 分支 → 合并 main + develop | 合并 main → 立即部署 |
| 复杂度 | 高 | 低 |
| 适合项目 | 固定发布周期、客户端软件 | Web 应用、持续部署 |
| 核心机制 | 分支类型约定 | Pull Request |

## 8、总结

GitHub Flow 把 Git Flow 的复杂性大幅简化，用 PR 替代了 `develop` 和 `release` 分支的角色。它假设你的团队有能力快速部署，并且 `main` 分支永远不会坏。

但如果你的项目需要维护多个版本（比如同时维护 v1.0 和 v2.0），GitHub Flow 就显得力不从心了。下一篇，我们来看一个折中方案——**GitLab Flow**。

每天前进一小步，就是一个新的高度！
