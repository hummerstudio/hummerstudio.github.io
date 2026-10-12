---
title: Enabling Anonymous Access for Windows File Sharing
date: 2022-02-26
author: Tang Moying
categories: [deploy]
tags: [Windows]
lang: en
alt_url: /post/windows-share-files
---

1. Open Run (keyboard shortcut Win+R), type gpedit.msc, click OK, and open the Local Group Policy Editor.
1. Open: "Local Computer Policy -> Computer Configuration -> Windows Settings -> Security Settings -> Local Policies -> User Rights Assignment"
 - Find "Deny access to this computer from the network" and delete "Guest" from the list;
1. Open: "Local Computer Policy -> Computer Configuration -> Windows Settings -> Security Settings -> Local Policies -> Security Options";
 - Find "Network access: Sharing and security model for local accounts" and change it to "Guest only - local users authenticate as Guest";
 - Find "Network access: Let Everyone permissions apply to anonymous users" and change it to "Enabled";
 - Find "Accounts: Guest account status" and change it to "Enabled";
1. Right-click Properties - Sharing tab - Share button, "Choose people to share with", and add the "Guest" user.
