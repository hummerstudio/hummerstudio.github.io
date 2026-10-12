---
title: 'Git Branching Models (Part 2): GitHub Flow'
date: 2023-06-11
author: Tang Moying
categories: [code]
tags: [Git, GitHub Flow, Branching Models]
lang: en
alt_url: /post/github-flow
---

## 1. Why a Lighter Model Is Needed

The previous article introduced Git Flow. Rigorous as it is, the process is cumbersome. For a project like a web application that needs fast iteration and continuous deployment, Git Flow's `develop` → `release` → `main` flow is too heavy.

As the world's largest code hosting platform, GitHub's development team faced this problem too. So GitHub Flow came into being — the branching model GitHub uses internally, extremely concise, with just one core principle:

> **Any code on the `main` branch is deployable.**

## 2. GitHub Flow's Core Rules

GitHub Flow has only six rules, very easy to understand and follow:

1. **The `main` branch is always deployable**: code on `main` must be deployable to production at any time.
2. **Cut feature branches from `main`**: every time you develop a new feature or fix a bug, create a descriptive branch from `main`.
3. **Develop on the feature branch and commit frequently**: push the branch to the remote repository regularly.
4. **Open a Pull Request at any time**: even if the feature isn't finished yet, you can create a PR to discuss the code.
5. **Merge into `main` after review**: the PR is merged after code review and CI checks.
6. **Deploy immediately after merging**: once merged into `main` it should be deployed, keeping `main` always in a deployable state.

There is no `develop`, no `release`, no `hotfix` — only `main` and countless short-lived feature branches.

## 3. The Workflow

```
main:    ●────●────●────●────●────●────●
         │    │         │         │
         │    │         │         │
feature/A┘    │         │         │
              │         │         │
       feature/B────────┘         │
                                  │
                           feature/C──────┘
```

The concrete steps for each stage:

```bash
# 1. Cut a branch from main
git checkout -b add-search-feature main

# 2. Develop and commit
git add .
git commit -m "Add search feature"

# 3. Push to the remote and create a Pull Request
git push origin add-search-feature
# Create the PR on GitHub and wait for review

# 4. Merge once the review passes (done on GitHub)
# Or merge locally:
git checkout main
git pull origin main
git merge --no-ff add-search-feature
git push origin main

# 5. Delete the branch after deployment
git branch -d add-search-feature
git push origin --delete add-search-feature
```

## 4. What a Pull Request Does

The core mechanism of GitHub Flow is the Pull Request (PR). It is not just about merging code; it is the hub of team collaboration:

- **Code review**: others can comment line by line in the PR, raising questions or suggestions.
- **Discussion context**: the PR's description and comments record in full "why it was changed this way".
- **CI/CD triggering**: creating and updating a PR automatically triggers CI checks, and merging into `main` triggers automatic deployment.
- **Early feedback**: even a half-finished piece of work can be a PR, letting the team see the design direction in advance.

A good PR should contain:

- A clear title and description (what was done, and why)
- Links to the related Issues
- Screenshots or a demo (if UI changes are involved)

## 5. Deployment Strategy

GitHub Flow emphasises continuous deployment. The commonly used deployment approaches:

**Automatic deployment**: after merging into `main`, CI builds and deploys to production automatically. Tools such as GitHub Actions and Jenkins can all do this.

```yaml
# Example: automatic deployment with GitHub Actions
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install && npm run build
      - run: ./deploy.sh
```

**Feature-branch preview deployments**: each PR gets its own independent preview environment, making it easy to verify the result before merging. Platforms such as Netlify and Vercel support this pattern natively.

## 6. Where It Fits

GitHub Flow suits the following situations:

- **Web applications and SaaS products**: needing fast iteration and continuous deployment.
- **Small to medium teams**: a simple process with low communication overhead.
- **Continuous deployment practices**: the team has solid automated testing and deployment pipelines.
- **Open-source projects**: the PR mechanism is naturally suited to community contributions.

## 7. Comparison With Git Flow

| Dimension | Git Flow | GitHub Flow |
|---------|----------|-------------|
| Long-lived branches | `main` + `develop` | `main` only |
| Short-lived branches | `feature`, `release`, `hotfix` | `feature` |
| Release process | release branch → merge into main + develop | merge into main → deploy immediately |
| Complexity | High | Low |
| Suited to | A fixed release cycle, client software | Web applications, continuous deployment |
| Core mechanism | Conventions about branch types | Pull Requests |

## 8. Summary

GitHub Flow simplifies Git Flow's complexity a great deal, using the PR in place of the roles played by the `develop` and `release` branches. It assumes your team is capable of deploying quickly, and that the `main` branch never breaks.

But if your project needs to maintain several versions (say v1.0 and v2.0 at the same time), GitHub Flow starts to fall short. In the next article we'll look at a middle-ground approach — **GitLab Flow**.

A small step forward every day is a new height!
