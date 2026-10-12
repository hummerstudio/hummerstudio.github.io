---
title: Conditionals in Ant — Using if/unless and condition
date: 2023-04-22
author: Tang Moying
categories: [build]
tags: [Ant, Conditionals]
lang: en
alt_url: /post/ant-condition
---

Ant has no `if/else` like a programming language, but it does provide the `if`/`unless` attributes and the `<condition>` task for conditional logic.

<!--以上为摘要内容-->

## if/unless on a target

The simplest form of conditional control — decide whether to run a target based on whether a property is set:

```xml
<target name="deploy" depends="build" if="do.deploy">
    <echo message="Starting deployment..." />
</target>

<target name="clean" unless="keep.temp">
    <delete dir="temp/" />
</target>
```

- `if="do.deploy"`: runs only when the property `do.deploy` is set
- `unless="keep.temp"`: runs only when the property `keep.temp` is not set

Usage:

```bash
# Run deployment
ant -Ddo.deploy=true

# Skip cleaning
ant -Dkeep.temp=true
```

## The condition task

Used for a conditional evaluation that sets a property value:

```xml
<!-- Check whether a file exists -->
<condition property="config.exists">
    <available file="config.xml" />
</condition>

<!-- Check whether a directory exists -->
<condition property="build.dir.exists">
    <available file="build/" type="dir" />
</condition>

<!-- Check whether a class exists -->
<condition property="junit.available">
    <available classname="org.junit.Test" />
</condition>
```

## Combining conditions

Combine multiple conditions with `<and>`, `<or>` and `<not>`:

```xml
<condition property="can.deploy">
    <and>
        <available file="release/app.jar" />
        <isset property="deploy.server" />
        <not>
            <equals arg1="${env}" arg2="dev" />
        </not>
    </and>
</condition>
```

## String comparison

```xml
<condition property="is.production" value="true" else="false">
    <equals arg1="${env}" arg2="production" />
</condition>

<condition property="version.ok">
    <matches string="${app.version}" pattern="^\d+\.\d+\.\d+$" />
</condition>
```

## Failing early with fail

Make the build fail when a condition is not met:

```xml
<fail message="JAVA_HOME is not set!">
    <condition>
        <not>
            <isset property="env.JAVA_HOME" />
        </not>
    </condition>
</fail>
```

## Comparing file size

```xml
<condition property="jar.too.large">
    <length file="release/app.jar" when="greater" length="50000000" />
</condition>
<fail if="jar.too.large" message="The jar is over 50MB!" />
```

## Practical example: choosing a different configuration per environment

```xml
<condition property="config.file" value="config.prod.properties" else="config.dev.properties">
    <equals arg1="${env}" arg2="production" />
</condition>
<property file="${config.file}" />
```

A small step forward every day is a new height!
