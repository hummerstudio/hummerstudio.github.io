---
title: GitLab 内置变量实战（一）：流水线的“身份识别”——分支、Tag、提交与 MR
author: 唐明
categories: [devops]
tags: [GitLab CI, 内置变量, Predefined Variables, CI_COMMIT_BRANCH, 流水线]
---

GitLab 在每次流水线运行时，会自动注入一大堆“内置变量”（官方叫 Predefined Variables）。它们不需要你配置，开箱即用，是流水线感知“当前处于什么上下文”的唯一窗口。

很多人写 `.gitlab-ci.yml` 只用过一个 `$CI_COMMIT_BRANCH`，然后就靠一堆硬编码的 `if` 去区分环境。但其实这套内置变量能支撑起非常精巧的场景：同一份配置，自动适配分支、自动打版本、自动识别是不是 MR、自动知道是哪个项目在跑。

如果你还不了解 GitLab 变量的层级体系（Project / Group / 预定义变量是什么关系），建议先看 2023 年那篇《Gitlab CI 变量与环境》。本篇不再复述层级，只聚焦**怎么用内置变量解决真实场景**。

本篇聚焦“识别类”变量——它们回答的是“我是谁、我在哪、从哪来、从哪次提交来”。下一篇聊“编排类”变量。

<!--以上为摘要内容-->

## 一、按分支决定部署目标：CI_COMMIT_BRANCH 与它的朋友们

最经典的场景：develop 分支部署到测试环境，main 分支部署到生产环境。

```yaml
deploy_staging:
  stage: deploy
  script: ./deploy.sh staging
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"

deploy_prod:
  stage: deploy
  script: ./deploy.sh prod
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

这里有两个容易混的变量，先说清楚：

- **`$CI_COMMIT_BRANCH`**：当前分支名。注意，**打 Tag 触发流水线时它为空**（因为 Tag 不属于某个分支）。
- **`$CI_COMMIT_REF_NAME`**：当前 ref 的名字，分支时是分支名，打 Tag 时是 Tag 名。它是 `$CI_COMMIT_BRANCH` 的超集。
- **`$CI_COMMIT_REF_SLUG`**：把 ref 名转成“DNS 安全”的形式，比如 `feature/login` 会变成 `feature-login`，`release/v1.2` 会变成 `release-v1-2`。当你要用 ref 名拼一个主机名、命名空间、目录名时，用它而不是 ref name 本身。

一个常见错误：在 review 环境里用 `$CI_COMMIT_BRANCH` 拼 Kubernetes namespace：

```yaml
review:
  environment:
    name: review/$CI_COMMIT_BRANCH   # 分支名 feature/login 含 /，K8s 不允许
```

正确写法是用 slug：

```yaml
review:
  environment:
    name: review/$CI_COMMIT_REF_SLUG   # feature-login，安全
    url: https://$CI_COMMIT_REF_SLUG.review.example.com
```

## 二、给产物打“不可变”标签：CI_COMMIT_SHA 与 CI_COMMIT_TAG

镜像、制品仓库里最忌讳“同名覆盖”。理想做法是每次构建都打上**不可变**的标签——提交 SHA 就是天然的不可变标识。

```yaml
build:
  stage: build
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
```

- **`$CI_COMMIT_SHA`**：完整 40 位 commit SHA。
- **`$CI_COMMIT_SHORT_SHA`**：前 8 位短 SHA，够用且好读，日常场景用它就行。

到了“发版”场景，你希望标签是语义化的版本号，而不是一串 SHA。区分“普通提交”和“打 Tag”的触发，靠的就是 `$CI_COMMIT_TAG`：

```yaml
release:
  stage: release
  script:
    - docker pull $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
    - docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA $CI_REGISTRY_IMAGE:$CI_COMMIT_TAG
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_TAG
  rules:
    - if: $CI_COMMIT_TAG   # 只有打了 Tag 才会执行这一段
```

关键点：**打 Tag 时 `$CI_COMMIT_BRANCH` 为空，但 `$CI_COMMIT_TAG` 有值**。`$CI_COMMIT_REF_NAME` 在两个场景都有值（分别是分支名和 Tag 名）。所以如果你的逻辑需要同时覆盖“分支推送”和“打 Tag”，优先用 `$CI_COMMIT_REF_NAME`。

## 三、区分“普通推送”和“Merge Request”：CI_PIPELINE_SOURCE 与 MR 变量族

这是最容易踩坑的地方。默认情况下，往一个分支 push，和往同一个分支开一个 MR，GitLab **可能各跑一次流水线**（取决于你有没有开 “Merge Request Pipelines”）。你的脚本需要能区分“我现在是在 MR 里跑，还是在普通 push 里跑”。

区分的核心是 `$CI_PIPELINE_SOURCE`。当流水线来自 MR 时，它的值是 `merge_request_event`：

```yaml
run_tests:
  stage: test
  script: ./run-tests.sh
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"   # 只在 MR 里跑重测试
```

MR 场景还有一整套专属变量，价值在于让你“在合并之前”就能拿到目标分支的信息，提前做校验：

| 变量 | 说明 |
|------|------|
| `$CI_MERGE_REQUEST_IID` | MR 在仓库内的编号（不是全局 ID） |
| `$CI_MERGE_REQUEST_TITLE` | MR 的标题 |
| `$CI_MERGE_REQUEST_SOURCE_BRANCH_NAME` | 源分支（你要合进来的） |
| `$CI_MERGE_REQUEST_TARGET_BRANCH_NAME` | 目标分支（你要合到哪） |
| `$CI_MERGE_REQUEST_APPROVED` | 是否已通过审批（需要 license） |

一个实用场景：只允许向 `main` 合入，且必须源分支通过检查。

```yaml
guard:
  stage: test
  script: echo "检查目标分支"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event" && $CI_MERGE_REQUEST_TARGET_BRANCH_NAME == "main"
