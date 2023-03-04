---
title: Visual Studio安装时，共享路径不能修改
date: 2023-03-04
author: 唐明
categories: [Visual Studio]
tags: [Visual Studio]
---
* TOC
{:toc}

`共享组件、工具和SDK`的路径不能更改

可以通过删除注册表解决，注册表路径：
```
计算机\HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\VisualStudio\Setup
```
右键 `SharedInstallationPath` 和 `CachePath`删除即可。