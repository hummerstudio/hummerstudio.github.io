---
title: 云原生部署（六）：K8s 核心概念——Pod、Deployment、Service、ConfigMap 与 Secret
author: 唐明
categories: [deploy]
tags: [Kubernetes, Pod, Deployment, Service, ConfigMap, Secret, K8s 核心概念, YAML]
---

理解了 K8s 的架构，接下来该认识 K8s 中最核心的 API 对象了：Pod、Deployment、Service，以及管理配置与密钥的 ConfigMap 和 Secret。这五个是你日常和 K8s 打交道时使用频率最高的概念，搞明白了它们，K8s 就算入了门。

<!--以上为摘要内容-->

## 1、Pod —— K8s 的最小调度单元

如果你问一个刚学过 Docker 的人：“K8s 里容器的基本单位是什么？”，他最可能回答“是容器”。但这个答案是错的。

**Pod 是 K8s 中创建和管理的最小单元，一个 Pod 可以包含一个或多个容器。**

### 为什么要有 Pod？为什么不直接调度容器？

这是理解 K8s 设计的关键问题。Docker 已经能跑容器了，K8s 为什么要在容器之上再包装一层 Pod？

答案在于：**有些容器天生就是“连体婴儿”，需要共享资源、紧密协作。**

举个例子：一个 Web 应用容器需要一个日志收集 agent 把日志推到 Elasticsearch。这两个容器需要共享文件系统（Web 写日志，agent 读日志）、共享网络命名空间（通过 localhost 通信）。如果它们是独立的容器，这个共享就很难实现。

Pod 解决了这个问题：同一个 Pod 内的所有容器共享：
- **网络命名空间**：共享 IP 和端口空间，容器之间通过 `localhost` 通信。
- **存储卷（Volume）**：可以在容器之间共享文件。
- **生命周期**：同生共死，一起被调度到同一个 Node 上。

这种模式叫 **Sidecar 模式**（边车模式），日志收集 agent 就是 Web 容器的 sidecar——它们共享 Pod 的“躯体”，协作完成一项任务。

### Pod 的 YAML 定义

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
  labels:
    app: myapp
    version: v1
spec:
  containers:
  - name: myapp
    image: harbor.yourcompany.com/backend/myapp:v1.0
    ports:
    - containerPort: 8080
    resources:
      requests:
        memory: "256Mi"
        cpu: "250m"
      limits:
        memory: "512Mi"
        cpu: "500m"
```

逐行解释一下：

- `apiVersion`：API 版本。K8s API 是分组的，Pod 属于 `v1` 核心组。
- `kind`：资源类型，这里是 `Pod`。
- `metadata.name`：Pod 的名字，在同一个 Namespace 下必须唯一。
- `metadata.labels`：标签，这是 K8s 最强大的组织机制之一（后面会讲）。
- `spec.containers`：容器列表。一个 Pod 可以有多个容器。
- `resources.requests`：容器请求的基础资源量，Scheduler 用来选 Node。
- `resources.limits`：容器的资源上限。超过上限 CPU 会被 throttle，内存会被 OOM Kill。

关键点：**`requests` 决定调度，`limits` 决定运行时限制。** 如果内存 `requests` 是 256Mi 但 `limits` 是 512Mi，K8s 按 256Mi 找一个够用的 Node，但运行时允许容器用到 512Mi。

### Pod 的常见状态

| 状态 | 含义 |
|------|------|
| `Pending` | Pod 已创建但容器还没启动（可能在拉镜像、等调度） |
| `Running` | Pod 已绑定到 Node，至少一个容器在运行 |
| `Succeeded` | 所有容器正常退出（`exit code 0`） |
| `Failed` | 至少一个容器异常退出 |
| `CrashLoopBackOff` | 容器反复崩溃重启 |

`CrashLoopBackOff` 是新手最常见的状态——容器启动了，然后崩了，K8s 重启，又崩了，再重启，每次重启间隔越来越长。出现这种状态，说明容器的启动命令有问题或镜像本身就跑不起来。

## 2、Deployment —— Pod 的管家

直接创建 Pod 在生产中很少使用——Pod 本身不具备自愈能力，Node 挂了 Pod 就没了。

**Deployment 是 Pod 的管理者**，它确保指定数量的 Pod 副本始终在运行。你告诉它“我想要 3 个副本”，它就帮你维护这 3 个——少了就创建，多了就删掉，Node 挂了就在其他 Node 上重建。

### Deployment 的 YAML 定义

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-deployment
  labels:
    app: myapp
spec:
  replicas: 3                          # 期望的副本数
  selector:
    matchLabels:
      app: myapp                       # 选择器：管理带 app=myapp 标签的 Pod
  template:                            # Pod 模板
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: harbor.yourcompany.com/backend/myapp:v1.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

注意 `selector.matchLabels` 和 `template.metadata.labels` 必须匹配。Deployment 通过标签来找到“谁是我管的 Pod”。如果标签不匹配，Deployment 会不断创建新 Pod（以为旧的不存在），导致资源泄漏。

### Deployment 的日常操作

```bash
# 创建
kubectl apply -f deployment.yaml

