---
title: Windows通过注册表添加开机启动项
date: 2022-10-02
categories: [Windows]
tags: [开机启动]
---
* TOC
{:toc}

1、快捷键`Ctrl+R`打开“运行”，输入`regedit`打开注册表

2、找到`\HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run`

3、右键“新建”，选择`字符串值`

4、名称根据实际情况填写，完成后双击填写`数值数据`，这里填要启动的可执行文件或脚本即可
