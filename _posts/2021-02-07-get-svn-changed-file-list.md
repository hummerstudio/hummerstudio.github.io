---
title: 使用Windows批处理Batch脚本获取SVN变更文件列表
author: 唐明
date: 2021-02-07
categories: [svn]
tags: [svn]
---
* TOC
{:toc}

`for /f "tokens=2" %%i in ('svn status') do echo %%i`

如果是在cmd命令行界面使用，则将`%%I`替换为`%i`，即：

`for /f "tokens=2" %i in ('svn status') do echo %i`