# 查看
kubectl get deployments
kubectl describe deployment myapp-deployment

# 扩容/缩容
kubectl scale deployment myapp-deployment --replicas=5

# 更新镜像
kubectl set image deployment/myapp-deployment myapp=harbor.yourcompany.com/backend/myapp:v2.0

# 查看更新状态
kubectl rollout status deployment/myapp-deployment

# 回滚
kubectl rollout undo deployment/myapp-deployment
```

### Labels（标签）——K8s 的粘合剂

Labels 是 K8s 中极其重要的组织机制。它们就是简单的键值对，贴在任意 K8s 对象上。然后通过 **Label Selector** 来筛选和关联对象。

举例，同一个 Deployment 管理了两组不同版本的 Pod：

```yaml
# Pod 的标签
labels:
  app: myapp
  version: v1
  env: staging

# Selector 可以选择
selector:
  matchLabels:
    app: myapp
  # 或更复杂的：
  matchExpressions:
    - {key: version, operator: In, values: [v1, v2]}
```

Labels 让 K8s 的解耦做到了极致——Deployment 不关心 Pod 叫什么名字、在哪里创建，只关心“带 `app=myapp` 标签的 Pod 是不是有 3 个“。

## 3、Service —— 稳定的访问入口

有了 Deployment 管理 Pod，你以为万事大吉了。但 Pod 的 IP 是临时的——Pod 重建后 IP 会变。如果其他服务直接访问 Pod IP，Pod 一重建就失联了。

**Service 就是解决这个问题的：它为背后的一组 Pod 提供一个稳定的访问入口。**

### Service 模式

Service 有几种类型，最常见的是 ClusterIP：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  type: ClusterIP          # 只在集群内可访问
  selector:
    app: myapp             # 选择后端 Pod
  ports:
  - port: 80               # Service 的端口
    targetPort: 8080       # 后端 Pod 的端口
```

这个 Service 会在集群内获得一个固定的虚拟 IP（ClusterIP），任何 Pod 访问 `myapp-service:80` 的流量，都会被 kube-proxy 转发到标签为 `app=myapp` 的某个后端 Pod 的 8080 端口。

### 三种 Service 类型对比

| 类型 | 访问范围 | 使用场景 |
|------|---------|---------|
| **ClusterIP** | 集群内部 | 服务间调用，默认类型 |
| **NodePort** | `NodeIP:NodePort` | 开发调试，简单对外暴露 |
| **LoadBalancer** | 外部 LB → Node | 生产环境对外暴露（需云服务商支持） |

### DNS 服务发现

