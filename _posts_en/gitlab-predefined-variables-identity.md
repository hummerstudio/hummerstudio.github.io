---
title: 'GitLab Predefined Variables in Practice (Part 1): The Pipeline''s "Identity" — Branch, Tag, Commit, and MR'
date: 2026-06-20
author: Tang Moying
categories: [devops]
tags: [GitLab CI, Predefined Variables, CI_COMMIT_BRANCH, Pipelines]
lang: en
alt_url: /post/gitlab-predefined-variables-identity
---

Every time a pipeline runs, GitLab automatically injects a pile of "built-in variables" (officially called Predefined Variables). You don't need to configure them; they work out of the box, and they're the only window through which a pipeline can perceive "what context it's in right now."

Many people writing a `.gitlab-ci.yml` have only ever used one `$CI_COMMIT_BRANCH`, and then rely on a pile of hard-coded `if`s to tell environments apart. But this set of predefined variables can actually support some very intricate scenarios: one and the same configuration can automatically adapt to the branch, automatically tag a version, automatically recognize whether it's an MR, and automatically know which project is running.

If you're not yet familiar with GitLab's variable hierarchy (how Project / Group / predefined variables relate to one another), I'd suggest reading that 2023 article, "Gitlab CI Variables and Environments," first. This article won't restate the hierarchy; it focuses solely on **how to use predefined variables to solve real scenarios**.

This article focuses on the "identity" variables — the ones that answer "who am I, where am I, where did I come from, and which commit did I come from." The next article will cover the "orchestration" variables.

<!--以上为摘要内容-->

## 1. Deciding the Deployment Target by Branch: CI_COMMIT_BRANCH and Its Friends

The most classic scenario: the develop branch deploys to the test environment, the main branch deploys to production.

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

There are two easily confused variables here; let's get them straight first:

