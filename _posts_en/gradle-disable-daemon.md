---
title: Disabling the Gradle Daemon
date: 2022-12-14
author: Tang Moying
categories: [build]
tags: [Gradle]
lang: en
alt_url: /post/gradle-disable-daemon
---

Gradle using a daemon is like a warm start and can save build time. But in a continuous integration environment, to keep the environment consistent or to avoid daemon process conflicts, you can disable the deamon feature.

Add the following to the `${HOME}/.gradle/gradle.properties` file:
```
org.gradle.daemon=false
```
