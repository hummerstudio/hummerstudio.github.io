---
title: Executing External Commands and Scripts with Ant
date: 2023-04-23
author: Tang Moying
categories: [build]
tags: [Ant, Exec, External Commands]
lang: en
alt_url: /post/ant-exec
---

Ant can invoke external programs through tasks such as `<exec>`, `<java>` and `<apply>`, making up for the limited expressive power of XML.

<!--以上为摘要内容-->

## exec: running system commands

```xml
<!-- Run a simple command -->
<exec executable="git" outputproperty="git.version">
    <arg value="--version" />
</exec>
<echo message="${git.version}" />
```

## Capturing output

Use `outputproperty` to capture standard output:

```xml
<exec executable="svn" outputproperty="svn.info">
    <arg line="info --show-item revision" />
</exec>
<echo message="Current version: ${svn.info}" />
```

## Specifying the working directory

```xml
<exec executable="npm" dir="frontend/">
    <arg value="install" />
</exec>
```

## Setting environment variables

```xml
<exec executable="python">
    <env key="PYTHONPATH" value="${basedir}/lib" />
    <env key="DEBUG" value="true" />
    <arg line="build.py --output=${dist.dir}" />
</exec>
```

## Ignoring failures

```xml
<exec executable="unknown-tool" failonerror="false" failifexecutionfails="false">
    <arg value="--version" />
</exec>
```

`failonerror="false"`: a non-zero return code does not abort the build
`failifexecutionfails="false"`: no error even if the program cannot be found

## The java task — running a Java class in the current JVM

```xml
<java classname="com.example.Main" fork="true">
    <classpath>
        <pathelement location="build/classes/" />
        <fileset dir="lib/" includes="*.jar" />
    </classpath>
    <arg value="--input=${input.file}" />
    <arg value="--output=${output.dir}" />
</java>
```

`fork="true"` means running in a new JVM, so the current build process is not affected.

## apply: batch execution

Run a command over a set of files, one after another:

```xml
<!-- Run protoc compilation on all .proto files -->
<apply executable="protoc" dest="generated/">
    <arg value="--java_out=." />
    <fileset dir="proto/">
        <include name="**/*.proto" />
    </fileset>
    <srcfile />
</apply>
```

`<srcfile />` automatically appends the path of each matching file to the end of the command.

## Passing Ant properties to a script

```xml
<exec executable="deploy.sh">
    <arg value="${deploy.server}" />
    <arg value="${deploy.path}" />
    <arg value="${app.version}" />
</exec>
```

## Timeout control

```xml
<exec executable="long-running-tool" timeout="60000">
    <arg value="--full-build" />
</exec>
```

The process is terminated automatically after the timeout (in milliseconds).

A small step forward every day is a new height!
