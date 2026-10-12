---
title: 'Java Code Coverage (Part 2): JaCoCo in Practice, from Getting It Running to Reading the Report'
date: 2018-09-08
author: Tang Moying
categories: [test]
tags: [Java, Code Coverage, JaCoCo, Maven]
lang: en
alt_url: /post/java-code-coverage-02-jacoco
---

The previous article sorted out the concept and history of code coverage. Now it's time to get JaCoCo actually running. From Maven configuration to reading the report, from troubleshooting to integrating SonarQube — the goal of this article is: by the time you finish reading it, you can put coverage to work in your own project.

<!--以上为摘要内容-->

## What Is JaCoCo

JaCoCo (Java Code Coverage) is currently the one and only dominant coverage tool for Java. It is the "fresh start" of Emma's author — it absorbed every lesson from Emma and Cobertura and was rewritten on a brand-new architecture.

Core features:
- **Runtime instrumentation**: no need to modify class files; instrumentation happens dynamically when the JVM loads them
- **Multi-level metrics**: instructions, branches, lines, methods, classes — five dimensions
- **Zero-configuration startup**: add one plugin dependency to Maven/Gradle and it works
- **Native integration with SonarQube**: SonarQube uses JaCoCo's report format by default

## Maven Integration

### Minimal Configuration

Add the following to `<build><plugins>` in `pom.xml`:

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

`prepare-agent` starts JaCoCo's runtime agent before the tests, and `report` generates the report after the tests.

### Run the Tests + Generate the Report

```bash
mvn clean test
```

The report is at `target/site/jacoco/index.html`; just open it in a browser.

### Checking Whether Coverage Meets the Threshold

If your team has a hard coverage requirement (such as "must be ≥ 80%"), add the check goal:

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

If line coverage falls short of the threshold, the build fails outright:

```
[ERROR] Rule violated for package com.example: lines covered ratio is 0.75, but expected minimum is 0.80
```

### Full Configuration Example

A full configuration used by one real project:

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.2</version>
    <executions>
        <!-- 1. Start the agent, preparing for all tests -->
        <execution>
            <id>pre-test</id>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <!-- 2. Generate the report after the tests finish -->
        <execution>
            <id>post-test</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
        <!-- 3. Check the coverage threshold -->
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

### Excluding Code That Doesn't Need to Be Counted

Your project certainly contains harmless code that doesn't need coverage breathing down its neck:

```xml
<configuration>
    <excludes>
        <!-- Exclude configuration classes -->
        <exclude>com/example/config/**</exclude>
        <!-- Exclude DTOs -->
        <exclude>com/example/dto/**</exclude>
        <!-- Exclude constants -->
        <exclude>com/example/constant/**</exclude>
    </excludes>
</configuration>
```

The principle for exclusion: **auto-generated code, pure data structures (getters/setters), configuration classes** — coverage for these is meaningless.

## Reading the Coverage Report

Open `target/site/jacoco/index.html` and you'll see a page like this:

### The Top-Level Dashboard

```
Element     Missed Instructions  Cov.      Missed Branches  Cov.
─────────────────────────────────────────────────────────────
com.example         1,234 of 5,000  75%        45 of 120    62%
  ├─ service          560 of 2,000  72%        20 of 60     66%
  ├─ controller       320 of 1,500  78%        10 of 30     66%
  ├─ model            200 of 1,000  80%        10 of 20     50%
  └─ util             154 of 500    69%         5 of 10     50%
```

**The longer the green bar, the higher the coverage; the longer the red bar, the more is uncovered.**

Click a package to go into its class list. Click a class to go into the source-level report.

### Source Coloring

```java
// Green background: fully covered
 1  public class Calculator {
 2      public int divide(int a, int b) {
 3          if (b == 0) {           // green
 4              return 0;           // red (you didn't test the b==0 case?)
 5          }
 6          return a / b;           // green
 7      }
 8
 9      public int multiply(int a, int b) {
10          return a * b;           // green
11      }
12  }
```

What the colors mean:

| Color | Meaning |
|------|------|
| 🟢 Green | Every instruction was executed |
| 🟡 Yellow | Some instructions were executed (e.g. only one side of a branch was taken) |
| 🔴 Red | Never executed at all |

The diamond symbol (◆) represents branch coverage: a green diamond = both branches were taken, a red diamond = only one branch was taken.

### The Five Key Counters

Click a method to see more detailed counters:

