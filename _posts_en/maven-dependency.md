---
title: 'Maven Dependency Management: scope, Transitive Dependencies and Exclusions'
date: 2023-05-06
author: Tang Moying
categories: [build]
tags: [Maven, Dependency Management]
lang: en
alt_url: /post/maven-dependency
---

Maven's dependency management mechanism is very powerful, but scope, transitive dependencies and dependency conflicts often confuse people too.

<!--以上为摘要内容-->

## The Five Dependency Scopes

```xml
<dependency>
    <groupId>junit</groupId>
    <artifactId>junit</artifactId>
    <version>4.13.2</version>
    <scope>test</scope>
</dependency>
```

| scope | Compile | Test | Runtime | Package | Typical Use Case |
|-------|------|------|------|------|----------|
| compile (default) | ✓ | ✓ | ✓ | ✓ | Core dependency |
| provided | ✓ | ✓ | ✗ | ✗ | Servlet API |
| runtime | ✗ | ✓ | ✓ | ✓ | JDBC driver |
| test | ✗ | ✓ | ✗ | ✗ | JUnit |
| system | ✓ | ✓ | ✓ | ✗ | Local jar |

### provided

Provided by the container at runtime, not packaged into the war/jar:

```xml
<dependency>
    <groupId>javax.servlet</groupId>
    <artifactId>javax.servlet-api</artifactId>
    <version>4.0.1</version>
    <scope>provided</scope>
</dependency>
```

### runtime

Not needed for compilation, needed at runtime:

```xml
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.33</version>
    <scope>runtime</scope>
</dependency>
```

## Transitive Dependencies

A depends on B and B depends on C, so A automatically gets C. Transitive rules:

- scope takes the shortest path
- along the same path, the declaration that comes first wins
- during transitivity the scope may be downgraded (compile → runtime → test)

## Excluding Transitive Dependencies

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

Spring ships with the commons-logging bridge; excluding it avoids conflicts.

## Viewing the Dependency Tree

```bash
mvn dependency:tree
```

The output is similar to:

```
com.example:my-app:jar:1.0.0
+- org.springframework:spring-core:jar:5.3.20:compile
|  \- org.springframework:spring-jcl:jar:5.3.20:compile
+- junit:junit:jar:4.13.2:test
   \- org.hamcrest:hamcrest-core:jar:1.3:test
```

## Finding Out Which Dependency Pulls In a Package

```bash
mvn dependency:tree -Dincludes=commons-logging
```

## Centralized Version Management

Declare the version in `<dependencyManagement>`, and no version number is written when a submodule references it:

```xml
<!-- parent pom -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.google.guava</groupId>
            <artifactId>guava</artifactId>
            <version>31.1-jre</version>
        </dependency>
    </dependencies>
</dependencyManagement>

<!-- no version is written when the submodule references it -->
<dependency>
    <groupId>com.google.guava</groupId>
    <artifactId>guava</artifactId>
</dependency>
```

## Optional Dependencies

```xml
<dependency>
    <groupId>com.example</groupId>
    <artifactId>extra-feature</artifactId>
    <version>1.0</version>
    <optional>true</optional>
</dependency>
```

A dependency with `optional=true` is not passed on to downstream projects; the downstream project has to declare it itself.

A small step forward every day takes you to a new height!
