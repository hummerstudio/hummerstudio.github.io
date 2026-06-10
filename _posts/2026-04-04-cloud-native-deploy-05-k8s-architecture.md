---
title: 云原生部署（五）：Kubernetes 架构核心——Master、Node 与 etcd
author: 唐明
categories: [deploy]
tags: [Kubernetes, K8s 架构, etcd, Master, Node, Borg]
---

Kubernetes 被称为"容器编排之王"，但它的代码上了百万行、组件一堆，第一次接触的人很容易迷失。这篇文章带你从架构层面理解 K8s：它从哪里来，由哪些核心组件构成，以及这些组件之间是怎么协作的。

<!--以上为摘要内容-->

## 1、K8s 从哪里来？

Kubernetes 并不是凭空造出来的——它的设计思想源自 Google 内部运行了十几年的容器编排系统 **Borg**。

在 Google，几乎所有服务都跑在容器里（他们叫 Container，不是 Docker）。Google 内部每周要启动几十亿个容器，这么大的规模，不可能靠人工管理。于是就有了 Borg——一个接管了集群调度、故障恢复、资源管理的"大管家"。Borg 之于 Google，就像空气和水一样，所有人都依赖它，但大多数人感觉不到它的存在。

K8s 就是从 Borg 的经验中提炼出来的"精华版"。Borg 的设计者们吸取了十几年的经验教训，在 2014 年开源了 K8s，2015 年发布了 1.0 版本。此后，K8s 以惊人的速度成为容器编排的事实标准，就连 Docker 自己的 Swarm 也败下阵来。

K8s 与 Borg 有很深的渊源，但并非简单的开源克隆。K8s 舍弃了 Borg 中过于复杂和耦合的模块，设计得更模块化、更通用——Borg 只为 Google 的机器和网络设计，而 K8s 要适配全世界的各种基础设施。

## 2、K8s 的总体架构

K8s 是一个典型的 **Master-Worker** 架构。集群中有一类节点叫 Master（控制平面），负责大脑——做决策；另一类节点叫 Node（工作节点），负责干活——运行容器。

