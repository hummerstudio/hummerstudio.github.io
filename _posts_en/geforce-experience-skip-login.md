---
title: 'GeForce Experience Requires Login and Registration Keeps Failing: How to Bypass or Disable Login'
date: 2022-09-19
author: Tang Moying
categories: [deploy]
tags: [GeForce Experience]
lang: en
alt_url: /post/geforce-experience-skip-login
---

Follow these steps:

1. Use `Visual Studio Code` to open `C:\Program Files\NVIDIA Corporation\NVIDIA GeForce Experience\www\app.js`

2. Replace the text. Turn on regex matching. Replace `"choose"===\w\.nvActiveAuthView[\D]*\)\}` with
```
"choose"===this.nvActiveAuthView)};this.handleLoggedIn({sessionToken:"",userToken:"",user: {core:{displayName:"codefaq.cn",primaryEmailVerified: true}}});
```

3. Just restart GeForce Experience.
