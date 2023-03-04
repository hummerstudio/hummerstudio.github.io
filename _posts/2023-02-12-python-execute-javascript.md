---
title: Python执行Javascript代码
date: 2023-02-12
author: 唐明
categories: [Python]
tags: [PyExecJS]
---
* TOC
{:toc}

使用execjs库，安装：
```
pip install PyExecJS
```

使用方法：

<!--以上为摘要内容-->

1、直接传入较短的javascript脚本
```
import execjs
execjs.eval("new Date")
# 返回值为： 2018-04-04T12:53:17.759Z
execjs.eval("Date.now()")
#返回值为：1522847001080  # 需要注意的是返回值是13位， 区别于python的time.time()
```

2、编译大的js文件，并调用其中的函数
```
# 实际生产中处理的js有几百几千行， 不方便贴上来。来看一下源码中给的例子：
  ctx = execjs.compile("""
        function add(x, y) {
                return x + y;
           }
""")
  ctx.call("add", 1, 2)  # 第一个参数 “add” 为JS函数名的字符串， 后边依次为实参
  # 返回值：3
```
3、执行js的环境
```
execjs.get().name
# Windows默认为JScript，Node.js为Node.js (V8)
```


常见问题：
1、语法错误
默认使用的是IE的js引擎，解决此问题需安装`nodejs`，下载地址：`[Node.js (nodejs.org)](https://nodejs.org/zh-cn/)`。安装后需要重启pycharm才能识别到。

1、jQuery未定义
在python项目目录下执行：
```
npm i jsdom
npm i jquery
```
同时在要执行的js文件前添加：
```
var jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;
var $ = jQuery = require('jquery')(window);
```