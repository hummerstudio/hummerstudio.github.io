---
title: How to Do an OR with the grep Command
date: 2021-03-11
author: Tang Moying
categories: [deploy]
tags: [grep]
lang: en
alt_url: /post/grep-or
---

Enclose the keywords in quotes and separate them with the OR symbol |.

Sometimes it is natural to reach for |, but | in a shell command also denotes a pipe, so you may not be able to work out whether you can use it. In fact, adding quotes on top of that makes the distinction.
For example:

```
grep -E 'Start|Finish' <filename>  // Use the -E option to filter out the lines in the file that contain Start or Finish
egrep 'Start|Finish' filename    // Using egrep saves you the -E option; it is supported by default
```
