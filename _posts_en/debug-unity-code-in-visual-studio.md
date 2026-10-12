---
title: Debugging Unity Code in Visual Studio
date: 2022-01-06
author: Tang Moying
categories: [build]
tags: [Unity]
lang: en
alt_url: /post/debug-unity-code-in-visual-studio
---

1. In Unity > Preferences > External Tools, set `External Script Editor` to Visual Studio (make sure the `Editor Attaching` option is checked

2. In Visual Studio, set a breakpoint on the line where you want the debugger to stop.

3. In Visual Studio, attach the code editor to the Unity Editor.

![AttachToUnity](https://docs.unity3d.com/cn/2019.4/uploads/Main/MCDAttachToUnity.png)

4. In Unity, enter play mode.


For details, see the official documentation: [https://docs.unity3d.com/cn/2019.4/Manual/ManagedCodeDebugging.html](https://docs.unity3d.com/cn/2019.4/Manual/ManagedCodeDebugging.html)
