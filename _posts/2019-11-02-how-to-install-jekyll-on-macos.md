---
title: 如何在macOS上搭建本地Jekyll环境
author: 唐明
categories: [GitHub Pages, Jekyll, Ruby]
tags: [Jekyll, macOS, 环境搭建]
---
* TOC
{:toc}

# 安装命令行工具

在终端中执行下面的命令：
```
xcode-select --install
```

<!--以上为摘要内容-->

# 安装Jekyll

本地安装(推荐)

在终端执行下面的命令：
```
gem install --user-install bundler jekyll
```

# 创建网站

可以先创建一个测试文件。在任意目录下创建`index.html`，内容如下：

```
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>我的第一个网页</title>
  </head>
  <body>
    <p>网站建设中……</p>
  </body>
</html>
```

# 生成网站并运行服务器

使用命令：
```
jekyll serve
```

这个命令会在执行目录下生成静态网站，并且在本地运行一个服务器，这样我们就可以使用浏览器访问预览效果。

本地服务地址为：`http://localhost:4000`

这个命令还有一个作用：在我们修改了网站文件（html文件、md文件、css文件等）时，不需要停止命令再重新执行，服务会自动检测道变化并刷新。

但如果修改了`_config.yml`配置文件，还是需要重新执行该命令的。