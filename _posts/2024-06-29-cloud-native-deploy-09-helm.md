---
title: 云原生部署（九）：K8s 包管理——Helm 从入门到实战
author: 唐明
categories: [deploy]
tags: [Kubernetes, Helm, 包管理, Chart, 模板化部署, K8s 部署]
---

如果你部署一个稍微复杂一点的应用（比如一个微服务 + MySQL + Redis + Nginx），YAML 文件会多到你怀疑人生。而且不同环境的配置（开发、测试、生产）各有不同，难道要维护三套 YAML？Helm 就是来解决这个痛苦——它被称为 “K8s 的 apt/yum”。

<!--以上为摘要内容-->

## 1、Helm 解决了什么问题？

先看一个没有 Helm 的日常场景。

你要部署一个应用，需要写：
- 一个 Deployment YAML（应用本身）
- 一个 Service YAML（暴露端口）
- 一个 ConfigMap YAML（配置）
- 一个 PVC YAML（存储）
- 可能还有 Ingress、Secret、HPA……

开发环境一套，测试环境一套，生产环境一套。三个环境下来，光是 YAML 文件就十几个。而且环境之间的区别可能只是几个值（镜像 Tag、副本数、数据库地址），但因为 YAML 是静态的，你不得不维护多套几乎一样的文件。

**Helm 做了一件事：把 YAML 模板化。** 你写一份模板（Chart），通过不同的 `values.yaml` 注入不同的参数，生成适配不同环境的最终 YAML。

用 Linux 的类比来理解：

| Linux | Kubernetes |
|-------|-----------|
| 软件包（deb/rpm） | Helm Chart |
| apt/yum | Helm CLI |
| 软件源（/etc/apt/sources.list） | Helm Repository |
| 配置文件（/etc/nginx/nginx.conf） | values.yaml |

## 2、Helm 2 vs Helm 3 —— 架构巨变

如果你在网上搜 Helm 的资料，要注意区分版本——Helm 2 和 Helm 3 的架构变化很大。

### Helm 2 的架构（已经过时）

在 Helm 2 中，有一个叫 **Tiller** 的组件，它常驻在 K8s 集群里：

```
helm CLI → Tiller（在 K8s 集群内）→ API Server
```

Tiller 负责接收 `helm` 命令，管理 Release 的安装、升级、回滚。但它有一个致命问题：**Tiller 拥有集群管理员级别的权限**。这意味着任何一个能调用 Tiller 的人，都有能力对集群做任何操作。安全问题非常严重。

### Helm 3 的架构（现在推荐）

Helm 3 彻底移除了 Tiller：

```
helm CLI → API Server
```

`helm` 命令行直接和 API Server 通信，权限完全取决于执行者本地的 kubeconfig 配置。你有多大的 `kubectl` 权限，`helm` 就有多大的权限。安全、简洁。

此外 Helm 3 还废弃了 Helm 2 的 `requirements.yaml`，改用 Chart 内直接声明依赖。更多细节可以查阅官方迁移指南。

## 3、Chart —— Helm 的应用包

Helm 的包叫做 **Chart**，它是一组有固定目录结构的文件。

### Chart 目录结构

```
myapp/
├── Chart.yaml            # Chart 元信息
├── values.yaml           # 默认配置值
├── charts/               # 依赖的子 Chart
├── templates/            # 模板文件（最核心）
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── _helpers.tpl      # 模板辅助函数
│   └── NOTES.txt         # 安装后显示的提示
└── .helmignore
```

**`Chart.yaml`** —— Chart 的“身份证”：

```yaml
apiVersion: v2                  # Helm 3 用 v2
name: myapp                     # Chart 名称
version: 1.0.0                  # Chart 版本
appVersion: "2.1.0"             # 应用的版本
description: My Application Chart
type: application
```

**`values.yaml`** —— 默认配置值，提供模板变量的默认值：

```yaml
replicaCount: 3

image:
  repository: harbor.yourcompany.com/backend/myapp
  tag: "2.1.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80
  targetPort: 8080

resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"

env:
  DB_HOST: mysql-service
  DB_PORT: "3306"
```

**`templates/`** —— 模板文件，用 Go 模板语法（`{{ }}`）引用 `values.yaml` 中的值。

### Chart 如何工作？

Helm 的工作流程简化为：

```
Chart（模板）+ values.yaml（数据） → 渲染 → 标准 K8s YAML → 提交到 API Server
```

你不是直接写 Pod/Service/Deployment 的 YAML，而是写它们的**模板**。`helm install` 时 Helm 会把模板和 values 结合，渲染出最终的 YAML，然后提交给 K8s。

## 4、从零搭建一个 Chart

假设我们有一个 Java 应用 `myapp`，需要 Deployment + Service + ConfigMap。

