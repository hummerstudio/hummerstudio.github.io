---
title: 2行代码就能实现HTML自动化转图片！
date: 2023-03-18
author: 唐明
categories: [Playwright]
tags: [dependencies]
---
* TOC
{:toc}

我们构建组除了负责bk-ci插件开发，还负责监控使用构建平台的所有项目的打包流水线、质量检查流水线的执行情况。

最初，这些都是让实习生来手动查看质量流水线的执行情况、再做表，跟进、然后手动发到群里。

今年中，我在研究了bk-ci的API后，已经将其改为自动抓取和生成报表，但仅作为参考。 报表使用`Velocity`模版引擎生成，是一个`HTML`文件，然后通过邮件发送。

不过邮件的实效性并不强，有时候会积累很多封邮件，也不知处理了没有。

<!--以上为摘要内容-->

除了这个报表， 构建组还监控每个打包流水线、质量检查流水线的失败构建，分析失败原因，并推动各方解决。
这个失败构建，之前也是发的邮件，最近在研究`ChatBot`，觉得这个效率还是非常高的，也不容易漏消息，所以把失败构建多加了一份通知到工作用的聊天软件上。

最初，我尝试的方案是调用原生接口，将数据重组为`Markdown`格式，跑了一段时间，还是不太满意。一是格式比较丑，经常文字挤到一块，二是在手机端竟然还是markdown原文，并没有转化，完全没法看。

于是考虑转成图片。图片可以解决第二个手机端无法查看的问题，顺便也解决了第一个格式丑的问题。

消息里除了图片，再加上报告跳转链接，需要看详情时，点击直接跳转到构建的报告查看页。非常完美。

以上为背景，也涉及到一些业务知识，现在入正题！

编程语言使用`Python`，首先安装`Playwright`:

```shell
pip3 install playwright
playwright install
```

然后就可以使用了！是的，不需要像使用`Selenium`那样再到处去下载对应浏览器对应版本的驱动程序了！

下面是项目中使用的代码的脱敏版本：

```python
from playwright.sync_api import Page, expect, sync_playwright

def get_report_screenshot(page: Page):
    # 打开本地HTML文件
    page.goto(r"D:\agent\workspace\p-000000000abcdef\src\dailyReport\report.html")
    # 给指定HTML元素截图并保存到本地
    page.locator("#report").screenshot(path="daily-report_screenshot.png")

if __name__ == "__main__":
    with sync_playwright() as playwright:
        get_report_screenshot(playwright.chromium.launch().new_context().new_page())
```

可以看到一共就7行代码，去掉导入、函数定义和函数调用，实际有效代码只有两行！而且这个代码功能是完整的，是可运行的！

微调下，改成截取百度首页，则是这样，可以直接运行：

```shell
from playwright.sync_api import Page, expect, sync_playwright

def get_report_screenshot(page: Page):
    # 打开百度
    page.goto("https://www.baidu.com/")
    # 截图页面
    page.screenshot(path="baidu.png")

if __name__ == "__main__":
    with sync_playwright() as playwright:
        get_report_screenshot(playwright.chromium.launch().new_context().new_page())
```


查看截图，效果也非常好，高清，通过指定元素的方式还可以避免截取到页面空白，完全满足需求！


`Selenium`本身是跨语言支持的，除了`Python`，还支持`Java`、`Node.js`和`C#`。

但`Python`语言使用，尤其简洁，

此时，那句口号在脑中想起：`人生苦短，我用Python`！