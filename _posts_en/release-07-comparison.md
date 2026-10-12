---
title: 'Release Engineering (Part 7): Tool Comparison and Artifact Cleanup Strategies'
date: 2024-08-17
author: Tang Moying
categories: [release]
tags: [Artifact Management, Nexus, Harbor, Artifactory, Tool Comparison]
lang: en
alt_url: /post/release-07-comparison
---

The previous three articles covered Nexus, Harbor, and JFrog Artifactory respectively. You may have noticed that the overlap among the three isn't all that large — each has its own main battlefield. But that doesn't mean choosing among them is easy. Beyond the characteristics of the tools themselves, you also need to weigh your team's size, the composition of your tech stack, budget constraints, and — most importantly — **artifact cleanup strategy**. An artifact repository with no cleanup strategy is like a kitchen that never takes out the trash.

<!--以上为摘要内容-->

## 1. How the Three Differ in Positioning

Let's start from positioning and sum up each tool's genes in one sentence:

- **Nexus**: the "default private registry" of the Java ecosystem, usable out of the box, later extended to multiple formats
- **Harbor**: the "security steward" of container images, tightly bound to the Docker/K8s ecosystem
- **Artifactory**: the enterprise-grade "all-in-one artifact platform," able to manage any format, and to manage it in fine detail

These three tools aren't a "pick one of three" relationship. Many enterprises actually run Harbor (managing images) plus Nexus or Artifactory (managing Maven/npm/PyPI) at the same time. Even the combination of Harbor + Artifactory isn't uncommon — Artifactory can manage Docker images too, but Harbor does better on image scanning and K8s integration.

## 2. A Full Comparison

### Features and Ecosystem

| Dimension | Nexus OSS | Nexus Pro | Harbor | Artifactory |
|------|-----------|-----------|--------|-------------|
| Package formats | Maven, npm, Docker, PyPI, NuGet, RubyGems, Go, Yum, APT, Helm, Raw, etc. | Same as OSS + R, etc. | Docker, Helm, OCI | Full coverage of 30+ formats |
| User management | Built-in user system | Built-in + LDAP/SAML | Built-in + LDAP/OIDC | Built-in + LDAP/SAML/OAuth |
| Permission granularity | Repository level | Repository level | Project level | Repository + path pattern |
| Image scanning | Not supported | IQ Server integration | Built-in Trivy | The Xray product |
| Multi-instance replication | Not supported | Supported | Supported | Supported |
| HA / high availability | Not supported | Basic support | Supported | A mature solution |
| CI integration | REST API | REST API | REST API | Build Info + plugin ecosystem |
| REST API | Yes | Yes | Yes | Yes (the richest) |

### Operational Complexity

| Dimension | Nexus | Harbor | Artifactory |
|------|-------|--------|-------------|
| Installation method | Unzip a tar.gz | docker-compose / Helm | tar.gz / Docker / Helm / K8s Operator |
| Day-to-day maintenance | Low (mostly needs no attention) | Medium (upgrade components, watch container health) | Medium to high (many config items, many enterprise features) |
| Upgrade experience | Simple (just replace the program files) | Moderate (follow the official upgrade guide) | Moderate (upgrading an HA cluster takes steps in order) |
| Monitoring approach | JMX / Prometheus exporter | Exposing Prometheus metrics | Prometheus / JMX / built-in Metrics |

### Team Size Fit

| Tool | Ideal team size | Typical scenario |
|------|-------------|----------|
| Nexus OSS | 1-50 people | Java-first startups and small-to-medium teams that want simplicity |
| Nexus Pro | 50-200 people | Mid-sized teams that need multiple formats and basic enterprise features |
| Harbor | Any | Any scale, as long as you use Docker/K8s |
| Artifactory | 100+ people | Large enterprises with multiple formats, multiple teams, and high compliance requirements |

## 3. A Tool Selection Decision Tree

Ask yourself in the following order, and you'll usually find the answer:

