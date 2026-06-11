---
title: 云原生部署（十）：健康检查与零停机部署
author: 唐明
categories: [deploy]
tags: [Kubernetes, 健康检查, 滚动更新, 零停机, Liveness, Readiness, Probe]
---

一个应用在容器里跑起来了，但“进程在跑”和“服务可用”是两回事。进程可能卡死在死循环里，可能连不上数据库，可能启动了半天还没加载完。K8s 的健康检查机制就是来区分这些状态的。而配合滚动更新策略，我们可以做到“用户无感知”的零停机发布——这一篇是云原生部署系列的收尾，把前面学的知识串起来，落地到生产实践。

<!--以上为摘要内容-->

## 1、进程活着 ≠ 服务健康

K8s 默认通过检查容器主进程是否存活来判断容器是否健康——进程在跑，K8s 就认为容器没问题。

但这个判断太粗糙了。来看看几种常见场景：

**场景一：死锁。** 进程还在跑，但所有线程互相等待，对外不响应任何请求。K8s 看不出来，进程还在。

**场景二：启动太慢。** Java 应用启动需要 60 秒加载上下文。在启动完成之前，Service 已经把流量分过来了，请求 502 了。

**场景三：依赖不可用。** 应用起来了，但数据库连不上。进程在跑，但业务不可用。

这些场景都需要比“进程是否在跑”更精细的健康检查——这就是 **Probe**（探针）的用武之地。

## 2、三种探针：Liveness、Readiness、Startup

K8s 提供了三种探针，每种用途不同：

| 探针 | 问题 | 检查失败后 | 典型用途 |
|------|------|-----------|---------|
| **Liveness** | 容器是不是“死了”？ | 重启容器 | 检测死锁、内存溢出 |
| **Readiness** | 容器准备好接收流量了吗？ | 从 Service 后端摘除 | 检测依赖是否就绪、启动是否完成 |
| **Startup** | 启动完成了吗？ | 重启容器 | 保护启动慢的应用 |

### Liveness Probe —— “心脏还在跳吗？”

Liveness 检查容器是否**活着**。如果失败，K8s 会杀掉容器并重新启动。

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30    # 容器启动后等待 30 秒再开始检查
  periodSeconds: 10           # 每 10 秒检查一次
  timeoutSeconds: 5           # 超时时间 5 秒
  failureThreshold: 3         # 连续失败 3 次才判为不健康
```

这个配置的意思是：容器启动 30 秒后，每 10 秒发一次 HTTP GET 请求到 `/health`。如果连续 3 次返回非 200 或超时，K8s 认为容器“死了”，杀掉重启。

**注意**：Liveness 不要配得太激进。如果你的应用偶尔会慢一下（比如 GC 暂停），`initialDelaySeconds` 太小、`failureThreshold` 太小，可能导致容器被“误杀”。

### Readiness Probe —— “准备好接客了吗？”

Readiness 检查容器是否**可以接收流量**。如果失败，K8s 会把该 Pod 从 Service 的后端列表中移除，流量不再发给它。成功了再加回来。

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 3
```

Readiness 和 Liveness 的核心区别：

| | Liveness | Readiness |
|---|----------|-----------|
| 失败后果 | 容器被杀死并重启 | Pod 从 Service 摘除 |
| 恢复方式 | 只能靠容器重启 | 探针重新成功后自动恢复 |
| 影响范围 | 只影响当前 Pod | 影响 Service 的流量分发 |
| 做什么用 | 解决“进程假死” | 解决“还没准备好就接流量” |

**关键理解**：应用启动 60 秒，在第 30 秒时 Readiness 探针才通过，那么前 30 秒这个 Pod 不会收到任何外部请求——Service 不会把流量发给它。这完美解决了“启动慢导致 502”的问题。

### Startup Probe —— 保护“起床气”重的应用

如果你的应用启动特别慢（比如要 2 分钟），`initialDelaySeconds` 只能设一个固定的延迟，很难算准。设小了 Liveness 在启动完成前就判定失败、直接重启；设大了故障检测就变慢了。

