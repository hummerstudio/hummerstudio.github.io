---
title: 云原生部署（八）：K8s 存储——Volume、PV、PVC 与 StorageClass
author: 唐明
categories: [deploy]
tags: [Kubernetes, K8s 存储, PV, PVC, StorageClass, Volume, 持久化存储]
---

容器是“用完即扔”的，但数据不是。如果把 MySQL 直接跑在容器里，容器一删数据就没了，这显然不行。K8s 怎么管理存储？PV、PVC、StorageClass 这些都是什么关系？这篇文章把这些概念一次讲清楚。

<!--以上为摘要内容-->

## 1、容器存储的根本问题

容器的文件系统是临时的（ephemeral）。还记得第二篇讲的分层原理吗？容器有一个可读写层，但容器的可读写层和容器的生命周期绑定——容器一删，可读写层就没了。

```
┌──────────────────┐
│ Container R/W    │  ← 容器删了，这里的内容就没了！
├──────────────────┤
│ App Layer        │
├──────────────────┤
│ Base Layer       │
└──────────────────┘
```

那数据放哪？答案是**让数据脱离容器的生命周期，独立存在。** 这就是 Volume（存储卷）的职责。

## 2、Volume —— 把数据“挂”进容器

K8s 的 Volume 是把外部存储挂载到 Pod 的容器里，使得容器可以像访问本地目录一样访问外部数据。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
spec:
  containers:
  - name: myapp
    image: myapp:v1
    volumeMounts:
    - name: app-data       # 要挂载哪个卷
      mountPath: /data     # 挂载到容器里的哪个路径
  volumes:
  - name: app-data
    hostPath:              # 卷的类型
      path: /mnt/data      # 宿主机上的路径
```

这个例子用 `hostPath` 把宿主机的 `/mnt/data` 目录挂载到了容器的 `/data` 下。Pod 删了数据还在宿主机上。

### 常见的 Volume 类型

K8s 支持很多种 Volume 类型，下面是其中最常用的几种：

| Volume 类型 | 用途 | 数据生命周期 |
|-------------|------|-------------|
| `emptyDir` | Pod 内临时数据，容器间共享 | Pod 删除时清除 |
| `hostPath` | 挂载宿主机目录 | 持久化，但和 Node 绑定 |
| `configMap` | 挂载配置文件 | 跟随 ConfigMap |
| `secret` | 挂载敏感数据（密码、证书） | 跟随 Secret |
| `nfs` | 挂载 NFS 共享存储 | 独立于 Pod 和 Node |
| `persistentVolumeClaim` | 动态/静态申请持久化卷 | 独立于 Pod |

`hostPath` 适合单节点开发测试，但不适合生产——你的 Pod 可能被调度到任意 Node 上，不能假设某个 Node 上一定有你要的数据。

## 3、PersistentVolume（PV）—— 集群级别的存储

Volume 是 Pod 级别的，定义在每个 Pod 的 YAML 里。如果每个开发者都要在 YAML 里写清楚存储的细节（NFS 地址、云盘 ID 等），这就让应用和基础设施耦合了。

K8s 的解决方案是**把存储的供应和存储的消费分离开**。

**PersistentVolume（PV）是管理员预先准备的一块存储**，就像管理员在集群里插了一块“存储 U 盘”：

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-nfs-10g
spec:
  capacity:
    storage: 10Gi            # 存储容量
  accessModes:
    - ReadWriteOnce          # 访问模式
  persistentVolumeReclaimPolicy: Retain
  nfs:                       # 存储后端
    server: 192.168.1.100
    path: /nfs/data
```

关键字段解释：

- **capacity.storage**：这块 PV 的大小。
- **accessModes**：访问模式（见下表）。
- **persistentVolumeReclaimPolicy**：PVC 被删除后 PV 怎么处理（Retain 保留、Delete 删除、Recycle 清空后重用）。
- **存储后端**：可以是 NFS、AWS EBS、GCE PD、Ceph、GlusterFS、本地磁盘等。

### 访问模式

| 模式 | 缩写 | 含义 |
|------|------|------|
| ReadWriteOnce | RWO | 单节点读写（最常用） |
| ReadOnlyMany | ROX | 多节点只读 |
| ReadWriteMany | RWX | 多节点读写（需要分布式文件系统） |

大部分应用只需要 RWO。只有像多个 Pod 需要同时写入同一个共享文件系统时才需要 RWX。

## 4、PersistentVolumeClaim（PVC）—— 消费端

