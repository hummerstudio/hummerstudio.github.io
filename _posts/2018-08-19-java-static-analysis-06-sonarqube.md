---
title: Java 静态代码检查（六）：用 SonarQube 搭建持续代码质量平台
author: 唐明
categories: [test]
tags: [Java, 静态检查, SonarQube, 代码质量]
---

前面介绍了 Checkstyle、PMD、FindBugs、SpotBugs 四款工具，它们各有侧重，但有一个共同的局限：只适合“一个人看”。在团队协作中，你需要一个能看到代码质量趋势、对比历史数据、设置质量门禁的平台——这就是 SonarQube 的舞台。它不仅整合了所有这些工具的检查能力，还提供了一个直观的 Web 界面来管理和追踪代码质量。

<!--以上为摘要内容-->

## SonarQube 是什么

SonarQube 是一个开源的**代码质量和安全持续管理平台**。它的核心价值不是“新增一种检查算法”，而是：

- **整合**：内置数百条规则，整合了 Checkstyle、PMD、SpotBugs 等工具的能力
- **可视化**：Web 仪表盘展示代码质量趋势、技术债务、覆盖率等指标
- **持续追踪**：每次构建都记录质量数据，可以对比任意两次构建之间的变化
- **质量门禁（Quality Gate）**：不满足质量阈值时，直接阻断构建
- **团队协作**：分配问题、标记误报、设定修复期限

### 架构

```
开发者本地 → Maven/Gradle + SonarScanner → SonarQube Server（Web + DB）
                                                    ↓
                                              团队成员通过浏览器访问
```

SonarQube 需要两个组件：

- **SonarQube Server**：核心服务 + Web UI
- **数据库**：存储配置和分析结果（支持 PostgreSQL、MySQL、Oracle）

## 快速搭建

### 使用 Docker（最简单）

```bash
docker run -d --name sonarqube \
    -p 9000:9000 \
    -e SONARQUBE_JDBC_URL=jdbc:postgresql://localhost/sonarqube \
    -e SONARQUBE_JDBC_USERNAME=sonarqube \
    -e SONARQUBE_JDBC_PASSWORD=password \
    sonarqube:7.4-community
```

访问 `http://localhost:9000`，默认用户名密码都是 `admin`。

### 手动安装

