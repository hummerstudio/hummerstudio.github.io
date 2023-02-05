---
title: wget下载文件报错“无法验证xxx的由xxxx颁发的证书：颁发的证书已经过期”的解决方法
author: 唐明
date: 2022-08-13
categories: [wget]
tags: [wget]
---
* TOC
{:toc}

可忽略证书检查，增加`--no-check-certificate`参数。

例如，报错命令：
```
wget https://dlcdn.apache.org/maven/maven-3/3.8.5/binaries/apache-maven-3.8.5-bin.tar.gz
```

修改为：
```
wget --no-check-certificate https://dlcdn.apache.org/maven/maven-3/3.8.5/binaries/apache-maven-3.8.5-bin.tar.gz
```