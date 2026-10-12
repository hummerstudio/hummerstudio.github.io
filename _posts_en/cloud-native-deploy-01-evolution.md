---
title: 'Cloud-Native Deployment (Part 1): The Evolution from Physical Machines to Containers'
date: 2024-06-01
author: Tang Moying
categories: [deploy]
tags: [Cloud Native, Docker, Kubernetes, Containers, Deployment Evolution, 12-Factor]
lang: en
alt_url: /post/cloud-native-deploy-01-evolution
---

Have you ever wondered why deploying an application took several days ten years ago, while today it can go live in minutes? The containers, Kubernetes and cloud native we take for granted today did not appear out of nowhere — they evolved step by step. To understand cloud native deployment, you first have to know where it came from and what problem it solved.

<!--以上为摘要内容-->

## 1. Four Leaps in How We Deploy

The way software is deployed can roughly be divided into four stages.

### Stage One: the Physical Machine Era

In the earliest days, deploying an application meant buying a server, installing an operating system, and throwing the application onto it to run.

A single physical machine might be running a web service, a database and a cache, all mixed together. This approach has plenty of problems:

- **Resource contention**: one application maxes out the CPU or the memory and every other application suffers.
- **Inconsistent environments**: the development environment is one machine, the test environment another, and the configurations differ. The code runs perfectly on the dev machine and crashes the moment it reaches the server — every programmer has lived through that story.
- **Slow deployment**: need a new machine? Procurement approval takes a week, and racking and network configuration take a few more days. By the time the machine arrives, it is too late to matter.

Someone will say: then why not give each application its own physical machine? That is a fine idea — it just hurts the wallet. Most of the time machine utilisation is under 20%, and the other 80% is electricity burned for nothing.

### Stage Two: the Virtual Machine Era

Once virtualisation technology such as VMware and KVM arrived, one physical machine could be split into several virtual machines, each with its own operating system. As a result:

- resources are isolated between applications, so one application cannot drag down the whole machine.
- utilisation goes up: one physical machine can run several VMs.
- scaling out is much faster too — a new VM can be created in minutes.

But virtual machines have their own pain points as well. Every VM has to run a complete operating system, which is heavy in itself. The OS alone on a single VM takes several GB of disk and hundreds of MB of memory, and those costs are "the price you pay for isolation".

More importantly, a VM image runs to several GB, which makes it slow to transfer, and starting one takes tens of seconds or even minutes. For scenarios that need fast scale-out and elastic scaling, that is still too slow.

### Stage Three: the Container Era

In 2013 Docker burst onto the scene and brought the word "container" into every developer’s life.

A container is essentially still a process running on the host machine, but it takes advantage of two features of the Linux kernel — **namespace** and **cgroup** — to achieve lightweight resource isolation and limits at the process level.

Compared with virtual machines, the advantages of containers are obvious:

| | Virtual machine | Container |
|---|--------|------|
| Startup speed | Minutes | Seconds |
| Image size | GB | MB |
| Resource overhead | A complete OS per VM | Shares the host kernel |
| Deployment density | Dozens per physical machine | Hundreds or thousands per physical machine |

Docker also brought something more important: the **image**. An image is a read-only template containing everything needed to run an application — the code, the runtime, the system tools, the libraries, the configuration. And images are layered, which means different images can share the same lower layers, saving a great deal on storage and transfer costs.

From then on, the "it works on my machine" problem basically disappeared, because the development, test and production environments use the same image.

### Stage Four: the Kubernetes Orchestration Era

Containers are all very well, but production is not as simple as running one or two containers.

If an application needs to run dozens of container instances, how are they scheduled? Which node has spare resources? What happens when a node goes down? How do the containers talk to each other? How is storage mounted? How is configuration managed?

The container itself cannot answer these "orchestration" questions.

Kubernetes (K8s for short) was the answer. It comes from Google’s internal Borg system, released version 1.0 in 2015, and quickly became the de facto standard for container orchestration.