```
Method: divide(int, int)

Instructions:
  Missed:  2        ← two bytecode instructions never ran
  Covered: 6        ← six of them ran
  Total:   8        ← 75% coverage

Branches:
  Missed:  1        ← one branch not taken (the b==0 path)
  Covered: 1        ← one branch taken (the b!=0 path)
  Total:   2        ← 50% coverage

Lines:
  Missed:  1        ← line 4 never ran
  Covered: 3        ← lines 1, 3, 6 ran

Complexity:
  Missed:  1        ← one path not covered
  Covered: 1
  Total:   2
```

What matters when reading them:

- **Instructions** (instruction coverage) is the strictest metric — it measures at the bytecode level
- **Branches** (branch coverage) exposes blind spots in your logic — whether both the if and the else were tested
- **Lines** (line coverage) is the simplest and most intuitive, but also the coarsest (one line may correspond to several instructions)
- **Complexity** (cyclomatic complexity coverage) measures whether every execution path was taken

## Gradle Integration

If you use Gradle:

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

The report is at `build/reports/jacoco/test/html/index.html`.

## Feeding the Report to SonarQube

The report format JaCoCo generates is natively supported by SonarQube. You only need to tell SonarQube where the report file is:

In the project's `pom.xml` or `sonar-project.properties`:

```properties
sonar.jacoco.reportPaths=target/jacoco.exec
```

Make sure JaCoCo has produced a `jacoco.exec` file (this is the binary coverage data the agent generates automatically):

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
                <!-- Specify the exec file path -->
                <destFile>${project.build.directory}/jacoco.exec</destFile>
            </configuration>
        </execution>
    </executions>
</plugin>
```

Then in your CI pipeline:

```bash
mvn clean test sonar:sonar \
    -Dsonar.host.url=http://your-sonarqube:9000 \
    -Dsonar.jacoco.reportPaths=target/jacoco.exec
```

SonarQube reads the coverage data automatically and, combined with the quality gate you configured earlier, gives a pass/block decision.

## Practice in a CI Pipeline

A typical use inside a Jenkins Pipeline:

```groovy
stage('Test & Coverage') {
    steps {
        sh 'mvn clean test'
    }
    post {
        always {
            // Publish the coverage report even if tests failed
            jacoco(
                execPattern: '**/target/jacoco.exec',
                classPattern: '**/target/classes',
                sourcePattern: '**/src/main/java'
            )
            // Jenkins will display the coverage trend chart
        }
    }
}
```

Jenkins's JaCoCo plugin generates a historical trend chart — you can see whether coverage rises or falls with each build:

```
覆盖率趋势
95% ┤
90% ┤     ┌──────
85% ┤    ╱
80% ┤───╱
    └───┬───┬───┬───┬───
       #1  #2  #3  #4  #5
```

A downward trend = new code has no tests written for it, and it needs attention.

## Common Problems

### Coverage Is Always 0%?

Check:
1. Is `prepare-agent` configured?
2. Is `maven-surefire-plugin`'s `forkCount` set to 0? (In fork mode the JaCoCo agent arguments may not be passed through)

```xml
<plugin>
    <artifactId>maven-surefire-plugin</artifactId>
    <configuration>
        <argLine>${argLine}</argLine>  <!-- Critical! Make sure the JaCoCo arguments reach the forked JVM -->
    </configuration>
</plugin>
```

`${argLine}` is a property JaCoCo's `prepare-agent` sets automatically, containing `-javaagent:jacocoagent.jar=...`. If you don't add this line, the agent arguments are lost.

### How Do I Aggregate a Multi-Module Project?

Add this to the parent pom:

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

This generates an aggregate report covering all submodules.

### The Coverage Number Looks Inflated?

JaCoCo is far better than Cobertura, but there is still one misconception to be aware of: the case where **only classes touched by the tests get loaded**. If some code paths are never reached at all, they won't be counted in coverage (because the classes were never loaded).

The fix: use `FULLY` mode. Since 0.8.0 JaCoCo has defaulted to full mode, so you don't need to worry about it.

## Summary

Using JaCoCo comes down to three steps:

```
1. 加插件依赖（prepare-agent + report）
2. mvn test（自动插桩 + 采集 + 生成报告）
3. 看 target/site/jacoco/index.html
```

It is not a tool you have to "learn" — it's the kind of infrastructure that "runs silently once configured". The real barrier isn't the tool itself, but this: **once you have the coverage number in hand, are you willing to spend the time filling in that 20% blind spot?**

Finally, remember: coverage is a **lower-bound** metric, not an upper bound. 80% coverage doesn't mean your tests are well written; it only means you haven't left 80% of the code unrun. The quality of the tests, in the end, still depends on people designing them.

A small step forward every day is a new height!
