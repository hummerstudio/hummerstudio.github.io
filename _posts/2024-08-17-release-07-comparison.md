---
title: 发布工程（七）：选型对比与制品清理策略
author: 唐明
categories: [release]
tags: [制品管理, Nexus, Harbor, Artifactory, 选型对比]
---

前面三篇分别聊了 Nexus、Harbor 和 JFrog Artifactory。你可能已经注意到，它们三个的重叠地带并不大——各有各的主战场。但这不意味着选型就很轻松。除了工具本身的特性，你还需要考虑团队的规模、技术栈的构成、预算的约束、以及最重要的——**制品清理策略**。没有清理策略的制品仓库，就像一个从不倒垃圾的厨房。

<!--以上为摘要内容-->

## 一、三者的定位差异

先从定位出发，一句话总结每个工具的基因：

- **Nexus**：Java 生态的“默认私服”，开箱即用，后来扩展到多格式
- **Harbor**：容器镜像的“安全管家”，深度绑定 Docker/K8s 生态
- **Artifactory**：企业级的“全能制品平台”，什么格式都能管，而且要管得细

这三个工具不是“三选一”的关系。很多企业实际上同时跑着 Harbor（管镜像）+ Nexus 或 Artifactory（管 Maven/npm/PyPI）。甚至 Harbor + Artifactory 的组合也不少见——Artifactory 也能管 Docker 镜像，但 Harbor 在镜像扫描和 K8s 集成上做得更好。

## 二、全面对比

### 功能与生态

| 维度 | Nexus OSS | Nexus Pro | Harbor | Artifactory |
|------|-----------|-----------|--------|-------------|
| 包格式 | Maven, npm, Docker, PyPI, NuGet, RubyGems, Go, Yum, APT, Helm, Raw 等 | 同 OSS + R 等 | Docker, Helm, OCI | 30+ 格式全覆盖 |
| 用户管理 | 内置用户系统 | 内置 + LDAP/SAML | 内置 + LDAP/OIDC | 内置 + LDAP/SAML/OAuth |
| 权限粒度 | 仓库级 | 仓库级 | 项目级 | 仓库 + 路径模式 |
| 镜像扫描 | 不支持 | IQ Server 集成 | 内置 Trivy | Xray 产品 |
| 多实例复制 | 不支持 | 支持 | 支持 | 支持 |
| HA 高可用 | 不支持 | 基本支持 | 支持 | 成熟方案 |
| CI 集成 | REST API | REST API | REST API | Build Info + 插件生态 |
| REST API | 有 | 有 | 有 | 有（最丰富） |

### 运维复杂度

| 维度 | Nexus | Harbor | Artifactory |
|------|-------|--------|-------------|
| 安装方式 | tar.gz 解压 | docker-compose / Helm | tar.gz / Docker / Helm / K8s Operator |
| 日常维护 | 低（基本不需要太多关注） | 中（需要升级组件、关注容器健康） | 中到高（配置项多，企业功能多） |
| 升级体验 | 简单（替换程序文件即可） | 中等（follow 官方 upgrade guide） | 中等（HA 集群升级需要按步骤来） |
| 监控方案 | JMX / Prometheus exporter | Prometheus 指标暴露 | Prometheus / JMX / 自带 Metrics |

### 适用团队规模

| 工具 | 最佳团队规模 | 典型场景 |
|------|-------------|----------|
| Nexus OSS | 1-50 人 | Java 为主的初创/中小团队，求简单 |
| Nexus Pro | 50-200 人 | 中型团队，需要多格式和基本企业特性 |
| Harbor | 不限 | 任何规模，只要用 Docker/K8s |
| Artifactory | 100+ 人 | 大型企业，多格式、多团队、高合规要求 |

## 三、选型决策树

按下面的顺序问自己，通常能找到答案：