有了 PV（供应端），应用开发者不需要关心存储的底层细节，只需要声明“我要多大、什么访问模式”的存储。这就是 **PersistentVolumeClaim（PVC）**：

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: myapp-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
```

PVC 创建后，K8s 自动寻找一个满足条件的 PV 并绑定。绑定的逻辑是：

- PV 的容量 ≥ PVC 的请求。
- PV 的访问模式包含 PVC 要求的模式。
- PV 的存储类别（StorageClass）和 PVC 匹配（如果指定了的话）。

一旦绑定，这个 PV 就归这个 PVC 独占了，别的 PVC 不能再绑。

### 在 Pod 中使用 PVC

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mysql-pod
spec:
  containers:
  - name: mysql
    image: mysql:5.7
    env:
    - name: MYSQL_ROOT_PASSWORD
      value: "root123"
    volumeMounts:
    - name: mysql-data
      mountPath: /var/lib/mysql      # MySQL 数据目录
  volumes:
  - name: mysql-data
    persistentVolumeClaim:
      claimName: myapp-pvc           # 引用 PVC
```

无论 Pod 被调度到哪个 Node 上，MySQL 的数据都持久化在 PV 里。Pod 重建了，重新挂上同一个 PVC，数据完好无损。

### PV 与 PVC 的生命周期

```
管理员创建 PV → 开发者创建 PVC → K8s 自动绑定
                                      ↓
                                  Pod 使用 PVC
                                      ↓
                                  Pod 删除（数据还在）
                                      ↓
                                  PVC 删除
                                      ↓
                        根据 ReclaimPolicy 处理 PV
                     （Retain: PV 保留 / Delete: PV 删除）
```

## 5、StorageClass —— 动态存储供应

手动创建 PV 实在太麻烦了。每个应用都要管理员提前创建好 PV，容量算多了浪费，算少了不够用。**StorageClass 实现了 PV 的动态创建**——开发者创建 PVC 时，K8s 自动按需创建 PV。

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs    # 存储供应者
parameters:
  type: gp3                           # SSD 类型
  fsType: ext4
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer  # 延迟绑定
```

有了 StorageClass，PVC 只需要指定 `storageClassName`：

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: dynamic-pvc
spec:
  storageClassName: fast-ssd     # 引用 StorageClass
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
```

K8s 看到这个 PVC：
1. 找到 `storageClassName` 对应的 StorageClass。
2. 调用 `provisioner`（比如 AWS EBS）创建一块 20Gi 的 SSD 云盘。
3. 自动创建一个 PV 并绑定到这个 PVC 上。
4. Pod 挂载这个 PVC 时，云盘自动 attach 到对应的 Node 上。

**一切全自动，无需管理员手动介入。**

### `volumeBindingMode` 的选择

| 模式 | 含义 |
|------|------|
| `Immediate`（默认） | PVC 一创建就立刻创建 PV 并绑定 |
| `WaitForFirstConsumer` | 等到 Pod 真正要用 PVC 时才创建 PV |

`WaitForFirstConsumer` 更推荐——因为它等 Scheduler 选定了 Node 之后才创建 PV，可以避免 Pod 需要的存储不被调度目标 Node 支持的情况。比如 AWS EBS 是 AZ 级别的，如果提前创建 PV 在 `us-east-1a`，但 Pod 被调度到了 `us-east-1b`，就挂不上了。

## 6、实际案例：在 K8s 中部署持久化的 MySQL

以下是一个生产可用的 MySQL Deployment + PVC 示例：

```yaml
# pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
spec:
  storageClassName: fast-ssd
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
---
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
spec:
  replicas: 1                    # 注意：MySQL 通常单副本，不能用 Deployment 扩缩
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:5.7
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:        # 密码不要写死，从 Secret 读取
              name: mysql-secret
              key: root-password
        ports:
        - containerPort: 3306
        volumeMounts:
        - name: mysql-data
          mountPath: /var/lib/mysql
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
      volumes:
      - name: mysql-data
        persistentVolumeClaim:
          claimName: mysql-pvc
---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  selector:
    app: mysql
  ports:
  - port: 3306
    targetPort: 3306
```

关键点：
- MySQL 通常用 `replicas: 1`，多副本需要额外的集群方案（如 Galera Cluster）。
- 密码通过 Secret 注入，不打在 YAML 里。
- 数据目录挂载了 PVC，Pod 重建不丢数据。

## 小结

K8s 存储的核心逻辑是**供应和消费的解耦**：管理员通过 PV/StorageClass 供应存储，开发者通过 PVC 消费存储。StorageClass 的动态供应机制让这个过程全自动，真正做到了声明式管理。

数据不会丢了，但应用跑起来还得保证健康。下一篇，我们进入生产部署的最后一环——健康检查与零停机部署。

每天前进一小步，就是一个新的高度！
