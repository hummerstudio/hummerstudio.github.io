---
title: 'Gitlab CI Variables and Environments — Bringing Your Pipeline to "Life"'
date: 2023-02-04
author: Tang Moying
categories: [devops]
tags: [Gitlab CI, Variables, Environment]
lang: en
alt_url: /post/gitlab-ci-variables-and-environments
---

## Variables — the Pipeline's "Soul Parameters"

If `.gitlab-ci.yml` is the skeleton of a pipeline, then variables are the blood flowing through that skeleton.

Without variables, a pipeline is a hard-coded, lifeless script; with variables, a pipeline can come "alive" — the same configuration, through different variable values, can build different environments, different versions and different target platforms.

<!--以上为摘要内容-->

## The Hierarchy of Gitlab CI Variables

Gitlab CI variables have a clear precedence system (from high to low):

| Priority | Source | Description |
|--------|------|------|
| 1 | Manually triggered variables | Filled in when the Pipeline is run manually |
| 2 | Job-level variables | Defined in a job in `.gitlab-ci.yml` |
| 3 | Global variables | Defined in the top-level `variables` of `.gitlab-ci.yml` |
| 4 | Project variables | Project Settings → CI/CD → Variables |
| 5 | Group variables | Set at the group level |
| 6 | Instance variables | Instance level (self-hosted) |
| 7 | Predefined variables | Built into Gitlab (such as `$CI_COMMIT_BRANCH`) |

When a variable with the same name appears at different levels, the higher priority overrides the lower priority.

## Predefined Variables — Gitlab's Big Gift Bag to You

Gitlab CI provides a large number of predefined variables that you can use directly with no configuration:

```yaml
job:
  script:
    - echo "当前分支：$CI_COMMIT_BRANCH"
    - echo "提交 SHA：$CI_COMMIT_SHA"
    - echo "项目路径：$CI_PROJECT_PATH"
    - echo "Pipeline ID：$CI_PIPELINE_ID"
    - echo "Job ID：$CI_JOB_ID"
```

A rundown of commonly used predefined variables:

| Variable name | Description |
|--------|------|
| `$CI_COMMIT_BRANCH` | Current branch name |
| `$CI_COMMIT_TAG` | Current Tag name |
| `$CI_COMMIT_SHA` | Full commit SHA |
| `$CI_COMMIT_SHORT_SHA` | Short commit SHA (first 8 characters) |
| `$CI_PIPELINE_ID` | Unique Pipeline ID |
| `$CI_JOB_ID` | Unique Job ID |
| `$CI_PROJECT_PATH` | Project path (such as group/project) |
| `$CI_PROJECT_DIR` | Path where the project is cloned on the Runner |
| `$CI_DEFAULT_BRANCH` | Default branch name |

## Project Variables — Protect Your Secrets

Sensitive information (passwords, Tokens, SSH keys) must never be written into `.gitlab-ci.yml`; it should go into Project-level variables:

`Settings → CI/CD → Variables → Add Variable`

When creating a variable you can set:

- **Type**: Variable (ordinary) or File (generates a temporary file)
- **Protected**: Available only to protected branches/tags
- **Masked**: Automatically masked in logs (shown as `[MASKED]`)

Usage example:

```yaml
deploy:
  stage: deploy
  script:
    - docker login -u $DOCKER_USER -p $DOCKER_PASSWORD
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_TAG
```

## Advanced Uses of Variables

**1. Conditional execution**

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

**2. Dynamic environment names**

```yaml
deploy:
  stage: deploy
  script: ./deploy.sh
  environment:
    name: review/$CI_COMMIT_REF_NAME
    url: https://$CI_COMMIT_REF_NAME.example.com
```

---

## Afterword

The variable system is one of the most elegant designs in Gitlab CI. Predefined variables save you from having to fetch the build context by hand, multi-level variable overriding lets you control the granularity of your configuration flexibly, and Masked variables keep sensitive information from leaking.

Master the use of variables, and your pipeline can truly achieve "one configuration, runs everywhere."

A small step forward every day is a new height!
