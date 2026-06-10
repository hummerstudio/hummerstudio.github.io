---
title: Maven仓库配置——settings.xml详解
author: 唐明
categories: [build]
tags: [Maven, 仓库, settings.xml]
---

`settings.xml` 是 Maven 的全局配置文件，控制仓库地址、认证信息、镜像等。理解它对团队协作和 CI/CD 很重要。

<!--以上为摘要内容-->

## settings.xml 的位置

| 级别 | 路径 | 作用范围 |
|------|------|----------|
| 全局 | `${M2_HOME}/conf/settings.xml` | 所有用户 |
| 用户 | `~/.m2/settings.xml` | 当前用户 |

用户级优先，但建议用用户级配置，避免影响他人。

## 配置本地仓库路径

```xml
<settings>
    <localRepository>D:/maven-repo</localRepository>
</settings>
```

默认在 `~/.m2/repository/`。放到非系统盘可以避免重装系统后重新下载。

## 配置远程仓库

```xml
<profiles>
    <profile>
        <id>aliyun</id>
        <repositories>
            <repository>
                <id>aliyun-central</id>
                <name>阿里云公共仓库</name>
                <url>https://maven.aliyun.com/repository/public</url>
                <releases><enabled>true</enabled></releases>
                <snapshots><enabled>false</enabled></snapshots>
            </repository>
        </repositories>
    </profile>
</profiles>

<activeProfiles>
    <activeProfile>aliyun</activeProfile>
</activeProfiles>
```

## 配置私服认证

在 `settings.xml` 中配置（不要写在 pom.xml 里）：

```xml
<servers>
    <server>
        <id>company-releases</id>
        <username>deployer</username>
        <password>${env.NEXUS_PASSWORD}</password>
    </server>
</servers>
```

`<server>` 的 `id` 需要与 pom.xml 中 `<distributionManagement>` 的 `id` 一致。

CI/CD 中密码建议用环境变量：

```xml
<password>${env.NEXUS_PASSWORD}</password>
```

## 配置镜像（Mirror）

把所有请求重定向到私服：

```xml
<mirrors>
    <mirror>
        <id>nexus</id>
        <mirrorOf>*</mirrorOf>
        <url>https://nexus.company.com/repository/maven-public/</url>
    </mirror>
</mirrors>
```

`mirrorOf` 的值：
- `*` — 拦截所有
- `central` — 只拦截 Maven Central
- `*,!company-repo` — 拦截所有，但排除 `company-repo`

## 配置代理

公司网络需要代理时：

```xml
<proxies>
    <proxy>
        <id>company-proxy</id>
        <active>true</active>
        <protocol>http</protocol>
        <host>proxy.company.com</host>
        <port>8080</port>
        <nonProxyHosts>localhost|*.company.com</nonProxyHosts>
    </proxy>
</proxies>
```

## 加密密码

不要明文写密码，用 Maven 加密：

```bash
# 创建主密码
mvn --encrypt-master-password

# 加密服务器密码
mvn --encrypt-password
```

将加密结果写入 `settings-security.xml` 和 `settings.xml`。

每天前进一小步，就是一个新的高度！
