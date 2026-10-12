---
title: 'Java Static Code Analysis (6): Building a Continuous Code Quality Platform with SonarQube'
date: 2018-08-19
author: Tang Moying
categories: [test]
tags: [Java, Static Analysis, SonarQube, Code Quality]
lang: en
alt_url: /post/java-static-analysis-06-sonarqube
---

Earlier we introduced four tools—Checkstyle, PMD, FindBugs and SpotBugs. Each has its own focus, but they share one limitation: they are only good for "one person to look at". In team collaboration, you need a platform that can show code quality trends, compare historical data and set quality gates—that is the stage for SonarQube. It not only integrates the checking capabilities of all these tools, but also provides an intuitive Web interface for managing and tracking code quality.

<!--以上为摘要内容-->

## What SonarQube Is

SonarQube is an open-source **continuous code quality and security management platform**. Its core value is not "adding one more checking algorithm", but:

- **Integration**: hundreds of built-in rules, integrating the capabilities of tools such as Checkstyle, PMD and SpotBugs
- **Visualisation**: a Web dashboard showing code quality trends, technical debt, coverage and other metrics
- **Continuous tracking**: quality data is recorded on every build, so you can compare the changes between any two builds
- **Quality Gate**: when the quality thresholds are not met, the build is blocked outright
- **Team collaboration**: assign issues, mark false positives, set remediation deadlines

### Architecture

```
Developer's machine → Maven/Gradle + SonarScanner → SonarQube Server (Web + DB)
                                                    ↓
                                              团队成员通过浏览器访问
```

SonarQube needs two components:

- **SonarQube Server**: the core service + Web UI
- **Database**: stores configuration and analysis results (supports PostgreSQL, MySQL, Oracle)

## Quick Setup

### Using Docker (the Simplest Way)

```bash
docker run -d --name sonarqube \
    -p 9000:9000 \
    -e SONARQUBE_JDBC_URL=jdbc:postgresql://localhost/sonarqube \
    -e SONARQUBE_JDBC_USERNAME=sonarqube \
    -e SONARQUBE_JDBC_PASSWORD=password \
    sonarqube:7.4-community
```

Visit `http://localhost:9000`; the default username and password are both `admin`.

### Manual Installation

