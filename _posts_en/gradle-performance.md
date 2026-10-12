---
title: Gradle Incremental Builds and Build Cache Optimization
date: 2023-06-03
author: Tang Moying
categories: [build]
tags: [Gradle, Performance Tuning, Caching]
lang: en
alt_url: /post/gradle-performance
---

As projects grow larger, Gradle build times can get longer and longer. Mastering incremental builds and the caching mechanisms can significantly speed up day-to-day development.

<!--以上为摘要内容-->

## How Incremental Builds Work

Gradle decides whether a Task needs to run again by comparing its inputs and outputs:

- Inputs: source files, dependencies, configuration
- Outputs: the generated classes, jars, reports and so on
- If neither the inputs nor the outputs have changed → skip (UP-TO-DATE)

## Declaring Inputs and Outputs for a Custom Task

```groovy
task generateDocs {
    inputs.dir 'src/docs'         // input directory
    outputs.dir 'build/docs'      // output directory

    doLast {
        // the logic that generates the docs
        copy {
            from inputs.files
            into outputs.files.singleFile
        }
    }
}
```

The second run shows `UP-TO-DATE` and skips it entirely.

## Build Cache

```properties
# gradle.properties
org.gradle.caching=true
```

Once enabled, Gradle caches Task outputs. Even after switching branches or rebuilding after a clean, as long as the inputs have not changed the outputs can be restored from the cache.

### Remote Build Cache (Shared Across CI)

```properties
org.gradle.caching=true
# requires Gradle Enterprise or a self-hosted node
```

Cache entries from CI builds can be pulled locally, greatly reducing the time of the first build.

## Configuration Cache

An experimental feature in Gradle 7.0+:

```properties
org.gradle.configuration-cache=true
```

It caches the result of the configuration phase and skips the whole configuration phase. The effect is striking on large multi-module projects.

## Parallel Builds

```properties
org.gradle.parallel=true
```

Independent modules are compiled in parallel. There is a clear improvement for multi-module projects.

## Configuration on Demand

```properties
org.gradle.configureondemand=true
```

Only the modules that are actually needed are configured, instead of all of them. It fits a limited set of scenarios, so enable it with care.

## Daemon Tuning

```properties
org.gradle.daemon=true
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
```

Gradle enables the Daemon by default. Give it enough JVM memory to avoid frequent GC.

## Profiling Build Time

```bash
# generate a build scan report
./gradlew build --scan

# see how long each task takes
./gradlew build --profile
```

`--profile` generates an HTML report under `build/reports/profile/`.

## Skipping Unnecessary Work

```bash
# skip the tests
./gradlew build -x test

# build only the modules you need
./gradlew :module-api:build
```

## Parallel Tests

```groovy
test {
    maxParallelForks = Runtime.runtime.availableProcessors()
}
```

Run tests in parallel on a multi-core CPU; the effect is obvious when you have a lot of tests.

A small step forward every day is a new height!
