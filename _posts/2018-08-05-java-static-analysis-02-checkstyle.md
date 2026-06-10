---
title: Java 静态代码检查（二）：用 Checkstyle 规范代码风格
author: 唐明
categories: [build]
tags: [Java, 静态检查, Checkstyle, 代码风格]
---

代码风格问题看似琐碎——大括号换不换行、变量怎么命名、import 要不要用通配符——但当团队里每个人都有自己的“偏好”时，项目代码很快就会变成一个风格大杂烩。Checkstyle 就是为解决这个问题而生的：把代码风格写进配置，用工具自动检查，谁也别争。

<!--以上为摘要内容-->

## Checkstyle 是什么

Checkstyle 是一款开源的 Java 静态代码分析工具，专注于**代码风格和格式规范**的检查。它分析的是 Java 源代码（不是字节码），检查项包括：

- 命名规范（类名、方法名、变量名、包名）
- 代码格式（缩进、换行、空格、大括号位置）
- 导入语句（是否使用通配符、是否有未使用的导入）
- Javadoc 注释（是否存在、是否完整）
- 代码量度（文件长度、方法长度、参数个数）
- 其他编码约定

Checkstyle 的定位非常明确：它**不关心代码逻辑是否正确**，只关心代码**看起来是否符合规范**。

## 快速上手

### Maven 集成

在 `pom.xml` 中加入 `maven-checkstyle-plugin`：

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-checkstyle-plugin</artifactId>
    <version>3.0.0</version>
    <configuration>
        <configLocation>google_checks.xml</configLocation>
        <encoding>UTF-8</encoding>
        <consoleOutput>true</consoleOutput>
        <failsOnError>true</failsOnError>
    </configuration>
    <executions>
        <execution>
            <id>validate</id>
            <phase>validate</phase>
            <goals>
                <goal>check</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

这里用的是 Checkstyle 内置的 `google_checks.xml`（Google Java Style）。你也可以换成 `sun_checks.xml`（Sun 的编码规范）。

执行检查：

```bash
mvn validate
# 或者直接运行插件目标
mvn checkstyle:check
```

如果检查不通过，构建会直接失败（因为配置了 `failsOnError=true`）。

### 查看报告

Checkstyle 会生成报告文件，默认位置在 `target/site/checkstyle.html`。你可以直接打开浏览器查看：

```bash
mvn checkstyle:checkstyle
# 报告生成在 target/site/checkstyle.html
```

报告会列出每个文件的问题、所在行号、违规的规则名称，一目了然。

## 常用检查规则

Checkstyle 的规则叫 Check，按类别组织。以下是实际项目中最常用的几类：

### 命名规范

```xml
<module name="Checker">
    <module name="TreeWalker">
        <!-- 类名使用大驼峰 -->
        <module name="TypeName"/>
        <!-- 方法名使用小驼峰 -->
        <module name="MethodName"/>
        <!-- 常量全大写，下划线分隔 -->
        <module name="ConstantName"/>
        <!-- 局部变量使用小驼峰 -->
        <module name="LocalVariableName"/>
        <!-- 包名全小写 -->
        <module name="PackageName"/>
    </module>
</module>
```

### 导入语句

```xml
<module name="TreeWalker">
    <!-- 禁止通配符导入 -->
    <module name="AvoidStarImport"/>
    <!-- 禁止未使用的导入 -->
    <module name="UnusedImports"/>
    <!-- 禁止冗余导入（如 java.lang 包） -->
    <module name="RedundantImport"/>
</module>
```

### 代码格式

```xml
<module name="TreeWalker">
    <!-- 限制每行最多 120 字符 -->
    <module name="LineLength">
        <property name="max" value="120"/>
    </module>
    <!-- 左大括号不换行 -->
    <module name="LeftCurly"/>
    <!-- 右大括号单独一行 -->
    <module name="RightCurly"/>
    <!-- 操作符周围需要空格 -->
    <module name="WhitespaceAround"/>
</module>
```

### Javadoc 注释

```xml
<module name="TreeWalker">
    <!-- public 方法必须有 Javadoc -->
    <module name="JavadocMethod">
        <property name="scope" value="public"/>
    </module>
    <!-- public 类/接口必须有 Javadoc -->
    <module name="JavadocType">
        <property name="scope" value="public"/>
    </module>
</module>
```