```

另一个常见需求：**普通 push 只做轻量 lint，MR 里才跑完整测试**，避免每次 push 都跑半小时，浪费 Runner 资源。这就是用 `$CI_PIPELINE_SOURCE` 分流最典型的价值。

## 四、从提交信息里挖信息：CI_COMMIT_MESSAGE 家族

提交信息不只是给人看的，流水线也能读。GitLab 把它拆得很细：

| 变量 | 说明 |
|------|------|
| `$CI_COMMIT_MESSAGE` | 完整提交信息（含 body） |
| `$CI_COMMIT_TITLE` | 第一行（subject） |
| `$CI_COMMIT_DESCRIPTION` | 除第一行外的正文 |
| `$CI_COMMIT_AUTHOR_NAME` | 作者名 |
| `$CI_COMMIT_AUTHOR_EMAIL` | 作者邮箱 |
| `$CI_COMMIT_TIMESTAMP` | 提交时间戳（ISO 8601） |

实用场景 1：**自动跳过 CI**。虽然现在更推荐用 GitLab 的 `[skip ci]` 约定（直接在提交信息里写 `[skip ci]`，GitLab 会自动不跑流水线），但如果你想在脚本里手动判断也可以：

```yaml
script:
  - if echo "$CI_COMMIT_MESSAGE" | grep -q "\[skip ci\]"; then echo "跳过"; exit 0; fi
```

实用场景 2：**用提交前缀触发不同行为**。比如约定 `chore(release):` 开头的提交自动发版：

```yaml
auto_release:
  script: ./release.sh
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH && $CI_COMMIT_TITLE =~ /^chore\(release\)/
```

实用场景 3：**自动生成 changelog**。拿 `$CI_COMMIT_TITLE` 拼进发布说明，再结合 `$CI_COMMIT_AUTHOR_NAME` 注明是谁提交的，比手写省事得多。

## 五、我是哪个项目在跑：CI_PROJECT_* 家族

当你把一份 `.gitlab-ci.yml` 当作模板，复用在 Group 下十几个仓库时，硬编码项目名就立刻崩了。这时要靠项目级内置变量：

| 变量 | 说明 |
|------|------|
| `$CI_PROJECT_PATH` | 完整路径，如 `group/subgroup/myproject` |
| `$CI_PROJECT_NAME` | 项目名（路径最后一段） |
| `$CI_PROJECT_NAMESPACE` | 所属 namespace（group 或用户） |
| `$CI_PROJECT_DIR` | Runner 上代码克隆到的绝对路径 |
| `$CI_PROJECT_URL` | 项目在 GitLab 上的 Web URL |
| `$CI_PROJECT_ID` | 项目数字 ID |

最有用的是在**通知类**脚本里带上项目上下文，否则群里收到一堆“构建失败”却没人知道是哪个项目：

```yaml
notify:
  script:
    - ./notify.sh "项目 $CI_PROJECT_PATH 的流水线 $CI_PIPELINE_ID 失败了：$CI_PROJECT_URL/-/pipelines/$CI_PIPELINE_ID"
```

以及 `$CI_PROJECT_DIR`——当你在脚本里 `cd` 来 `cd` 去之后，想回到代码根目录，用绝对路径 `$CI_PROJECT_DIR` 比相对路径稳得多，尤其在 `after_script` 里。

## 小结

这一组变量解决的核心问题是“流水线怎么知道自己身处什么上下文”：

- 分支 / ref / slug：`$CI_COMMIT_BRANCH`、`$CI_COMMIT_REF_NAME`、`$CI_COMMIT_REF_SLUG`——决定“部署到哪、叫什么名”
- 提交 / Tag：`$CI_COMMIT_SHA`、`$CI_COMMIT_SHORT_SHA`、`$CI_COMMIT_TAG`——给产物打不可变、可读的标签
- MR 上下文：`$CI_PIPELINE_SOURCE == “merge_request_event”` 加 `$CI_MERGE_REQUEST_*`——区分 MR 与 push，提前做合并前校验
- 提交信息：`$CI_COMMIT_MESSAGE` 系列——用约定驱动行为、自动生成说明
- 项目身份：`$CI_PROJECT_*`——让一份配置在多个仓库间复用

记住一个原则：**凡是内置变量能给的，就不要硬编码。** 硬编码的项目名、分支名、路径，都会在你复制配置到第二个仓库的那一刻反噬你。

下一篇聊“编排类”变量：谁触发了我的流水线、父子流水线之间怎么传上下文、以及 Runner 和环境的那些变量。

每天前进一小步，就是一个新的高度！
