---
title: 'Groovy Syntax Tutorial Series: Numbers (Part 4)'
date: 2020-02-22
author: Tang Moying
categories: [build]
tags: [Groovy]
lang: en
alt_url: /post/groovy-syntax-numbers
---

## Groovy Syntax Overview

This tutorial series introduces the syntax of the Groovy programming language. Groovy's syntax derives from Java's syntax, but it enhances it with specific types and allows certain simplifications.

<!--以上为摘要内容-->

## 5. Numbers

Groovy is based on Java's common `Number` types and supports different kinds of integer and decimal numbers.

### 5.1 Integers

The integer types are the same as in Java:

- `byte`
- `char`
- `short`
- `int`
- `long`
- `java.lang.BigInteger`

You can create integers of these types with the following declarations:

```groovy
// primitive types
byte  b = 1
char  c = 2
short s = 3
int   i = 4
long  l = 5

// big integer
BigInteger bi =  6
```

If you use optional typing by using the `def` keyword, the type of the integer is different: it will adaptively choose a type that can hold the number.

For positive numbers:

```groovy
def a = 1
assert a instanceof Integer

// Integer max value
def b = 2147483647
assert b instanceof Integer

// Integer max value + 1
def c = 2147483648
assert c instanceof Long

// Long max value
def d = 9223372036854775807
assert d instanceof Long

// Long max value + 1
def e = 9223372036854775808
assert e instanceof BigInteger
```

For negative numbers:

```groovy
def na = -1
assert na instanceof Integer

// Integer min value
def nb = -2147483648
assert nb instanceof Integer

// Integer min value - 1
def nc = -2147483649
assert nc instanceof Long

// Long min value
def nd = -9223372036854775808
assert nd instanceof Long

// Long min value - 1
def ne = -9223372036854775809
assert ne instanceof BigInteger
```

#### 5.1.1 Non-decimal numbers

Numbers can also be expressed in binary, octal, hexadecimal and decimal.

Binary

Binary numbers start with the `0b` prefix:

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

Octal literals

Octal numbers start with `0`, followed by octal digits.

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

Hexadecimal literals

Hexadecimal numbers start with `0x`, followed by hexadecimal digits.

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

### 5.2 Decimals

The decimal types are the same as in Java:

- `float`
- `double`
- `java.lang.BigDecimal`

You can create decimal numbers of these types with the following declarations:

```groovy
// primitive types
float  f = 1.234
double d = 2.345

// infinite precision
BigDecimal bd =  3.456
```

Decimals can use exponents, with the letter e or E, followed by an optional sign and the integer that represents the exponent:

```groovy
assert 1e3  ==  1_000.0
assert 2E4  == 20_000.0
assert 3e+1 ==     30.0
assert 4E-2 ==      0.04
assert 5e-1 ==      0.5
```

For exact decimal arithmetic, Groovy chooses `java.lang.BigDecimal` as its decimal number type.

In addition, both `float` and `double` are supported, but they need an explicit type declaration, coercion or suffix.

Even though `BigDecimal` is the default for decimal numbers, such literals are also accepted in methods or closures that take `float` or `double` as their parameter type.

Decimals cannot be represented in binary, octal or hexadecimal.

### 5.3 Numbers with underscores

When writing long literal numbers, it is hard to figure out how to group the digits together, for example in groups of thousands, words, and so on.

By allowing underscores in numeric literals, these groups become easier to spot:

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

### 5.4 Numeric type suffixes

We can give a number (including binary, octal and hexadecimal) a suffix (see the table below) to make it a specific type (uppercase or lowercase).

| Type | Suffix |
| ---- | ----- |
| BigInteger  | G or g |
| Long | L or l |
| Integer  | I or i |
| BigDecimal | G or g |
| Double | D or d |
| Float | F or f |

Example:

```groovy
assert 42I == new Integer('42')
assert 42i == new Integer('42') // lowercase i is more readable
assert 123L == new Long("123") // uppercase L is more readable
assert 2147483648 == new Long('2147483648') // uses the long type, the value is too large for Integer
assert 456G == new BigInteger('456')
assert 456g == new BigInteger('456')
assert 123.45 == new BigDecimal('123.45') // uses the default BigDecimal type
assert 1.200065D == new Double('1.200065')
assert 1.234F == new Float('1.234')
assert 1.23E23D == new Double('1.23E23')
assert 0b1111L.class == Long // binary
assert 0xFFi.class == Integer // hexadecimal
assert 034G.class == BigInteger // octal
```

### 5.5 Mathematical operations

Here we focus on binary operations and their result types.

Powerful binary operations

- A binary operation between `byte`, `char`, `short` and `int` results in `int`

- A binary operation between `long` and `byte`, `char`, `short`, `int` results in `long`

- A binary operation between `BigInteger` and any other integer type results in `BigInteger`

- A binary operation between `BigDecimal` and `byte`, `char`, `short`, `int`, `BigInteger` results in `BigDecimal`

- A binary operation between `float`, `double` and `BigDecimal` results in `double`

- A binary operation between two `BigDecimal`s results in `BigDecimal`

The table below summarizes these rules:

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

Thanks to Groovy's operator overloading, the common arithmetic operators can also be used directly with `BigInteger` and `BigDecimal`.

Unlike in Java, where you have to use explicit methods to operate on these numbers.
