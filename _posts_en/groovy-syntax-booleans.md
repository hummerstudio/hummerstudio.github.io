---
title: 'Groovy Syntax Tutorial Series: Booleans (Part 5)'
date: 2020-02-28
author: Tang Moying
categories: [build]
tags: [Groovy]
lang: en
alt_url: /post/groovy-syntax-booleans
---

## Groovy Syntax Overview

This tutorial series introduces the syntax of the Groovy programming language. Groovy's syntax derives from Java's syntax, but it is enhanced by specific types and allows certain simplifications.

<!--以上为摘要内容-->

## 6. Booleans

A boolean is a special data type used to represent truth values: `true` and `false`. Use this data type as a simple flag for tracking true/false conditions.

Boolean values can be stored in variables just like any other data type:

```groovy
def myBooleanVariable = true
boolean untypedBooleanVar = false
booleanField = true
```

`true` and `false` are the only two primitive boolean values. However, logical operators can be used to express more complex boolean expressions.

In addition, Groovy has special rules (usually called Groovy Truth) for coercing non-boolean objects to the boolean type.

### 6.1 Groovy Truth

Groovy determines whether an expression is true or false by applying the rules given below.

#### 6.1.1 Boolean Expressions

If the boolean value is `true`, it is true.

```groovy
assert true
assert !false
```

#### 6.1.2 Collections and Arrays

Non-empty collections and arrays are true.

```groovy
assert [1, 2, 3]
assert ![]
```

#### 6.1.3 Matchers

A matcher is true if it has at least one match.

```groovy
assert ('a' =~ /a/)
assert !('a' =~ /b/)
```

#### 6.1.4 Iterators and Enumerations
    
Iterators and enumerations that contain elements are coerced to true.

```groovy
assert [0].iterator()
assert ![].iterator()
Vector v = [0] as Vector
Enumeration enumeration = v.elements()
assert enumeration
enumeration.nextElement()
assert !enumeration
```

#### 6.1.5 Maps

Non-empty maps are coerced to true.

```groovy
assert ['one' : 1]
assert ![:]
```

#### 6.1.6 Strings

Non-empty strings, `GString`s and `CharSequences` are true.

```groovy
assert 'a'
assert !''
def nonEmpty = 'a'
assert "$nonEmpty"
def empty = ''
assert !"$empty"
```

#### 6.1.7 Numbers

Non-zero numbers are true.

```groovy
assert 1
assert 3.5
assert !0
```

#### 6.1.8 Object References

Non-null object references are true.

```groovy
assert new Object()
assert !null
```

#### 6.1.9 Customising Truth with the asBoolean() Method

To customise whether Groovy converts an object to `true` or `false`, you can implement the `asBoolean()` method:

```groovy
class Color {
    String name

    boolean asBoolean(){
        name == 'green' ? true : false
    }
}
```

Groovy will call this method to coerce the object to a boolean, for example:

```groovy
assert new Color(name: 'green')
assert !new Color(name: 'red')
```
