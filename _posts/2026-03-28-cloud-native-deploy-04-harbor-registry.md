---
title: 云原生部署（四）：容器镜像仓库——Docker Hub 与 Harbor 私服
author: 唐明
categories: [deploy]
tags: [Docker, Harbor, 镜像仓库, Registry, 私有仓库, 容器镜像]
---

镜像构建出来了，放哪？直接推到 Docker Hub 上？如果你在公司做 DevOps，答案大概率是否定的。公司的代码、尤其是包含业务逻辑的镜像，不可能直接放到公共网络上。你需要一个私有镜像仓库。而这，就是 Harbor 的用武之地。

<!--以上为摘要内容-->

## 1、为什么不能只用 Docker Hub？

Docker Hub 是 Docker 官方的公共镜像仓库，类似于 GitHub。你可以在上面找到几乎所有的官方镜像和无数社区镜像，免费用户也能上传自己的镜像。

但在企业环境里，直接用 Docker Hub 有几个硬伤：

- **安全问题**：公司内部的镜像含有业务代码和配置，推到公网是不可接受的。
- **网络问题**：Docker Hub 的服务器在海外，在国内拉镜像奇慢无比。几十个节点同时拉一个几百 MB 的镜像，运维要等哭。
- **管理问题**：团队多了，谁都能推镜像、版本满天飞、没有统一的扫描和策略，迟早出事故。
- **合规问题**：很多行业（金融、政府）要求数据不出内网，镜像仓库也不例外。

所以，但凡正经做 DevOps 的团队，都需要一个**私有镜像仓库**。

## 2、Docker Registry —— 最基础的私服方案

Docker 官方提供了一个最轻量的镜像仓库实现，就叫 Registry。部署极其简单：

```bash
docker run -d -p 5000:5000 --name registry registry:2
```

然后就能用了：

```bash
docker tag myapp:latest localhost:5000/myapp:latest
docker push localhost:5000/myapp:latest
docker pull localhost:5000/myapp:latest
```

但说实话，Registry 的功能太简陋了：

- 没有 Web 界面，想看看有哪些镜像？没有。
- 没有权限控制，谁都能推谁都能拉。
- 没有镜像扫描，不知道镜像有没有漏洞。
- 没有垃圾回收，删掉的镜像可能还占着磁盘。
- 没有镜像复制，多数据中心之间同步镜像得自己搞。

所以 Registry 适合本地开发和测试，生产环境基本不用。

## 3、Harbor —— 企业级镜像仓库

Harbor 是 VMware 开源的企业级镜像仓库，后来捐给了 CNCF。它扩展了 Docker Registry，补上了企业在安全、管理、高可用等方面缺失的所有能力。

### Harbor 的核心能力

| 能力 | 说明 |
|------|------|
| **Web 管理界面** | 图形化管理项目、镜像、成员权限 |
| **基于项目的 RBAC** | 不同项目分配不同的读写权限 |
| **镜像漏洞扫描** | 集成 Trivy/Clair，自动扫描镜像 CVE 漏洞 |
| **镜像签名** | 集成 Notary，对镜像进行数字签名，防篡改 |
| **镜像复制** | 跨数据中心同步镜像，支持推送和拉取两种模式 |
| **垃圾回收** | 真正删除不再引用的层，释放磁盘空间 |
| **镜像策略** | 按规则自动清理旧镜像，比如"保留最近 10 个版本" |
| **Helm Chart 托管** | Harbor 不仅能存镜像，还能存 Helm Chart |
| **OIDC/LDAP 集成** | 对接企业已有的认证体系 |

### Harbor 的架构

Harbor 不是一个简单的单体应用，它由多个组件构成：

```
浏览器/CLI → Nginx（反向代理）→ Harbor Core（主服务）
                                    ├── Registry（镜像存储）
                                    ├── Database（PostgreSQL）
                                    ├── Redis（缓存）
                                    ├── Trivy（漏洞扫描）
                                    └── Job Service（后台任务）
```

- **Nginx**：前面挡一个反向代理，处理 HTTPS 和请求路由。
- **Harbor Core**：主要业务逻辑，处理 API 请求、权限校验等。
- **Registry**：底层还是 Docker 官方的 Registry 组件，负责真正的镜像存储。
- **PostgreSQL**：存储 Harbor 自己的元数据（项目、用户、策略等）。
- **Trivy**：漏洞扫描引擎，Harbor 2.x 版开始默认使用 Trivy。
- **Job Service**：异步任务队列，处理镜像扫描、复制等耗时的后台任务。

### 部署 Harbor

Harbor 提供了两种部署方式：在线安装包和离线安装包。国内建议用离线安装包。

```bash
# 1. 下载离线安装包
wget https://github.com/goharbor/harbor/releases/download/v2.11.0/harbor-offline-installer-v2.11.0.tgz
tar xzf harbor-offline-installer-v2.11.0.tgz
cd harbor

# 2. 配置 harbor.yml
cp harbor.yml.tmpl harbor.yml
vim harbor.yml
```

