---
title: Gradle自定义插件——三种方式对比
author: 唐明
categories: [build]
tags: [Gradle, 插件, Plugin]
---
* TOC
{:toc}

Gradle 插件可以封装构建逻辑，在多个项目间复用。创建插件有三种方式，各有适用场景。

<!--以上为摘要内容-->

## 方式一：Build Script 内联

直接在 `build.gradle` 中写，适合简单逻辑：

```groovy
// build.gradle
class GreetingPlugin implements Plugin<Project> {
    void apply(Project project) {
        project.task('greeting') {
            doLast {
                println "Hello from ${project.name}!"
            }
        }
    }
}

apply plugin: GreetingPlugin
```

运行 `gradle greeting`。

## 方式二：buildSrc 目录

放在 `buildSrc/` 下，所有模块自动可用：

```
buildSrc/
├── build.gradle
└── src/main/groovy/
    └── com/example/GreetingPlugin.groovy
```

`buildSrc/build.gradle`：

```groovy
plugins {
    id 'groovy'
}
repositories {
    mavenCentral()
}
```

`GreetingPlugin.groovy`：

```groovy
package com.example

import org.gradle.api.Plugin
import org.gradle.api.Project

class GreetingPlugin implements Plugin<Project> {
    void apply(Project project) {
        project.extensions.create('greeting', GreetingExtension)
        project.task('greeting') {
            doLast {
                def ext = project.extensions.greeting
                println "${ext.message} from ${project.name}!"
            }
        }
    }
}

class GreetingExtension {
    String message = 'Hello'
}
```

使用：

```groovy
// 子模块 build.gradle
apply plugin: com.example.GreetingPlugin

greeting {
    message = 'Hi'
}
```

## 方式三：独立项目发布

适用于跨团队复用。创建独立 Gradle 项目，发布到 Maven 仓库。

`build.gradle`：

```groovy
plugins {
    id 'java-gradle-plugin'
    id 'maven-publish'
}

group = 'com.example'
version = '1.0.0'

gradlePlugin {
    plugins {
        greeting {
            id = 'com.example.greeting'
            implementationClass = 'com.example.GreetingPlugin'
        }
    }
}
```

发布：

```bash
./gradlew publish
```

使用方：

```groovy
plugins {
    id 'com.example.greeting' version '1.0.0'
}
```

## 三种方式对比

| 方式 | 适用场景 | 复用范围 |
|------|----------|----------|
| 内联 | 临时、一次性脚本 | 当前文件 |
| buildSrc | 项目内部复用 | 当前项目所有模块 |
| 独立发布 | 跨项目、跨团队 | 任意项目 |

## 在插件中创建 Extension

让用户可配置插件行为：

```groovy
class MyPlugin implements Plugin<Project> {
    void apply(Project project) {
        def ext = project.extensions.create('myConfig', MyExtension)
        project.task('run') {
            doLast {
                println "输出目录：${ext.outputDir}"
            }
        }
    }
}

class MyExtension {
    String outputDir = 'build/output'
}
```

用户配置：

```groovy
myConfig {
    outputDir = 'dist/release'
}
```

每天前进一小步，就是一个新的高度！
