---
title: Gitlab CI 常见问题集锦（一）
author: 唐明
categories: [devops]
tags: [Gitlab CI, 问题集锦]
---

## 问题1：Pipeline 一直处于 pending 状态怎么办？

这是新手最容易遇到的问题。Pipeline 创建了，但一直显示 pending（待处理），不往下跑。

**原因**：没有可用的 Runner 来执行你的 Job。

**排查步骤**：

1. 检查项目的 Runner 配置：`Settings → CI/CD → Runners`
2. 确认有没有 Shared Runner 或已注册的 Specific Runner
3. 如果用的是 Gitlab.com 的 Shared Runner，确认没有超出免费额度（每月 400 分钟）

<!--以上为摘要内容-->

**解决方法**：
- 如果是自托管 Gitlab，注册一个 Runner：
  ```bash
  sudo gitlab-runner register
  # 输入 Gitlab URL 和 registration token
  ```
- 如果是 Gitlab.com 且额度用完，等次月重置，或购买 CI 分钟数

---

## 问题2：Job 报错 "no such file or directory"

这通常发生在 `script` 里调用命令时找不到可执行文件。

**原因**：Runner 所使用的 Docker 镜像中没有安装对应的工具。

比如你用的是 `alpine` 镜像，却想用 `bash`：

```yaml
job:
  image: alpine:latest
  script:
    - bash script.sh  # alpine 默认没有 bash，只有 sh
```

**解决方法**：

- 改用镜像中有的命令：`sh script.sh`
- 或者换一个包含所需工具的镜像：`image: ubuntu:latest`
- 或者在 `before_script` 中先安装：

```yaml
job:
  image: alpine:latest
  before_script:
    - apk add --no-cache bash
  script:
    - bash script.sh
```

---

## 问题3：如何在多个 Job 之间共享文件？

Gitlab CI 提供了两种方式：

**方式一：artifacts（推荐）**

```yaml
build:
  stage: build
  script:
    - make build
  artifacts:
    paths:
      - dist/

test:
  stage: test
  script:
    - make test
  dependencies:
    - build  # 使用 build job 产生的 artifacts
```

**方式二：cache**

Cache 用于缓存依赖（如 node_modules），加速后续构建：

```yaml
job:
  cache:
    paths:
      - node_modules/
```

**区别**：artifacts 用于 Job 间传递产物，默认传给后续所有 Stage；cache 用于加速，不保证始终可用。

---

## 问题4：如何只在特定分支上运行 Pipeline？

使用 `only` 或 `rules`：

```yaml
# 旧写法（only/except）
deploy:
  stage: deploy
  script: make deploy
  only:
    - main
    - develop

# 新写法（rules，推荐）
deploy:
  stage: deploy
  script: make deploy
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

---

## 后记

Gitlab CI 的上手门槛不高，但深入使用后你会发现它的灵活度相当大——从简单的脚本执行到复杂的多阶段并行流水线，都能轻松应对。

这些常见问题是每个 Gitlab CI 使用者都会遇到的坎，踩过了，路就平了。

每天前进一小步，就是一个新的高度！
