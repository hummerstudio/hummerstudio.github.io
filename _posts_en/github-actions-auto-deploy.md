---
title: Automated Deployment with GitHub Actions — from push to live
date: 2023-03-11
author: Tang Moying
categories: [devops]
tags: [GitHub Actions, Automated Deployment, CI/CD]
lang: en
alt_url: /post/github-actions-auto-deploy
---

## Automated Deployment, the Last Step of CI/CD

The complete CI/CD chain is: commit code → automatic build → automatic test → automatic deployment. The first three steps are CI; the last step is CD.

With GitHub Actions, we can easily achieve "push equals live" — push your code to GitHub and it is built and deployed to the server automatically.

This article uses deploying a static site to an Nginx server as an example to show GitHub Actions' automatic deployment flow.

<!--以上为摘要内容-->

## The Overall Architecture

```
Developer pushes code
    ↓
GitHub Actions triggers the Workflow
    ↓
Build the project (npm build / jekyll build)
    ↓
Upload to the server over SSH
    ↓
Restart Nginx (optional)
    ↓
Deployment complete
```

## Step 1: Prepare the Server

Create the deployment directory on the server:

```bash
sudo mkdir -p /var/www/my-site
sudo chown -R $USER:$USER /var/www/my-site
```

Configure Nginx:

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/my-site;
    index index.html;
}
```

## Step 2: Configure GitHub Secrets

You need three Secrets:

| Secret name | Description |
|-----------|------|
| `DEPLOY_HOST` | Server IP or domain name |
| `DEPLOY_USER` | SSH username |
| `DEPLOY_KEY` | Contents of the SSH private key |

`Settings → Secrets and variables → Actions → New repository secret`

Generate an SSH key pair (on the server):

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_actions  # copy the contents as DEPLOY_KEY
```

## Step 3: Write the Workflow

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

This Workflow does three things:
1. Check out the code and install dependencies
2. Build the project
3. Upload the build artifacts to the server over SCP

## Advanced: Zero-Downtime Deployment

The scheme above overwrites files directly, so there may be a brief inconsistency during deployment. A better approach is zero-downtime deployment:

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
      # assume the earlier steps have already uploaded the artifacts to a temp directory
      cp -r /tmp/deploy/* $DEPLOY_DIR/
      ln -sfn $DEPLOY_DIR /var/www/my-site/current
      # clean up old versions (keep the most recent 3)
      ls -dt /var/www/my-site/releases/* | tail -n +4 | xargs rm -rf
```

## A Simpler Option: GitHub Pages

If your project is a static site, the simplest "automatic deployment" is to deploy straight to GitHub Pages:

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

Push your code, it builds automatically, and it deploys automatically to `https://你的用户名.github.io/仓库名` — completely free, zero server configuration.

---

## Afterword

CI/CD tools each have their own battlefield — Jenkins wins on flexibility and its plugin ecosystem, Gitlab CI excels at gatekeeping scenarios deeply integrated with the code repository, and GitHub Actions ties CI/CD together with the GitHub ecosystem, greatly lowering the barrier to automated deployment. None of them is guaranteed to replace another; the key is your team's tech stack and actual needs.

The value of automatic deployment isn't only that it saves you the trouble of manual uploads; more importantly, it makes the deployment process standardized, traceable and rollback-capable. Every change to a line of code can be traced precisely to which deployment and which version.

That is the essence of DevOps — let machines do what machines are good at, and people do what people are good at.

A small step forward every day is a new height!
