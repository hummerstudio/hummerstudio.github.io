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

## 6.1 Groovy Truth

Groovy通过应用下面给出的规则来确定表达式是真还是假。

### 6.1.1 布尔表达式

如果布尔值为`true`，则为真。

```groovy
assert true
assert !false
```

### 6.1.2 集合和数组

非空的集合和数组为真。

```groovy
assert [1, 2, 3]
assert ![]
```

### 6.1.3 匹配器

如果匹配器（Matcher）至少有一个匹配，则为真。

```groovy
assert ('a' =~ /a/)
assert !('a' =~ /b/)
```

### 6.1.4 迭代器和枚举
    
包含元素的迭代器和枚举被强制转换为真。

```groovy
assert [0].iterator()
assert ![].iterator()
Vector v = [0] as Vector
Enumeration enumeration = v.elements()
assert enumeration
enumeration.nextElement()
assert !enumeration
```

### 6.1.5 映射

非空映射被转换为真。

```groovy
assert ['one' : 1]
assert ![:]
```

### 6.1.6 字符串

非空的字符串、`GString`和`CharSequences`为真。

```groovy
assert 'a'
assert !''
def nonEmpty = 'a'
assert "$nonEmpty"
def empty = ''
assert !"$empty"
```

### 6.1.7 数字

非0数字为真。

```groovy
assert 1
assert 3.5
assert !0
```

### 6.1.8 对象引用

非空对象引用为真。

```groovy
assert new Object()
assert !null
```

### 6.1.9 使用asBoolean()方法自定义真值

为了自定义groovy是将对象转换为`true`还是`false`，可实现`asBoolean()`方法：

```groovy
class Color {
    String name

    boolean asBoolean(){
        name == 'green' ? true : false
    }
}
```

Groovy将调用此方法将对象强制转换为布尔值，例如：

```groovy
assert new Color(name: 'green')
assert !new Color(name: 'red')
```