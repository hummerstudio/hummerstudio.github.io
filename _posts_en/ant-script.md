---
title: Ant Custom Tasks — Writing Inline Scripts in Groovy/JavaScript
date: 2023-04-29
author: Tang Moying
categories: [build]
tags: [Ant, Groovy, JavaScript, Scripts]
lang: en
alt_url: /post/ant-script
---

Ant's XML syntax struggles when it has to handle complex logic. Fortunately, Ant supports an inline `<script>` tag, so you can write custom logic in Groovy or JavaScript.

<!--以上为摘要内容-->

## Using Groovy Scripts

You need to add the Groovy jar to the classpath. Declare it in `build.xml`:

```xml
<project name="demo" xmlns:groovy="antlib:org.codehaus.groovy.ant">
    <taskdef name="groovy" classname="org.codehaus.groovy.ant.Groovy" />
```

### A Basic Example

```xml
<groovy>
    println "Hello from Groovy!"
    println "项目路径：${project.properties.basedir}"
</groovy>
```

### Manipulating Ant Properties

```xml
<groovy>
    def version = "1.2.3"
    def buildNum = new Date().format("yyyyMMdd")
    project.setProperty("full.version", "${version}.${buildNum}")
</groovy>
<echo message="Full version: ${full.version}" />
```

### File Handling

```xml
<groovy>
    def file = new File(project.properties.basedir, "src/version.txt")
    file.text = project.properties.'app.version'
</groovy>
```

## Using JavaScript

Ant has a built-in JavaScript engine (Nashorn), so no extra jar is needed:

```xml
<script language="javascript">
    <![CDATA[
    var version = project.getProperty("app.version");
    var parts = version.split(".");
    var major = parseInt(parts[0]) + 1;
    project.setProperty("next.major", String(major));
    ]]>
</script>
```

## Working with File Sets in Groovy

```xml
<groovy>
    import org.apache.tools.ant.types.FileSet
    import org.apache.tools.ant.DirectoryScanner

    def scanner = project.createDataType("fileset") {
        setDir(new File(project.properties.basedir, "src"))
        include(name: "**/*.java")
    }.getDirectoryScanner(project)

    scanner.includedFiles.each { file ->
        println "找到文件：${file}"
    }
</groovy>
```

## Implementing a Custom Task with Groovy

```xml
<groovy>
    class MyTask {
        void execute(project) {
            def srcDir = new File(project.properties.basedir, "src")
            def count = 0
            srcDir.eachFileRecurse { f ->
                if (f.name.endsWith(".java")) count++
            }
            println "Java 源文件数量：${count}"
        }
    }
    new MyTask().execute(project)
</groovy>
```

## Walking a Directory to Compute an MD5

```xml
<groovy>
    import java.security.MessageDigest

    def md5 = MessageDigest.getInstance("MD5")
    new File(project.properties.basedir, "dist").eachFile { file ->
        if (file.name.endsWith(".jar")) {
            def hash = md5.digest(file.bytes).encodeHex().toString()
            println "${file.name} => ${hash}"
        }
    }
</groovy>
```

## Things to Watch Out For

- Groovy scripts need the `groovy-all` jar on Ant's classpath
- JavaScript is available by default in JDK 8; Nashorn was removed in JDK 15+, so it has to be added separately
- Inside a script you can reach the current Ant project object through the `project` variable

A small step forward every day is a new height!
