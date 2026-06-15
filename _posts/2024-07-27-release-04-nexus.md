---
title: 发布工程（四）：Nexus——Java 私服与通用制品库
author: 唐明
categories: [release]
tags: [Nexus, Maven, 制品库, Java, 私服]
---

说到制品仓库，Java 开发者最先想到的几乎一定是 Nexus。这不奇怪——从 Maven Central 的代理缓存，到内部私服的托管，再到 Docker 镜像和 npm 包的存储，Nexus 几乎是 Java 生态里“默认的制品库方案”。但这不代表 Nexus 没有自己的门槛。从安装配置到日常运维，有不少值得留意的细节。

<!--以上为摘要内容-->

## 一、Nexus 是什么？解决什么问题？

Sonatype Nexus Repository 是一个通用的制品仓库管理器。它最核心的能力有三点：

**第一，代理外部仓库。** 你的项目依赖了 Maven Central 上的第三方包。如果每次构建都从 Central 下载，第一是慢，第二是对外网有依赖（Central 抽风了你的构建也抽风）。Nexus 作为代理，第一次下载后缓存到本地，后续构建直接从内网取，速度和稳定性都大幅提升。

**第二，托管内部制品。** 你的团队自己产出的 JAR 包、WAR 包，需要一个地方存储和分发。Nexus 的 hosted 仓库就是干这个的——team A 把 `common-utils-1.0.0.jar` 发布到 Nexus，team B 像引用外部依赖一样把它拉到自己的项目里。

**第三，统一入口。** 不管你要从 Maven Central、JCenter、Confluent、Gradle Plugin Portal 还是什么地方拿包，都可以配到一个 Nexus 仓库组（repository group）里，开发者只需要配置一个 URL，由 Nexus 在背后去背后的各个仓库找。

## 二、安装与启动

Nexus 的安装不复杂，但有几个值得注意的点。

