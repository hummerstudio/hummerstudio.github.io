---
title: Maven Profile——不同环境使用不同配置
author: 唐明
categories: [build]
tags: [Maven, Profile, 多环境]
---

开发、测试、生产环境的配置往往不同（数据库地址、日志级别等）。Maven 的 Profile 机制就是为解决这个问题设计的。

<!--以上为摘要内容-->

## 定义 Profile

在 `pom.xml` 中：

```xml
<profiles>
    <profile>
        <id>dev</id>
        <properties>
            <env.name>development</env.name>
            <db.url>jdbc:mysql://localhost:3306/dev_db</db.url>
        </properties>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
    </profile>

    <profile>
        <id>prod</id>
        <properties>
            <env.name>production</env.name>
            <db.url>jdbc:mysql://prod-server:3306/prod_db</db.url>
        </properties>
    </profile>
</profiles>
```

## 激活 Profile

```bash
# 激活单个
mvn package -Pdev
mvn package -Pprod

# 激活多个
mvn package -Pdev,debug

# 排除某个（prod 有 activeByDefault 时）
mvn package -P!prod
```

## 配合资源过滤使用

在 `src/main/resources/application.properties` 中：

```properties
env.name=${env.name}
db.url=${db.url}
```

然后在 pom.xml 的 `<build>` 中开启过滤：

```xml
<resources>
    <resource>
        <directory>src/main/resources</directory>
        <filtering>true</filtering>
    </resource>
</resources>
```

打包时 Maven 会把 `${env.name}` 替换为对应 Profile 的值。

## 按条件自动激活

```xml
<!-- JDK 版本触发 -->
<activation>
    <jdk>[11,)</jdk>
</activation>

<!-- 操作系统触发 -->
<activation>
    <os>
        <name>Windows 10</name>
        <family>windows</family>
    </os>
</activation>

<!-- 属性存在触发 -->
<activation>
    <property>
        <name>ci</name>
    </property>
</activation>
```

## 在 settings.xml 中定义全局 Profile

`~/.m2/settings.xml`（所有项目共享）：

```xml
<profiles>
    <profile>
        <id>company-repo</id>
        <repositories>
            <repository>
                <id>internal</id>
                <url>https://nexus.company.com/repository/maven-public/</url>
            </repository>
        </repositories>
    </profile>
</profiles>

<activeProfiles>
    <activeProfile>company-repo</activeProfile>
</activeProfiles>
```

## 在 Profile 中覆盖依赖

```xml
<profile>
    <id>local</id>
    <dependencies>
        <dependency>
            <groupId>com.example</groupId>
            <artifactId>mock-service</artifactId>
            <version>1.0</version>
        </dependency>
    </dependencies>
</profile>
```

本地开发时用 mock 实现，生产用真实实现。

## 查看当前激活的 Profile

```bash
mvn help:active-profiles
```

每天前进一小步，就是一个新的高度！
