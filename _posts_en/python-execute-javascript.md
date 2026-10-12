---
title: Running JavaScript Code from Python
date: 2023-02-12
author: Tang Moying
categories: [build]
tags: [PyExecJS]
lang: en
alt_url: /post/python-execute-javascript
---

Using the execjs library; install it with:
```
pip install PyExecJS
```

How to use it:

<!--以上为摘要内容-->

1. Pass in a shorter JavaScript script directly
```
import execjs
execjs.eval("new Date")
## Return value: 2018-04-04T12:53:17.759Z
execjs.eval("Date.now()")
# Return value: 1522847001080  # Note that the return value has 13 digits, unlike Python's time.time()
```

2. Compile a large JS file and call functions in it
```
## The JS we handle in production runs to hundreds or thousands of lines, too long to paste here. Let's look at the example given in the source code:
  ctx = execjs.compile("""
        function add(x, y) {
                return x + y;
           }
""")
  ctx.call("add", 1, 2)  # The first argument, "add", is the string name of the JS function; the arguments that follow are the actual arguments
  # Return value: 3
```
3. The environment that runs the JS
```
execjs.get().name
## On Windows it defaults to JScript; for Node.js it is Node.js (V8)
```


Common problems:
1. Syntax errors
The IE JavaScript engine is used by default; to fix this you need to install `nodejs`. Download it here: `[Node.js (nodejs.org)](https://nodejs.org/zh-cn/)`. After installing it you have to restart PyCharm before it is detected.

1. jQuery is undefined
Run the following in the python project directory:
```
npm i jsdom
npm i jquery
```
Also add the following before the JS file to be executed:
```
var jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;
var $ = jQuery = require('jquery')(window);
```
