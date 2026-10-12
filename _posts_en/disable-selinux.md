---
title: Temporarily and Permanently Disabling SELinux
date: 2022-06-10
author: Tang Moying
categories: [deploy]
tags: [selinux]
lang: en
alt_url: /post/disable-selinux
---

1. Temporarily disable

Run the command `setenforce 0` to temporarily disable SELinux

2. Permanently disable

 a. Open the selinux config file

```
vi /etc/selinux/config
```

 b. Find `SELINUX=enforcing`, press i to enter edit mode, and change the parameter to `SELINUX=disabled`.

 c. When you are done, press the `Esc` key, type the command `:wq`, and the file is saved and closed.

3. Run the command `getenforce` and verify that `SELinux` is `disabled`, which means `SELinux` is turned off.
