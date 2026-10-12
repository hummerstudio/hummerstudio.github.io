---
title: 'Release Engineering (Part 4): Nexus — Java Private Repository and General-Purpose Artifact Repository'
date: 2024-07-27
author: Tang Moying
categories: [release]
tags: [Nexus, Maven, Artifact Repository, Java, Private Repository]
lang: en
alt_url: /post/release-04-nexus
---

When it comes to artifact repositories, the first thing a Java developer thinks of is almost always Nexus. That's no surprise — from proxy caching of Maven Central, to hosting an internal private repository, to storing Docker images and npm packages, Nexus is practically the "default artifact repository solution" in the Java ecosystem. But that doesn't mean Nexus has no barriers of its own. From installation and configuration to day-to-day operations, there are quite a few details worth paying attention to.

<!--以上为摘要内容-->

## 1. What Is Nexus? What Problem Does It Solve?

Sonatype Nexus Repository is a general-purpose artifact repository manager. Its three most core capabilities are:

**First, proxying external repositories.** Your project depends on third-party packages from Maven Central. If every build downloaded from Central, first, it would be slow, and second, it would depend on the external network (if Central has a fit, your build has a fit too). With Nexus as a proxy, the first download is cached locally, and subsequent builds fetch directly from the intranet, greatly improving both speed and stability.

**Second, hosting internal artifacts.** The JAR and WAR packages your own team produces need a place to be stored and distributed. Nexus's hosted repositories are exactly for this — team A publishes `common-utils-1.0.0.jar` to Nexus, and team B pulls it into its own project just as if it were referencing an external dependency.

**Third, a unified entry point.** No matter whether you get your packages from Maven Central, JCenter, Confluent, the Gradle Plugin Portal or anywhere else, you can configure them all into a single Nexus repository group, and developers only need to configure one URL, with Nexus going behind the scenes to look in each of the repositories behind it.

## 2. Installation and Startup

Installing Nexus is not complicated, but there are a few points worth noting.

**Preparation**: Nexus requires Java 8 or later, and the official recommendation is to use its bundled package. Download the tar.gz or zip for your operating system from the [Sonatype website](https://www.sonatype.com/products/sonatype-nexus-oss).

```bash
# Extract
tar -xzf nexus-3.x.x-unix.tar.gz -C /opt/

# After extraction, Nexus has two directories
# nexus-3.x.x/ — program files
# sonatype-work/   — data files (repository contents, configuration, logs)
```

**Startup**:

```bash
cd /opt/nexus-3.x.x/bin
./nexus run       # run in the foreground, good for debugging
./nexus start     # run in the background
```

The first startup is fairly slow (Nexus needs to initialize its database and default repositories); you can watch the initialization progress in `sonatype-work/nexus3/log/nexus.log`.

Once it starts successfully, visit `http://localhost:8081`. The default administrator account is `admin`, and the initial password is in the `sonatype-work/nexus3/admin.password` file. The first login will ask you to change the password.

**Recommendations for production**:

- Put the `sonatype-work` directory on a separate, high-performance disk. An artifact repository performs I/O very frequently, so don't let it compete for I/O with the system disk.
- Configure a reverse proxy (Nginx or HAProxy) to proxy port 8081 to 80/443, with HTTPS.
- Configure enough memory for Nexus: adjust `-Xms` and `-Xmx` in `nexus.vmoptions`; 2G is generally the recommended starting point, and 4G to 8G for large-scale use.

## 3. Configuring a Maven Private Repository

This is the most classic use case for Nexus. Configuration has two parts: creating the repositories on the Nexus side, and the settings.xml configuration on the Maven side.

### Nexus Side: Create Hosted Repositories and a Repository Group

Log in to Nexus and go to `Settings → Repositories → Create repository`. Choose `maven2 (hosted)`:

- **Name**: `my-releases` (for publishing releases)
- **Version policy**: Release
- **Deployment policy**: Allow redeploy (in a development environment this can be set to Allow; in production, Disable redeploy is recommended to prevent overwriting)

Then create another one, `my-snapshots`, with Version policy set to Snapshot.

Then create a `maven2 (group)` repository group `my-public`, and add `maven-central` (proxy), `my-releases` (hosted) and `my-snapshots` (hosted) to it.

### Maven Side: settings.xml

Configure it in `~/.m2/settings.xml` (or `.mvn/settings.xml` in the project root):

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

`<mirrorOf>*</mirrorOf>` means that all repository requests go through this Nexus mirror. If your project also needs to pull packages from other external repositories (such as Confluent or JitPack), you can configure it as `<mirrorOf>external:*</mirrorOf>` instead, so that Nexus only proxies external repositories and intranet ones are reached directly.

### Publishing Artifacts to Nexus

Configure `distributionManagement` in the project's pom.xml:

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

The `<id>` must correspond to the `<id>` of the `<server>` in `settings.xml`, and is used for authentication.

Publish command:

```bash
mvn deploy
```

Depending on whether the current version number carries the `-SNAPSHOT` suffix, Maven automatically chooses whether to push to the release or the snapshot repository.

## 4. Not Only Maven — npm and PyPI Repositories

Nexus is a general-purpose artifact repository and does not only support Maven. Below, npm and PyPI serve as examples.

### npm Private Repository

Create an `npm (hosted)` repository in Nexus, named `npm-private`.

npm client configuration (in the project's `.npmrc`):

```ini
registry=http://nexus.example.com:8081/repository/npm-group/
```

You need to log in before publishing:

```bash
npm login --registry=http://nexus.example.com:8081/repository/npm-private/
npm publish --registry=http://nexus.example.com:8081/repository/npm-private/
```

### PyPI Private Repository

Create a `pypi (hosted)` repository, named `pypi-private`.

Configure pip (in `~/.pip/pip.conf` or `pip.ini`):

```ini
[global]
index-url = http://nexus.example.com:8081/repository/pypi-group/simple
```

Publishing a Python package:

```bash
twine upload --repository-url http://nexus.example.com:8081/repository/pypi-private/ dist/*
```

## 5. Cleanup Policies

An artifact repository just keeps piling up and growing if you don't drain it. Nexus provides cleanup policies to automatically delete older versions of artifacts.

Go to `Settings → Cleanup Policies → Create Cleanup Policy`:

- **Format**: choose Maven 2 or Docker
- **Criteria**: you can filter by "Component age" (published more than N days ago), "Component usage" (not downloaded in the last N days), "Release type" (delete only prerelease versions)
- **Preview**: preview which artifacts would be deleted first, and only execute once you have confirmed there is no mistake

One recommended policy:

- **Snapshot repository**: keep the most recent 10 versions, and delete snapshots from more than 30 days ago
- **Release repository**: automatic deletion is not recommended; clean it up manually on a regular basis (at least keep the latest version of the most recent N MAJOR releases)
- **Docker image repository**: clean up old versions by limiting the Tag count, keeping the most recent 5 tags

## 6. Summary

Nexus wins on being "good enough and simple". If you are a Java-centric team, its out-of-the-box experience is the best there is — there is nothing extra to learn, and a Maven developer understands it at a glance. But if you have more complex multi-format artifact management needs, require finer-grained permission control, or want artifact-level vulnerability scanning, Nexus is no longer quite enough.

Which brings us to the star of our next article — Harbor. It is the benchmark solution for container image repositories, and the first choice for many teams in K8s scenarios.

A small step forward every day is a new height!
