---
title: 'Java Static Code Analysis (Part 2): Enforcing Code Style with Checkstyle'
date: 2018-08-05
author: Tang Moying
categories: [test]
tags: [Java, Static Analysis, Checkstyle, Code Style]
lang: en
alt_url: /post/java-static-analysis-02-checkstyle
---

Code style problems look trivial — whether the opening brace goes on a new line, how variables are named, whether imports may use wildcards — but when everyone on the team has their own "preferences", the project's code quickly turns into a patchwork of styles. Checkstyle exists to solve exactly this problem: write the code style into a configuration file, let a tool check it automatically, and nobody has to argue.

<!--以上为摘要内容-->

## What Checkstyle Is

Checkstyle is an open-source Java static code analysis tool focused on **code style and formatting conventions**. It analyses Java source code (not bytecode), and its checks cover:

- Naming conventions (class names, method names, variable names, package names)
- Code formatting (indentation, line breaks, whitespace, brace placement)
- Import statements (whether wildcards are used, whether there are unused imports)
- Javadoc comments (whether they exist, whether they are complete)
- Code metrics (file length, method length, number of parameters)
- Other coding conventions

Checkstyle's role is very clearly defined: it **does not care whether the code's logic is correct**, only whether the code **looks like it follows the conventions**.

## Getting Started Quickly

### Maven Integration

Add `maven-checkstyle-plugin` to your `pom.xml`:

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

This uses Checkstyle's built-in `google_checks.xml` (Google Java Style). You can also switch to `sun_checks.xml` (Sun's coding conventions).

Run the check:

```bash
mvn validate
# or run the plugin goal directly
mvn checkstyle:check
```

If the check does not pass, the build fails outright (because `failsOnError=true` is configured).

### Reading the Report

Checkstyle generates a report file, at `target/site/checkstyle.html` by default. You can open it directly in a browser:

```bash
mvn checkstyle:checkstyle
# The report is generated in target/site/checkstyle.html
```

The report lists, for every file, the problem, its line number and the name of the rule that was violated — all at a glance.

## Common Check Rules

Checkstyle's rules are called Checks and are organised by category. These are the categories used most often in real projects:

### Naming Conventions

```xml
<module name="Checker">
    <module name="TreeWalker">
        <!-- Class names use PascalCase -->
        <module name="TypeName"/>
        <!-- Method names use camelCase -->
        <module name="MethodName"/>
        <!-- Constants are all uppercase, separated by underscores -->
        <module name="ConstantName"/>
        <!-- Local variables use camelCase -->
        <module name="LocalVariableName"/>
        <!-- Package names are all lowercase -->
        <module name="PackageName"/>
    </module>
</module>
```

### Import Statements

```xml
<module name="TreeWalker">
    <!-- Wildcard imports are forbidden -->
    <module name="AvoidStarImport"/>
    <!-- Unused imports are forbidden -->
    <module name="UnusedImports"/>
    <!-- Redundant imports are forbidden (such as the java.lang package) -->
    <module name="RedundantImport"/>
</module>
```

### Code Formatting

```xml
<module name="TreeWalker">
    <!-- Limit each line to 120 characters -->
    <module name="LineLength">
        <property name="max" value="120"/>
    </module>
    <!-- The opening brace does not go on a new line -->
    <module name="LeftCurly"/>
    <!-- The closing brace goes on a line of its own -->
    <module name="RightCurly"/>
    <!-- Operators must be surrounded by whitespace -->
    <module name="WhitespaceAround"/>
</module>
```

### Javadoc Comments

```xml
<module name="TreeWalker">
    <!-- public methods must have Javadoc -->
    <module name="JavadocMethod">
        <property name="scope" value="public"/>
    </module>
    <!-- public classes/interfaces must have Javadoc -->
    <module name="JavadocType">
        <property name="scope" value="public"/>
    </module>
</module>
```

### Code Metrics

