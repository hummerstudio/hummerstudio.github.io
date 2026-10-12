---
title: 'Java Static Code Analysis (Part 3): Finding Bad Practices with PMD'
date: 2018-08-11
author: Tang Moying
categories: [test]
tags: [Java, Static Analysis, PMD, Code Quality]
lang: en
alt_url: /post/java-static-analysis-03-pmd
---

The previous article introduced Checkstyle, whose job is to decide whether code "looks standard". But if the formatting is correct, is the code really good? Empty catch blocks, comparing strings with `==`, concatenating strings inside a loop — none of these can be faulted on formatting, yet in practice they are bound to cause trouble sooner or later. PMD is designed precisely to catch these "bad practices".

<!--以上为摘要内容-->

## What Is PMD

PMD is an open-source Java static code analysis tool focused on **finding bad coding practices and latent defects**. It analyses the AST (abstract syntax tree) of Java source code and can detect:

- **Potential bugs**: empty catch blocks, using `==` instead of `equals()`, failing to close resources
- **Inefficient code**: concatenating strings in a loop, unnecessary object creation, excessive synchronisation
- **Design problems**: cyclomatic complexity that is too high, God Class, overly deep method nesting
- **Code duplication**: the Copy-Paste Detector (CPD) detects duplicated code blocks

### How It Differs from Checkstyle

| Dimension | Checkstyle | PMD |
|------|-----------|-----|
| What it analyses | Source formatting | Source structure (AST) |
| Focus | How the code "looks" | Whether the code "is written correctly" |
| Typical problems | Non-standard naming, missing comments | Empty catch, comparing strings with == |
| Number of rules | About 150 | About 300 |
| Duplicate-code detection | Not supported | Built-in CPD |

In one sentence: **Checkstyle governs formatting; PMD governs how the code is written.**

## Getting Started Quickly

### Maven Integration

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

PMD ships with several built-in rulesets, placed in the `rulesets/java/` directory.

To run the check:

```bash
mvn validate
# or run it directly
mvn pmd:check
```

## The Built-in Rulesets at a Glance

PMD 6.x reorganised the rules by category. These are the main rulesets:

| Ruleset | Description | Example rules |
|--------|------|---------|
| `bestpractices` | Accepted best practices | Avoid creating objects with new inside loops, use Arrays.asList instead of writing it out by hand |
| `errorprone` | Constructs that easily go wrong | Empty catch blocks, comparing objects with ==, reversed equals arguments |
| `performance` | Performance-related problems | Concatenating String with +, unnecessary creation of large objects |
| `design` | Design problems | Cyclomatic complexity that is too high, God Class |
| `codestyle` | Code style | Unnecessary modifiers, redundant parentheses |
| `multithreading` | Concurrency problems | Unsynchronised access, unreliable use of wait |
| `security` | Security problems | Hard-coded passwords, SQL injection risk |

It's advisable to start with `bestpractices` and `errorprone`; fixing those two categories of problem gives the highest return.

## Key Rules in Detail

### Empty catch Blocks

```java
// PMD 会报：Avoid empty catch blocks
try {
    doSomething();
} catch (IOException e) {
    // 吞掉了异常，没人知道出过问题
}
```

**Fix**: log at least one line, or rethrow the exception.

### Comparing Strings with ==

```java
// PMD 会报：Use equals() to compare strings
if (userInput == "yes") {
    // == 比较的是引用，不是内容
}
```

**Fix**: switch to `"yes".equals(userInput)`.

### Unnecessary Object Creation

```java
// PMD 会报：Avoid instantiating new objects inside loops
for (int i = 0; i < 1000; i++) {
    String result = new String("hello");  // 每次都建新对象
}
```

**Fix**: move the object creation outside the loop, or reuse an immutable object.

### Empty if Statements

```java
// PMD 会报：Avoid empty if statements
if (condition) {
    // 什么都没做
}
```

### A Faulty equals Method

```java
// PMD 会报：equals method does not check for null argument
@Override
public boolean equals(Object obj) {
    return this.name.equals(((MyClass) obj).name);  // 没判断 null
}
```

## Custom Rulesets

In practice you usually enable only some of the rules:

```xml
<?xml version="1.0"?>
<ruleset name="my-pmd-rules"
    xmlns="http://pmd.sourceforge.net/ruleset/2.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://pmd.sourceforge.net/ruleset/2.0.0
        http://pmd.sourceforge.net/ruleset_2_0_0.xsd">

    <description>项目自定义 PMD 规则集</description>

    <!-- Bring in the best-practice rules -->
    <rule ref="category/java/bestpractices.xml">
        <!-- Exclude some rules that are too strict -->
        <exclude name="JUnitAssertionsShouldIncludeMessage"/>
        <exclude name="ArrayIsStoredDirectly"/>
    </rule>

    <!-- Bring in the error-prone rules and adjust some thresholds -->
    <rule ref="category/java/errorprone.xml">
        <exclude name="AvoidDuplicateLiterals"/>
    </rule>

    <!-- Customise rule parameters -->
    <rule ref="category/java/design.xml/CyclomaticComplexity">
        <properties>
            <property name="methodReportLevel" value="10"/>
            <property name="classReportLevel" value="40"/>
        </properties>
    </rule>

    <!-- Exclude test files -->
    <rule ref="category/java/bestpractices.xml/UnitTestShouldIncludeAssert">
        <properties>
            <property name="violationSuppressXPath"
                value="//ClassOrInterfaceDeclaration[not(ends-with(@Image, 'Test'))]"/>
        </properties>
    </rule>
</ruleset>
```

Using a custom ruleset in Maven:

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

## Copy-Paste Detector (CPD)

PMD ships with the code duplication detection tool CPD, which can find copy-pasted code in a project:

```bash
mvn pmd:cpd
```

- `minimum-tokens`: how many tokens must be identical at minimum for it to count as duplication (default 100)
- the report is generated at `target/site/cpd.html`

Code duplication is one of the main sources of technical debt — change one place, miss another, and a bug appears.

## An Incremental Adoption Strategy

Turning on every rule across the whole codebase at once usually throws up hundreds or thousands of warnings, and it's easy for people to slide into a "forget it" attitude of giving up. A staged approach is better:

### Phase One: Turn On Only the Most Critical Rules

```xml
<!-- 只引入 errorprone 和 bestpractices -->
<rule ref="category/java/errorprone.xml"/>
<rule ref="category/java/bestpractices.xml"/>
```

Once this round of problems is fixed, bring in design and performance gradually.

### Phase Two: Bring In the Design-Related Rules

```xml
<rule ref="category/java/design.xml"/>
```

### Phase Three: Turn On the Remaining Rules

Depending on how much the team accepts, add codestyle, multithreading and security step by step.

### New Code vs Old Code

Fixing all the old code in one go costs too much, so you can temporarily ignore the old code using PMD's `violationSuppressXPath` or an annotation mechanism, while requiring all new code to pass the check.

## Summary

PMD is the "upgraded version" of Checkstyle — it doesn't just look at formatting but genuinely analyses code structure to find the constructions that "look fine yet hide trouble in practice". Used alongside Checkstyle, one governing style and the other governing how the code is written, together they cover essentially every static-analysis need at the source level.

The next article will introduce FindBugs — it goes a step further and analyses bytecode directly to find genuine bugs.

A small step forward every day is a new height!
