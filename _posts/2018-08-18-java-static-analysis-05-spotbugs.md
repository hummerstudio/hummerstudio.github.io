---
title: Java 静态代码检查（五）：SpotBugs——FindBugs 的继任者
author: 唐明
categories: [build]
tags: [Java, 静态检查, SpotBugs, FindBugs, 代码质量]
---

上一篇文章介绍了 FindBugs——一款传奇的字节码级 Bug 检查工具，但它已在 2016 年停止维护。好在社区没有让它沉寂：**SpotBugs 作为 FindBugs 的正式继任者**，继承了其全部 Bug 模式和分析引擎，并持续增加新特性和对新版本 Java 的支持。如果你正在寻找一款“活着的”字节码级静态检查工具，SpotBugs 就是答案。

<!--以上为摘要内容-->

## SpotBugs 是什么

SpotBugs 是 FindBugs 的社区 fork，于 2016 年底启动，由原本 FindBugs 的贡献者维护。它的定位是 FindBugs 的**直接继承和进化**：

- **完全兼容**：所有 FindBugs 的 Bug 检测器（Detector）都保留，检测结果一致
- **持续更新**：支持 Java 8、9、10、11 的新语法和 API
- **社区活跃**：版本迭代稳定，Bug 修复及时
- **插件生态**：可以通过 `findsecbugs` 等插件扩展安全检查能力

一句话：**能跑 FindBugs 的地方就能跑 SpotBugs，但 SpotBugs 能检查的 FindBugs 不一定能查到。**

## 快速上手

### Maven 集成

SpotBugs 提供了自己的 Maven 插件，用法比 FindBugs 更简洁：

```xml
<plugin>
    <groupId>com.github.spotbugs</groupId>
    <artifactId>spotbugs-maven-plugin</artifactId>
    <version>3.1.8</version>
    <configuration>
        <effort>Max</effort>
        <threshold>Low</threshold>
        <xmlOutput>true</xmlOutput>
    </configuration>
    <executions>
        <execution>
            <phase>verify</phase>
            <goals>
                <goal>check</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

执行检查：

```bash
mvn verify
# 或直接运行
mvn spotbugs:check
# 查看报告（含图形界面）
mvn spotbugs:gui
```

### Gradle 集成

```groovy
plugins {
    id 'com.github.spotbugs' version '1.6.2'
}

spotbugs {
    effort = 'max'
    reportLevel = 'low'
}

tasks.withType(com.github.spotbugs.SpotBugsTask) {
    reports {
        xml.enabled = false
        html.enabled = true
    }
}
```

### 从 FindBugs 迁移

如果你已经在用 FindBugs，迁移到 SpotBugs 几乎零成本：

1. **Maven**：把 `findbugs-maven-plugin` 换成 `spotbugs-maven-plugin`，配置参数基本兼容
2. **注解**：把 `import edu.umd.cs.findbugs.annotations.*` 换成 `import edu.umd.cs.findbugs.annotations.*`（注解命名空间保留，无需改代码）
3. **过滤器文件**：完全兼容，不需要修改

## SpotBugs 的新特性

### 支持新版本 Java

FindBugs 停在了 Java 8 时代。SpotBugs 持续跟进：

- **Java 9/10/11**：支持 `var` 类型推断、模块系统、新的 API
- **Java 8 Lambda**：改进对 Lambda 和 Stream API 的分析
- **Try-with-resources**：支持分析资源自动关闭的写法

### 新增检测器

SpotBugs 新增了一些 FindBugs 没有的 Bug 检测器，例如：

- **DMI_RANDOM_USED_ONLY_ONCE**：`Random` 对象只用了一次，seed 未变化，导致每次结果相同
- **RCN_REDUNDANT_NULLCHECK_OF_NULL_VALUE**：对已知为 null 的值做了多余的判空
- **RV_RETURN_VALUE_IGNORED_NO_SIDE_EFFECT**：调用了一个没有副作用且返回值被忽略的方法

### 插件机制

SpotBugs 支持插件来扩展检查能力。最值得关注的是 **Find Security Bugs**：

```xml
<plugin>
    <groupId>com.github.spotbugs</groupId>
    <artifactId>spotbugs-maven-plugin</artifactId>
    <version>3.1.8</version>
    <configuration>
        <plugins>
            <plugin>
                <groupId>com.h3xstream.findsecbugs</groupId>
                <artifactId>findsecbugs-plugin</artifactId>
                <version>1.8.0</version>
            </plugin>
        </plugins>
    </configuration>
