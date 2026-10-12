---
title: Gitlab CI — the CI/CD Power Tool Built into Gitlab
date: 2023-01-07
author: Tang Moying
categories: [devops]
tags: [Gitlab CI, CI/CD, DevOps]
lang: en
alt_url: /post/intro-to-gitlab-ci
---

## Gitlab CI, born in Gitlab, used for Gitlab

Gitlab CI is the continuous integration / continuous delivery system built into Gitlab. You do not need to set up an extra CI server: just put a `.gitlab-ci.yml` file in the root of your Gitlab repository and configure a Runner, and the pipeline can run.

Wozkishuode once said: "Give me a Jenkins, and I can automate everything." But Gitlab says: "Don't give me Jenkins, I can automate everything myself."

<!--以上为摘要内容-->

## The three core components of Gitlab CI

### 1. Pipeline

The Pipeline is the top-level concept in Gitlab CI. One Pipeline consists of several Stages, and each Stage contains several Jobs.

```yaml
stages:
  - build
  - test
  - deploy
```

### 2. Runner

The Runner is what really does the work — the agent process that executes Jobs. Gitlab provides Shared Runners, and you can also register a Specific Runner on your own machine.

There are three types of Runner:
- **Shared Runner**: shared by all projects; Gitlab.com provides 400 free minutes every month
- **Group Runner**: shared by the projects in a group
- **Specific Runner**: bound to a specific project

Installing a Runner is also very simple:

```bash
# macOS
brew install gitlab-runner

# Linux
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash
sudo apt-get install gitlab-runner
```

Then register it with your Gitlab instance:

```bash
sudo gitlab-runner register
```

### 3. .gitlab-ci.yml (configuration as code)

This is the soul of Gitlab CI. A typical configuration looks like this:

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

## Where Gitlab CI beats Jenkins

| Dimension | Gitlab CI | Jenkins |
|------|-----------|---------|
| Deployment | Built in, no extra installation | Has to be set up and maintained separately |
| Configuration file | `.gitlab-ci.yml` is version-controlled along with the code | The Jenkinsfile travels with the code, but Job configuration lives in the Jenkins UI |
| Runner | Auto-discovery, elastic scaling | Slave nodes must be configured by hand (plugins can also connect to Docker Swarm or K8s to get dynamic agents) |
| UI integration | Deeply integrated with Gitlab; results are visible directly in the MR | Needs plugins to connect to the Git platform |
| Learning curve | Relatively gentle; the YAML configuration is intuitive | Steeper; you need to understand Groovy/Pipeline DSL |
| Plugin ecosystem | No notion of plugins; extensibility comes from Docker images | An extremely rich plugin ecosystem, but version conflicts are easy to hit |
| Credentials management | No native credentials management; it relies on the CI/CD Variables mechanism (which can be set to Masked/Protected) | A built-in Credentials plugin supporting many credential types |
| Passing files between Stages | Stages do not share files by default; files must be passed explicitly through artifacts or cache | Stages/Nodes can share through workspace/stash, but sharing across nodes also needs extra work |
| Extensibility | Functionality depends entirely on what is packaged into the image; to add a capability you have to build your own image | A rich plugin marketplace, ready to use once installed, but with compatibility and maintenance costs |
| Configuration visibility | All configuration lives in `.gitlab-ci.yml`, version-controlled and obvious at a glance | The Jenkinsfile governs the pipeline logic, but Job/credentials/node configuration is scattered all over the UI |

Seen this way, the two are not really substitutes for each other; their design philosophies are completely different — Jenkins pursues the flexibility of "everything pluggable", while Gitlab CI pursues the purity of "everything as code".

---

## Afterword

Gitlab CI's design philosophy is "Everything as Code" — pipeline configuration, Runner configuration, environment variables, everything is in the code. This idea is in the same line of descent as Jenkins's Pipeline as Code, but Gitlab carries it out more thoroughly and more naturally. Yet being thorough has its own cost — having no plugin system means any extension has to be packaged into an image of your own; having no credentials management means sensitive information is carried entirely by the variables mechanism; and not sharing files between Stages means everything has to be handed over through artifacts every time. In day-to-day use these are all very real points of friction.

My own current practice is: use Jenkins for packaging and release (its plugin ecosystem and credentials management really do save you worry under complex pipelines), and use Gitlab CI for the Gitlab gate (a code commit triggers it, and results are visible directly in the MR — a seamless experience). Gitlab CI is more like a lightweight and sharply honed knife: it suits teams whose code and CI both live on Gitlab, but in situations that call for heavy customization, its simplicity turns into a limitation instead. Each has its strengths and each has its sore points; in the end the choice depends on the team's actual needs.

Let me share a motto of mine: one small step forward every day is a new height!
