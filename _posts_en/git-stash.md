---
title: Git Stash — Temporarily Shelving Changes in the Working Tree
date: 2023-03-25
author: Tang Moying
categories: [code]
tags: [Git, Git Stash]
lang: en
alt_url: /post/git-stash
---

## 1. What is git stash

In day-to-day development, you often run into this situation: you are developing a new feature on one branch, half-way through the code, when suddenly you need to switch to another branch to fix an urgent bug. But the current changes are not complete yet, and you don't want to commit them or throw them away.

`git stash` was designed for exactly this scenario — it can temporarily "stash away" the changes in the current working tree and staging area, restoring the working directory to a clean state, and then restore them after you have finished handling other things.

## 2. Basic usage

### Stashing changes

```bash
git stash
```

Or with a description message, to make it easier to find later:

```bash
git stash push -m "WIP: refactoring the user module"
```

Note: by default `git stash` only stashes changes to tracked files. To include untracked files (newly created files), you need to add the `-u` parameter:

```bash
git stash -u
```

### Viewing the stash list

```bash
git stash list
```

The output looks something like:

```
stash@{0}: On feature-login: WIP: 正在重构用户模块
stash@{1}: On main: 临时保存配置修改
```

`stash@{0}` is the most recent stash, `stash@{1}` is the one before it, and so on. It is a stack structure, last in, first out.

### Restoring a stash

**Restore and keep the stash record:**

```bash
git stash apply
```

Restores the most recent stash, but the stash record is still kept in the list.

**Restore and delete the stash record:**

```bash
git stash pop
```

Restores the most recent stash and removes that record from the list at the same time. This is the most commonly used approach.

**Restore a specific stash:**

```bash
git stash apply stash@{1}
```

### Deleting a stash

```bash
# delete the most recent stash
git stash drop

# delete a specific stash
git stash drop stash@{1}

# clear all stashes
git stash clear
```

## 3. Advanced techniques

### Stashing only some files

```bash
git stash push -m "only stash the controller changes" -- src/controllers/
```

The file path following `--` lets you specify that only certain files are stashed.

### Choosing interactively in patch mode

```bash
git stash push -p
```

It shows each change block (hunk) one by one and lets you choose whether to stash it. This is very useful when you only want to stash part of the changes.

### Creating a new branch from a stash

```bash
git stash branch new-branch-name
```

This creates a new branch based on the commit at the time of stashing, checks out the changes from the time of stashing, and then deletes that stash. It is very convenient when, after stashing, you find that these changes would be better off on a separate branch.

### Viewing the contents of a stash

```bash
# view which files the stash changed
git stash show

# view the detailed diff
git stash show -p

# view the diff of a specific stash
git stash show -p stash@{1}
```

## 4. Common scenarios

### Scenario one: an urgent bug fix

```bash
# currently on the feature branch, with uncommitted changes
git stash

# switch to the main branch to fix the bug
git checkout main
# ... fix the bug, commit ...

# go back to the feature branch and continue working
git checkout feature
git stash pop
```

### Scenario two: cleaning the working tree before pulling remote code

```bash
# stash the local changes first
git stash

# pull the remote code
git pull --rebase

# restore the local changes
git stash pop
```

If there are conflicts, `git stash pop` will prompt you to resolve them manually, and the stash record will not be deleted automatically.

### Scenario three: moving uncommitted changes between multiple branches

```bash
# you made the changes on the wrong branch
git stash
git checkout correct-branch
git stash pop
```

## 5. Things to watch out for

- The content that `git stash` stores is **global** and does not belong to any particular branch. So running `git stash pop` on any branch will restore it.
- If there is a conflict during `pop`, the stash record is not deleted automatically, and you need to clear it manually with `git stash drop`.
- Don't rely on stash as long-term storage — it is only a temporary holding place. If the changes are important, you should commit them or push them to a remote branch as soon as possible.
- A stash is based on a commit, and the stashed content will not show up in `git log`.

A small step forward every day is a new height!
