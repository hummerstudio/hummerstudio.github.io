---
title: GitLab CI FAQ Collection (Part 1)
date: 2023-01-21
author: Tang Moying
categories: [devops]
tags: [Gitlab CI, Troubleshooting]
lang: en
alt_url: /post/gitlab-ci-faq-one
---

## Question 1: What Do I Do When the Pipeline Is Stuck in pending?

This is the problem beginners run into most easily. The Pipeline has been created, but it keeps showing pending and never moves forward.

**Cause**: there is no available Runner to execute your Job.

**Troubleshooting steps**:

1. Check the project's Runner configuration: `Settings → CI/CD → Runners`
2. Confirm whether there is a Shared Runner or a registered Specific Runner
3. If you are using Gitlab.com's Shared Runners, confirm that you haven't exceeded the free quota (400 minutes per month)

<!--以上为摘要内容-->

**Solutions**:
- If Gitlab is self-hosted, register a Runner:
  ```bash
  sudo gitlab-runner register
  # Enter the Gitlab URL and registration token
  ```
- If you are on Gitlab.com and the quota is used up, wait for it to reset the following month, or buy CI minutes

---

## Question 2: The Job Fails with "no such file or directory"

This usually happens when a command called in `script` cannot find the executable.

**Cause**: the Docker image the Runner uses does not have the corresponding tool installed.

For example, you are using the `alpine` image but want to use `bash`:

```yaml
job:
  image: alpine:latest
  script:
    - bash script.sh  # alpine has no bash by default, only sh
```

**Solutions**:

- Use a command the image does have: `sh script.sh`
- Or switch to an image that includes the tools you need: `image: ubuntu:latest`
- Or install it first in `before_script`:

```yaml
job:
  image: alpine:latest
  before_script:
    - apk add --no-cache bash
  script:
    - bash script.sh
```

---

## Question 3: How Do I Share Files Between Multiple Jobs?

Gitlab CI offers two ways:

**Option one: artifacts (recommended)**

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
    - build  # use the artifacts produced by the build job
```

**Option two: cache**

Cache is used to cache dependencies (such as node_modules) and speed up subsequent builds:

```yaml
job:
  cache:
    paths:
      - node_modules/
```

**The difference**: artifacts pass build outputs between Jobs and by default are passed on to all later Stages; cache is for speed and is not guaranteed to always be available.

---

## Question 4: How Do I Run the Pipeline Only on a Specific Branch?

Use `only` or `rules`:

```yaml
# Old style (only/except)
deploy:
  stage: deploy
  script: make deploy
  only:
    - main
    - develop

# New style (rules, recommended)
deploy:
  stage: deploy
  script: make deploy
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

---

## Afterword

Gitlab CI is not hard to pick up, but once you use it in depth you'll find it remarkably flexible — from simple script execution to complex multi-stage parallel pipelines, it handles them all with ease.

These common problems are hurdles every Gitlab CI user runs into; once you have stepped over them, the road is smooth.

A small step forward every day is a new height!
