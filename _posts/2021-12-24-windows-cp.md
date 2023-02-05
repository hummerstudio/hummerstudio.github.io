---
title: Windows批处理Batch怎么复制文件？Windows下类似Linux cp的命令是什么
author: 唐明
date: 2021-12-24
categories: [Batch]
tags: [copy]
---
* TOC
{:toc}

使用COPY命令。

基本语法：`COPY [OPTIONS] source  destination`

即直接`COPY 源文件路径 目标路径`即可。和Linux的cp命令类似。

但Windows的COPY命令只能复制文件，不能复制文件夹。

常用选项有`/V`和`/Y`，`/V`是验证新文件写入是否正确，`/Y`是不使用确认是否要覆盖现有目标文件的提示。