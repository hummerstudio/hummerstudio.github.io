---
title: Maven依赖管理——scope、传递依赖和排除
author: 唐明
categories: [build]
tags: [Maven, 依赖管理]
---
* TOC
{:toc}

Maven 的依赖管理机制很强大，但 scope（作用域）、传递依赖和依赖冲突也经常让人困惑。

<!--以上为摘要内容-->

## 五种依赖 scope

```xml
<dependency>
    <groupId>junit</groupId>
    <artifactId>junit</artifactId>
    <version>4.13.2</version>
    <scope>test</scope>
</dependency>
```

| scope | 编译 | 测试 | 运行 | 打包 | 典型场景 |
|-------|------|------|------|------|----------|
| compile（默认） | ✓ | ✓ | ✓ | ✓ | 核心依赖 |
| provided | ✓ | ✓ | ✗ | ✗ | Servlet API |
| runtime | ✗ | ✓ | ✓ | ✓ | JDBC 驱动 |
| test | ✗ | ✓ | ✗ | ✗ | JUnit |
| system | ✓ | ✓ | ✓ | ✗ | 本地 jar |

### provided

运行时由容器提供，不打包进 war/jar：

```xml
<dependency>
    <groupId>javax.servlet</groupId>
    <artifactId>javax.servlet-api</artifactId>
    <version>4.0.1</version>
    <scope>provided</scope>
</dependency>
```

### runtime

编译不需要，运行时需要：

```xml
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.33</version>
    <scope>runtime</scope>
</dependency>
```

## 传递依赖

A 依赖 B，B 依赖 C，则 A 自动获得 C。传递规则：

- scope 取最短路径
- 同路径时取最先声明的
- 传递时 scope 可能降级（compile → runtime → test）

## 排除传递依赖

```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-core</artifactId>
    <version>5.3.20</version>
    <exclusions>
        <exclusion>
            <groupId>commons-logging</groupId>
            <artifactId>commons-logging</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

Spring 自带 commons-logging 桥接，排除它避免冲突。

## 查看依赖树

```bash
mvn dependency:tree
```

输出类似：

```
com.example:my-app:jar:1.0.0
+- org.springframework:spring-core:jar:5.3.20:compile
|  \- org.springframework:spring-jcl:jar:5.3.20:compile
+- junit:junit:jar:4.13.2:test
   \- org.hamcrest:hamcrest-core:jar:1.3:test
```

## 查看哪些依赖引入了某个包

```bash
mvn dependency:tree -Dincludes=commons-logging
```

## 统一管理版本

在 `<dependencyManagement>` 中声明版本，子模块引用时不写版本号：

```xml
<!-- 父 pom -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.google.guava</groupId>
            <artifactId>guava</artifactId>
            <version>31.1-jre</version>
        </dependency>
    </dependencies>
</dependencyManagement>

<!-- 子模块引用时不写版本 -->
<dependency>
    <groupId>com.google.guava</groupId>
    <artifactId>guava</artifactId>
</dependency>
```

## 可选依赖

```xml
<dependency>
    <groupId>com.example</groupId>
    <artifactId>extra-feature</artifactId>
    <version>1.0</version>
    <optional>true</optional>
</dependency>
```

`optional=true` 的依赖不会传递给下游项目，需要下游项目自行声明。

每天前进一小步，就是一个新的高度！
