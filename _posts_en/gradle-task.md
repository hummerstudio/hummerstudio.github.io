---
title: 'Gradle Tasks in Detail: Custom Tasks and Task Dependencies'
date: 2023-05-20
author: Tang Moying
categories: [build]
tags: [Gradle, Task]
lang: en
alt_url: /post/gradle-task
---

A Task is the basic unit of a Gradle build; understanding how tasks are created, configured and executed is the key to mastering Gradle.

<!--以上为摘要内容-->

## Creating a Task

```groovy
// the simplest way
task hello {
    doLast {
        println 'Hello Gradle!'
    }
}

// equivalent way of writing it
task hello {
    doLast {
        println 'Hello Gradle!'
    }
}
```

`doLast` runs during the task execution phase. `doFirst` runs before the task executes:

```groovy
task build {
    doFirst {
        println 'Build starting...'
    }
    doLast {
        println 'Build complete!'
    }
}
```

## Task Dependencies

```groovy
task compile {
    doLast { println 'Compiling...' }
}

task test {
    dependsOn compile    // test depends on compile
    doLast { println 'Testing...' }
}

task deploy {
    dependsOn test       // deploy depends on test
    doLast { println 'Deploying...' }
}
```

Running `gradle deploy` executes compile → test → deploy in that order.

Multiple dependencies:

```groovy
task checkAll {
    dependsOn unitTest, integrationTest, lintCheck
}
```

## Creating Tasks Dynamically

```groovy
4.times { i ->
    task "step${i}" {
        doLast {
            println "Executing step ${i}"
        }
    }
}
```

## Conditional Skipping

```groovy
task deploy {
    onlyIf {
        project.hasProperty('doDeploy')
    }
    doLast {
        println 'Deploying to the server...'
    }
}
```

Run: `gradle deploy -PdoDeploy`

## Configuration Phase vs. Execution Phase

```groovy
task example {
    println 'Configuration phase execution'    // runs at any time

    doLast {
        println 'Execution phase execution'  // only runs when the task is triggered
    }
}
```

Even if you run `gradle help`, the code in the configuration phase still executes. That is why time-consuming operations should go inside `doLast`.

## Task Types

Gradle has many built-in task types:

```groovy
// copy files
task copyConfig(type: Copy) {
    from 'src/config'
    into 'build/config'
}

// delete files
task cleanBuild(type: Delete) {
    delete 'build'
}

// run a command
task runScript(type: Exec) {
    commandLine 'python', 'script.py'
}

// build a zip package
task packageApp(type: Zip) {
    from 'build/libs'
    archiveFileName = 'app.zip'
    destinationDirectory = file('dist')
}
```

## Listing All Tasks

```bash
gradle tasks --all
```

## Specifying Task Execution Order (Without Creating a Dependency)

```groovy
task A {
    doLast { println 'A' }
}
task B {
    mustRunAfter A      // B must run after A, but it is not a dependency
    doLast { println 'B' }
}
```

`gradle A B` executes in the order A → B. But `gradle B` on its own will not trigger A.

A small step forward every day takes you to a new height!
