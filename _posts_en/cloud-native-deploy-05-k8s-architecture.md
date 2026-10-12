---
title: 'Cloud-Native Deployment (Part 5): Kubernetes Architecture Core — Master, Node and etcd'
date: 2024-06-15
author: Tang Moying
categories: [deploy]
tags: [Kubernetes, K8s Architecture, etcd, Master, Node, Borg]
lang: en
alt_url: /post/cloud-native-deploy-05-k8s-architecture
---

Kubernetes is called the "king of container orchestration", but with over a million lines of code and a pile of components, it's easy to get lost the first time you come across it. This article helps you understand K8s at the architectural level: where it came from, which core components make it up, and how those components work together.

<!--以上为摘要内容-->

## 1. Where Did K8s Come From?

Kubernetes wasn't conjured out of thin air — its design ideas come from **Borg**, the container orchestration system that ran inside Google for more than a decade.

At Google, almost every service runs in a container (they call it a Container, not Docker). Google starts several billion containers a week internally. At a scale like that, human management is out of the question. So Borg came about — a "head steward" that took over cluster scheduling, failure recovery and resource management. To Google, Borg is like air and water: everyone depends on it, but most people don't feel it's there.

K8s is the "distilled edition" drawn from Borg's experience. Borg's designers took the lessons of more than a decade, open-sourced K8s in 2014 and released version 1.0 in 2015. After that, K8s became the de facto standard for container orchestration at an astonishing speed, and even Docker's own Swarm lost out.

K8s has deep roots in Borg, but it isn't a simple open-source clone. K8s discarded Borg's overly complex and coupled modules and was designed to be more modular and more general — Borg was built only for Google's machines and network, while K8s has to adapt to every kind of infrastructure in the world.

## 2. The Overall Architecture of K8s

K8s is a classic **Master-Worker** architecture. One class of node in the cluster is called Master (the control plane) and acts as the brain — making decisions; the other class is called Node (the worker node) and does the work — running containers.

```
┌─────────────────────────────────────────────────────┐
│                    Master Node                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │API Server│ │Scheduler │ │Controller│            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐                                       │
│  │   etcd   │                                       │
│  └──────────┘                                       │
└─────────────────────────────────────────────────────┘
          │                        │
          ▼                        ▼
┌──────────────────┐   ┌──────────────────┐
│    Node 1        │   │    Node 2        │
│ ┌──────────────┐ │   │ ┌──────────────┐ │
│ │   kubelet    │ │   │ │   kubelet    │ │
│ └──────────────┘ │   │ └──────────────┘ │
│ ┌──────────────┐ │   │ ┌──────────────┐ │
│ │ kube-proxy   │ │   │ │ kube-proxy   │ │
│ └──────────────┘ │   │ └──────────────┘ │
│ ┌───┐ ┌───┐     │   │ ┌───┐            │
│ │ P │ │ P │ ... │   │ │ P │ ...        │
│ └───┘ └───┘     │   │ └───┘            │
└──────────────────┘   └──────────────────┘
```

Note that the architecture diagram shows only one Master; in production the Master node is usually deployed as three or more, to achieve high availability.

Below, we'll take apart the responsibilities of each component one by one.

## 3. The Master Components in Detail

### API Server — The Cluster's Single Entry Point

The API Server is K8s's central nervous system — every operation on the cluster, whether from the `kubectl` command line, the Dashboard, or calls between other components, goes through the API Server.

Why design it as a single entry point? This design is crucial:

- **Unified authentication and authorization**: who may operate on the cluster and with what permissions is all verified here, at the API Server.
- **Data consistency**: all write operations go through the API Server into etcd, so there's no risk of multiple components writing directly and causing conflicts.
- **Scalability**: the API Server itself is stateless and can be scaled horizontally to multiple instances.

The API Server exposes a RESTful API and operates on K8s resources (Pod, Service, Deployment and so on). When you run `kubectl get pods`, `kubectl` is in fact sending an HTTP GET request to the API Server.

### etcd — The Cluster's "Memory"

etcd is a distributed key-value store that uses the Raft consensus algorithm. In K8s, etcd stores all the cluster's state data — which Pods are running, what a Service's IP is, what a ConfigMap contains…

etcd's position is very special: **if etcd's data is lost, the whole cluster becomes "amnesiac"**. Containers are still running on the Nodes, but K8s doesn't know who those containers belong to, how many replicas there should be, or how Services should route.

So in production, etcd absolutely must:

