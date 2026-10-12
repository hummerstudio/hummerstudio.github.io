---
title: 'Cloud-Native Deployment (Part 3): Dockerfile Instructions in Detail and Multi-Stage Builds'
date: 2024-06-08
author: Tang Moying
categories: [deploy]
tags: [Docker, Dockerfile, Multi-Stage Builds, Image Slimming, Docker Best Practices]
lang: en
alt_url: /post/cloud-native-deploy-03-dockerfile-best-practices
---

Being able to write a Dockerfile and writing a good Dockerfile are two different things. A bad Dockerfile can turn your image from 100MB into 1GB, while an excellent one makes your build fast, your image small, and your security good as well. In this article we go deep on every Dockerfile instruction, and master multi-stage builds through real cases.

<!--以上为摘要内容-->

## 1. Dockerfile Instructions in Detail

A Dockerfile is a collection of instructions, and each instruction corresponds to one layer of the image. Let's first go through the core instructions one by one.

### FROM — Specify the Base Image

```dockerfile
FROM ubuntu:20.04
FROM openjdk:11-jre-slim
FROM scratch
```

`FROM` defines the starting point of the image. There are a few principles when choosing a base image:

- **If you can use slim/alpine, don't use the full version**. `openjdk:11` may be 600MB+, `openjdk:11-jre-slim` may be 200MB, `openjdk:11-jre-alpine` may be 100MB. The difference is enormous.
- **Official images or community images**. Official images are usually more trustworthy, maintained by a security team.
- **Pin the version**. Don't use `FROM openjdk:latest`; the next build might turn into JDK 12. Use `FROM openjdk:11-jre-slim`.

`scratch` is a special empty image, zero bytes in size. It suits languages like Go whose compiled output is a static binary that doesn't need any runtime libraries.

### RUN — Run Build Commands

```dockerfile
RUN apt-get update && apt-get install -y curl
RUN mkdir -p /app/data
```

Every `RUN` creates a new image layer. So in practice we see code written like this:

```dockerfile
# Bad — one layer per RUN
RUN apt-get update
RUN apt-get install -y curl vim

# Good — merged into a single RUN, only one layer, and the cache is cleaned up
RUN apt-get update && \
    apt-get install -y curl vim && \
    rm -rf /var/lib/apt/lists/*
```

Principle: **merge RUN instructions wherever they can be merged, and clean up the install cache**.

### COPY vs ADD — Copying Files

```dockerfile
COPY app.jar /app/app.jar
COPY --chown=appuser:appgroup ./config/ /app/config/
ADD archive.tar.gz /app/
```

Both `COPY` and `ADD` can copy files from the host into the image, but there are differences:

| | COPY | ADD |
|---|------|-----|
| Copying local files | ✅ | ✅ |
| Automatic tar.gz extraction | ❌ | ✅ |
| Downloading from a remote URL | ❌ | ✅ (not recommended) |

**Principle**: use `COPY` by default, and only use `ADD` when you need automatic extraction of a `tar` archive. Downloading a file from a URL should use `RUN curl` or `RUN wget`, because files downloaded by `ADD` have no cleanup mechanism and are uncontrollable.

`.dockerignore` is important too. Before `COPY . /app/`, make sure files you don't need, such as `node_modules` and `.git`, are excluded by `.dockerignore`. Otherwise not only does the image get bigger, you also get security problems (for example, the `.git` directory contains all of your historical code).

### WORKDIR — Set the Working Directory

```dockerfile
WORKDIR /app
COPY app.jar .
RUN ls    # currently in /app
```

Much more elegant than `RUN cd /app && ...`. All subsequent `RUN`, `CMD`, `ENTRYPOINT`, `COPY` and `ADD` use `WORKDIR` as the current directory. If the directory doesn't exist, it is created automatically.

### ENV — Set Environment Variables

```dockerfile
ENV JAVA_OPTS="-Xmx512m -Xms256m"
ENV APP_HOME=/app
```

Environment variables remain in effect for the lifetime of the container. You can also use `ENV` to set a default value for some tool, which the user then overrides with `docker run -e JAVA_OPTS="-Xmx1g"`.

Note: environment variables are not retained across stages (in a multi-stage build); they are only valid within the same build stage.

### ARG — Build Arguments

```dockerfile
ARG VERSION=1.0.0
ARG JAR_FILE=target/app-${VERSION}.jar
COPY ${JAR_FILE} /app/app.jar
```

The difference between `ARG` and `ENV`:

- `ARG` is only valid at build time; it doesn't exist when the container runs.
- `ENV` is valid both at build time and at run time.

Pass it in at build time with `--build-arg`:

```bash
docker build --build-arg VERSION=2.0.0 -t myapp:2.0.0 .
```

### CMD vs ENTRYPOINT — The Startup Command

These are the two most easily confused instructions in a Dockerfile. First, the difference:

