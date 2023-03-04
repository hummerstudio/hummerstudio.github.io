---
title: gradle构建涉及的几个文件介绍
date: 2023-02-26
author: 唐明
categories: [Gradle]
tags: [Gradle]
---
* TOC
{:toc}

与`Ant`只有`build.xml`，`Maven`只有`pom.xml`不同，使用`gradle`的项目一般有以下几个文件：

```
gradlew
gradlew.bat

build.gradle
gradle.properties

gradle/gradle-wrapper.jar
gradle/gradle-wrapper.properties
```
在调用顺序上，`gradlew`（Windows下为`gradlew.bat`）读取`gradle.properties`配置文件内容，然后执行`build.gradle`构建脚本，而`build.gradle`脚本可以从`gradle.properties`中读取属性值。此设计的好处是用户无需预先安装gradle到本地，gradlew脚本会自动下载。下文会详述。

gradle-wrapper.properties文件内容

```
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-3.1-bin.zip
```
1、gradle会从`distributionUrl`下载gradle安装包
2、安装包存放在`zipStoreBase/zipStorePath`，
2、解压安装包，到`distributionBase/distributionPath`。

`zipStoreBase`和`distributionBase`有两种取值：`GRADLE_USER_HOME`和`PROJECT`。

`GRADLE_USER_HOME`表示GRADLE用户目录，在windows下是`%USERPROFILE%/.gradle`，例如`C:\Users\<user_name>\.gradle\`;在linux下是`$HOME/.gradle`，例如`~/.gradle`。

`PROJECT`表示工程的当前目录，即gradlew所在的目录。