K8s 内置了 DNS 服务（CoreDNS）。每个 Service 创建后，会自动注册一个 DNS 记录：

```
<service-name>.<namespace>.svc.cluster.local
```

所以在集群内的任何容器里，你可以直接通过 Service 名称访问：

```bash
# 而不需要知道 ClusterIP 是什么
curl http://myapp-service:80/health
```

这解决了服务发现中最核心的问题：**不需要知道对方在哪里，只需要知道对方叫什么。**

## 4、ConfigMap 与 Secret —— 配置与密钥管理

到了这里，你已经掌握了 K8s 的“计算三件套”：Pod 跑容器、Deployment 管副本、Service 管访问。但还有一个问题没解决：**配置和密钥怎么管理？**

把数据库地址、API 密钥、证书这些敏感信息写死在镜像里？绝对不行。这不仅违反 12-Factor 原则（配置应该与代码分离），还会导致密钥泄露的风险。

K8s 提供了两个专门的 API 对象来解决这个问题：**ConfigMap**（管理普通配置）和 **Secret**（管理敏感信息）。

### 4.1 ConfigMap —— 非敏感配置的集中管理

ConfigMap 用来存储键值对形式的配置数据，比如环境变量、配置文件内容等。

**创建 ConfigMap 的几种方式：**

```bash
# 方式一：从键值对直接创建
kubectl create configmap app-config \
  --from-literal=app.env=production \
  --from-literal=app.log.level=INFO

# 方式二：从文件创建（文件内容成为 value）
kubectl create configmap nginx-config \
  --from-file=nginx.conf=./nginx.conf

# 方式三：从目录批量创建（每个文件名成为 key）
kubectl create configmap app-config-dir \
  --from-file=./config-dir/
```

也可以用 YAML 文件定义：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  # 简单键值对
  app.env: "production"
  app.log.level: "INFO"
  # 多行配置文件（注意 | 表示保留换行的 YAML 语法）
  nginx.conf: |
    server {
        listen 80;
        server_name localhost;
        location / {
            root /usr/share/nginx/html;
            index index.html;
        }
    }
```

**在 Pod 中使用 ConfigMap：**

ConfigMap 的数据可以通过两种方式注入到容器中：**环境变量** 和 **文件卷挂载**。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: configmap-demo
spec:
  containers:
  - name: app
    image: myapp:v1
    # 方式一：作为环境变量
    env:
    - name: APP_ENV
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: app.env
    - name: LOG_LEVEL
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: app.log.level
    # 一次性注入所有键值对（键名作为环境变量名）
    envFrom:
    - configMapRef:
        name: app-config
    # 方式二：作为文件挂载
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
  volumes:
  - name: config-volume
    configMap:
      name: app-config
```

挂载后，`/etc/config/` 目录下会生成以 ConfigMap 的 key 命名的文件，文件内容就是对应的 value。

### 4.2 Secret —— 敏感信息的安全管理

Secret 的设计目的和 ConfigMap 类似，但专门用于存储密码、Token、证书等敏感数据。K8s 对 Secret 做了特殊处理：

- Secret 数据在 etcd 中存储时是 **base64 编码**（注意：不是加密！K8s 1.7+ 支持 etcd 静态加密，但默认不开启）
- 只有需要访问该 Secret 的 Pod 才会被 kubelet 挂载到节点上
- 在容器内的内存中，Secret 以 tmpfs（内存文件系统）形式存在，不会写入节点磁盘

**创建 Secret：**

```bash
# 方式一：从键值对创建（value 会自动 base64 编码）
kubectl create secret generic db-secret \
  --from-literal=username=admin \
  --from-literal=password='S3cur3P@ss!'

# 方式二：从文件创建（比如 TLS 证书）
kubectl create secret tls tls-secret \
  --cert=./tls.crt \
  --key=./tls.key

# 方式三：从文件批量创建
kubectl create secret generic app-secret \
  --from-file=./secrets/
```

