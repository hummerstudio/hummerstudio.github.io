
---
title: iOS打包签名报unable to build chain to self-signed root for signer，CodeSign failed with a nonzero exit code解决办法
author: 唐明
date: 2021-12-22
categories: [iOS]
tags: [iOS]
---
* TOC
{:toc}

关键在于这一句：`unable to build chain to self-signed root`

<!--以上为摘要内容-->

说明是苹果开发者根证书有问题。

在钥匙串--系统处，有且只能有一个“Apple Worldwide Developer Relations Certificate Authority”。

如果看不到，检查左下角的种类是否选中为“所有项目”。已有旧的请删除。

然后点此下载最新的苹果开发者根证书：

[https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer](https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer)

下载后双击导入，提示输入密码时请输入当前用户密码。

证书安装成功后，再次打包，就恢复正常了！