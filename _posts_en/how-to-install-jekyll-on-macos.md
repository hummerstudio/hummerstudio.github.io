---
title: How to Set Up a Local Jekyll Environment on macOS
date: 2019-11-02
author: Tang Moying
categories: [deploy]
tags: [Jekyll, macOS, Environment Setup]
lang: en
alt_url: /post/how-to-install-jekyll-on-macos
---

## Installing the command-line tools

Run the following command in the terminal:
```
xcode-select --install
```

<!--以上为摘要内容-->

## Installing Jekyll

Local install (recommended)

Run the following command in the terminal:
```
gem install --user-install bundler jekyll
```

## Creating a site

You can start by creating a test file. Create `index.html` in any directory, with the following content:

```
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>My First Web Page</title>
  </head>
  <body>
    <p>Site under construction...</p>
  </body>
</html>
```

## Generating the site and running the server

Use the command:
```
jekyll serve
```

This command generates a static site in the directory where it runs and starts a local server, so we can preview the result in a browser.

The local server address is: `http://localhost:4000`

This command does one more thing: when we modify site files (HTML files, md files, CSS files, and so on), we don't need to stop the command and run it again — the server detects the change automatically and refreshes.

But if you modify the `_config.yml` configuration file, you still have to run the command again.
