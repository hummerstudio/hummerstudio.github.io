---
title: 'Maven Repository Configuration: settings.xml in Detail'
date: 2023-05-14
author: Tang Moying
categories: [build]
tags: [Maven, Repositories, settings.xml]
lang: en
alt_url: /post/maven-settings
---

`settings.xml` is Maven's global configuration file; it controls repository addresses, authentication information, mirrors and so on. Understanding it matters a great deal for team collaboration and CI/CD.

<!--以上为摘要内容-->

## Location of settings.xml

| Level | Path | Scope |
|------|------|----------|
| Global | `${M2_HOME}/conf/settings.xml` | All users |
| User | `~/.m2/settings.xml` | Current user |

The user level takes precedence, but it is recommended to use the user-level configuration to avoid affecting others.

## Configuring the Local Repository Path

```xml
<settings>
    <localRepository>D:/maven-repo</localRepository>
</settings>
```

The default is `~/.m2/repository/`. Putting it on a non-system drive avoids downloading everything again after reinstalling the system.

## Configuring a Remote Repository

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

## Configuring Private Repository Authentication

Configure it in `settings.xml` (do not put it in pom.xml):

```xml
<servers>
    <server>
        <id>company-releases</id>
        <username>deployer</username>
        <password>${env.NEXUS_PASSWORD}</password>
    </server>
</servers>
```

The `id` of `<server>` must match the `id` of `<distributionManagement>` in pom.xml.

In CI/CD it is recommended to use an environment variable for the password:

```xml
<password>${env.NEXUS_PASSWORD}</password>
```

## Configuring a Mirror

Redirect all requests to the private repository:

```xml
<mirrors>
    <mirror>
        <id>nexus</id>
        <mirrorOf>*</mirrorOf>
        <url>https://nexus.company.com/repository/maven-public/</url>
    </mirror>
</mirrors>
```

Values of `mirrorOf`:
- `*` — intercept everything
- `central` — intercept Maven Central only
- `*,!company-repo` — intercept everything but exclude `company-repo`

## Configuring a Proxy

When the corporate network requires a proxy:

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

## Encrypting Passwords

Do not write passwords in plain text; use Maven encryption:

```bash
# create a master password
mvn --encrypt-master-password

# encrypt the server password
mvn --encrypt-password
```

Write the encryption results into `settings-security.xml` and `settings.xml`.

A small step forward every day takes you to a new height!
