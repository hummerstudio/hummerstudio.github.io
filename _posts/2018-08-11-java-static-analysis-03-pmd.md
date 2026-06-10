---
title: Java 静态代码检查（三）：用 PMD 发现不良实践
author: 唐明
categories: [build]
tags: [Java, 静态检查, PMD, 代码质量]
---

上一篇文章介绍了 Checkstyle，它负责“代码看起来规不规范”。但代码格式正确了，就真的是好代码吗？空的 catch 块、用 `==` 比较字符串、在循环里拼接字符串——这些写法格式上挑不出毛病，但实践中迟早会出问题。PMD 就是为发现这些“不良实践”而设计的。

<!--以上为摘要内容-->

## PMD 是什么

PMD 是一款开源的 Java 静态代码分析工具，专注于**发现不良编码实践和潜在缺陷**。它分析的是 Java 源代码的 AST（抽象语法树），能够检测：

- **潜在的 Bug**：空 catch 块、用 `==` 代替 `equals()`、关闭资源失败
- **低效代码**：循环中拼接字符串、不必要的对象创建、过度的同步
- **设计问题**：圈复杂度太高、God Class、过深的方法嵌套
- **代码重复**：Copy-Paste Detector（CPD）检测重复代码块

### 与 Checkstyle 的区别

| 维度 | Checkstyle | PMD |
|------|-----------|-----|
| 分析对象 | 源码格式 | 源码结构（AST） |
| 关注点 | 代码“看起来怎样” | 代码“写得对不对” |
| 典型问题 | 命名不规范、缺少注释 | 空 catch、==比字符串 |
| 规则数量 | 约 150 个 | 约 300 个 |
| 代码复制检测 | 不支持 | 内置 CPD |

一句话：**Checkstyle 管格式，PMD 管写法。**

## 快速上手

### Maven 集成

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-pmd-plugin</artifactId>
    <version>3.9.0</version>
    <configuration>
        <rulesets>
            <ruleset>/category/java/bestpractices.xml</ruleset>
            <ruleset>/category/java/errorprone.xml</ruleset>
        </rulesets>
    </configuration>
    <executions>
        <execution>
            <phase>validate</phase>
            <goals>
                <goal>check</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

PMD 内置了多套规则集（Ruleset），放在 `rulesets/java/` 目录下。

执行检查：

```bash
mvn validate
# 或直接运行
mvn pmd:check
```

## 内置规则集一览

PMD 6.x 将规则按类别重新组织。以下是主要的规则集：

| 规则集 | 说明 | 示例规则 |
|--------|------|---------|
| `bestpractices` | 公认的最佳实践 | 避免在循环中 new 对象、用 Arrays.asList 代替手写 |
| `errorprone` | 容易出错的写法 | 空 catch 块、用==比较对象、equals 方法参数颠倒 |
| `performance` | 性能相关问题 | String 用+拼接、不必要的大对象创建 |
| `design` | 设计问题 | 圈复杂度太高、God Class |
| `codestyle` | 代码风格 | 不必要的修饰符、多余括号 |
| `multithreading` | 并发问题 | 未同步的访问、不可靠的 wait 用法 |
| `security` | 安全问题 | 硬编码密码、SQL 注入风险 |

建议从 `bestpractices` 和 `errorprone` 开始引入，这两类问题修复收益最高。

## 重点规则详解

### 空 catch 块

```java
// PMD 会报：Avoid empty catch blocks
try {
    doSomething();
} catch (IOException e) {
    // 吞掉了异常，没人知道出过问题
}
```

**修复**：至少打一行日志，或把异常重新抛出。

### 用 == 比较字符串

```java
// PMD 会报：Use equals() to compare strings
if (userInput == "yes") {
    // == 比较的是引用，不是内容
}
```

**修复**：改用 `"yes".equals(userInput)`。

### 不必要的对象创建

```java
// PMD 会报：Avoid instantiating new objects inside loops
for (int i = 0; i < 1000; i++) {
    String result = new String("hello");  // 每次都建新对象
}
```

