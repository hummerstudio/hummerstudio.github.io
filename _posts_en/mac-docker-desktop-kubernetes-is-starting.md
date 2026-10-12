---
title: How to Fix Kubernetes Stuck in the starting State in Docker Desktop on macOS
date: 2020-03-07
author: Tang Moying
categories: [deploy]
tags: [Kubernetes, Docker]
lang: en
alt_url: /post/mac-docker-desktop-kubernetes-is-starting
---

## Symptoms

With "Enabel Kubernetes" checked in the Docker Preferences to enable K8S, it stays in the `starting` state and never becomes usable.

## Cause

To enable the Kubernetes feature, Docker needs to pull the Kubernetes-related images from an image registry.

Because accessing [Docker Hub](https://hub.docker.com) from China is too slow, the images cannot be pulled successfully, which leaves Kubernetes stuck in the `starting` state.


<!--以上为摘要内容-->

## Solution

Step 1: Download the code of the repository [https://github.com/hummerstudio/k8s-docker-desktop-for-mac](https://github.com/hummerstudio/k8s-docker-desktop-for-mac) to your local machine; you can run the following command directly in the terminal:

```bash
git clone git@github.com:hummerstudio/k8s-docker-desktop-for-mac.git
```
Step 2: Run the `load_images.sh` script in the root directory and the images will download normally:

```bash
cd k8s-docker-desktop-for-mac
sh load_images.sh
```
