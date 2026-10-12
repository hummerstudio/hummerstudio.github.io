---
title: 'iOS build signing fails with "unable to build chain to self-signed root for signer" and CodeSign failed with a nonzero exit code — how to fix it'
date: 2021-12-22
author: Tang Moying
categories: [build]
tags: [iOS]
lang: en
alt_url: /post/unable-to-build-to-self-signed-root-for-signer
---

The key is this one line: `unable to build chain to self-signed root`

<!--以上为摘要内容-->

It means there is a problem with the Apple developer root certificate.

Under Keychain -- System, there must be one and only one "Apple Worldwide Developer Relations Certificate Authority".

If you cannot see it, check whether the category in the bottom-left corner is selected as "All Items". If an old one is there, delete it.

Then click here to download the latest Apple developer root certificate:

[https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer](https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer)

After downloading, double-click to import it; when prompted for a password, enter the current user's password.

Once the certificate is installed successfully, build again and everything is back to normal!
