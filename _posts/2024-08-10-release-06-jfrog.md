---
title: 发布工程（六）：JFrog Artifactory——企业级制品管理
author: 唐明
categories: [release]
tags: [JFrog, Artifactory, 制品管理, CI/CD, DevOps]
---

如果说 Nexus 是“够用的私服”，Harbor 是“专业的容器镜像仓库”，那么 JFrog Artifactory 就是“想把所有格式的制品都管好的企业级平台”。它不便宜，但很多上了规模的企业选择它，原因也很简单：Nexus 搞不定的事情，它搞定了。

<!--以上为摘要内容-->

## 一、JFrog 平台全景

JFrog 不只是一个制品仓库。它是一个围绕制品构建的平台生态，核心产品包括：

| 产品 | 定位 |
|------|------|
| **Artifactory** | 核心制品仓库，支持 30+ 包格式 |
| **Xray** | 制品漏洞扫描与许可证合规分析 |
| **Pipelines** | CI/CD 流水线（与 Jenkins 竞争） |
| **Distribution** | 制品分发与边缘节点加速 |
| **Mission Control** | 多实例管理与全局视图 |

但对大多数团队来说，入口就是 Artifactory——先搞定制品管理，其他的按需扩展。

## 二、多格式支持：一个仓库管所有

Artifactory 最核心的卖点是**对制品格式的广度**。它原生支持的包类型包括：

- **Java**：Maven、Gradle、Ivy
- **容器**：Docker、Helm
- **前端**：npm、Bower
- **Python**：PyPI、Conda
- **Go**：Go Modules
- **CI**：Conan（C/C++）、NuGet（.NET）
- **通用**：Generic（任意文件，比如 zip、tar.gz）

支持 30 多种格式意味着：你不需要为 Maven 装一个 Nexus、为 Docker 装一个 Harbor、为 npm 装一个 Verdaccio——一个 Artifactory 全部搞定。

每种格式的配置方式都类似：创建本地仓库（Local Repository）、远程仓库（Remote Repository，代理外部源）、虚拟仓库（Virtual Repository，聚合多个仓库），然后配置客户端指向虚拟仓库即可。

## 三、权限模型：细粒度到你想要的程度

Nexus 的权限模型比较粗（基本上是仓库级别的读/写），Harbor 的权限按项目划分（但没有仓库级别的继承），Artifactory 的权限模型则细致得多。

**Artifactory 的权限结构**：

```
用户（User）
  ↓ 属于
用户组（Group）
  ↓ 分配到
权限目标（Permission Target）
  → 仓库（Repositories）：哪些仓库
  → 路径模式（Includes/Excludes Pattern）：仓库内的哪些路径
  → 操作（Actions）：读、写、删除、管理
```

举个例子，你可以设这样一条权限规则：

> “QA 团队可以读取 `docker-release-local` 仓库中 `*/stable/*` 路径下的所有镜像，但不能写入或删除。”

或者：

> “前端团队可以在 `npm-local` 仓库中发布 `@mycompany/*` scope 的包，但不能发布其他 scope。”

这种粒度在企业场景下非常实用。团队多了，你不能给每个团队都开仓库级别的完全访问——那样很容易出现“前端团队不小心覆盖了后端团队的包”这种事故。

## 四、与 CI 工具的深度集成

Artifactory 和 Jenkins、GitHub Actions、GitLab CI 等主流 CI 工具都有深度集成。这不是简单的“配个密码就能上传”，而是把制品管理嵌入到流水线的每一个步骤里。

**Artifactory Plugin for Jenkins** 是最典型的例子：

```groovy
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                // Artifactory 提供的 Maven 构建步骤
                rtMavenRun(
                    tool: 'maven-3',
                    pom: 'pom.xml',
                    goals: 'clean deploy',
                    // Artifactory 会自动解析 pom 文件，上传制品，
                    // 并收集构建信息（Build Info）
                    resolverId: 'maven-resolver',
                    deployerId: 'maven-deployer'
                )
            }
        }
        stage('Publish Build Info') {
            steps {
                // 发布 Build Info 到 Artifactory
                rtPublishBuildInfo(
                    serverId: 'artifactory-server'
                )
            }
        }
    }
}
```

**Build Info** 是 Artifactory 的一个特色功能。它会在构建过程中收集以下信息：

- 这个构建产出了哪些制品
- 用了哪些依赖（包括具体版本和 SHA）
- 构建环境参数（JDK 版本、操作系统、构建工具版本）
- 触发的 Git 提交信息和作者

这套信息一旦记录在 Artifactory 中，你就有了完整的可追溯链路：任何一个制品都能追溯到它的构建、它的依赖、它的代码变更。这在合规审计和安全排查时极其有用。

## 五、高可用架构

当制品仓库的可靠性直接影响业务时（推送不上去 → CI 流水线卡住 → 发布受阻），HA 就从“Nice to have”变成了“Must have”。

Artifactory 的高可用架构核心是：

```
         Load Balancer
            /    \
    Node 1        Node 2
         \    /
    Shared Storage (NFS / S3 / GCS)
              |
    External Database (PostgreSQL / Oracle / MySQL)
```

- **多节点**：两个或更多 Artifactory 实例组成集群，使用同一个共享存储和数据库
- **负载均衡**：前端由 Nginx/HAProxy 分发请求
- **共享存储**：所有节点共享同一份二进制制品数据（存在 NFS 或对象存储上）
- **数据库**：元数据统一存储在外部数据库中，所有节点共享

设置 Artifactory HA 时，许可证需要支持集群。JFrog 的商业许可证按“节点数”和“包格式种类”分层定价——HA 至少需要 2 个节点的许可证。

Harbor 和 Nexus 也支持 HA，但在方案成熟度和企业支持方面，Artifactory 的 HA 配置是最省心的——大部分场景下，改几行 `system.yaml` 就能跑起来。

## 六、Nexus Pro 和 Artifactory 怎么选？

很多人纠结“NXRM Pro（Nexus Repository Manager Pro）还是 Artifactory”。它们的核心区别：

| 维度 | Nexus Pro | Artifactory |
|------|-----------|-------------|
| 包格式数量 | ~20+ | 30+ |
| 权限粒度 | 仓库级 | 仓库 + 路径模式 |
| CI 集成 | 基础支持 | Build Info 深度集成 |
| HA 企业级 | 基本支持 | 成熟方案 |
| 漏洞扫描 | 基础（IQ Server） | Xray 独立产品 |
| 定价 | 相对友好 | 偏贵 |
| 学习曲线 | 低 | 中高 |

**一个简单的选型思路**：如果你是中小团队、Java 为主、不需要极细的权限控制和深度的 CI 集成，Nexus 就够用。如果你是大型企业、包格式多样化、需要完整的制品可追溯链和严格的安全合规审查，Artifactory 值得额外投入。

## 七、小结

Artifactory 不是那种“装上就能用”的工具——它的复杂度对应的是它提供的灵活性。一个几十人的团队可能不需要它，但几百人的团队会发现：当制品数量、格式种类、权限需求、合规要求同时增长到一定规模之后，Artifactory 提供的治理能力就会从“过度设计”变成“必需品”。

到这里，三个主要的制品仓库方案都聊完了。下一篇，我们来做一个系统的横向对比，并聊聊制品清理这件事——不管你用哪个工具，这都是绕不开的。

每天前进一小步，就是一个新的高度！
