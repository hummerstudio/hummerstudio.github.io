---
title: An Introduction to the Files Involved in a gradle Build
date: 2023-02-26
author: Tang Moying
categories: [build]
tags: [Gradle]
lang: en
alt_url: /post/gradle-intro
---

Unlike `Ant`, which has only `build.xml`, and `Maven`, which has only `pom.xml`, a project that uses `gradle` generally has the following files:

```
gradlew
gradlew.bat

build.gradle
gradle.properties

gradle/gradle-wrapper.jar
gradle/gradle-wrapper.properties
```
As for the order in which they are called: `gradlew` (`gradlew.bat` on Windows) reads the contents of the `gradle.properties` configuration file, then executes the `build.gradle` build script, and the `build.gradle` script can read property values from `gradle.properties`. The beauty of this design is that the user does not need to install gradle locally beforehand — the gradlew script downloads it automatically. This is covered in detail below.


<!--以上为摘要内容-->

Contents of the gradle-wrapper.properties file

```
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-3.1-bin.zip
```
1. gradle downloads the gradle distribution from `distributionUrl`
2. the downloaded package is stored in `zipStoreBase/zipStorePath`,
2. the package is extracted to `distributionBase/distributionPath`.

`zipStoreBase` and `distributionBase` each take one of two values: `GRADLE_USER_HOME` and `PROJECT`.

`GRADLE_USER_HOME` means the GRADLE user directory; on windows it is `%USERPROFILE%/.gradle`, for example `C:\Users\<user_name>\.gradle\`; on linux it is `$HOME/.gradle`, for example `~/.gradle`.

`PROJECT` means the current directory of the project, that is, the directory where gradlew lives.