### 步骤 1：创建 Chart 骨架

```bash
helm create myapp
```

这会生成一套默认的文件，我们删掉不需要的（默认的是 Nginx 模板），保留核心结构。

### 步骤 2：写 Deployment 模板

`templates/deployment.yaml`：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    app: {{ include "myapp.name" . }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ include "myapp.name" . }}
  template:
    metadata:
      labels:
        app: {{ include "myapp.name" . }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - containerPort: {{ .Values.service.targetPort }}
        env:
        {{- range .Values.env }}
        - name: {{ .name }}
          value: {{ .value | quote }}
        {{- end }}
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
```

### 步骤 3：写 Service 模板

`templates/service.yaml`：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "myapp.fullname" . }}
spec:
  type: {{ .Values.service.type }}
  selector:
    app: {{ include "myapp.name" . }}
  ports:
  - port: {{ .Values.service.port }}
    targetPort: {{ .Values.service.targetPort }}
```

### 步骤 4：写 ConfigMap 模板

`templates/configmap.yaml`：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "myapp.fullname" . }}-config
data:
  application.properties: |
    server.port={{ .Values.service.targetPort }}
    spring.datasource.url=jdbc:mysql://{{ .Values.env.DB_HOST }}:{{ .Values.env.DB_PORT }}/mydb
```

### 步骤 5：验证和安装

```bash
# 验证渲染结果（不实际安装）
helm install --dry-run --debug myapp ./myapp

# 实际安装
helm install myapp ./myapp

# 查看安装上了什么
helm list
kubectl get all -l app=myapp
```

### 多环境部署

同一个 Chart，通过不同的 `values` 文件适配不同环境：

```bash
# 开发环境
helm install myapp-dev ./myapp -f values-dev.yaml

# 生产环境
helm install myapp-prod ./myapp -f values-prod.yaml
```

`values-dev.yaml` 和 `values-prod.yaml` 只需要覆盖和默认值不同的部分：

```yaml
# values-prod.yaml
replicaCount: 10
image:
  tag: "2.1.0"
resources:
  requests:
    memory: "1Gi"
    cpu: "1000m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

## 5、Helm 的常用操作

```bash
# 查看已安装的 Release
helm list

# 查看 Release 详情
helm status myapp
helm get values myapp       # 查看安装时用的 values
helm get manifest myapp     # 查看渲染出的完整 YAML

# 升级
helm upgrade myapp ./myapp -f values-prod.yaml

# 回滚
helm rollback myapp 1       # 回滚到版本 1

# 查看历史
helm history myapp

# 删除
helm uninstall myapp

# 添加远程仓库（Bitnami 是目前最常用的公共 Helm 仓库）
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# 搜索仓库中的 Chart
helm search repo nginx

# 也可以从 Artifact Hub（artifacthub.io）搜索和发现更多 Chart
```

### 模板语法速查

Go 模板语法有点“反直觉”，这里列出最常用的几个：

| 语法 | 用途 | 示例 |
|------|------|------|
| `{{ .Values.xxx }}` | 引用 values 中的值 | `{{ .Values.image.tag }}` |
| `{{ .Release.Name }}` | 引用 Release 名 | `{{ .Release.Name }}` |
| `{{ include "tpl" . }}` | 调用 `_helpers.tpl` 中定义的模板 | `{{ include "myapp.fullname" . }}` |
| `{{ .Values.xxx \| quote }}` | 管道 + 加引号 | `version: {{ .Values.tag \| quote }}` |
| `{{- toYaml .Values.xxx \| nindent 8 }}` | 转 YAML + 缩进 | 用于复杂对象 |
| `{{ default "8080" .Values.port }}` | 默认值 | 端口没配则用 8080 |
| `{{ if .Values.enabled }}...{{ end }}` | 条件渲染 | 按开关决定是否生成某段 |

## 6、Helm 与 CI/CD 的结合

在 Jenkins Pipeline 中，Helm 让部署变得极其简洁：

```groovy
stage('Deploy to K8s') {
    steps {
        sh '''
            helm upgrade --install myapp ./helm/myapp \
                --namespace production \
                --set image.tag=${BUILD_NUMBER} \
                --wait \
                --timeout 5m
        '''
    }
}
```

`--wait` 会等待 Pod 全部就绪才返回。`--timeout` 防止卡死。

## 小结

Helm 的核心价值就是把 K8s 的 YAML 从“静态文件”变成了“可模板化的包”。它让部署变得像 `apt install` 一样简单，让多环境管理不再需要维护一堆重复的 YAML。

Chart 写好、values 配好、Helm 命令一敲——部署完成。下一篇，也是本系列的最后一篇，我们聊聊生产部署中最关键的两个概念：健康检查和滚动更新，让部署做到真正的零停机。

每天前进一小步，就是一个新的高度！
