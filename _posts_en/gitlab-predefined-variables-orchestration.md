---
title: 'GitLab Predefined Variables in Practice (Part 2): The Pipeline "Orchestration Signals" — Trigger Source, Parent-Child Pipelines, Runner and Environment'
date: 2026-06-21
author: Tang Moying
categories: [devops]
tags: [GitLab CI, Predefined Variables, CI_PIPELINE_SOURCE, Parent-Child Pipelines, Environment Deployment]
lang: en
alt_url: /post/gitlab-predefined-variables-orchestration
---

The previous post talked about the "identification" variables — how a pipeline knows "who it is, where it is, and which commit it came from". This post is about the "orchestration" variables, which answer a different kind of question: **who triggered me, which larger pipeline do I belong to, which machine am I running on, and which environment did I reach.**

If the identification variables brought configuration to life (one set of configuration adapting to many branches and many projects), then the orchestration variables make pipelines truly able to cooperate — multi-project chaining, parent-child splitting, and executing differently by trigger method all depend on them.

<!--以上为摘要内容-->

## 1. Who Triggered the Pipeline: CI_PIPELINE_SOURCE

This is the one to figure out first among the orchestration variables. `$CI_PIPELINE_SOURCE` tells you how this pipeline came about; its possible values include:

| Value | Meaning |
|------|------|
| `push` | Triggered by a code push |
| `merge_request_event` | Triggered by an MR event (see the previous post) |
| `schedule` | Triggered by a scheduled job |
| `web` | Manually clicking "Run pipeline" in the GitLab web UI |
| `api` | Triggered through the API |
| `trigger` | Triggered through a `trigger` token (common in multi-project pipelines) |
| `pipeline` | Triggered by another pipeline (parent-child / multi-project pipelines) |
| `chat` | Triggered through ChatOps (for example the Slack `/gitlab` command) |
| `external` | Triggered by an external CI integration |

Its value lies in this: **the same configuration behaves completely differently under different trigger methods**. The classic pattern is "run the cheap ones constantly, the expensive ones on demand":

```yaml
quick_lint:
  script: ./lint.sh
  rules:
    - if: $CI_PIPELINE_SOURCE == "push"          # run the lightweight check on every push
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

heavy_e2e:
  script: ./e2e.sh
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"      # only the scheduled job runs the heavy e2e
    - if: $CI_PIPELINE_SOURCE == "web"           # and it can also run when you click to run it manually
```

This way day-to-day pushes return results in seconds, and the expensive end-to-end tests only run on a nightly schedule, so Runner resources aren't wasted.

## 2. Scheduled Jobs Need Names Too: CI_PIPELINE_SCHEDULE_DESCRIPTION

Knowing that it was triggered by `schedule` isn't enough. You may have configured several scheduled jobs: one that "runs the full regression every day at dawn" and one that "runs smoke tests every hour". With the same `.gitlab-ci.yml`, how do you tell which scheduled job this run is?

The answer is `$CI_PIPELINE_SCHEDULE_DESCRIPTION` — it takes the Description you filled in for that scheduled job under `CI/CD → Schedules`. Use it to branch:

```yaml
nightly_regression:
  script: ./regression.sh
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule" && $CI_PIPELINE_SCHEDULE_DESCRIPTION == "nightly-full"
```

Note that it compares the **description text**, so scheduled jobs need to be named consistently and stably. Don't call it `nightly` today and change it to `每晚全量` tomorrow, or the rule will stop matching.

## 3. Passing Context Between Parent and Child Pipelines: CI_PARENT_PIPELINE_ID and CI_UPSTREAM_*

As `.gitlab-ci.yml` grows longer, you'll want to split build, test, and deploy into "child pipelines", pulled in with `trigger: include`. Or project A finishes building and triggers a deployment in project B (a multi-project pipeline). At that point, how do parent and child know who each other are?

| Variable | Meaning |
|------|------|
| `$CI_PIPELINE_ID` | The unique ID of the current pipeline |
| `$CI_PARENT_PIPELINE_ID` | The ID of the parent pipeline that triggered me (has a value in child pipelines) |
| `$CI_UPSTREAM_PIPELINE_ID` | The upstream pipeline ID (in multi-project scenarios, pointing at the triggering side) |
| `$CI_UPSTREAM_PROJECT_PATH` | The upstream project path |
| `$CI_UPSTREAM_NAMESPACE` | The upstream namespace |
| `$CI_UPSTREAM_REF` | The upstream ref at the time of triggering |

A practical scenario: a child pipeline finishes its tests and wants to write the status back or notify the parent project. With `$CI_UPSTREAM_PROJECT_PATH` you can pin down "who set me running":

```yaml
# in the child pipeline
notify_parent:
  script:
    - ./notify.sh "子流水线 $CI_PIPELINE_ID 完成，父流水线为 $CI_PARENT_PIPELINE_ID"
```

Another gotcha: in a child pipeline, "identification" variables such as `$CI_COMMIT_BRANCH` are **inherited from the parent pipeline**, not recomputed. So the branch-based branching rules from the previous post work just as correctly in parent-child pipelines, without needing to pass parameters again.

## 4. Which Machine Am I Running On: CI_RUNNER_* and GITLAB_*

GitLab Runner is multi-platform: Linux, Windows, macOS, even specific GPU machines. Your scripts often need to sense which kind of Runner they're running on.

