---
title: Gradle Custom Plugins — Comparing Three Approaches
date: 2023-05-28
author: Tang Moying
categories: [build]
tags: [Gradle, Plugins, Plugin]
lang: en
alt_url: /post/gradle-plugin
---

Gradle plugins can encapsulate build logic and be reused across multiple projects. There are three ways to create a plugin, each suited to different situations.

<!--以上为摘要内容-->

## Approach 1: Inline in the build script

Write it directly in `build.gradle`; suitable for simple logic:

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

Run `gradle greeting`.

## Approach 2: A buildSrc directory

Place it under `buildSrc/` and it is automatically available to all modules:

```
buildSrc/
├── build.gradle
└── src/main/groovy/
    └── com/example/GreetingPlugin.groovy
```

`buildSrc/build.gradle`:

```groovy
plugins {
    id 'groovy'
}
repositories {
    mavenCentral()
}
```

`GreetingPlugin.groovy`:

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

Usage:

```groovy
// Submodule build.gradle
apply plugin: com.example.GreetingPlugin

greeting {
    message = 'Hi'
}
```

## Approach 3: Publishing as a standalone project

Suitable for reuse across teams. Create a standalone Gradle project and publish it to a Maven repository.

`build.gradle`:

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

Publishing:

```bash
./gradlew publish
```

On the consuming side:

```groovy
plugins {
    id 'com.example.greeting' version '1.0.0'
}
```

## Comparison of the three approaches

| Approach | Use case | Reuse scope |
|------|----------|----------|
| Inline | Temporary, one-off scripts | The current file |
| buildSrc | Reuse within a project | All modules in the current project |
| Standalone publish | Across projects and teams | Any project |

## Creating an Extension in a plugin

This lets users configure the plugin's behavior:

```groovy
class MyPlugin implements Plugin<Project> {
    void apply(Project project) {
        def ext = project.extensions.create('myConfig', MyExtension)
        project.task('run') {
            doLast {
                println "Output directory: ${ext.outputDir}"
            }
        }
    }
}

class MyExtension {
    String outputDir = 'build/output'
}
```

User configuration:

```groovy
myConfig {
    outputDir = 'dist/release'
}
```

A small step forward every day is a new height!
