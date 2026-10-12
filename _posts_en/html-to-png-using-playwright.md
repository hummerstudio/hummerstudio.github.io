---
title: 2 Lines of Code to Automate HTML-to-Image Conversion!
date: 2023-03-18
author: Tang Moying
categories: [build]
tags: [dependencies]
lang: en
alt_url: /post/html-to-png-using-playwright
---

Besides developing bk-ci plugins, our build team is also responsible for monitoring how the packaging pipelines and quality-check pipelines of every project on the build platform are running.

At first, this was all done by interns: they manually inspected how the quality pipelines were running, put together a spreadsheet, followed up, and then posted it to the group chat by hand.

In the middle of this year, after studying the bk-ci API, I changed it to automatically scraping the data and generating the report — but for reference only. The report is generated with the `Velocity` template engine, comes out as an `HTML` file, and is then sent by email.

Email isn't very timely, though. Sometimes a pile of messages accumulates, and nobody knows whether they've been dealt with.

<!--以上为摘要内容-->

Besides that report, the build team also monitors failed builds in every packaging pipeline and quality-check pipeline, analyzes why they failed, and pushes everyone involved to fix them.
Failed builds used to be sent by email too. I've been looking into `ChatBot`s recently and find them very efficient — it's hard to miss a message — so I added one more notification channel for failed builds, to the chat app we use at work.

At first, the approach I tried was calling the native API and reassembling the data into `Markdown`. After running it for a while I still wasn't satisfied. For one thing, the formatting was ugly and the text often got crammed together; for another, on mobile it was still the raw markdown with no conversion at all — completely unreadable.

So I considered converting it into an image. An image solves the mobile problem, and takes care of the ugly formatting along the way.

In the message, besides the image, I add a link to the report, so when someone needs the details they can click straight through to the build's report page. Perfect.

That's the background, and it touches on some business knowledge too. Now let's get down to business!

The programming language is `Python`, so first install `Playwright`:

```shell
pip3 install playwright
playwright install
```

Then you can start using it! Yes — unlike `Selenium`, you don't have to go hunting for the driver that matches each browser and each version.

Below is a sanitized version of the code used in the project:

```python
from playwright.sync_api import Page, expect, sync_playwright

def get_report_screenshot(page: Page):
    # open the local HTML file
    page.goto(r"D:\agent\workspace\p-000000000abcdef\src\dailyReport\report.html")
    # screenshot the specified HTML element and save it locally
    page.locator("#report").screenshot(path="daily-report_screenshot.png")

if __name__ == "__main__":
    with sync_playwright() as playwright:
        get_report_screenshot(playwright.chromium.launch().new_context().new_page())
```

As you can see, that's only 7 lines in total, and once you take away the import, the function definition and the function call, only two lines are actually doing work! And the code is complete and runnable!

With a small tweak — capturing the Baidu home page instead — it looks like this, and you can run it directly:

```shell
from playwright.sync_api import Page, expect, sync_playwright

def get_report_screenshot(page: Page):
    # open Baidu
    page.goto("https://www.baidu.com/")
    # screenshot the page
    page.screenshot(path="baidu.png")

if __name__ == "__main__":
    with sync_playwright() as playwright:
        get_report_screenshot(playwright.chromium.launch().new_context().new_page())
```


Looking at the screenshot, the result is excellent — high resolution, and by targeting a specific element you can also avoid capturing the blank areas of the page. It fully meets the requirement!


`Selenium` itself is cross-language: besides `Python`, it also supports `Java`, `Node.js` and `C#`.

But it is especially concise to use in `Python`,

At this point that slogan comes to mind: `人生苦短，我用Python` (life is short, I use Python)!
