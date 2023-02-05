---
title: Unity打包AB，保持Hash值不变
author: 唐明
date: 2022-02-07
categories: [Unity]
tags: [Unity]
---
* TOC
{:toc}

打AB时，增加`BuildAssetBundleOptions.DeterministicAssetBundle`选项。

此选项可以保证AssetBundle使用唯一Hash进行标识，若不加这个选项AssetBundle每次构建时都生成不同ID。