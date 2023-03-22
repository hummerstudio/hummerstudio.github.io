---
title: 不打开编辑器配置UE4 Android NDK SDK和JDK
date: 2023-03-11
author: 唐明
categories: [UE]
tags: [winget]
---
* TOC
{:toc}

为什么不打开编辑器呢？

因为构建机GPU配置太差了，打不开……

这里介绍个直接修改UE4配置文件的方法。

在`BaseEngine.ini`中，设置如下变量即可：
```ini
[/Script/AndroidPlatformEditor.AndroidSDKSettings]
SDKAPILevel=latest
NDKAPILevel=android-21
SDKPath=(Path="D:/Android/SDK")
NDKPath=(Path="D:/Android/NDK")
JavaPath=(Path="D:/Android/OpenJDK")
```

特别注意JDK路径的`Key`是`JavaPath`，而非官方文档上写的`JDKPath`，我这里使用的为UE4.27，测试可用。