```
1. 你的主要制品格式是什么？
   ├─ Mainly Docker images → Harbor (image security scanning is a must)
   ├─ Mainly Java Maven/Gradle → see step 2
   └─ Mixed formats (Java + npm + Docker + Python...) → see step 3

2. Java 为主，需要哪些企业特性？
   ├─ Only need proxy and hosted repositories → Nexus OSS (free is enough)
   ├─ Need HA / LDAP / multiple formats → Nexus Pro
   └─ Need Build Info / path-level permissions / enterprise compliance → Artifactory

3. 多格式混合，团队规模和预算？
   ├─ Under 50 people, limited budget → Nexus OSS + Harbor (manage Maven/Docker separately)
   ├─ 50-200 people, procurement budget available → Nexus Pro
   └─ Over 200 people, ample budget → Artifactory (possibly + Harbor for images)
```

**A reality worth noting**: many teams end up choosing a "two-piece" or even "three-piece" set — not because any one tool isn't good enough, but because artifacts in different formats really do have different management needs. Vulnerability scanning and distribution for Docker images, and proxy caching for Maven JAR packages, are fundamentally not the same kind of requirement, and no single tool can be first in every dimension.

## 4. Artifact Cleanup Strategy: No Matter What Tool You Use

This is the most common and most overlooked problem. An artifact repository is a classic "in and never out" system — a few dozen CI pushes of hundreds of artifacts a day will quickly eat through your disk. The cleanup strategy has to be thought through in advance; otherwise, when the disk fills up and you clean it then, you're looking at a painful weekend of overtime.

### Core Principles

**Release versions should be kept, but not every version is worth keeping forever.** In an extreme case you might need to roll back to some version from a year ago, but you don't need to keep every minor version from the past three years.

**Snapshots (Maven's Snapshot) / development versions (Docker's dev tags) should be cleaned up proactively.** Their very purpose is to be an "intermediate state," and keeping the most recent 5-10 builds is plenty.

### Nexus Cleanup Configuration

Nexus's cleanup policies are configured under `Settings → Cleanup Policies`:

| Policy | Configuration |
|------|------|
| Clean up old snapshots | Format: maven2, Component age > 30 days, Release type: Snapshot |
| Clean up unused artifacts | Component usage < 1 download in 90 days |
| Old Docker Tags | Format: docker, keep the most recent 10 Tags |

### Harbor Cleanup Configuration

Harbor's cleanup is configured in a project's `Tag Retention` policy:

```yaml
# retention policy example
- 保留最近推送的 10 个 Tag
- 保留所有匹配 "release-*" 的 Tag（生产版本不自动删）
- 删除 30 天前推送的 "dev-*" 和 "feature-*" Tag
```

Only in combination with Garbage Collection will you actually free up disk space. Running GC once a month is recommended.

### Artifactory Cleanup Configuration

Artifactory uses AQL (Artifactory Query Language) to define cleanup rules, which is more flexible than Nexus and Harbor:

```aql
# delete snapshot artifacts created more than 90 days ago that have never been downloaded
items.find(
    {"repo": "maven-snapshot-local"},
    {"created": {"$before": "90d"}},
    {"stat.downloaded": {"$before": "90d"}}
)
```

You can write a Groovy script in Artifactory's `User Plugins` to run the AQL cleanup on a schedule.

### A Generic Cleanup Strategy Template

No matter what tool you use, you can apply this template:

| Artifact type | Retention policy | Notes |
|----------|----------|------|
| Production release | Keep all versions forever | A compliance requirement; when something goes wrong you need to roll back to any version |
| Non-production release | The most recent 5 MINOR versions of the latest 3 MAJOR versions | Users don't need very old minor versions |
| Snapshot/development version | Keep the most recent 10 builds, delete anything older than 30 days | Intermediate states shouldn't be kept too long |
| Docker image | Production Tags kept forever, dev/feature Tags keep the most recent 5 | Images are far bigger than JARs, so cleanup should be even more aggressive |

## 5. Summary

The endpoint of release engineering is not "throwing artifacts into a repository," but "being able to find the version you need at any time." Tool selection determines what tool you use to achieve that goal, and the cleanup strategy determines whether the system can run healthily over the long term.

At this point, the entire release engineering series comes to an end. From "what is a release" to version number conventions, from changelogs to the three mainstream artifact repositories, we've walked a complete loop. In the DevOps loop, I hope this series has filled in the blank at the "release" stage.

A small step forward every day is a new height!
