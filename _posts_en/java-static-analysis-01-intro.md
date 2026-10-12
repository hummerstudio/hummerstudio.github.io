---
title: 'Java Static Code Analysis (Part 1): What Is Static Analysis'
date: 2018-08-04
author: Tang Moying
categories: [test]
tags: [Java, Static Analysis, Code Quality]
lang: en
alt_url: /post/java-static-analysis-01-intro
---

The code is written, it runs, the functionality is correct — but is that enough? The code may be hiding potential null pointers, unclosed resources, non-standard naming, redundant imports… These problems don't necessarily surface during testing, but sooner or later they'll give you a "surprise" in production. Static code analysis is about automatically finding these problems without running the code.

<!--以上为摘要内容-->

## What Is Static Code Analysis

**Static code analysis** (Static Code Analysis) means discovering potential defects, code style problems, performance hazards, and so on by analyzing source code or bytecode without actually executing the program.

Its counterpart is **dynamic analysis** (Dynamic Analysis), which finds problems by running the program (for example, unit tests or integration tests).

| | Static Analysis | Dynamic Analysis |
|---|---------|---------|
| How it works | Does not run the code; analyzes source/bytecode | Runs the code; observes behavior |
| When problems are found | Coding stage, compilation stage | Testing stage, runtime stage |
| Coverage | All code, including "cold paths" | Depends on test coverage |
| Typical tools | Checkstyle, PMD, FindBugs, SonarQube | JUnit, Mockito, Selenium |
| Speed | Fast (seconds) | Slow (minutes or more) |

In one sentence: **static analysis finds code patterns that "might be problematic," while dynamic testing verifies "whether it's actually correct." The two are complementary, not substitutes for each other.**

## Why You Need Static Analysis

### 1. Eliminate Problems at the Earliest Stage

Software engineering has a classic law: **the later a defect is found, the higher the cost of fixing it.**

```
Found at the coding stage → 1x cost
Found in Code Review → 5x cost
Found at the testing stage → 10x cost
Found in production → 100x cost
```

Static analysis can find problems the moment a developer finishes writing code, and that's the lowest-cost moment to fix them.

### 2. Unify the Team's Code Style

Code style has no absolute right or wrong, but it needs to be consistent within a team. Correcting things like "does the brace go on a new line" or "camelCase or snake_case for names" by hand in code review is far too inefficient. Hand it to a tool to check automatically, and people can focus on logic and architecture in their reviews.

### 3. Find the "Cold Paths" Tests Never Reach

Exception handling, logging, null checks — normal test flows often never reach this code, but static analysis can cover it.

### 4. Establish the Team's Coding Standard

A tool's configuration is itself an "executable coding standard." When a new member joins the team, running the checks once tells them where they don't match the team's habits — far more efficient than reading a Word document dozens of pages long.

## Where It Fits in the CI/CD Pipeline

Static analysis usually goes in the **earliest stage** of the CI pipeline, either before compilation or running in parallel with it:

```
Code commit → static analysis → compilation → unit tests → integration tests → packaging → deployment
            ↓ failure
        打回修改
```

If static analysis doesn't pass, the subsequent compilation, testing, and packaging are meaningless — feed it straight back to the developer to fix.

In practice, static analysis is often attached to the Maven or Gradle build process and triggered automatically through a plugin.

## A Panorama of Java Static Analysis Tools

The Java ecosystem has several mainstream static analysis tools, each with its own focus:

| Tool | What it analyzes | Main focus | Typical problems |
|------|----------|-----------|---------|
| **Checkstyle** | Source code | Code style, formatting conventions | Non-standard naming, missing Javadoc, overly long lines |
| **PMD** | Source code | Bad practices, potential defects | Empty catch blocks, unnecessary object creation, overly complex methods |
| **FindBugs** | Bytecode | Real bug patterns | Null pointers, unclosed resources, infinite recursion |
| **SpotBugs** | Bytecode | FindBugs' successor | Same as above, actively maintained and updated |
| **SonarQube** | Source + bytecode | A comprehensive quality platform | All of the above + technical debt measurement + a quality gate |

## Each Tool's Positioning and How They Differ

**Checkstyle** cares about "did you write it by the rules" — code formatting, naming conventions, comment completeness. It doesn't care whether your logic is correct, only whether your code "looks" like it conforms to the standard.

**PMD** cares about "did you write dumb code" — it can find empty if statements, unused variables, overly complex methods (cyclomatic complexity too high), unnecessary object creation, and more. It analyzes source structure, going one level deeper than Checkstyle.

**FindBugs / SpotBugs** care about "did you write a bug" — they analyze compiled bytecode and can find genuinely error-causing problems such as null pointer dereferences, unclosed resources, and incorrectly implemented equals methods. FindBugs stopped being maintained in 2016; SpotBugs is its community successor.

**SonarQube**, by contrast, is a **comprehensive platform**. It integrates the capabilities of several engines — Checkstyle, PMD, FindBugs/SpotBugs — displays all problems uniformly in one web interface, and offers advanced features such as technical debt calculation and quality gates (Quality Gate).

## Selection Advice

- **Personal projects or small teams**: start with SpotBugs + Checkstyle; the Maven/Gradle plugins are simple to configure and need no extra services
- **Mid-sized teams that need a unified standard**: add PMD for full coverage of the three categories of problems (style / practice / bug)
- **Those who need measurement and long-term tracking**: bring in SonarQube to visualize quality trends and set quality gates

## What's Next

This series will use five articles to go deep on Checkstyle, PMD, FindBugs, SpotBugs, and SonarQube one by one — their usage and configuration. Each article focuses on one tool, taking you from zero to actually using it.

A small step forward every day is a new height!
