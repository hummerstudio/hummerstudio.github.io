---
title: Maven常用插件介绍——compiler、surefire、jar、assembly
author: 唐明
categories: [build]
tags: [Maven, 插件]
---

Maven 的功能由插件提供，了解常用插件是高效使用 Maven 的必修课。

<!--以上为摘要内容-->

## maven-compiler-plugin

控制 Java 编译行为：

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <version>3.11.0</version>
    <configuration>
        <source>11</source>
        <target>11</target>
        <encoding>UTF-8</encoding>
        <parameters>true</parameters>  <!-- 保留参数名，反射用 -->
    </configuration>
</plugin>
```

也可以全局用 properties 设置：

```xml
<properties>
    <maven.compiler.source>11</maven.compiler.source>
    <maven.compiler.target>11</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>
```

## maven-surefire-plugin

运行单元测试（绑定到 test 阶段）：

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

跳过测试：

```bash
mvn package -DskipTests        # 编译测试但不运行
mvn package -Dmaven.test.skip=true  # 连测试都不编译
```

## maven-jar-plugin

控制 jar 包生成：

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

排除文件不打包：

```xml
<configuration>
    <excludes>
        <exclude>**/*.properties</exclude>
        <exclude>**/*.xml</exclude>
    </excludes>
</configuration>
```

## maven-assembly-plugin

打 fat jar（包含所有依赖）：

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

控制资源文件的复制和过滤（变量替换）：

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

启用资源过滤后，`src/main/resources/` 下的文件中的 `${xxx}` 会被替换为 Maven 属性值。需在 `<build>` 中开启：

```xml
<resources>
    <resource>
        <directory>src/main/resources</directory>
        <filtering>true</filtering>
    </resource>
</resources>
```

## maven-clean-plugin

自定义清理行为：

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

每天前进一小步，就是一个新的高度！
