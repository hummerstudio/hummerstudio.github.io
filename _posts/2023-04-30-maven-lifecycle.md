---
title: Maven生命周期和常用命令速查
author: 唐明
categories: [build]
tags: [Maven, 生命周期]
---

Maven 围绕"生命周期"（Lifecycle）组织构建过程，理解生命周期是掌握 Maven 的关键。

<!--以上为摘要内容-->

## 三大生命周期

Maven 有三个独立的内置生命周期：

| 生命周期 | 用途 | 典型阶段 |
|----------|------|----------|
| default | 项目构建和部署 | compile → test → package → install → deploy |
| clean | 清理项目 | pre-clean → clean → post-clean |
| site | 生成项目站点文档 | pre-site → site → post-site → site-deploy |

## default 生命周期核心阶段

按顺序执行，后面的阶段会先触发前面的：

```
validate     → 验证项目结构
compile      → 编译源代码
test         → 运行单元测试
package      → 打包（jar/war）
verify       → 运行集成测试，检查包质量
install      → 安装到本地仓库
deploy       → 部署到远程仓库
```

## 常用命令

```bash
# 编译
mvn compile

# 编译 + 运行测试
mvn test

# 编译 + 测试 + 打包
mvn package

# 跳过测试打包
mvn package -DskipTests

# 安装到本地仓库（~/.m2/repository/）
mvn install

# 清理 + 安装
mvn clean install

# 部署到远程仓库
mvn deploy
```

## 阶段（Phase）和插件目标（Goal）

阶段是生命周期中的一步，每个阶段绑定了一个或多个插件目标：

```
compile 阶段 → maven-compiler-plugin:compile
test    阶段 → maven-surefire-plugin:test
package 阶段 → maven-jar-plugin:jar
```

直接执行插件目标（跳过生命周期）：

```bash
mvn dependency:tree
mvn versions:display-dependency-updates
```

格式是 `插件前缀:目标名`。

## clean 生命周期

```bash
# 只清理
mvn clean

# 清理后重新打包
mvn clean package
```

## 多模块构建

父项目执行命令时，Maven 按依赖顺序在各子模块中依次执行：

```bash
# 在父 pom.xml 目录下
mvn clean install
```

只构建某个模块：

```bash
mvn clean install -pl module-a -am
```

- `-pl module-a`：指定模块
- `-am`（also-make）：同时构建依赖它的模块

## 查看有效 pom

```bash
mvn help:effective-pom
```

输出合并了父 pom 和 settings.xml 后的最终配置，排查问题时非常有用。

每天前进一小步，就是一个新的高度！
