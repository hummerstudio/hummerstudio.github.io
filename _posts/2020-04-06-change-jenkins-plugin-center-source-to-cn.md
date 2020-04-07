---
title: Jenkins插件更新中心地址修改工具，一键修改为国内镜像地址
author: 唐明
categories: [插件中心, Jenkins]
tags: [插件中心, Jenkins]
---
* TOC
{:toc}

# Jenkins插件中心国内镜像

Jenkins拥有的1500+插件是其最宝贵的资源和特色，这些插件为Jenkins提供了强大的功能、灵活性以及与其他平台连接交互的能力。

然而最近一段时间以来，国内用户明显感觉到，Jenkins下载插件的速度非常慢，并且经常出现超时无法下载的情况。这个问题给国内用户带来了很大的困扰。

这主要是因为Jenkins开源社区的网络基础设施服务器都在国外。

2019年11月，Jenkins中文社区推出了国内镜像源地址。

该镜像源解决了其他镜像源一直存在的无法真正使用的问题，使得国内用户在下载插件时能充分发挥出宽带应有的速度。

<!--以上为摘要内容-->

# 切换门槛高

但要将Jenkins插件中心切换为国内镜像地址并不容易。

用户不仅要修改插件中心地址，还需要手动在特定目录添加证书文件。

实际操作中，用户经常遇到各种问题，并根据自己的理解提出各种解决方案，导致配置方法更加混乱。

为此，我制作了Jenkins插件更新中心地址修改工具(jenkins-update-center-changer)，可一键修改为国内镜像地址。

# 一键切换脚本

使用方法非常简单，只需在Jenkins master服务器上的任意目录执行下面的命令即可（脚本会自动读取`JENKINS_HOME`环境变量）：

`bash -c "$(curl -fsSL https://gitee.com/hummerstudio/jenkins-update-center-changer/raw/master/jenkins-update-center-changer.sh)"`

修改成功后，脚本还会打印后续操作指引：

![jenkins-update-center-changer](/static/img/2020/04/jenkins-update-center-changer.png)

# 开源项目，欢迎共参与

本工具为开源项目，欢迎大家提issue，提PR！

Gitee地址：[https://gitee.com/hummerstudio/jenkins-update-center-changer](https://gitee.com/hummerstudio/jenkins-update-center-changer)

Github地址：[https://github.com/hummerstudio/jenkins-update-center-changer](https://github.com/hummerstudio/jenkins-update-center-changer)

（Gitee库为主库，主要考虑到是国内服务，速度更快）
