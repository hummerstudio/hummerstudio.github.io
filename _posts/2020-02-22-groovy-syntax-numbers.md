---
title: Groovy语法系列教程之数字（四）
author: 唐明
categories: [Groovy]
tags: [Groovy]
---
* TOC
{:toc}

# Groovy语法概述

本系列教程介绍Groovy编程语言的语法。Groovy的语法源自Java语法，但是通过特定类型对其进行了增强，并允许进行某些简化。

<!--以上为摘要内容-->

# 5. 数字

Groovy以Java的常用`Number`类型为基础，支持不同种类的整数和十进制数字。

## 5.1 整数

整数类型与Java中的相同：

- `byte`
- `char`
- `short`
- `int`
- `long`
- `java.lang.BigInteger`

您可以使用以下声明创建这些类型的整数：

```groovy
// 基本类型
byte  b = 1
char  c = 2
short s = 3
int   i = 4
long  l = 5

// 大整数
BigInteger bi =  6
```

如果您通过使用`def`关键字来使用可选类型，则整数的类型会有所不同：它将自适应选择可以容纳该数字的类型。

对于正数：

```groovy
def a = 1
assert a instanceof Integer

// Integer类型最大值
def b = 2147483647
assert b instanceof Integer

// Integer类型最大值 + 1
def c = 2147483648
assert c instanceof Long

// Long类型最大值
def d = 9223372036854775807
assert d instanceof Long

// Long类型最大值 + 1
def e = 9223372036854775808
assert e instanceof BigInteger
```

对于负数：

```groovy
def na = -1
assert na instanceof Integer

// Integer类型最小值
def nb = -2147483648
assert nb instanceof Integer

// Integer类型最小值 - 1
def nc = -2147483649
assert nc instanceof Long

// Long类型最小值
def nd = -9223372036854775808
assert nd instanceof Long

// Long类型最小值 - 1
def ne = -9223372036854775809
assert ne instanceof BigInteger
```

### 5.1.1 非十进制数

数字也可以二进制，八进制，十六进制和十进制为单位表示。

二进制

二进制数字以`0b`前缀开头：

```groovy
int xInt = 0b10101111
assert xInt == 175

short xShort = 0b11001001
assert xShort == 201 as short

byte xByte = 0b11
assert xByte == 3 as byte

long xLong = 0b101101101101
assert xLong == 2925l

BigInteger xBigInteger = 0b111100100001
assert xBigInteger == 3873g

int xNegativeInt = -0b10101111
assert xNegativeInt == -175
```

八进制文字

八进制数字以`0`开头，后跟八进制数字。

```groovy
int xInt = 077
assert xInt == 63

short xShort = 011
assert xShort == 9 as short

byte xByte = 032
assert xByte == 26 as byte

long xLong = 0246
assert xLong == 166l

BigInteger xBigInteger = 01111
assert xBigInteger == 585g

int xNegativeInt = -077
assert xNegativeInt == -63
```

十六进制文字

十六进制数字以`0x`开头，后跟十六进制数字。

```groovy
int xInt = 0x77
assert xInt == 119

short xShort = 0xaa
assert xShort == 170 as short

byte xByte = 0x3a
assert xByte == 58 as byte

long xLong = 0xffff
assert xLong == 65535l

BigInteger xBigInteger = 0xaaaa
assert xBigInteger == 43690g

Double xDouble = new Double('0x1.0p0')
assert xDouble == 1.0d

int xNegativeInt = -0x77
assert xNegativeInt == -119
```

## 5.2 小数

十进制类型与Java中的相同：

- `float`
- `double`
- `java.lang.BigDecimal`

你可以使用以下声明创建这些类型的十进制数字：

```groovy
// primitive types
float  f = 1.234
double d = 2.345

// infinite precision
BigDecimal bd =  3.456
```

小数可以使用指数，带有e或E指数字母，后跟一个可选符号，以及代表该指数的整数：

```groovy
assert 1e3  ==  1_000.0
assert 2E4  == 20_000.0
assert 3e+1 ==     30.0
assert 4E-2 ==      0.04
assert 5e-1 ==      0.5
```

