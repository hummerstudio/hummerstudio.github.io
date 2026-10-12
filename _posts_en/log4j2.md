---
title: How to Fix the log4j2 Remote Code Execution Vulnerability CVE-2021-44228
date: 2021-12-23
author: Tang Moying
categories: [build]
tags: [log4j2]
lang: en
alt_url: /post/log4j2
---

In short, log4j2 is an open-source project of the Apache Foundation, used for printing logs in Java programs. `Apache Log4j 2` is an upgrade to Log4j; it provides significant improvements over its predecessor Log4j 1.x, and it offers many of the improvements available in Logback, while also fixing some inherent problems in the Logback architecture.

<!--以上为摘要内容-->

`CVE-2021-44228` is the identifier of a remote code execution vulnerability recently exposed in log4j2. A so-called remote code execution vulnerability means that a program has a flaw in the way it handles user input, so that the data entered by the user can be executed (normally it should be treated as data, not as executable code). When user input can be executed, that is almost equivalent to the user having logged in to the server and executing commands there, so you can imagine how serious it is.

`CVE` is the abbreviation of “Common Vulnerabilities & Exposures”, translated into Chinese as “通用漏洞披露”.

### How to fix the remote code execution vulnerability CVE-2021-44228 in log4j2?

Apache has already released an upgraded version of log4j2 that fixes this vulnerability; simply upgrade log4j2 to the latest `2.17.0` version.

Log4j 2 official website: [https://logging.apache.org/log4j/2.x/](https://logging.apache.org/log4j/2.x/)
CVE official website: [https://www.cve.org/](https://www.cve.org/)
