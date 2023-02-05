---
title: BuildAssetBundleOption.DisableWriteTypeTree选项有什么作用，要不要开启？
author: 唐明
date: 2022-01-07
categories: [Unity]
tags: [Unity]
---
* TOC
{:toc}

BuildAssetBundleOption.DisableWriteTypeTree

## 描述

不包含AssetBundle中的类型信息。

<!--以上为摘要内容-->

指定此标志将使AssetBundle容易受到脚本或Unity版本变更的影响，**但会使文件变得更小，加载起来也更快一点**。

此标志只会对默认包含类型信息的平台的AssetBundles产生影响。

Web平台必须包含类型信息，因此，举例来说，如果您在构建目标为`BuildTarget.WebPlayer`时指定此标志，Unity将拒绝构建AssetBundle。

那么要不要开启呢？

综上，对大小比较敏感，建议开启；对版本兼容性要求较高，不建议开启；构建WebPlayer，必须开启。