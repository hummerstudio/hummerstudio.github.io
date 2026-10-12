---
title: Using Batch Commands to Kill Processes on Windows
date: 2021-12-20
author: Tang Moying
categories: [build]
tags: [taskkill]
lang: en
alt_url: /post/windows-task-kill
---

On Windows you can use the `taskkill` command to terminate a process.

<!--以上为摘要内容-->

Common options:
```
/PID processid Specifies the PID of the process to terminate.

/IM imagename  Specifies the name of the process to terminate.

/T             Terminates the specified process and the child processes it started.

/F             Forces termination of the process.

/?             Displays the help message.
```
Example:
```
TASKKILL /IM notepad.exe
TASKKILL /PID 1230 /PID 1241 /PID 1253 /T
TASKKILL /F /IM cmd.exe /T
```