用 YAML 定义（注意 value 需要手动 base64 编码）：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque          # 通用类型，也可以是 kubernetes.io/tls 等
data:
  # 注意：这里的值必须是 base64 编码后的
  username: YWRtaW4=          # admin
  password: UDNzc3cwcmQ=      # 实际生产中不要用弱密码 :)
stringData:                   # stringData 字段会自动做 base64 编码，更方便
  database: myapp-db
```

> **安全提示**：`stringData` 是 K8s 1.14+ 引入的便利字段，写入明文，K8s 会自动编码为 base64 存入 `data` 字段。但无论哪种方式，etcd 中存储的都是 base64 编码（可逆！），生产环境务必开启 etcd 静态加密，并考虑使用外部密钥管理系统（如 HashiCorp Vault、AWS Secrets Manager）。

**在 Pod 中使用 Secret：**

使用方式和 ConfigMap 几乎一模一样：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-demo
spec:
  containers:
  - name: app
    image: myapp:v1
    env:
    - name: DB_USERNAME
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: username
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: password
    volumeMounts:
    - name: secret-volume
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: secret-volume
    secret:
      secretName: db-secret
```

### 4.3 使用建议与最佳实践

| 场景 | 推荐方式 | 原因 |
|------|---------|------|
| 小型配置、环境变量 | ConfigMap → 环境变量 | 简单直接，应用无需改代码 |
| 配置文件（如 nginx.conf）| ConfigMap → 文件挂载 | 支持热更新（需应用支持） |
| 数据库密码、API Key | Secret → 环境变量或文件挂载 | 避免敏感信息明文存储 |
| TLS 证书 | Secret (type: kubernetes.io/tls) → 文件挂载 | Ingress Controller 标准做法 |
| 大文件配置（>1MB）| 考虑使用外部配置中心（如 Consul、Apollo）| ConfigMap/Secret 有大小限制（1MB） |

### 4.4 与 12-Factor 原则的呼应

回顾第一篇提到的 12-Factor 原则，其中第 III 条就是**配置（Config）**：

> 配置应该存储在环境变量中，与代码严格分离。

ConfigMap 和 Secret 正是这一原则在 K8s 中的落地实现。通过它们，你可以：

- 开发、测试、生产使用同一套镜像，只通过不同的 ConfigMap/Secret 注入不同的配置
- 敏感信息不进入镜像，也不进入代码仓库
- 修改配置无需重新构建镜像

```yaml
# 同一镜像，不同环境，不同配置
# development
kubectl apply -f configmap-dev.yaml -f deployment.yaml

# production
kubectl apply -f configmap-prod.yaml -f deployment.yaml
```

---

## 5、把核心概念串起来：一个完整示例

下面是一个完整的 Nginx 部署示例，包括 Deployment 和 Service：

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.19-alpine
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "200m"
---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
```

部署并验证：

```bash
# 创建
kubectl apply -f deployment.yaml

# 查看 Pod 分布
kubectl get pods -o wide

# 创建 Service
kubectl apply -f service.yaml

# 测试：用临时 Pod 访问 Service
kubectl run test --rm -it --image=busybox -- wget -qO- http://nginx-service
```

你会看到请求被随机分发到 3 个 Nginx Pod 中的一个。

## 小结

Pod、Deployment、Service、ConfigMap、Secret 是 K8s 日常使用中最核心的概念：Pod 是容器运行的封装，Deployment 管理 Pod 的生命周期和副本数量，Service 提供稳定的服务入口，ConfigMap 和 Secret 管理配置与密钥。理解了这些对象的关系和配合方式，K8s 的大门就算完全推开了。

有了 Pod 和 Service，自然要解决它们之间怎么通信的问题。下一篇，我们深入 K8s 的网络模型——CNI、kube-proxy 的工作原理，以及 Pod 之间的通信是怎么实现的。

每天前进一小步，就是一个新的高度！
