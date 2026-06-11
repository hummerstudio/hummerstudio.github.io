---
title: 云原生部署（二）：Docker 基础——镜像、容器与分层原理
author: 唐明
categories: [deploy]
tags: [Docker, 容器, 镜像, UnionFS, 分层原理, Docker 基础]
---

Docker 是云原生部署的第一步。很多人会用 `docker run`，但未必清楚背后发生了什么。镜像和容器到底有什么区别？为什么 Docker 镜像那么省空间？“分层”是什么概念？这篇文章带你从原理层面理解 Docker 的核心机制。

<!--以上为摘要内容-->

## 1、Docker 是什么？

这个问题看似简单，但不同角色的人可能给出不一样的答案。

从技术本质上说，Docker 是一个容器运行时——它利用 Linux 内核的 namespace 和 cgroup，在进程级别实现资源隔离和限制。但它更大的贡献是定义了**镜像（Image）**这个标准化的交付单元，以及围绕镜像和容器的一整套工具链。

用一句话概括：**Docker 解决了“在我机器上能跑”的问题，让软件可以像集装箱一样在任何地方运行。**

运输行业在没有集装箱之前，货物装卸全靠人力，从卡车搬到船上要折腾好久。有了集装箱，不管里面装的是衣服还是电子产品，吊车一抓一放就搞定了。Docker 镜像就是软件世界的集装箱。

## 2、镜像到底是什么？

镜像是一个只读的模板，包含了运行某个应用所需的完整文件系统——包括操作系统基础库、应用依赖、代码、配置等。

你可以把镜像理解为一个安装盘的 ISO 文件，但它不是压缩包，而是一个**分层结构**。

### UnionFS 与分层原理

Docker 镜像的核心技术是 UnionFS（联合文件系统），它将多个目录层叠在一起，对外呈现为一个统一的文件系统视图。

一个典型的 Docker 镜像由多层组成：

```
应用层（Layer 4）: COPY app.jar
依赖层（Layer 3）: RUN apt-get install ...
运行时层（Layer 2）: FROM openjdk:11
基础系统层（Layer 1）: FROM ubuntu:20.04
```

每一层都是只读的。当你 `docker pull` 一个镜像时，你会发现它是一层一层下载的。如果两个镜像共享相同的底层（比如都用 `ubuntu:20.04`），那么底层只需要下载一次。

这就是为什么 Docker 镜像既省存储又省带宽——**分层复用**。

### `docker pull` 背后发生了什么？

当你在终端敲下 `docker pull nginx:latest`，Docker 做了这几件事：

1. 解析镜像名称 `nginx:latest`，找到对应的 Registry（默认为 Docker Hub）。
2. 获取镜像的 manifest（一个 JSON 文件，列出了这个镜像所有层的信息和校验码）。
3. 逐层检查本地是否已有缓存，有则跳过，没有则下载。
4. 下载完所有层后，校验每一层的完整性。
5. 在本地存储中组装这个镜像。

用 `docker history nginx:latest` 可以直观地看到镜像的每一层：

```bash
$ docker history nginx:latest
IMAGE          CREATED        CREATED BY                          SIZE
2b7d6430f78d   2 weeks ago    CMD ["nginx" "-g" "daemon off;"]   0B
<missing>      2 weeks ago    EXPOSE map[80/tcp:{}]               0B
<missing>      2 weeks ago    COPY file:xxx /etc/nginx/nginx.conf 1.46kB
<missing>      2 weeks ago    RUN /bin/sh -c set -x && ...        28.4MB
<missing>      2 weeks ago    ADD file:xxxx /                     74.1MB
```

每一行就是一层，`SIZE` 表示这一层贡献的磁盘大小。注意 `CMD` 和 `EXPOSE` 这些指令不产生新的层，所以 SIZE 是 0B。

## 3、容器——镜像的一个运行实例

理解了镜像，再理解容器就简单了。

**容器 = 镜像 + 一个可读写层**

当你 `docker run` 一个镜像时，Docker 在镜像的所有只读层之上，添加一个**可读写层（Container Layer）**。容器运行时产生的所有文件修改（写日志、生成临时文件、安装新包等），都发生在这个可读写层上。

```
┌──────────────────┐
│   Container R/W  │  ← 可读写层（每个容器独立）
├──────────────────┤
│   App Layer      │
├──────────────────┤
│   Dependencies   │
├──────────────────┤
│   Base OS Layer  │
└──────────────────┘
   全部只读层（所有容器共享）
```

这个设计的巧妙之处在于：

- **镜像不变，容器可变**。同一个镜像可以启动无数个容器，每个容器都有自己独立的可读写层，互相不影响。
- **删掉容器，可读写层就没了**。所以容器被设计成“用完即扔”的，这也是为什么要把有状态的数据通过 Volume 挂载到外部。
- **镜像之间共享只读层**。节省了大量磁盘空间，启动新容器时也省去了复制整个文件系统的开销。

### `docker run` 实际执行了什么？

`docker run` 其实是一个组合命令，等价于 `docker create` + `docker start` + 附加前台的 `docker attach`。具体步骤是：

1. **拉取镜像**（本地没有的话）。
2. **创建容器**：在镜像层之上创建一个可读写层，分配网络、IP 等。
3. **启动容器**：运行镜像中定义的启动命令（ENTRYPOINT 或 CMD）。
4. **附加终端**：如果用了 `-it` 参数，就把终端的 stdin/stdout/stderr 绑定到容器进程上。

