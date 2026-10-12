---
title: 'Release Engineering (Part 1): What Is a Release — The Starting Point of the Artifact''s Full Life Cycle'
date: 2024-07-06
author: Tang Moying
categories: [release]
tags: [Release Engineering, Artifact Management, DevOps, CI/CD, Software Life Cycle]
lang: en
alt_url: /post/release-01-what-is-release
---

Many teams do DevOps: the pipeline is built, K8s is up, monitoring is configured — but when it comes to "release," their first reaction is "create a Git tag and then deploy to production." That's not wrong, of course, but if you understand release as nothing more than "tagging," you may overlook a key step: between the build output and a deliverable version lies a whole world of artifact management.

<!--以上为摘要内容-->

## 1. Release Is Not Deployment

In the DevOps loop, "release" and "deploy" are two entirely different stages.

**Release** answers the question: what exactly are we delivering? You can think of it as "producing a definite, traceable, version-stamped deliverable." At this stage, what you do includes: stamping the artifact with a version number, generating a changelog, and archiving it to the artifact repository. The result of a release is "a version that can be deployed."

**Deploy** answers the question: how do we get this version running in the target environment? Blue-green deployment, canary deployment, rolling updates — these are all deployment strategies, not the business of release. Deployment presupposes that a definite, traceable version already exists.

If you think of this relationship by analogy to factory production, release is "passing quality inspection, getting labeled, going into the warehouse," and deployment is "being taken out of the warehouse, shipped to the site, and installed and commissioned." Without the former, the latter has no idea what it is deploying.

## 2. What Is an Artifact?

An artifact is something produced by the build process that can be deployed directly. Common artifacts include:

- Java JAR/WAR packages
- Docker images
- the dist directory of a frontend project (packaged as tar.gz)
- npm packages (.tgz)
- Python wheel packages
- Go binaries

An artifact needs at least two properties before it can be called a "releasable artifact":

**First, immutability.** For the same version number, the artifact produced must be one and the same at any time and in any environment. This means you cannot quietly swap an artifact after it has been released — if you need changes, ship a new version. It's also why Docker images have a sha256 digest and Maven verifies the pom file: all to ensure that what you get is the same as what you think you're getting.

**Second, traceability.** Looking at an artifact, you should be able to answer: which commit built it? Which pipeline did it run in? What versions of dependencies did it use? Some of this information is embedded in the artifact's metadata (such as a JAR's MANIFEST.MF), and some has to be associated through the artifact repository (such as a Git commit SHA mapping).

## 3. Snapshot vs. Release

In artifact management there's a most basic and most easily confused pair of concepts: snapshot and release.

**A snapshot** is an intermediate product created during development. Every time you commit code, the CI pipeline automatically builds a new version that overwrites the old one. The characteristic of a snapshot is that it can be overwritten repeatedly and changes at any time. In Maven, `1.0.0-SNAPSHOT` means "this version isn't settled yet; the contents can change at any moment." You can't deploy a snapshot to production, because it isn't a definite version — what you deploy today and what you deploy tomorrow may not be the same thing.

**A release** is a confirmed, immutable final version. Once released, it can no longer be changed. Maven's `1.0.0` (without the SNAPSHOT suffix) is a release. Once you push it up, it is what it is, and anyone can use it at any time to reproduce a deployment.

This distinction determines the artifact repository's retention policy. Snapshots can be cleaned up periodically (keeping only the last N builds is fine), while releases should be kept forever (or at least for however many years compliance requires).

## 4. Why Can't You Just Use the Filesystem?

Many small teams start out by just dropping the build output in the Jenkins workspace, or scp-ing it to some "release server." That works at small scale, but it brings several headache-inducing problems:

**You can't find historical versions.** The disk fills up, someone cleans it out, and last month's build output is gone. When the time comes to roll back, there's no artifact to use — you can only pull the code again and rebuild, but who guarantees that what you rebuild is the same as what originally went live?

**Versioning is a mess.** The files are named `app-20240315.jar`, `app-latest.jar`, `app-fix.jar`, and three months later no one can say which is which.

**Security problems.** The filesystem has no access control; anyone can delete or overwrite an artifact. There's no metadata management either, so you don't know the artifact's scan results, dependency information, or release time.

The artifact repository exists precisely to solve these problems. Its core capabilities include:

- **Storage and indexing**: organize artifacts by version and coordinates, with query support
- **Access control**: who can upload, who can download, who can delete
- **Metadata management**: associate build information, vulnerability scan results, and expiry flags
- **Proxy and cache**: proxy external repositories (such as Maven Central) to speed up downloads and avoid depending on the external network

## 5. Where Release Fits in the DevOps Loop

Let's go back to the overall view of the DevOps loop:

```
Requirements → code → build → test → release ─→ deploy → monitor → feedback
                              ↑                       ↓
                              └───────────────────────┘
```

The release stage takes the build output that has passed testing and produces "a deployable version." Looking to the left, it depends on the artifacts the CI pipeline produces; looking to the right, it provides a definite version input to the deployment stage.

Why do many teams skip this stage? Because in a small team, "build and deploy directly" seems faster. But as the system grows in scale, the number of environments increases, and compliance requirements tighten, the cost of missing the release stage keeps rising — when something breaks you can't find which version introduced it, you have no trustworthy artifact for a rollback, and the version relationships among multiple environments become impossible to sort out.

The heart of release engineering is turning "version management" from something you do "on the side" into something you do systematically and well.

## 6. What Will This Series Cover?

This series has seven parts, covering the core content of release engineering:

| Part | Content |
|----|------|
| 1 (this post) | What Is a Release — The Starting Point of the Artifact's Full Life Cycle |
| 2 | Version Number Conventions — SemVer and CalVer |
| 3 | Changelogs and Release Notes |
| 4 | Nexus — A Java Private Registry and General-Purpose Artifact Repository |
| 5 | Harbor — A Container Image Registry |
| 6 | JFrog Artifactory — Enterprise-Grade Artifact Management |
| 7 | Comparing the Options and Artifact Cleanup Strategies |

In the next article, we'll talk about how version numbers should really be assigned: is SemVer better, or CalVer? When do you use `1.2.3`, and when do you use `2024.03.15`?

A small step forward every day is a new height!
