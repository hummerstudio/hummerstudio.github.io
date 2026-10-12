---
title: Git Bisect — Quickly Locating the Problem Commit with Binary Search
date: 2023-04-01
author: Tang Moying
categories: [code]
tags: [Git, Git Bisect, Debugging]
lang: en
alt_url: /post/git-bisect
---

## 1. The problem scenario

One day you find a bug but don't know which commit introduced it. The repository has hundreds of commits, and checking them one by one with checkout is obviously unrealistic.

This is where `git bisect` comes in handy — it uses binary search to automatically narrow the range for you and quickly locate the commit that introduced the bug.

## 2. Basic usage

Suppose the current version has a problem, and you know that the version with the `v1.0` tag is fine. Among `n` commits, binary search needs only about `log₂n` steps to locate it. For example, 100 commits take only about 7 steps.

### Starting bisect

```bash
git bisect start
```

### Marking the bad commit (the current version)

```bash
git bisect bad HEAD
```

### Marking the good commit (the version known to be fine)

```bash
git bisect good v1.0
```

After that, Git automatically checks out a commit in the middle. You need to test that version:

- If it has the bug → `git bisect bad`
- If it is fine → `git bisect good`

Git keeps narrowing the range, and after a few repetitions it finally tells you:

```
a1b2c3d4 is the first bad commit
```

### Ending bisect

```bash
git bisect reset
```

This returns the repository to the state it was in before bisect.

## 3. Automated bisect

If you can determine through a script whether the bug exists, you can run it fully automatically:

```bash
git bisect start HEAD v1.0
git bisect run ./test-script.sh
```

The exit code of `test-script.sh` determines the result:
- Exit code `0` → this commit is good
- Exit code `1~127` (excluding 125) → this commit is bad
- Exit code `125` → this commit cannot be tested, skip it

### A real example

For example, some unit test fails, and you know that it passed at v1.0:

```bash
git bisect start HEAD v1.0
git bisect run npm test -- --testPathPattern=UserLogin
```

Git will automatically binary-search until it finds the first commit that caused the test to fail.

## 4. Advanced usage

### Skipping commits that cannot be tested

Some commits may not compile or may not be able to run the tests:

```bash
git bisect skip
```

Git skips this commit and picks another one nearby to continue testing.

### Using replacement terms

If you find good/bad not intuitive enough, you can use other terms:

```bash
git bisect start --term-old=fast --term-new=slow
git bisect slow   # current version is slow (has a performance problem)
git bisect fast v1.0  # v1.0 is fast
```

### Viewing the bisect log

```bash
git bisect log
```

You can view the whole bisect process, which is convenient for reviewing it afterwards or sharing it with colleagues.

### Visualizing the bisect process

```bash
git bisect visualize
```

This opens `gitk` (if it is installed) and shows the current binary-search range graphically, so you can intuitively see how many commits are left to check.

## 5. Practical tips

### Confirming the range

Before starting bisect, make sure you know one "good" commit and one "bad" commit. If you are not sure where the earliest bad commit is, you can start from `HEAD~50` or from some earlier tag.

### Choosing a suitable test method

- **Simple bugs**: manual testing is enough, using `git bisect good/bad`
- **Scriptable cases**: write an automated script and use `git bisect run`
- **Compilation errors**: just determine whether it compiles successfully

### Saving progress mid-way

If the bisect process is very long, you can record the state:

```bash
git bisect log > bisect.log
# restore later
git bisect replay bisect.log
```

## 6. Summary

`git bisect` is one of the most underrated features in Git. When you face a situation where you "don't know which commit the problem started with", it can save a great deal of time.

**When to use it**:
- Locating regression bugs
- Locating performance regressions
- Locating compilation errors
- Any problem that is "fine before, not fine now"

Remember this little mnemonic: **locate by binary search — good means good, bad means bad, and at most log₂n steps will find the culprit.**

A small step forward every day is a new height!