</plugin>
```

安装后能检测的安全问题包括：

- SQL 注入
- XSS 跨站脚本
- 硬编码密码
- 不安全的加密算法（MD5、SHA1）
- 路径遍历漏洞

## 实战配置示例

一个完整的生产级 SpotBugs 配置：

```xml
<plugin>
    <groupId>com.github.spotbugs</groupId>
    <artifactId>spotbugs-maven-plugin</artifactId>
    <version>3.1.8</version>
    <configuration>
        <effort>Max</effort>
        <threshold>Low</threshold>
        <xmlOutput>true</xmlOutput>
        <excludeFilterFile>spotbugs-exclude.xml</excludeFilterFile>
        <!-- 集成安全检测插件 -->
        <plugins>
            <plugin>
                <groupId>com.h3xstream.findsecbugs</groupId>
                <artifactId>findsecbugs-plugin</artifactId>
                <version>1.8.0</version>
            </plugin>
        </plugins>
    </configuration>
    <executions>
        <execution>
            <phase>verify</phase>
            <goals><goal>check</goal></goals>
        </execution>
    </executions>
</plugin>
```

### 常用排除配置

`spotbugs-exclude.xml`：

```xml
<FindBugsFilter>
    <!-- 忽略所有自动生成的代码 -->
    <Match>
        <Source name="~.*generated.*"/>
    </Match>
    <!-- 忽略 DTO 中的字段直接赋值警告 -->
    <Match>
        <Bug pattern="EI_EXPOSE_REP,EI_EXPOSE_REP2"/>
        <Class name="~.*Dto"/>
    </Match>
    <!-- 忽略特定类的特定问题 -->
    <Match>
        <Bug pattern="NP_NULL_ON_SOME_PATH_FROM_RETURN_VALUE"/>
        <Class name="com.example.legacy.OldService"/>
    </Match>
</FindBugsFilter>
```

### 抑制特定警告

```java
import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;

@SuppressFBWarnings(
    value = "DMI_RANDOM_USED_ONLY_ONCE",
    justification = "此处只需要一个随机值，不是 Bug")
public class RandomTokenGenerator {
    // ...
}
```

## 优先级和严重程度

SpotBugs 沿用了 FindBugs 的优先级体系：

| Rank | 严重程度 | 说明 |
|------|---------|------|
| 1-4 | Scariest | 几乎肯定是 Bug，必须修复 |
| 5-9 | Scary | 很可能是 Bug，强烈建议修复 |
| 10-14 | Troubling | 可能是 Bug，建议检查 |
| 15-20 | Normal | 风格问题，建议改进 |

建议在 CI 中将阈值设为 `Low`（即报告所有问题），但 Quality Gate 只卡 rank 1-14 的问题（即 `threshold` 设为 `Low`，让团队在报告中看到所有问题，但只强制修复严重问题）。

## IDE 集成

### IntelliJ IDEA

安装 **SpotBugs** 插件（注意不是 FindBugs 插件），在 `Preferences → Other Settings → SpotBugs` 中配置规则。插件支持代码内高亮显示问题。

### Eclipse

安装 **SpotBugs Eclipse Plugin**，可以实时扫描，标记问题代码行，并提供快速修复建议。

## 小结

SpotBugs 是 FindBugs 的“正统续作”——继承了它的全部能力，并持续进化。对于所有 Java 项目，如果只能选一款静态 Bug 检查工具，SpotBugs 是最推荐的：它分析字节码、Bug 模式精准、误报率低、生态成熟。配合 Find Security Bugs 插件，还能覆盖安全漏洞检测。

下一篇是本系列的最后一篇，介绍 SonarQube——一个把这些工具“全包了”的综合性代码质量平台。

每天前进一小步，就是一个新的高度！
