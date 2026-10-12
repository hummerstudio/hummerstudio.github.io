---
title: The Problem of Escaping Chinese Characters in JavaScript
date: 2020-02-03
author: Tang Moying
categories: [build]
tags: [JavaScript, Chinese, Escaping]
lang: en
alt_url: /post/javascript-decode-chinese-character
---

## Where the Problem Came From

While using a new theme, I found that in the category dropdown, when a category name was in Chinese, selecting that category left the article list blank.

After tracing through the javascript source, I found it was a Chinese character escaping problem.

<!--以上为摘要内容-->

## A Closer Look

Part of the javascript source for the dropdown selection feature:

```javascript
function categoryDisplay() {
    selectCategory();
    $('.categories-item').click(function() {
        window.location.hash = "#" + $(this).attr("cate");
        selectCategory();
    });
}

function selectCategory(){
    var exclude = ["",undefined];
    var thisId = window.location.hash.substring(1);
    var allow = true;
    for(var i in exclude){
        if(thisId == exclude[i]){
            allow = false;
            break;
        }
    }
    if(allow){
        var cate = thisId;
        $("section[post-cate!='" + cate + "']").hide(200);
        $("section[post-cate='" + cate + "']").show(200);
    } else {
        $("section[post-cate='All']").show();
    }
}
```
Here, `function categoryDisplay()` changes the browser's address bar. If you select the category "文字" (Text), for example, the address bar becomes `https://www.shanyshanb.com/category/#文字`.

```javascript
var thisId = window.location.hash.substring(1);
```

This line reads whatever comes after the # in the address.

```javascript
var cate = thisId;
$("section[post-cate!='" + cate + "']").hide(200);
$("section[post-cate='" + cate + "']").show(200);
```

The last two lines hide the elements whose `post-cate` differs from `cate` and show the ones that match.

It doesn't look like there's any problem: in theory `thisId` should be "文字", and after the code runs it would show the content whose `post-cate` equals "文字".

But when I actually ran it in the browser console, the output was this:

```javascript
> window.location.hash.substring(1)
< "%E6%96%87%E5%AD%97"
```

Now we understand: the actual value of thisId is that long escaped string of characters, not "文字". So when the last piece of code runs, all the articles end up hidden, while the article that should be shown doesn't exist.

## The Root of the Problem

### The URL specification does not allow Chinese characters.

Characters that aren't supported get escaped.

I remember back in the early days when I first went online, the browsers were all IE. Back then, if you searched on Baidu, the address bar would turn your search keywords into a long string of characters separated by %.

For example, the `https://www.shanyshanb.com/category/#文字` above would normally be displayed as `https://www.shanyshanb.com/category/#%E6%96%87%E5%AD%97`.

Later, Google Chrome rose to prominence and, in some version, supported displaying Chinese directly. But note that this Chinese display feature is something the browser does — the equivalent of the browser escaping the original link once and then showing it in the address bar.

When we call the `javascript` interfaces to get the page link, the methods strictly follow the URL specification, so what we get back is still the original characters with the % signs.

### The HTML specification does support Chinese.

Because the HTML specification supports Chinese, the Chinese value of the `post-cate` attribute is simply Chinese and doesn't need escaping.

The two differ in their support for Chinese, and that's what causes the problem to appear. And the browser adding support for displaying Chinese characters in links masks this problem, which makes it look strange.

## How to Fix the Problem

Once you know the cause and have found the root cause, the solution suggests itself:

All you need to do is add an escaping operation to this piece of code.

```javascript
var thisId = window.location.hash.substring(1);
```

After looking things up, I found that `javascript` has a `decodeURIComponent(url)` method that converts the characters in an escaped URI component back again.

Let's try it in the console:

```javascript
> decodeURIComponent(window.location.hash.substring(1))
< "文字"
```

No problem!

With the following change to the code, Chinese is supported!

```javascript
var thisId = decodeURIComponent(window.location.hash.substring(1));
```
