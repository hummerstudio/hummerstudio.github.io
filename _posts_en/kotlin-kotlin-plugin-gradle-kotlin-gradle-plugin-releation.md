---
title: The Relationship Between kotlin, kotlin-plugin, gradle and kotlin-gradle-plugin
date: 2023-02-25
author: Tang Moying
categories: [build]
tags: [kotlin-plugin, kotlin-gradle-plugin]
lang: en
alt_url: /post/kotlin-kotlin-plugin-gradle-kotlin-gradle-plugin-releation
---

1. `kotlin` is a programming language based on the JVM, similar to Java and interoperable with Java;
2. `kotlin-plugin` is the IDE (integrated development environment) support plugin for IDEA and Android Studio;
3. `gradle` is a build tool, similar to `Ant` and `Maven`, used for everything from code through compilation, testing and packaging;
4. `kotlin-gradle-plugin` is the Gradle plugin that must be added to build a kotlin project with Gradle.

The details follow:

<!--以上为摘要内容-->

`kotlin`
Source code: [https://github.com/JetBrains/kotlin](https://github.com/JetBrains/kotlin)
Official website: [https://kotlinlang.org/](https://kotlinlang.org/)
Version numbering rules:
-   _Feature releases_ (1._x_) bring major changes to the language.
    
-   _Incremental releases_ (1._10_._y_) are provided between feature releases and include tooling updates, performance improvements and bug fixes.
    
-   _Bug fix releases_ (1._10_._yz_) contain bug fixes for the incremental releases.

kotlin releases: [Releases · JetBrains/kotlin (github.com)](https://github.com/JetBrains/kotlin/releases)
Overview [Kotlin releases | Kotlin (kotlinlang.org)](https://kotlinlang.org/docs/releases.html#release-details)

`kotlin plugin` is released together with IDEA, on the same release cycle as IDEA. kotlin-plugin includes kotlin. By upgrading `kotlin-plugin` you can upgrade to a newer version of kotlin, and you can also give IDEA support for the newer kotlin. After upgrading the plugin, you can select the kotlin version on IDEA's `Kotlin Compiler` screen.
![[Pasted image 20221106223231.png]]

gradle
Compatibility: [Compatibility Matrix (gradle.org)](https://docs.gradle.org/current/userguide/compatibility.html)

`kotlin-gradle-plugin` documentation:
https://kotlinlang.org/docs/gradle.html

The `kotlin-gradle-plugin` plugin version should match the `kotlin` version you are using.
