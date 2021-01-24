---
title: CentOS 7安装PHP
author: 唐明
categories: [PHP]
tags: [PHP, CentOS 7]
---
* TOC
{:toc}

# 安装EPEL仓库

`yum install -y epel-release`

# 安装Remi仓库

`rpm install http://rpms.famillecollet.com/enterprise/remi-release-7.rpm`

<!--以上为摘要内容-->

# 安装yum-utils包

`yum install yum-utils`

# 启用Remi仓库

```
yum-config-manager --enable remi-php72
yum update
```

# 安装php7.2

`yum install php72`

# 安装php模块
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

# 安装后检查

```
php --version
php72 --modules
```

# 开机启动php fpm服务

`systemctl enable php72-php-fpm.service`

# 启动php fpm服务

`systemctl start php72-php-fpm.service`

# 查看php fpm服务状态

`systemctl status php72-php-fpm.service`

# 停止php fpm服务

`systemctl stop php72-php-fpm.service`

# 重启php fpm服务

`systemctl restart php72-php-fpm.service`

>本文首发在微信公众号“DevOps持续交付”上，公众号ID：devopscd，欢迎关注。