---
title: 云原生部署（七）：K8s 网络模型——CNI 与 Service 发现
author: 唐明
categories: [deploy]
tags: [Kubernetes, K8s 网络, CNI, Calico, Flannel, kube-proxy, CoreDNS]
---

网络是 K8s 中最复杂也最容易被忽视的部分。Pod 之间怎么通信？Service 的那个虚拟 IP 到底是怎么工作的？kube-proxy 在背后做了什么？这篇文章带你理清 K8s 网络的来龙去脉。

<!--以上为摘要内容-->

## 1、K8s 网络模型的基本假设

K8s 对网络做了一些"大胆的假设"，所有网络实现（CNI 插件）都必须满足它们：

**假设一：所有 Pod 都能和其他 Pod 直接通信，不需要 NAT。**
每个 Pod 有自己的 IP，Pod A 访问 Pod B 时，直接通过 Pod B 的 IP，不需要做地址转换。

**假设二：所有 Node 都能和所有 Pod 直接通信，不需要 NAT。**
Node 上的进程（如 kubelet）可以直接访问任意 Pod 的 IP。

**假设三：Pod 看到的自己的 IP，和别人看到的它的 IP，是同一个。**
Pod 内运行 `ifconfig` 看到的 IP，就是其他 Pod 访问它时用的 IP。

这三个假设让 K8s 网络变得扁平而简单——没有 NAT 的复杂，所有 IP 在集群内是"平权"的。

但问题是——这些假设是谁来实现的？答：**CNI 插件**。

## 2、CNI —— 容器网络接口

CNI（Container Network Interface）是 K8s 定义的网络插件标准。任何实现了 CNI 规范的网络方案，都可以接入 K8s 作为网络层。

为什么需要 CNI 而不是把网络写死在 K8s 里？因为网络太复杂了，不同的环境有不同的网络拓扑，没有一种方案能通吃所有场景。用 CNI 插件的方式，让用户根据实际情况选择最合适的方案。

### Flannel —— 简单够用

Flannel 是最早也是最简单的 CNI 插件，它的设计目标只有一个：**让所有 Pod 都能互通。**

Flannel 的原理很简单：

1. 给每个 Node 分配一个子网段（如 `10.244.1.0/24`、`10.244.2.0/24`）。
2. 在 etcd 中存储每个 Node 的子网分配信息。
3. 当 Pod A（在 Node1）访问 Pod B（在 Node2）时：
   - 数据包先到 Node1 的网桥 `cni0`。
   - flanneld 进程查询 etcd，知道目标 Pod 在 Node2。
   - 在原始数据包外面再包一层（VXLAN 或 UDP 封装），发到 Node2。
   - Node2 收到后解封装，送到目标 Pod。

Flannel 的优点是简单、稳定、资源占用少。但缺点也明显：不支持网络策略（NetworkPolicy），所有 Pod 之间可以自由通信，这在安全要求高的场景下是个问题。

### Calico —— 功能全面的选择

Calico 是目前最流行的 CNI 插件之一，它比 Flannel 多出几个关键能力：

- **支持 NetworkPolicy**：可以精细控制哪些 Pod 能访问哪些 Pod。
- **直接用 BGP 路由**：不用 VXLAN 封装（也支持 IPIP 或 VXLAN 模式），性能更好。
- **更大规模的集群**：BGP 路由在大规模场景下比 Overlay 网络更高效。

Calico 的原理：

1. 每个 Node 上运行一个 BIRD（BGP 客户端），和集群中其他 Node 建立 BGP 对等。
2. 每个 Pod 的 IP 路由通过 BGP 广播到所有 Node 上。
3. Pod 之间通信时，直接用路由转发，不需要额外的隧道封装。

简单对比：

| | Flannel | Calico |
|---|---------|--------|
| 原理 | Overlay（VXLAN/UDP） | BGP 路由 |
| 性能 | 一般（封装有开销） | 高（直接路由） |
| NetworkPolicy | 不支持 | 支持 |
| 复杂度 | 低、容易上手 | 较高、需要理解 BGP |
| 适用场景 | 小型集群、简单网络 | 中大型集群、需要安全策略 |

### 怎么选择？

- **小团队、简单场景**：Flannel 够用，开箱即用。
- **生产环境、需要安全策略**：Calico 更合适。
- **云厂商托管 K8s**：直接用云厂商提供的 CNI（如 AWS VPC CNI、Azure CNI），不需要自己折腾。

## 3、Service 的网络魔法：kube-proxy 原理

在上一篇中，我们创建了 Service，获得了稳定的 ClusterIP。但你有没有疑惑过：这个 ClusterIP 是虚拟的，背后根本没有网卡绑定它，那数据包是怎么到达后端 Pod 的？

答案是 **kube-proxy**。

kube-proxy 运行在每个 Node 上，它的职责就是在本地 Node 上设置网络规则，使得访问 Service ClusterIP 的流量能被正确转发到后端 Pod。

### iptables 模式（最常用）

kube-proxy 的 iptables 模式的工作流程：

1. kube-proxy 监听 API Server 中 Service 和 Endpoints 的变化。
2. 当有新的 Service 创建时，kube-proxy 在本地 Node 的 iptables 中写入规则。
3. 规则大概是这样的：
   - 目标 IP 是 `10.96.0.1`（Service ClusterIP），目标端口 80 → 跳转到 Service 链。
   - Service 链：随机选择一个后端 Endpoint（`10.244.1.5:8080`）。
   - DNAT（目标地址转换）：把目标 IP 改成 `10.244.1.5`、目标端口改成 8080。

