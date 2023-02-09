---
title: 反编译python编译好的pyc文件为py文件
date: 2023-01-04
author: 唐明
categories: [python]
tags: [python]
---
* TOC
{:toc}

可以使用`uncompyle6`工具

使用pip可以直接安装：

```
pip install uncompyle6
```

反编译命令(两种形式):
```
uncompyle6 xxx.pyc > xxx.py
uncompyle6 -o xxx.py xxx.pyc
```

示例：

```
uncompyle6 utils.pyc > utils.py
```