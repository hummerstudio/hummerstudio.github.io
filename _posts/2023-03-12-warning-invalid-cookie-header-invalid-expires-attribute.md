---
title: Invalid cookie header Invalid 'expires' attribute
date: 2023-03-12
author: 唐明
categories: [Web]
tags: [Java, httpclient5]
---
* TOC
{:toc}

当请求URL返回的cookie中`expires`为如下格式时，
    
```
Expires=Mon, 26 Apr 2021 14:34:27 GMT
```

报错：

```
Invalid 'expires' attribute: Mon, 26 Apr 2021 14:34:27 GMT
```

按网上说法修改`CookiePolicy`或`CookieSpec`，实际都无效果。这是因为使用的httpclient库并不支持这种新格式（定义于`RFC 6265`）。

可以使用`Apache HttpClient5`解决此问题，此版本已支持最新格式。这是一个新版本，有不同的`artifactId`。

Maven中使用如下方式引用依赖：

```
<!-- https://mvnrepository.com/artifact/org.apache.httpcomponents.client5/httpclient5 -->
<dependency>
    <groupId>org.apache.httpcomponents.client5</groupId>
    <artifactId>httpclient5</artifactId>
    <version>5.1.3</version>
</dependency>
<!-- https://mvnrepository.com/artifact/org.apache.httpcomponents.client5/httpclient5-fluent -->
<dependency>
    <groupId>org.apache.httpcomponents.client5</groupId>
    <artifactId>httpclient5-fluent</artifactId>
    <version>5.1.3</version>
</dependency>
```