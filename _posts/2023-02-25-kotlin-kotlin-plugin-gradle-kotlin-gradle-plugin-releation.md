---
title: kotlin、kotlin-plugin、gradle、kotlin-gradle-plugin关系
date: 2023-02-25
author: 唐明
categories: [Kotlin, Gradle]
tags: [kotlin-plugin, kotlin-gradle-plugin]
---
* TOC
{:toc}

1、`kotlin`是基于JVM的编程语言，与Java类似，且可与Java互操作；
2、`kotlin-plugin`是IDEA和Android Studio的IDE（集成开发环境）支持插件；
3、`gradle`是构建工具，与`Ant`、`Maven`类似，用于代码到编译、测试、打包等；
4、`kotlin-gradle-plugin`是使用gradle构建kotlin项目必须添加的gradle插件。

下面详细介绍：

<!--以上为摘要内容-->

`kotlin`
源码：[https://github.com/JetBrains/kotlin](https://github.com/JetBrains/kotlin)
官网：[https://kotlinlang.org/](https://kotlinlang.org/)
版本号规则：
-   _功能发布_（1._x_）带来语言的重大变化。
    
-   _增量版本_（1._十_._y_） 在功能版本之间提供，包括工具中的更新、性能改进和错误修复。
    
-   _错误修复版本_（1._十_._yz_）其中包括增量版本的错误修复。

kotlin releases：[Releases · JetBrains/kotlin (github.com)](https://github.com/JetBrains/kotlin/releases)
概览[Kotlin releases | Kotlin (kotlinlang.org)](https://kotlinlang.org/docs/releases.html#release-details)

`kotlin plugin`是跟随IDEA发布的，和IDEA发布周期一致。kotlin-plugin中包含了kotlin。通过升级`kotlin-plugin`，可以升级到新版kotlin，也可以实现IDEA对新版kotlin的支持。升级插件后，可以在`IDEA`的`Kotlin Compiler`界面选择kotlin版本。
![[Pasted image 20221106223231.png]]

gradle
兼容性：[Compatibility Matrix (gradle.org)](https://docs.gradle.org/current/userguide/compatibility.html)

`kotlin-gradle-plugin`文档：
https://kotlinlang.org/docs/gradle.html

`kotlin-gradle-plugin`插件版本应该和使用的`kotlin`版本一致。