| Variable | Meaning |
|------|------|
| `$CI_RUNNER_ID` | The Runner's numeric ID |
| `$CI_RUNNER_DESCRIPTION` | The Runner's description (what you filled in when registering it) |
| `$CI_RUNNER_TAGS` | The Runner's tag list, comma-separated, e.g. `docker,linux` |
| `$CI_SERVER_HOST` | The GitLab instance's hostname |
| `$CI_SERVER_VERSION` | The GitLab version number |
| `$GITLAB_USER_NAME` / `$GITLAB_USER_EMAIL` / `$GITLAB_USER_LOGIN` / `$GITLAB_USER_ID` | The identity of the user who triggered this pipeline |

The most classic use case is **platform-specific builds**. For example, an iOS package can only be built on a macOS Runner:

```yaml
build_ios:
  script: ./build-ios.sh
  tags:
    - macos          # only pick Runners tagged macos
```

Inside a script, if you want to branch on Runner capabilities, you can parse `$CI_RUNNER_TAGS`:

```bash
if echo "$CI_RUNNER_TAGS" | grep -q "gpu"; then
  export USE_GPU=1
fi
```

`$GITLAB_USER_*`, by contrast, is often used for audit and notification — when something goes wrong, it tells you clearly who clicked to release and who triggered this pipeline, instead of leaving you staring at an anonymous CI bot.

## 5. Which Environment Did It Reach: CI_ENVIRONMENT_* and Deploy Freezes

Jobs that carry an `environment` get extra environment-related variables injected by GitLab:

| Variable | Meaning |
|------|------|
| `$CI_ENVIRONMENT_NAME` | The current environment name (e.g. `production`, `review/my-feature`) |
| `$CI_ENVIRONMENT_SLUG` | The slug form of the environment name (DNS-safe) |
| `$CI_ENVIRONMENT_URL` | The address you declared in `environment:url` |

Together with the review environment pattern from the first post, this set of variables makes "dynamic environments" genuinely usable: every MR automatically gets its own review environment, cleaned up automatically when the MR is closed.

Another practical one is the **deploy freeze**. GitLab lets you mark out "no deploy" windows on the calendar (during a major sale, say). During a freeze, related variables are set:

- `$CI_DEPLOY_FREEZE_STARTED` / `$CI_DEPLOY_FREEZE_*` and the like, injected by instance/project configuration

You can use it to "block" production deployments and avoid mistakes inside a freeze window:

```yaml
deploy_prod:
  script: ./deploy.sh prod
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  environment:
    name: production
```

Although the deploy freeze itself is intercepted by GitLab at the scheduling layer, knowing these variables lets you write finer-grained, custom safeguards inside your scripts.

## 6. Parallel Splitting and Job Metadata: CI_JOB_* and CI_NODE_*

The last group is job-level and mainly useful in `parallel` or `parallel:matrix` scenarios:

| Variable | Meaning |
|------|------|
| `$CI_JOB_ID` | The unique ID of the current job |
| `$CI_JOB_NAME` | The job name |
| `$CI_JOB_STAGE` | The stage it belongs to |
| `$CI_JOB_URL` | The job's web page URL |
| `$CI_NODE_INDEX` | The index within the parallel split (starting from 0) |
| `$CI_NODE_TOTAL` | The total number of parallel slices |

A typical scenario: split a large test suite into 4 slices running in parallel, each running only its own portion:

```yaml
test_split:
  parallel: 4
  script:
    - ./run-tests.sh --slice $CI_NODE_INDEX/$CI_NODE_TOTAL
```

Most test frameworks (pytest, jest, and so on) support slicing by "total + index"; just feed them `$CI_NODE_INDEX` and `$CI_NODE_TOTAL` and you don't need to compute anything yourself.

## Summary

The core problem the orchestration variables solve is "how does a pipeline know what collaborative relationship it's part of":

- Trigger method: `$CI_PIPELINE_SOURCE` — branch behavior by push / MR / schedule / web
- Scheduled identity: `$CI_PIPELINE_SCHEDULE_DESCRIPTION` — tell the intent of several scheduled jobs apart
- Parent-child cooperation: `$CI_PARENT_PIPELINE_ID`, `$CI_UPSTREAM_*` — pass context between pipelines and write status back
- Execution machine: `$CI_RUNNER_*`, `$GITLAB_USER_*` — platform adaptation and audit tracing
- Environment and deployment: `$CI_ENVIRONMENT_*` — dynamic environments, deploy freezes
- Parallel splitting: `$CI_NODE_INDEX` / `$CI_NODE_TOTAL` — test sharding

Together, the two posts complete the two main threads of GitLab predefined variables: identification and orchestration. Remember the principle that runs through it all: **if a predefined variable can give you a value, don't hard-code it** — hard-coding will come back to bite you in the second repository, on the Nth trigger, on the Mth Runner.

One last reminder of an easily overlooked point: predefined variables **expand at different times in different places**. `rules:` and `variables:` expand during YAML parsing, whereas variables inside `script:` expand during shell execution. So comparing `$CI_COMMIT_BRANCH` inside `rules` is safe, but if you want to build a variable name dynamically inside `script` and then reference it, you have to mind the shell's expansion order — that set of pitfalls deserves a post of its own, and we'll get into it another time.

A small step forward every day is a new height!
