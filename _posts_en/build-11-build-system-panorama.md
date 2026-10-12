---
title: 'Build Tools (11): Build System Panorama — How to Choose from make to Bazel'
date: 2023-08-05
author: Tang Moying
categories: [build]
tags: [Linux, C/C++, Build Tools, Make, CMake, Ninja, Bazel]
lang: en
alt_url: /post/build-11-build-system-panorama
---


## 1. A Story First

There was a person who wanted to cook a bowl of noodles.

- The first time, he boiled water, chopped the vegetables, cooked the noodles and mixed the sauce. Every step was done by his own hands. This is like **typing gcc commands by hand**.
- Later he wrote the steps down on a sticky note and followed them every time. This is like **writing a shell script**.
- Later still he realised that if the vegetables had already been chopped, there was no need to chop them again. So he added a condition to the sticky note. This is like a **Makefile**.
- Later again he hired a chef: all he had to do was tell the chef "I want noodles", and the chef would sort out everything himself. This is like **CMake**.
- Later he rebuilt the kitchen so that all the stoves could be lit at the same time and a meal came out in one minute. This is like **Ninja**.
- Finally he opened a chain of noodle shops: no matter which city or which shop, the noodles tasted the same and were served within a minute. This is like **Bazel**.

This story strings together the thread of our eleven articles. In this final article, let's do a panoramic review—standing at a high vantage point to look at how these tools relate to one another, and how to choose when you are facing a new project.

<!--以上为摘要内容-->

## 2. The Panorama Map

```
层级     工具                        角色
────────────────────────────────────────────────
原始     gcc / g++ / clang           编译器
简单     Makefile / make              构建规则 + 执行引擎
高级     CMake / Meson / Bazel        构建描述（跨平台）
超快     Ninja                        执行引擎（极速）
辅助     pkg-config / vcpkg / Conan  依赖管理
```

**The compiler** is responsible for turning source code into machine code. It is the foundation.

**Build tools** are responsible for organising the compilation process—which files need to be compiled first, which can be compiled in parallel, which need to be recompiled. The core problem of a build tool is **managing dependencies**.

Along this dimension, build tools can be divided into two roles:

- **Build describer**: you describe your project's structure and dependencies (CMake, Meson, Bazel)
- **Build executor**: it executes the concrete compilation commands and schedules them according to dependencies (make, Ninja)

Some tools do both (make is both describer and executor), some only execute (Ninja needs a describer to generate the build file), and some are particularly heavyweight (Bazel even locks down the compiler version for you).

## 3. One-Sentence Introduction to Each Tool

**GCC / Clang**
The essence of the compiler. `gcc -c file.c` is the most primitive build unit. Understanding the four stages of compilation gives you your foundation.

**Make / Makefile**
When you need to upgrade from "typing a command every time" to "automation + incremental compilation", make is your first choice. Lightweight, dependency-free, a Linux standard.

**CMake**
When you need cross-platform builds, or your project is complex enough that a Makefile becomes hard to maintain, CMake is the de facto standard of the C/C++ ecosystem. Write one CMakeLists.txt and you can generate the corresponding build files on Linux, macOS and Windows.

**Ninja**
When you have already written your build description with CMake but the build speed frustrates you, `-G Ninja` speeds things up at almost zero cost. It is currently the fastest general-purpose build execution engine.

**pkg-config**
When you are being tortured by the parameter hell of `-I`, `-L` and `-l`, or you need to manage the compilation parameters of third-party libraries, pkg-config turns them into a simple query. `$(pkg-config --cflags --libs libcurl)` solves everything.

**Meson**
CMake's competitor, with more modern and more concise syntax. It replaces CMake's custom language with a Python-like DSL. If you are starting a new project and don't like CMake's syntax, take a look at Meson.

**Bazel**
The heavyweight build system from Google. It emphasises "reproducible builds" and "very large monorepos". If your project has thousands of source files, spans multiple languages and needs strict incremental builds, Bazel was born for that scenario. But that also means a heavier runtime (it needs Java) and a steeper learning curve.

## 4. Facing a New Project, How Do You Choose?

There is no silver bullet. Here is a reference decision based on project size:

### Personal small project (< 10 source files)

- **Makefile** is enough. Don't waste time on tools; focus on writing code.
- If you want to practise CMake along the way, then use CMake + Ninja. The cost is very low.

### Team medium-sized project (10-100 source files)

- **CMake + Ninja** is the best combination right now.
- Write in the modern CMake style, with the `target_*` family of commands and PUBLIC/PRIVATE/INTERFACE controlling dependencies precisely.
- Use `find_package` or `FetchContent` for third-party dependencies.

### Large project (100+ source files)

- Still **CMake + Ninja**.
- But you need to pay more attention to drawing clear module boundaries, with nested CMakeLists.txt across multiple directories.
- Consider using `ccache` to speed up repeated compilations.

### Very large project / monorepo (1000+ source files, cross-language)

- You can consider **Bazel**.
- But Bazel's migration cost is very high; if you are already using CMake and haven't hit a bottleneck, there is no rush to switch.

### Embedded / cross-compilation

- **CMake + toolchain file** is the standard answer. Almost all embedded SDKs support CMake.

## 5. A Summary Table

| Tool | Who it suits | Pros | Cons |
|------|--------|------|------|
| Makefile | Individuals, small projects | Lightweight, standard, low learning cost | Poor cross-platform support, dated syntax |
| CMake | Almost all C/C++ projects | Cross-platform, powerful ecosystem, de facto standard | Ugly syntax, steep learning curve |
| Ninja | Used together with CMake | Extremely fast, zero configuration | Cannot be written by hand |
| pkg-config | Managing library dependencies | Simple and effective, standard format | The library needs to ship a .pc file |
| Meson | Newcomers, new projects | Modern syntax, fast | Ecosystem weaker than CMake |
| Bazel | Google-style monorepos | Reproducible, large-scale, cross-language | Heavy, high learning cost |

## 6. In Closing

Across eleven articles, we set out from typing `gcc` by hand and went all the way through Makefile, the four stages of compilation, static and dynamic libraries, pkg-config, CMake basics and advanced usage, multi-directory organisation, cross-compilation, Ninja and Bazel, and finally arrived in front of this panorama.

The essence of build tools has never changed: **tell the computer that whatever has changed is what gets recompiled, and parallelise as much as possible.**

What changes is only the way we describe this—from hand-written commands, to the Makefile, to target thinking in CMake, to sysroot in toolchain files, to hermetic build in Bazel. The more complex the tool, the more it is the scale version of the same problem.

If you could travel back to that afternoon when you first typed `gcc -o hello hello.c`, you would find that all build tools are helping you answer one question: **"When I change this line of code, how should my program become executable again?"**

I hope these eleven articles have helped you straighten out this thread.

A small step forward every day is a new height!
