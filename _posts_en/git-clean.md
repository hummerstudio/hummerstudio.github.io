---
title: Deleting Untracked Files from the Git Working Directory
date: 2021-01-17
author: Tang Moying
categories: [code]
tags: [Git]
lang: en
alt_url: /post/git-clean
---

## 1. Background

While debugging code you may add a lot of files under the current git working directory, and once you have achieved your goal you want to restore the code to its initial state.

`make` has the `make clean` command, `mvn` has `mvn clean`, and `jekyll` has `jekyll clean`.

So does git have a `git clean` command?

The answer is yes!

git-clean - Delete untracked files from the working tree

## 2. git clean -n

This is git clean's dry-run mode. It does not actually delete files; it only lists what would be deleted if you really ran it.
We can run this command first and compare its output with what we expect.

## 3. git clean -df

Clears the untracked files from the working directory.

## 4. Advanced usage

The `-e` option lets you exclude more files based on an expression.
