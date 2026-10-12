---
title: 'Cloud-Native Deployment (Part 7): K8s Network Model — CNI and Service Discovery'
date: 2024-06-22
author: Tang Moying
categories: [deploy]
tags: [Kubernetes, K8s Networking, CNI, Calico, Flannel, kube-proxy, CoreDNS]
lang: en
alt_url: /post/cloud-native-deploy-07-k8s-network
---

Networking is the most complex and most easily overlooked part of K8s. How do Pods communicate with each other? How exactly does that virtual IP of a Service work? What is kube-proxy doing behind the scenes? This article walks you through the ins and outs of K8s networking.

<!--以上为摘要内容-->

## 1. The Basic Assumptions of the K8s Network Model

K8s makes some "bold assumptions" about networking, and every implementation of it (every CNI plugin) has to satisfy them:

**Assumption one: all Pods can communicate with other Pods directly, without NAT.**
Each Pod has its own IP; when Pod A accesses Pod B, it goes straight through Pod B's IP, with no address translation needed.

**Assumption two: all Nodes can communicate with all Pods directly, without NAT.**
A process on a Node (such as kubelet) can access any Pod's IP directly.

**Assumption three: the IP a Pod sees for itself is the same IP others see for it.**
The IP you see when you run `ifconfig` inside a Pod is the very IP other Pods use to reach it.

These three assumptions make K8s networking flat and simple — no NAT complexity, and every IP inside the cluster is "equal in rank."

But here's the question — who implements these assumptions? Answer: the **CNI plugin**.

## 2. CNI — the Container Network Interface

CNI (Container Network Interface) is the network plugin standard defined by K8s. Any networking solution that implements the CNI spec can plug into K8s as its network layer.

Why do we need CNI instead of hard-coding networking into K8s? Because networking is too complex: different environments have different network topologies, and no single solution can cover every scenario. The CNI plugin approach lets users choose the solution that fits their actual situation best.

### Flannel — simple and good enough

Flannel was the earliest and simplest CNI plugin, and it had exactly one design goal: **let all Pods talk to each other.**

Flannel's principle is simple:

1. Give each Node a subnet (such as `10.244.1.0/24`, `10.244.2.0/24`).
2. Store each Node's subnet allocation in etcd.
3. When Pod A (on Node1) accesses Pod B (on Node2):
   - The packet first reaches Node1's bridge, `cni0`.
   - The flanneld process queries etcd and learns that the target Pod is on Node2.
   - It wraps another layer around the original packet (VXLAN or UDP encapsulation) and sends it to Node2.
   - Node2 receives it, unwraps it and delivers it to the target Pod.

Flannel's strengths are simplicity, stability and low resource usage. But its drawbacks are obvious too: it doesn't support network policies (NetworkPolicy), so all Pods can communicate freely with each other, which is a problem in scenarios with high security requirements.

### Calico — the all-round option

Calico is one of the most popular CNI plugins today, and it brings a few key capabilities that Flannel lacks:

- **NetworkPolicy support**: fine-grained control over which Pods can access which other Pods.
- **Direct BGP routing**: no VXLAN encapsulation (IPIP and VXLAN modes are supported too), for better performance.
- **Larger-scale clusters**: BGP routing is more efficient than overlay networking at large scale.

Calico's principle:

1. Each Node runs a BIRD (a BGP client) that peers with the other Nodes in the cluster over BGP.
2. Each Pod's IP route is advertised to all Nodes over BGP.
3. When Pods communicate, packets are forwarded directly by routing, with no extra tunnel encapsulation.

A quick comparison:

| | Flannel | Calico |
|---|---------|--------|
| Principle | Overlay (VXLAN/UDP) | BGP routing |
| Performance | Average (encapsulation has overhead) | High (direct routing) |
| NetworkPolicy | Not supported | Supported |
| Complexity | Low, easy to pick up | Higher, requires understanding BGP |
| Best fit | Small clusters, simple networks | Mid-to-large clusters, needs security policies |

### How do you choose?

- **Small teams, simple scenarios**: Flannel is enough, and it works out of the box.
- **Production environments that need security policies**: Calico is the better fit.
- **Cloud-vendor-managed K8s**: just use the CNI your cloud vendor provides (such as AWS VPC CNI, Azure CNI) — no need to wrestle with it yourself.

## 3. The Network Magic of Service: How kube-proxy Works

In the previous post we created a Service and got a stable ClusterIP. But have you ever wondered: this ClusterIP is virtual, and no NIC behind it is bound to it at all, so how do packets reach the backend Pods?

The answer is **kube-proxy**.

kube-proxy runs on every Node, and its job is to set up network rules on the local Node so that traffic hitting a Service's ClusterIP is forwarded correctly to the backend Pods.

### iptables mode (the most commonly used)

How kube-proxy's iptables mode works:

1. kube-proxy watches for changes to Services and Endpoints in the API Server.
2. When a new Service is created, kube-proxy writes rules into the local Node's iptables.
3. The rules look roughly like this:
   - Destination IP is `10.96.0.1` (the Service ClusterIP), destination port 80 → jump to the Service chain.
   - Service chain: pick a backend Endpoint at random (`10.244.1.5:8080`).
   - DNAT (destination address translation): change the destination IP to `10.244.1.5` and the destination port to 8080.

