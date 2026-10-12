---
title: Git Rebase — Make Your Commit History More Elegant
date: 2023-03-26
author: Tang Moying
categories: [code]
tags: [Git, Git Rebase]
lang: en
alt_url: /post/git-rebase
---

## 1. Rebase vs Merge

In Git there are two ways to integrate the changes from two branches: `merge` and `rebase`.

**Merge** creates a new "merge commit" and keeps the complete branch history:

```
      A---B---C  feature
     /         \
D---E---F---G---H  main
```

**Rebase**, by contrast, "transplants" the commits on the feature branch so that they come after the latest commit on the main branch, forming a linear history:

```
D---E---F---A'---B'---C'  feature
```

The final code is the same either way, but the recorded history is utterly different. Rebase makes the commit history clearer and more linear, and this is also why many open-source projects require contributors to use rebase.

## 2. Basic usage

### Rebasing the current branch onto a target branch

```bash
git checkout feature
git rebase main
```

This "replays" every commit on the feature branch, one by one, after the latest commit on the main branch.

If everything goes smoothly, you will see a clean, linear history.

### Interactive rebase (the most commonly used form)

```bash
git rebase -i HEAD~3
```

This says you want to operate interactively on the last 3 commits. Running it opens an editor showing something like:

```
pick a1b2c3d Add login feature
pick e4f5g6h Fix login bug
pick i7j8k9l Optimize login page styles
```

You can change the command in front of each commit:

| Command | Effect |
|------|------|
| `pick` | Keep the commit (default) |
| `reword` | Keep the commit, but change the commit message |
| `edit` | Keep the commit, but stop so you can change its contents |
| `squash` | Combine into the previous commit, keeping both commit messages |
| `fixup` | Combine into the previous commit, discarding this commit's message |
| `drop` | Delete the commit |

### Combining several commits

```
pick a1b2c3d Add login feature
squash e4f5g6h Fix login bug
squash i7j8k9l Optimize login page styles
```

After you save, these three commits are combined into one commit, and the commit message can be edited again. This is very useful when tidying up the commit history after a feature is finished — folding a series of trivial commits such as "fix typo" or "adjust formatting" into one meaningful commit.

## 3. Resolving conflicts

If a conflict occurs during a rebase, Git pauses and prompts you to resolve it:

```bash
# After resolving the conflict
git add .
git rebase --continue

# If you want to skip this commit
git rebase --skip

# If you want to abandon the whole rebase
git rebase --abort
```

**Important**: during a rebase each commit is applied one at a time, so if there are 10 commits you may have to resolve 10 conflicts. In that case you can consider combining the commits with `squash` first and then rebasing, to reduce the number of conflicts.

## 4. The golden rule and safe practice

> **Never rebase commits that have already been pushed to a public repository!**

Rebase rewrites commit history (it produces new commit hashes). If you rebase commits that have already been pushed and then force-push, the work other collaborators have based on the old commits falls into confusion.

**Safe scenarios for using it:**
- Tidying up commits on your own feature branch, and then pushing
- Rebasing main onto the feature branch before merging into main
- Using `git pull --rebase` instead of `git pull` to keep a linear history

### git pull --rebase

```bash
git pull --rebase
```

is equivalent to:

```bash
git fetch origin
git rebase origin/main
```

This way, pulling remote code does not produce extra merge commits and keeps the history tidy.

You can make it the default behaviour:

```bash
git config --global pull.rebase true
```

## 5. Practical tips

### Undoing a rebase

If you are not satisfied with the result of a rebase, you can use `git reflog` to recover the state from before the rebase:

```bash
git reflog
# Find the HEAD from before the rebase
git reset --hard HEAD@{n}
```

### Rebasing onto a particular commit only

```bash
git rebase --onto main feature~3 feature
```

This means: take all the commits on the feature branch apart from the last 3, and rebase them onto the main branch. It is useful when you need to move part of a branch's commits over to another branch.

## 6. Summary

| Scenario | Recommended approach |
|------|----------|
| Merging a public branch into a feature branch | `git rebase main` |
| Merging a feature branch into a public branch | `git merge feature` |
| Tidying up local, unpushed commits | `git rebase -i` |
| Pulling remote updates | `git pull --rebase` |

Rebase is a powerful tool, but it must be used with care. The core principle: **only rebase your own, unpushed commits**.

One small step forward every day is a new height!
