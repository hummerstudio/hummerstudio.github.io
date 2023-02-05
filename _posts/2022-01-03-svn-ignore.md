---
title: SVN有些目录下的文件想保持不变，怎么忽略？
author: 唐明
date: 2022-01-03
categories: [SVN]
tags: [SVN]
---
* TOC
{:toc}

使用`propset`目录设置`svn:ignore`,可简写为`ps`。

当前目录下忽略.class文件：

```
svn propset svn:ignore *.class .
```