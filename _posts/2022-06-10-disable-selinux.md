---
title: 临时和永久关闭selinux
author: 唐明
date: 2022-06-10
categories: [selinux]
tags: [selinux]
---
* TOC
{:toc}

1、临时关闭

执行命令`setenforce 0`临时关闭SELinux

2、永久关闭

 a. 打开selinux配置文件

```
vi /etc/selinux/config
```

 b. 找到`SELINUX=enforcing`，按i进入编辑模式，将参数修改为`SELINUX=disabled`。

 c. 修改完成后，按下键盘`Esc`键，输入命令`:wq`，保存并退出文件即可。

3、运行命令`getenforce`，验证`SELinux`状态为`disabled`，表明`SELinux`已关闭。