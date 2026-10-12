---
title: 'Unity Android build error: Android SDK does not include your Target SDK of 28 — cause and fix'
date: 2021-04-22
author: Tang Moying
categories: [build]
tags: [Unity]
lang: en
alt_url: /post/android-sdk-does-not-include-your-target-sdk-of-28
---

This happens because the android-28 SDK is missing; just install it.

The commonly suggested approach is to install Android Studio and then use the SDK Manager to install the missing SDK version. But that is too much trouble, so here is a simple method.

<!--以上为摘要内容-->

As it happens, when you install Unity and tick the Android support option, an Android SDK Manager is downloaded by default. We can simply use this built-in SDK Manager to install it.

What is more, this tool is a command-line tool, so we just type a command.

First, open a CMD window with administrator privileges;

Then, enter the following command:
```
"C:\Program Files\Unity\Hub\Editor\2019.4.30f1\Editor\Data\PlaybackEngines\AndroidPlayer\SDK\tools\bin\sdkmanager.bat" "platforms;android-28"
```

Remember to change the Unity path to the actual path on your own machine.

If the command fails, check whether the CMD window was opened with administrator privileges.
