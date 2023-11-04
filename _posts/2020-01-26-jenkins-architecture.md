---
title: Jenkins 体系结构
author: 唐明
categories: [Jenkins]
tags: [Jenkins, 体系结构, Stapler, Jelly, React, XStream, Jenkins Plugins]
---
* TOC
{:toc}

# 缘起

假期因为疫情没有回家，呆在屋里闲来无事，对 Jenkins 进行一番更深入的了解，看了看 Jenkins 源码。

# 写在前面的话

平心而论，Jenkins 的官方文档，可以说是我见过的开源项目里最差的。

首先是混乱，不像其他的项目，有很统一的文档入口。

其次是内容不全，很难找到官方对 Jenkins 架构及使用细节的完整描述。

<!--以上为摘要内容-->

最后是学习曲线比较陡峭。官方的部分资料只能算是简介，并且用词很随意，不像其他一些开源项目，会有意使用一些意思相同又简单常见的词汇；另一些则完全由程序生成，像是一本词典或手册，基本没有引导和解释。

本文先主要介绍下 Jenkins 的基本体系结构中涉及到的比较重要的技术。

# 1. Stapler

Jenkins 主要创造者是 Kohsuke Kawaguchi, Stapler 也是这位开发者开发的。

Stapler 目前主要就 Jenkins 项目及之前的 Hudson 在使用。

Stapler 是一个 Java Web 框架，它的主要功能是把应用程序对象（Java 类）直接和 URL 绑定。Stapler 的核心思想是为对象自动分配 URL，从而创建直观的 URL 层次结构。

![Stapler示例](/static/img/stapler.png)

Jenkins 源码中，对象模型主要在 `/core/src/main/java/hudson/model` 及 `/core/src/main/java/jekins/model` 目录下。

# 2. Jelly & React

Jelly 是 Jenkins 使用的主要视图技术（类似 JSP + JSTL）。

类似于 JSTL，Jeknins 定义了一些自己的 Jelly 标签库。

Jenkins 源码中，Jenkins 自定义标签库在 `/core/src/main/resources/lib` 目录下。

Jenkins 新 UI 中，目前主要使用的是 React 技术。

# 3. XStream

Jenkins 直接使用文件系统来存储数据。

即我们熟知的 `JENKINS_HOME` 目录下。

数据以文本文件形式存储，有些是纯文本，如任务日志，有些是 Java 属性文件，最重要的是 xml 格式。比如我们常见的 config.xml。

使用 XStream 技术可以方便地把对象信息转换为 xml 文件存储。

# 4. Plugins

Jenkins 中的对象模型是可扩展的。

Jenkins 通过扩展点（ExtensionPoint）来提供扩展接口，第三方可以通过这些扩展点来开发插件扩展 Jenkins 功能。

而且，插件也可以定义新的扩展点，供其他开发者开发新的插件。

通过阅读源码，可以看到部分 Jenkins 内置功能也是基于 Jenkins 提供的扩展点来实现的。

如 `hudson.tasks.ArtifactArchiver` 和 `hudson.tasks.Fingerprinter` 都是基于 `hudson.tasks.Recorder` 开发的功能，这两个对应 Jenkins Pipeline 中的 `archiveArtifacts` 和 `fingerprint` 步骤。

插件，如 `DRY Plugin` 和 `FindBugs Plugin`，也是基于 `hudson.tasks.Recorder` 扩展点开发的。

Jenkins 的插件机制使得内置功能和插件提供的功能在使用上没有任何区别。