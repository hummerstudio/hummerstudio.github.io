---
title: Java 代码覆盖率（二）：JaCoCo 实战，从跑起来到看懂报告
author: 唐明
categories: [test]
tags: [Java, 代码覆盖率, JaCoCo, Maven]
---

上一篇文章理清了覆盖率的概念和历史。现在该让 JaCoCo 跑起来了。从 Maven 配置到报告解读，从排坑到集成 SonarQube——这篇文章的目标是：看完就能在你的项目里用上覆盖率。

<!--以上为摘要内容-->

## JaCoCo 是什么

JaCoCo（Java Code Coverage）是当前 Java 唯一的、统治级的覆盖率工具。它是 Emma 作者的“重新出发”——吸收了 Emma 和 Cobertura 的所有教训，用全新的架构重写。

核心特点：
- **运行时插桩**：不需要修改 class 文件，JVM 加载时动态插桩
- **多层次度量**：指令、分支、行、方法、类——五个维度
- **零配置启动**：Maven/Gradle 加一个插件依赖就能用
- **和 SonarQube 原生集成**：SonarQube 默认用 JaCoCo 的报告格式

## Maven 集成

### 最小配置

在 `pom.xml` 的 `<build><plugins>` 中加入：

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.2</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

`prepare-agent` 在测试前启动 JaCoCo 的运行时 agent，`report` 在测试后生成报告。

### 跑测试 + 生成报告

```bash
mvn clean test
```

报告在 `target/site/jacoco/index.html`，用浏览器打开即可。

### 检查覆盖率是否达标

如果你的团队有覆盖率硬性要求（如“必须 ≥ 80%”），加上 check 目标：

```xml
<execution>
    <id>check</id>
    <goals>
        <goal>check</goal>
    </goals>
    <configuration>
        <rules>
            <rule>
                <element>PACKAGE</element>
                <limits>
                    <limit>
                        <counter>LINE</counter>
                        <value>COVEREDRATIO</value>
                        <minimum>0.80</minimum>
                    </limit>
                </limits>
            </rule>
        </rules>
    </configuration>
</execution>
```

如果行覆盖率不达标，构建直接失败：

```
[ERROR] Rule violated for package com.example: lines covered ratio is 0.75, but expected minimum is 0.80
```

### 完整配置示例

一个实际项目使用的完整配置：

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.2</version>
    <executions>
        <!-- 1. 启动 agent，为所有测试做准备 -->
        <execution>
            <id>pre-test</id>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <!-- 2. 测试完成后生成报告 -->
        <execution>
            <id>post-test</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
        <!-- 3. 检查覆盖率阈值 -->
        <execution>
            <id>check</id>
            <goals>
                <goal>check</goal>
            </goals>
            <configuration>
                <rules>
                    <rule>
                        <element>BUNDLE</element>
                        <limits>
                            <limit>
                                <counter>INSTRUCTION</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.70</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

### 排除不需要统计的代码

你的项目里肯定有人畜无害的代码不需要被覆盖率盯上：

```xml
<configuration>
    <excludes>
        <!-- 排除配置类 -->
        <exclude>com/example/config/**</exclude>
        <!-- 排除 DTO -->
        <exclude>com/example/dto/**</exclude>
        <!-- 排除常量 -->
        <exclude>com/example/constant/**</exclude>
    </excludes>
</configuration>
```

排除的原则：**自动生成的代码、纯数据结构（getter/setter）、配置类**——这些的覆盖率没有意义。

## 解读覆盖率报告

打开 `target/site/jacoco/index.html`，你会看到这样的页面：

### 顶层仪表盘

```
Element     Missed Instructions  Cov.      Missed Branches  Cov.
─────────────────────────────────────────────────────────────
com.example         1,234 of 5,000  75%        45 of 120    62%
  ├─ service          560 of 2,000  72%        20 of 60     66%
  ├─ controller       320 of 1,500  78%        10 of 30     66%
  ├─ model            200 of 1,000  80%        10 of 20     50%
  └─ util             154 of 500    69%         5 of 10     50%
```

**绿色条越长 = 覆盖率越高，红色条越长 = 未覆盖越多。**

点击某个包，进入类列表。再点某个类，进入源码级别的报告。

### 源码着色

```java
// 绿色背景：完全覆盖
 1  public class Calculator {
 2      public int divide(int a, int b) {
 3          if (b == 0) {           // 绿色
 4              return 0;           // 红色（你没测 b==0 的情况？）
 5          }
 6          return a / b;           // 绿色
 7      }
 8
 9      public int multiply(int a, int b) {
10          return a * b;           // 绿色
11      }
12  }
```

颜色含义：

| 颜色 | 含义 |
|------|------|
| 🟢 绿色 | 所有指令都执行了 |
| 🟡 黄色 | 部分指令执行了（比如分支只走了一边） |
| 🔴 红色 | 完全没有执行过 |

钻石符号（◆）代表分支覆盖情况：绿钻 = 两个分支都走了，红钻 = 只走了一个分支。

### 五个关键计数器

点击一个方法，可以看到更详细的计数器：