从 [sonarqube.org](https://www.sonarqube.org) 下载对应平台的安装包，解压后：

```bash
# Linux/Mac
bin/linux-x86-64/sonar.sh start

# Windows
bin\windows-x86-64\StartSonar.bat
```

启动后同样访问 `http://localhost:9000`。

## 分析项目

### 安装 SonarScanner（Maven 方式）

最简单的方式是直接用 Maven 插件：

```bash
mvn sonar:sonar \
    -Dsonar.host.url=http://localhost:9000 \
    -Dsonar.login=your_token_here
```

或者在 `pom.xml` 中配置：

```xml
<properties>
    <sonar.host.url>http://your-sonarqube-server:9000</sonar.host.url>
    <sonar.projectKey>com.example:my-project</sonar.projectKey>
    <sonar.java.binaries>target/classes</sonar.java.binaries>
</properties>
```

然后运行：

```bash
mvn clean verify sonar:sonar
```

### Gradle 方式

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

### 独立 SonarScanner

如果你的项目不用 Maven/Gradle（或者想单独运行），可以用独立的 SonarScanner CLI：

```bash
# 下载后
sonar-scanner \
    -Dsonar.projectKey=my-project \
    -Dsonar.sources=src \
    -Dsonar.java.binaries=target/classes \
    -Dsonar.host.url=http://localhost:9000
```

需要项目目录下有一个 `sonar-project.properties` 文件：

```properties
sonar.projectKey=my-project
sonar.sources=src/main/java
sonar.java.binaries=target/classes
sonar.language=java
```

## 质量度量体系

SonarQube 不只是“罗列问题”，它提供了一套完整的代码质量度量体系：

### 七轴质量模型

| 轴 | 含义 | 典型指标 |
|---|------|----------|
| **Bugs** | 导致错误的代码 | Bug 数量、严重等级 |
| **Vulnerabilities** | 安全漏洞 | 注入风险、敏感信息泄露 |
| **Code Smells** | 可维护性问题 | 代码坏味道数量 |
| **Coverage** | 测试覆盖率 | 行覆盖率、分支覆盖率 |
| **Duplications** | 重复代码 | 重复率 %、重复块数 |
| **Size** | 代码规模 | 行数、文件数、复杂度 |
| **Complexity** | 圈复杂度 | 每个方法/文件的复杂度 |

### 技术债务

SonarQube 将代码问题量化为“技术债务”（Technical Debt），用**时间**来衡量修复成本：

```
技术债务 = 所有 Code Smell 的预计修复时间之和

例如：修复所有 Code Smells 预计需要 3 天
```

通过 `技术债务比率 = 技术债务 / (每行开发成本 × 总行数)`，可以得到一个百分比指标，更直观地反映项目健康程度。

### 质量门禁（Quality Gate）

这是 SonarQube 最强大的功能之一。你定义一组条件，如果新代码不满足条件，构建直接失败：

默认的 `Sonar way` 质量门禁：

- 新增代码的 Bug 数为 0
- 新增代码的漏洞数为 0
- 新增代码的 Code Smell 数不增加
- 新增代码的覆盖率不低于 80%
- 新增代码的重复率不高于 3%

自定义质量门禁示例：

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

你可以为不同项目设置不同的质量门禁——核心业务模块可以更严格，工具脚本可以放宽。

## 持续跟踪与趋势

SonarQube 最大的价值体现在**运用一段时间后**：

- **趋势图**：Bug 数量的变化曲线，一眼看出是在改善还是在恶化
- **热点图**：代码变更最频繁的地方，往往也是 Bug 最多的地方
- **Leak Period**：只关注“从某个时间点以来”新增的问题，避免被历史债务淹没

Leak Period 的哲学非常实用：**老代码的问题可以慢慢还，但新代码不能再加新问题。**

## 项目管理与协作

### 分配问题

SonarQube 中可以把问题分配给具体开发者：

```
发现 Bug → 分配给责任人 → 标记为已确认 → 修复 → 标记为已解决 → 验证 → 关闭
```

### 标记误报

不是所有检测出的问题都是真正的 Bug。SonarQube 允许标记为误报并填写原因：

```
问题 → 标记为"Won't Fix"或"False Positive" → 填写说明 → 下次分析不再报告
```

### 集成 CI/CD

将 SonarQube 分析集成到 Jenkins 等 CI 工具中，形成完整的质量流水线：

```
Git Push → Jenkins 触发 → 编译 → 单元测试 → SonarQube 分析
    ↓                                                ↓
  开发者                                          Web UI 查看
    ↑                                                ↓
    ←←← 质量门禁失败，打回修改 ←←←←←←←←←←←←←←←←←←
```

Jenkins 中安装 `SonarQube Scanner` 插件后，可以在 Pipeline 中直接调用：

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

## 社区版 vs 商业版

SonarQube 7.x 的社区版（Community Edition）已经包含：

- Java 语言分析的所有规则
- 质量门禁
- 技术债务计算
- Web UI 和仪表盘

商业版额外提供：

- 分支分析和 PR 装饰（直接在 GitHub/Bitbucket PR 中展示问题）
- 更多语言支持（C/C++、C# 等）
- 组合视图（Portfolio）

对于 Java 项目，社区版完全够用，不需要商业版。

## 小结

SonarQube 是本系列介绍的“终极方案”——它不仅做了静态检查，还把检查结果变成了可管理、可追踪、可量化的资产。如果你想在团队中建立代码质量文化，SonarQube 是让“代码质量”这个概念从抽象变具体的桥梁。

本系列六篇文章到此结束。总结一下：

| 工具 | 一句话定位 |
|------|-----------|
| Checkstyle | 管代码格式，让代码看起来整齐 |
| PMD | 管写法，发现不良实践 |
| FindBugs | 字节码分析，发现真正 Bug（已停更） |
| SpotBugs | FindBugs 继任者，持续进化 |
| SonarQube | 整合所有，提供管理平台和质量门禁 |

从 Checkstyle 到 SonarQube，是代码质量从“个人习惯”到“团队工程”的进化路径。选择适合你团队的工具，从今天开始，让静态检查成为构建流水线的一部分。

每天前进一小步，就是一个新的高度！
