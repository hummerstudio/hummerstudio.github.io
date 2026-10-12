---
title: Invalid cookie header Invalid 'expires' attribute
date: 2023-03-12
author: Tang Moying
categories: [build]
tags: [Java, httpclient5]
lang: en
alt_url: /post/warning-invalid-cookie-header-invalid-expires-attribute
---

When the `expires` in the cookie returned by the requested URL has the following format,
    
```
Expires=Mon, 26 Apr 2021 14:34:27 GMT
```

The error is:

```
Invalid 'expires' attribute: Mon, 26 Apr 2021 14:34:27 GMT
```

Modifying `CookiePolicy` or `CookieSpec` the way people online suggest has no effect in practice. This is because the httpclient library being used does not support this new format (defined in `RFC 6265`).

You can use `Apache HttpClient5` to solve this problem; this version already supports the latest format. It is a new version with a different `artifactId`.

Reference the dependency in Maven as follows:

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
