---
title: Why the sun.misc.BASE64Encoder Class-Not-Found Error Happens and How to Fix It
date: 2023-03-09
author: Tang Moying
categories: [build]
tags: [winget]
lang: en
alt_url: /post/no-class-def-found-error-sun-misc-base64encoder-and-fix
---

When I used the apktool tool to sign an APK, I hit a `sun/misc/BASE64Encoder` error.

The reason is that this class only exists in versions before jdk1.8; from jdk9 onwards it no longer exists.

The JDK version in the environment I checked was 11, so the error shows up.

The fix is clear as well: install JDK8.

Here is a one-command way to install JDK8 on Windows 10 — just run the following in a cmd window:
```
winget install AdoptOpenJDK.OpenJDK.8
```

After installation, the JDK is located at `C:\Program Files\AdoptOpenJDK\jdk-8.0.292.10-hotspot`

