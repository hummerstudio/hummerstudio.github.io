---
title: Gitlab CI——Gitlab 自带的 CI/CD 利器
author: 唐明
categories: [ci-cd]
tags: [Gitlab CI, CI/CD, DevOps]
---
* TOC
{:toc}

## Gitlab CI，生于Gitlab，用于Gitlab

Gitlab CI 是 Gitlab 内置的持续集成/持续交付系统。你不需要额外搭建一个 CI 服务器，只需要在你的 Gitlab 仓库根目录下放一个 `.gitlab-ci.yml` 文件，配置好 Runner，流水线就能跑起来了。

沃兹基硕德说过："给我一个 Jenkins，我就能自动化一切。"但 Gitlab 说："不用给我 Jenkins，我自己就能自动化一切。"

<!--以上为摘要内容-->

## Gitlab CI 的三大核心组件

### 一、Pipeline（流水线）

Pipeline 是 Gitlab CI 的顶层概念，一个 Pipeline 由多个 Stage 组成，每个 Stage 包含多个 Job。

```yaml
stages:
  - build
  - test
  - deploy
```

### 二、Runner（运行器）

Runner 是真正干活的东西——执行 Job 的代理进程。Gitlab 提供 Shared Runner（共享运行器），你也可以在自己的机器上注册 Specific Runner。

Runner 有三种类型：
- **Shared Runner**：所有项目共享，Gitlab.com 每月提供 400 分钟免费额度
- **Group Runner**：组内项目共享
- **Specific Runner**：绑定到特定项目

安装 Runner 也非常简单：

```bash
# macOS
brew install gitlab-runner

# Linux
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash
sudo apt-get install gitlab-runner
```

然后注册到你的 Gitlab 实例：

```bash
sudo gitlab-runner register
```

### 三、.gitlab-ci.yml（配置即代码）

这是 Gitlab CI 的灵魂。一个典型的配置长这样：

```yaml
stages:
  - build
  - test
  - deploy

build-job:
  stage: build
  script:
    - echo "Compiling..."
    - make build

unit-test-job:
  stage: test
  script:
    - echo "Running tests..."
    - make test

deploy-job:
  stage: deploy
  script:
    - echo "Deploying..."
    - make deploy
  only:
    - main
```

---

## Gitlab CI 对比 Jenkins 的优势

| 维度 | Gitlab CI | Jenkins |
|------|-----------|---------|
| 部署方式 | 内置，无需额外安装 | 需要单独搭建和维护 |
| 配置文件 | `.gitlab-ci.yml` 随代码版本控制 | Jenkinsfile 随代码，但 Job 配置在 Jenkins 界面 |
| Runner | 自动发现、弹性伸缩 | 需手动配置 Slave 节点（也可通过插件对接 Docker Swarm、K8s 实现动态 Agent） |
| 界面集成 | 与 Gitlab 深度融合，MR 中直接看结果 | 需要插件与 Git 平台对接 |
| 学习曲线 | 相对平缓，YAML 配置直观 | 较陡，需了解 Groovy/Pipeline DSL |
| 插件生态 | 无插件概念，靠 Docker 镜像扩展 | 插件极其丰富，但也容易版本冲突 |
| 凭据管理 | 无原生凭据管理，靠 CI/CD Variables 机制（可设置 Masked/Protected） | 内置 Credentials 插件，支持多种凭据类型 |
| Stage 间文件传递 | Stage 之间默认不共享文件，需通过 artifacts 或 cache 显式传递 | Stage/Node 间可通过 workspace/stash 共享，但跨节点也需额外处理 |
| 扩展能力 | 功能完全依赖镜像封装，想加能力就得自己打镜像 | 插件市场丰富，安装即用，但也有兼容性和维护成本 |
| 配置可见性 | 所有配置在 `.gitlab-ci.yml` 中，版本控制、一目了然 | Jenkinsfile 管流水线逻辑，但 Job/凭据/节点配置散落在界面各处 |

这么看下来，两者其实不是谁替代谁的关系，而是设计思路完全不同——Jenkins 追求"一切可插拔"的灵活，Gitlab CI 追求"一切即代码"的纯粹。

---

## 后记

Gitlab CI 的设计哲学是"Everything as Code"——流水线配置、Runner 配置、环境变量，一切都在代码中。这种理念和 Jenkins 的 Pipeline as Code 一脉相承，但 Gitlab 做得更加彻底和自然。不过，彻底也有彻底的代价——没有插件体系意味着任何扩展都得自己封装镜像，没有凭据管理意味着敏感信息全靠变量机制扛着，Stage 间不共享文件意味着每次都要 artifacts 传一遍。这些在日常使用中都是实实在在的摩擦点。

我个人目前的实践是：打包发布用 Jenkins（插件生态和凭据管理在复杂流水线下确实省心），Gitlab 门禁用 Gitlab CI（代码提交即触发、MR 中直接看结果，体验无缝）。Gitlab CI 更像一把轻量而锋利的刀，适合代码和 CI 都在 Gitlab 上的团队，但在需要高度定制的场景下，它的简洁反而会变成局限。各有千秋，也各有痛点，选型终究要看团队的实际需求。

分享一个我的座右铭：每天前进一小步，就是一个新的高度！
