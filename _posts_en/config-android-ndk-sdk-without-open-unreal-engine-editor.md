---
title: Configuring the UE4 Android NDK, SDK and JDK Without Opening the Editor
date: 2023-03-11
author: Tang Moying
categories: [build]
tags: [winget]
lang: en
alt_url: /post/config-android-ndk-sdk-without-open-unreal-engine-editor
---

Why not open the editor?

Because the build machine's GPU is too poor, it won't open...

Here is a way to edit the UE4 config file directly.

In `BaseEngine.ini`, just set the following variables:
```ini
[/Script/AndroidPlatformEditor.AndroidSDKSettings]
SDKAPILevel=latest
NDKAPILevel=android-21
SDKPath=(Path="D:/Android/SDK")
NDKPath=(Path="D:/Android/NDK")
JavaPath=(Path="D:/Android/OpenJDK")
```

Note in particular that the `Key` for the JDK path is `JavaPath`, not `JDKPath` as written in the official documentation. I am using UE4.27 here, and it tests out fine.