### 代码量度

```xml
<module name="TreeWalker">
    <!-- 单个文件不超过 2000 行 -->
    <module name="FileLength">
        <property name="max" value="2000"/>
    </module>
    <!-- 单个方法不超过 50 行 -->
    <module name="MethodLength">
        <property name="max" value="50"/>
    </module>
    <!-- 方法参数不超过 7 个 -->
    <module name="ParameterNumber">
        <property name="max" value="7"/>
    </module>
</module>
```

## 自定义配置

实际项目很少直接用内置配置，而是在内置配置基础上调整。典型的自定义配置结构：

```xml
<?xml version="1.0"?>
<!DOCTYPE module PUBLIC
    "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN"
    "https://checkstyle.org/dtds/configuration_1_3.dtd">
<module name="Checker">
    <property name="charset" value="UTF-8"/>
    <property name="severity" value="warning"/>

    <!-- 基于 Google Style 并做调整 -->
    <module name="TreeWalker">
        <!-- 允许 java 文件头有版权声明 -->
        <module name="RegexpHeader">
            <property name="header"
                value="^/\*$\n^ \* Copyright.*$\n^ \*/\n"/>
        </module>
        <!-- 忽略 System.out 检查（允许在 main 方法中使用） -->
        <!-- <module name="Regexp">
            <property name="format" value="System\.out\.println"/>
            <property name="illegalPattern" value="true"/>
        </module> -->
    </module>

    <!-- 排除自动生成的代码 -->
    <module name="SuppressionFilter">
        <property name="file" value="checkstyle-suppressions.xml"/>
    </module>
</module>
```

### 忽略特定文件

通过 `checkstyle-suppressions.xml` 排除不需要检查的文件：

```xml
<?xml version="1.0"?>
<!DOCTYPE suppressions PUBLIC
    "-//Checkstyle//DTD SuppressionFilter Configuration 1.2//EN"
    "https://checkstyle.org/dtds/suppressions_1_2.dtd">
<suppressions>
    <!-- 忽略自动生成的代码 -->
    <suppress files=".*[\\/]generated[\\/].*" checks=".*"/>
    <!-- 忽略测试文件中的 magic number 检查 -->
    <suppress files=".*Test\.java" checks="MagicNumber"/>
</suppressions>
```

### 忽略代码中的特定行

有时一段代码确实存在“违规”但又是合理的，可以用注释局部忽略：

```java
// CHECKSTYLE:OFF
// 这里是需要跳过检查的特殊代码
legacyCode.doWeirdThing();
// CHECKSTYLE:ON

@SuppressWarnings("checkstyle:MethodName")
public void legacy_method_name() { // 保留旧命名
    // ...
}
```

## 在 IDE 中集成

在提交代码前就发现风格问题，比等到 CI 上再报错要高效得多。

### IntelliJ IDEA

安装 `CheckStyle-IDEA` 插件，然后在 `Preferences → Tools → Checkstyle` 中添加自定义配置。即可在编辑器中实时看到 Checkstyle 的问题提示。

### Eclipse

安装 `Eclipse Checkstyle Plugin`（`eclipse-cs`），配置规则文件后可以实时检查，并支持快速修复（如自动格式化 import）。

## 常见问题

### 规则太严格怎么办？

调整 severity 等级，将不想要的规则级别设为 `ignore`：

```xml
<module name="JavadocMethod">
    <property name="severity" value="ignore"/>
</module>
```

### 和团队编码规范的映射

建议的做法是：先让团队在 Code Review 中积累“高频争议点”，然后将争议点对应的 Checkstyle 规则写入配置。这样配置是“长出来的”，不是一次性“拍出来的”，团队接受度更高。

## 小结

Checkstyle 解决的是“代码是否整齐划一”的问题。它简单、成熟、生态完善，是 Java 静态检查的入门首选。但它只关心格式和风格，不关心代码是否有 Bug——那是 PMD 和 SpotBugs 的工作，后面的文章会继续介绍。

每天前进一小步，就是一个新的高度！
