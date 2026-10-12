---
title: 'Build Tools (10): Getting Started with Bazel — A Build System at Google''s Level'
date: 2023-07-30
author: Tang Moying
categories: [build]
tags: [Linux, C/C++, Bazel, Build Tools]
lang: en
alt_url: /post/build-10-bazel-intro
---


## 1. Isn't CMake Good Enough?

We've already spent five articles learning CMake — from getting started to modern idioms, from multi-directory organization to cross-compilation. For the vast majority of C/C++ projects, CMake + Ninja is already a very mature solution.

But suppose your project looks like this:

- 3,000 source files spanning five languages: C++, Java, Python, Go and ProtoBuf
- A team of 50 people, with everyone committing code frequently
- The CI system runs the full test suite on every build, and a full build takes 40 minutes

That's when you find that some of CMake's “assumptions” start to fall short:

- CMake assumes by default that your source lives in one repository, but “one repository” has a finite scale
- Its granularity for deciding what to rebuild is coarse — when a single `.o` changes, every target that depends on it has to be re-linked
- Cross-language build dependencies are a struggle for CMake to handle

Google ran into the same problem — just at a larger scale. Its entire codebase (Google3) is a giant monorepo containing two billion lines of code. To solve it, Google designed Bazel.

<!--以上为摘要内容-->

## 2. Bazel's Design Philosophy

Bazel has three core propositions:

**Reproducible Builds (Hermetic Builds)**

In Bazel's world, the same source plus the same build command must produce exactly the same result, no matter whose machine it runs on or when. To achieve that, Bazel manages the build environment strictly — compiler versions, system libraries and environment variables are all declared explicitly. It doesn't rely on “you happen to have such-and-such a library installed on your machine”.

**Extreme Granularity in Incremental Builds**

Bazel's incremental build doesn't look at “whether the file timestamp changed” — it hashes the inputs of every action (compilation step). Only when a hash changes does it re-execute. That means:
- Add a line of comment → no need to re-link
- Change a function implementation → only the changed `.cc` is recompiled, and only the affected targets are re-linked
- Change a header file → only the `.cc` files that include that header are recompiled

**Unified Modeling Across Languages**

In Bazel, C++ compilation, Java compilation, ProtoBuf code generation and Python tests are all the same “rule + target” abstraction. That makes cross-language dependency management natural — you can declare a C++ binary and a Java test in the same BUILD file, and Bazel will work out the dependency order itself.

## 3. Bazel's Core Concepts

Bazel's build model revolves around three concepts:

### Workspace

The `WORKSPACE` file in the project root (called `MODULE.bazel` in newer versions) defines the root of the whole project. It declares references to external dependencies:

```python
# WORKSPACE
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "com_google_absl",
    urls = ["https://github.com/abseil/abseil-cpp/archive/refs/tags/20230125.0.tar.gz"],
    strip_prefix = "abseil-cpp-20230125.0",
    sha256 = "3ea49a7d97421b88a8c48a0de16c16048e17725c7ec0f1d3ea9013a0a6466987",
)
```

Every external dependency has a unique name, a fixed download URL and a hash. There is no such thing as “go find something called libcurl on the system”.

### Package

Every directory containing a `BUILD` file is a package. The `BUILD` file describes “what can be built” in that directory.

### Target

An instance of a build rule inside a `BUILD` file. Common target types:

```python
# BUILD
cc_library(
    name = "hello-lib",
    srcs = ["hello.cc"],
    hdrs = ["hello.h"],
    visibility = ["//main:__pgrp__"],
)

cc_binary(
    name = "hello-world",
    srcs = ["main.cc"],
    deps = [":hello-lib"],
)
```

- `cc_library`: a C++ library
- `cc_binary`: a C++ executable
- `cc_test`: a C++ test

`visibility` controls which targets may depend on it, and `deps` declares the dependency relationships. Note the `:hello-lib` form — a leading colon means “a target in the same BUILD file”.

### Label

Bazel uses a label to uniquely identify a target:

```
//path/to/package:target-name
```

