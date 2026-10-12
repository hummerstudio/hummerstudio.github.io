---
title: 'Git Branching Models (Part 3): GitLab Flow'
date: 2023-06-17
author: Tang Moying
categories: [code]
tags: [Git, GitLab Flow, Branching Models]
lang: en
alt_url: /post/gitlab-flow
---

## 1. Git Flow Is Too Heavy, GitHub Flow Is Too Light

The previous two articles introduced Git Flow and GitHub Flow respectively. The former has rigorous but cumbersome rules; the latter is extremely minimal but offers insufficient support for maintaining multiple versions. Is there a middle ground?

The GitLab team thought about this question too. In practice they found an obvious flaw in GitHub Flow: when you need to maintain several versions or isolate environments, a single `main` branch is not enough. So they proposed **GitLab Flow**.

The core idea of GitLab Flow is: **on top of GitHub Flow, introduce additional long-lived branches as needed to handle version management and environment deployment.**

## 2. Environment Branches

If you have multiple deployment environments (such as development, pre-production and production), GitLab Flow suggests creating a corresponding branch for each environment:

```
main ──────────●──────────────────●──────────────────●
               │                  │                  │
pre-production─┼──────────────────●──────────────────●
               │                  │
production─────┼──────────────────────────────────────●
```

The workflow:

```bash
# Once development on main is done, merge into pre-production for testing
git checkout pre-production
git merge main

# Once the pre-production environment is verified, merge into production
git checkout production
git merge pre-production
```

**Upstream first**: code always flows from upstream to downstream (`main` → `pre-production` → `production`), and must never be merged in the reverse direction.

The advantages of this approach:
- Every environment has a corresponding branch, so you know which code is in which environment
- You can cherry-pick an emergency fix directly onto an environment branch
- Deploying is a simple `git merge`

## 3. Release Branches

If you need to maintain several versions at the same time (such as v1.x and v2.x), GitLab Flow suggests creating a release branch for each major version:

```
main:    ●────●────●────●────●────●  (v2.x development)
         │
v1.x:    ●────●────●  (v1.x maintenance, bug fixes only)
```

```bash
# Create a release branch when releasing v1.0
git checkout -b v1.x main
git tag v1.0.0

# Bug fixes on v1.x need to be cherry-picked to main (if the bug also exists in v2)
git checkout v1.x
git cherry-pick <bug-fix-commit>
git checkout main
git cherry-pick <bug-fix-commit>
```

The principles for working with release branches:
- **Major-version development happens on `main`**: new features are always developed on `main`.
- **Old versions only get bug fixes**: only bug fixes are merged into a release branch, never new features.
- **Bug fixes are merged upstream**: fix the oldest affected version first, then cherry-pick forward to the newer versions in turn.

## 4. A Combined Example: Environment Branches + Release Branches

A project that uses both environment branches and release branches might have a branch structure like this:

```
main ──────────────────────────────────────────
  │                    │
  ├── pre-production ──┤
  │                    │
  ├── production ──────┤
  │                    │
  ├── v1.x ────────────┤ (cherry-pick bug fixes only)
  │                    │
  └── v2.x ────────────┘ (cherry-pick bug fixes only)
```

This structure achieves both environment isolation (through environment branches) and maintenance of multiple production versions (through release branches); GitLab itself uses this model extensively.

## 5. Merge Requests and GitLab CI

In GitLab Flow, the Merge Request (MR, the equivalent of GitHub's PR) likewise plays a central role. Combined with GitLab CI, it enables a complete automated pipeline:

```yaml
# .gitlab-ci.yml example
stages:
  - test
  - deploy_dev
  - deploy_staging
  - deploy_prod

test:
  stage: test
  script: npm test
  only:
    - merge_requests
    - main

deploy_dev:
  stage: deploy_dev
  script: ./deploy.sh dev
  only:
    - main

deploy_staging:
  stage: deploy_staging
  script: ./deploy.sh staging
  only:
    - pre-production

deploy_prod:
  stage: deploy_prod
  script: ./deploy.sh prod
  only:
    - production
  when: manual  # Production deployment must be triggered manually
```

Each branch's CI configuration maps clearly onto its own deployment environment, at a glance.

## 6. Comparing the Three Models

| Dimension | Git Flow | GitHub Flow | GitLab Flow |
|---------|----------|-------------|-------------|
| Long-lived branches | `main` + `develop` | `main` only | `main` + optional environment/release branches |
| Short-lived branches | `feature`, `release`, `hotfix` | `feature` | `feature` |
| Multi-version support | ✅ Good | ❌ Insufficient | ✅ Good (via release branches) |
| Environment isolation | ❌ Not supported directly | ❌ Not supported directly | ✅ Good (via environment branches) |
| Complexity | High | Low | Medium |
| Flexibility | Low (fixed rules) | Medium | High (choose as needed) |

## 7. How to Choose

GitLab Flow's design philosophy is "choose as needed", not one-size-fits-all:

- Building a single web application and deploying frequently? You only need the `main` branch — that is essentially GitHub Flow.
- Need to distinguish development/pre-production/production environments? Add environment branches.
- Need to maintain v1.x and v2.x at the same time? Add release branches.
- Need all of the above? Add them all.

This incremental increase in complexity lets teams choose flexibly according to their own situation, rather than shouldering all of Git Flow's rules from the outset.

## 8. Summary

GitLab Flow is not an entirely new model; it is a complement to and extension of GitHub Flow. It keeps GitHub Flow's simple core (`main` + feature branches + MRs), while using environment branches and release branches to solve the real needs of multi-environment deployment and multi-version maintenance.

In the next article we'll look at a more extreme model — **Trunk-Based Development**, which takes the idea that "branches should be short-lived" to its limit.

A small step forward every day is a new height!