**准备工作**：Nexus 需要 Java 8 或更高版本，官方推荐用其自带的 bundle。你在 [Sonatype 官网](https://www.sonatype.com/products/sonatype-nexus-oss) 下载对应操作系统的 tar.gz 或 zip 包。

```bash
# 解压
tar -xzf nexus-3.x.x-unix.tar.gz -C /opt/

# Nexus 解压后有两个目录
# nexus-3.x.x/ — 程序文件
# sonatype-work/   — 数据文件（仓库内容、配置、日志）
```

**启动**：

```bash
cd /opt/nexus-3.x.x/bin
./nexus run       # 前台运行，适合调试
./nexus start     # 后台运行
```

首次启动会比较慢（Nexus 需要初始化数据库和默认仓库），可以在 `sonatype-work/nexus3/log/nexus.log` 里观察初始化进度。

启动成功后，访问 `http://localhost:8081`。默认管理员账号是 `admin`，初始密码在 `sonatype-work/nexus3/admin.password` 文件里。第一次登录会要求你改密码。

**生产环境建议**：

- 把 `sonatype-work` 目录放在一个独立的、高性能的磁盘上。制品仓库的 IO 操作非常频繁，不要和系统盘抢 IO。
- 配置反向代理（Nginx 或 HAProxy），把 8081 端口代理到 80/443，配上 HTTPS。
- 为 Nexus 配置足够的内存：在 `nexus.vmoptions` 里调整 `-Xms` 和 `-Xmx`，一般建议 2G 起步，大规模使用 4G 到 8G。

## 三、Maven 私服配置

这是 Nexus 最经典的使用场景。配置分两步：Nexus 侧的仓库创建，和 Maven 侧的 settings.xml 配置。

### Nexus 侧：创建 Hosted 仓库和仓库组

登录 Nexus，进入 `Settings → Repositories → Create repository`。选择 `maven2 (hosted)`：

- **Name**：`my-releases`（发布发行版用）
- **Version policy**：Release
- **Deployment policy**：Allow redeploy（开发环境可以设为 Allow；生产环境建议 Disable redeploy，防止覆盖）

再创建一个 `my-snapshots`，Version policy 设为 Snapshot。

然后创建一个 `maven2 (group)` 仓库组 `my-public`，把 `maven-central`（代理）、`my-releases`（托管）、`my-snapshots`（托管）都加进去。

### Maven 侧：settings.xml

在 `~/.m2/settings.xml`（或项目根目录的 `.mvn/settings.xml`）中配置：

```xml
<settings>
    <servers>
        <server>
            <id>nexus</id>
            <username>admin</username>
            <password>your-password</password>
        </server>
    </servers>

    <mirrors>
        <mirror>
            <id>nexus</id>
            <mirrorOf>*</mirrorOf>
            <url>http://nexus.example.com:8081/repository/my-public/</url>
        </mirror>
    </mirrors>
</settings>
```

`<mirrorOf>*</mirrorOf>` 表示所有的仓库请求都走这个 Nexus 镜像。如果你的项目还需要从其他外部仓库拉包（比如 Confluent、JitPack），也可以配成 `<mirrorOf>external:*</mirrorOf>`，让 Nexus 只代理外网仓库，内网直达。

### 发布制品到 Nexus

在项目的 pom.xml 中配置 `distributionManagement`：

```xml
<distributionManagement>
    <repository>
        <id>nexus</id>
        <url>http://nexus.example.com:8081/repository/my-releases/</url>
    </repository>
    <snapshotRepository>
        <id>nexus</id>
        <url>http://nexus.example.com:8081/repository/my-snapshots/</url>
    </snapshotRepository>
</distributionManagement>
```

`<id>` 要和 `settings.xml` 中 `<server>` 的 `<id>` 对应，用于身份认证。

发布命令：

```bash
mvn deploy
```

Maven 会根据当前版本号是否带 `-SNAPSHOT` 后缀，自动选择推到 release 还是 snapshot 仓库。

## 四、不只是 Maven——npm 和 PyPI 仓库

Nexus 是一个通用制品仓库，不只支持 Maven。以下以 npm 和 PyPI 为例。

### npm 私有仓库

在 Nexus 中创建 `npm (hosted)` 仓库，名为 `npm-private`。

npm 客户端配置（在项目的 `.npmrc` 中）：

```ini
registry=http://nexus.example.com:8081/repository/npm-group/
```

发布前需要先登录：

```bash
npm login --registry=http://nexus.example.com:8081/repository/npm-private/
npm publish --registry=http://nexus.example.com:8081/repository/npm-private/
```

### PyPI 私有仓库

创建 `pypi (hosted)` 仓库，名为 `pypi-private`。

配置 pip（在 `~/.pip/pip.conf` 或 `pip.ini`）：

```ini
[global]
index-url = http://nexus.example.com:8081/repository/pypi-group/simple
```

发布 Python 包：

```bash
twine upload --repository-url http://nexus.example.com:8081/repository/pypi-private/ dist/*
```

## 五、清理策略

制品仓库不放水会越积越大。Nexus 提供了清理策略来自动删除旧版本的制品。

进入 `Settings → Cleanup Policies → Create Cleanup Policy`：

- **Format**：选择 Maven 2 或 Docker
- **Criteria**：可以按“Component age”（发布超过 N 天）、“Component usage”（最近 N 天没有被下载过）、“Release type”（只删 prerelease 版本）
- **Preview**：先预览会删除哪些制品，确认无误再执行

一个推荐的策略：

- **快照仓库**：保留最近 10 个版本，删除 30 天前的快照
- **发行版仓库**：不建议自动删除，由人工定期清理（至少保留最近 N 个 MAJOR 的最新版本）
- **Docker 镜像仓库**：按 Tag 数量限制清理旧版本，保留最近 5 个 tag

## 六、小结

Nexus 胜在“够用且简单”。如果你是一个 Java 为主的团队，它的开箱即用体验是最好的——不需要额外学习什么概念，Maven 开发者一看就懂。但如果你有更复杂的多格式制品管理需求、需要更细粒度的权限控制、或者想做制品级别的漏洞扫描，Nexus 就不太够用了。

这就引出了我们下一篇的主角——Harbor。它是容器镜像仓库的标杆方案，也是很多团队在 K8s 场景下的第一选择。

每天前进一小步，就是一个新的高度！
