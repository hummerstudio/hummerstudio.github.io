---
title: Installing PHP on CentOS 7
date: 2020-10-24
author: Tang Moying
categories: [deploy]
tags: [PHP, CentOS 7]
lang: en
alt_url: /post/centos7-install-php
---

## Install the EPEL repository

`yum install -y epel-release`

## Install the Remi repository

`rpm install http://rpms.famillecollet.com/enterprise/remi-release-7.rpm`

<!--以上为摘要内容-->

## Install the yum-utils package

`yum install yum-utils`

## Enable the Remi repository

```
yum-config-manager --enable remi-php72
yum update
```

## Install php7.2

`yum install php72`

## Install PHP modules
```
yum install php72-php-fpm
yum install php72-php-gd.x86_64
yum install ImageMagick
yum install php72-php-mysql
yum install php72-php-pdo
yum install php72-php-fpm
yum install php72-php-mbstring
yum install php72-php-xml
yum install php72-php-xmlrpc
yum install php72-php-opcache
yum install php-mysqlnd
```

## Check after installation

```
php --version
php72 --modules
```

## Enable the php fpm service at boot

`systemctl enable php72-php-fpm.service`

## Start the php fpm service

`systemctl start php72-php-fpm.service`

## Check the php fpm service status

`systemctl status php72-php-fpm.service`

## Stop the php fpm service

`systemctl stop php72-php-fpm.service`

## Restart the php fpm service

`systemctl restart php72-php-fpm.service`

>This article was first published on the WeChat official account "DevOps持续交付" (DevOps Continuous Delivery), account ID: devopscd. Welcome to follow.
