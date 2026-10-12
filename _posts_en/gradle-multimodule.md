---
title: Building a Gradle Multi-Module Project
date: 2023-05-21
author: Tang Moying
categories: [build]
tags: [Gradle, Multi-Module]
lang: en
alt_url: /post/gradle-multimodule
---

Large projects are usually split into multiple modules. Gradle's multi-module support is very flexible; this article introduces the basic configuration and common practices.

<!--以上为摘要内容-->

## Project Structure

```
my-project/
├── build.gradle          # root project
├── settings.gradle       # module declaration
├── module-api/           # API module
│   └── build.gradle
├── module-service/       # service module
│   └── build.gradle
└── module-web/           # Web module
    └── build.gradle
```

## settings.gradle

Declare which submodules the project contains:

```groovy
rootProject.name = 'my-project'

include 'module-api'
include 'module-service'
include 'module-web'
```

## Root Project build.gradle

Configure all submodules uniformly:

```groovy
// common configuration for all submodules
subprojects {
    apply plugin: 'java'

    group = 'com.example'
    version = '1.0.0'

    repositories {
        mavenCentral()
    }

    dependencies {
        testImplementation 'junit:junit:4.13.2'
    }
}
```

To take effect only for the current project (not including submodules), use `allprojects`:

```groovy
allprojects {
    // takes effect for all projects (including the root project)
}
```

## Dependencies Between Modules

```groovy
// module-service/build.gradle
dependencies {
    implementation project(':module-api')  // depends on another submodule
}

// module-web/build.gradle
dependencies {
    implementation project(':module-service')
}
```

Gradle automatically builds in dependency order.

## Centralized Version Management

In the root `build.gradle` or in a separate file:

```groovy
// gradle/versions.gradle
ext {
    versions = [
        spring: '5.3.20',
        junit : '4.13.2',
        guava : '31.1-jre'
    ]
}
```

Included in the root `build.gradle`:

```groovy
apply from: 'gradle/versions.gradle'

subprojects {
    dependencies {
        implementation "com.google.guava:guava:${versions.guava}"
    }
}
```

## Build Caching and Parallelism

```properties
# gradle.properties
org.gradle.caching=true
org.gradle.parallel=true
```

- `caching`: reuse the output of previous builds
- `parallel`: build independent modules in parallel

## Building a Specified Module

```bash
# build only one module and its dependencies
gradle :module-web:build

# build all modules
gradle build
```

## Sharing Configuration Between Modules

```groovy
// takes effect only for certain modules
configure(subprojects.findAll { it.name.endsWith('-web') }) {
    apply plugin: 'war'
}
```

A small step forward every day takes you to a new height!
