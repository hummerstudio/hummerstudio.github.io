---
title: GitHub Actions FAQ Collection (Part 1)
date: 2023-03-04
author: Tang Moying
categories: [devops]
tags: [GitHub Actions, Troubleshooting]
lang: en
alt_url: /post/github-actions-faq-one
---

## Question 1: What If the Workflow Doesn't Trigger?

This is the confusion beginners run into most often with GitHub Actions — you clearly pushed your code, yet the Workflow never ran.

**Troubleshooting checklist**:

1. **Is the file path correct?** It must be under the `.github/workflows/` directory, and the file extension must be `.yml` or `.yaml`
2. **Are you on the right branch?** The Workflow file must exist on the branch where the triggering event happens. For example, if you push on the `feature` branch but the Workflow file only exists on the `main` branch, it won't trigger
3. **Is the event configured correctly?** Check the conditions under `on:`

<!--以上为摘要内容-->

**A common mistake**:

```yaml
# Wrong: only writes on, with no specific event
on: push

# Correct
on:
  push:
    branches: [main]
```

Also, if your repository is a Fork, Workflows are not enabled automatically by default; you have to enable them manually by clicking on the Actions page.

---

## Question 2: How Do I Share Data Between Different Jobs?

GitHub Actions uses `artifacts` to pass data between Jobs:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "hello" > output.txt
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: output.txt

  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build-output
      - run: cat output.txt
```

Key points:
- `upload-artifact` uploads build outputs
- `download-artifact` downloads build outputs
- `needs: build` ensures test runs after build

---

## Question 3: How Do I Cache Dependencies to Speed Up Builds?

Use `actions/cache`:

```yaml
- name: Cache node_modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-

- name: Install dependencies
  run: npm ci
```

The design of `key` is the key: `hashFiles` ensures the cache is automatically invalidated when the dependency file changes.

---

## Question 4: How Do I Use Secrets?

Sensitive information is managed through GitHub Secrets:

`Settings → Secrets and variables → Actions → New repository secret`

Usage:

```yaml
- name: Deploy
  env:
    SSH_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
    API_TOKEN: ${{ secrets.API_TOKEN }}
  run: ./deploy.sh
```

**Note**: Secrets are automatically masked in logs, but don't print them in scripts with `echo $SECRET`.

---

## Question 5: How Much Free Quota Do Workflows Get?

| Repository type | Free quota |
|----------|----------|
| Public repository | Unlimited |
| Private repository | 2000 minutes/month (free plan) |
| macOS Runner | Billed at 10× (1 minute = 10 minutes of quota) |
| Windows Runner | Billed at 2× |

---

## Afterword

GitHub Actions is easy to get started with, but once you go deeper you'll find its capabilities far exceed your expectations. From simple CI to complex multi-cloud deployments, scheduled jobs and automated operations, it can handle it all.

Hitting pitfalls is part of learning, and writing things down is the ladder of growth. I hope these answers to common questions help you avoid a few detours.

A small step forward every day is a new height!
