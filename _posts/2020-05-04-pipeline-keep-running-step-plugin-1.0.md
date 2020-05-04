---
title: 通过Jenkins启动的进程构建后总是退出？可使用keepRunning步骤优雅解决
author: 唐明
categories: [SonarQube]
tags: [SonarQube]
---
* TOC
{:toc}

# 问题背景

通过Jenkins来启动进程是一个实际工作中比较常见的场景。

但是正常情况下，通过Jenkins Job启动的进程，在构建结束后，都会被Jenkins杀死。

<!--以上为摘要内容-->

这是由Jenkins的进程树管理机制决定的。

我们可以通过修改变量值的方式来解决这个问题，但是这个方式有一些缺点：

1. 不直观，解决了也看不出来是怎么解决的；
1. 很难想到通过这种方式可以解决这个问题。
1. 可读性差实际上是编码过程中应该尽可能避免的问题。


# 解决方案

[pipeline-keep-running-step-plugin](https://github.com/hummerstudio/pipeline-keep-running-step-plugin) 插件提供了一个更直观的`keepRunning`步骤，为这一问题提供了一个优雅的解决方案。

通过`keepRunning`步骤，我们就能见名知意的解决可读性问题。

使用也很简单，如启动tomcat，这样操作就行：

```
keepRunning {
    sh '/usr/local/apache-tomact/bin/startup.sh
}
```

# 项目信息

开源项目主页：[https://github.com/hummerstudio/pipeline-keep-running-step-plugin](https://github.com/hummerstudio/pipeline-keep-running-step-plugin)

hpi插件安装包下载： [https://github.com/hummerstudio/pipeline-keep-running-step-plugin/releases](https://github.com/hummerstudio/pipeline-keep-running-step-plugin/release)