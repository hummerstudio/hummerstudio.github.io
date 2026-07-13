---
title: GitLab 内置变量实战（二）：流水线的“编排信号”——触发源、父子流水线、Runner 与环境
author: 唐明
categories: [devops]
tags: [GitLab CI, 内置变量, CI_PIPELINE_SOURCE, 父子流水线, 环境部署]
---

上一篇聊了“识别类”变量——流水线怎么知道自己“是谁、在哪、从哪次提交来”。这一篇聊“编排类”变量，它们回答的是另一类问题：**谁触发了我、我属于哪条更大的流水线、我在哪台机器上跑、跑到了哪个环境。**

如果说识别类变量让配置“活”了起来（一套配置适配多分支多项目），那编排类变量让流水线真正“会协作”——多项目联动、父子拆分、按触发方式差异化执行，都靠它们。

<!--以上为摘要内容-->

## 一、流水线是被“谁”触发的：CI_PIPELINE_SOURCE

这是编排类变量里最该先搞清楚的一个。`$CI_PIPELINE_SOURCE` 告诉你这次流水线是怎么来的，取值包括：

| 取值 | 含义 |
|------|------|
| `push` | 代码 push 触发 |
| `merge_request_event` | MR 事件触发（见上一篇） |
| `schedule` | 定时任务触发 |
| `web` | 在 GitLab 网页上手动点 “Run pipeline” |
| `api` | 通过 API 触发 |
| `trigger` | 通过 `trigger` 令牌触发（多项目流水线常见） |
| `pipeline` | 被另一条流水线触发（父子 / 多项目流水线） |
| `chat` | 通过 ChatOps（如 Slack `/gitlab` 命令）触发 |
| `external` | 外部 CI 集成触发 |

它的价值在于：**同一种配置，在不同触发方式下行为完全不同**。典型模式是“便宜的常跑，贵的按需跑”：

```yaml
quick_lint:
  script: ./lint.sh
  rules:
    - if: $CI_PIPELINE_SOURCE == "push"          # 每次 push 都跑轻量检查
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

heavy_e2e:
  script: ./e2e.sh
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"      # 只有定时任务才跑重的 e2e
    - if: $CI_PIPELINE_SOURCE == "web"           # 手动点运行时也可以跑
```

这样日常 push 几秒出结果，昂贵的端到端测试只在夜里定时跑，Runner 资源不被浪费。

## 二、定时任务也要有“名字”：CI_PIPELINE_SCHEDULE_DESCRIPTION

光知道是 `schedule` 触发还不够。你可能配了好几个定时任务：一个“每天凌晨跑全量回归”、一个“每小时跑冒烟测试”。同一个 `.gitlab-ci.yml`，怎么区分这次是哪个定时任务？

答案是 `$CI_PIPELINE_SCHEDULE_DESCRIPTION`——它取的是你在 `CI/CD → Schedules` 里给那个定时任务填的 Description。用它来分流：

```yaml
nightly_regression:
  script: ./regression.sh
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule" && $CI_PIPELINE_SCHEDULE_DESCRIPTION == "nightly-full"
```

注意它比对的是**描述文字**，所以定时任务的命名要规范、稳定，别今天叫 `nightly` 明天改成 `每晚全量`，否则规则就失配了。

## 三、父子流水线之间传上下文：CI_PARENT_PIPELINE_ID 与 CI_UPSTREAM_*

当 `.gitlab-ci.yml` 越来越长，你会想把构建、测试、部署拆成“子流水线”（child pipeline），用 `trigger: include` 拉起。或者 A 项目构建完，触发 B 项目部署（多项目流水线，multi-project pipeline）。这时父子之间怎么知道彼此是谁？

| 变量 | 含义 |
|------|------|
| `$CI_PIPELINE_ID` | 当前这条流水线的唯一 ID |
| `$CI_PARENT_PIPELINE_ID` | 触发我的那条父流水线 ID（在子流水线里有值） |
| `$CI_UPSTREAM_PIPELINE_ID` | 上游流水线 ID（多项目场景，指向触发方） |
| `$CI_UPSTREAM_PROJECT_PATH` | 上游项目路径 |
| `$CI_UPSTREAM_NAMESPACE` | 上游 namespace |
| `$CI_UPSTREAM_REF` | 上游触发时的 ref |

实用场景：子流水线跑完测试，想回写状态或通知给父项目。用 `$CI_UPSTREAM_PROJECT_PATH` 就能定位“谁让我跑的”：

```yaml
# 子流水线里
notify_parent:
  script:
    - ./notify.sh "子流水线 $CI_PIPELINE_ID 完成，父流水线为 $CI_PARENT_PIPELINE_ID"
```

另一个坑：子流水线里 `$CI_COMMIT_BRANCH` 等“识别类”变量是**从父流水线继承**过来的，不是重新算的。所以上一篇那些按分支分流的规则，在父子流水线里照样能正确工作，不必重新传参。

## 四、我在哪台机器上跑：CI_RUNNER_* 与 GITLAB_*

GitLab Runner 是多平台的：Linux、Windows、macOS、甚至特定的 GPU 机器。你的脚本经常需要“感知”自己跑在哪类 Runner 上。

