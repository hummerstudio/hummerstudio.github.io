---
title: Gradle禁用daemon
date: 2022-12-14
author: 唐明
categories: [Gradle]
tags: [Gradle]
---
* TOC
{:toc}

gradle使用daemon相当于热启动，可以节省构建时间。但在持续集成环境下为了保证环境一致性，或避免daemon进程冲突，可以禁用deamon功能。

在`${HOME}/.gradle/gradle.properties`文件中添加：
```
org.gradle.daemon=false
```