---
title: 云原生部署（三）：Dockerfile 指令详解与多阶段构建
author: 唐明
categories: [deploy]
tags: [Docker, Dockerfile, 多阶段构建, 镜像瘦身, Docker 最佳实践]
---

会写 Dockerfile 和写好 Dockerfile 是两回事。一个糟糕的 Dockerfile 可能让你的镜像从 100MB 变成 1GB，一个优秀的 Dockerfile 则能让你的构建快、镜像小、安全性还好。这篇我们深入 Dockerfile 的每条指令，并通过实际案例掌握多阶段构建。

<!--以上为摘要内容-->

## 1、Dockerfile 指令详解

一条 Dockerfile 就是一系列指令的集合，每条指令对应镜像的一层。我们先逐条过一遍核心指令。

### FROM —— 指定基础镜像

```dockerfile
FROM ubuntu:20.04
FROM openjdk:11-jre-slim
FROM scratch
```

`FROM` 定义了这个镜像的起点。选择基础镜像时有几个原则：

- **能用 slim/alpine 就不用完整版**。`openjdk:11` 可能 600MB+，`openjdk:11-jre-slim` 可能 200MB，`openjdk:11-jre-alpine` 可能 100MB。差距巨大。
- **选官方镜像还是社区镜像**。官方镜像通常更靠谱，有安全团队维护。
- **锁定版本**。不要用 `FROM openjdk:latest`，下次构建可能就变成 JDK 12 了。用 `FROM openjdk:11-jre-slim`。

`scratch` 是一个特殊的空镜像，体积为 0。适合 Go 这类编译完是静态二进制、不需要任何运行时库的语言。

### RUN —— 执行构建命令

```dockerfile
RUN apt-get update && apt-get install -y curl
RUN mkdir -p /app/data
```

每一条 `RUN` 会创建一个新的镜像层。所以我们在实践中会看到这样的写法：

```dockerfile
# 不好——每条 RUN 一层
RUN apt-get update
RUN apt-get install -y curl vim

# 好——合并为一条 RUN，只有一层，且清理了缓存
RUN apt-get update && \
    apt-get install -y curl vim && \
    rm -rf /var/lib/apt/lists/*
```

原则：**把能合并的 RUN 尽量合并，并清理安装缓存**。

### COPY vs ADD —— 复制文件

```dockerfile
COPY app.jar /app/app.jar
COPY --chown=appuser:appgroup ./config/ /app/config/
ADD archive.tar.gz /app/
```

`COPY` 和 `ADD` 都能把主机上的文件复制到镜像中，但有区别：

| | COPY | ADD |
|---|------|-----|
| 本地文件复制 | ✅ | ✅ |
| 自动解压 tar.gz | ❌ | ✅ |
| 远程 URL 下载 | ❌ | ✅（不推荐） |

**原则**：默认用 `COPY`，只有需要自动解压 `tar` 包时才用 `ADD`。从 URL 下载文件应该用 `RUN curl` 或 `RUN wget`，因为 `ADD` 下载的文件没有清理机制且不可控。

`.dockerignore` 也很重要。在 `COPY . /app/` 之前，确保 `node_modules`、`.git` 等不需要的文件被 `.dockerignore` 排除。否则不仅镜像变大，还会有安全问题（比如 `.git` 目录包含了所有历史代码）。

### WORKDIR —— 设置工作目录

```dockerfile
WORKDIR /app
COPY app.jar .
RUN ls    # 当前在 /app 下
```

比 `RUN cd /app && ...` 优雅得多。所有后续的 `RUN`、`CMD`、`ENTRYPOINT`、`COPY`、`ADD` 都以 `WORKDIR` 为当前目录。如果目录不存在会自动创建。

### ENV —— 设置环境变量

```dockerfile
ENV JAVA_OPTS="-Xmx512m -Xms256m"
ENV APP_HOME=/app
```

环境变量会在容器运行时持续生效。也可以用 `ENV` 为某些工具设置默认值，然后用户通过 `docker run -e JAVA_OPTS="-Xmx1g"` 覆盖。

注意：环境变量不会跨 Stage 保留（在多阶段构建中），只在同一个构建阶段内有效。

### ARG —— 构建参数

```dockerfile
ARG VERSION=1.0.0
ARG JAR_FILE=target/app-${VERSION}.jar
COPY ${JAR_FILE} /app/app.jar
```

`ARG` 和 `ENV` 的区别：

- `ARG` 只在构建时有效，容器运行时不存在。
- `ENV` 在构建时和运行时都有效。

用 `--build-arg` 在构建时传入：

```bash
docker build --build-arg VERSION=2.0.0 -t myapp:2.0.0 .
```

### CMD vs ENTRYPOINT —— 启动命令

这是 Dockerfile 中最容易混淆的两个指令。先看区别：

