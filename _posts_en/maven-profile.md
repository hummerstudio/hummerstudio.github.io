---
title: Maven Profiles — Different Configurations for Different Environments
date: 2023-05-13
author: Tang Moying
categories: [build]
tags: [Maven, Profile, Multi-Environment]
lang: en
alt_url: /post/maven-profile
---

Development, test and production environments often need different configurations (database addresses, log levels, and so on). Maven's Profile mechanism was designed to solve exactly this problem.

<!--以上为摘要内容-->

## Defining a Profile

In `pom.xml`:

```xml
<profiles>
    <profile>
        <id>dev</id>
        <properties>
            <env.name>development</env.name>
            <db.url>jdbc:mysql://localhost:3306/dev_db</db.url>
        </properties>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
    </profile>

    <profile>
        <id>prod</id>
        <properties>
            <env.name>production</env.name>
            <db.url>jdbc:mysql://prod-server:3306/prod_db</db.url>
        </properties>
    </profile>
</profiles>
```

## Activating a Profile

```bash
# Activate a single one
mvn package -Pdev
mvn package -Pprod

# Activate several
mvn package -Pdev,debug

# Exclude one (when prod has activeByDefault)
mvn package -P!prod
```

## Using it together with resource filtering

In `src/main/resources/application.properties`:

```properties
env.name=${env.name}
db.url=${db.url}
```

Then enable filtering in the `<build>` section of pom.xml:

```xml
<resources>
    <resource>
        <directory>src/main/resources</directory>
        <filtering>true</filtering>
    </resource>
</resources>
```

At packaging time Maven replaces `${env.name}` with the value from the corresponding Profile.

## Automatic activation by condition

```xml
<!-- Triggered by JDK version -->
<activation>
    <jdk>[11,)</jdk>
</activation>

<!-- Triggered by operating system -->
<activation>
    <os>
        <name>Windows 10</name>
        <family>windows</family>
    </os>
</activation>

<!-- Triggered by presence of a property -->
<activation>
    <property>
        <name>ci</name>
    </property>
</activation>
```

## Defining a global Profile in settings.xml

`~/.m2/settings.xml` (shared by all projects):

```xml
<profiles>
    <profile>
        <id>company-repo</id>
        <repositories>
            <repository>
                <id>internal</id>
                <url>https://nexus.company.com/repository/maven-public/</url>
            </repository>
        </repositories>
    </profile>
</profiles>

<activeProfiles>
    <activeProfile>company-repo</activeProfile>
</activeProfiles>
```

## Overriding dependencies in a Profile

```xml
<profile>
    <id>local</id>
    <dependencies>
        <dependency>
            <groupId>com.example</groupId>
            <artifactId>mock-service</artifactId>
            <version>1.0</version>
        </dependency>
    </dependencies>
</profile>
```

For local development use a mock implementation, and for production use the real implementation.

## Viewing the currently active Profile

```bash
mvn help:active-profiles
```

A small step forward every day is a new height!
