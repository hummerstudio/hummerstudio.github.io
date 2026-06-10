---
title: GitHub Actions 实现自动部署——从 push 到上线
author: 唐明
categories: [devops]
tags: [GitHub Actions, 自动部署, CI/CD]
---

## 自动化部署，CI/CD 的最后一步

CI/CD 的完整链路是：代码提交 → 自动构建 → 自动测试 → 自动部署。前三步是 CI，最后一步是 CD。

有了 GitHub Actions，我们可以轻松实现"push 即上线"——代码推到 GitHub，自动构建并部署到服务器。

本文以部署一个静态网站到 Nginx 服务器为例，展示 GitHub Actions 的自动部署流程。

<!--以上为摘要内容-->

## 整体架构

```
开发者 push 代码
    ↓
GitHub Actions 触发 Workflow
    ↓
构建项目（npm build / jekyll build）
    ↓
通过 SSH 上传到服务器
    ↓
重启 Nginx（可选）
    ↓
部署完成
```

## 第一步：准备服务器

在服务器上创建部署目录：

```bash
sudo mkdir -p /var/www/my-site
sudo chown -R $USER:$USER /var/www/my-site
```

配置 Nginx：

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/my-site;
    index index.html;
}
```

## 第二步：配置 GitHub Secrets

需要三个 Secret：

| Secret 名 | 说明 |
|-----------|------|
| `DEPLOY_HOST` | 服务器 IP 或域名 |
| `DEPLOY_USER` | SSH 用户名 |
| `DEPLOY_KEY` | SSH 私钥内容 |

`Settings → Secrets and variables → Actions → New repository secret`

生成 SSH 密钥对（在服务器上）：

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_actions  # 复制内容作为 DEPLOY_KEY
```

## 第三步：编写 Workflow

```yaml
name: Deploy to Server

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install and Build
        run: |
          npm ci
          npm run build

      - name: Deploy via SCP
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_KEY }}
          source: "dist/*"
          target: "/var/www/my-site"
          strip_components: 1
```

这个 Workflow 做了三件事：
1. 检出代码并安装依赖
2. 构建项目
3. 通过 SCP 把构建产物上传到服务器

## 进阶：零停机部署

上面的方案是直接覆盖文件，部署过程中可能有短暂的不一致。更好的做法是零停机部署：

```yaml
- name: Deploy with symlink swap
  uses: appleboy/ssh-action@v1.0.3
  with:
    host: ${{ secrets.DEPLOY_HOST }}
    username: ${{ secrets.DEPLOY_USER }}
    key: ${{ secrets.DEPLOY_KEY }}
    script: |
      DEPLOY_DIR="/var/www/my-site/releases/$(date +%Y%m%d%H%M%S)"
      mkdir -p $DEPLOY_DIR
      # 假设前面步骤已经把产物传到了临时目录
      cp -r /tmp/deploy/* $DEPLOY_DIR/
      ln -sfn $DEPLOY_DIR /var/www/my-site/current
      # 清理旧版本（保留最近3个）
      ls -dt /var/www/my-site/releases/* | tail -n +4 | xargs rm -rf
```

## 更简单的方案：GitHub Pages

如果你的项目是静态网站，最简单的"自动部署"就是直接部署到 GitHub Pages：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write

    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

push 代码，自动构建，自动部署到 `https://你的用户名.github.io/仓库名`——完全免费，零配置服务器。

---

## 后记

CI/CD 工具各有各的战场——Jenkins 胜在灵活和插件生态，Gitlab CI 擅长与代码仓库深度融合的门禁场景，GitHub Actions 则把 CI/CD 和 GitHub 生态绑在一起，让自动化部署的门槛大幅降低。没有谁一定能替代谁，关键看团队的技术栈和实际需求。

自动部署的价值不只是省去了手动上传的麻烦，更重要的是它让部署过程标准化、可追溯、可回滚。每一行代码的变更，都能准确追踪到哪次部署、哪个版本。

这就是 DevOps 的精髓——让机器做机器擅长的事，让人做人擅长的事。

每天前进一小步，就是一个新的高度！