Download the installation package for your platform from [sonarqube.org](https://www.sonarqube.org), unzip it, and then:

```bash
# Linux/Mac
bin/linux-x86-64/sonar.sh start

# Windows
bin\windows-x86-64\StartSonar.bat
```

After starting it, visit `http://localhost:9000` in the same way.

## Analysing a Project

### Installing SonarScanner (the Maven Way)

The simplest approach is to use the Maven plugin directly:

```bash
mvn sonar:sonar \
    -Dsonar.host.url=http://localhost:9000 \
    -Dsonar.login=your_token_here
```

Or configure it in `pom.xml`:

```xml
<properties>
    <sonar.host.url>http://your-sonarqube-server:9000</sonar.host.url>
    <sonar.projectKey>com.example:my-project</sonar.projectKey>
    <sonar.java.binaries>target/classes</sonar.java.binaries>
</properties>
```

Then run:

```bash
mvn clean verify sonar:sonar
```

### The Gradle Way

```groovy
plugins {
    id 'org.sonarqube' version '2.6.2'
}

sonarqube {
    properties {
        property 'sonar.host.url', 'http://localhost:9000'
        property 'sonar.projectKey', 'com.example:my-project'
    }
}
```

```bash
gradle sonarqube
```

### Standalone SonarScanner

If your project doesn't use Maven/Gradle (or you want to run it on its own), you can use the standalone SonarScanner CLI:

```bash
# After downloading
sonar-scanner \
    -Dsonar.projectKey=my-project \
    -Dsonar.sources=src \
    -Dsonar.java.binaries=target/classes \
    -Dsonar.host.url=http://localhost:9000
```

The project directory needs to contain a `sonar-project.properties` file:

```properties
sonar.projectKey=my-project
sonar.sources=src/main/java
sonar.java.binaries=target/classes
sonar.language=java
```

## The Quality Measurement System

SonarQube does not just "list problems"; it provides a complete system of code quality measurements:

### The Seven-Axis Quality Model

| Axis | Meaning | Typical Metrics |
|---|------|----------|
| **Bugs** | Code that causes errors | Number of bugs, severity level |
| **Vulnerabilities** | Security holes | Injection risks, leakage of sensitive information |
| **Code Smells** | Maintainability problems | Number of code smells |
| **Coverage** | Test coverage | Line coverage, branch coverage |
| **Duplications** | Duplicated code | Duplication rate %, number of duplicated blocks |
| **Size** | Code size | Lines, files, complexity |
| **Complexity** | Cyclomatic complexity | Complexity per method/file |

### Technical Debt

SonarQube quantifies code problems as "technical debt", measuring the cost of fixing them in **time**:

```
技术债务 = 所有 Code Smell 的预计修复时间之和

例如：修复所有 Code Smells 预计需要 3 天
```

With `技术债务比率 = 技术债务 / (每行开发成本 × 总行数)`, you get a percentage metric that reflects a project's health more intuitively.

### Quality Gate

This is one of SonarQube's most powerful features. You define a set of conditions, and if the new code does not satisfy them, the build fails outright:

The default `Sonar way` quality gate:

- 0 bugs in new code
- 0 vulnerabilities in new code
- The number of Code Smells in new code does not increase
- Coverage on new code is not lower than 80%
- Duplication rate on new code is not higher than 3%

Example of a custom quality gate:

```
Quality Gate: "My Team Standard"

条件：
  - Blocker issues: 0
  - Critical issues: < 5
  - Coverage on new code: > 80%
  - Duplicated lines on new code: < 3%
  - Maintainability Rating: A
  - Security Rating: A
```

You can set different quality gates for different projects—core business modules can be stricter, while utility scripts can be relaxed.

## Continuous Tracking and Trends

SonarQube's greatest value shows **after you have used it for a while**:

- **Trend chart**: the curve of bug counts, so you can see at a glance whether things are improving or getting worse
- **Hotspot map**: where code changes most frequently, which is often also where the most bugs are
- **Leak Period**: focus only on issues added "since a certain point in time", to avoid being drowned by historical debt

The philosophy of Leak Period is very practical: **problems in old code can be paid off slowly, but new code must not add new problems.**

## Project Management and Collaboration

### Assigning Issues

In SonarQube you can assign issues to specific developers:

```
Bug found → assign to the owner → mark as confirmed → fix → mark as resolved → verify → close
```

### Marking False Positives

Not every detected problem is a real bug. SonarQube lets you mark one as a false positive and fill in the reason:

```
Issue → mark as "Won't Fix" or "False Positive" → fill in an explanation → not reported in the next analysis
```

### Integrating CI/CD

Integrate SonarQube analysis into CI tools such as Jenkins to form a complete quality pipeline:

```
Git Push → Jenkins trigger → compilation → unit tests → SonarQube analysis
    ↓                                                ↓
  开发者                                          Web UI 查看
    ↑                                                ↓
    ←←← quality gate failed, sent back for fixing ←←←←←←←←←←←←←←←←←←
```

After installing the `SonarQube Scanner` plugin in Jenkins, you can call it directly in a Pipeline:

```groovy
stage('SonarQube Analysis') {
    steps {
        withSonarQubeEnv('SonarQube Server') {
            sh 'mvn sonar:sonar'
        }
    }
}

stage('Quality Gate') {
    steps {
        timeout(time: 1, unit: 'HOURS') {
            waitForQualityGate abortPipeline: true
        }
    }
}
```

## Community Edition vs Commercial Edition

The Community Edition of SonarQube 7.x already includes:

- All the rules for Java language analysis
- Quality gates
- Technical debt calculation
- Web UI and dashboards

The commercial edition additionally provides:

- Branch analysis and PR decoration (showing issues directly in GitHub/Bitbucket PRs)
- Support for more languages (C/C++, C#, etc.)
- Portfolio view

For Java projects, the Community Edition is entirely sufficient; you don't need the commercial edition.

## Summary

SonarQube is the "ultimate solution" introduced in this series—it doesn't just do static analysis, it also turns the analysis results into assets that can be managed, tracked and quantified. If you want to build a code quality culture in your team, SonarQube is the bridge that takes the concept of "code quality" from abstract to concrete.

That concludes the six articles in this series. To summarise:

| Tool | One-line positioning |
|------|-----------|
| Checkstyle | Governs code formatting, making code look tidy |
| PMD | Governs coding style, finding bad practices |
| FindBugs | Bytecode analysis, finding real bugs (no longer maintained) |
| SpotBugs | FindBugs' successor, continuously evolving |
| SonarQube | Integrates everything, providing a management platform and quality gates |

Going from Checkstyle to SonarQube is the evolutionary path of code quality from "personal habit" to "team engineering". Choose the tool that suits your team, and starting today, make static analysis part of your build pipeline.

A small step forward every day is a new height!