```
1. 你的主要制品格式是什么？
   ├─ Docker 镜像为主 → Harbor（镜像安全扫描是刚需）
   ├─ Java Maven/Gradle 为主 → 看第 2 步
   └─ 多格式混合（Java + npm + Docker + Python...）→ 看第 3 步

2. Java 为主，需要哪些企业特性？
   ├─ 只需要代理和托管 → Nexus OSS（免费够用）
   ├─ 需要 HA / LDAP / 多格式 → Nexus Pro
   └─ 需要 Build Info / 路径级权限 / 企业合规 → Artifactory

3. 多格式混合，团队规模和预算？
   ├─ 50 人以下，预算有限 → Nexus OSS + Harbor（Maven/Docker 分开管）
   ├─ 50-200 人，有采购预算 → Nexus Pro
   └─ 200 人以上，预算充裕 → Artifactory（可能 + Harbor 管镜像）
```

**一个值得注意的现实**：很多团队最终选择了“两件套”甚至“三件套”——不是因为任何一个工具不够好，而是因为不同格式的制品确实有不同的管理需求。Docker 镜像的漏洞扫描和分发，和 Maven JAR 包的代理缓存，本质上就不是同一类需求，没有一个工具能在所有维度上都做到第一。

## 四、制品清理策略：不管你用什么工具

这是最常见也最被忽视的问题。制品仓库是典型的“只进不出”系统——每天几十次 CI 推送上百个制品，很快就会吃光磁盘。清理策略的设计必须提前想好，否则等磁盘满了再清理，就是一个痛苦的周末加班。

### 核心原则

**发行版（Release）应该保留，但不是每个版本都值得永久保留。** 极端情况下你可能需要回滚到一年前的某个版本，但不需要保留三年来的每一个小版本。

**快照版（Snapshot/Maven）/开发版（Docker 的 dev tag）应该主动清理。** 它们的定位就是“中间态”，保留最近 5-10 个构建就足够了。

### Nexus 清理配置

Nexus 的清理策略在 `Settings → Cleanup Policies` 中配置：

| 策略 | 配置 |
|------|------|
| 清理旧快照 | Format: maven2，Component age > 30 days，Release type: Snapshot |
| 清理未使用的制品 | Component usage < 1 download in 90 days |
| Docker 旧 Tag | Format: docker，保留最近 10 个 Tag |

### Harbor 清理配置

Harbor 的清理在项目的 `Tag Retention` 策略中配置：

```yaml
# 保留策略示例
- 保留最近推送的 10 个 Tag
- 保留所有匹配 "release-*" 的 Tag（生产版本不自动删）
- 删除 30 天前推送的 "dev-*" 和 "feature-*" Tag
```

配合 Garbage Collection 才能真正释放磁盘空间。建议每月执行一次 GC。

### Artifactory 清理配置

Artifactory 用 AQL（Artifactory Query Language）来定义清理规则，比 Nexus 和 Harbor 更灵活：

```aql
# 删除 90 天前创建且未被下载过的快照制品
items.find(
    {"repo": "maven-snapshot-local"},
    {"created": {"$before": "90d"}},
    {"stat.downloaded": {"$before": "90d"}}
)
```

可以在 Artifactory 的 `User Plugins` 中编写 Groovy 脚本，定时执行 AQL 清理。

### 通用清理策略模板

不管用什么工具，可以套用这个模板：

| 制品类型 | 保留策略 | 说明 |
|----------|----------|------|
| 生产发行版 | 所有版本永久保留 | 合规要求，出问题时需要回滚到任意版本 |
| 非生产发行版 | 最新 3 个 MAJOR 版本的最近 5 个 MINOR | 用户不需要太老的次版本 |
| 快照/开发版 | 保留最近 10 个构建，30 天以上删除 | 中间态不保留太久 |
| Docker 镜像 | 生产 Tag 永久保留，dev/feature Tag 保留最近 5 个 | 镜像比 JAR 大得多，清理更要积极 |

## 五、小结

发布工程的终点不是“把制品丢进仓库”，而是“在任何时候都能找到你需要的那个版本”。选型决定了你用什么工具来实现这个目标，清理策略决定了这个系统能不能长期健康运转。

到这里，整个发布工程系列就结束了。从“什么是发布”到版本号规范、从变更日志到三个主流制品仓库，我们走完了一个完整闭环。DevOps 回环里，“发布”这个环节的空白，希望这个系列帮你补上了。

每天前进一小步，就是一个新的高度！
