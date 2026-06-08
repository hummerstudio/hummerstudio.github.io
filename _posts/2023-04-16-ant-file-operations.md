---
title: Ant常用文件操作——复制、移动、删除、重命名
author: 唐明
categories: [build]
tags: [Ant, 文件操作]
---
* TOC
{:toc}

Ant 提供了丰富的文件操作任务，是构建脚本中最常用的功能之一。

<!--以上为摘要内容-->

## 复制文件/目录

```xml
<!-- 复制单个文件 -->
<copy file="src/config.xml" tofile="dist/config.xml" />

<!-- 复制文件到目录 -->
<copy file="src/config.xml" todir="dist/" />

<!-- 复制整个目录 -->
<copy todir="dist/">
    <fileset dir="src/" />
</copy>

<!-- 复制时过滤文件类型 -->
<copy todir="dist/">
    <fileset dir="src/">
        <include name="**/*.xml" />
        <exclude name="**/*.tmp" />
    </fileset>
</copy>

<!-- 复制并覆盖只读文件 -->
<copy todir="dist/" overwrite="true">
    <fileset dir="src/" />
</copy>
```

## 移动文件/目录

```xml
<move file="temp/output.jar" tofile="release/app.jar" />
<move todir="archive/">
    <fileset dir="temp/">
        <include name="*.log" />
    </fileset>
</move>
```

## 删除文件/目录

```xml
<!-- 删除单个文件 -->
<delete file="temp/output.txt" />

<!-- 删除目录及其所有内容 -->
<delete dir="build/" />

<!-- 按模式删除 -->
<delete>
    <fileset dir="dist/">
        <include name="**/*.class" />
        <include name="**/*.tmp" />
    </fileset>
</delete>

<!-- 安静模式：文件不存在也不报错 -->
<delete file="temp/output.txt" quiet="true" />
```

## 重命名

Ant 没有单独的 rename 任务，用 `<move>` 实现：

```xml
<move file="app-old.jar" tofile="app-new.jar" />
```

## 创建目录

```xml
<mkdir dir="dist/lib/" />
```

父目录不存在时自动创建，所以不需要逐级 `mkdir`。

## 替换文件中的文本

```xml
<replace file="config.properties" token="@VERSION@" value="${app.version}" />
```

批量替换目录下所有文件：

```xml
<replace dir="dist/" token="@BUILD_TIME@" value="${build.time}">
    <include name="**/*.html" />
    <include name="**/*.js" />
</replace>
```

## 打包（Zip/Tar）

```xml
<zip destfile="release/app-${app.version}.zip" basedir="dist/" />

<!-- 排除某些文件 -->
<zip destfile="release/app.zip">
    <fileset dir="dist/">
        <exclude name="**/*.log" />
    </fileset>
</zip>
```

每天前进一小步，就是一个新的高度！
