---
title: Using a Windows batch script to get the list of changed SVN files
date: 2021-02-07
author: Tang Moying
categories: [code]
tags: [SVN]
lang: en
alt_url: /post/get-svn-changed-file-list
---

`for /f "tokens=2" %%i in ('svn status') do echo %%i`

If you are using it in the cmd command-line interface, replace `%%I` with `%i`, that is:

`for /f "tokens=2" %i in ('svn status') do echo %i`
