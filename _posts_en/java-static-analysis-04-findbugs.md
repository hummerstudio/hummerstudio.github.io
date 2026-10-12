---
title: 'Java Static Code Analysis (Part 4): FindBugs — the Bytecode-Level Bug Hunter'
date: 2018-08-12
author: Tang Moying
categories: [test]
tags: [Java, Static Analysis, FindBugs, Code Quality]
lang: en
alt_url: /post/java-static-analysis-04-findbugs
---

Checkstyle handles formatting and PMD handles coding style, but some bugs hide deeper — such as null pointer dereferences, resources not closed, infinite recursion — these all look perfectly normal at the source level, and only analyzing the bytecode can reveal them. FindBugs is what does this: it does not read source code, it analyzes .class files directly, sniffing out bug patterns from the bytecode. It is a legendary tool; although it has stopped being maintained, the legacy it left behind — SpotBugs — is still actively protecting thousands upon thousands of Java projects.

<!--以上为摘要内容-->

## What Is FindBugs

FindBugs is a Java static analysis tool developed by Professor Bill Pugh of the University of Maryland and his team. What makes it unique is that **it does not analyze source code, but the compiled bytecode (.class files).**

This brings several advantages:
- **More precise**: bytecode is the result of the compiler "digesting" the source; comments, formatting and other distractions are removed, and it directly reflects the real execution logic
- **Deeper**: it can find problems that source analysis cannot find, such as type problems after generic type erasure, and the order in which synchronization locks are acquired
- **Language-independent**: any language that runs on the JVM can be checked (though it is mainly used for Java)

FindBugs defines about **400-plus bug patterns**, divided into 9 categories, and each issue has a severity rank (rank, 1-20, the smaller the number the more severe).

## Core Principles

FindBugs analyzed the bug-fix records of tens of thousands of real projects, distilled the common bug patterns from them, and then uses those patterns to match sequences of bytecode instructions. For example:

```java
// Bug pattern: the method may return null, but the caller uses it without a null check

// Method definition
public String getName() {
    if (someCondition) {
        return null;  // FindBugs flags that this may return null
    }
    return "default";
}

// Caller
String name = obj.getName();
System.out.println(name.length());  // FindBugs warns: possible null pointer
```

When analyzing the bytecode, FindBugs finds that `getName()` has one instruction path with `return null`, while the caller directly calls the `length()` method on the returned object — that is a potential null pointer dereference.

### Analysis Flow

```
Java source → javac compile → .class bytecode → FindBugs analysis → report
```

Because what it analyzes is bytecode, FindBugs can trace data flow across methods and find bugs that span multiple call levels, which pure source analysis can hardly do.

## Getting Started Quickly

### Maven Integration

The Maven plugin for FindBugs is `findbugs-maven-plugin`:

```xml
<plugin>
    <groupId>org.codehaus.mojo</groupId>
    <artifactId>findbugs-maven-plugin</artifactId>
    <version>3.0.5</version>
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

Key parameters:

| Parameter | Meaning | Possible values |
|------|------|--------|
| `effort` | Analysis precision | `Min` (fast but rough), `Default`, `Max` (slow but thorough) |
| `threshold` | The lowest severity level to report | `High`, `Normal` (default), `Low` |
| `xmlOutput` | Generate an XML report | `true` / `false` |

Executing the check:

```bash
mvn verify
# or run it directly
mvn findbugs:findbugs
# open the GUI to see the results
mvn findbugs:gui
```

### Gradle Integration

```groovy
apply plugin: 'findbugs'

findbugs {
    effort = 'max'
    reportLevel = 'low'
}

