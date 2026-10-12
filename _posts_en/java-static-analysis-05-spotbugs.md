---
title: 'Java Static Code Analysis (Part 5): SpotBugs — the Successor to FindBugs'
date: 2018-08-18
author: Tang Moying
categories: [test]
tags: [Java, Static Analysis, SpotBugs, FindBugs, Code Quality]
lang: en
alt_url: /post/java-static-analysis-05-spotbugs
---

The previous article introduced FindBugs — a legendary bytecode-level bug checker, but one that stopped being maintained in 2016. Fortunately the community did not let it go quiet: **as FindBugs' official successor, SpotBugs** inherits its entire set of bug patterns and its analysis engine, and keeps adding new features and support for new versions of Java. If you are looking for a bytecode-level static analysis tool that is "still alive", SpotBugs is the answer.

<!--以上为摘要内容-->

## What SpotBugs Is

SpotBugs is a community fork of FindBugs, started at the end of 2016 and maintained by the original FindBugs contributors. Its positioning is the **direct inheritance and evolution** of FindBugs:

- **Fully compatible**: every FindBugs bug detector is kept, and the results are consistent
- **Continuously updated**: supports the new syntax and APIs of Java 8, 9, 10 and 11
- **An active community**: stable release cadence, timely bug fixes
- **A plugin ecosystem**: security-checking capabilities can be extended with plugins such as `findsecbugs`

In one sentence: **wherever FindBugs runs, SpotBugs runs too, but what SpotBugs can detect is not necessarily something FindBugs can find.**

## Getting Started

### Maven Integration

SpotBugs provides its own Maven plugin, which is more concise to use than FindBugs':

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

Running the check:

```bash
mvn verify
# Or run it directly
mvn spotbugs:check
# View the report (with a graphical interface)
mvn spotbugs:gui
```

### Gradle Integration

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

### Migrating From FindBugs

If you are already using FindBugs, migrating to SpotBugs costs almost nothing:

1. **Maven**: swap `findbugs-maven-plugin` for `spotbugs-maven-plugin`; the configuration parameters are basically compatible
2. **Annotations**: replace `import edu.umd.cs.findbugs.annotations.*` with `import edu.umd.cs.findbugs.annotations.*` (the annotation namespace is retained, so no code changes are needed)
3. **Filter files**: fully compatible, no modification required

## What's New in SpotBugs

### Support for New Versions of Java

FindBugs stopped at the Java 8 era. SpotBugs keeps following along:

- **Java 9/10/11**: supports `var` type inference, the module system and new APIs
- **Java 8 Lambda**: improved analysis of lambdas and the Stream API
- **Try-with-resources**: supports analysing the auto-closing resource idiom

### New Detectors

SpotBugs adds several bug detectors that FindBugs does not have, for example:

- **DMI_RANDOM_USED_ONLY_ONCE**: a `Random` object is used only once, the seed never changes, so every result is the same
- **RCN_REDUNDANT_NULLCHECK_OF_NULL_VALUE**: a redundant null check on a value already known to be null
- **RV_RETURN_VALUE_IGNORED_NO_SIDE_EFFECT**: a method with no side effects is called and its return value ignored

### The Plugin Mechanism

SpotBugs supports plugins to extend its checking capabilities. The one most worth knowing about is **Find Security Bugs**:

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

Once installed, the security issues it can detect include:

- SQL injection
- XSS cross-site scripting
- Hard-coded passwords
- Insecure cryptographic algorithms (MD5, SHA1)
- Path traversal vulnerabilities

## A Real-World Configuration Example

A complete, production-grade SpotBugs configuration:

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
        <!-- Integrate the security detection plugin -->
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

### Commonly Used Exclusion Configuration

`spotbugs-exclude.xml`:

```xml
<FindBugsFilter>
    <!-- Ignore all auto-generated code -->
    <Match>
        <Source name="~.*generated.*"/>
    </Match>
    <!-- Ignore direct-field-assignment warnings in DTOs -->
    <Match>
        <Bug pattern="EI_EXPOSE_REP,EI_EXPOSE_REP2"/>
        <Class name="~.*Dto"/>
    </Match>
    <!-- Ignore a specific issue in a specific class -->
    <Match>
        <Bug pattern="NP_NULL_ON_SOME_PATH_FROM_RETURN_VALUE"/>
        <Class name="com.example.legacy.OldService"/>
    </Match>
</FindBugsFilter>
```

### Suppressing a Specific Warning

```java
import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;

@SuppressFBWarnings(
    value = "DMI_RANDOM_USED_ONLY_ONCE",
    justification = "此处只需要一个随机值，不是 Bug")
public class RandomTokenGenerator {
    // ...
}
```

## Priority and Severity

SpotBugs carries over FindBugs' priority system:

| Rank | Severity | Description |
|------|---------|------|
| 1-4 | Scariest | Almost certainly a bug, must be fixed |
| 5-9 | Scary | Very likely a bug, strongly recommended to fix |
| 10-14 | Troubling | Possibly a bug, worth checking |
| 15-20 | Normal | A style issue, improvement suggested |

It is recommended to set the threshold to `Low` in CI (that is, report every issue), but have the Quality Gate block only on rank 1-14 issues (that is, set `threshold` to `Low` so the team sees all the problems in the report, while only the severe ones are mandatory to fix).

## IDE Integration

### IntelliJ IDEA

Install the **SpotBugs** plugin (note: not the FindBugs plugin), and configure the rules under `Preferences → Other Settings → SpotBugs`. The plugin supports highlighting issues inline in the code.

### Eclipse

Install the **SpotBugs Eclipse Plugin**; it can scan in real time, mark the offending lines of code and offer quick-fix suggestions.

## Summary

SpotBugs is FindBugs' "legitimate sequel" — it inherits all of its capabilities and keeps evolving. For any Java project, if you can choose only one static bug-checking tool, SpotBugs is the most recommended: it analyses bytecode, its bug patterns are precise, its false-positive rate is low and its ecosystem is mature. Paired with the Find Security Bugs plugin, it also covers security vulnerability detection.

The next article is the last in this series, introducing SonarQube — a comprehensive code quality platform that "bundles all of these tools together".

A small step forward every day is a new height!
