---
title: Adding a Startup Item on Windows via the Registry
date: 2022-10-02
author: Tang Moying
categories: [deploy]
tags: [Startup]
lang: en
alt_url: /post/window-start-program-when-boot
---

1. Use the `Ctrl+R` shortcut to open "Run", then type `regedit` to open the registry

2. Find `\HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run`

3. Right-click "New" and choose `字符串值`

4. Fill in the name according to your situation, then double-click it and fill in `数值数据` — here you just put the executable file or script you want to start
