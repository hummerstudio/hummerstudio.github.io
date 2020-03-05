---
title: Groovy语法系列教程之布尔（五）
author: 唐明
categories: [Groovy]
tags: [Groovy]
---
* TOC
{:toc}

# Groovy语法概述

本系列教程介绍Groovy编程语言的语法。Groovy的语法源自Java语法，但是通过特定类型对其进行了增强，并允许进行某些简化。

<!--以上为摘要内容-->

# 6. 布尔

布尔是一种特殊的数据类型，用于表示真值：`true`和`false`。 使用此数据类型作为跟踪真/假条件的简单标志。

布尔值可以存储在变量中，就像其他任何数据类型一样：

```groovy
def myBooleanVariable = true
boolean untypedBooleanVar = false
booleanField = true
```

`true`和`false`是仅有的两个原始布尔值。 但是，可以使用逻辑运算符来表示更复杂的布尔表达式。

另外，Groovy具有特殊的规则（通常称为Groovy Truth），用于将非布尔对象强制为布尔类型。