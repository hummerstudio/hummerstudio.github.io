---
title: The Differences Between armv6, armv7, armv7s, armv8 and arm64
date: 2021-12-22
author: Tang Moying
categories: [build]
tags: [arm]
lang: en
alt_url: /post/difference-between-armvx
---

In short, armv6, armv7, armv7s, armv8 and arm64 are all instruction sets of ARM processors.

So what exactly is an ARM processor then?

<!--以上为摘要内容-->

As we know, the computers we use every day generally have Intel or AMD processors, but phones and some mobile devices almost all use ARM processors. Because of their low power consumption and small size, they are very well suited to mobile devices.

Above we mentioned that armv6, armv7, armv7s, armv8 and arm64 are all instruction sets of ARM processors. The 6, 7, 7s and 8 refer to versions of the instruction set, somewhat similar to the version naming of Apple's iPhone models. In principle, instruction sets are all backward compatible; the armv7 instruction set, for example, is also compatible with the armv6 instruction set, it is just that when using the armv6 instruction set you cannot fully exploit its performance, and you cannot use the new features in the armv7 instruction set.

So what does arm64 mean then? This is similar to i386 and x86_64 for PC processors. That is, arm64 is a 64-bit processor, and every instruction is 64 bits in size.

arm64 is a broad category, not a specific version of an arm instruction set. armv8 is an instruction set version.

The armv8 instruction set is 64-bit, and it belongs to the broad arm64 category.

