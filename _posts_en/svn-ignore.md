---
title: How do I ignore files in certain SVN directories so they stay unchanged?
date: 2022-01-03
author: Tang Moying
categories: [code]
tags: [SVN]
lang: en
alt_url: /post/svn-ignore
---

Use `propset` on a directory to set `svn:ignore`, which can be abbreviated as `ps`.

Ignore .class files in the current directory:

```
svn propset svn:ignore *.class .
```
