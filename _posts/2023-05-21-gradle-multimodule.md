---
title: Gradle多模块项目构建
author: 唐明
categories: [build]
tags: [Gradle, 多模块]
---

大型项目通常拆分为多个模块。Gradle 的多模块支持很灵活，本文介绍基本配置和常见实践。

<!--以上为摘要内容-->

## 项目结构

```
my-project/
├── build.gradle          # 根项目
├── settings.gradle       # 模块声明
├── module-api/           # API 模块
│   └── build.gradle
├── module-service/       # 服务模块
│   └── build.gradle
└── module-web/           # Web 模块
    └── build.gradle
```

## settings.gradle

声明项目包含哪些子模块：

```groovy
rootProject.name = 'my-project'

include 'module-api'
include 'module-service'
include 'module-web'
```

## 根项目 build.gradle

统一配置所有子模块：

```groovy
// 所有子模块通用配置
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

只对当前项目生效（不包含子模块）用 `allprojects`：

```groovy
allprojects {
    // 对所有项目（包括根项目）生效
}
```

## 模块间依赖

```groovy
// module-service/build.gradle
dependencies {
    implementation project(':module-api')  // 依赖另一个子模块
}

// module-web/build.gradle
dependencies {
    implementation project(':module-service')
}
```

Gradle 会按依赖顺序自动构建。

## 集中管理版本

在根 `build.gradle` 或单独的文件中：

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

根 `build.gradle` 中引入：

```groovy
apply from: 'gradle/versions.gradle'

subprojects {
    dependencies {
        implementation "com.google.guava:guava:${versions.guava}"
    }
}
```

## 构建缓存和并行

```properties
# gradle.properties
org.gradle.caching=true
org.gradle.parallel=true
```

- `caching`：重用之前构建的输出
- `parallel`：并行构建独立模块

## 构建指定模块

```bash
# 只构建某个模块及其依赖
gradle :module-web:build

# 构建所有模块
gradle build
```

## 模块间共享配置

```groovy
// 只对某些模块生效
configure(subprojects.findAll { it.name.endsWith('-web') }) {
    apply plugin: 'war'
}
```

每天前进一小步，就是一个新的高度！
