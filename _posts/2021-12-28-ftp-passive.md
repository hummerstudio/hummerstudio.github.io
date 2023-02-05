---
title: FTP的passive参数的作用
author: 唐明
date: 2021-12-28
categories: [nginx]
tags: [nginx, https]
---
* TOC
{:toc}

FTP的`passive`参数用于开启FTP被动模式。

那么，FTP的被动模式是什么意思，是不是还有主动模式（有），它们有什么区别呢？

简言之，被动模式传送数据是“客户端”连接到“服务器”的端口。主动模式传送数据时是“服务器”连接到“客户端”的端口。

FTP默认为主动模式（port模式）。