tasks.withType(FindBugs) {
    reports {
        xml.enabled = false
        html.enabled = true
    }
}
```

### IDE Integration

IntelliJ IDEA and Eclipse both have FindBugs plugins; after installing one, you can see bug markers in the editor just as you would see compilation errors, which is very convenient.

## Bug Categories and Typical Problems

FindBugs divides bugs into 9 categories:

| Category | English identifier | Description |
|------|----------|------|
| Correctness | `CORRECTNESS` | Definitely a bug, must be fixed |
| Bad practice | `BAD_PRACTICE` | Violates recommended practice, very likely to cause problems |
| Performance | `PERFORMANCE` | Inefficient coding style |
| Multithreaded correctness | `MT_CORRECTNESS` | Concurrency-related bugs |
| Malicious code vulnerability | `MALICIOUS_CODE` | Security-related |
| Style | `STYLE` | Confusing coding style |
| Internationalization | `I18N` | Internationalization problems |
| Experimental | `EXPERIMENTAL` | Patterns that have not yet been fully validated |

### Typical Bug Examples

#### Null pointer dereference (Correctness, rank: 1)
```java
String value = map.get(key);
return value.toUpperCase();  // possible NullPointerException
```

#### Resource not closed (Bad Practice, rank: 12)
```java
InputStream in = new FileInputStream("data.txt");
// ... use in ...
// forgot to close it! FindBugs will report it
```

#### Asymmetric equals method (Correctness, rank: 1)
```java
@Override
public boolean equals(Object obj) {
    if (obj instanceof MyClass) {
        MyClass other = (MyClass) obj;
        return this.id == other.id;
    }
    // missing handling of null, or the logic is asymmetric
    return false;
}
```

#### Needless object creation (Performance)
```java
String s = new String("hello");  // should just use "hello"
Integer i = Integer.valueOf(42);  // should use autoboxing or the cache
```

#### Synchronization error (MT Correctness)
```java
private int counter;

public synchronized int getCounter() {
    return counter;
}

public void increment() {  // not synchronized!
    counter++;
}
```

## Suppressing False Positives

Any static analysis produces false positives. FindBugs provides several ways to suppress warnings you don't want:

### The Annotation Approach (the most commonly used)

```java
import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;

@SuppressFBWarnings(
    value = "NP_NULL_ON_SOME_PATH",
    justification = "在此上下文中不可能为空")
public String process(String input) {
    return input.trim();
}
```

### Filter Files

Exclude by class or pattern through an XML filter:

```xml
<FindBugsFilter>
    <Match>
        <Class name="com.example.generated.*"/>
    </Match>
    <Match>
        <Bug pattern="EI_EXPOSE_REP2"/>
        <Class name="com.example.dto.*Dto"/>
    </Match>
</FindBugsFilter>
```

Specify the filter in Maven:

```xml
<plugin>
    <groupId>org.codehaus.mojo</groupId>
    <artifactId>findbugs-maven-plugin</artifactId>
    <configuration>
        <excludeFilterFile>findbugs-exclude.xml</excludeFilterFile>
    </configuration>
</plugin>
```

## FindBugs Today

After FindBugs released its last version, 3.0.1, in 2016, official maintenance stopped. The reason is that the core development team moved on to other projects, and the original author, Professor Bill Pugh, also faded out of day-to-day maintenance.

But FindBugs left behind two important legacies:

1. **A knowledge base of bug patterns**: the 400-plus bug patterns have been validated by a large number of real projects, and to this day they remain the de facto standard for Java static analysis
2. **SpotBugs**: the community forked SpotBugs on the basis of FindBugs, and it has been continuously maintained ever since

**Recommendation**: if you are still using FindBugs, you can keep using it — its analysis capabilities are not outdated. But for new projects, I recommend using its successor **SpotBugs** directly; the next article will introduce it in detail.

## Summary

FindBugs is a "legend" — it pioneered bytecode-level Java static analysis; its bug patterns are precise and its false positive rate is low, and it is the code-quality gatekeeper for many teams. Although the project itself has stopped being maintained, its methods and data were fully inherited by SpotBugs. Understanding FindBugs's principles and bug patterns helps a great deal with understanding SpotBugs as well.

A small step forward every day is a new height!