- `//main:hello-world` → the hello-world target in the main package at the root
- `:hello-lib` → the hello-lib target in the current BUILD file
- `@com_google_absl//absl/strings` → the default target of the strings package in the external dependency absl

## 4. A Complete Bazel Project

```
myproject/
├── WORKSPACE
├── BUILD
├── lib/
│   ├── BUILD
│   ├── hello.h
│   └── hello.cc
└── main/
    ├── BUILD
    └── main.cc
```

**Root BUILD: empty, or holding only global configuration.**

**lib/BUILD:**

```python
cc_library(
    name = "hello-lib",
    srcs = ["hello.cc"],
    hdrs = ["hello.h"],
    visibility = ["//visibility:public"],
)
```

**main/BUILD:**

```python
cc_binary(
    name = "hello-world",
    srcs = ["main.cc"],
    deps = ["//lib:hello-lib"],
)
```

Build commands:

```bash
# build all targets
bazel build //...

# build a specific target
bazel build //main:hello-world

# run
bazel run //main:hello-world

# run tests
bazel test //...
```

Bazel analyzes the dependency graph automatically, works out what needs recompiling, and then executes in parallel.

## 5. How Precise Is Bazel's Incremental Build?

Suppose you only changed a function implementation inside `hello.cc` (without touching the header). Bazel's build goes like this:

1. It detects that the input hash of `hello.cc` changed
2. It recompiles `hello.cc` → `hello.o`
3. It re-packages `//lib:hello-lib`
4. It detects that the hash of `main.cc` hasn't changed → compilation is skipped
5. It detects that the link inputs of `//main:hello-world` changed (because `hello-lib` changed) → it re-links

If you add a comment line to `hello.h` (which doesn't change the semantics), how does Bazel know it doesn't need to recompile `main.cc`? It compares hashes of the contents of the `.o` files — if the final artifact is exactly the same, Bazel considers that “nothing changed” and downstream targets aren't triggered either. That's a finer granularity than CMake + make/Ninja, which relies purely on timestamps.

Naturally, that precision comes at a price — Bazel's runtime is heavier than Ninja's and its startup time is longer. But on very large projects, the compilation time you save is dozens of times the startup time.

## 6. Bazel's Drawbacks

I have to be honest here:

- **Steep learning curve**: WORKSPACE, BUILD, `.bzl` extensions, the Starlark language... there are even more concepts to absorb than with CMake
- **Heavy runtime**: Bazel itself is a Java program — slow to start and memory-hungry
- **A smaller ecosystem than CMake**: Google uses it internally, but most open-source C/C++ libraries don't treat Bazel as their primary build method
- **High migration cost**: switching from CMake to Bazel is basically rewriting your entire build system
- **Overkill for small projects**: using Bazel for a project with 10 source files is like driving a truck to buy groceries

## 7. When Should You Consider Bazel?

| Scenario | Recommendation |
|------|------|
| Personal project / < 100 source files | **Don't use it.** CMake is plenty |
| Mid-sized team project | CMake + Ninja is the best combination |
| Large C++ project (1000+ source files) | Worth considering, but if CMake hasn't hit a bottleneck, don't bother |
| monorepo + multiple languages (C++/Java/Go/Python) | **Bazel's sweet spot** |
| Strict requirements on build reproducibility | Bazel's hermetic design supports this natively |
| A new large project starting from scratch | Worth evaluating, if the team can accept the learning cost |

A practical rule of thumb: **if you don't find CMake slow, don't switch to Bazel.**

## 8. Summary

Bazel is “the highway of build systems” — expensive to build, but once it's open, the traffic it can carry is beyond anything an ordinary road can match.

It solves the problems CMake doesn't cover: ultra-large scale, cross-language builds, unwavering reproducibility. But most projects never run into those problems in their entire lifetime.

The point of understanding Bazel is this: when you see people debating “why doesn't Chromium use Bazel” or “why does TensorFlow use Bazel”, you can understand the trade-offs behind it — it's not a question of which technology is better, but of what scale and what requirements you're choosing under.

---

In the next article we'll do a panoramic retrospective — from make to Bazel, what has happened to Linux/C/C++ build tools over the years? And given a new project, which tool should you actually pick?

A small step forward every day is a new height!