```
┌─────────────────────────────────────────────────────┐
│                    Master 节点                        │
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

需要注意的是，这个架构图中 Master 只有一个，生产环境中 Master 节点通常部署 3 个或更多，以实现高可用。

下面我们逐一拆解每个组件的职责。

## 3、Master 组件详解

### API Server —— 整个集群的唯一入口

API Server 是 K8s 的大脑中枢——所有对集群的操作，无论是 `kubectl` 命令行、Dashboard，还是其他组件之间的调用，全部经过 API Server。

为什么设计成单一入口？这个设计很关键：

- **统一认证与授权**：谁来操作集群、有什么权限，全在 API Server 这里校验。
- **数据一致性**：所有写操作都由 API Server 写入 etcd，不会有多个组件直接写数据导致冲突。
- **可扩展性**：API Server 本身是无状态的，可以水平扩展多个实例。

API Server 提供的是 RESTful API，操作的是 K8s 的资源（Pod、Service、Deployment 等）。当你执行 `kubectl get pods` 时，`kubectl` 实际上向 API Server 发了一个 HTTP GET 请求。

### etcd —— 集群的"记忆"

etcd 是一个分布式键值存储系统，使用了 Raft 一致性算法。在 K8s 里，etcd 存储的是集群的所有状态数据——哪些 Pod 在运行、Service 的 IP 是多少、ConfigMap 的内容是什么……

etcd 的地位非常特殊：**如果 etcd 的数据丢了，整个集群就"失忆"了**。虽然 Node 上还在跑容器，但 K8s 不知道这些容器是谁的、该有多少副本、Service 该怎么路由。

因此，生产环境中的 etcd 一定要：

- 部署 3 个或 5 个节点（奇数个，满足 Raft 半数以上存活的要求）。
- 数据目录放在高速磁盘（SSD）上——etcd 对磁盘延迟很敏感。
- 定期备份——etcd 提供了 `etcdctl snapshot save` 命令。

etcd 只和 API Server 交互，不和任何其他组件直接通信。这保证了数据流简单可控。

### Scheduler —— 集群的"调度员"

当你创建一个 Pod、让它跑起来时，Scheduler 负责决定把它放到哪个 Node 上。

Scheduler 的工作方式不是"随机找一个空闲节点"，而是一个复杂的打分过程：

1. **过滤阶段**：列出所有满足条件的 Node（资源够、标签匹配、污点容忍等）。
2. **打分阶段**：对每个候选 Node 打分，考虑的因素包括：
   - 资源剩余率（避免把 Pod 全堆到一个节点上）。
   - Pod 亲和性/反亲和性规则。
   - 节点负载均衡。
3. **选出得分最高的 Node**，通过 API Server 把 Pod 绑定到这个 Node 上。

Scheduler 只做决策，不执行决策。它通过 API Server 更新 Pod 的绑定信息，然后由对应 Node 上的 kubelet 去真正启动容器。

### Controller Manager —— 集群的"纠偏员"

Controller Manager 内部运行着多个 Controller（控制器），每个 Controller 负责一种资源的状态维护。它们的核心逻辑都一样：**不断检查当前状态和期望状态，如果不一致就纠正**。

几个重要的 Controller：

- **Node Controller**：监控节点状态，节点失联后做出反应。
- **Replication Controller**（已被 ReplicaSet 替代）：确保 Pod 副本数量达标，少了就创建，多了就删掉。
- **Deployment Controller**：管理 Deployment 的滚动更新。
- **Service Controller**：为 Service 分配 ClusterIP。

## 4、Node 组件详解

### kubelet —— 每个 Node 上的"工头"

kubelet 是 Node 上最重要的组件，每个 Node 都有一个 kubelet 进程。它的职责是：

- **监听 API Server**：收到"在本 Node 上创建 Pod X"的指令后，拉镜像、创建容器、启动容器。
- **上报状态**：定期向 API Server 报告本 Node 的状态（还在不在、有多少资源、哪些 Pod 在跑）。
- **健康检查**：执行 Pod 中定义的 Liveness 和 Readiness 探针，发现不健康则重启或标记。

kubelet 本身不直接创建容器，而是通过 **CRI**（Container Runtime Interface）调用容器运行时（如 Docker、containerd、CRI-O）。这个抽象层让 K8s 不绑定特定的容器引擎。

### kube-proxy —— 每个 Node 上的"网络管家"

kube-proxy 负责实现 Service 的负载均衡逻辑。当一个 Service 背后有多个 Pod 时，kube-proxy 在本 Node 上设置网络规则（iptables 或 IPVS），让访问 Service IP 的流量能正确转发到某个后端 Pod。

kube-proxy 有三种工作模式：

| 模式 | 原理 | 性能 | 推荐度 |
|------|------|------|--------|
| userspace | 用户态代理转发 | 差 | 已弃用 |
| iptables | 内核态规则匹配，随机负载均衡 | 中 | 通用 |
| IPVS | 内核态 4 层负载均衡，支持多种算法 | 高 | 推荐 |

IPVS 模式提供了更多负载均衡算法（轮询、最小连接、源 IP 哈希等），在生产环境中性能更好，是大规模集群的首选。

### 容器运行时（Container Runtime）

虽然 Docker 是我们最熟悉的容器运行时，但在 K8s 中，容器运行时是一个可替换的组件。通过 CRI 接口，K8s 可以支持 Docker、containerd、CRI-O 等多种运行时。

实际上，K8s 在 1.24 版本后已经移除了对 Docker 的直接支持（更准确地说，移除了 dockershim），推荐使用 containerd 作为容器运行时。

## 5、一个完整的请求流程

把上面所有组件串起来，看一个"创建 Deployment"的请求是怎么走完的：

```
1. kubectl apply -f deployment.yaml
   → 发送 HTTP POST 到 API Server

2. API Server
   → 认证、授权、校验
   → 把 Deployment 对象写入 etcd

3. Deployment Controller
   → 监听到"有新的 Deployment"
   → 创建对应的 ReplicaSet
   → 把 ReplicaSet 对象写入 etcd

4. ReplicaSet Controller
   → 监听到"有新的 ReplicaSet"
   → 检查当前 Pod 数量 vs 期望数量
   → 创建新的 Pod 对象写入 etcd

5. Scheduler
   → 监听到"有未调度的 Pod"
   → 选出一台合适的 Node
   → 更新 Pod 的 nodeName 字段到 etcd

6. kubelet（对应 Node 上的）
   → 监听到"有 Pod 绑定到本 Node"
   → 调用容器运行时拉镜像、创建容器、启动

7. Final: Pod 进入 Running 状态
   → kubelet 上报状态给 API Server
   → API Server 写入 etcd
```

整个流程中，所有组件都只和 API Server 通信，没有任何两个组件之间直接交互。这种"星型"拓扑简化了通信，也让每个组件可以独立演化和替换。

## 小结

K8s 的架构设计非常精巧：API Server 做统一入口，etcd 做持久化状态存储，Scheduler 做调度决策，Controller 做状态纠偏，kubelet 做实际执行，kube-proxy 做网络转发。每个组件各司其职，松耦合高内聚。

理解了架构，下一篇我们进入 K8s 最核心的三个概念——Pod、Deployment 和 Service，这是日常使用 K8s 最重要的一组 API 对象。

每天前进一小步，就是一个新的高度！
