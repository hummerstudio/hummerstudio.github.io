---
title: Configuring nginx to automatically redirect http to https
date: 2021-12-25
author: Tang Moying
categories: [deploy]
tags: [Nginx, https]
lang: en
alt_url: /post/nginx-http-jump-to-https
---

You can refer to the following configuration:
```
server {
    listen 80;
    server_name xxx.com www.xxx.com;
    return 301 https://$host$request_uri;
}
```
