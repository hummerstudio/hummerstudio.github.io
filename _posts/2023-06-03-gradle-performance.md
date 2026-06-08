---
title: Gradle增量构建和构建缓存优化
author: 唐明
categories: [build]
tags: [Gradle, 性能优化, 缓存]
---
* TOC
{:toc}

随着项目越来越大，Gradle 构建时间可能越来越长。掌握增量构建和缓存机制可以显著加速日常开发。

<!--以上为摘要内容-->

## 增量构建原理

Gradle 通过比较 Task 的输入和输出来决定是否需要重新执行：

- 输入（inputs）：源文件、依赖、配置
- 输出（outputs）：生成的 class、jar、报告等
- 如果输入和输出都没变 → 跳过（UP-TO-DATE）

## 为自定义 Task 声明输入输出

```groovy
task generateDocs {
    inputs.dir 'src/docs'         // 输入目录
    outputs.dir 'build/docs'      // 输出目录

    doLast {
        // 生成文档的逻辑
        copy {
            from inputs.files
            into outputs.files.singleFile
        }
    }
}
```

第二次执行会显示 `UP-TO-DATE`，直接跳过。

## 构建缓存（Build Cache）

```properties
# gradle.properties
org.gradle.caching=true
```

启用后，Gradle 会把 Task 输出缓存起来。即使切换分支、clean 后重新构建，只要输入没变，就能从缓存恢复输出。

### 远程构建缓存（CI 共享）

```properties
org.gradle.caching=true
# 需要 Gradle Enterprise 或自建节点
```

CI 构建的缓存可以被本地拉取，大幅减少首次构建时间。

## 配置缓存（Configuration Cache）

Gradle 7.0+ 的实验性功能：

```properties
org.gradle.configuration-cache=true
```

缓存配置阶段的结果，跳过整个配置阶段。对多模块大项目效果显著。

## 并行构建

```properties
org.gradle.parallel=true
```

独立模块并行编译。对多模块项目有明显提升。

## 按需配置

```properties
org.gradle.configureondemand=true
```

只配置实际需要的模块，而不是所有模块。适用场景有限，谨慎开启。

## Daemon 优化

```properties
org.gradle.daemon=true
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
```

Gradle 默认开启 Daemon。给足 JVM 内存，避免频繁 GC。

## 分析构建耗时

```bash
# 生成构建扫描报告
./gradlew build --scan

# 查看每个 task 的耗时
./gradlew build --profile
```

`--profile` 会在 `build/reports/profile/` 下生成 HTML 报告。

## 跳过不必要的工作

```bash
# 跳过测试
./gradlew build -x test

# 只构建需要的模块
./gradlew :module-api:build
```

## 并行测试

```groovy
test {
    maxParallelForks = Runtime.runtime.availableProcessors()
}
```

多核 CPU 并行跑测试，测试多时效果明显。

每天前进一小步，就是一个新的高度！
