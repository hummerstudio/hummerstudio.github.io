---
title: Gitlab CI 变量与环境——让流水线"活"起来
author: 唐明
categories: [devops]
tags: [Gitlab CI, 变量, 环境]
---

## 变量，流水线的"灵魂参数"

如果说 `.gitlab-ci.yml` 是流水线的骨架，那变量就是流动在骨架里的血液。

没有变量，流水线就是硬编码的死脚本；有了变量，流水线才能"活"起来——同一个配置，通过不同变量值，可以构建不同环境、不同版本、不同目标平台。

<!--以上为摘要内容-->

## Gitlab CI 变量的层级

Gitlab CI 的变量有一个清晰的优先级体系（从高到低）：

| 优先级 | 来源 | 说明 |
|--------|------|------|
| 1 | 手动触发变量 | Pipeline 手动运行时填入 |
| 2 | Job 级变量 | 在 `.gitlab-ci.yml` 的 job 中定义 |
| 3 | 全局变量 | 在 `.gitlab-ci.yml` 顶层 `variables` 中定义 |
| 4 | Project 变量 | 项目 Settings → CI/CD → Variables |
| 5 | Group 变量 | 组级别设置 |
| 6 | Instance 变量 | 实例级别（自托管） |
| 7 | 预定义变量 | Gitlab 内置（如 `$CI_COMMIT_BRANCH`） |

当同名变量在不同层级出现时，高优先级的覆盖低优先级的。

## 预定义变量——Gitlab 送你的大礼包

Gitlab CI 提供了大量预定义变量，无需配置即可直接使用：

```yaml
job:
  script:
    - echo "当前分支：$CI_COMMIT_BRANCH"
    - echo "提交 SHA：$CI_COMMIT_SHA"
    - echo "项目路径：$CI_PROJECT_PATH"
    - echo "Pipeline ID：$CI_PIPELINE_ID"
    - echo "Job ID：$CI_JOB_ID"
```

常用预定义变量一览：

| 变量名 | 说明 |
|--------|------|
| `$CI_COMMIT_BRANCH` | 当前分支名 |
| `$CI_COMMIT_TAG` | 当前 Tag 名 |
| `$CI_COMMIT_SHA` | 完整 commit SHA |
| `$CI_COMMIT_SHORT_SHA` | 短 commit SHA（前8位） |
| `$CI_PIPELINE_ID` | Pipeline 唯一 ID |
| `$CI_JOB_ID` | Job 唯一 ID |
| `$CI_PROJECT_PATH` | 项目路径（如 group/project） |
| `$CI_PROJECT_DIR` | 项目在 Runner 上的克隆路径 |
| `$CI_DEFAULT_BRANCH` | 默认分支名 |

## Project 变量——保护你的秘密

敏感信息（密码、Token、SSH 密钥）绝不能写在 `.gitlab-ci.yml` 里，应该放在 Project 级别的变量中：

`Settings → CI/CD → Variables → Add Variable`

创建变量时可以设置：

- **Type**：Variable（普通）或 File（会生成临时文件）
- **Protected**：仅受保护分支/tag 可用
- **Masked**：在日志中自动脱敏（显示为 `[MASKED]`）

使用示例：

```yaml
deploy:
  stage: deploy
  script:
    - docker login -u $DOCKER_USER -p $DOCKER_PASSWORD
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_TAG
```

## 变量的高级用法

**1. 条件执行**

```yaml
job:
  script: make build
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      variables:
        BUILD_TYPE: "release"
    - if: $CI_COMMIT_BRANCH != $CI_DEFAULT_BRANCH
      variables:
        BUILD_TYPE: "debug"
```

**2. 动态环境名**

```yaml
deploy:
  stage: deploy
  script: ./deploy.sh
  environment:
    name: review/$CI_COMMIT_REF_NAME
    url: https://$CI_COMMIT_REF_NAME.example.com
```

---

## 后记

变量体系是 Gitlab CI 中最精巧的设计之一。预定义变量让你无需手动获取构建上下文，多层级的变量覆盖让你能灵活控制配置的粒度，Masked 变量保护敏感信息不泄露。

掌握好变量的使用，你的流水线才能真正做到"一套配置，处处运行"。

每天前进一小步，就是一个新的高度！
