---
title: 发布工程（五）：Harbor——容器镜像仓库
author: 唐明
categories: [release]
tags: [Harbor, Docker, 镜像仓库, 容器, K8s]
---

如果你在用 Docker 和 Kubernetes，你一定需要一个靠谱的镜像仓库。Docker Hub 速度慢、有拉取频率限制，不适合作为生产环境的基础设施。而 Harbor 几乎是这个领域的最优选——它不仅是镜像存储，更是一个完整的镜像生命周期管理平台。

<!--以上为摘要内容-->

## 一、Harbor 是什么？

Harbor 是 VMware 开源的企业级容器镜像仓库，现在是 CNCF 的毕业项目。它最核心的定位是：**不只是存镜像，还要管好镜像的安全和分发。**

Harbor 在 Docker Registry 的基础上，增加了几个关键能力：

- **用户与项目管理**：按项目（Project）组织镜像，每个项目可以有独立的成员和角色（管理员、开发者、访客）
- **镜像漏洞扫描**：集成 Trivy 等扫描器，在镜像推送到仓库时自动扫描已知漏洞
- **镜像签名与内容信任**：支持 Notary 方案，确保拉到的镜像确实是你信任的那个
- **镜像复制与同步**：支持在多个 Harbor 实例之间复制镜像（比如从开发环境的 Harbor 同步到生产环境的 Harbor）
- **垃圾回收**：清理未引用的镜像层和已删除的镜像

## 二、安装部署

Harbor 的安装非常直接——官方提供了一个完整的 docker-compose 方案。也支持通过 Helm Chart 部署到 K8s。

### 方式一：Docker Compose（最常用）

```bash
# 下载离线安装包
wget https://github.com/goharbor/harbor/releases/download/v2.10.0/harbor-offline-installer-v2.10.0.tgz
tar -xzf harbor-offline-installer-v2.10.0.tgz
cd harbor

# 复制并编辑配置文件
cp harbor.yml.tmpl harbor.yml
```

`harbor.yml` 的关键配置：

```yaml
hostname: harbor.example.com        # 访问地址

http:
  port: 80

# 如果有 SSL 证书，配 https：
# https:
#   port: 443
#   certificate: /your/certificate/path
#   private_key: /your/private/key/path

harbor_admin_password: Harbor12345  # 管理员初始密码

database:
  password: root123
  max_idle_conns: 100
  max_open_conns: 900

data_volume: /data                  # 数据存储目录
```

```bash
# 准备配置
./prepare

# 安装并启动
./install.sh
```

Harbor 启动后会拉起一组容器，可以通过 `docker-compose ps` 查看。核心组件包括：

| 组件 | 作用 |
|------|------|
| `harbor-core` | 核心 API 层 |
| `nginx` | 前端反向代理 |
| `harbor-jobservice` | 异步任务（镜像扫描、复制） |
| `harbor-db` | PostgreSQL 数据库 |
| `redis` | 缓存和任务队列 |
| `registry` | Docker Registry v2 实例 |
| `trivy-adapter` | 漏洞扫描适配器 |

### 方式二：Helm（K8s 场景）

```bash
helm repo add harbor https://helm.goharbor.io
helm install harbor harbor/harbor \
  --set expose.type=nodePort \
  --set externalURL=https://harbor.example.com \
  --set harborAdminPassword=Harbor12345
```

Helm 方式适合团队里已经有 K8s 集群的情况，运维成本更低——Harbor 本身也作为 K8s 上的一个 workload 运行。

## 三、核心操作

### 推送与拉取镜像

```bash
# 登录 Harbor
docker login harbor.example.com

# 给镜像打上 Harbor 的标签
docker tag my-app:1.0.0 harbor.example.com/my-project/my-app:1.0.0

# 推送
docker push harbor.example.com/my-project/my-app:1.0.0

# 拉取
docker pull harbor.example.com/my-project/my-app:1.0.0
```

这里 `my-project` 是 Harbor 里的项目（Project），需要在 Harbor UI 中先创建。项目是镜像的命名空间，也是权限管理的粒度。

### 访问控制

Harbor 的权限模型是“用户 → 项目 → 角色”：

| 角色 | 权限 |
|------|------|
| 项目管理员 | 管理成员、配置项目、删除镜像 |
| 维护者 | 推送、拉取、扫描镜像 |
| 开发者 | 推送、拉取镜像 |
| 访客 | 仅拉取镜像 |

对于生产环境，建议：CI 流水线使用机器人账户（Robot Account），拥有“开发者”权限以推送镜像；K8s 集群使用只读账户，拥有“访客”权限以拉取镜像。不建议用管理员账户来做日常 CI/CD 操作。

### 漏洞扫描

Harbor 可以在镜像推送时触发自动扫描，也可以手动扫描已有镜像。

```bash
# 在项目设置中开启"自动扫描镜像"
# 或者在 Harbor UI 中手动触发扫描
```

扫描结果会展示每个镜像的具体漏洞列表，按严重程度（Critical/High/Medium/Low）分级，并提供 CVE 编号供参考。

你还可以设置漏洞策略：比如“存在任何 Critical 或 High 漏洞的镜像禁止拉取”，这是一个非常实用的安全门禁。

## 四、镜像复制与分发

如果团队有多地部署的需求（比如北京开发、上海生产），Harbor 的复制功能可以在多个实例之间同步镜像。

在管理员的 `Replications` 页面创建复制规则：

- **源**：当前 Harbor 实例
- **目标**：另一个 Harbor 实例的地址和认证信息
- **触发方式**：手动、定时（按 cron 表达式）、事件驱动（镜像推送后自动复制）
- **过滤器**：可以指定只同步某些项目或某些 Tag 的镜像

有了复制，你的镜像不需要直接暴露给生产环境去拉——在开发环境的 Harbor 上推送，配置自动复制到生产 Harbor，生产环境的 K8s 只需要访问生产 Harbor 即可。

## 五、垃圾回收

Docker Registry 的特性之一是：删除镜像 Tag 只是移除了对镜像层的引用，但数据还占着磁盘。Harbor 提供了垃圾回收（GC）来清理这些无引用的数据。

GC 是一个**只读暂停**的操作——它需要一个全局的写锁，意味着 Garbage Collection 正在运行的时候不能推送镜像。所以建议在低峰期手动执行：

```bash
# 在 Harbor UI 的 System → Garbage Collection 中手动触发
# 或者用命令行
docker exec -it harbor-jobservice harbor gc
```

建议配合“定期清理旧 Tag”的策略一起使用：先删除不需要的 Tag，再执行 GC 回收磁盘。

## 六、小结

Harbor 的定位很清晰：它就是为容器镜像而生。如果你团队的核心技术栈是 Docker + K8s，Harbor 几乎是不二之选——它的镜像扫描、权限管理、复制分发都是围绕容器场景深度设计的。

但如果你除了 Docker 镜像，还有很多其他格式的制品要管理（Java JAR、npm 包、PyPI 包、Helm Chart），并且希望用一个统一的平台来管，那 Nexus 或 Artifactory 会是更好的方向。下一篇我们聊聊 JFrog Artifactory——这个被很多人称为“制品管理领域的旗舰”。

每天前进一小步，就是一个新的高度！
