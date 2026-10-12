---
title: A Process Started by Jenkins Always Exits after the Build? Use the keepRunning Step for an Elegant Fix
date: 2020-05-04
author: Tang Moying
categories: [build]
tags: [SonarQube]
lang: en
alt_url: /post/pipeline-keep-running-step-plugin-1.0
---

## Background

Starting a process through Jenkins is a fairly common scenario in real work.

But normally, a process started through a Jenkins Job is killed by Jenkins after the build ends.

<!--以上为摘要内容-->

This is determined by Jenkins' process tree management mechanism.

We can solve this problem by modifying a variable value, but this approach has some drawbacks:

1. It is not intuitive; even after solving the problem, you cannot tell how it was solved;
1. It is hard to think of solving this problem in this way.
1. Poor readability is in fact something that should be avoided as much as possible in the coding process.


## Solution

The [pipeline-keep-running-step-plugin](https://github.com/hummerstudio/pipeline-keep-running-step-plugin) plugin provides a more intuitive `keepRunning` step, offering an elegant solution to this problem.

Through the `keepRunning` step, we can solve the readability problem in a way that tells us what it means just from its name.

Using it is simple too; to start tomcat, for example, you just do this:

```
keepRunning {
    sh '/usr/local/apache-tomact/bin/startup.sh
}
```

## Project Information

Open-source project homepage: [https://github.com/hummerstudio/pipeline-keep-running-step-plugin](https://github.com/hummerstudio/pipeline-keep-running-step-plugin)

hpi plugin installation package download: [https://github.com/hummerstudio/pipeline-keep-running-step-plugin/releases](https://github.com/hummerstudio/pipeline-keep-running-step-plugin/release)
