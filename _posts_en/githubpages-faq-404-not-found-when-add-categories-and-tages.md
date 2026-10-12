---
title: GitHub Pages FAQ (Part 1) - 404 Not Found after adding categories and tages
date: 2019-10-27
author: Tang Moying
categories: [code]
tags: [GitHub Pages, Jekyll, FAQ]
lang: en
alt_url: /post/githubpages-faq-404-not-found-when-add-categories-and-tages
---

## Symptom

The original article only configured `layout` and `title`, and after publishing it could be accessed using the `year/month/day/title` link format, but after adding the `categories` and `tages` configuration, visiting it again showed `404 Not Found`.

## Cause Analysis

<!--以上为摘要内容-->

This is because `Jekyll` has a `permalink` (permanent link) generation strategy, and the default strategy is:
```
permalink: /:categories/:year/:month/:day/:title:output_ext
```
When `categories` does not exist, it is ignored, so we can access the article using the `year/month/day/title` link format. But once `categories` is set, the link is no longer this one, and we need to prepend the `categories` we filled in to the link before it works.

## Solution

Although we found the new page's URL, this situation causes the original URL to stop working.

If someone had bookmarked this article before, they can no longer access it now, and that is an even bigger problem.

For this situation, we can modify the default `permalink` setting, for example to generate links using only year/month/day/title.

You can add the following statement to the `_config.yml` file in the root directory:
```
permalink: /:year/:month/:day/:title
```

With this setting, no matter whether an article has `categories` or not, the generated URL has nothing to do with it, which guarantees that the URL will not change.
