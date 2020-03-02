---
title: Groovy语法系列教程之关键字和标识符（二）
author: 唐明
categories: [Groovy]
tags: [Groovy]
---
* TOC
{:toc}

# Groovy语法概述

本系列教程介绍Groovy编程语言的语法。Groovy的语法源自Java语法，但是通过特定类型对其进行了增强，并允许进行某些简化。

<!--以上为摘要内容-->

# 2. 关键字

Groovy语言的所有关键字：

```
as

assert

break

case

catch

class

const

continue

def

default

do

else

enum

extends

false

finally

for

goto

if

implements

import

in

instanceof

interface

new

null

package

return

super

switch

this

throw

throws

trait

true

try

while
```

# 3. 标识符

## 3.1 普通标识符

标识符以字母、美元符号`$`或下划线开头，不能以数字开头。

字母可以在以下范围内：

- “ a”到“ z”（小写的ascii字母）

- “ A”到“ Z”（大写的ascii字母）

- '\ u00C0'至'\ u00D6'

- '\ u00D8'至'\ u00F6'

- '\ u00F8'至'\ u00FF'

- '\ u0100'到'\ uFFFE'

后面的字母可以包含字母和数字。

以下是一些有效标识符的示例：

```groovy
def blog
def blog2
def my_blog
def $blog
def 博客
```

下面这些则是无效的标识符：

```
def 3blog
def my+blog
def my#blog
```

当在点后时，所有的关键字也是有效的标识符。如：

```groovy
blog.break
blog.case
blog.assert
```

## 3.2 带引号的标识符

带引号的标识符出现在点表达式的点后。例如，`person.name`表达式的`name`部分可以用`person.“name”`或`person.'name'`引用。

某些标识符包含Java语言规范禁止但非法字符，但带引号后Groovy将允许使用。例如，破折号，空格，感叹号等字符。

```groovy
def map = [:]

map."an identifier with a space and double quotes" = "ALLOWED"
map.'with-dash-signs-and-single-quotes' = "ALLOWED"

assert map."an identifier with a space and double quotes" == "ALLOWED"
assert map.'with-dash-signs-and-single-quotes' == "ALLOWED"
```

正如我们将在以下有关字符串的部分中看到的那样，Groovy提供了不同的字符串文字。 

实际上，在点后允许使用所有类型的字符串：

```groovy
map.'single quote'
map."double quote"
map.'''triple single quote'''
map."""triple double quote"""
map./slashy string/
map.$/dollar slashy string/$
```