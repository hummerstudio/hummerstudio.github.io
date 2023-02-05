---
title: Windows使用批处理命令关闭进程
author: 唐明
categories: [git]
tags: [git]
---
* TOC
{:toc}

在Windows中可以使用`taskkill`命令来终止进程。

<!--以上为摘要内容-->

常用选项：
```
/PID processid 指定要终止的进程的PID。

/IM imagename  指定要终止的进程的名称。

/T             终止指定的进程和由它启用的子进程。

/F             强制终止进程。

/?             显示帮助消息。
```
示例：
```
TASKKILL /IM notepad.exe
TASKKILL /PID 1230 /PID 1241 /PID 1253 /T
TASKKILL /F /IM cmd.exe /T
```