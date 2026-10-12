---
title: New Year, New Look — The Site Has a New Theme!
date: 2020-02-03
author: Tang Moying
categories: [deploy]
tags: [Jekyll, GitHub Pages, Theme, Timeline, Tag Cloud]
lang: en
alt_url: /post/new-year-new-theme
---

## The Previous Theme

The site previously used the official Merlot theme. Repository address: [https://github.com/pages-themes/merlot](https://github.com/pages-themes/merlot).

On top of that I modified the CSS and adjusted the layout and styles, but there were always a few pain points I never solved.

1. Not friendly to mobile devices; in particular the header banner and the h1~h4 fonts were too large.
1. Articles could not be displayed by category;
1. The display and aggregation of tags were very weak.

<!--以上为摘要内容-->

So after looking around, I settled on the current theme. Repository address: [https://github.com/bit-ranger/blog](https://github.com/bit-ranger/blog).

## The Current Theme

This theme has the following features:

1. Friendly to mobile devices. The header itself is only one line tall, and on mobile devices the menu becomes a drawer.
1. Articles can be filtered and displayed by category.
1. There is a tag cloud, and articles can be filtered by tag.
1. A timeline feature. It displays published articles along a timeline — you could call it a very pleasant surprise of a feature.
1. The sidebar shows the article's table of contents. Another very pleasant surprise of a feature.

Combining what I had from the previous theme, I made the following main changes on top of this theme:

1. Replaced the built-in gitment with gittalk;
1. Localised the interface into Chinese. Specifically:
    - Changed the time format to a pure numeric form, with no English in it;
    - Translated the menu bar items;
        - “Blog” changed to “文章”;
        - “Archive” changed to “时间线”;
        - “Category” changed to “分类”;
        - “Tag” changed to ”标签云“;
    - Translated the text in article displays and category pages;
        - “Read More” changed to “阅读全文”;
        - “Comment” changed to “评论”
1. Fixed the problem where, when a category name was in Chinese, selecting that category showed an empty article list;
1. Removed the “Share” button from article displays.

In the new year, I wish everyone good health and peace of mind, smooth work, and success in your careers.
