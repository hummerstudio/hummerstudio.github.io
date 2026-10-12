---
title: How to Configure svn:ignore to Ignore Multiple Files/Folders
date: 2022-01-04
author: Tang Moying
categories: [code]
tags: [SVN]
lang: en
alt_url: /post/svn-ignore-files
---

You need to write all the files/folders into a file, one per line, then use the `-F` option to specify that file.

For example:
```
svn ps svn:ignore -F IgnoreFileList.txt .
```
