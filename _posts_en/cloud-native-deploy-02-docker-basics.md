---
title: 'Cloud-Native Deployment (Part 2): Docker Basics — Images, Containers and the Principle of Layering'
date: 2024-06-02
author: Tang Moying
categories: [deploy]
tags: [Docker, Containers, Images, UnionFS, Layered Filesystem, Docker Basics]
lang: en
alt_url: /post/cloud-native-deploy-02-docker-basics
---

Docker is the first step in cloud-native deployment. Plenty of people can use `docker run`, but not everyone is clear on what happens behind it. What exactly is the difference between an image and a container? Why are Docker images so space-efficient? What does "layering" even mean? This article takes you through Docker's core mechanisms at the level of principle.

<!--以上为摘要内容-->

## 1. What Is Docker?

The question looks simple, but people in different roles may give different answers.

In technical essence, Docker is a container runtime — it uses the Linux kernel's namespace and cgroup to achieve resource isolation and limits at the process level. But its greater contribution is defining **the image** as a standardised unit of delivery, plus a whole toolchain built around images and containers.

In one sentence: **Docker solves the "it works on my machine" problem, letting software run anywhere like a shipping container.**

Before the transport industry had containers, loading and unloading cargo was all manual labour, and moving goods from a truck onto a ship took forever. With containers, whether what's inside is clothes or electronics, a crane picks it up and sets it down and it's done. A Docker image is the shipping container of the software world.

## 2. What Exactly Is an Image?

An image is a read-only template containing the complete filesystem needed to run an application — the base OS libraries, application dependencies, code, configuration and so on.

You can think of an image as the ISO file of an installation disc, but it isn't a compressed archive: it is a **layered structure**.

### UnionFS and the Principle of Layering

The core technology behind Docker images is UnionFS (union filesystem), which stacks multiple directory layers together and presents them to the outside as a single unified filesystem view.

A typical Docker image consists of several layers:

```
应用层（Layer 4）: COPY app.jar
依赖层（Layer 3）: RUN apt-get install ...
运行时层（Layer 2）: FROM openjdk:11
基础系统层（Layer 1）: FROM ubuntu:20.04
```

Each layer is read-only. When you `docker pull` an image, you'll notice that it downloads layer by layer. If two images share the same lower layers (say, both use `ubuntu:20.04`), those lower layers only need downloading once.

That's why Docker images save both storage and bandwidth — **layer reuse**.

### What Happens Behind `docker pull`?

When you type `docker pull nginx:latest` in a terminal, Docker does these few things:

1. Parse the image name `nginx:latest` and find the corresponding Registry (Docker Hub by default).
2. Fetch the image's manifest (a JSON file listing the information and checksums of every layer in this image).
3. Check layer by layer whether a local cache already has it — skip if so, download if not.
4. Once all layers are downloaded, verify the integrity of each layer.
5. Assemble the image in local storage.

`docker history nginx:latest` shows you each layer of the image directly:

```bash
$ docker history nginx:latest
IMAGE          CREATED        CREATED BY                          SIZE
2b7d6430f78d   2 weeks ago    CMD ["nginx" "-g" "daemon off;"]   0B
<missing>      2 weeks ago    EXPOSE map[80/tcp:{}]               0B
<missing>      2 weeks ago    COPY file:xxx /etc/nginx/nginx.conf 1.46kB
<missing>      2 weeks ago    RUN /bin/sh -c set -x && ...        28.4MB
<missing>      2 weeks ago    ADD file:xxxx /                     74.1MB
```

Each line is a layer, and `SIZE` is the disk size that layer contributes. Note that instructions like `CMD` and `EXPOSE` don't produce a new layer, so their SIZE is 0B.

## 3. Containers — A Running Instance of an Image

Once you understand images, understanding containers is simple.

**Container = image + one read-write layer**

When you `docker run` an image, Docker adds a **read-write layer (Container Layer)** on top of all the image's read-only layers. Every file modification the container makes while running (writing logs, generating temporary files, installing new packages and so on) happens on this read-write layer.

```
┌──────────────────┐
│   Container R/W  │  ← read-write layer (independent per container)
├──────────────────┤
│   App Layer      │
├──────────────────┤
│   Dependencies   │
├──────────────────┤
│   Base OS Layer  │
└──────────────────┘
   全部只读层（所有容器共享）
```

The cleverness of this design is:

- **The image is immutable, the container is mutable.** The same image can start countless containers, each with its own independent read-write layer, none affecting the others.
- **Delete the container and the read-write layer is gone.** That's why containers are designed to be "disposable", and why stateful data should be mounted outside through a Volume.
- **Read-only layers are shared between images.** That saves a great deal of disk space, and starting a new container skips the cost of copying an entire filesystem.

### What Does `docker run` Actually Execute?

`docker run` is really a composite command, equivalent to `docker create` + `docker start` + a foreground `docker attach`. The specific steps are:

