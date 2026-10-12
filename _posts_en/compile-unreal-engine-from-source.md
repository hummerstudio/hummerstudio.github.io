---
title: Compiling Unreal Engine from Source (UE4/UE5)
date: 2022-04-14
author: Tang Moying
categories: [build]
tags: [UE4, UE5]
lang: en
alt_url: /post/compile-unreal-engine-from-source
---

1. Download the source code
2. If what you downloaded is a compressed archive, decompress it first, then run Setup.bat (on Windows)
This step downloads and installs a great many dependencies, and the script supports multithreaded downloading, so using multithreaded downloading is recommended. Run the command from a console, for example:
```
setup.bat --threads=20
```
3. Run GenerateProjectFiles.bat to generate the project files
4. Double-click UE4.sln (UE5.sln) to open the project with Visual Studio
5. (Important) Set the solution configuration to `Development Editor` and the solution platform to `Win64`
6. Right-click the UE4 (UE5) target and select `生成`

The compilation method is the same for UE4 and UE5.