```dockerfile
# CMD 方式
CMD ["java", "-jar", "/app/app.jar"]

# ENTRYPOINT 方式
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

用 `CMD` 启动的容器：

```bash
docker run myimage            # 执行: java -jar /app/app.jar
docker run myimage /bin/bash  # 执行: /bin/bash（CMD 被覆盖）
```

用 `ENTRYPOINT` 启动的容器：

```bash
docker run myimage            # 执行: java -jar /app/app.jar
docker run myimage -Xmx1g     # 执行: java -jar /app/app.jar -Xmx1g
```

**最佳实践——结合使用**：

```dockerfile
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
CMD ["--server.port=8080"]
```

这样 `ENTRYPOINT` 固定了启动方式，`CMD` 提供了默认参数。用户可以通过 `docker run` 附加参数改变默认值但不改变启动命令本身。

### EXPOSE —— 声明端口

```dockerfile
EXPOSE 8080
EXPOSE 8080/tcp
```

注意：`EXPOSE` 仅仅是声明性的文档，并不会实际在宿主机上开启端口。实际端口映射还是需要通过 `docker run -p` 或 `-P` 来完成。但 `EXPOSE` 很有用——它让读 Dockerfile 的人一眼就知道这个镜像提供什么服务。

### USER —— 切换用户

```dockerfile
USER appuser
```

默认容器以 `root` 用户运行。生产环境中应该创建一个非 root 用户运行应用，降低安全风险：

```dockerfile
RUN addgroup --system app && adduser --system --group app
USER app
```

### VOLUME —— 声明挂载点

```dockerfile
VOLUME /app/data
VOLUME /app/logs
```

和 `EXPOSE` 一样，`VOLUME` 也是声明性的。它不会真正挂载任何东西，只是告诉使用者“这里可能有数据需要持久化”。实际挂载还是通过 `docker run -v` 完成。

## 2、让镜像变小：多阶段构建

传统的做法是：一个 Dockerfile 完成所有事情，从编译到打包，全部在一个镜像里。这样做的结果是镜像里包含了大量构建工具（JDK、Maven、npm 等），而这些东西运行时根本不需要。

多阶段构建（Multi-stage Build）解决的就是这个问题。

### 以 Java 应用为例

一个典型的单阶段 Dockerfile：

```dockerfile
FROM maven:3.8-openjdk-11
COPY . /app
WORKDIR /app
RUN mvn clean package -DskipTests
CMD ["java", "-jar", "/app/target/app.jar"]
```

这个镜像有多大？`maven:3.8-openjdk-11` 基础镜像就接近 600MB，加上依赖和编译产物，轻松突破 700MB。

改成多阶段构建：

```dockerfile
# ============ 第一阶段：构建 ============
FROM maven:3.8-openjdk-11 AS builder
WORKDIR /app
COPY pom.xml .
# 先单独下载依赖，利用 Docker 缓存
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# ============ 第二阶段：运行 ============
FROM openjdk:11-jre-slim
WORKDIR /app

# 先创建用户，确保后续 COPY 时可以指定文件所属
RUN addgroup --system app && adduser --system --group app

# 复制文件时直接赋予 app 用户所有权，避免权限问题
COPY --from=builder --chown=app:app /app/target/app.jar app.jar

USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

镜像大小直接变成 200MB 左右，减少了 70% 以上。

注意这里有两个容易被忽略的细节：

1. **先创建用户再 COPY，并用 `--chown` 赋权**。如果先 COPY 再创建用户，复制的文件默认归属于 `root`，后续 `USER app` 切换后，`app` 用户可能无权限读取文件，导致容器启动时报 `Permission denied`。`--chown=app:app` 在复制的同时直接赋予正确所有权。

2. **先 COPY `pom.xml` 并下载依赖，再 COPY `src`**。这样如果只改了源码而依赖没变，Docker 可以复用缓存层，下载依赖这一步直接跳过，大大加速构建。

### 以 Go 应用为例

Go 的多阶段构建更“绝”——最终镜像可以直接基于 `scratch`：

```dockerfile
# ============ 第一阶段：构建 ============
FROM golang:1.17-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server

# ============ 第二阶段：运行 ============
FROM scratch
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
ENTRYPOINT ["./server"]
```

因为 Go 编译出的是静态二进制，不依赖任何系统库，所以最终镜像只有十几 MB，几乎就是二进制的体积。

### 以前端应用为例

```dockerfile
# ============ 第一阶段：构建 ============
FROM node:16-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ============ 第二阶段：运行 ============
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

构建产物（静态文件）通常只有几 MB，放在轻量的 `nginx:alpine` 里。什么 Node.js、`node_modules`，全扔在第一阶段不要了。

## 3、Dockerfile 最佳实践清单

以下是写 Dockerfile 时应该遵守的一些关键原则：

**1. 镜像尽可能小**
- 选 slim/alpine 基础镜像
- 用多阶段构建分离构建环境和运行环境
- 安装依赖时合并 RUN、清理缓存
- 善用 `.dockerignore`

**2. 构建尽可能快**
- 利用层缓存：把变化频率低的指令放在前面
- 先 COPY 依赖文件（`pom.xml`、`package.json`）再 COPY 源码
- 并行构建不相关的层

**3. 安全**
- 不要以 root 用户运行应用
- 不要在镜像里留密钥和密码（用环境变量或 Secret）
- 固定基础镜像版本，不要用 `latest`

**4. 可维护性**
- 一个容器只做一件事
- 用 `EXPOSE` 和 `VOLUME` 声明关键信息
- 用有意义的标签而不是 `latest`

## 小结

Dockerfile 看起来简单，但要写出生产级别的质量，需要理解每一条指令的语义、层的缓存机制，以及多阶段构建的原理。核心就记住三句话：**镜像要小、构建要快、运行要安全。**

有了自己的镜像，下一步自然是要有地方存它。下一篇，我们聊聊容器镜像仓库——Docker Hub 和 Harbor 私服的搭建与使用。

每天前进一小步，就是一个新的高度！
