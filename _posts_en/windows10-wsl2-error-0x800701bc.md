---
title: Installing a Linux Distribution in Windows 10 WSL2 Fails with Error 0x800701bc
date: 2023-03-06
author: Tang Moying
categories: [deploy]
tags: [WSL2]
lang: en
alt_url: /post/windows10-wsl2-error-0x800701bc
---

Installing a Linux distribution in Windows 10 WSL2 gives the error WslRegisterDistribution failed with error: 0x800701bc

This error is caused by not downloading and installing the WSL2 Linux kernel update package.

You can download it [here](https://learn.microsoft.com/zh-cn/windows/wsl/install-manual#step-4---download-the-linux-kernel-update-package).

Or download it directly from this link: [https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi](https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi)
