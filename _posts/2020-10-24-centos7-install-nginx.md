---
title: CentOS 7安装Nginx
author: 唐明
categories: [Nginx]
tags: [Nginx, CentOS 7]
---
* TOC
{:toc}

# 配置Nginx仓库

执行命令：

`vi /etc/yum.repos.d/nginx.repo`

添加如下内容：

<!--以上为摘要内容-->

```
[nginx]
name=nginx repo
baseurl=http://nginx.org/packages/mainline/centos/7/$basearch/
gpgcheck=0
enabled=1
```

# 更新仓库索引并安装Nginx

```
yum update
yum install nginx
```

# 开机启动Nginx

`systemctl enable nginx`

# 启动Nginx

`sudo systemctl start nginx`

# 查看Nginx服务状态

`systemctl status nginx`

# 停止Nginx服务

`systemctl stop nginx`

# 重启Nginx服务

`systemctl restart nginx`

# 配置文件路径

`/etc/nginx/conf.d/default.conf`

# 测试配置和重新加载配置

```
nginx -t
nginx -s reload
```

# 其他常用命令

查看端口占用：
`netstat -tlp`
>本文首发在微信公众号“DevOps持续交付”上，公众号ID：devopscd，欢迎关注。