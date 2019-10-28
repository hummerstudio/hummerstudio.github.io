---
layout: post
title: 怎样使用GitHub Pages创建个人博客
author: 唐明
categories: [GitHub Pages]
tages: [GitHub Pages, Jekyll]
---
本文涉及知识点：


1. HTML5。`HTML5` 是 `HTML`（超文本标记语言） 的最新标准。我们的示例网页是使用 `HTML5` 编写的。后续如果你想更好地理解使用的主题和进行主题自定义，也需要这方面的知识。

1. CSS3。`CSS3` 是 `CSS` 的最新标准。它用于控制网页样式和布局。后续如果你想更好地理解使用的主题和进行主题自定义，也需要这方面的知识。

1. Markdown。`Markdown` 也是一种标记语言，它的语法比HTML更简单，书写量也更少，用处很广泛。在GitHub Pages中写博客，通常就是使用Markdown。比如你正在阅读的这篇博客就是用 Markdown 编写的。（原理上是 GitHub Pages 使用 `Jekyll` 将 Markdown 文件转换为HTML文件。`Jekyll` 还支持 Textile 文件，这里不做展开。）

1. 阿里云。`阿里云`提供域名注册、解析等服务。同类产品有`腾讯云`等。本教程涉及到自定义域名，可绑定自己拥有的域名来访问搭建的个人博客。使用的域名是在阿里云注册，并使用阿里云的云解析服务。域名解析用来映射域名和IP之间的关系。域名就像一个门牌号，解析就像是把牌子挂在房间上，挂在哪里，域名就指向哪里。

## 一、创建 GitHub Pages 仓库
创建一个名为 `USERNAME.github.io` 的仓库，其中 `USERNAME` 为你的 GitHub 用户名。
    
我这里创建的是

[hummerstudio.github.io](https://github.com/hummerstudio/hummerstudio.github.io "我的 GitHub Pages 仓库")

## 二、上传网页文件

GitHub Pages 只支持静态网页，是不支持 JSP 和 PHP 的。

我们来写一个简单的html文件看一下效果。

在仓库根目录下创建 `index.html` 文件，内容:

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
然后将文件推送至仓库即可。

## 三、如何访问？

库名即为访问域名，在本教程中，即为 

[hummerstudio.github.io](https://hummerstudio.github.io)

当你打开这个链接时，显示的可能不是上面的代码对应的内容。因为我不能拿这个当作真正的主页嘛！

（原理上，是库名需要和域名一样，这点要注意，可不要因果颠倒。🙃️）

## 四、自定义域名（可选）

>如果你有一个自己的域名，希望使用这个域名来访问博客，可继续往下看。如果你不需要，本节可以跳过。


我有一个和微信公众号ID同名的com域名[shanyshanb.com](http://shanyshanb.com)，希望能够使用它来访问博客，而不是使用 GitHub 提供的二级域名。


实现这个需求需要分别在域名注册商和 GitHub Pages 上进行操作。

* ### 自己的域名添加 `CNAME解析记录`

当需要将域名指向另一个域名，再由另一个域名提供IP地址，就需要添加 CNAME 记录。

GitHub Pages 官方强烈建议我们使用二级域名来做解析，而不要使用根域名（这里是shanyshanb.com），因此我这里设置将 www.shanyshanb.com 解析至 hummerstudio.github.io，配置如下：

![阿里云添加CNAME记录](/assets/img/add-CNAME-record_Aliyun.png)


* ### GitHub Pages 上添加 `CNAME解析记录`

**CNAME记录需要双向添加才能生效。**

在仓库根目录下创建文件CNAME，填上源域名即可。我这里的内容：

```
www.shanyshanb.com
```

提交更新至仓库。

此时就可以使用 [www.shanyshanb.com](http://www.shanyshanb.com) 来访问博客。

>另一种设置方式，是在仓库的设置页面通过图形界面设置自定义域名。设置后系统会自动提交CNAME文件至仓库，效果是一样的。
>
>我最初是希望尽量减少仓库文件，所以选择通过图形界面配置，但发现依然会产生文件。而且那时界面上的 `Save` 按钮是灰色无法点击，采取了hacking的方式才解决，设置过后修改内容按钮是可以点按的。不确定是当时网络问题还是GitHub禁用了这种方式，因此这种方式就不介绍了。)


## 五、选择主题

为了让博客更美观，可以选择一个自己喜欢的主题。

在配置页面的 `Theme Chooser` 处可以选择自己喜欢的 `Jekyll` 主题，我现在使用的是 `jekyll-theme-merlot`。

>设置主题后，GitHub 会在仓库自动提交保存 `_config.yml` 文件，内容：

```
theme: jekyll-theme-merlot
```

## 六、设置主题

主题选择后，页面的标题和描述文字都是主题自带的，需要修改成自己的。

在 `_config.yml`文件中添加 `title` 和 `description`。
```
theme: jekyll-theme-merlot
title: 左手编程，右手文化
description: 天道有缺，人力补之。  -- 唐明
```

## 七、按需自定义样式

我对一些主题默认样式和布局不满意的地方，做了修改。

在仓库根目录创建 `assets/css/style.scss` 文件，将修改的样式放入其中：
```
---
---

@import "{{ site.theme }}";

/* 减小标题大小 */
header h1 {
    font-size: 2em
}

/* 增加副标题上间距，增大字体大小 */
header h2 {
    padding-top: 10px;
    font: bold italic 1em/1.5 Georgia, Times, “Times New Roman”, serif;
}

/* 增加主体区宽度 */
div.shell {
    width: 1000px;
}

/* 不显示 span.banner-fix */
span.banner-fix {
    display: none;
}

/* 一级标题左对齐 */
.header-level-1 {
    text-align: left;
}

/* 增加页脚最大宽度 */
footer {
    max-width: 1000px;
}
```

再次访问 [www.shanyshanb.com](http://www.shanyshanb.com) ，大功告成！