## 4、镜像的常用操作

### 构建镜像：`docker build`

`docker build` 需要一个 `Dockerfile`，每条指令对应一个层。构建过程会缓存每一层——如果某一层的指令和上下文都没变，就直接用缓存，跳过这一层的构建。这就是为什么我们常把不易变的指令放前面（如安装系统依赖），把易变的指令放后面（如复制代码）。

本篇不对 Dockerfile 展开讲，下一篇会详细讨论。

### 查看镜像：`docker images`

```bash
$ docker images
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
nginx        latest    2b7d6430f78d   2 weeks ago    188MB
```

`IMAGE ID` 是一个 64 位的十六进制数（通常只显示前 12 位），它是镜像内容的 SHA256 校验值，用于唯一标识一个镜像。

### 删除镜像：`docker rmi`

`docker rmi <image>` 删除镜像时会检查是否还有容器引用该镜像。如果有，默认会报错，需要先删除容器或使用 `-f` 强制删除。

### 打标签：`docker tag`

```bash
docker tag nginx:latest myrepo/nginx:v1.0
```

`docker tag` 并不复制镜像，只是给同一个镜像 ID 起了另一个名字。就像一个人可以有多个外号（tag），多个外号指向同一个人（镜像 ID）。

### 推送/拉取镜像

```bash
docker push myrepo/nginx:v1.0
docker pull myrepo/nginx:v1.0
```

推送和拉取都是分层的，只传输本地没有的层。如果仓库里已经有了基础镜像的层，就只推你新增的那几层，速度很快。

## 5、容器的常用操作

### 启动容器：`docker run`

```bash
# 后台运行
docker run -d --name my-nginx nginx:latest

# 交互式运行
docker run -it ubuntu:20.04 /bin/bash
```

关键参数：

| 参数 | 含义 |
|------|------|
| `-d` | 后台运行（detach） |
| `-it` | 交互式终端 |
| `--name` | 给容器起名字 |
| `-p 8080:80` | 端口映射：主机 8080 → 容器 80 |
| `-v /data:/data` | 卷挂载：主机目录 → 容器目录 |
| `-e KEY=value` | 注入环境变量 |
| `--rm` | 容器退出后自动删除 |

### 查看容器：`docker ps`

```bash
# 正在运行的容器
docker ps

# 所有容器（包括退出的）
docker ps -a
```

注意区分 `docker ps` 和 `docker images`。前者看的是容器，后者看的是镜像。

### 进入运行中的容器

```bash
# 新开一个终端
docker exec -it my-nginx /bin/bash

# 附加到主进程的终端
docker attach my-nginx
```

`exec` 是启动一个新进程，`attach` 是连接到容器的主进程。`exec` 更常用，因为 `attach` 退出时如果连的是 PID 1 进程，会导致容器退出。

### 停止与删除

```bash
docker stop my-nginx    # 优雅停止（SIGTERM → 超时 → SIGKILL）
docker kill my-nginx    # 强制杀死（SIGKILL）
docker rm my-nginx      # 删除容器
```

`stop` 和 `kill` 的区别值得注意：`stop` 给容器进程发送 `SIGTERM` 信号，等待一段优雅退出时间（默认 10 秒），超时后再发 `SIGKILL`。`kill` 直接 `SIGKILL`。

## 6、几个容易混淆的概念

### 镜像 vs 容器

这是新手最容易混淆的一组概念。记住这个类比：

> 镜像就是“类”（Class），容器就是“实例”（Instance）。

一个类可以 new 出无数个对象，一个镜像可以 run 出无数个容器。类定义了属性和方法，镜像定义了文件系统和启动命令。对象可以有自己独立的属性值，容器有自己独立的可读写层。

### Registry vs Repository vs Tag

这也是一个经典的混淆点：

- **Registry**：镜像仓库服务，比如 Docker Hub（`docker.io`）、Harbor。
- **Repository**：仓库里的一个镜像项目，比如 `library/nginx`，一个仓库可以有多个 Tag。
- **Tag**：镜像在仓库中的标签，比如 `latest`、`v1.0`、`alpine`。

所以 `docker pull nginx:latest` 的完整解释是：从 Registry `docker.io` 拉取 Repository `library/nginx` 中 Tag 为 `latest` 的镜像。

### ENTRYPOINT vs CMD

这两个都定义容器启动时要执行的命令，区别在于：

- `CMD` 可以被 `docker run` 后面的参数覆盖。
- `ENTRYPOINT` 不会被覆盖，`docker run` 后面的参数会作为 `ENTRYPOINT` 的参数。

实际使用中，有很多不同的组合方式，这些会在下一篇 Dockerfile 最佳实践中详细展开。

## 小结

Docker 的核心概念其实不多：镜像（分层的只读模板）、容器（镜像 + 可读写层的运行实例）、Registry（镜像仓库）。理解了分层原理，就理解了 Docker 为什么轻量、为什么快。

下一步自然是动手写 `Dockerfile` 来构建自己的镜像。下一篇，我们会深入 Dockerfile 的指令详解和多阶段构建，让镜像既小又安全。

每天前进一小步，就是一个新的高度！