**Startup Probe 就是为了解决这个痛点引入的**。自 K8s 1.18 稳定以来，它已成为生产环境的标配，对于启动较慢的应用（如 Java/Spring Boot）强烈推荐使用。

```yaml
startupProbe:
  httpGet:
    path: /health
    port: 8080
  failureThreshold: 30        # 最多可以失败 30 次
  periodSeconds: 10           # 每 10 秒检查一次
```

这个配置的意思是：**容器有长达 300 秒（30 × 10 秒）的时间来完成启动**。在此期间：

- 如果 Startup Probe 还没成功，Liveness 和 Readiness 检查不会被触发。
- Startup Probe 一旦成功一次，就不再执行。之后 Liveness 和 Readiness 接管。

```yaml
# 完整的例子：三个探针配合使用
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  periodSeconds: 5
  failureThreshold: 3

startupProbe:
  httpGet:
    path: /health
    port: 8080
  failureThreshold: 30
  periodSeconds: 10
```

### 探针的实现方式

三种探针都支持以下检查方式：

| 方式 | 用法 | 适用场景 |
|------|------|---------|
| `httpGet` | HTTP GET 请求 | Web 服务、REST API |
| `tcpSocket` | TCP 端口探测 | 数据库、缓存 |
| `exec` | 容器内执行命令 | 自定义检查逻辑 |

`exec` 的例子：

```yaml
livenessProbe:
  exec:
    command:
    - cat
    - /tmp/healthy
  initialDelaySeconds: 5
  periodSeconds: 5
```

应用通过写一个标记文件 `/tmp/healthy` 来表示自己健康。如果文件不存在，说明出了问题，K8s 重启容器。

### 常见踩坑

**坑 1：Liveness 配得太激进。** `initialDelaySeconds: 5` + `failureThreshold: 1` —— 应用只要有一次 GC 暂停超过 5 秒，就被杀了。生产环境中 `failureThreshold` 至少设为 3。

**坑 2：Readiness 探针检查了外部依赖。** 比如 Readiness 探针去检查数据库连接——当数据库挂了，所有 Pod 的 Readiness 都变成不健康，全部被摘除。但摘除了之后什么都没了，服务彻底不可用。Readiness 应该只检查本容器的状态，外部依赖的问题应该由熔断、降级机制处理，而不是把 Pod 摘掉。

**坑 3：没有配 Startup Probe。** 启动慢的应用启动期间 Liveness 就超时了，容器被反复重启，永远起不来。看到 `CrashLoopBackOff` 先检查是不是这个原因。

## 3、滚动更新——零停机的关键

健康检查解决了“单个 Pod 是否可用”的问题，滚动更新解决了“怎么在不中断服务的情况下更新”的问题。

### 滚动更新的原理

当更新 Deployment 的镜像版本时，K8s 不会一次性干掉所有旧 Pod 再创建新 Pod（那样服务就中断了）。而是**逐步替换**：

```
Step 0: [Old] [Old] [Old]         3 个旧 Pod 在运行
Step 1: [Old] [Old] [Old] [New]   创建一个新 Pod
Step 2: [Old] [Old]         [New] 新 Pod Ready 后，删一个旧 Pod
Step 3: [Old]         [New] [New] 再创建一个新 Pod
Step 4: [Old] [New]    [New] [New] 新 Pod Ready 后，再删一个旧 Pod
Step 5: [New] [New]    [New]       全部替换完成
```

整个过程流量不间断——因为旧 Pod 在删除之前仍然会处理完现有请求，新 Pod 在 Ready 之后才开始接收请求。

### 控制滚动更新速度

`Deployment.spec.strategy` 中有两个关键参数：

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1       # 最多允许几个 Pod 不可用
      maxSurge: 1             # 最多允许超出期望副本数几个 Pod
