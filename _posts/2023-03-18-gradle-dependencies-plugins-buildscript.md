---
title: 区分gradle三个不同层次的依赖
date: 2023-03-18
author: 唐明
categories: [Gralde]
tags: [dependencies]
---
* TOC
{:toc}

`Gradle`是一个非常灵活、强大的构建系统，但其概念也相对复杂，但只要抓住核心，做好区分，就不会觉得混乱。

下面的构建脚本，是否觉得难以理解：

```
buildscript {
    构建脚本依赖的仓库
    repositories {
        mavenCentral()
    }
    // 构建脚本依赖
    dependencies {
        classpath 'com.android.tools.build:gradle:4.2.0'
    }
}
repositories {
    mavenCentral()
    jcenter()
    google()
}
dependencies {
    implementation 'com.google.guava:guava:30.1-jre'
    testImplementation 'junit:junit:4.13.2'
}  
plugins {
      id 'com.android.application'
      id 'org.jetbrains.kotlin.jvm' version '1.5.10'
}
```

<!--以上为摘要内容-->

DevOps中涉及的工具很多，每个工具都有冗长的使用文档，靠死记硬背的不行的。通过理解核心概念的术语，对不同对象进行区分，理解设计者的初衷，达到“理所当然”，“自然应如此”的境界，才是正途。

`Gradle`中有三个主体，分别是gradle（自身）、（要使用gradle进行构建的）项目、和（使用gradle编写的）构建脚本。


由于`Gradle`是一个可扩展的构建系统，其构建脚本也是可执行的脚本，而非如`Ant`和`Maven`那样的`xml`标记语言，所以两者都存在依赖。


当然，项目也有依赖。


`gradle`自身的依赖，叫`插件`，用于扩展自身的功能，就像`IDEA`有插件，`Jenkins`有插件一样，用`plugins`表示。

项目的依赖，不直接提供功能，而是项目编写代码时需要依赖这些库，用`dependencies`表示。

`gradle`构建脚本，用`buildscript`表示，文如其意。


理解清楚上述概念后，再看一下下面加上注释的构建脚本，就非常好理解了！

```
// 构建脚本配置  
buildscript {
    构建脚本依赖的仓库
    repositories {
        mavenCentral()
    }
    // 构建脚本依赖
    dependencies {
        classpath 'com.android.tools.build:gradle:4.2.0'
    }
}
// 项目依赖的仓库
repositories {
    mavenCentral()
    jcenter()
    google()
}
// 项目依赖配置
dependencies {
    implementation 'com.google.guava:guava:30.1-jre'
    testImplementation 'junit:junit:4.13.2'
}  
// gradle这个构建工具依赖的插件
plugins {
      id 'com.android.application'
      id 'org.jetbrains.kotlin.jvm' version '1.5.10'
}
```