用伪代码表达就是：

```
iptables:
  匹配 ClusterIP:Port → 从后端列表随机选一个 → DNAT 到 PodIP:TargetPort
```

注意：iptables 模式的负载均衡是**随机**的（通过 `statistic` 模块的 `--probability` 实现），不支持轮询、最小连接等其他算法。

### IPVS 模式（性能更强）

在 IPVS 模式下，kube-proxy 不写 iptables 规则，而是创建 IPVS 虚拟服务器：

```
IPVS Virtual Server: 10.96.0.1:80
  → Real Server 1: 10.244.1.5:8080  (weight: 1)
  → Real Server 2: 10.244.2.3:8080  (weight: 1)
  → Real Server 3: 10.244.3.7:8080  (weight: 1)
```

IPVS 的优势：
- **更多负载均衡算法**：轮询（rr）、最小连接（lc）、目标哈希（dh）、源哈希（sh）等。
- **性能更好**：IPVS 是 Linux 内核的 4 层负载均衡模块，比 iptables 规则链的线性匹配快得多。在 Service 数量达到数千个时，iptables 的规则匹配会成为性能瓶颈。
- **连接追踪**：IPVS 有连接追踪机制，而 iptables 需要大量 conntrack 条目。

### kube-proxy 模式的对比选型

| | iptables | IPVS |
|---|----------|------|
| 算法 | 随机 | rr/lc/dh/sh 等多种 |
| 大规模性能 | 一般（线性匹配） | 好（哈希查找） |
| 复杂度 | 低 | 中 |
| 成熟度 | 非常高 | 高 |
| 推荐度 | 中小集群 | 大集群、高性能要求 |

## 4、DNS 服务发现：CoreDNS

除了直接的 ClusterIP，K8s 更常用的服务发现方式是 DNS。

K8s 内置了 CoreDNS（早期是 kube-dns），为每个 Service 自动创建 DNS A 记录。

### DNS 解析流程

当 Pod A 需要访问 Service B 时，整个过程是这样的：

```
Pod A: 访问 http://myapp-service:80
   ↓
1. DNS 查询 "myapp-service" → CoreDNS
2. CoreDNS 返回 Service ClusterIP: 10.96.0.42
3. Pod A 的连接目标: 10.96.0.42:80
   ↓
4. 数据包到达 Pod A 所在 Node 的网络栈
5. iptables/IPVS 规则匹配 10.96.0.42:80
6. DNAT 到后端 Pod 的实际 IP: 10.244.1.5:8080
7. 数据包到达目标 Pod
```

### DNS 记录格式

K8s 中 DNS 记录遵循固定的格式：

```
# 服务名
<service-name>.<namespace>.svc.cluster.local

# 例如
myapp-service.default.svc.cluster.local
```

同一个 Namespace 内的 Pod 可以直接用短名 `myapp-service` 访问。跨 Namespace 则需要全名。

### 实际验证

```bash
# 启动一个临时 Pod
kubectl run dns-test --rm -it --image=busybox:1.28

# 在 Pod 内测试
/ # nslookup kubernetes.default.svc.cluster.local
Server:    10.96.0.10
Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.local

Name:      kubernetes.default.svc.cluster.local
Address 1: 10.96.0.1
```

`10.96.0.10` 就是 CoreDNS 的 Service ClusterIP，而 `kubernetes` 是 K8s API Server 的 Service 名称。

## 5、Pod 间通信的完整路径

最后，让我们看一个完整的跨 Node Pod 通信路径：

```
Node1                                    Node2
┌─────────────────┐                    ┌─────────────────┐
│ Pod A            │                    │ Pod B            │
│ IP: 10.244.1.5  │                    │ IP: 10.244.2.3  │
│        │         │                    │         ▲        │
│        │eth0     │                    │    eth0 │        │
├────────┼─────────┤                    ├─────────┼────────┤
│   ┌────▼──────┐  │                    │  ┌──────┴──────┐ │
│   │  cni0/cali│──┼─[VXLAN/BGP路由]──►│  │  cni0/cali  │ │
│   └───────────┘  │                    │  └─────────────┘ │
│        │         │                    │         ▲        │
├────────┼─────────┤                    ├─────────┼────────┤
│   ┌────▼──────┐  │                    │  ┌──────┴──────┐ │
│   │   eth0    │──┼───────────────────►│  │   eth0     │ │
│   └───────────┘  │  物理网络          │  └─────────────┘ │
└─────────────────┘                    └─────────────────┘
```

关键点：Pod 的 IP **不**在宿主机网络上直接可见，它存在于 Pod 的虚拟网络命名空间中。CNI 插件负责在不同 Node 之间转发这些"虚拟"的 IP 数据包。

## 小结

K8s 网络的核心认知：Pod 有独立 IP、CNI 负责跨 Node 通信、kube-proxy 用 iptables/IPVS 实现 Service 的负载均衡、CoreDNS 提供服务发现。理解了这个体系，再看网络故障就能更快地定位到问题出在哪一层。

网络通了，应用还得有地方存数据。下一篇，我们聊聊 K8s 的存储——Volume、PV、PVC 和 StorageClass。

每天前进一小步，就是一个新的高度！
