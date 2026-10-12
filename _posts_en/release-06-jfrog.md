---
title: 'Release Engineering (6): JFrog Artifactory — Enterprise-Grade Artifact Management'
date: 2024-08-10
author: Tang Moying
categories: [release]
tags: [JFrog, Artifactory, Artifact Management, CI/CD, DevOps]
lang: en
alt_url: /post/release-06-jfrog
---

If Nexus is "a private registry that's good enough" and Harbor is "a professional container image registry", then JFrog Artifactory is "the enterprise-grade platform that wants to manage artifacts in every format well". It isn't cheap, but many companies that have reached scale choose it, for a very simple reason: the things Nexus can't handle, it handles.

<!--以上为摘要内容-->

## 1. The JFrog Platform at a Glance

JFrog is not just an artifact repository. It is a platform ecosystem built around artifacts, whose core products include:

| Product | Positioning |
|------|------|
| **Artifactory** | The core artifact repository, supporting 30+ package formats |
| **Xray** | Artifact vulnerability scanning and license compliance analysis |
| **Pipelines** | CI/CD pipelines (competing with Jenkins) |
| **Distribution** | Artifact distribution and edge node acceleration |
| **Mission Control** | Multi-instance management and a global view |

But for most teams, the entry point is Artifactory—get artifact management sorted out first, and extend to the rest on demand.

## 2. Multi-Format Support: One Repository to Manage Everything

Artifactory's most central selling point is **the breadth of artifact formats it supports**. The package types it natively supports include:

- **Java**: Maven, Gradle, Ivy
- **Containers**: Docker, Helm
- **Frontend**: npm, Bower
- **Python**: PyPI, Conda
- **Go**: Go Modules
- **CI**: Conan (C/C++), NuGet (.NET)
- **Generic**: Generic (any file, such as zip, tar.gz)

Supporting more than 30 formats means: you don't need to install a Nexus for Maven, a Harbor for Docker or a Verdaccio for npm—one Artifactory handles it all.

The configuration approach is similar for every format: create a local repository (Local Repository), a remote repository (Remote Repository, proxying external sources) and a virtual repository (Virtual Repository, aggregating multiple repositories), then configure the client to point at the virtual repository.

## 3. The Permission Model: As Fine-Grained As You Want

Nexus's permission model is fairly coarse (essentially repository-level read/write), Harbor's permissions are divided by project (but with no repository-level inheritance), while Artifactory's permission model is far more detailed.

**Artifactory's permission structure**:

```
用户（User）
  ↓ belongs to
用户组（Group）
  ↓ assigned to
权限目标（Permission Target）
  → Repositories: which repositories
  → Path patterns (Includes/Excludes Pattern): which paths inside the repositories
  → Actions: read, write, delete, manage
```

For example, you can set a permission rule like this:

> "The QA team can read all images under the `*/stable/*` path in the `docker-release-local` repository, but cannot write or delete."

Or:

> "The frontend team can publish packages in the `@mycompany/*` scope in the `npm-local` repository, but cannot publish other scopes."

This granularity is very practical in enterprise scenarios. Once you have many teams, you can't give every team full repository-level access—that easily leads to incidents like "the frontend team accidentally overwrote the backend team's package".

## 4. Deep Integration with CI Tools

Artifactory has deep integrations with mainstream CI tools such as Jenkins, GitHub Actions and GitLab CI. This is not a simple "configure a password and you can upload"—it embeds artifact management into every step of the pipeline.

**Artifactory Plugin for Jenkins** is the most typical example:

```groovy
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                // The Maven build step provided by Artifactory
                rtMavenRun(
                    tool: 'maven-3',
                    pom: 'pom.xml',
                    goals: 'clean deploy',
                    // Artifactory will automatically parse the pom file, upload artifacts,
                    // and collect build information (Build Info)
                    resolverId: 'maven-resolver',
                    deployerId: 'maven-deployer'
                )
            }
        }
        stage('Publish Build Info') {
            steps {
                // Publish Build Info to Artifactory
                rtPublishBuildInfo(
                    serverId: 'artifactory-server'
                )
            }
        }
    }
}
```

**Build Info** is a signature feature of Artifactory. During the build it collects the following information:

- Which artifacts this build produced
- Which dependencies were used (including concrete versions and SHAs)
- Build environment parameters (JDK version, operating system, build tool version)
- The triggering Git commit message and author

Once this information is recorded in Artifactory, you have a complete traceability chain: any artifact can be traced back to its build, its dependencies and its code changes. This is extremely useful for compliance audits and security investigations.

## 5. High-Availability Architecture

When the reliability of the artifact repository directly affects the business (pushes fail → the CI pipeline gets stuck → releases are blocked), HA goes from "Nice to have" to "Must have".

The core of Artifactory's high-availability architecture is:

```
         Load Balancer
            /    \
    Node 1        Node 2
         \    /
    Shared Storage (NFS / S3 / GCS)
              |
    External Database (PostgreSQL / Oracle / MySQL)
```

- **Multiple nodes**: two or more Artifactory instances form a cluster, using the same shared storage and database
- **Load balancing**: requests are distributed at the front end by Nginx/HAProxy
- **Shared storage**: all nodes share the same set of binary artifact data (stored on NFS or object storage)
- **Database**: metadata is stored centrally in an external database, shared by all nodes

When setting up Artifactory HA, the license needs to support clustering. JFrog's commercial licenses are priced in tiers by "number of nodes" and "variety of package formats"—HA requires at least a 2-node license.

Harbor and Nexus also support HA, but in terms of how mature the solution is and enterprise support, Artifactory's HA configuration is the least troublesome—in most scenarios, you can get it running by changing a few lines of `system.yaml`.

## 6. How Do You Choose Between Nexus Pro and Artifactory?

Many people agonise over "NXRM Pro (Nexus Repository Manager Pro) or Artifactory". Their core differences:

| Dimension | Nexus Pro | Artifactory |
|------|-----------|-------------|
| Number of package formats | ~20+ | 30+ |
| Permission granularity | Repository level | Repository + path patterns |
| CI integration | Basic support | Deep Build Info integration |
| Enterprise HA | Basic support | Mature solution |
| Vulnerability scanning | Basic (IQ Server) | Xray as a separate product |
| Pricing | Relatively friendly | On the expensive side |
| Learning curve | Low | Medium to high |

**A simple way to think about the choice**: if you are a small or mid-sized team, Java-focused, and don't need extremely fine-grained permission control or deep CI integration, Nexus is enough. If you are a large enterprise, with a diversity of package formats, and you need a complete artifact traceability chain and strict security and compliance review, then Artifactory is worth the extra investment.

## 7. Summary

Artifactory is not the kind of tool that "just works once you install it"—its complexity corresponds to the flexibility it offers. A team of a few dozen people may not need it, but a team of a few hundred will find that once the number of artifacts, the variety of formats, the permission requirements and the compliance requirements all grow to a certain scale, the governance capability Artifactory provides turns from "over-engineering" into "a necessity".

And with that, we've covered all three main artifact repository options. In the next article, we'll do a systematic side-by-side comparison and talk about artifact cleanup—whichever tool you use, that's something you can't avoid.

A small step forward every day is a new height!
