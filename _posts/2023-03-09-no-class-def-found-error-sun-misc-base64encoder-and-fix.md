---
title: 找不到sun.misc.BASE64Encoder类报错原因及修复方法
date: 2023-03-09
author: 唐明
categories: [Android]
tags: [winget]
---
* TOC
{:toc}

调用apktool工具签名apk时遇到`sun/misc/BASE64Encoder`报错。

是因为此类只在jdk1.8之前的版本存在，jdk9以后的版本，就不存在了。

检查环境的JDK版本为11，所以会报错。

解决办法也明了，安装JDK8。

这里介绍个Windows 10下一键安装JDK8的方法，直接cmd窗口执行以下命令即可：
```
winget install AdoptOpenJDK.OpenJDK.8
```

安装后，JDK位于`C:\Program Files\AdoptOpenJDK\jdk-8.0.292.10-hotspot`

