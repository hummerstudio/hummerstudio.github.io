---
title: Gradle Task详解——自定义任务和任务依赖
author: 唐明
categories: [build]
tags: [Gradle, Task]
---

Task 是 Gradle 构建的基本单元，理解 Task 的创建、配置和执行是掌握 Gradle 的关键。

<!--以上为摘要内容-->

## 创建 Task

```groovy
// 最简方式
task hello {
    doLast {
        println 'Hello Gradle!'
    }
}

// 等价写法
task hello {
    doLast {
        println 'Hello Gradle!'
    }
}
```

`doLast` 在任务执行阶段运行。`doFirst` 在任务执行前运行：

```groovy
task build {
    doFirst {
        println '构建开始...'
    }
    doLast {
        println '构建完成!'
    }
}
```

## 任务依赖

```groovy
task compile {
    doLast { println '编译...' }
}

task test {
    dependsOn compile    // test 依赖 compile
    doLast { println '测试...' }
}

task deploy {
    dependsOn test       // deploy 依赖 test
    doLast { println '部署...' }
}
```

执行 `gradle deploy` 会依次执行 compile → test → deploy。

多个依赖：

```groovy
task checkAll {
    dependsOn unitTest, integrationTest, lintCheck
}
```

## 动态创建 Task

```groovy
4.times { i ->
    task "step${i}" {
        doLast {
            println "执行步骤 ${i}"
        }
    }
}
```

## 条件跳过

```groovy
task deploy {
    onlyIf {
        project.hasProperty('doDeploy')
    }
    doLast {
        println '部署到服务器...'
    }
}
```

执行：`gradle deploy -PdoDeploy`

## 配置阶段 vs 执行阶段

```groovy
task example {
    println '配置阶段执行'    // 任何时候都会执行

    doLast {
        println '执行阶段执行'  // 只有任务被触发时才执行
    }
}
```

即使运行 `gradle help`，配置阶段的代码也会执行。这就是为什么耗时操作要放在 `doLast` 里。

## Task 类型

Gradle 内置了许多 Task 类型：

```groovy
// 复制文件
task copyConfig(type: Copy) {
    from 'src/config'
    into 'build/config'
}

// 删除文件
task cleanBuild(type: Delete) {
    delete 'build'
}

// 执行命令
task runScript(type: Exec) {
    commandLine 'python', 'script.py'
}

// 打 zip 包
task packageApp(type: Zip) {
    from 'build/libs'
    archiveFileName = 'app.zip'
    destinationDirectory = file('dist')
}
```

## 查看所有任务

```bash
gradle tasks --all
```

## 指定任务执行顺序（不建立依赖）

```groovy
task A {
    doLast { println 'A' }
}
task B {
    mustRunAfter A      // B 必须在 A 之后，但不是依赖
    doLast { println 'B' }
}
```

`gradle A B` 执行顺序是 A → B。但单独 `gradle B` 不会触发 A。

每天前进一小步，就是一个新的高度！
