---
title: Jenkinsclient 1.0发布，功能强大的开源跨平台的Jenkins命令行客户端，采用国产木兰开源许可证
author: 唐明
categories: [Jenkinsclient, Jenkins]
tags: [Jenkinsclient, Jenkins, Python]
---
* TOC
{:toc}

# Jenkinsclient介绍

Jenkinsclient是一个功能强大的开源的跨平台的支持多实例的Jenkins命令行客户端。项目采用国产木兰开源许可证开源。

日前正式发布了1.0版本。

PyPI项目主页：[https://pypi.org/project/jenkinsclient/](https://pypi.org/project/jenkinsclient/)

<!--以上为摘要内容-->

源代码仓库：
- Gitee: [https://gitee.com/hummerstudio/jenkinsclient](https://gitee.com/hummerstudio/jenkinsclient)
- Github: [https://github.com/hummerstudio/jenkinsclient](https://github.com/hummerstudio/jenkinsclient)

# 功能

Jenkins是持续集成、持续交付工具的事实领导者。它是一个C/S架构的软件。

当我们安装并启动Jenkins时，其实是配置好了Jenkins服务器。

我们经常使用浏览器来作为C端，但C端不一定是浏览器，也可以是命令行形式。

Jenkinsclient通过Jenkins提供的API与Jenkins进行交互。

Jenkinsclient支持Jenkins多实例。
你可以通过`jenkins config generate`生成配置文件，在其中配置多个Jenkins服务器信息，并通过`use`字段指定默认操作的服务器。

1.0版本功能：

- 获取全局信息
    - 获取Jenkins服务器信息
    - 获取当前登录用户
    - 获取插件信息
    - 获取节点信息
    - 获取任务信息
    - 获取队列信息
- 操作Jenkins对象
   - 插件
     - 显示、搜索、安装、卸载插件，以及其他很多操作
   - 节点
     - 显示、获取节点信息，以及其他很多操作
   - 执行器
     - 获取节点的执行器数量，以及其他很多操作
   - 任务
     - 显示、构建、复制、创建、删除、禁用、启用、重命名任务，以及其他很多操作
   - 队列
     - 显示和取消队列元素
   - 构建
     - 获取构建的环境变量、信息、日志、测试报告，以及其他很多操作
   


# 安装

最简单的方式就是通过pip来安装托管在PyPI上的jenkinsclient。只需使用下面的命令：

`pip3 install jenkinsclient`

也可以下载源码后使用setuptools工具手动安装：

`python setup.py install`

# 升级

`pip3 install -U jenkinsclient`

# 发布包

jenkinsclient已托管在PyPI上，你可以访问jenkinsclient在PyPI上的项目主页来下载发布包：

[https://pypi.org/project/jenkinsclient/](https://pypi.org/project/jenkinsclient/)

# 使用

在安装`jenkinsclient`后，你可以使用`jenkins`命令来进行许多操作。

## 快速入门

1. 使用`jenkins config generate`来配置Jenkins服务器信息。

    这个命令会生成jenkinsclient的配置模版文件，然后你需要填写实际值。
1. 干任何你想做的。

试试键入`jenkins jobs`来查看Jenkins服务器上的所有任务。

试试键入`jenkins plugins`来查看Jenkins服务器上的所有插件。


## 查看帮助信息

键入`jenkins`来显示jenkinsclient的帮助信息。或者`jenkins <命令组>`来显示命令组帮助信息,比如`jenkins config`，`jenkins job`。

帮助信息类似这样：

```
NAME
    jenkins - Jenkins命令行客户端

SYNOPSIS
    jenkins GROUP | COMMAND

DESCRIPTION
    Jenkins命令行客户端

GROUPS
    GROUP is one of the following:

     build
       Jenkins构建相关操作

     config
       配置信息

     executor
       Jenkins执行器相关操作

     job
       Jenkins任务相关操作

     node
       Jenkins节点相关操作

     plugin
       Jenkins插件相关操作

     queue
       Jenkins队列相关操作

COMMANDS
    COMMAND is one of the following:

     jobs
       显示任务列表

     nodes
       显示节点列表

     plugins
       显示插件列表

     queues
       查看队列

     version
       显示Jenkins服务器版本号

     whoami
       显示当前用户
```

# 项目作者

唐明，高级软件工程师，Certified Jenkins Enginner。Jenkins中文社区、中国DevOps社区成员。
热爱开源，专注于DevOps领域技术栈，熟悉DevOps文化及相关工具。致力于DevOps理念的推广普及和落地。
