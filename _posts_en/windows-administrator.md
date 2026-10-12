---
title: Fix for the Windows administrator User Not Having Administrator Rights
date: 2021-04-24
author: Tang Moying
categories: [deploy]
tags: [Windows]
lang: en
alt_url: /post/windows-administrator
---

Put simply, this is a Windows security policy setting that makes the administrator's administrator rights require approval.

You can change this policy by following these steps:

1. Press Windows+R to open "Run" (or right-click the Start menu and choose "Run"), then type "gpedit.msc" — this opens Group Policy; you can also open it from the Control Panel

1. In Group Policy, find "Computer Configuration" - "Windows Settings" - "Security Settings" - "Local Policies" - "Security Options"

1. Under "Security Options", find the entry "User Account Control - Run all administrators in Admin Approval Mode"

1. Disable this option