- **`$CI_COMMIT_BRANCH`**: the current branch name. Note that **it is empty when a pipeline is triggered by a Tag** (because a Tag doesn't belong to any branch).
- **`$CI_COMMIT_REF_NAME`**: the name of the current ref — a branch name when it's a branch, a Tag name when it's a Tag. It's a superset of `$CI_COMMIT_BRANCH`.
- **`$CI_COMMIT_REF_SLUG`**: converts the ref name into a "DNS-safe" form — for example `feature/login` becomes `feature-login`, and `release/v1.2` becomes `release-v1-2`. When you want to use a ref name to build a host name, a namespace, or a directory name, use this rather than the ref name itself.

A common mistake: using `$CI_COMMIT_BRANCH` to build a Kubernetes namespace in a review environment:

```yaml
review:
  environment:
    name: review/$CI_COMMIT_BRANCH   # the branch name feature/login contains a /, which K8s doesn't allow
```

The correct form uses the slug:

```yaml
review:
  environment:
    name: review/$CI_COMMIT_REF_SLUG   # feature-login, safe
    url: https://$CI_COMMIT_REF_SLUG.review.example.com
```

## 2. Tagging Artifacts as "Immutable": CI_COMMIT_SHA and CI_COMMIT_TAG

For images and artifact repositories, the thing to dread most is "overwriting under the same name." The ideal practice is to tag every build with an **immutable** tag — the commit SHA is a naturally immutable identifier.

```yaml
build:
  stage: build
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
```

- **`$CI_COMMIT_SHA`**: the full 40-character commit SHA.
- **`$CI_COMMIT_SHORT_SHA`**: the first 8 characters as a short SHA, good enough and easier to read — just use it for everyday scenarios.

When you come to a "release" scenario, you want the tag to be a semantic version number rather than a string of SHA. Distinguishing "an ordinary commit" from "a pushed Tag" comes down to `$CI_COMMIT_TAG`:

```yaml
release:
  stage: release
  script:
    - docker pull $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
    - docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA $CI_REGISTRY_IMAGE:$CI_COMMIT_TAG
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_TAG
  rules:
    - if: $CI_COMMIT_TAG   # only runs when a Tag was pushed
```

The key point: **when a Tag is pushed, `$CI_COMMIT_BRANCH` is empty, but `$CI_COMMIT_TAG` has a value**. `$CI_COMMIT_REF_NAME` has a value in both scenarios (the branch name and the Tag name respectively). So if your logic needs to cover both "a branch push" and "a pushed Tag," prefer `$CI_COMMIT_REF_NAME`.

## 3. Distinguishing "an Ordinary Push" from "a Merge Request": CI_PIPELINE_SOURCE and the MR Variable Family

This is where people trip up most easily. By default, pushing to a branch and opening an MR against that same branch **may each run a pipeline** (depending on whether you have "Merge Request Pipelines" enabled). Your script needs to be able to tell "am I running inside an MR right now, or inside an ordinary push."

The key to telling them apart is `$CI_PIPELINE_SOURCE`. When the pipeline comes from an MR, its value is `merge_request_event`:

```yaml
run_tests:
  stage: test
  script: ./run-tests.sh
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"   # only run the heavy tests inside an MR
```

The MR scenario also has a whole set of dedicated variables, whose value is that they let you get information about the target branch "before the merge" and validate ahead of time:

| Variable | Description |
|------|------|
| `$CI_MERGE_REQUEST_IID` | The MR's number within the repository (not a global ID) |
| `$CI_MERGE_REQUEST_TITLE` | The MR's title |
| `$CI_MERGE_REQUEST_SOURCE_BRANCH_NAME` | The source branch (the one you're merging in) |
| `$CI_MERGE_REQUEST_TARGET_BRANCH_NAME` | The target branch (the one you're merging into) |
| `$CI_MERGE_REQUEST_APPROVED` | Whether it has been approved (requires a license) |

A practical scenario: only allow merges into `main`, and the source branch must have passed the checks.

```yaml
guard:
  stage: test
  script: echo "检查目标分支"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event" && $CI_MERGE_REQUEST_TARGET_BRANCH_NAME == "main"
```

Another common need: **on an ordinary push run only a lightweight lint, and run the full tests only inside an MR**, so you don't spend half an hour on every push and waste Runner resources. This is the most typical value of using `$CI_PIPELINE_SOURCE` to route the work.

## 4. Digging Information Out of Commit Messages: the CI_COMMIT_MESSAGE Family

Commit messages aren't just for people to read; a pipeline can read them too. GitLab splits them up in fine detail:

| Variable | Description |
|------|------|
| `$CI_COMMIT_MESSAGE` | The full commit message (including the body) |
| `$CI_COMMIT_TITLE` | The first line (the subject) |
| `$CI_COMMIT_DESCRIPTION` | The body excluding the first line |
| `$CI_COMMIT_AUTHOR_NAME` | The author's name |
| `$CI_COMMIT_AUTHOR_EMAIL` | The author's email |
| `$CI_COMMIT_TIMESTAMP` | The commit timestamp (ISO 8601) |

Practical scenario 1: **automatically skipping CI**. Although these days it's preferable to use GitLab's `[skip ci]` convention (write `[skip ci]` directly in the commit message and GitLab automatically won't run the pipeline), you can also check for it manually in a script if you want:

```yaml
script:
  - if echo "$CI_COMMIT_MESSAGE" | grep -q "\[skip ci\]"; then echo "跳过"; exit 0; fi
```

Practical scenario 2: **using a commit prefix to trigger different behavior**. For example, agree that commits starting with `chore(release):` automatically cut a release:

```yaml
auto_release:
  script: ./release.sh
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH && $CI_COMMIT_TITLE =~ /^chore\(release\)/
```

Practical scenario 3: **automatically generating a changelog**. Take `$CI_COMMIT_TITLE`, string it into the release notes, and combine it with `$CI_COMMIT_AUTHOR_NAME` to note who committed it — far less hassle than writing it by hand.

## 5. Which Project Am I Running In: the CI_PROJECT_* Family

When you use a single `.gitlab-ci.yml` as a template and reuse it across a dozen repositories under a Group, a hard-coded project name falls apart immediately. That's when you rely on the project-level predefined variables:

| Variable | Description |
|------|------|
| `$CI_PROJECT_PATH` | The full path, e.g. `group/subgroup/myproject` |
| `$CI_PROJECT_NAME` | The project name (the last segment of the path) |
| `$CI_PROJECT_NAMESPACE` | The namespace it belongs to (a group or a user) |
| `$CI_PROJECT_DIR` | The absolute path where the code is cloned on the Runner |
| `$CI_PROJECT_URL` | The project's web URL on GitLab |
| `$CI_PROJECT_ID` | The project's numeric ID |

The most useful thing is to include the project context in **notification** scripts; otherwise the group chat receives a pile of "build failed" and nobody knows which project it was:

```yaml
notify:
  script:
    - ./notify.sh "项目 $CI_PROJECT_PATH 的流水线 $CI_PIPELINE_ID 失败了：$CI_PROJECT_URL/-/pipelines/$CI_PIPELINE_ID"
```

And `$CI_PROJECT_DIR` — once you've `cd`-ed back and forth in a script and want to get back to the code root, using the absolute path `$CI_PROJECT_DIR` is far more reliable than a relative path, especially inside `after_script`.

## Summary

This group of variables solves the core problem of "how does a pipeline know what context it's in":

- Branch / ref / slug: `$CI_COMMIT_BRANCH`, `$CI_COMMIT_REF_NAME`, `$CI_COMMIT_REF_SLUG` — deciding "where to deploy and what it's called"
- Commit / Tag: `$CI_COMMIT_SHA`, `$CI_COMMIT_SHORT_SHA`, `$CI_COMMIT_TAG` — giving artifacts an immutable, readable tag
- MR context: `$CI_PIPELINE_SOURCE == "merge_request_event"` plus `$CI_MERGE_REQUEST_*` — telling MR apart from push, and validating ahead of the merge
- Commit message: the `$CI_COMMIT_MESSAGE` family — driving behavior from conventions and generating notes automatically
- Project identity: `$CI_PROJECT_*` — letting one configuration be reused across many repositories

Remember one principle: **whatever a predefined variable can give you, don't hard-code.** Hard-coded project names, branch names, and paths will all turn on you the moment you copy the configuration into a second repository.

The next article covers the "orchestration" variables: who triggered my pipeline, how context is passed between parent and child pipelines, and those Runner and environment variables.

A small step forward every day is a new height!
