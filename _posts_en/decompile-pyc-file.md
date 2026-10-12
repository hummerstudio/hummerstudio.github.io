---
title: Decompiling Python-compiled pyc files back into py files
date: 2023-01-04
author: Tang Moying
categories: [build]
tags: [Python]
lang: en
alt_url: /post/decompile-pyc-file
---

You can use the `uncompyle6` tool.

You can install it directly with pip:

```
pip install uncompyle6
```

The decompile command (two forms):
```
uncompyle6 xxx.pyc > xxx.py
uncompyle6 -o xxx.py xxx.pyc
```

Example:

```
uncompyle6 utils.pyc > utils.py
```