In pseudocode:

```
iptables:
  Match ClusterIP:Port → pick one at random from the backend list → DNAT to PodIP:TargetPort
```

Note: load balancing in iptables mode is **random** (implemented through the `statistic` module's `--probability`), and it doesn't support round-robin, least-connection or other algorithms.

### IPVS mode (better performance)

In IPVS mode, kube-proxy doesn't write iptables rules; instead it creates IPVS virtual servers:

```
IPVS Virtual Server: 10.96.0.1:80
  → Real Server 1: 10.244.1.5:8080  (weight: 1)
  → Real Server 2: 10.244.2.3:8080  (weight: 1)
  → Real Server 3: 10.244.3.7:8080  (weight: 1)
```

The advantages of IPVS:
- **More load-balancing algorithms**: round-robin (rr), least connection (lc), destination hashing (dh), source hashing (sh) and more.
- **Better performance**: IPVS is the Linux kernel's layer-4 load-balancing module, and it's much faster than the linear matching of iptables rule chains. Once the number of Services reaches the thousands, iptables rule matching becomes a performance bottleneck.
- **Connection tracking**: IPVS has a connection-tracking mechanism, whereas iptables needs a large number of conntrack entries.

### Choosing between kube-proxy modes

| | iptables | IPVS |
|---|----------|------|
| Algorithms | Random | rr/lc/dh/sh and more |
| Performance at scale | Average (linear matching) | Good (hash lookup) |
| Complexity | Low | Medium |
| Maturity | Very high | High |
| Recommendation | Small and mid-size clusters | Large clusters, high-performance requirements |

## 4. DNS Service Discovery: CoreDNS

Beyond the direct ClusterIP, the more common way of doing service discovery in K8s is DNS.

K8s ships with CoreDNS built in (kube-dns in the early days), which automatically creates a DNS A record for every Service.

### The DNS resolution flow

When Pod A needs to access Service B, the whole process goes like this:

```
Pod A: 访问 http://myapp-service:80
   ↓
1. DNS lookup "myapp-service" → CoreDNS
2. CoreDNS 返回 Service ClusterIP: 10.96.0.42
3. Pod A 的连接目标: 10.96.0.42:80
   ↓
4. 数据包到达 Pod A 所在 Node 的网络栈
5. iptables/IPVS 规则匹配 10.96.0.42:80
6. DNAT 到后端 Pod 的实际 IP: 10.244.1.5:8080
7. 数据包到达目标 Pod
```

### DNS record format

DNS records in K8s follow a fixed format:

```
# service name
<service-name>.<namespace>.svc.cluster.local

# for example
myapp-service.default.svc.cluster.local
```

Pods within the same Namespace can reach it with the short name `myapp-service`. Crossing Namespaces requires the full name.

### Verifying it in practice

```bash
# Start a temporary Pod
kubectl run dns-test --rm -it --image=busybox:1.28

# Test from inside the Pod
/ # nslookup kubernetes.default.svc.cluster.local
Server:    10.96.0.10
Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.local

Name:      kubernetes.default.svc.cluster.local
Address 1: 10.96.0.1
```

`10.96.0.10` is CoreDNS's Service ClusterIP, while `kubernetes` is the Service name of the K8s API Server.

## 5. The Complete Path of Pod-to-Pod Communication

Finally, let's look at a complete cross-Node Pod communication path:

```
Node1                                    Node2
┌─────────────────┐                    ┌─────────────────┐
│ Pod A            │                    │ Pod B            │
│ IP: 10.244.1.5  │                    │ IP: 10.244.2.3  │
│        │         │                    │         ▲        │
│        │eth0     │                    │    eth0 │        │
├────────┼─────────┤                    ├─────────┼────────┤
│   ┌────▼──────┐  │                    │  ┌──────┴──────┐ │
│   │  cni0/cali│──┼─[VXLAN/BGP rte]──►│  │  cni0/cali  │ │
│   └───────────┘  │                    │  └─────────────┘ │
│        │         │                    │         ▲        │
├────────┼─────────┤                    ├─────────┼────────┤
│   ┌────▼──────┐  │                    │  ┌──────┴──────┐ │
│   │   eth0    │──┼───────────────────►│  │   eth0     │ │
│   └───────────┘  │  physical network  │  └─────────────┘ │
└─────────────────┘                    └─────────────────┘
```

The key point: a Pod's IP is **not** directly visible on the host's network; it lives in the Pod's virtual network namespace. The CNI plugin is responsible for forwarding these "virtual" IP packets between Nodes.

## Summary

The core understanding of K8s networking: Pods have their own IP, CNI handles cross-Node communication, kube-proxy uses iptables/IPVS to load-balance Services, and CoreDNS provides service discovery. Once you understand this system, the next time you look at a network fault you'll be able to pinpoint which layer the problem is on much faster.

Now that the network works, the application still needs somewhere to store its data. In the next post we'll talk about K8s storage — Volume, PV, PVC and StorageClass.

A small step forward every day is a new height!