为了进行精确的十进制数计算，Groovy选择`java.lang.BigDecimal`作为其十进制数类型。 

另外，`float`和`double`都受支持，但是需要显式的类型声明、类型强制或后缀。 

即使`BigDecimal`是十进制数字的默认值，在以`float`或`double`作为参数类型的方法或闭包中也可以接受此类文字。

小数不能用二进制、八进制或十六进制表示。

## 5.3 数字加下划线

在写长文字数字时，很难弄清楚如何将某些数字组合在一起，例如以成千上万的单词，单词等为一组。

通过允许在数字文字中加下划线，可以更容易地发现这些组：

```groovy
long creditCardNumber = 1234_5678_9012_3456L
long socialSecurityNumbers = 999_99_9999L
double monetaryAmount = 12_345_132.12
long hexBytes = 0xFF_EC_DE_5E
long hexWords = 0xFFEC_DE5E
long maxLong = 0x7fff_ffff_ffff_ffffL
long alsoMaxLong = 9_223_372_036_854_775_807L
long bytes = 0b11010010_01101001_10010100_10010010
```

## 5.4 数字类型的后缀

我们可以给数字（包括二进制，八进制和十六进制）赋予后缀（请参见下表），以使其具有特定类型（大写或小写）。

| 类型 | 后缀 |
| ---- | ----- |
| BigInteger  | G或者g |
| Long | L或l |
| Integer  | I或i |
| BigDecimal | G或g |
| Double | D或d |
| Float | F或f |

示例：

```groovy
assert 42I == new Integer('42')
assert 42i == new Integer('42') // 小写字母i更易读
assert 123L == new Long("123") // 大写字母L更易读
assert 2147483648 == new Long('2147483648') // 使用的long类型，对于Integer而言值太大
assert 456G == new BigInteger('456')
assert 456g == new BigInteger('456')
assert 123.45 == new BigDecimal('123.45') // 使用的默认BigDecimal类型
assert 1.200065D == new Double('1.200065')
assert 1.234F == new Float('1.234')
assert 1.23E23D == new Double('1.23E23')
assert 0b1111L.class == Long // 二进制
assert 0xFFi.class == Integer // 十六进制
assert 034G.class == BigInteger // 八进制
```

## 5.5 数学运算

这里重点说见面二进制运算及其结果类型。

强大的二进制运算

- `byte`、`char`、`short`和`int`之间的二进制运算结果是`int`

- `long`和`byte`、`char`、`short`、`int`的二进制运算结果是`long`

- `BigInteger`和任何其他整数类型的二进制运算结果是`BigInteger`

- `BigDecimal`和`byte`、`char`、`short`、`int`、`BigInteger`的二进制运算结果是`BigDecimal`

- `float`，`double`和`BigDecimal`之间的二进制运算结果是`double`

- 两个`BigDecimal`之间的二进制运算结果是`BigDecimal`

下表总结了这些规则：

|  | byte | char | short | int | long | BigInteger | float | double | BigDecimal |
| --- | --- | --- | ---  | --- | ---- | ---------- | ----- | ------ | ---------- |
| byte | int | int | int | int | long | BigInteger | double | double | BigDecimal |
| char |     | int | int | int | long | BigInteger | double | double | BigDecimal |
| short |    |     | int | int | long | BigInteger | double | double | BigDecimal |
| int  |     |     |     | int | long | BigInteger | double | double | BigDecimal |
| long |     |     |     |     | long | BigInteger | double | double | BigDecimal |
| BigInteger | |   |     |     |      | BigInteger | double | double | BigDecimal |
| float |    |     |     |     |      |            | double | double | BigDecimal |
| double |   |     |     |     |      |            |        | double | BigDecimal |
| BigDecimal | |   |     |     |      |            |        |        | BigDecimal |

通过Groovy的运算符重载功能，常用的算术运算符也可以直接与`BigInteger`和`BigDecimal`一起使用。

与Java中不同，在Java中，您必须使用显式方法对这些数字进行运算。