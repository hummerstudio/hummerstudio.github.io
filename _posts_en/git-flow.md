---
title: 'Git Branching Models (Part 1): Git Flow'
date: 2023-06-10
author: Tang Moying
categories: [code]
tags: [Git, Git Flow, Branching Models]
lang: en
alt_url: /post/git-flow
---

## 1. What Is a Branching Model

In team collaboration, code management is inseparable from branches. But how branches are created, how they are merged, and when a release goes out — without a set of conventions, things quickly turn into a mess. A branching model is exactly that convention for how a team manages branches: it specifies which branches exist long-term, how branches merge into one another, and how the release process runs.

Git itself is only a tool; it doesn't force you to use it in any particular way. What really determines collaboration efficiency is the branching model the team chooses.

There are four common branching models: Git Flow, GitHub Flow, GitLab Flow and Trunk-Based Development. This series introduces each of them in turn, along with their characteristics and where they fit.

## 2. Overview of Git Flow

Git Flow was proposed by Vincent Driessen in 2010 and is the earliest and most classic branching model. It defines a strict set of branch management rules, suited to projects with a fixed release cycle.

Git Flow defines two kinds of long-lived branches and three kinds of short-lived branches:

**Long-lived branches (always present):**

- **`main` (or `master`)**: holds code that can be released to production at any time. Every merge into `main` means a new version is released.
- **`develop`**: the main development line; all feature branches are cut from here and merged back here when finished.

**Short-lived branches (deleted once used):**

- **`feature/xxx`**: feature branches, cut from `develop` and merged back into `develop` when development is done.
- **`release/x.x.x`**: release branches, cut from `develop`, used for pre-release testing and bug fixes, then merged into both `main` and `develop`.
- **`hotfix/x.x.x`**: hotfix branches, cut from `main` to urgently fix bugs in production, then merged into both `main` and `develop`.

## 3. The Workflow

```
main:    v1.0 ───────────────────────────── v1.0.1 ────────── v1.1
          │                                    ▲                ▲
          │ hotfix/1.0.1 ──────────────────────┘                │
          │                                                     │
develop:  ├── v1.0 ──────────────────────────────┬──────────────┤
          │          \                \           │              │
          │     feature/A ────────────┐          │              │
          │                     feature/B ────────┤              │
          │                                      │              │
          │                         release/1.1 ─┘              │
```

### Feature Development (feature)

```bash
# Cut a feature branch from develop
git checkout -b feature/user-login develop

# Merge back into develop when development is done
git checkout develop
git merge --no-ff feature/user-login
git branch -d feature/user-login
```

`--no-ff` disables fast-forward merging and always creates a merge commit, so that the history clearly shows where a feature branch started and ended.

### The Release Process (release)

```bash
# Cut a release branch from develop
git checkout -b release/1.1.0 develop

# On the release branch, only fix bugs, never change features
# Once the fixes are done, merge into main and develop
git checkout main
git merge --no-ff release/1.1.0
git tag -a v1.1.0 -m "Release v1.1.0"

git checkout develop
git merge --no-ff release/1.1.0

git branch -d release/1.1.0
```

### Hotfixes (hotfix)

```bash
# Cut a hotfix branch from main
git checkout -b hotfix/1.0.1 main

# After fixing the bug, merge into main and develop
git checkout main
git merge --no-ff hotfix/1.0.1
git tag -a v1.0.1 -m "Hotfix v1.0.1"

git checkout develop
git merge --no-ff hotfix/1.0.1

git branch -d hotfix/1.0.1
```

The difference between a hotfix branch and a release branch is this: hotfixes are cut from `main` (an emergency fix in production), while release branches are cut from `develop` (a planned release).

## 4. Where It Fits

Git Flow suits the following situations:

- **A fixed release cycle**: for example one version a month, or one iteration every two weeks.
- **Maintaining several versions in parallel**: you need to maintain multiple production versions at the same time (such as v1.0 and v2.0).
- **A larger team**: many people collaborating, requiring a strict branch management discipline.
- **Traditional software delivery**: client software, SDKs and other projects that need explicit version numbers.

## 5. Git Flow Tooling

Besides running the commands above by hand, you can use the `git-flow` extension to simplify things:

```bash
# Install git-flow (bundled on Windows / macOS: brew install git-flow)
git flow init          # Initialize, set the branch prefixes
git flow feature start user-login   # Create a feature branch
git flow feature finish user-login  # Finish the feature branch (merges into develop automatically)
git flow release start 1.1.0        # Create a release branch
git flow release finish 1.1.0       # Finish the release (merges into main and develop, creates the tag)
git flow hotfix start 1.0.1         # Create a hotfix branch
git flow hotfix finish 1.0.1        # Finish the hotfix
```

## 6. Pros and Cons

**Pros:**

- Clear rules, with each branch's responsibility well defined
- Suits projects with a fixed release cycle
- Branch history is traceable, which makes it easy to look back

**Cons:**

- Many branch types and fiddly operations; small teams will find it heavy
- A long release process, unsuited to continuous deployment
- `develop` and `main` both live on forever, which easily produces large numbers of merge commits

## 7. Summary

Git Flow is a rigorous branch management model: it maps the different phases of software development (development, testing, release, hotfix) onto different branches, so the whole process has rules to follow. If your team has a clear release rhythm, Git Flow is a good choice.

But its complexity is obvious as well. In the next article we'll look at the lighter-weight **GitHub Flow**.

A small step forward every day is a new height!
