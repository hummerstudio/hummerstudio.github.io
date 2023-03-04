---
title: .Net运行时分类
date: 2023-02-18
author: 唐明
categories: [.Net]
tags: [运行时]
---
* TOC
{:toc}


下载地址（LTS版本）：[Download .NET 6.0 (Linux, macOS, and Windows) ](https://dotnet.microsoft.com/en-us/download/dotnet/6.0)

### .NET运行时
只包含运行控制台应用的组件。需要另外安装ASP.NET Core运行时和 .NET Desktop运行时。

### ASP.NET Core运行时
运行web/服务器应用。在Windows上推荐安装**Hosting Bundle**，包含了.net运行时和IIS支持。

### .NET Desktop运行时
运行Windows桌面应用。包含了.net运行时，不需要再单独安装。