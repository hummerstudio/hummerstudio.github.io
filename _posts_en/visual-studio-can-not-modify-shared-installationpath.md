---
title: The Shared Path Cannot Be Modified During Visual Studio Installation
date: 2023-03-04
author: Tang Moying
categories: [deploy]
tags: [Visual Studio]
lang: en
alt_url: /post/visual-studio-can-not-modify-shared-installationpath
---

The path for `共享组件、工具和SDK` cannot be changed.

You can fix this by deleting the registry key. The registry path is:
```
计算机\HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\VisualStudio\Setup
```
Just right-click `SharedInstallationPath` and `CachePath` and delete them.
