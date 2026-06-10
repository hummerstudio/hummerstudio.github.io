---
title: Ant条件判断——if/unless和condition的使用
author: 唐明
categories: [build]
tags: [Ant, 条件判断]
---

Ant 没有编程语言那样的 `if/else`，但提供了 `if`/`unless` 属性和 `<condition>` 任务来实现条件逻辑。

<!--以上为摘要内容-->

## target 的 if/unless

最简单的条件控制——根据某个属性是否存在来决定是否执行 target：

```xml
<target name="deploy" depends="build" if="do.deploy">
    <echo message="开始部署..." />
</target>

<target name="clean" unless="keep.temp">
    <delete dir="temp/" />
</target>
```

- `if="do.deploy"`：属性 `do.deploy` 已设置时才执行
- `unless="keep.temp"`：属性 `keep.temp` 未设置时才执行

使用时：

```bash
# 执行部署
ant -Ddo.deploy=true

# 跳过清理
ant -Dkeep.temp=true
```

## condition 任务

用于设置属性值的条件判断：

```xml
<!-- 判断文件是否存在 -->
<condition property="config.exists">
    <available file="config.xml" />
</condition>

<!-- 判断目录是否存在 -->
<condition property="build.dir.exists">
    <available file="build/" type="dir" />
</condition>

<!-- 判断 class 是否存在 -->
<condition property="junit.available">
    <available classname="org.junit.Test" />
</condition>
```

## 组合条件

用 `<and>`、`<or>`、`<not>` 组合多个条件：

```xml
<condition property="can.deploy">
    <and>
        <available file="release/app.jar" />
        <isset property="deploy.server" />
        <not>
            <equals arg1="${env}" arg2="dev" />
        </not>
    </and>
</condition>
```

## 字符串比较

```xml
<condition property="is.production" value="true" else="false">
    <equals arg1="${env}" arg2="production" />
</condition>

<condition property="version.ok">
    <matches string="${app.version}" pattern="^\d+\.\d+\.\d+$" />
</condition>
```

## fail 提前退出

条件不满足时让构建失败：

```xml
<fail message="JAVA_HOME 未设置！">
    <condition>
        <not>
            <isset property="env.JAVA_HOME" />
        </not>
    </condition>
</fail>
```

## 文件大小比较

```xml
<condition property="jar.too.large">
    <length file="release/app.jar" when="greater" length="50000000" />
</condition>
<fail if="jar.too.large" message="jar 包超过 50MB！" />
```

## 实用示例：根据环境选择不同配置

```xml
<condition property="config.file" value="config.prod.properties" else="config.dev.properties">
    <equals arg1="${env}" arg2="production" />
</condition>
<property file="${config.file}" />
```

每天前进一小步，就是一个新的高度！
