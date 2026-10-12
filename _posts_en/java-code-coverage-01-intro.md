---
title: 'Java Code Coverage (Part 1): From Emma to JaCoCo, What Coverage Really Is'
date: 2018-09-02
author: Tang Moying
categories: [test]
tags: [Java, Code Coverage, JaCoCo, Emma, Cobertura]
lang: en
alt_url: /post/java-code-coverage-01-intro
---

You wrote 200 tests, and they're all green. Confidently, you say "this module is tested." But then the questions come — how many lines of code did your tests actually run? Which if-else branches were never entered? Which methods did no test ever visit? Coverage is what answers these questions. It won't tell you whether your tests are right, but it will tell you **which places your tests never touched**.

<!--以上为摘要内容-->

## What Is Code Coverage

**Code coverage** is the proportion of code that gets executed when the tests run. It can be broken down into several dimensions:

| Dimension | Meaning | Example |
|------|------|------|
| **Line coverage** (Line) | How many lines were executed | 200 / 250 lines = 80% |
| **Branch coverage** (Branch) | Was every branch of the if/else and switch taken? | 15 / 20 branches = 75% |
| **Method coverage** (Method) | How many methods were called | 8 / 10 methods = 80% |
| **Class coverage** (Class) | How many classes were reached | 12 / 15 classes = 80% |
| **Cyclomatic complexity coverage** (Complexity) | Was every execution path taken? | Measured together with cyclomatic complexity |

Visually, a coverage report looks like this:

```
Calculator.java - 行覆盖率: 75%
--------------------------------
    public int divide(int a, int b) {
 1      if (b == 0) {                    ← green (the test covered it)
 2          throw new ArithmeticException();  ← red (not covered!)
        }
 3      return a / b;                    ← green
    }
```

