---
title: 临时和永久关闭firewalld
author: 唐明
date: 2022-06-10
categories: [deploy]
tags: [firewalld]
---

查看firewalld状态：

```
 systemctl status firewalld
```

临时关闭firewalld：
```
 systemctl stop firewalld
```

永久关闭firewalld：

```
 systemctl disable firewalld
```
