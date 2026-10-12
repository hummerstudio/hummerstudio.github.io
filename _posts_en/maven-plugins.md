---
title: A Look at Common Maven Plugins — compiler, surefire, jar, assembly
date: 2023-05-07
author: Tang Moying
categories: [build]
tags: [Maven, Plugins]
lang: en
alt_url: /post/maven-plugins
---

Maven gets its functionality from plugins, so getting to know the common ones is required study for anyone who wants to use Maven efficiently.

<!--以上为摘要内容-->

## maven-compiler-plugin

Controls Java compilation behavior:

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <version>3.11.0</version>
    <configuration>
        <source>11</source>
        <target>11</target>
        <encoding>UTF-8</encoding>
        <parameters>true</parameters>  <!-- keep parameter names, for reflection -->
    </configuration>
</plugin>
```

You can also set these globally with properties:

```xml
<properties>
    <maven.compiler.source>11</maven.compiler.source>
    <maven.compiler.target>11</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>
```

## maven-surefire-plugin

Runs unit tests (bound to the test phase):

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.0.0</version>
    <configuration>
        <includes>
            <include>**/*Test.java</include>
            <include>**/*Tests.java</include>
        </includes>
    </configuration>
</plugin>
```

Skipping tests:

```bash
mvn package -DskipTests        # compile the tests but do not run them
mvn package -Dmaven.test.skip=true  # do not even compile the tests
```

## maven-jar-plugin

Controls jar generation:

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-jar-plugin</artifactId>
    <version>3.3.0</version>
    <configuration>
        <archive>
            <manifest>
                <mainClass>com.example.Main</mainClass>
            </manifest>
        </archive>
    </configuration>
</plugin>
```

Excluding files from the package:

```xml
<configuration>
    <excludes>
        <exclude>**/*.properties</exclude>
        <exclude>**/*.xml</exclude>
    </excludes>
</configuration>
```

## maven-assembly-plugin

Building a fat jar (one that contains all dependencies):

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-assembly-plugin</artifactId>
    <version>3.5.0</version>
    <configuration>
        <descriptorRefs>
            <descriptorRef>jar-with-dependencies</descriptorRef>
        </descriptorRefs>
        <archive>
            <manifest>
                <mainClass>com.example.Main</mainClass>
            </manifest>
        </archive>
    </configuration>
    <executions>
        <execution>
            <phase>package</phase>
            <goals>
                <goal>single</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

## maven-resources-plugin

Controls the copying and filtering (variable substitution) of resource files:

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-resources-plugin</artifactId>
    <version>3.3.0</version>
    <configuration>
        <encoding>UTF-8</encoding>
    </configuration>
</plugin>
```

Once resource filtering is enabled, `${xxx}` in files under `src/main/resources/` is replaced with the value of the corresponding Maven property. You have to turn it on in `<build>`:

```xml
<resources>
    <resource>
        <directory>src/main/resources</directory>
        <filtering>true</filtering>
    </resource>
</resources>
```

## maven-clean-plugin

Customizing the clean behavior:

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-clean-plugin</artifactId>
    <version>3.3.1</version>
    <configuration>
        <filesets>
            <fileset>
                <directory>logs/</directory>
                <includes>
                    <include>**/*.log</include>
                </includes>
            </fileset>
        </filesets>
    </configuration>
</plugin>
```

A small step forward every day is a new height!