```xml
<module name="TreeWalker">
    <!-- A single file must not exceed 2000 lines -->
    <module name="FileLength">
        <property name="max" value="2000"/>
    </module>
    <!-- A single method must not exceed 50 lines -->
    <module name="MethodLength">
        <property name="max" value="50"/>
    </module>
    <!-- A method must not have more than 7 parameters -->
    <module name="ParameterNumber">
        <property name="max" value="7"/>
    </module>
</module>
```

## Custom Configuration

Real projects rarely use the built-in configuration as it stands; they adjust it. A typical custom configuration is structured like this:

```xml
<?xml version="1.0"?>
<!DOCTYPE module PUBLIC
    "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN"
    "https://checkstyle.org/dtds/configuration_1_3.dtd">
<module name="Checker">
    <property name="charset" value="UTF-8"/>
    <property name="severity" value="warning"/>

    <!-- Based on Google Style, with adjustments -->
    <module name="TreeWalker">
        <!-- Allow a copyright notice at the top of a java file -->
        <module name="RegexpHeader">
            <property name="header"
                value="^/\*$\n^ \* Copyright.*$\n^ \*/\n"/>
        </module>
        <!-- Skip the System.out check (allowing it inside a main method) -->
        <!-- <module name="Regexp">
            <property name="format" value="System\.out\.println"/>
            <property name="illegalPattern" value="true"/>
        </module> -->
    </module>

    <!-- Exclude automatically generated code -->
    <module name="SuppressionFilter">
        <property name="file" value="checkstyle-suppressions.xml"/>
    </module>
</module>
```

### Ignoring Specific Files

Use `checkstyle-suppressions.xml` to exclude files that do not need checking:

```xml
<?xml version="1.0"?>
<!DOCTYPE suppressions PUBLIC
    "-//Checkstyle//DTD SuppressionFilter Configuration 1.2//EN"
    "https://checkstyle.org/dtds/suppressions_1_2.dtd">
<suppressions>
    <!-- Ignore automatically generated code -->
    <suppress files=".*[\\/]generated[\\/].*" checks=".*"/>
    <!-- Ignore the magic number check in test files -->
    <suppress files=".*Test\.java" checks="MagicNumber"/>
</suppressions>
```

### Ignoring Specific Lines in the Code

Sometimes a stretch of code genuinely "violates" a rule and is nevertheless reasonable; you can suppress it locally with a comment:

```java
// CHECKSTYLE:OFF
// Special code that needs to skip the check
legacyCode.doWeirdThing();
// CHECKSTYLE:ON

@SuppressWarnings("checkstyle:MethodName")
public void legacy_method_name() { // keep the old naming
    // ...
}
```

## IDE Integration

Catching style problems before you commit code is far more efficient than waiting for CI to complain.

### IntelliJ IDEA

Install the `CheckStyle-IDEA` plugin, then add your custom configuration under `Preferences → Tools → Checkstyle`. You then see Checkstyle's warnings in the editor in real time.

### Eclipse

Install the `Eclipse Checkstyle Plugin` (`eclipse-cs`); once the rules file is configured you get real-time checking, plus quick fixes (such as automatically formatting imports).

## Common Questions

### What If the Rules Are Too Strict?

Adjust the severity level, setting the rules you don't want to `ignore`:

```xml
<module name="JavadocMethod">
    <property name="severity" value="ignore"/>
</module>
```

### Mapping to the Team's Coding Conventions

The recommended approach is this: first let the team accumulate its "recurring points of contention" during code review, then write the Checkstyle rules that correspond to those points into the configuration. That way the configuration is something that "grows" rather than something "decided in one sitting", and the team accepts it more readily.

## Summary

Checkstyle solves the question of whether the code is uniform. It is simple, mature and well supported by its ecosystem, which makes it the first choice for getting started with Java static analysis. But it only cares about format and style, not whether the code has bugs — that is the job of PMD and SpotBugs, which later articles will introduce.

A small step forward every day is a new height!
