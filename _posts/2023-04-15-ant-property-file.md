---
title: Ant中加载和使用属性文件
author: 唐明
categories: [build]
tags: [Ant, Property]
---

Ant 构建脚本中经常需要配置一些可变参数（如服务器地址、版本号等），通过属性文件统一管理是好习惯。

<!--以上为摘要内容-->

## 加载属性文件

在 `build.xml` 中使用 `<property>` 标签加载 `.properties` 文件：

```xml
<property file="build.properties" />
```

`build.properties` 示例：

```properties
app.version=1.2.3
deploy.server=192.168.1.100
deploy.port=22
deploy.user=admin
```

## 使用属性

用 `${property.name}` 引用：

```xml
<echo message="部署到：${deploy.server}:${deploy.port}" />
<echo message="当前版本：${app.version}" />
```

## 加载多个属性文件

后面的属性不会覆盖前面已加载的同名属性（先加载的优先级更高）：

```xml
<!-- 默认配置 -->
<property file="build.default.properties" />
<!-- 本地覆盖配置（可选） -->
<property file="build.local.properties" />
```

这样团队共享 `build.default.properties`，个人用 `build.local.properties` 覆盖本地差异。

## 用前缀区分来源

```xml
<property file="build.properties" prefix="build" />
<property file="deploy.properties" prefix="deploy" />
```

引用时加前缀：

```xml
<echo message="${build.version}" />
<echo message="${deploy.server}" />
```

## 从环境变量读取

```xml
<property environment="env" />
<echo message="JAVA_HOME: ${env.JAVA_HOME}" />
```

## 属性不可变

Ant 属性一旦设置就不能修改。如果需要在不同阶段使用不同值，可以用 `<local>` 在局部作用域内覆盖（Ant 1.8+）：

```xml
<local name="my.var" />
<property name="my.var" value="新值" />
```

每天前进一小步，就是一个新的高度！
