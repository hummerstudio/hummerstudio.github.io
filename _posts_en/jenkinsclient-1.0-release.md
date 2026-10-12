---
title: 'Jenkinsclient 1.0 Released: A Powerful, Open-Source, Cross-Platform Jenkins Command-Line Client, Licensed Under the Domestic Mulan Open Source License'
date: 2020-04-17
author: Tang Moying
categories: [devops]
tags: [Jenkinsclient, Jenkins, Python]
lang: en
alt_url: /post/jenkinsclient-1.0-release
---

## Introduction to Jenkinsclient

Jenkinsclient is a powerful, open-source, cross-platform Jenkins command-line client that supports multiple instances. The project is open-sourced under the domestic Mulan Open Source License.

It recently officially released version 1.0.

PyPI project homepage: [https://pypi.org/project/jenkinsclient/](https://pypi.org/project/jenkinsclient/)

<!--以上为摘要内容-->

Source code repositories:
- Gitee: [https://gitee.com/hummerstudio/jenkinsclient](https://gitee.com/hummerstudio/jenkinsclient)
- Github: [https://github.com/hummerstudio/jenkinsclient](https://github.com/hummerstudio/jenkinsclient)

## Features

Jenkins is the de facto leader among continuous integration and continuous delivery tools. It is client/server software.

When we install and start Jenkins, we are in fact setting up a Jenkins server.

We often use a browser as the client side, but the client side doesn't have to be a browser — it can also be a command-line form.

Jenkinsclient interacts with Jenkins through the API that Jenkins provides.

Jenkinsclient supports multiple Jenkins instances.
You can use `jenkins config generate` to generate a configuration file, configure the information of several Jenkins servers in it, and use the `use` field to specify the server operated on by default.

Version 1.0 features:

- Get global information
    - Get Jenkins server information
    - Get the currently logged-in user
    - Get plugin information
    - Get node information
    - Get job information
    - Get queue information
- Operate on Jenkins objects
   - Plugins
     - Show, search, install and uninstall plugins, and many other operations
   - Nodes
     - Show and get node information, and many other operations
   - Executors
     - Get the number of executors on a node, and many other operations
   - Jobs
     - Show, build, copy, create, delete, disable, enable and rename jobs, and many other operations
   - Queues
     - Show and cancel queue items
   - Builds
     - Get a build's environment variables, information, logs and test reports, and many other operations
   


## Installation

The simplest way is to install jenkinsclient, which is hosted on PyPI, via pip. Just use the following command:

`pip3 install jenkinsclient`

You can also download the source code and install it manually with the setuptools tool:

`python setup.py install`

## Upgrade

`pip3 install -U jenkinsclient`

## Release package

jenkinsclient is already hosted on PyPI. You can visit the project homepage of jenkinsclient on PyPI to download the release package:

[https://pypi.org/project/jenkinsclient/](https://pypi.org/project/jenkinsclient/)

## Usage

After installing `jenkinsclient`, you can use the `jenkins` command to perform many operations.

### Quick start

1. Use `jenkins config generate` to configure the Jenkins server information.

    This command generates a configuration template file for jenkinsclient, and then you need to fill in the actual values.
1. Do whatever you want to do.

Try typing `jenkins jobs` to view all the jobs on the Jenkins server.

Try typing `jenkins plugins` to view all the plugins on the Jenkins server.


### Viewing help information

Type `jenkins` to display the help information for jenkinsclient. Or `jenkins <command group>` to display the help information for a command group, such as `jenkins config` and `jenkins job`.

The help information looks something like this:

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

## Project author

Tang Moying (唐莫盈), senior software engineer, Certified Jenkins Enginner. A member of Jenkins 中文社区 (Jenkins Chinese Community) and the China DevOps Community (中国 DevOps 社区).
Loves open source, focuses on the DevOps technology stack, and is familiar with DevOps culture and related tools. Committed to popularizing and putting the DevOps philosophy into practice.
