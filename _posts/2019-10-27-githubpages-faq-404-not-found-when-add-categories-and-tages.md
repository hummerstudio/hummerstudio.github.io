---
layout: post
title: GitHub Pages 常见问题(一）- GitHub Pages添加categories和tages后访问报404 Not Found
author: 唐明
categories: [GitHub Pages]
tages: [GitHub Pages, Jekyll, FAQ]
---
## 问题现象

原有文章只配置了 `layout` 和 `title`，发布后，可以按照 `year/month/day/title` 的链接格式访问，但增加配置 `categories` 和 `tages` 后，再次访问就提示 `404 Not Found`。

## 原因解析

这是因为 `Jekyll` 有一个 `permalink`（永久链接）的生成策略，默认策略为：
```
permalink: /:categories/:year/:month/:day/:title:output_ext
```
当 `categories` 不存在时，会忽略，因此我们可以按照 `year/month/day/title` 的链接格式访问到。而设置了 `categories` 后，链接就不是这个了，需要在链接前加上我们填写的 `categories` 才行。

## 解决方法

虽然我们找到了新页面的URL，但这种情况会导致原先的URL失效。

如果有人之前收藏了这篇文章，现在就无法访问了，这是一个更大的问题。

<!--以上为摘要内容-->

针对这种情况，我们可以修改 `permalink` 的默认设置，比如只按year/month/day/title来生成链接。

可以在根目录的 `_config.yml` 文件中添加如下语句：
```
permalink: /:year/:month/:day/:title
```

这样设置，不论文章有没有 `categories` ，生成的URL都与之无关，可以保证URL不会发生变化。