```
Method: divide(int, int)

Instructions:
  Missed:  2        ← 两条字节码指令没跑
  Covered: 6        ← 六条跑了
  Total:   8        ← 覆盖率 75%

Branches:
  Missed:  1        ← 一个分支没走（b==0 那条路）
  Covered: 1        ← 一个分支走了（b!=0 那条路）
  Total:   2        ← 覆盖率 50%

Lines:
  Missed:  1        ← 第 4 行没跑到
  Covered: 3        ← 第 1、3、6 行跑到了

Complexity:
  Missed:  1        ← 一条路径没覆盖
  Covered: 1
  Total:   2
```

解读重点：

- **Instructions**（指令覆盖率）是最严格的指标——它衡量字节码级别
- **Branches**（分支覆盖率）暴露逻辑盲区——if/else 是否都测了
- **Lines**（行覆盖率）最简单直观，但也是最粗糙的（一行可能对应多条指令）
- **Complexity**（圈复杂度覆盖率）衡量每条执行路径是否都走了

## Gradle 集成

如果你用 Gradle：

```groovy
plugins {
    id 'jacoco'
}

jacocoTestReport {
    reports {
        xml.enabled true
        html.enabled true
    }
}

jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = 0.80
            }
        }
    }
}
```

```bash
gradle test jacocoTestReport
```

报告在 `build/reports/jacoco/test/html/index.html`。

## 把报告喂给 SonarQube

JaCoCo 生成的报告格式是 SonarQube 原生支持的。只需让 SonarQube 知道报告文件在哪里：

在项目的 `pom.xml` 或 `sonar-project.properties` 中：

```properties
sonar.jacoco.reportPaths=target/jacoco.exec
```

确保 JaCoCo 生成了 `jacoco.exec` 文件（这是 agent 自动产生的二进制覆盖率数据）：

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <executions>
        <execution>
            <id>pre-test</id>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
            <configuration>
                <!-- 指定 exec 文件路径 -->
                <destFile>${project.build.directory}/jacoco.exec</destFile>
            </configuration>
        </execution>
    </executions>
</plugin>
```

然后在 CI 流水线中：

```bash
mvn clean test sonar:sonar \
    -Dsonar.host.url=http://your-sonarqube:9000 \
    -Dsonar.jacoco.reportPaths=target/jacoco.exec
```

SonarQube 会自动读取覆盖率数据，结合之前设置的质量门禁，给出通过/阻断判断。

## CI 流水线中的实践

在 Jenkins Pipeline 中的典型用法：

```groovy
stage('Test & Coverage') {
    steps {
        sh 'mvn clean test'
    }
    post {
        always {
            // 即使测试有失败，也发布覆盖率报告
            jacoco(
                execPattern: '**/target/jacoco.exec',
                classPattern: '**/target/classes',
                sourcePattern: '**/src/main/java'
            )
            // Jenkins 会展示覆盖率趋势图
        }
    }
}
```

Jenkins 的 JaCoCo 插件会生成历史趋势图——可以看到每次构建的覆盖率是上升还是下降：

```
覆盖率趋势
95% ┤
90% ┤     ┌──────
85% ┤    ╱
80% ┤───╱
    └───┬───┬───┬───┬───
       #1  #2  #3  #4  #5
```

下降趋势 = 新代码没写测试，需要关注。

## 常见问题

### 覆盖率总是 0%？

检查：
1. `prepare-agent` 有没有配置？
2. `maven-surefire-plugin` 的 `forkCount` 是否为 0？（fork 模式下 JaCoCo agent 参数可能没传过去）

```xml
<plugin>
    <artifactId>maven-surefire-plugin</artifactId>
    <configuration>
        <argLine>${argLine}</argLine>  <!-- 关键！确保 JaCoCo 参数传到 forked JVM -->
    </configuration>
</plugin>
```

`${argLine}` 是 JaCoCo 的 `prepare-agent` 自动设置的属性，包含 `-javaagent:jacocoagent.jar=...`。如果不加这行，agent 参数就丢了。

### 多模块项目怎么聚合？

父 pom 中加入：

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <executions>
        <execution>
            <id>report-aggregate</id>
            <phase>verify</phase>
            <goals>
                <goal>report-aggregate</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

会生成一个包含所有子模块的聚合报告。

### 覆盖率数字虚高？

JaCoCo 比 Cobertura 好很多，但仍有一个认知误区：**只加载了被测试碰过的类**的情况。如果某些代码路径完全没跑到，它们不会被计入覆盖率（因为类都没被加载）。

解决：用 `FULLY` 模式，JaCoCo 从 0.8.0 开始默认就是全量模式，不用担心。

## 小结

JaCoCo 的使用总结为三步：

```
1. 加插件依赖（prepare-agent + report）
2. mvn test（自动插桩 + 采集 + 生成报告）
3. 看 target/site/jacoco/index.html
```

它不是一个需要“学会”的工具——它是那种“配置好就静默运行”的基础设施。真正的门槛不在工具本身，而在于：**你拿到覆盖率数字后，愿不愿意花时间去补那 20% 的盲区？**

最后记住：覆盖率是**下限**指标，不是上限。覆盖率 80% 不说明你测试写得好，只说明你没漏掉 80% 的代码没跑。测试的质量，最终还是要靠人来设计。

每天前进一小步，就是一个新的高度！
