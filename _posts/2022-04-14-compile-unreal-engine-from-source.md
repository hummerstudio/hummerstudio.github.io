---
title: 源码编译虚幻引擎（UE4/UE5)
author: 唐明
date: 2022-04-14
categories: [UE]
tags: [UE4,UE5]
---
* TOC
{:toc}

1、下载源代码
2、如果下载的是压缩包，先解压缩，然后运行Setup.bat（Windows系统下）
该步骤会下载并安装很多依赖，该脚本支持多线程下载，建议使用多线程下载。从控制台执行命令，如：
```
setup.bat --threads=20
```
3、运行GenerateProjectFiles.bat来生成项目文件
4、双击UE4.sln（UE5.sln）使用Visual Studio打开项目
5、（重点）将解决方案配置设置为`Development Editor`，解决方案平台设置为`Win64`
6、右键单击UE4（UE5）目标并选择`生成`

UE4和UE5的编译方法相同。