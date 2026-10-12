---
title: Installing MariaDB on CentOS 7
date: 2020-10-24
author: Tang Moying
categories: [deploy]
tags: [MariaDB, CentOS 7]
lang: en
alt_url: /post/centos7-install-mariadb
---

## Installing MariaDB

`yum install mariadb-server`

## Setting Up Security

`mysql_secure_installation`

## Connecting to the Database

`mysql -u root -p`

Enter the password you set in the previous step.

## Starting MariaDB

`sudo systemctl start mariadb`

## Checking the MariaDB Service Status

`systemctl status mariadb`

## Stopping the MariaDB Service

`systemctl stop mariadb`

## Restarting the MariaDB Service

`systemctl restart mariadb`



>This article was first published on the WeChat official account “DevOps持续交付”, official account ID: devopscd. Welcome to follow.
