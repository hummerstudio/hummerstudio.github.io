---
title: What the FTP passive Parameter Does
date: 2021-12-28
author: Tang Moying
categories: [deploy]
tags: [ftp]
lang: en
alt_url: /post/ftp-passive
---

FTP's `passive` parameter is used to enable FTP passive mode.

So what does FTP passive mode mean, is there also an active mode (there is), and how do they differ?

Put simply, in passive mode the data transfer is the “client” connecting to a port on the “server”. In active mode the data transfer is the “server” connecting to a port on the “client”.

FTP defaults to active mode (port mode).
