---
title: Jenkinsclient系列教程之介绍与安装（一）
author: 唐明
categories: [Jenkinsclient]
tags: [Jenkinsclient]
---
* TOC
{:toc}

# jenkinsclient简介

Jenkinsclient是一个功能强大的开源跨平台的Jenkins命令行客户端。提供类似Docker风格的命令行来让用户操作Jenkins。

Jenkinsclient使用Python语言编写，项目源码采用国产木兰开源许可证开源。你可在Gitee和Github上查看。

Gitee: [https://gitee.com/hummerstudio/jenkinsclient](https://gitee.com/hummerstudio/jenkinsclient)

Github: [https://github.com/hummerstudio/jenkinsclient](https://github.com/hummerstudio/jenkinsclient)

项目主页：[https://pypi.org/project/jenkinsclient](https://pypi.org/project/jenkinsclient)

<!--以上为摘要内容-->

# Jenkinsclient特点

## 特点1：开源

如前所述，Jenkinsclient项目源码采用国产木兰开源许可证开源。十分欢迎大家做贡献、提交代码、反馈问题、写文档、传播、分享。

## 特点2：跨平台

Jenkinsclient在开发之初，就定位于跨平台使用，最终选择使用Python语言实现。

Windows、Linux、Mac、Unix都有Python运行环境，保证了Jenkinsclient可以跨平台使用。

## 特点3：支持多实例 

Jenkinsclient支持Jenkins多实例。

你可以通过`jenkins config generate`命令生成配置文件，在其中配置多个Jenkins服务器信息，并通过`use`字段指定默认操作的服务器。

## 特点4：简单易用

为了能够实现简单易用的命令行操作，Jenkinsclient在设计之初就进行了大量的技术选型工作。

我的目标是设计一个Docker风格的命令行，简言之，用命令/关键字来表示操作，而不是传统的通过参数/选项的方式来进行操作。

比如，docker容器的启动，我们使用的是：

```
docker container start CONTAINER
```

对于jenkinsclient，如触发任务，我希望能够实现的命令行是这样的：

```
jenkins job build JOB_NAME
```

作为对比，传统风格的命令行实现会是这样的：

```
jenkins job -b JOB_NAME
```

或者是这样的：

```
jenkins-job build JOB_NAME
```

Python有多个库可以进行命令行工具开发，但大多只能开发出传统风格的命令行工具，经过认真筛选和编写Demo，选择了Fire。Fire完全满足上述要求。

现在，通过Jenkinsclient，你可以通过如下这种自然的命令行语法来执行Jenkins操作：

```
jenkins jobs                          // 显示任务列表
jenkins job build JOB_NAME            // 触发Jenkins任务
jenkins job disable JOB_NAME          // 禁用Jenkins任务
jenkins job enable JOB_NAME           // 启用Jenkins任务

jenkins plugins                       // 显示插件列表
jenkins plugin install PLUGIN_NAME    // 安装插件
jenkins plugin uninstall PLUGIN_NAME  // 卸载插件
jenkins plugin search KEY_WORD        // 搜索插件
```

## 特点5：功能强大

Jenkinsclient的架构设计使得其具有实现所有Jenkins相关操作的能力。目前已实现了的大块功能有：

- 配置Jenkins服务器信息
- 管理Jenkins节点
- 管理Jenkins插件
- 管理Jenkins凭据
- 管理Jenkins任务
- 管理Jenkins队列
- 管理Jenkins执行器
- 管理Jenkins构建

基本覆盖了Jenkins各类可操作资源

# 安装

最简单的方式就是通过pip来安装托管在PyPI上的jenkinsclient。只需使用下面的命令：

```
pip3 install jenkinsclient
```


也可以下载源码后解压进入根目录，使用setuptools工具手动安装：

```
python setup.py install
```

# 升级

```
pip3 install -U jenkinsclient
```

# 快速入门

## 配置服务器信息

使用`jenkins config generate`来配置Jenkins服务器信息。

这个命令会生成jenkinsclient的配置模版文件，然后你需要填写实际值。

## 查看帮助信息

试试键入`jenkins jobs`来查看Jenkins服务器上的所有任务。

试试键入`jenkins plugins`来查看Jenkins服务器上的所有插件。

其他更多命令，可以键入`jenkins`。

或者键入`jenkins <命令组>`来显示命令组帮助信息,比如查看Jenkins任务管理命令的帮助信息：

```
jenkins job
```

查看Jenkins插件管理命令的帮助信息:

```
jenkins plugin
```

本系列教程将对这些命令做详细介绍，请持续关注！