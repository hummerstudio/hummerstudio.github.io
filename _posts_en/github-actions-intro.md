---
title: GitHub Actions — GitHub's Native Automation Workflow
date: 2023-02-18
author: Tang Moying
categories: [devops]
tags: [GitHub Actions, CI/CD, DevOps]
lang: en
alt_url: /post/github-actions-intro
---

## GitHub Actions — Actions Are Workflows

GitHub Actions is the CI/CD and automation platform GitHub launched in 2019. Like Gitlab CI, it belongs to the "repository-native CI" school — no need to stand up a separate CI server; drop a YAML file in the repository and it runs.

For developers who already host their code on GitHub, GitHub Actions is simply the most natural CI/CD choice.

<!--以上为摘要内容-->

## Core Concepts

### Workflow

A Workflow is an automation process, defined in a YAML file under the `.github/workflows/` directory. A repository can have multiple Workflows.

### Event

Workflows are triggered to run by events, for example:

- `push`: code is pushed
- `pull_request`: a PR is created/updated
- `schedule`: scheduled triggering (cron expression)
- `workflow_dispatch`: manual triggering

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1'  # every Monday at midnight
```

### Job

A Workflow contains multiple Jobs. Jobs run in parallel by default, and you can also set dependency order. Each Job runs in its own isolated virtual environment.

### Runner

A Runner is the machine that executes a Job. GitHub provides hosted Runners (Ubuntu, Windows, macOS), and you can self-host as well.

### Action

An Action is the smallest reusable unit, similar to a function. You can use Actions shared by the community, or define your own.

## A Typical Workflow

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
```

In just 20 short lines, it completes a full CI process: check out code → install Node.js → install dependencies → run tests.

## GitHub Actions vs. Gitlab CI

| Dimension | GitHub Actions | Gitlab CI |
|------|---------------|-----------|
| Config location | `.github/workflows/*.yml` | `.gitlab-ci.yml` |
| Triggering events | Extremely rich (issues, discussions, etc.) | Mainly built around code events |
| Marketplace | Action marketplace, componentized reuse | No built-in marketplace, relies on Docker images |
| Free quota | Unlimited for public repos, 2000 minutes/month for private repos | 400 minutes/month (Gitlab.com) |
| Matrix builds | Native support, concise syntax | Supported via `parallel:matrix` |
| Operating system | Ubuntu, Windows, macOS | Depends on the Runner configuration |
| Ecosystem lock-in | Deeply tied to the GitHub ecosystem | Deeply tied to the Gitlab ecosystem |

## GitHub Actions' Unique Advantages

### 1. Marketplace — a Rich Action Ecosystem

There are tens of thousands of ready-made Actions on the Actions Marketplace, covering everything from deploying to AWS to sending Slack notifications to code quality checks. This turns building a pipeline into "stacking building blocks."

### 2. Matrix Strategy

One line of configuration and you can test in parallel across multiple platforms and multiple versions:

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node-version: [18, 20, 22]
```

This generates 3 × 3 = 9 parallel Jobs, covering every combination of operating system and Node.js version.

### 3. Automation Beyond CI/CD

GitHub Actions is not just CI/CD — it can be any kind of automation:

- Automatically labeling Issues
- Automatically publishing a Release after a PR is merged
- Scraping data on a schedule to update a repository
- Welcoming new Contributors

---

## Afterword

The arrival of GitHub Actions gave CI/CD one more option. It isn't out to replace anyone; it offers GitHub users a more "native" choice — no extra CI server to set up, and CI lives wherever the code is hosted.

It is the "last piece of the puzzle" in the GitHub ecosystem — code hosting + Issue tracking + PR review + Actions automation form a complete closed loop for development collaboration. As for whether to choose GitHub Actions, Jenkins or Gitlab CI, there's no standard answer: use whatever fits where your code lives and what your team knows.

A small step forward every day is a new height!
