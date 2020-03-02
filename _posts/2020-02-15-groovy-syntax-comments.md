---
title: Groovy语法系列教程之注释（一）
author: 唐明
categories: [Groovy]
tags: [Groovy]
---
* TOC
{:toc}

# Groovy语法概述

本系列教程介绍Groovy编程语言的语法。Groovy的语法源自Java语法，但是通过特定类型对其进行了增强，并允许进行某些简化。

<!--以上为摘要内容-->

# 1. 注释

## 1.1 单行注释

单行注释以`//`开头，可以在行中的任何位置使用。 `//`后面的字符（直到该行的末尾）被视为注释的一部分。

```groovy
// 独立的单行注释
println("我的博客：https://shanyshanb.com/") // 此处开始直至行尾的注释
```

## 1.2 多行注释

多行注释以`/*`开头，可以在该行的任何位置使用。`/ *`后面的字符将被视为注释的一部分，包括换行符，直到第一个`*/`结束注释。
因此，多行注释可以放在语句的末尾，甚至可以放在语句的内部。

```groovy
/* 独立的多行注释
   占用两行 */
println "我的博客：https://shanyshanb.com/" /* 多行注释的开始
                   多行注释的结束 */
println 1 /* 注释：一 */ + 2 /* 注释：二 */
```

## 1.3 Groovydoc注释

与多行注释类似，Groovydoc注释是多行注释，但以`/**`开头，以`*/`结尾。 

Groovydoc第一条注释行之后的行可以选择以星号*开头。

这些注释与如下概念有关：

- 类型定义（类、接口、枚举、注解）
- 字段和属性定义
- 方法定义

如果不在上述概念处添加Groovydoc，编译器不会告警。但应该在这些结构之前加上注释。

```groovy
/**
 * 类的注释
 */
class Person {
    /** Person的名字 */
    String name

    /**
     * 创建打招呼方法
     *
     * @param otherPerson 打招呼的对象
     * @return 打招呼的内容
     */
    String greet(String otherPerson) {
       "你好， ${otherPerson}"
    }
}
```

Groovydoc遵循与Java的Javadoc相同的约定。因此，也可以使用与Javadoc相同的标签。

## 1.4 shebang行

有一种特殊的单行注释，通常被UNIX系统称之为`shebang行`。

它使脚本可以直接从命令行运行。前提是你安装了Groovy发行版，并在`PATH`中配置了groovy命令。

```bash
#!/usr/bin/env groovy
println "你好！我的博客：https://shanyshanb.com/"
```

`＃`字符必须是文件的第一个字符。任何缩进都会产生编译错误。