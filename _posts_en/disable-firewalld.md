---
title: Temporarily and permanently disabling firewalld
date: 2022-06-10
author: Tang Moying
categories: [deploy]
tags: [firewalld]
lang: en
alt_url: /post/disable-firewalld
---

Check the firewalld status:

```
 systemctl status firewalld
```

Temporarily stop firewalld:
```
 systemctl stop firewalld
```

Permanently disable firewalld:

```
 systemctl disable firewalld
```
