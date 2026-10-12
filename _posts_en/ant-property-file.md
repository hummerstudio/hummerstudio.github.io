---
title: Loading and Using Property Files in Ant
date: 2023-04-15
author: Tang Moying
categories: [build]
tags: [Ant, Property]
lang: en
alt_url: /post/ant-property-file
---

Ant build scripts often need to configure variable parameters (such as server addresses and version numbers); managing them through a property file is good practice.

<!--以上为摘要内容-->

## Loading a property file

In `build.xml`, use the `<property>` tag to load a `.properties` file:

```xml
<property file="build.properties" />
```

`build.properties` example:

```properties
app.version=1.2.3
deploy.server=192.168.1.100
deploy.port=22
deploy.user=admin
```

## Using properties

Reference them with `${property.name}`:

```xml
<echo message="Deploying to: ${deploy.server}:${deploy.port}" />
<echo message="Current version: ${app.version}" />
```

## Loading multiple property files

Properties loaded later do not override same-named properties already loaded (whichever is loaded first has higher priority):

```xml
<!-- Default configuration -->
<property file="build.default.properties" />
<!-- Local override configuration (optional) -->
<property file="build.local.properties" />
```

This way the team shares `build.default.properties`, while individuals use `build.local.properties` to override their local differences.

## Distinguishing sources with a prefix

```xml
<property file="build.properties" prefix="build" />
<property file="deploy.properties" prefix="deploy" />
```

Add the prefix when referencing:

```xml
<echo message="${build.version}" />
<echo message="${deploy.server}" />
```

## Reading from environment variables

```xml
<property environment="env" />
<echo message="JAVA_HOME: ${env.JAVA_HOME}" />
```

## Properties are immutable

Once an Ant property is set it cannot be changed. If you need different values at different stages, you can use `<local>` to override it within a local scope (Ant 1.8+):

```xml
<local name="my.var" />
<property name="my.var" value="新值" />
```

A small step forward every day is a new height!