```dockerfile
# CMD style
CMD ["java", "-jar", "/app/app.jar"]

# ENTRYPOINT style
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

A container started with `CMD`:

```bash
docker run myimage            # runs: java -jar /app/app.jar
docker run myimage /bin/bash  # runs: /bin/bash (CMD is overridden)
```

A container started with `ENTRYPOINT`:

```bash
docker run myimage            # runs: java -jar /app/app.jar
docker run myimage -Xmx1g     # runs: java -jar /app/app.jar -Xmx1g
```

**Best practice — use them together**:

```dockerfile
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
CMD ["--server.port=8080"]
```

This way `ENTRYPOINT` fixes the startup method, and `CMD` provides default arguments. Users can append arguments through `docker run` to change the defaults without changing the startup command itself.

### EXPOSE — Declare Ports

```dockerfile
EXPOSE 8080
EXPOSE 8080/tcp
```

Note: `EXPOSE` is purely declarative documentation; it does not actually open a port on the host. The actual port mapping still has to be done with `docker run -p` or `-P`. But `EXPOSE` is very useful — it lets anyone reading the Dockerfile know at a glance what service this image provides.

### USER — Switch User

```dockerfile
USER appuser
```

By default a container runs as the `root` user. In production you should create a non-root user to run the application, reducing security risk:

```dockerfile
RUN addgroup --system app && adduser --system --group app
USER app
```

### VOLUME — Declare Mount Points

```dockerfile
VOLUME /app/data
VOLUME /app/logs
```

Like `EXPOSE`, `VOLUME` is declarative. It doesn't actually mount anything; it just tells the user “there may be data here that needs to persist”. The actual mount is still done with `docker run -v`.

## 2. Making the Image Smaller: Multi-Stage Builds

The traditional approach is this: one Dockerfile does everything, from compilation to packaging, all in one image. The result of doing so is that the image contains a large amount of build tooling (JDK, Maven, npm and so on), and none of that is needed at runtime.

Multi-stage builds are what solve this problem.

### A Java Application as an Example

A typical single-stage Dockerfile:

```dockerfile
FROM maven:3.8-openjdk-11
COPY . /app
WORKDIR /app
RUN mvn clean package -DskipTests
CMD ["java", "-jar", "/app/target/app.jar"]
```

How big is this image? The `maven:3.8-openjdk-11` base image alone is close to 600MB, and adding the dependencies and the compiled output pushes it past 700MB with ease.

Change it to a multi-stage build:

```dockerfile
# ============ Stage 1: Build ============
FROM maven:3.8-openjdk-11 AS builder
WORKDIR /app
COPY pom.xml .
# Download the dependencies on their own first, to exploit the Docker cache
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# ============ Stage 2: Run ============
FROM openjdk:11-jre-slim
WORKDIR /app

# Create the user first, to make sure ownership can be specified in the later COPY
RUN addgroup --system app && adduser --system --group app

# Give the app user ownership directly when copying the file, avoiding permission problems
COPY --from=builder --chown=app:app /app/target/app.jar app.jar

USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

The image size drops straight to around 200MB, a reduction of more than 70%.

Note that there are two easily overlooked details here:

1. **Create the user before COPY, and assign ownership with `--chown`**. If you COPY first and create the user afterwards, the copied files belong to `root` by default; after the later `USER app` switch, the `app` user may have no permission to read the files, and the container reports `Permission denied` at startup. `--chown=app:app` assigns the correct ownership at the same time as the copy.

2. **COPY `pom.xml` and download the dependencies first, then COPY `src`**. That way, if only the source code changed and the dependencies didn't, Docker can reuse the cached layer, skip the dependency download step entirely, and speed up the build dramatically.

### A Go Application as an Example

Go's multi-stage build goes even further — the final image can be based directly on `scratch`:

```dockerfile
# ============ Stage 1: Build ============
FROM golang:1.17-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server

# ============ Stage 2: Run ============
FROM scratch
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
ENTRYPOINT ["./server"]
```

Because Go compiles to a static binary that doesn't depend on any system libraries, the final image is only a dozen-odd MB — essentially just the size of the binary.

### A Front-End Application as an Example

```dockerfile
# ============ Stage 1: Build ============
FROM node:16-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ============ Stage 2: Run ============
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

The build output (static files) is usually only a few MB, placed inside a lightweight `nginx:alpine`. Node.js, `node_modules`, all of it is thrown away in the first stage and left behind.

## 3. Dockerfile Best Practices Checklist

Here are some key principles you should follow when writing a Dockerfile:

**1. Make the image as small as possible**
- Choose slim/alpine base images
- Use multi-stage builds to separate the build environment from the runtime environment
- Merge RUN instructions and clean the cache when installing dependencies
- Make good use of `.dockerignore`

**2. Make the build as fast as possible**
- Exploit the layer cache: put instructions that change infrequently near the front
- COPY the dependency files (`pom.xml`, `package.json`) before COPYing the source code
- Build unrelated layers in parallel

**3. Security**
- Don't run the application as the root user
- Don't leave keys and passwords in the image (use environment variables or a Secret)
- Pin the base image version; don't use `latest`

**4. Maintainability**
- One container does one thing
- Use `EXPOSE` and `VOLUME` to declare key information
- Use meaningful tags instead of `latest`

## Summary

A Dockerfile looks simple, but writing production-grade quality out of it requires understanding the semantics of every instruction, the layer caching mechanism, and the principles of multi-stage builds. Just remember three sentences: **the image must be small, the build must be fast, and running must be secure.**

Once you have your own image, the next step is naturally to have somewhere to store it. Next time we'll talk about container image registries — setting up and using Docker Hub and a private Harbor registry.

A small step forward every day is a new height!
