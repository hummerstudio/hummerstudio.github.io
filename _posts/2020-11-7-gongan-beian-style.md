---
title: 域名公安备案信息样式优化
author: 唐明
categories: [域名备案]
tags: [公安备案]
---
* TOC
{:toc}

# 1、下载公安图标

保存为`gongan.png`

# 2、上传到服务器

位置：`/var/www/html/static/common/gongan.png`


# 3、修改代码

修改文件：`/var/www/html/views/default/global/footer.tpl.htm`，插入到期望位置。

备案网站生成的代码中有一段为：

```
<img src="" style="float:left;"/>
```
在`src`处填入图标路径：

```
<img src="static/common/gongan.png" style="float:left;"/>
```

# 4、样式优化

第一行代码为：

```
<div style="width:300px;margin:0 auto; padding:20px 0;">
```

备案信息通常放在网站底部，默认的样式上下间隔太大，不美观。可将`padding:20px 0;`删除。

# 5、设置小屏幕隐藏

小屏幕下访问网站会发现底部的备案信息很突兀，观察腾讯网手机版发现，其在手机访问时，并未显示此类信息。

我们也可以设置隐藏。

在第一行`div`增加`class = "hidden-xs"`即可。

## 6、注

修改是实时生效的，不需要重新加载配置或重启服务进程。