1. **Pull the image** (if it isn't local).
2. **Create the container**: create a read-write layer on top of the image layers, allocate networking, IP and so on.
3. **Start the container**: run the start command defined in the image (ENTRYPOINT or CMD).
4. **Attach the terminal**: with the `-it` flag, bind the terminal's stdin/stdout/stderr to the container process.

## 4. Common Image Operations

### Building Images: `docker build`

`docker build` needs a `Dockerfile`, and each instruction corresponds to one layer. The build process caches every layer — if a layer's instruction and context are unchanged, the cache is used directly and that layer's build is skipped. That's why we habitually put the instructions that rarely change early (like installing system dependencies) and the ones that change often late (like copying code).

This article won't expand on the Dockerfile; the next one discusses it in detail.

### Listing Images: `docker images`

```bash
$ docker images
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
nginx        latest    2b7d6430f78d   2 weeks ago    188MB
```

`IMAGE ID` is a 64-bit hexadecimal number (usually only the first 12 digits are shown); it is the SHA256 checksum of the image's contents, used to uniquely identify an image.

### Removing Images: `docker rmi`

Deleting an image with `docker rmi <image>` checks whether any container still references it. If one does, it errors by default, and you need to delete the container first or use `-f` to force the deletion.

### Tagging: `docker tag`

```bash
docker tag nginx:latest myrepo/nginx:v1.0
```

`docker tag` doesn't copy the image; it just gives the same image ID another name. It's like one person having several nicknames (tags), with several nicknames pointing to the same person (image ID).

### Pushing/Pulling Images

```bash
docker push myrepo/nginx:v1.0
docker pull myrepo/nginx:v1.0
```

Both pushing and pulling are layered, transferring only the layers you don't have locally. If the repository already has the base image's layers, only the new layers you added get pushed — very fast.

## 5. Common Container Operations

### Starting Containers: `docker run`

```bash
# Run in the background
docker run -d --name my-nginx nginx:latest

# Run interactively
docker run -it ubuntu:20.04 /bin/bash
```

Key parameters:

| Parameter | Meaning |
|------|------|
| `-d` | Run in the background (detach) |
| `-it` | Interactive terminal |
| `--name` | Give the container a name |
| `-p 8080:80` | Port mapping: host 8080 → container 80 |
| `-v /data:/data` | Volume mount: host directory → container directory |
| `-e KEY=value` | Inject an environment variable |
| `--rm` | Delete the container automatically once it exits |

### Listing Containers: `docker ps`

```bash
# Containers that are running
docker ps

# All containers (including exited ones)
docker ps -a
```

Be careful to distinguish `docker ps` from `docker images`. The former looks at containers, the latter at images.

### Entering a Running Container

```bash
# Open a new terminal
docker exec -it my-nginx /bin/bash

# Attach to the main process's terminal
docker attach my-nginx
```

`exec` starts a new process, `attach` connects to the container's main process. `exec` is used more often, because when `attach` exits, if what it was connected to is the PID 1 process, it will cause the container to exit.

### Stopping and Deleting

```bash
docker stop my-nginx    # Graceful stop (SIGTERM → timeout → SIGKILL)
docker kill my-nginx    # Force kill (SIGKILL)
docker rm my-nginx      # Delete the container
```

The difference between `stop` and `kill` is worth noting: `stop` sends the `SIGTERM` signal to the container process and waits a graceful-exit period (10 seconds by default), sending `SIGKILL` after the timeout. `kill` sends `SIGKILL` directly.

## 6. A Few Easily Confused Concepts

### Image vs Container

This is the group of concepts newcomers confuse most easily. Remember this analogy:

> An image is a "class" (Class), and a container is an "instance" (Instance).

One class can new up countless objects, one image can run countless containers. A class defines properties and methods, an image defines a filesystem and a startup command. Objects can have their own independent property values, containers have their own independent read-write layer.

### Registry vs Repository vs Tag

This is another classic source of confusion:

- **Registry**: an image registry service, such as Docker Hub (`docker.io`) or Harbor.
- **Repository**: an image project inside a registry, such as `library/nginx`; one repository can have multiple Tags.
- **Tag**: the label of an image inside a repository, such as `latest`, `v1.0`, `alpine`.

So the full explanation of `docker pull nginx:latest` is: pull the image whose Tag is `latest` from Repository `library/nginx` in Registry `docker.io`.

### ENTRYPOINT vs CMD

Both of these define the command to execute when a container starts; the difference is:

- `CMD` can be overridden by arguments that follow `docker run`.
- `ENTRYPOINT` won't be overridden; arguments that follow `docker run` become arguments to `ENTRYPOINT`.

In actual use there are many different combinations, and these will be covered in detail in the next article on Dockerfile best practices.

## Summary

Docker's core concepts are actually few: the image (a layered read-only template), the container (image + a read-write layer, a running instance), and the Registry (the image registry service). Once you understand the principle of layering, you understand why Docker is lightweight and why it's fast.

The next step is naturally to write a `Dockerfile` yourself and build your own image. In the next article, we'll go deep into Dockerfile instruction details and multi-stage builds, so that images are both small and safe.

A small step forward every day is a new height!
