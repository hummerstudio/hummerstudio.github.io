---
title: Maven Lifecycle and Common Commands Quick Reference
date: 2023-04-30
author: Tang Moying
categories: [build]
tags: [Maven, Life Cycle]
lang: en
alt_url: /post/maven-lifecycle
---

Maven organises the build process around lifecycles, and understanding the lifecycle is the key to mastering Maven.

<!--以上为摘要内容-->

## The Three Lifecycles

Maven has three independent built-in lifecycles:

| Lifecycle | Purpose | Typical phases |
|----------|------|----------|
| default | Project build and deployment | compile → test → package → install → deploy |
| clean | Clean the project | pre-clean → clean → post-clean |
| site | Generate project site documentation | pre-site → site → post-site → site-deploy |

## Core Phases of the default Lifecycle

They run in order, and a later phase first triggers the earlier ones:

```
validate     → validate the project structure
compile      → compile the source code
test         → run unit tests
package      → package (jar/war)
verify       → run integration tests, check package quality
install      → install to the local repository
deploy       → deploy to a remote repository
```

## Common Commands

```bash
# compile
mvn compile

# compile + run tests
mvn test

# compile + test + package
mvn package

# package while skipping tests
mvn package -DskipTests

# install to the local repository (~/.m2/repository/)
mvn install

# clean + install
mvn clean install

# deploy to a remote repository
mvn deploy
```

## Phases and Plugin Goals

A phase is a step within the lifecycle, and each phase is bound to one or more plugin goals:

```
compile phase → maven-compiler-plugin:compile
test    phase → maven-surefire-plugin:test
package phase → maven-jar-plugin:jar
```

Executing a plugin goal directly (skipping the lifecycle):

```bash
mvn dependency:tree
mvn versions:display-dependency-updates
```

The format is `插件前缀:目标名` (plugin prefix:goal name).

## The clean Lifecycle

```bash
# clean only
mvn clean

# clean and then package again
mvn clean package
```

## Multi-Module Builds

When you run a command on the parent project, Maven executes it in each submodule in turn, in dependency order:

```bash
# in the directory of the parent pom.xml
mvn clean install
```

To build only one module:

```bash
mvn clean install -pl module-a -am
```

- `-pl module-a`: specify the module
- `-am` (also-make): also build the modules that depend on it

## Viewing the Effective POM

```bash
mvn help:effective-pom
```

It outputs the final configuration after merging the parent pom and settings.xml, which is very useful when troubleshooting.

A small step forward every day is a new height!