`harbor.yml` 中的关键配置：

```yaml
hostname: harbor.yourcompany.com   # 访问域名或 IP
http:
  port: 80                         # HTTP 端口

# 如果要用 HTTPS（生产必须）：
# https:
#   port: 443
#   certificate: /your/cert/path
#   private_key: /your/key/path

harbor_admin_password: Harbor12345 # 管理员初始密码（记得改）

database:
  password: root123
  max_idle_conns: 50
  max_open_conns: 1000

data_volume: /data                 # 数据存储路径
```

配置好后，一行命令安装：

```bash
# 安装（含 Trivy 扫描器）
sudo ./install.sh --with-trivy
```

安装完成后，访问 `http://harbor.yourcompany.com`，用 `admin` 账号登录，就能看到 Harbor 的管理界面了。

### 日常使用

**创建项目**：在 Harbor Web 界面创建一个项目（如 `backend`），设置该项目为"私有"。

**推送镜像**：

```bash
# 登录 Harbor
docker login harbor.yourcompany.com

# 打标签
docker tag myapp:v1.0 harbor.yourcompany.com/backend/myapp:v1.0

# 推送
docker push harbor.yourcompany.com/backend/myapp:v1.0
```

**在 CI 流水线中使用**：

```groovy
// Jenkins Pipeline
stage('Push Image') {
    steps {
        sh '''
            docker login harbor.yourcompany.com -u ${HARBOR_USER} -p ${HARBOR_PASS}
            docker build -t harbor.yourcompany.com/backend/myapp:${BUILD_NUMBER} .
            docker push harbor.yourcompany.com/backend/myapp:${BUILD_NUMBER}
        '''
    }
}
```

## 4、镜像命名与 Tag 策略

有仓库以后，镜像怎么命名和打 Tag 就成了需要统一规范的事情。

### 镜像名称规范

推荐格式：`<registry>/<project>/<service>:<tag>`

```
harbor.yourcompany.com/backend/user-service:v1.2.3
harbor.yourcompany.com/backend/order-service:v1.2.3
harbor.yourcompany.com/backend/gateway:v1.2.3
```

### Tag 策略

别只用 `latest`。`latest` 在本地开发还行，到了团队协作和生产环境就是定时炸弹——你永远不知道 `latest` 到底对应哪个版本的代码。

推荐的 Tag 策略：

| Tag | 含义 | 示例 |
|-----|------|------|
| 版本号（核心） | 精确对应 Git Tag | `v1.2.3` |
| 构建号 | 每次 CI 触发的编号 | `build-1287` |
| 分支名 | 对应 Git 分支 | `develop`、`feature-xxx` |
| 环境 | 区分部署环境 | `prod-20200627` |

一个成熟的 CI 流水线通常在一次构建中打多个 Tag：

```bash
docker build -t harbor.yourcompany.com/backend/myapp:${VERSION} .
docker tag harbor.yourcompany.com/backend/myapp:${VERSION} harbor.yourcompany.com/backend/myapp:build-${BUILD_NUMBER}
docker tag harbor.yourcompany.com/backend/myapp:${VERSION} harbor.yourcompany.com/backend/myapp:latest
```

### 镜像清理策略

镜像会越积越多。一次构建一个镜像，大的项目可能一天就上百个，硬盘迟早撑爆。Harbor 提供了自动清理策略：

- **保留最近 N 个 Tag**：比如只保留每个镜像最近 10 个版本。
- **按天数清理**：删除 N 天前构建的、未被使用的镜像。
- **按 Tag 规则清理**：删除所有 `build-*` 开头的旧 Tag。

在 Harbor 的项目设置中配置"Tag Retention Rules"即可。

## 5、Harbor 在生产中的几个注意点

### 一定要配 HTTPS

在开发环境用 HTTP 凑合一下还行，生产环境必须上 HTTPS。Docker 默认要求 Registry 走 HTTPS（`localhost` 除外），否则每次推送和拉取都要额外配置 `insecure-registries`。

### 备份数据库

Harbor 的核心元数据都在 PostgreSQL 里。如果数据库丢了，虽然镜像文件还在，但所有项目、用户、权限、策略都丢了，基本等于恢复不了。务必定时备份 PostgreSQL。

### 磁盘空间监控

镜像的层虽然可以共享，但团队人多、项目多，磁盘消耗会很快。建议：

- 配好镜像清理策略。
- 定期执行垃圾回收：Harbor 的"删除"操作只是标记，真正删除需要手动触发 GC。
- 监控磁盘使用率，提前扩容。

## 小结

私有镜像仓库是 DevOps 的基础设施，就像代码有 Git 仓库一样，镜像也应该有自己的"家"。Harbor 是目前最成熟的开源选择，它的漏洞扫描、权限管理、镜像复制等功能，覆盖了企业场景下的核心需求。

下一篇，我们进入云原生部署的核心——Kubernetes 的架构，看看这个"容器编排之王"到底是怎样运作的。

每天前进一小步，就是一个新的高度！
