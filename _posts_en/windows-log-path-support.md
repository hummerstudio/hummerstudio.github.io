---
title: Enabling Long Path Support on Windows 10
date: 2022-02-24
author: Tang Moying
categories: [deploy]
tags: [Windows]
lang: en
alt_url: /post/windows-log-path-support
---

1. Make sure the operating system version number is greater than `14352`;

     * The detailed version number of the operating system can be found under “Version” in “Control Panel - Administrative Tools - System Information”.

2. Open `Gpedit.msc` from the Run window;

3. Open `本地计算机策略 - 计算机配置 - 管理模板 - 系统 - 文件系统` in order, find `启用 Win32 长路径` and set it to `已启用`.
