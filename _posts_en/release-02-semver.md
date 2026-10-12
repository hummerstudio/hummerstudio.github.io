---
title: 'Release Engineering (Part 2): Version Number Conventions — SemVer and CalVer'
date: 2024-07-13
author: Tang Moying
categories: [release]
tags: [SemVer, CalVer, Versioning, Maven, Artifact Management]
lang: en
alt_url: /post/release-02-semver
---

Have you ever been in this situation: a bug shows up in production, you need to roll back to the last stable version, and you discover that the most recent version number is `1.0.3-fix2`, before that `1.0.3-fix1` and `1.0.3-final`, and no one can say which one is actually stable. That's what happens when version number management spirals out of control. A good version numbering scheme isn't about making the version numbers "look nice" — it's about making the meaning of every version obvious at a glance.

<!--以上为摘要内容-->

## 1. Why Can't You Assign Version Numbers However You Like?

Before we talk about conventions, think about what a version number fundamentally is.

**A version number is a convention that conveys information to everyone who uses the artifact.** When you see `Spring Boot 3.2.0 -> 3.2.1`, you know it's a small fix; when you see `2.7.0 -> 3.0.0`, you know it's a big move — the API may no longer be compatible. This kind of information transfer rests on everyone following the same convention.

What happens when version numbers have no rules? `1.0.1` might be a bug fix or a major refactor; `2.0` might really be incompatible, or it might just be that someone felt it was "about time to bump the version number." When version numbers lose their meaning, dependency management turns into a game of chance.

## 2. SemVer: The Gold Standard for Semantic Versioning

SemVer (Semantic Versioning) is the most widely used version number convention today. Its format is:

```
MAJOR.MINOR.PATCH
```

In plain terms:

- **MAJOR**: you made incompatible API changes. Code using the old API has to be changed to upgrade to this version.
- **MINOR**: you added functionality, but in a backward-compatible way. Old code can upgrade without changes.
- **PATCH**: you fixed a bug, added no functionality, and stayed backward-compatible.

When one part of the version number goes up, the parts to its right reset to zero. For example, `1.2.3` with a MINOR bump becomes `1.3.0`; with a MAJOR bump it becomes `2.0.0`.

**SemVer also defines pre-release versions and build metadata**:

```
1.0.0-alpha
1.0.0-alpha.1
1.0.0-beta.2
1.0.0-rc.1
```

The precedence order is: `1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-beta < 1.0.0-rc < 1.0.0`. Tools such as Maven and npm use this rule to determine the "latest version." It also explains why `1.0.0-SNAPSHOT` is never selected as a release in Maven — SNAPSHOT isn't a legal SemVer pre-release identifier, and in Maven's version comparison scheme it always ranks below any release.

**The full literal specification of SemVer** can be found at [semver.org](https://semver.org/lang/zh-CN/). I won't translate it clause by clause here, but there are a few points worth noting:

> Once a versioned package has been released, the contents of that version must not be modified. Any modifications must be released as a new version.

> Major version zero (0.y.z) is for initial development. Anything may change at any time. The public API should not be considered stable.

These two points map directly onto the "artifact immutability" and "snapshot vs. release" we talked about in the previous article.

**When SemVer doesn't apply**: if your project doesn't expose an API to the outside (a monolithic application, say, or an internal management system), the MAJOR.MINOR.PATCH distinction in SemVer doesn't mean much. No consumer needs to care about your API compatibility; all you need is a version number that indicates ordering.

## 3. CalVer: When What You Care About Is Time

CalVer (Calendar Versioning) numbers versions by the calendar. Common formats include:

| Format | Example | Use case |
|------|------|----------|
| `YYYY.MM.DD` | `2024.03.15` | Ubuntu's versioning scheme (`24.04`, `24.10`) |
| `YYYY.MINOR.MICRO` | `2024.1.0` | Python's `3.12.0` (not purely CalVer, but it blends in time) |
| `YY.MINOR.PATCH` | `24.1.0` | JetBrains IDEs (`2024.1`) |
| `YYYY.MM` | `2024.03` | Unity engine |

**The core value of CalVer** isn't semantic meaning but time information. At a glance you know when this version was released, roughly how old it is, and whether you need to upgrade.

**What scenarios suit CalVer?**

- **Product-style projects with no clear API contract**: a game engine, an IDE, an operating system. Users care about "am I on the latest version," not "is the API compatible."
- **Projects with a regular release cadence**: an internal tool that ships monthly, a platform released quarterly.
- **Cases where you don't need to distinguish "major" from "minor"**: an internal microservice with no external consumers, where the version number is purely an identifier.

**CalVer's limitations** are just as obvious: it can't convey compatibility information. Between `2024.03` and `2024.04` there might be nothing but a documentation fix, or every API might have changed. If your project has API compatibility requirements, CalVer won't cut it.

## 4. When to Use Which?

This isn't an either-or question. Many projects combine the two:

- **SemVer as the main scheme, CalVer as a supplement**: some projects embed the year in the version number, like `2024.1.0` — the first number is both the year and the MAJOR.
- **CalVer externally, SemVer internally**: the version number users see for the product is `2024.03`, while the internal API package uses `2.1.0`.
- **CalVer as the version identifier, SemVer for dependency management**: the release platform's version uses a date number, but internal SDKs and shared libraries stick to SemVer.

**A simple decision path**:

1. Does your project have external consumers (API users, library users)? → Use SemVer
2. Is your project a final product with no API contract? → Use CalVer
3. Both? → CalVer for the product externally, SemVer for internal libraries

## 5. Version Numbers in Practice in Maven/Gradle

In the Java ecosystem, the final form of a version number shows up in pom.xml or build.gradle. Take Maven:

```xml
<groupId>com.example</groupId>
<artifactId>my-app</artifactId>
<version>1.2.0</version>
```

Maven's version comparison rules broadly follow SemVer, but they have their own logic: `1.0.0`, `1.0`, and `1` are equivalent in Maven (Maven splits the version on "." and compares segment by segment, padding with zeros where needed). Between `1.0.0-rc1` and `1.0.0`, Maven knows the suffix separated by "-" is a pre-release identifier, and ranks it ahead of the final release.

**A few practices worth noting:**

**When to use SNAPSHOT.** Use SNAPSHOT only on development branches. Once you're ready to release, drop the SNAPSHOT suffix and cut a proper release version. The Maven Release Plugin can automate this process for you: change `1.0.0-SNAPSHOT` to `1.0.0`, commit, tag, then change it to `1.0.1-SNAPSHOT`.

**Where to put the version number.** The `<version>` tag in pom.xml can be hardcoded or read from a property. Multi-module projects usually manage it centrally with a `<revision>` property, so each module doesn't have to maintain its own version number.

```xml
<properties>
    <revision>1.2.0</revision>
</properties>

<version>${revision}</version>
```

The Gradle equivalent is to define `version=1.2.0` in `gradle.properties` and then reference it in `build.gradle`.

**Automating version numbers.** If your commit messages follow Conventional Commits (such as `feat:`, `fix:`, `BREAKING CHANGE:`), then a tool can derive the version number for you. A `fix:` commit → bump PATCH, `feat:` → bump MINOR, `BREAKING CHANGE` → bump MAJOR. This is the foundation of the "changelog automation" we'll cover in the next article.

## 6. Summary

A version number looks like a small thing, but it's the language a project uses to communicate with the outside world. Whether you choose SemVer or CalVer depends on what you want to convey to users: "compatible or breaking" (SemVer), or "when is this version from" (CalVer).

Once the version number rules are settled, the next question is: how do you make every release traceable? That's where the changelog comes in.

A small step forward every day is a new height!
