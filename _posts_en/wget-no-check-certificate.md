---
title: 'Fixing the wget “unable to verify xxx’s certificate issued by xxxx: the certificate has expired” error when downloading files'
date: 2022-08-13
author: Tang Moying
categories: [deploy]
tags: [wget]
lang: en
alt_url: /post/wget-no-check-certificate
---

You can skip the certificate check by adding the `--no-check-certificate` parameter.

For example, the command that reports the error:
```
wget https://dlcdn.apache.org/maven/maven-3/3.8.5/binaries/apache-maven-3.8.5-bin.tar.gz
```

Change it to:
```
wget --no-check-certificate https://dlcdn.apache.org/maven/maven-3/3.8.5/binaries/apache-maven-3.8.5-bin.tar.gz
```
