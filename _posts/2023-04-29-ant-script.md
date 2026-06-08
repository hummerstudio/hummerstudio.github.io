---
title: Ant自定义任务——用Groovy/JavaScript编写内联脚本
author: 唐明
categories: [build]
tags: [Ant, Groovy, JavaScript, 脚本]
---
* TOC
{:toc}

Ant 的 XML 语法处理复杂逻辑时很吃力。好在 Ant 支持内嵌 `<script>` 标签，用 Groovy 或 JavaScript 编写自定义逻辑。

<!--以上为摘要内容-->

## 使用 Groovy 脚本

需要添加 Groovy 的 jar 到 classpath。在 `build.xml` 中声明：

```xml
<project name="demo" xmlns:groovy="antlib:org.codehaus.groovy.ant">
    <taskdef name="groovy" classname="org.codehaus.groovy.ant.Groovy" />
```

### 基本示例

```xml
<groovy>
    println "Hello from Groovy!"
    println "项目路径：${project.properties.basedir}"
</groovy>
```

### 操作 Ant 属性

```xml
<groovy>
    def version = "1.2.3"
    def buildNum = new Date().format("yyyyMMdd")
    project.setProperty("full.version", "${version}.${buildNum}")
</groovy>
<echo message="完整版本：${full.version}" />
```

### 文件处理

```xml
<groovy>
    def file = new File(project.properties.basedir, "src/version.txt")
    file.text = project.properties.'app.version'
</groovy>
```

## 使用 JavaScript

Ant 内置了 JavaScript 引擎（Nashorn），无需额外 jar：

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

## Groovy 操作文件集

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

## 用 Groovy 实现自定义 Task

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

## 遍历目录计算 MD5

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

## 注意事项

- Groovy 脚本需要 `groovy-all` jar 在 Ant 的 classpath 中
- JavaScript 在 JDK 8 中默认可用，JDK 15+ 已移除 Nashorn，需要单独添加
- 脚本中可以通过 `project` 变量访问当前 Ant 项目对象

每天前进一小步，就是一个新的高度！
