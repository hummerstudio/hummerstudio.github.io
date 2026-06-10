---
title: Gradle Wrapper——统一团队的构建环境
author: 唐明
categories: [build]
tags: [Gradle, Wrapper]
---

Gradle Wrapper 是 Gradle 官方推荐的执行方式，它确保团队所有人使用相同版本的 Gradle，避免"我这能跑你那不行"的问题。

<!--以上为摘要内容-->

## 什么是 Gradle Wrapper

Wrapper 是一组小文件，放在项目根目录下：

```
gradlew        # Unix/Mac 执行脚本
gradlew.bat    # Windows 执行脚本
gradle/
  └── wrapper/
      ├── gradle-wrapper.jar          # 引导程序
      └── gradle-wrapper.properties   # 版本配置
```

使用 Wrapper 后，不需要全局安装 Gradle——首次执行 `gradlew` 时它会自动下载指定版本的 Gradle。

## 生成 Wrapper

```bash
gradle wrapper --gradle-version 8.5
```

或者直接在 `build.gradle` 中配置：

```groovy
wrapper {
    gradleVersion = '8.5'
    distributionType = Wrapper.DistributionType.ALL
}
```

然后执行 `gradle wrapper`。

## gradle-wrapper.properties

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.5-bin.zip
networkTimeout=10000
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

- `distributionUrl`：Gradle 分发包地址
- `-bin.zip` vs `-all.zip`：bin 只含运行时，all 含源码和文档

## 日常使用

用 `gradlew` 代替 `gradle`：

```bash
# 之前
gradle build

# 用 Wrapper
./gradlew build          # Mac/Linux
gradlew.bat build        # Windows
```

## 升级 Gradle 版本

```bash
./gradlew wrapper --gradle-version 8.7
```

或者直接修改 `gradle-wrapper.properties` 中的 `distributionUrl`。

## CI/CD 中的好处

CI 机器不需要预装 Gradle，只需有 JDK 即可：

```yaml
# GitHub Actions
- name: Build
  run: ./gradlew build
```

## 自定义 Wrapper jar 位置

内网环境可以指向私服：

```properties
distributionUrl=https\://nexus.company.com/gradle-dist/gradle-8.5-all.zip
```

## 验证 Wrapper jar

`gradle-wrapper.jar` 应提交到版本控制。Gradle 官方提供了校验和，可在下载页面对比。

每天前进一小步，就是一个新的高度！
