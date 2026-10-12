---
title: Distinguishing the Three Different Levels of Dependencies in Gradle
date: 2023-03-18
author: Tang Moying
categories: [build]
tags: [dependencies]
lang: en
alt_url: /post/gradle-dependencies-plugins-buildscript
---

`Gradle` is a very flexible and powerful build system, but its concepts are also relatively complex. Still, as long as you grasp the core and make the distinctions clear, you won't find it confusing.

Does the build script below seem hard to understand:

```
buildscript {
    the repository for the build script's dependencies
    repositories {
        mavenCentral()
    }
    // build script dependencies
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

There are a great many tools involved in DevOps, and every tool comes with lengthy documentation; rote memorisation won't cut it. The right way is to understand the terminology of the core concepts, distinguish between the different objects, and grasp what the designers intended, until you reach the state of "of course", of "naturally it should be so".

There are three subjects in `Gradle`: gradle itself, the project (that you want to build with gradle), and the build script (written using gradle).


Because `Gradle` is an extensible build system and its build scripts are executable scripts rather than an `xml` markup language like `Ant` and `Maven`, both of them have dependencies.


Of course, the project has dependencies too.


`gradle`'s own dependencies are called `plugins`. They extend its own functionality, just as `IDEA` has plugins and `Jenkins` has plugins, and they are expressed with `plugins`.

The project's dependencies do not directly provide functionality; rather, the code you write in the project needs to depend on these libraries, and they are expressed with `dependencies`.

`gradle`'s build script is expressed with `buildscript`, which says exactly what it means.


Once you understand the concepts above, take another look at the build script below with comments added — it becomes very easy to understand!

```
// build script configuration  
buildscript {
    the repository for the build script's dependencies
    repositories {
        mavenCentral()
    }
    // build script dependencies
    dependencies {
        classpath 'com.android.tools.build:gradle:4.2.0'
    }
}
// the repository for the project's dependencies
repositories {
    mavenCentral()
    jcenter()
    google()
}
// project dependency configuration
dependencies {
    implementation 'com.google.guava:guava:30.1-jre'
    testImplementation 'junit:junit:4.13.2'
}  
// the plugins that this gradle build tool depends on
plugins {
      id 'com.android.application'
      id 'org.jetbrains.kotlin.jvm' version '1.5.10'
}
```