**修复**：把对象创建移到循环外，或复用不可变对象。

### 空 if 语句

```java
// PMD 会报：Avoid empty if statements
if (condition) {
    // 什么都没做
}
```

### equals 方法错误

```java
// PMD 会报：equals method does not check for null argument
@Override
public boolean equals(Object obj) {
    return this.name.equals(((MyClass) obj).name);  // 没判断 null
}
```

## 自定义规则集

实际使用中通常只启用部分规则：

```xml
<?xml version="1.0"?>
<ruleset name="my-pmd-rules"
    xmlns="http://pmd.sourceforge.net/ruleset/2.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://pmd.sourceforge.net/ruleset/2.0.0
        http://pmd.sourceforge.net/ruleset_2_0_0.xsd">

    <description>项目自定义 PMD 规则集</description>

    <!-- 引入最佳实践规则 -->
    <rule ref="category/java/bestpractices.xml">
        <!-- 排除部分太严格的规则 -->
        <exclude name="JUnitAssertionsShouldIncludeMessage"/>
        <exclude name="ArrayIsStoredDirectly"/>
    </rule>

    <!-- 引入易出错规则，调整部分阈值 -->
    <rule ref="category/java/errorprone.xml">
        <exclude name="AvoidDuplicateLiterals"/>
    </rule>

    <!-- 自定义规则参数 -->
    <rule ref="category/java/design.xml/CyclomaticComplexity">
        <properties>
            <property name="methodReportLevel" value="10"/>
            <property name="classReportLevel" value="40"/>
        </properties>
    </rule>

    <!-- 排除测试文件 -->
    <rule ref="category/java/bestpractices.xml/UnitTestShouldIncludeAssert">
        <properties>
            <property name="violationSuppressXPath"
                value="//ClassOrInterfaceDeclaration[not(ends-with(@Image, 'Test'))]"/>
        </properties>
    </rule>
</ruleset>
```

在 Maven 中使用自定义规则集：

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-pmd-plugin</artifactId>
    <version>3.9.0</version>
    <configuration>
        <rulesets>
            <ruleset>${project.basedir}/pmd-rules.xml</ruleset>
        </rulesets>
    </configuration>
</plugin>
```

## Copy-Paste Detector（CPD）

PMD 内置了代码重复检测工具 CPD，可以发现项目中的复制粘贴代码：

```bash
mvn pmd:cpd
```

- `minimum-tokens`：至少多少个 token 相同才算重复（默认 100）
- 报告生成在 `target/site/cpd.html`

代码重复是技术债务的主要来源之一——改一处，漏了另一处，Bug 就来了。

## 增量引入策略

直接在全量代码上打开所有规则，通常会爆出几百上千个警告，容易让人产生“不管了”的放弃心态。建议分步走：

### 第一阶段：只开最关键的规则

```xml
<!-- 只引入 errorprone 和 bestpractices -->
<rule ref="category/java/errorprone.xml"/>
<rule ref="category/java/bestpractices.xml"/>
```

修复完这轮问题后，再逐步引入 design 和 performance。

### 第二阶段：引入设计相关规则

```xml
<rule ref="category/java/design.xml"/>
```

### 第三阶段：开启剩余规则

根据团队接受度，逐步加入 codestyle、multithreading、security。

### 新代码 vs 老代码

老代码一次性修复成本太高，可以配合 PMD 的 `violationSuppressXPath` 或注解机制，对老代码暂时忽略，但要求所有新代码必须通过检查。

## 小结

PMD 是 Checkstyle 的“升级版”——不只是看格式，而是真正分析代码结构，找出那些“看起来没问题，但实践中有隐患”的写法。把它和 Checkstyle 搭配使用，一个管风格，一个管写法，基本能覆盖源代码层面的所有静态检查需求。

下一篇将介绍 FindBugs——它更进一步，直接分析字节码来找到真正的 Bug。

每天前进一小步，就是一个新的高度！
