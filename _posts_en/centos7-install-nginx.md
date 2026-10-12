---
title: Installing Nginx on CentOS 7
date: 2020-10-24
author: Tang Moying
categories: [deploy]
tags: [Nginx, CentOS 7]
lang: en
alt_url: /post/centos7-install-nginx
---

## Configure the Nginx Repository

Run the command:

`vi /etc/yum.repos.d/nginx.repo`

Add the following content:

<!--以上为摘要内容-->

```
[nginx]
name=nginx repo
baseurl=http://nginx.org/packages/mainline/centos/7/$basearch/
gpgcheck=0
enabled=1
```

## Update the Repository Index and Install Nginx

```
yum update
yum install nginx
```

## Enable Nginx at Boot

`systemctl enable nginx`

## Start Nginx

`sudo systemctl start nginx`

## Check the Nginx Service Status

`systemctl status nginx`

## Stop the Nginx Service

`systemctl stop nginx`

## Restart the Nginx Service

`systemctl restart nginx`

## Configuration File Path

`/etc/nginx/conf.d/default.conf`

## Test the Configuration and Reload It

```
nginx -t
nginx -s reload
```

## Other Common Commands

Check port usage:
`netstat -tlp`
>This article was first published on the WeChat official account “DevOps持续交付” (DevOps Continuous Delivery), account ID: devopscd, welcome to follow.
