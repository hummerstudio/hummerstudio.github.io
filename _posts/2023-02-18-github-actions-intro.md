---
title: GitHub Actions——GitHub 原生的自动化工作流
author: 唐明
categories: [devops]
tags: [GitHub Actions, CI/CD, DevOps]
---
* TOC
{:toc}

## GitHub Actions，Actions 即工作流

GitHub Actions 是 GitHub 在 2019 年推出的 CI/CD 和自动化平台。它和 Gitlab CI 一样属于"代码仓库原生 CI"流派——不需要额外搭建 CI 服务器，在仓库里放一个 YAML 文件就能跑。

对于已经在 GitHub 上托管代码的开发者来说，GitHub Actions 就是最自然的 CI/CD 选择。

<!--以上为摘要内容-->

## 核心概念

### Workflow（工作流）

一个 Workflow 就是一个自动化流程，定义在 `.github/workflows/` 目录下的 YAML 文件中。一个仓库可以有多个 Workflow。

### Event（触发事件）

Workflow 由事件触发运行，比如：

- `push`：代码推送
- `pull_request`：PR 创建/更新
- `schedule`：定时触发（cron 表达式）
- `workflow_dispatch`：手动触发

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1'  # 每周一零点
```

### Job（作业）

一个 Workflow 包含多个 Job，Job 默认并行运行，也可以设置依赖顺序。每个 Job 运行在独立的虚拟环境中。

### Runner（运行器）

Runner 是执行 Job 的机器。GitHub 提供托管的 Runner（Ubuntu、Windows、macOS），也可以自托管。

### Action（动作）

Action 是可复用的最小单元，类似于函数。你可以使用社区共享的 Action，也可以自定义。

## 一个典型的 Workflow

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
```

短短 20 行，就完成了一个完整的 CI 流程：检出代码 → 安装 Node.js → 安装依赖 → 运行测试。

## GitHub Actions 对比 Gitlab CI

| 维度 | GitHub Actions | Gitlab CI |
|------|---------------|-----------|
| 配置位置 | `.github/workflows/*.yml` | `.gitlab-ci.yml` |
| 触发事件 | 极其丰富（issues、discussions 等） | 主要围绕代码事件 |
| Marketplace | Action 市场，组件化复用 | 无内置市场，靠 Docker 镜像 |
| 免费额度 | 公开仓库无限，私有仓库 2000 分钟/月 | 400 分钟/月（Gitlab.com） |
| Matrix 构建 | 原生支持，语法简洁 | 通过 `parallel:matrix` 支持 |
| 操作系统 | Ubuntu、Windows、macOS | 取决于 Runner 配置 |
| 生态绑定 | 深度绑定 GitHub 生态 | 深度绑定 Gitlab 生态 |

## GitHub Actions 的独特优势

### 一、Marketplace——丰富的 Action 生态

Actions Marketplace 上有上万个现成的 Action，从部署到 AWS、发送 Slack 通知、代码质量检查，应有尽有。这让搭建流水线变成了"搭积木"。

### 二、Matrix 策略

一行配置就能在多平台、多版本上并行测试：

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node-version: [18, 20, 22]
```

这会生成 3 × 3 = 9 个并行 Job，覆盖所有操作系统和 Node.js 版本的组合。

### 三、超越 CI/CD 的自动化

GitHub Actions 不仅仅是 CI/CD——它可以是任何自动化：

- 自动给 Issue 打标签
- PR 合并后自动发布 Release
- 定时抓取数据更新仓库
- 欢迎新 Contributors

---

## 后记

GitHub Actions 的出现，让 CI/CD 多了一种选择。它不是要替代谁，而是给 GitHub 用户提供了一个更"原生"的选项——不需要额外搭建 CI 服务器，代码托管在哪里，CI 就在哪里。

它是 GitHub 生态的"最后一块拼图"——代码托管 + Issue 跟踪 + PR 审查 + Actions 自动化，形成了一个完整的开发协作闭环。至于选 GitHub Actions 还是 Jenkins 还是 Gitlab CI，没有标准答案，你的代码在哪、团队熟悉什么，就用什么。

每天前进一小步，就是一个新的高度！
