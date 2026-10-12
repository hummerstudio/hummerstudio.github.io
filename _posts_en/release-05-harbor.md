---
title: 'Release Engineering (Part 5): Harbor — The Container Image Registry'
date: 2024-08-03
author: Tang Moying
categories: [release]
tags: [Harbor, Docker, Image Registry, Containers, K8s]
lang: en
alt_url: /post/release-05-harbor
---

If you're using Docker and Kubernetes, you definitely need a reliable image registry. Docker Hub is slow and has pull rate limits, so it isn't suitable as infrastructure for a production environment. Harbor is very nearly the best choice in this space — it isn't just image storage, but a complete platform for managing the image life cycle.

<!--以上为摘要内容-->

## 1. What Is Harbor?

Harbor is VMware's open-source enterprise container image registry, and it's now a CNCF graduated project. Its core positioning is: **not just storing images, but managing their security and distribution well.**

On top of Docker Registry, Harbor adds several key capabilities:

- **User and project management**: organize images by Project, and each project can have its own members and roles (administrator, developer, guest)
- **Image vulnerability scanning**: integrates scanners such as Trivy, automatically scanning for known vulnerabilities when an image is pushed to the registry
- **Image signing and content trust**: supports Notary, ensuring the image you pull really is the one you trust
- **Image replication and synchronization**: supports replicating images between multiple Harbor instances (for example, synchronizing from a development Harbor to a production Harbor)
- **Garbage collection**: cleans up unreferenced image layers and deleted images

## 2. Installation and Deployment

Installing Harbor is very straightforward — the official project provides a complete docker-compose setup. It also supports deployment to K8s via a Helm Chart.

### Option One: Docker Compose (the most common)

```bash
# Download the offline installer
wget https://github.com/goharbor/harbor/releases/download/v2.10.0/harbor-offline-installer-v2.10.0.tgz
tar -xzf harbor-offline-installer-v2.10.0.tgz
cd harbor

# Copy and edit the configuration file
cp harbor.yml.tmpl harbor.yml
```

Key configuration in `harbor.yml`:

```yaml
hostname: harbor.example.com        # Access address

http:
  port: 80

# If you have an SSL certificate, configure https:
# https:
#   port: 443
#   certificate: /your/certificate/path
#   private_key: /your/private/key/path

harbor_admin_password: Harbor12345  # Initial admin password

database:
  password: root123
  max_idle_conns: 100
  max_open_conns: 900

data_volume: /data                  # Data storage directory
```

```bash
# Prepare the configuration
./prepare

# Install and start
./install.sh
```

After Harbor starts, it brings up a set of containers, which you can inspect with `docker-compose ps`. The core components include:

| Component | Role |
|------|------|
| `harbor-core` | Core API layer |
| `nginx` | Frontend reverse proxy |
| `harbor-jobservice` | Asynchronous tasks (image scanning, replication) |
| `harbor-db` | PostgreSQL database |
| `redis` | Cache and task queue |
| `registry` | Docker Registry v2 instance |
| `trivy-adapter` | Vulnerability scanning adapter |

### Option Two: Helm (the K8s scenario)

```bash
helm repo add harbor https://helm.goharbor.io
helm install harbor harbor/harbor \
  --set expose.type=nodePort \
  --set externalURL=https://harbor.example.com \
  --set harborAdminPassword=Harbor12345
```

The Helm approach suits teams that already have a K8s cluster; it has lower operational overhead — Harbor itself also runs as a workload on K8s.

## 3. Core Operations

### Pushing and Pulling Images

```bash
# Log in to Harbor
docker login harbor.example.com

# Tag the image with the Harbor address
docker tag my-app:1.0.0 harbor.example.com/my-project/my-app:1.0.0

# Push
docker push harbor.example.com/my-project/my-app:1.0.0

# Pull
docker pull harbor.example.com/my-project/my-app:1.0.0
```

Here `my-project` is a Project in Harbor, and it needs to be created in the Harbor UI first. A project is the namespace for images, and also the granularity of permission management.

### Access Control

Harbor's permission model is "user → project → role":

| Role | Permission |
|------|------|
| Project administrator | Manage members, configure the project, delete images |
| Maintainer | Push, pull, and scan images |
| Developer | Push and pull images |
| Guest | Pull images only |

For a production environment, the recommendation is: have the CI pipeline use a robot account (Robot Account) with "developer" permission to push images; have the K8s cluster use a read-only account with "guest" permission to pull images. Using an administrator account for day-to-day CI/CD operations is not recommended.

### Vulnerability Scanning

Harbor can trigger an automatic scan when an image is pushed, or you can manually scan an existing image.

```bash
# Enable "automatically scan images" in the project settings
# Or trigger a scan manually in the Harbor UI
```

The scan results show a detailed vulnerability list for each image, graded by severity (Critical/High/Medium/Low), with CVE IDs provided for reference.

You can also set a vulnerability policy: for example, "images with any Critical or High vulnerability cannot be pulled." This is a very practical security gate.

## 4. Image Replication and Distribution

If your team needs multi-site deployment (say, development in Beijing and production in Shanghai), Harbor's replication feature can synchronize images between multiple instances.

Create a replication rule on the administrator's `Replications` page:

- **Source**: the current Harbor instance
- **Destination**: the address and authentication credentials of another Harbor instance
- **Trigger**: manual, scheduled (by cron expression), or event-driven (automatically replicating after an image is pushed)
- **Filters**: you can specify that only images from certain projects or with certain tags are synchronized

With replication, your images don't need to be exposed directly for the production environment to pull — push to the development Harbor, configure automatic replication to the production Harbor, and the production K8s only needs to access the production Harbor.

## 5. Garbage Collection

One characteristic of Docker Registry is that deleting an image tag only removes the reference to the image layers, while the data still occupies disk space. Harbor provides garbage collection (GC) to clean up this unreferenced data.

GC is a **read-only pause** operation — it requires a global write lock, which means images cannot be pushed while garbage collection is running. So it's best to run it manually during off-peak hours:

```bash
# Trigger it manually under System → Garbage Collection in the Harbor UI
# Or use the command line
docker exec -it harbor-jobservice harbor gc
```

It's best to use this alongside a policy of "periodically cleaning up old tags": delete the tags you no longer need first, then run GC to reclaim disk space.

## 6. Summary

Harbor's positioning is clear: it exists for container images. If your team's core stack is Docker + K8s, Harbor is very nearly the only sensible choice — its image scanning, permission management, and replication and distribution are all designed in depth around the container scenario.

But if, besides Docker images, you have many other artifact formats to manage (Java JARs, npm packages, PyPI packages, Helm Charts) and you want a single unified platform to manage them, then Nexus or Artifactory is the better direction. Next time we'll talk about JFrog Artifactory — what many people call "the flagship of the artifact management world."

A small step forward every day is a new height!
