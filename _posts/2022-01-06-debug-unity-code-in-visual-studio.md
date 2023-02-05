---
title: 在Visual Studio中调试Unity的代码
author: 唐明
date: 2022-01-06
categories: [Unity]
tags: [Unity]
---
* TOC
{:toc}

1、 在 Unity > Preferences > External Tools中，将`External Script Editor`设置为Visual Studio（确保勾选了`Editor Attaching`选项

2、在Visual Studio中，根据希望停止调试器的代码行，设置断点。

3、在Visual Studio中，将代码编辑器连接到Unity Editor。

![AttachToUnity](https://docs.unity3d.com/cn/2019.4/uploads/Main/MCDAttachToUnity.png)

4、在Unity中进入播放模式。


详情参考官方文档：[https://docs.unity3d.com/cn/2019.4/Manual/ManagedCodeDebugging.html](https://docs.unity3d.com/cn/2019.4/Manual/ManagedCodeDebugging.html)