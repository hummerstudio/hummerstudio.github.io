---
title: How Do You Copy Files in a Windows Batch File? What Is the Windows Equivalent of Linux's cp Command
date: 2021-12-24
author: Tang Moying
categories: [build]
tags: [copy]
lang: en
alt_url: /post/windows-cp
---

Use the COPY command.

Basic syntax: `COPY [OPTIONS] source  destination`

That is, you just run `COPY 源文件路径 目标路径`. It is similar to the cp command on Linux.

But the Windows COPY command can only copy files, not folders.

The common options are `/V` and `/Y`: `/V` verifies that the new file was written correctly, and `/Y` skips the prompt asking whether to overwrite an existing destination file.
