---
title: SVN要忽略多个文件/文件夹，怎么配置svn:ignore
author: 唐明
date: 2022-01-04
categories: [SVN]
tags: [SVN]
---
* TOC
{:toc}

需要将所有文件/文件夹写入到文件中，每行一个，再使用`-F`命令指定文件。

类似：
```
svn ps svn:ignore -F IgnoreFileList.txt .
```