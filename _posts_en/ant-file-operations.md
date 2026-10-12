---
title: Common Ant File Operations — Copy, Move, Delete, Rename
date: 2023-04-16
author: Tang Moying
categories: [build]
tags: [Ant, File Operations]
lang: en
alt_url: /post/ant-file-operations
---

Ant provides a rich set of file operation tasks; they are among the most frequently used features in build scripts.

<!--以上为摘要内容-->

## Copying files/directories

```xml
<!-- Copy a single file -->
<copy file="src/config.xml" tofile="dist/config.xml" />

<!-- Copy a file to a directory -->
<copy file="src/config.xml" todir="dist/" />

<!-- Copy an entire directory -->
<copy todir="dist/">
    <fileset dir="src/" />
</copy>

<!-- Filter file types while copying -->
<copy todir="dist/">
    <fileset dir="src/">
        <include name="**/*.xml" />
        <exclude name="**/*.tmp" />
    </fileset>
</copy>

<!-- Copy and overwrite read-only files -->
<copy todir="dist/" overwrite="true">
    <fileset dir="src/" />
</copy>
```

## Moving files/directories

```xml
<move file="temp/output.jar" tofile="release/app.jar" />
<move todir="archive/">
    <fileset dir="temp/">
        <include name="*.log" />
    </fileset>
</move>
```

## Deleting files/directories

```xml
<!-- Delete a single file -->
<delete file="temp/output.txt" />

<!-- Delete a directory and all its contents -->
<delete dir="build/" />

<!-- Delete by pattern -->
<delete>
    <fileset dir="dist/">
        <include name="**/*.class" />
        <include name="**/*.tmp" />
    </fileset>
</delete>

<!-- Quiet mode: no error if the file does not exist -->
<delete file="temp/output.txt" quiet="true" />
```

## Renaming

Ant has no separate rename task; use `<move>` instead:

```xml
<move file="app-old.jar" tofile="app-new.jar" />
```

## Creating directories

```xml
<mkdir dir="dist/lib/" />
```

Parent directories are created automatically when they don't exist, so you don't need to `mkdir` level by level.

## Replacing text in files

```xml
<replace file="config.properties" token="@VERSION@" value="${app.version}" />
```

Replace across all files in a directory:

```xml
<replace dir="dist/" token="@BUILD_TIME@" value="${build.time}">
    <include name="**/*.html" />
    <include name="**/*.js" />
</replace>
```

## Packaging (Zip/Tar)

```xml
<zip destfile="release/app-${app.version}.zip" basedir="dist/" />

<!-- Exclude certain files -->
<zip destfile="release/app.zip">
    <fileset dir="dist/">
        <exclude name="**/*.log" />
    </fileset>
</zip>
```

A small step forward every day is a new height!
