---
title: Unity Android打包报错：Android SDK does not include your Target SDK of 28原因及解决方法
author: 唐明
date: 2021-04-22
categories: [Unity, Android]
tags: [Unity]
---
* TOC
{:toc}

这是因为缺少android-28的SDK，安装即可。

一般介绍的方式是安装Android Studio，再使用SDK Manager来安装缺失版本的SDK。但这样太复杂了，这里介绍一个简单的方法。

<!--以上为摘要内容-->

其实Unity安装时如果勾选了Android支持，默认会下载有一个Android SDK Manager。我们使用这个内置的SDK Manager来安装即可。

并且这个工具是命令行工具，我们简单的敲击命令即可。

首先，以管理员权限打开一个CMD窗口；

然后，输入以下命令：
```
"C:\Program Files\Unity\Hub\Editor\2019.4.30f1\Editor\Data\PlaybackEngines\AndroidPlayer\SDK\tools\bin\sdkmanager.bat" "platforms;android-28"
```

注意将Unity路径修改为你本机的实际路径。

如果执行失败，确认CMD窗口是否使用管理员权限打开的。