---
title: GeForce Experience要登录才能使用，又总是注册不成功，绕过/禁用登录方法
author: 唐明
date: 2022-09-19
categories: [GeForce Experience]
tags: [GeForce Experience]
---
* TOC
{:toc}

按如下步骤操作：

1. 使用`Visual Studio Code`打开`C:\Program Files\NVIDIA Corporation\NVIDIA GeForce Experience\www\app.js`

2. 替换文本。开启正则匹配。将`"choose"===\w\.nvActiveAuthView[\D]*\)\}`替换为
```
"choose"===this.nvActiveAuthView)};this.handleLoggedIn({sessionToken:"",userToken:"",user: {core:{displayName:"codefaq.cn",primaryEmailVerified: true}}});
```

3. 重启GeForce Experience即可。