```

按副本数为 3 举例：

| maxUnavailable | maxSurge | 最小可用数 | 最大运行数 | 效果 |
|----------------|----------|----------|----------|------|
| 1 | 1 | 2 | 4 | 每次同时关 1 个旧的开 1 个新的（**推荐**） |
| 0 | 1 | 3 | 4 | 先起新的、再关旧的。更保守，零风险 |
| 1 | 0 | 2 | 3 | 先关旧的、再起新的。稍激进 |

如果你的应用需要“绝对不能少一个 Pod”（比如负载刚好跑满），选 `maxUnavailable: 0`。如果资源和时间充裕，这通常是最安全的选择。

### 滚动更新 + Readiness 的配合

滚动更新依赖于 Readiness 探针。流程是：

1. 新 Pod 创建，状态 `Running`（进程已启动）。
2. Readiness 探针检查 `/ready` 端点。
3. Readiness 探针成功后，Pod 被加入 Service 后端。
4. 旧 Pod 开始 graceful shutdown（收到 SIGTERM）。
5. 旧 Pod 处理完进行中的请求后退出。
6. 循环直到所有 Pod 都更新完毕。

**如果 Readiness 没配**，K8s 在容器一起动就认为它 Ready 了，立刻把流量导过来，而此时应用可能还在加载配置、连接数据库，请求过来就会出现 502、连接拒绝等错误。

### 验证零停机

用 `kubectl rollout` 命令可以观察和操作滚动更新：

```bash
# 触发更新
kubectl set image deployment/myapp myapp=harbor.yourcompany.com/backend/myapp:v2.0

# 观察更新过程
kubectl rollout status deployment/myapp

# 观察 Pod 变化
kubectl get pods -w

# 暂停更新（发现问题时）
kubectl rollout pause deployment/myapp

# 继续更新
kubectl rollout resume deployment/myapp

# 回滚
kubectl rollout undo deployment/myapp
```

同时可以用 `while true; do curl -s http://service/health; sleep 1; done` 在另一个终端持续请求，验证整个更新过程中是否有丢请求。

## 4、完整的生产级 Deployment 示例

综合本系列学到的所有知识，这是一个生产可用的完整 Deployment 配置：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0       # 绝对不出现副本不足
      maxSurge: 1
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      terminationGracePeriodSeconds: 30   # 优雅退出时间
      containers:
      - name: myapp
        image: harbor.yourcompany.com/backend/myapp:v2.0
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "production"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        startupProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          failureThreshold: 30
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          periodSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          periodSeconds: 5
          failureThreshold: 3
```

## 5、系列回顾

至此，云原生部署系列 10 篇全部完成。回顾一下我们走过的路：

| 篇 | 主题 | 核心收获 |
|----|------|---------|
| 1 | 部署演进史 | 知道云原生从哪里来、解决了什么问题 |
| 2 | Docker 基础 | 理解镜像分层原理、容器运行机制 |
| 3 | Dockerfile 最佳实践 | 写出又小又安全的镜像 |
| 4 | Harbor 镜像仓库 | 搭建企业级私服，管理镜像生命周期 |
| 5 | K8s 架构核心 | 理解 Master/Node/etcd 各组件职责 |
| 6 | Pod/Deployment/Service/ConfigMap/Secret | 掌握日常使用 K8s 的核心 API 对象 |
| 7 | K8s 网络 | 搞懂 CNI、kube-proxy、DNS 服务发现 |
| 8 | K8s 存储 | 用 PV/PVC/StorageClass 持久化数据 |
| 9 | Helm 包管理 | 模板化部署，一套 Chart 适配多环境 |
| 10 | 健康检查与零停机 | 配好 Probe 和滚动更新，安全上线 |

从一台物理机跑一个应用到 K8s 集群上零停机滚动更新——这条路我们一步步走过来了。云原生部署不是一蹴而就的事，这 10 篇覆盖了核心路径，希望对你有所帮助。

## 小结

健康检查是 K8s 的“免疫系统”，滚动更新是“无痛手术刀”。Liveness 检测死锁，Readiness 控制流量，Startup 保护慢启动——三种探针配合 `maxUnavailable` 和 `maxSurge` 一起使用，让你的部署真正做到用户无感知。

每天前进一小步，就是一个新的高度！
