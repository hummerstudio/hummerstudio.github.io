---
title: nginx配置http自动跳转https
author: 唐明
date: 2021-12-25
categories: [ops]
tags: [Nginx, https]
---

可参考如下配置：
```
server {
    listen 80;
    server_name xxx.com www.xxx.com;
    return 301 https://$host$request_uri;
}
```
