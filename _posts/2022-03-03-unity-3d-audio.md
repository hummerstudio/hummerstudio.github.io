---
title: Unity设置3D音效
author: 唐明
date: 2022-03-03
categories: [Unity]
tags: [Unity]
---
* TOC
{:toc}

1、在`Audio Source`设置`Spatial Blend`指为1；

2、在`Audio Source`的`3D Sound Settings`中设置`Min Distance`和`Max Distance`。

在最小距离内，音频源将以最大音量播放片段。在此距离之外，音量将减小，在最大距离，用户将不再听到音频。