---
title: What Does the BuildAssetBundleOption.DisableWriteTypeTree Option Do, and Should You Turn It On?
date: 2022-01-07
author: Tang Moying
categories: [build]
tags: [Unity]
lang: en
alt_url: /post/unity-disable-wirte-type-tree
---

BuildAssetBundleOption.DisableWriteTypeTree

### Description

Does not include the type information in the AssetBundle.

<!--以上为摘要内容-->

Specifying this flag will make the AssetBundle vulnerable to changes in scripts or the Unity version, **but it makes the files smaller and a little faster to load**.

This flag only affects AssetBundles on platforms that include type information by default.

The Web platform must include type information, so for example, if you specify this flag when the build target is `BuildTarget.WebPlayer`, Unity will refuse to build the AssetBundle.

So should you turn it on?

To sum up: if you care a lot about size, it is recommended to turn it on; if you have high requirements for version compatibility, it is not recommended; if you are building for WebPlayer, you must turn it on.
