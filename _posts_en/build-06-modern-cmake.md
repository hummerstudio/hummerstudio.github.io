---
title: 'Build Tools (Part 6): The Way of Modern CMake — target_* and Interface Propagation'
date: 2023-07-16
author: Tang Moying
categories: [build]
tags: [Linux, C/C++, CMake, Modern CMake]
lang: en
alt_url: /post/build-06-modern-cmake
---


## 1. A Warning

If you search for how to use CMake, you will very likely find code like this:

```cmake
include_directories(${PROJECT_SOURCE_DIR}/include)
link_libraries(curl ssl crypto)
add_executable(myapp main.c)
```

It runs. But if that is how you write it —

**it means you are looking at CMake from a bygone era.** This style was mainstream in the CMake 2.x days, but from CMake 3.0 onwards the community gradually turned to another style: **modern CMake**.

This article sets out to make one thing clear: why the old style is bad, and what is good about the new one. This may be **the most important shift in thinking** you make while learning CMake.

<!--以上为摘要内容-->

## 2. The Core Problem of the Old Style: Global Pollution

The old style follows a typical pattern of "global settings plus local targets":

```cmake
# The old style — global pollution
include_directories(include)
include_directories(third_party/json/include)
include_directories(third_party/zlib/include)
link_libraries(curl ssl crypto z)
add_executable(myapp main.c)
```

The problem with this approach is that `include_directories` and `link_libraries` are **global commands** — they take effect for **every** target that comes after them.

If a project has only one target, that is not a problem. But a real project is quite likely to have several targets:

```cmake
include_directories(include)
add_executable(myapp main.c)
add_library(mylib lib.c)   # mylib is forced to inherit the include path above too
add_executable(tests test.c) # and so is tests
```

You cannot precisely control which target should have which header paths. This kind of global pollution produces accidental dependencies and blurs the module boundaries of the project.

An analogy: the old style is like fitting a big house with a single master power switch — either the whole house is lit or the whole house is dark. Modern CMake fits each room with its own switch, under precise control.

## 3. The Core of Modern CMake: Think in Targets

Modern CMake's philosophy is: **everything centres on the target, and dependencies between targets are declared explicitly.**

Everything starts from a target created by `add_executable` or `add_library`, and the `target_*` family of commands binds properties precisely to each target.

```cmake
# The modern CMake style
add_executable(myapp main.c)
target_include_directories(myapp PRIVATE include)
target_link_libraries(myapp PRIVATE curl ssl)
```

- `target_include_directories`: takes effect only for the `myapp` target; other targets are unaffected
- `target_link_libraries`: likewise takes effect only for `myapp`

Each target minds its own business without interfering with the others.

## 4. The PUBLIC, PRIVATE, INTERFACE Trilogy

These three keywords are the most confusing part of the `target_*` commands. But once you understand them, more than half of modern CMake falls into place.

Suppose you have written a library called `mylib`:

```cmake
add_library(mylib mylib.c)
```

It has a public header, `mylib.h`, sitting in the `include/` directory. Its internal implementation also uses `zlib`.

### PRIVATE

Things private to `mylib` — it needs them itself, but consumers (downstream targets) do not need to know about them:

```cmake
# zlib is used by mylib's internal implementation; consumers don't need to care
target_link_libraries(mylib PRIVATE z)
```

### PUBLIC

Things public to `mylib` — it needs them itself, and consumers must inherit them too:

```cmake
# The headers under include/ are needed by mylib itself and must also be visible to consumers
target_include_directories(mylib PUBLIC include)
```

When another target links `mylib`:

```cmake
add_executable(myapp main.c)
target_link_libraries(myapp PRIVATE mylib)
```

`myapp` automatically receives the `include/` header path — there is no need to write another `target_include_directories(myapp ...)` line.

This is **interface propagation**: dependency information travels automatically along the chain of targets.

### INTERFACE

For consumers only; not used by itself:

```cmake
# A header-only library: it has no compilation output of its own, only the header path needs to propagate
add_library(myheaderlib INTERFACE)
target_include_directories(myheaderlib INTERFACE include)
```

## 5. A Decision Table

| Situation | What to use |
|------|--------|
| Needed by itself, consumers don't need to know | `PRIVATE` |
| Needed by itself, consumers need it too | `PUBLIC` |
| Not needed by itself, only given to consumers | `INTERFACE` |

Remember this simple test: ask yourself, "if nobody links my target, is this thing still needed?"
- No → `PRIVATE`
- Yes → `INTERFACE`
- Needed here and needed downstream too → `PUBLIC`

## 6. A Complete Example

```cmake
cmake_minimum_required(VERSION 3.10)
project(MyProject C)

# header-only library
add_library(config INTERFACE)
target_include_directories(config INTERFACE include/config)

# A static library, using zlib internally, exposing the interfaces in api.h
add_library(engine engine.c)
target_include_directories(engine
    PUBLIC include/engine      # consumers need to see engine's public headers
    PRIVATE third_party/helper  # tooling that only engine itself uses
)
target_link_libraries(engine
    PUBLIC config              # engine makes its dependency on config public; it propagates
    PRIVATE z                  # zlib is an implementation detail; it does not propagate
)

# The executable
add_executable(myapp main.c)
target_link_libraries(myapp PRIVATE engine)
# myapp automatically receives the PUBLIC header paths of config and engine
# but is not affected by engine's PRIVATE dependencies
```

Compared with the old style, this version:
- makes the dependencies obvious at a glance
- keeps the blast radius precisely under control when you modify a library
- introduces no accidental inheritance when you add a target

## 7. Summary

Modern CMake has just two core tenets:

1.  **Think in targets as the basic unit**; don't use global commands
2.  **Express dependencies precisely with PUBLIC / PRIVATE / INTERFACE**

Once this way of thinking becomes second nature, you will find that writing CMake is no longer about "what configuration makes it run" but about "what each target should and should not know" — an architectural question, not merely a configuration one.

---

In the next article we will tackle a practical problem: in a real multi-directory project, how should the CMakeLists.txt files be organised?

A small step forward every day is a new height!
