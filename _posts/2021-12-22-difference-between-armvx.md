---
title: armv6、armv7、armv7s、armv8、arm64的区别
author: 唐明
date: 2021-12-22
categories: [Android]
tags: [arm]
---
* TOC
{:toc}

简言之，armv6、armv7、armv7s、armv8、arm64都是ARM处理器的指令集。

那么ARM处理器又是什么呢？

<!--以上为摘要内容-->

我们知道，日常使用的电脑一般都是Intel或者AMD的处理器，但在手机和一些移动设备上，几乎使用的都是ARM处理器。因为其有低功耗和尺寸小的特点，十分适合移动设备。

上面我们提到armv6、armv7、armv7s、armv8、arm64都是ARM处理器的指令集。6、7、7s、8是指令集的版本，有些类似苹果iPhone手机的版本命名。原则上，指令集都是向下兼容的，如armv7指令集，它同时兼容armv6指令集，只是使用armv6指令集时无法充分发挥其性能，无法使用armv7指令集中的新特性。

那arm64又是什么意思呢？这类似于PC处理器的i386和x86_64。即arm64是64位处理器，每个指令大小为64位。

arm64是一种大的分类，并不是具体的一个arm指令集版本。armv8是一个指令集版本。

armv8指令集是64位的，属于arm64这个大类别。

