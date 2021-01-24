---
title: CentOS 7安装MariaDB
author: 唐明
categories: [MariaDB]
tags: [MariaDB, CentOS 7]
---
* TOC
{:toc}

# 安装MariaDB

`yum install mariadb-server`

# 设置安全

`mysql_secure_installation`

# 连接数据库

`mysql -u root -p`

输入上一步设置的密码。

# 启动MariaDB

`sudo systemctl start mariadb`

# 查看MariaDB服务状态

`systemctl status mariadb`

# 停止MariaDB服务

`systemctl stop mariadb`

# 重启MariaDB服务

`systemctl restart mariadb`



>本文首发在微信公众号“DevOps持续交付”上，公众号ID：devopscd，欢迎关注。