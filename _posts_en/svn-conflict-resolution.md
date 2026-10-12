---
title: SVN Conflict Resolution in Detail — Say Goodbye to Merge Phobia
date: 2023-04-08
author: Tang Moying
categories: [code]
tags: [SVN, Conflicts, Merge]
lang: en
alt_url: /post/svn-conflict-resolution
---

## 1. When do conflicts arise

SVN conflicts happen in the following situations:

- **Conflict on update**: you modified a file, a colleague also modified the same line of the same file and committed first, and a conflict arises when you run `svn update`.
- **Conflict on merge**: when merging a branch back to the trunk, the two branches modified the same area of the same file.
- **Conflict on switch**: when you `svn switch` to another branch, your local changes conflict with the contents of the target branch.

## 2. Recognising a conflict

When a conflict occurs, SVN generates the following files:

```
file.txt           # the original file with the conflict markers
file.txt.mine      # your local version
file.txt.rOLD      # the base version from before the conflict (BASE)
file.txt.rNEW      # the new version from the server / the other person
```

`svn status` shows a `C` (Conflicted):

```
C       src/main.cpp
?       src/main.cpp.mine
?       src/main.cpp.rOLD
?       src/main.cpp.rNEW
```

The conflict markers in the file look like this:

```
<<<<<<< .mine
your changes
=======
the other person's changes
>>>>>>> .rNEW
```

## 3. Ways to resolve a conflict

SVN provides the `svn resolve` command, with several acceptance strategies:

### Using your version (mine-full)

```bash
svn resolve --accept mine-full src/main.cpp
```

Keep your changes entirely and discard the other person's changes. **Use with caution** — you may cause a colleague's changes to be lost.

### Using their version (theirs-full)

```bash
svn resolve --accept theirs-full src/main.cpp
```

Take the server's / the other person's version entirely and discard your changes. Be careful here too.

### Using the base version (base)

```bash
svn resolve --accept base src/main.cpp
```

Go back to the original version from before the conflict occurred, abandoning both sets of changes.

### Resolving by hand (working)

```bash
# First edit the conflicted file by hand in your editor
vim src/main.cpp

# Once you have confirmed the edits are correct, mark it as resolved
svn resolve --accept working src/main.cpp
```

This is the most recommended approach — review the conflicting content by hand and choose which changes to keep.

## 4. The steps of resolving a conflict by hand

### Step one: update/merge, allowing conflicts

```bash
svn update --accept postpone
# or
svn merge ^/trunk --accept postpone
```

`--accept postpone` makes SVN take no decision automatically and generate all the conflict files for you to review.

### Step two: list all the conflicts

```bash
svn status | grep "^C"
```

### Step three: resolve them one by one

A graphical merge tool will be more efficient:

```bash
# On Windows you can use TortoiseSVN's merge tool
TortoiseMerge file.txt.mine file.txt.rOLD file.txt.rNEW

# or use a general-purpose diff tool
meld file.txt.mine file.txt.rOLD file.txt.rNEW
```

### Step four: clean up the conflict files

After resolving all the conflicts:

```bash
# Delete the .mine, .rOLD and .rNEW temporary files
svn cleanup

# Confirm the status
svn status
```

### Step five: commit

```bash
svn commit -m "Resolve merge conflict"
```

## 5. Text conflicts vs tree conflicts

### Text conflict

The most common case — two versions modified the same line of the same file.

### Tree conflict

This involves changes to the file/directory structure:
- You modified a file and a colleague deleted it
- You added a file and a colleague added a file with the same name
- You moved a file and a colleague modified it

Use `svn info` to look at a tree conflict:

```bash
svn info src/main.cpp
# Look at the "Tree conflict" section
```

The options for resolving a tree conflict:

```bash
# Accept the local version
svn resolve --accept mine-full src/main.cpp

# Accept the remote version
svn resolve --accept theirs-full src/main.cpp

# Handle it by hand
svn resolve --accept working src/main.cpp
```

## 6. Best practices for preventing conflicts

### Update frequently

```bash
# Before you start work each day
svn update

# Update once more before committing
svn update
svn commit
```

The more often you update, the smaller the conflicts are and the easier they are to resolve.

### Commit in small steps

Each commit should contain only one logical change; do not pile up a heap of edits and then commit them. That way, even if a conflict arises, its scope is small.

### Communicate and collaborate

Before modifying a shared file, talk to your team members. Especially configuration files and core modules.

### Isolate work with branches

Develop a big feature on a separate branch so that it is not affected by changes on the trunk during development. Merge it in one go when development is finished, and resolve the conflicts together.

## 7. Quick reference

| Scenario | Command |
|------|------|
| Allow conflicts on update | `svn update --accept postpone` |
| Use the local version | `svn resolve --accept mine-full file` |
| Use the remote version | `svn resolve --accept theirs-full file` |
| Mark as resolved after resolving by hand | `svn resolve --accept working file` |
| List the conflicts | `svn status \| grep "^C"` |
| Look at a tree conflict | `svn info file` |
| Clean up temporary files | `svn cleanup` |
| Abandon all local changes | `svn revert -R .` |

One small step forward every day is a new height!