The single most important thing K8s does: **you tell it what you want and it works out how to make it happen**. You say "I want 3 replicas" and K8s schedules them; you say "the load is too high" and it scales out automatically; a node goes down and it moves the containers to healthy nodes on its own. This declarative style of management is the core of cloud native deployment.

## 2. What Is Cloud Native?

The term "cloud native" is everywhere these days, but many people cannot say clearly what it actually is.

Put simply, cloud native is not some specific technology but a set of ideas and a methodology — **designing applications from the outset on the basis of a cloud environment and making full use of the cloud platform’s elasticity, distribution and on-demand delivery capabilities**.

The CNCF’s definition of cloud native contains several key elements:

- **Containerisation**: the application and its dependencies are packaged together, for a consistent environment.
- **Dynamic orchestration**: a platform such as K8s takes care of scheduling and management.
- **Microservices**: the application is split into loosely coupled, independent services, each deployed and evolved on its own.
- **Declarative APIs**: describe the desired state and the system achieves it automatically.
- **Observability**: logging, metrics and tracing, so you know what is happening inside the system.

Among these, the 12-Factor App (Twelve-Factor App) methodology is the classic practical guide to cloud native applications. It was proposed earlier than the term "cloud native" itself, yet the thinking fits perfectly.

### The Core Points of 12-Factor at a Glance

There is plenty about 12-Factor online; here I will pick out just a few items that matter most for deployment:

**Factor I: Codebase** — one codebase, many deployments. The same repository can be deployed to development, staging and production, with the differences controlled by configuration and environment variables rather than by separate branches.

**Factor III: Config** — configuration separated from code. Do not write your database password into the code or bake it into the image. Configuration should be injected through environment variables and change with the environment.

**Factor V: Build, release, run** — keep these three stages strictly separate. The build stage produces an image, the release stage combines image and configuration, and the run stage starts instances. These three stages are one-way; you cannot go back from the run stage and change the image.

**Factor VI: Processes** — the application should be stateless. State (sessions, files, databases) belongs in separate services (Redis, MySQL). Only then can application instances be destroyed and recreated at any time.

**Factor VIII: Concurrency** — scale out through the process model. Want to handle more traffic? Just start a few more instances. This is what is known as "horizontal scaling".

Once you understand these principles and then look at the design of Docker and K8s, everything feels natural — they were built to support exactly these principles.

## 3. The Roadmap for This Series

Now that we have covered the history of the evolution and the core concepts, we will go step by step into the practice of cloud native deployment. The series has 10 articles in all:

| Post | Date | Topic | Key content |
|----|------|------|----------|
| 1 | 03-07 | Overview of cloud native deployment | Evolution history, cloud native concepts, 12-Factor, series introduction |
| 2 | 03-14 | Docker fundamentals | Images, containers, the layering principle |
| 3 | 03-21 | Dockerfile best practices | The instructions in detail, multi-stage builds, slimming images down |
| 4 | 03-28 | Container image registries | Docker Hub, setting up a private Harbor registry |
| 5 | 04-04 | K8s architecture core | How the Master/Node/etcd components work |
| 6 | 04-11 | K8s core concepts | Pod/Deployment/Service in practice |
| 7 | 04-18 | The K8s network model | CNI, Service discovery |
| 8 | 04-25 | K8s storage | Volume/PV/PVC/StorageClass |
| 9 | 05-02 | Helm package management | Chart structure, templated deployment |
| 10 | 05-09 | Health checks and zero-downtime deployment | Liveness/Readiness/rolling updates |

This series does not aim to cover everything, but to focus on **the core knowledge a developer needs to deploy on cloud native**. Every article has real code and hands-on examples to help you put the concepts into practice.

## Summary

From physical machines to virtual machines, from virtual machines to containers, from containers growing wild to Kubernetes bringing order — every leap solved the pain points of the stage before it. Cloud native is not a new term invented out of thin air; it is the natural product of this evolution.

In the next post we start with Docker fundamentals, talking about images, containers and the layering principle, and looking at what actually happens inside Docker.

A small step forward every day is a new height!
