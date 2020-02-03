---
title: JavaScript 中文字符转义问题
author: 唐明
categories: JavaScript
tags: [JavaScript, 中文, 转义]
---
# 问题起源

我在使用新主题时，发现在分类下拉框中，当分类名为中文时，选中该分类，文章列表为空白。

经过跟踪 javascript 源码，发现是中文字符的转义问题。

<!--以上为摘要内容-->
* TOC
{:toc}

# 深入分析

下拉选择功能的部分 javascript 源码：

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
其中，`function categoryDisplay()` 是修改浏览器地址栏，比如选择分类“文字”，地址栏内容会变为`https://www.shanyshanb.com/category/#文字`。

```javascript
var thisId = window.location.hash.substring(1);
```

这行代码会读取地址#后面的内容。

```javascript
var cate = thisId;
$("section[post-cate!='" + cate + "']").hide(200);
$("section[post-cate='" + cate + "']").show(200);
```

最后的两行代码则是将 `post-cate` 与 `cate` 不同的隐藏，相同的显示。

看起来是没有问题，理论上 `thisId` 应该是“文字”，代码执行后显示 `post-cate` 等于“文字”的内容。

但当我在浏览器控制台实际执行时，输出却是这样的：

```javascript
> window.location.hash.substring(1)
< "%E6%96%87%E5%AD%97"
```

现在我们就明白了，thisId的实际值是转义后的一长串字符，并不是”文字“，那么执行最后的代码就会变成所有的文章都被隐藏，而要显示的文章却不存在。

# 问题的根源

## URL 规范是不允许中文字符的。

这些不支持的字符都会被转义。

我记得早些年我最开始上网那会，浏览器都是IE，那时候百度搜索一下，地址栏就会把搜索的关键字转化成一长串%分割的字符。

比如上面的 `https://www.shanyshanb.com/category/#文字`，正常就会显示为 `https://www.shanyshanb.com/category/#%E6%96%87%E5%AD%97`。

后来，Google Chrome 逐渐崛起，在某个版本上，支持直接显示中文。但要注意，这个中文显示功能是浏览器支持的，相当于浏览器把原始的链接做了一次转义后显示在地址栏中。

我们调用 `javascript` 接口来获取页面链接时，方法都严格遵循 URL 规范，因此获取到的还是带有%的原始字符。

## HTML 规范是支持中文的。

因为 HTML 规范支持中文，所以 `post-cate` 属性的中文值就是中文，不需要转义。

两者对中文支持对不同，导致了问题的出现。而浏览器增加支持了链接中中文字符的显示，则掩盖了这一问题，使得问题显得奇怪。

# 问题的解决方法

知道了原因，又找到了根因，问题的解决方法就呼之欲出了：

只需要在此处代码中增加转义操作皆可。

```javascript
var thisId = window.location.hash.substring(1);
```

经过查找资料，找到 `javascript` 有一个 `decodeURIComponent(url)` 方法可以将转义后的 URI 组件中的字符再转换回来。

控制台中试一下：

```javascript
> decodeURIComponent(window.location.hash.substring(1))
< "文字"
```

没有问题！

把代码做如下修改，就可以支持中文了！

```javascript
var thisId = decodeURIComponent(window.location.hash.substring(1));
```
