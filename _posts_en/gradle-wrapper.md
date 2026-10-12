---
title: 'Gradle Wrapper: A Unified Build Environment for the Team'
date: 2023-05-27
author: Tang Moying
categories: [build]
tags: [Gradle, Wrapper]
lang: en
alt_url: /post/gradle-wrapper
---

Gradle Wrapper is the execution method officially recommended by Gradle; it ensures that everyone on the team uses the same version of Gradle, avoiding the "it runs on my machine but not on yours" problem.

<!--以上为摘要内容-->

## What the Gradle Wrapper Is

The Wrapper is a set of small files placed in the project root directory:

```
gradlew        # Unix/Mac execution script
gradlew.bat    # Windows execution script
gradle/
  └── wrapper/
      ├── gradle-wrapper.jar          # bootstrap program
      └── gradle-wrapper.properties   # version configuration
```

After you use the Wrapper, you do not need to install Gradle globally — the first time `gradlew` runs it automatically downloads the specified version of Gradle.

## Generating the Wrapper

```bash
gradle wrapper --gradle-version 8.5
```

Or configure it directly in `build.gradle`:

```groovy
wrapper {
    gradleVersion = '8.5'
    distributionType = Wrapper.DistributionType.ALL
}
```

Then run `gradle wrapper`.

## gradle-wrapper.properties

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.5-bin.zip
networkTimeout=10000
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

- `distributionUrl`: the address of the Gradle distribution package
- `-bin.zip` vs `-all.zip`: bin contains only the runtime, all contains the source code and documentation

## Everyday Use

Use `gradlew` in place of `gradle`:

```bash
# before
gradle build

# with the Wrapper
./gradlew build          # Mac/Linux
gradlew.bat build        # Windows
```

## Upgrading the Gradle Version

```bash
./gradlew wrapper --gradle-version 8.7
```

Or directly modify the `distributionUrl` in `gradle-wrapper.properties`.

## Benefits in CI/CD

CI machines do not need Gradle preinstalled; they only need a JDK:

```yaml
# GitHub Actions
- name: Build
  run: ./gradlew build
```

## Customizing the Wrapper jar Location

In an intranet environment you can point it at the private repository:

```properties
distributionUrl=https\://nexus.company.com/gradle-dist/gradle-8.5-all.zip
```

## Verifying the Wrapper jar

`gradle-wrapper.jar` should be committed to version control. Gradle officially provides checksums that you can compare against on the download page.

A small step forward every day takes you to a new height!
