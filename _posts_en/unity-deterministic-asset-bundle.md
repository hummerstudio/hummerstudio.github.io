---
title: Building Unity ABs While Keeping the Hash Unchanged
date: 2022-02-07
author: Tang Moying
categories: [build]
tags: [Unity]
lang: en
alt_url: /post/unity-deterministic-asset-bundle
---

When building ABs, add the `BuildAssetBundleOptions.DeterministicAssetBundle` option.

This option ensures the AssetBundle is identified by a unique Hash; without it, the AssetBundle gets a different ID on every build.
