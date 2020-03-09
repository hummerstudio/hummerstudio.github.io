---
title: Mac下Docker Desktop的Kubernetes一直处于starting状态的解决办法
author: 唐明
categories: [Kubernetes, Docker]
tags: [Kubernetes, Docker]
---
* TOC
{:toc}

# 问题现象

Docker Preferences选项中勾选"Enabel Kubernetes"启用K8S，但其一直处于`starting`状态，无法正常使用。

# 原因

启用Kubernetes功能，Docker需要从镜像仓库拉取Kubernetes相关镜像。

由于国内访问[Docker Hub](https://hub.docker.com)网速太慢，镜像无法成功拉取，导致Kubernetes一直处于`starting`状态。


<!--以上为摘要内容-->

# 解决办法

步骤1： 将库[https://github.com/hummerstudio/k8s-docker-desktop-for-mac](https://github.com/hummerstudio/k8s-docker-desktop-for-mac)的代码下载至本地，可直接在终端中执行下面的命令：

```bash
git clone git@github.com:hummerstudio/k8s-docker-desktop-for-mac.git
```
步骤2： 执行根目录下`load_images.sh`脚本即可正常下载镜像：

```bash
cd k8s-docker-desktop-for-mac
sh load_images.sh
```