- Be deployed as 3 or 5 nodes (an odd number, satisfying Raft's requirement that more than half survive).
- Have its data directory on a fast disk (SSD) — etcd is very sensitive to disk latency.
- Be backed up regularly — etcd provides the `etcdctl snapshot save` command.

etcd interacts only with the API Server and doesn't communicate directly with any other component. This keeps the data flow simple and controllable.

### Scheduler — The Cluster's "Dispatcher"

When you create a Pod and get it running, the Scheduler decides which Node to place it on.

The Scheduler doesn't work by "picking a random idle node" — it's a complex scoring process:

1. **Filtering phase**: list every Node that meets the conditions (enough resources, matching labels, tolerating taints and so on).
2. **Scoring phase**: score each candidate Node, taking into account factors such as:
   - Remaining resource ratio (to avoid piling every Pod onto one node).
   - Pod affinity/anti-affinity rules.
   - Node load balancing.
3. **Pick the highest-scoring Node** and bind the Pod to it through the API Server.

The Scheduler only makes decisions; it doesn't carry them out. It updates the Pod's binding information through the API Server, and then the kubelet on the corresponding Node does the actual job of starting the container.

### Controller Manager — The Cluster's "Course Corrector"

Inside the Controller Manager, several Controllers are running, each responsible for maintaining the state of one kind of resource. Their core logic is all the same: **keep checking the current state against the desired state, and correct it when they differ**.

A few important Controllers:

- **Node Controller**: monitors node status and reacts when a node loses contact.
- **Replication Controller** (now replaced by ReplicaSet): ensures the number of Pod replicas meets the target — create more if there are too few, delete if there are too many.
- **Deployment Controller**: manages a Deployment's rolling updates.
- **Service Controller**: allocates a ClusterIP for a Service.

## 4. The Node Components in Detail

### kubelet — The "Foreman" on Every Node

kubelet is the most important component on a Node, and every Node runs a kubelet process. Its responsibilities are:

- **Watching the API Server**: on receiving the instruction "create Pod X on this Node", it pulls the image, creates the container and starts the container.
- **Reporting status**: periodically reports this Node's status to the API Server (is it still alive, how many resources it has, which Pods are running).
- **Health checks**: runs the Liveness and Readiness probes defined in the Pod, and restarts or flags it if it's unhealthy.

kubelet doesn't create containers directly itself — it calls the container runtime (such as Docker, containerd or CRI-O) through **CRI** (the Container Runtime Interface). This abstraction layer keeps K8s from being tied to a particular container engine.

### kube-proxy — The "Network Steward" on Every Node

kube-proxy implements the load-balancing logic for Services. When a Service has several Pods behind it, kube-proxy sets up network rules (iptables or IPVS) on this Node so that traffic hitting the Service IP is forwarded correctly to one of the backend Pods.

kube-proxy has three operating modes:

| Mode | Principle | Performance | Recommendation |
|------|-----------|-------------|----------------|
| userspace | User-space proxy forwarding | Poor | Deprecated |
| iptables | Kernel-space rule matching, random load balancing | Medium | General use |
| IPVS | Kernel-space layer-4 load balancing, supports multiple algorithms | High | Recommended |

IPVS mode offers more load-balancing algorithms (round-robin, least connections, source IP hash and so on), performs better in production, and is the first choice for large-scale clusters.

### The Container Runtime

Although Docker is the container runtime we're most familiar with, in K8s the container runtime is a replaceable component. Through the CRI interface, K8s can support many runtimes, including Docker, containerd and CRI-O.

In fact, since version 1.24 K8s has removed direct support for Docker (more precisely, it removed dockershim) and recommends containerd as the container runtime.

## 5. A Complete Request Flow

Let's string all the components above together and follow a "create a Deployment" request all the way through:

```
1. kubectl apply -f deployment.yaml
   → Sends an HTTP POST to the API Server

2. API Server
   → Authentication, authorization, validation
   → Writes the Deployment object to etcd

3. Deployment Controller
   → Watches for "a new Deployment"
   → Creates the corresponding ReplicaSet
   → Writes the ReplicaSet object to etcd

4. ReplicaSet Controller
   → Watches for "a new ReplicaSet"
   → Checks current Pod count vs desired count
   → Creates new Pod objects and writes them to etcd

5. Scheduler
   → Watches for "an unscheduled Pod"
   → Picks a suitable Node
   → Updates the Pod's nodeName field in etcd

6. kubelet（对应 Node 上的）
   → Watches for "a Pod bound to this Node"
   → Calls the container runtime to pull the image, create the container and start it

7. Final: Pod 进入 Running 状态
   → kubelet reports status to the API Server
   → API Server writes to etcd
```

Throughout the flow, every component talks only to the API Server, and no two components interact directly. This "star" topology simplifies communication and lets each component evolve and be replaced independently.

## Summary

K8s's architecture is very elegant: the API Server is the single entry point, etcd is the persistent state store, the Scheduler makes scheduling decisions, Controllers correct state, kubelet does the actual execution and kube-proxy forwards network traffic. Each component does its own job, loosely coupled and highly cohesive.

Now that you understand the architecture, next time we'll move on to K8s's three most central concepts — Pod, Deployment and Service, the most important group of API objects in everyday K8s use.

A small step forward every day is a new height!
