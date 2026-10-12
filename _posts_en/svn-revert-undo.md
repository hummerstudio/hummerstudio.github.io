---
title: SVN Reverting and Undo — What to Do When Something Goes Wrong
date: 2023-04-09
author: Tang Moying
categories: [code]
tags: [SVN, Reverting, Undo]
lang: en
alt_url: /post/svn-revert-undo
---

## 1. Telling the several kinds of "revert" apart

When you use SVN, "reverting" can mean different things:

| Scenario | Description |
|------|------|
| Undoing a local, uncommitted change | You edited a file wrongly and want to get back to the state before your edits |
| Undoing a change that has already been committed | A commit introduced a bug and needs to be taken back |
| Rolling back a whole revision | The entire repository goes back to some historical revision |

These three scenarios are handled in completely different ways; each is explained below.

## 2. Undoing a local, uncommitted change

### Undoing a single file

```bash
svn revert src/main.cpp
```

The file goes back to the state it had at the last `svn update` or `svn commit`. **Note: this cannot be undone.**

### Undoing a whole directory

```bash
svn revert -R .
```

Recursively undoes the changes to every file under the current directory.

### Undoing a new file that was added but not committed

```bash
svn revert new-file.txt
```

For a file that was `svn add`-ed but not committed, `svn revert` cancels the addition.

### Checking what is about to be reverted

It is best to confirm before you revert:

```bash
svn diff src/main.cpp
svn status
```

## 3. Undoing a change that has already been committed (reverse merge)

A change that has already been committed to the repository cannot be deleted directly; it is undone by means of a "reverse merge".

### Finding the revision number you want to undo

```bash
svn log -l 10
```

Suppose you want to undo the change in revision `r1234`:

```bash
svn merge -c -1234 .
```

`-c -1234` means applying the change from revision 1234 in reverse. This operation produces a "reverse change" in your local working copy.

### Confirming and committing

```bash
svn diff     # Check that the reversal is correct
svn commit -m "Undo the change in r1234, which introduced a login bug"
```

### Undoing several revisions

To undo the three consecutive revisions r1234, r1235 and r1236:

```bash
svn merge -r 1236:1233 .
```

The meaning is: apply the changes between revision 1236 and 1233 in reverse (from a higher revision to a lower one = reverse).

## 4. Rolling the whole repository back to a historical revision

If all the changes from some period are problematic and the repository needs to go back to an earlier state:

```bash
# Suppose you want to return to the state at r1000
svn merge -r HEAD:1000 .
svn commit -m "Roll the repository back to revision r1000"
```

This operation applies all the changes made after r1000 in reverse.

## 5. Undoing a merge

### Undoing a merge that has not been committed

```bash
svn revert -R .
```

### Undoing a merge that has been committed

```bash
# Look at the merge's commit log
svn log --stop-on-copy

# Suppose the merge commit is r2000
svn merge -c -2000 .
svn commit -m "Undo the merge in r2000"
```

### Seeing which revisions have already been merged

```bash
svn mergeinfo ^/branches/feature-a --show-revs merged
```

## 6. Practical tips

### Using the TortoiseSVN graphical interface

TortoiseSVN's "Show Log" dialog offers an intuitive way to revert revisions:
- Right-click the revision you want to undo → "Revert changes from this revision"
- You can select several revisions at once and revert them in bulk

### Making a backup before you revert

```bash
# Create a patch of the current state
svn diff > backup.patch

# Or create a branch directly as a backup
svn copy ^/trunk ^/branches/backup-before-revert -m "Backup before reverting"
```

### Seeing what a particular commit changed

```bash
svn diff -c r1234
```

Before doing a reverse merge, first see clearly which files that commit actually changed.

## 7. Handling common mistakes

### Reverting local changes by mistake

If you use `svn revert` and accidentally undo changes you had not backed up, then unfortunately a local revert in SVN cannot be recovered. This shows once again:
- **Check more before committing**: `svn diff` and `svn status`
- **Commit frequently**: do not pile up too many changes

### Still have changes after a revert?

`svn revert` only undoes changes to file contents; it does not delete new files that are not under version control. These files show up in `svn status` as `?`, and they must be deleted by hand or added to `.svnignore`.

```bash
# List files that are not under version control
svn status | grep "^?"

# Clean them up by hand
rm unversioned-file.txt
```

## 8. Quick reference

| Operation | Command |
|------|------|
| Undo uncommitted changes | `svn revert file` |
| Recursively revert a directory | `svn revert -R .` |
| Undo a single revision | `svn merge -c -REV .` |
| Undo consecutive revisions | `svn merge -r HIGH:LOW .` |
| Roll back to a specified revision | `svn merge -r HEAD:REV .` |
| See what a change contains | `svn diff -c REV` |
| See the commit log | `svn log -l 20` |
| See merge information | `svn mergeinfo ^/branches/BRANCH` |

Remember the core principle: **a committed change cannot be deleted, only reverse-merged.** This is an important difference between SVN and Git.

One small step forward every day is a new height!