**Green = executed**, **red = never executed**, **yellow = partially executed** (for example, one branch was taken and the other wasn't).

## How Code Coverage Works Under the Hood: Instrumentation

How does a coverage tool know whether a given line of code was executed? The answer is called **instrumentation**.

Inside the bytecode the JVM has compiled, the coverage tool **inserts extra counting instructions** — effectively burying a counter at every key location:

```
原始字节码：
    iconst_0          // b == 0 ?
    if_icmpne 20      // not equal, jump to return a / b
    new #2            // create a new ArithmeticException
    ...

插桩后：
    iconst_0
    invokestatic CoverageCounter.hit(12)  ← inserted: records "line 12 executed"
    if_icmpne 20
    invokestatic CoverageCounter.hit(13)  ← inserted: records "line 13 executed"
    new #2
    ...
```

Once the tests have finished, the data from all the counters is aggregated, and you can work out which lines and which branches were executed.

**There are two points at which instrumentation can happen**:

| Approach | Timing | Representative tools |
|------|------|---------|
| **On-the-fly** (runtime instrumentation) | Injected dynamically when the JVM loads classes | JaCoCo's agent mode |
| **Offline** (compile-time instrumentation) | Modifies class files after compilation finishes | Cobertura, Emma |

Runtime instrumentation is the more common choice — it doesn't require modifying the build output and doesn't disrupt the normal compilation flow.

## The History of Coverage: Emma → Cobertura → JaCoCo

The evolution of Java coverage tools is a textbook story of "old tools dying out and a new tool unifying the field."

### Emma (2005 ~ 2012, no longer maintained)

Emma was an early player among Java coverage tools. Its hallmark was being **lightweight** — a single jar was enough to run it, with no extra dependencies.

```bash
# How to use Emma
java -cp emma.jar emma instr -m overwrite -cp target/classes
java -cp emma.jar:target/classes YourTest
java -cp emma.jar emma report -r html -in coverage.em
```

Its limitations were obvious too:
- **No Java 8 support** (it stopped receiving updates after 2012; even its support for Java 7's invokedynamic was incomplete)
- **Offline instrumentation**, which requires modifying class files — a cumbersome process
- **No branch coverage support**, only line coverage

So as Java versions moved on, Emma inevitably left the stage.

### Cobertura (2006 ~ 2015, no longer maintained)

Cobertura built on Emma and improved a few things:

- **Branch coverage support**
- HTML reports that look better than Emma's
- Better integration with Maven (`mvn cobertura:cobertura`)

But Cobertura had the same fatal flaw as Emma — **offline instrumentation** — and its **method of calculation was also flawed**: by default Cobertura only counts "classes the tests touched," which means that if a class is never referenced by any test at all, it won't be included in the denominator. That makes the coverage figure **artificially high** — it looks beautiful, but a great deal of code was never tested at all.

And Cobertura stopped receiving updates too; its last version dates from 2015.

### JaCoCo (2011 ~ present, dominant)

JaCoCo (Java Code Coverage) is a next-generation tool from the same author as Mt. Emma, and the name itself carries that sense of inheritance. It learned every lesson from Emma and Cobertura and made fundamental improvements:

| | Emma | Cobertura | JaCoCo |
|---|------|-----------|--------|
| Instrumentation | Offline | Offline | **Runtime (agent)** + offline dual mode |
| Line coverage | ✅ | ✅ | ✅ |
| Branch coverage | ❌ | ✅ | ✅ |
| **Instruction coverage** (the finest-grained) | ❌ | ❌ | ✅ |
| Cyclomatic complexity | ❌ | ❌ | ✅ |
| Java 8+ support | ❌ | ❌ | ✅ (continuously updated) |
| Maven integration | Average | Good | **Perfect** |
| SonarQube integration | ❌ | ❌ | ✅ |
| Maintenance status | Updates stopped in 2012 | Updates stopped in 2015 | **Actively maintained** |

JaCoCo introduced a distinctive metric — **instruction coverage** — which is coverage at the Java bytecode level, finer-grained than line coverage:

```java
// this one line of Java code
int result = a > 0 ? a : -a;

// once compiled to bytecode, it may be several instructions
// iload a
// ifle L1
// iload a        ← this branch was taken
// goto L2
// L1: iload a
//    ineg        ← this branch wasn't taken? Instruction coverage exposes it
// L2: istore result
```

Line coverage will say "this line is covered," but instruction coverage can tell you that the other half of the ternary expression was never reached.

**Conclusion: after 2023 (even after 2018, for that matter), JaCoCo is the only choice as a Java coverage tool.** Emma and Cobertura are history; knowing about them serves only to understand how this field evolved.

## The Truth About Coverage Numbers

Coverage is a metric that easily creates illusions.

### High Coverage ≠ Good Tests

```java
@Test
void testEverything() {
    service.process(new Request());  // one line covers 80% of the code
    // but: it verifies no return value
    // it verifies no side effect
    // it tests no exception path
}
```

This is called "**writing tests for the sake of coverage**" — 80% line coverage, and zero actual verification.

### Low Coverage ≠ Bad Code

```java
// these are the auto-generated equals/hashCode/toString
@Override
public boolean equals(Object o) { /* auto-generated by Lombok, 20 lines */ }
@Override
public int hashCode() { /* 5 lines */ }
@Override
public String toString() { /* 8 lines */ }
```

These 33 lines drag the coverage down, but they **don't need tests** — the framework generated the code, and the framework guarantees its correctness.

### The Cost Curve of 100% Coverage

```
覆盖率
100% ┤                              ╱
     ┤                           ╱
 90% ┤                        ╱
     ┤                     ╱
 80% ┤                  ╱
     ┤               ╱
 60% ┤        ╱╲╱╲╱╲╱╲
     ┤──╲╱──
     └──────────────────────────────→ Time spent writing tests
```

Going from 0% to 80% is relatively easy; going from 80% to 90% takes carefully designed test cases; and the cost of going from 90% to 100% may be larger than everything before it combined — with diminishing returns.

**A pragmatic target: 80%–90% for core business logic; utility classes and configuration classes don't need to be forced.**

## Where Coverage Fits in the CI/CD Pipeline

Coverage sits between unit tests and SonarQube:

```
Code commit → static analysis → compilation → unit tests + coverage collection → SonarQube quality gate → packaging
                                    ↑
                              JaCoCo 在此处工作
```

On every `mvn test`, JaCoCo instruments automatically, collects automatically and generates the report automatically. SonarQube then reads the report and judges it with a quality gate:

```
if 新增代码覆盖率 < 80% → 构建失败，打回修改
if 新增代码覆盖率 ≥ 80% → 放行
```

## Summary

Code coverage is a **measurement tool**, not a **quality goal**:

- It tells you where the **blind spots** in your tests are — which code has never been touched by a test
- It **cannot** tell you whether the tests were written correctly — whether the assertions are right, whether the edge cases were considered
- Low coverage always means something is wrong; high coverage doesn't mean nothing is wrong

In the next post we'll go deep into JaCoCo in practice — how to configure it, how to generate reports, how to read every number in the report, and how to feed the report to SonarQube.

A small step forward every day is a new height!
