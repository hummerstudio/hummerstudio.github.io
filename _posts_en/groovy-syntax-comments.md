---
title: 'Groovy Syntax Tutorial Series: Comments (Part 1)'
date: 2020-02-15
author: Tang Moying
categories: [build]
tags: [Groovy]
lang: en
alt_url: /post/groovy-syntax-comments
---

## Groovy Syntax Overview

This tutorial series introduces the syntax of the Groovy programming language. Groovy's syntax derives from Java's syntax, but it is enhanced through specific constructs and permits certain simplifications.

<!--以上为摘要内容-->

## 1. Comments

### 1.1 Single-Line Comments

A single-line comment starts with `//` and can be used anywhere in a line. The characters after `//` (up to the end of that line) are considered part of the comment.

```groovy
// a standalone single-line comment
println("我的博客：https://shanyshanb.com/") // a comment from here to the end of the line
```

### 1.2 Multi-Line Comments

A multi-line comment starts with `/*` and can be used anywhere in the line. The characters after `/ *` are considered part of the comment, including line breaks, until the first `*/` ends the comment.
Therefore, a multi-line comment can be placed at the end of a statement, or even inside a statement.

```groovy
/* a standalone multi-line comment
   taking up two lines */
println "我的博客：https://shanyshanb.com/" /* start of a multi-line comment
                   end of the multi-line comment */
println 1 /* comment: one */ + 2 /* comment: two */
```

### 1.3 Groovydoc Comments

Similar to multi-line comments, Groovydoc comments are multi-line comments, but they start with `/**` and end with `*/`.

The lines after the first comment line of a Groovydoc can optionally start with an asterisk *.

These comments relate to the following concepts:

- Type definitions (classes, interfaces, enums, annotations)
- Field and property definitions
- Method definitions

If you don't add Groovydoc at the above concepts, the compiler will not warn you. But you should add comments before these structures.

```groovy
/**
 * the class comment
 */
class Person {
    /** Person's name */
    String name

    /**
     * create the greeting method
     *
     * @param otherPerson the person to greet
     * @return the content of the greeting
     */
    String greet(String otherPerson) {
       "你好， ${otherPerson}"
    }
}
```

Groovydoc follows the same conventions as Java's Javadoc. Therefore, the same tags as Javadoc can also be used.

### 1.4 The shebang Line

There is a special kind of single-line comment, usually called the `shebang line` on UNIX systems.

It lets a script be run directly from the command line. The prerequisite is that you have a Groovy distribution installed and the groovy command configured in your `PATH`.

```bash
#!/usr/bin/env groovy
println "你好！我的博客：https://shanyshanb.com/"
```

The `＃` character must be the first character of the file. Any indentation will produce a compilation error.
