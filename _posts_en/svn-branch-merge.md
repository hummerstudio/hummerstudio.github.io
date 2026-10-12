---
title: SVN Branching and Merging — The Right Way to Develop on the Trunk
date: 2023-04-02
author: Tang Moying
categories: [code]
tags: [SVN, Branching, Merge]
lang: en
alt_url: /post/svn-branch-merge
---

## 1. The nature of an SVN branch

An SVN branch is fundamentally different from a Git branch. In SVN, a branch is essentially a copy of a directory in the repository. When you create a branch, SVN simply copies the directory structure of the trunk into the `branches/` directory.

The standard SVN repository structure:

```
project/
├── trunk/        # trunk, stable version
├── branches/     # branches directory
│   ├── feature-a/
│   └── release-1.0/
└── tags/         # tags, read-only snapshots
    └── v1.0.0/
```

## 2. Creating a branch

```bash
svn copy https://svn.example.com/project/trunk \
         https://svn.example.com/project/branches/feature-login \
         -m "create login feature branch"
```

Note: `svn copy` is executed on the server side and does not copy files locally. Creating a branch completes instantly, because it only creates a "soft link" pointing to the trunk (a copy-on-write mechanism).

You can also create it in a local working copy:

```bash
svn copy trunk branches/feature-login
svn commit -m "create login feature branch"
```

## 3. Switching branches

```bash
svn switch https://svn.example.com/project/branches/feature-login
```

`svn switch` only updates the files that differ, which is much faster than a fresh checkout.

To see which branch you are currently working on:

```bash
svn info | grep "^URL:"
```

## 4. Merging branches

### Merge trunk updates into the branch (keep in sync)

While working on a feature branch, the trunk may already have new commits. Merge the trunk's changes into the branch periodically, to avoid overly large merge conflicts later:

```bash
# make sure you are in the branch directory
svn merge ^/trunk
svn commit -m "sync the latest trunk changes into the login feature branch"
```

`^/` is shorthand for the repository root.

### Merge the branch back into the trunk (feature complete)

```bash
# switch to the trunk
svn switch ^/trunk

# merge the branch
svn merge ^/branches/feature-login

# commit after checking that all is well
svn commit -m "merge the login feature branch into the trunk"
```

### Viewing merge information

```bash
# view the changes on the branch that have not yet been merged into the trunk
svn mergeinfo ^/branches/feature-login --show-revs eligible

# view the changes that have already been merged
svn mergeinfo ^/branches/feature-login --show-revs merged
```

## 5. Common branching strategies

### Feature branch

```
trunk ──→ create feature-a branch ──→ develop ──→ merge back to trunk
```

Suited to developing an independent feature without affecting the stability of the trunk.

### Release branch

```
trunk ──→ create release-1.0 branch ──→ test, fix bugs ──→ merge back to trunk + tag
```

When feature development is complete and you are ready to release, create a release branch from the trunk. On the release branch, only bug fixes are made, no new features. Bugs that are fixed must also be merged back into the trunk.

### Hotfix branch

```
tag v1.0.0 ──→ create hotfix-xxx branch ──→ fix ──→ merge back to trunk + merge to release branch
```

Used for urgently fixing problems in production; when the fix is complete, it must be merged into both the trunk and the current release branch.

## 6. Handling merge conflicts

When two branches modify the same line of the same file, the merge produces a conflict. SVN generates conflict marker files:

```
file.txt
file.txt.mine       # your version
file.txt.rOLD       # the base version before the merge
file.txt.rNEW       # their version
```

How to resolve them:

```bash
# use your version
svn resolve --accept mine-full file.txt

# use their version
svn resolve --accept theirs-full file.txt

# after resolving manually, mark it as resolved
svn resolve --accept working file.txt
```

A graphical merge tool is recommended:

```bash
svn merge ^/trunk --accept postpone
# after resolving the conflicts manually
svn resolve --accept working file.txt
svn commit -m "resolve the merge conflict"
```

## 7. SVN vs Git branch comparison

| Feature | SVN | Git |
|------|-----|-----|
| Nature of a branch | Directory copy | Pointer |
| Creation speed | Fast (copy-on-write) | Extremely fast |
| Branch switching | `svn switch` | `git checkout` / `git switch` |
| Merge method | Based on revision-number ranges | Based on the commit graph |
| Offline operation | Not supported | Fully supported |
| Learning curve | Relatively simple | Relatively steep |

## 8. Summary

SVN's branching and merging is not as flexible as Git's, but for teams used to centralized version control, it is more intuitive to understand and to operate. Key principles:

- Merge a branch as soon as development on it is done, to avoid a large number of conflicts caused by long separation
- Regularly sync updates from the trunk to the branch
- Before merging, use `svn mergeinfo` to confirm the scope of the differences

A small step forward every day is a new height!
