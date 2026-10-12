---
title: 'Groovy Syntax Tutorial Series: Keywords and Identifiers (Part 2)'
date: 2020-02-16
author: Tang Moying
categories: [build]
tags: [Groovy]
lang: en
alt_url: /post/groovy-syntax-keywords-and-identifiers
---

## Groovy Syntax Overview

This tutorial series introduces the syntax of the Groovy programming language. Groovy's syntax derives from Java's syntax, but it is enhanced with certain types and allows some simplifications.

<!--以上为摘要内容-->

## 2. Keywords

All the keywords of the Groovy language:

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

## 3. Identifiers

### 3.1 Normal Identifiers

An identifier starts with a letter, a dollar sign `$` or an underscore, and it cannot start with a digit.

The letter can be in the following ranges:

- " a" to " z" (lowercase ascii letters)

- " A" to " Z" (uppercase ascii letters)

- '\ u00C0' to '\ u00D6'

- '\ u00D8' to '\ u00F6'

- '\ u00F8' to '\ u00FF'

- '\ u0100' to '\ uFFFE'

The letters that follow can contain letters and digits.

Here are some examples of valid identifiers:

```groovy
def blog
def blog2
def my_blog
def $blog
def 博客
```

The following are invalid identifiers:

```
def 3blog
def my+blog
def my#blog
```

When they come after a dot, all keywords are also valid identifiers. For example:

```groovy
blog.break
blog.case
blog.assert
```

### 3.2 Quoted Identifiers

Quoted identifiers appear after the dot of a dot expression. For example, the `name` part of the `person.name` expression can be referenced with `person.“name”` or `person.'name'`.

Some identifiers contain characters that the Java language specification forbids — illegal characters — but Groovy will allow them to be used once they are quoted. For example, characters such as dashes, spaces and exclamation marks.

```groovy
def map = [:]

map."an identifier with a space and double quotes" = "ALLOWED"
map.'with-dash-signs-and-single-quotes' = "ALLOWED"

assert map."an identifier with a space and double quotes" == "ALLOWED"
assert map.'with-dash-signs-and-single-quotes' == "ALLOWED"
```

As we will see in the section on strings below, Groovy provides different string literals.

In fact, all types of strings are allowed after the dot:

```groovy
map.'single quote'
map."double quote"
map.'''triple single quote'''
map."""triple double quote"""
map./slashy string/
map.$/dollar slashy string/$
```