| 变量 | 含义 |
|------|------|
| `$CI_RUNNER_ID` | Runner 的数字 ID |
| `$CI_RUNNER_DESCRIPTION` | Runner 的描述名（你在注册时填的） |
| `$CI_RUNNER_TAGS` | Runner 的标签列表，逗号分隔，如 `docker,linux` |
| `$CI_SERVER_HOST` | GitLab 实例主机名 |
| `$CI_SERVER_VERSION` | GitLab 版本号 |
| `$GITLAB_USER_NAME` / `$GITLAB_USER_EMAIL` / `$GITLAB_USER_LOGIN` / `$GITLAB_USER_ID` | 触发这次流水线的用户身份 |

最经典的用例是**平台相关构建**。比如 iOS 包只能在 macOS Runner 上打：

```yaml
build_ios:
  script: ./build-ios.sh
  tags:
    - macos          # 只挑带 macos 标签的 Runner
```

在脚本内部，如果你想根据 Runner 能力做判断，可以解析 `$CI_RUNNER_TAGS`：

```bash
if echo "$CI_RUNNER_TAGS" | grep -q "gpu"; then
  export USE_GPU=1
fi
```

`$GITLAB_USER_*` 则常用于“审计”和“通知”——出问题时明确告诉你是谁点的发布、谁触发的这条流水线，而不是只看见一个匿名 CI 机器人。

## 五、跑到了哪个环境：CI_ENVIRONMENT_* 与部署冻结

带 `environment` 的 job，GitLab 会额外注入环境相关变量：

| 变量 | 含义 |
|------|------|
| `$CI_ENVIRONMENT_NAME` | 当前环境名（如 `production`、`review/my-feature`） |
| `$CI_ENVIRONMENT_SLUG` | 环境名的 slug 形式（DNS 安全） |
| `$CI_ENVIRONMENT_URL` | 你在 `environment:url` 里声明的地址 |

配合第一篇的 review 环境模式，这套变量让“动态环境”真正可用：每个 MR 自动有一个独立 review 环境，关 MR 时自动清理。

另一个实用的是**部署冻结（Deploy Freeze）**。GitLab 允许你在日历上划出“禁止部署”的窗口（比如大促期间）。冻结期内，相关变量会被设置：

- `$CI_DEPLOY_FREEZE_STARTED` / `$CI_DEPLOY_FREEZE_*` 之类由实例/项目配置注入

你可以用它来“拦住”生产部署，避免冻结窗口里误操作：

```yaml
deploy_prod:
  script: ./deploy.sh prod
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  environment:
    name: production
```

虽然部署冻结本身由 GitLab 在调度层拦截，但了解这些变量能让你在脚本里做更细的、自定义的防护逻辑。

## 六、并发切分与 Job 自身信息：CI_JOB_* 与 CI_NODE_*

最后一组是 job 级的，主要在 `parallel` 或 `parallel:matrix` 场景下有用：

| 变量 | 含义 |
|------|------|
| `$CI_JOB_ID` | 当前 job 唯一 ID |
| `$CI_JOB_NAME` | job 名 |
| `$CI_JOB_STAGE` | 所属 stage |
| `$CI_JOB_URL` | job 的 Web 页面地址 |
| `$CI_NODE_INDEX` | 并发分片中的序号（从 0 开始） |
| `$CI_NODE_TOTAL` | 并发分片总数 |

典型场景：把一个大测试套件拆成 4 片并发跑，每片只跑属于自己的那部分：

```yaml
test_split:
  parallel: 4
  script:
    - ./run-tests.sh --slice $CI_NODE_INDEX/$CI_NODE_TOTAL
```

测试框架（如 pytest、jest）大多支持按“总数 + 序号”分片，直接喂 `$CI_NODE_INDEX` 和 `$CI_NODE_TOTAL` 即可，不需要自己算。

## 小结

编排类变量解决的核心问题是“流水线怎么知道自己处在什么协作关系中”：

- 触发方式：`$CI_PIPELINE_SOURCE`——按 push / MR / schedule / web 分流行为
- 定时身份：`$CI_PIPELINE_SCHEDULE_DESCRIPTION`——区分多个定时任务的意图
- 父子协作：`$CI_PARENT_PIPELINE_ID`、`$CI_UPSTREAM_*`——在流水线间传上下文、回写状态
- 执行机器：`$CI_RUNNER_*`、`$GITLAB_USER_*`——平台适配与审计溯源
- 环境与部署：`$CI_ENVIRONMENT_*`——动态环境、部署冻结
- 并发切分：`$CI_NODE_INDEX` / `$CI_NODE_TOTAL`——测试分片

两篇合起来，GitLab 内置变量的“识别”与“编排”两条主线就齐了。记住那条贯穿始终的原则：**凡是内置变量能给的，就不要硬编码**——硬编码在第二个仓库、第 N 次触发、第 M 台 Runner 上一定会反噬你。

最后提醒一个容易忽略的点：内置变量在**不同位置展开时机不同**。`rules:` 和 `variables:` 在 YAML 解析阶段展开，而 `script:` 里的变量在 shell 执行阶段展开。所以在 `rules` 里比较 `$CI_COMMIT_BRANCH` 是安全的，但如果你想在 `script` 里动态拼一个变量名再去引用，就要注意 shell 的展开顺序——这部分坑值得单独写一篇，以后有机会再展开。

每天前进一小步，就是一个新的高度！
