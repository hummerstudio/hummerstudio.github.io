---
title: 'Build Tools (Part 5): Getting Started with CMake — Why Your Project Needs a CMakeLists.txt'
date: 2023-07-15
author: Tang Moying
categories: [build]
tags: [Linux, C/C++, CMake, Build Tools]
lang: en
alt_url: /post/build-05-cmake-intro
---


## 1. From Makefile to CMake: Why Learn Yet Another Tool?

In the previous articles we've been talking about the Makefile the whole time. Is it good enough?

If your project is only ever compiled with gcc on Linux, make is basically enough. But as soon as you need to:
- Compile with Visual Studio on Windows
- Compile with Xcode on macOS
- Detect whether a certain library exists on the system
- Choose different compilation options according to the system version
- Get every team member (each running a different operating system) to build successfully

Hand-writing a Makefile turns into a nightmare. The compilers and build tools on different platforms are two entirely different languages — Windows uses `cl.exe` and `nmake`, Linux uses `gcc` and `make`, and there is no way to write one Makefile that works everywhere.

CMake exists to solve exactly this: **you write one build description, and it generates the build files for the corresponding platform.**

<!--以上为摘要内容-->

## 2. Where CMake Fits

CMake is not the build system itself — it is a **build system generator**.

```
CMakeLists.txt → cmake → generates build files → the build system performs compilation
```

Let me use an analogy:
- `make` is the chef, stir-frying the dish directly
- CMake is the ordering system — you tell it which dishes you want, and it generates the menu that suits this particular kitchen (Makefile / Ninja / Visual Studio project files)

The biggest benefit of this design: **one `CMakeLists.txt`, usable everywhere**. Whether a Linux developer is using `make` or a Windows developer is using Visual Studio, everyone edits the same CMakeLists.txt.

## 3. Your First CMakeLists.txt

Suppose you have a single-file C project:

```
myapp/
├── main.c
└── CMakeLists.txt
```

`CMakeLists.txt` can be as simple as three lines:

```cmake
cmake_minimum_required(VERSION 3.10)
project(MyApp C)
add_executable(myapp main.c)
```

A quick explanation:
- `cmake_minimum_required`: declares the minimum CMake version you need. This is the first line of every CMakeLists.txt.
- `project`: gives your project a name and declares the languages used (C, CXX and so on).
- `add_executable`: tells CMake we want to produce an executable called `myapp` whose source is `main.c`.

Looks simple enough? That's because CMake has a great deal of **default behaviour** — it detects your compiler and system type automatically and configures everything for you.

## 4. The Build Workflow

CMake has one very important habit: **out-of-source builds**.

What that means: don't let the temporary files produced by compilation pollute the clean source directory.

The standard workflow:

```bash
cd myapp
mkdir build && cd build
cmake ..
make
```

- `mkdir build`: create the build directory
- `cmake ..`: tell cmake to look for `CMakeLists.txt` in the parent directory and generate the build files in the current directory
- `make`: run the compilation

All the build output lives in `build/`, and the source directory stays spotless. Want to clean up? Just `rm -rf build`. That's the benefit of out-of-source builds.

## 5. Specifying the Compiler and Build Type

CMake lets you control compilation behaviour flexibly:

```bash
# Specify the C compiler
cmake .. -DCMAKE_C_COMPILER=/usr/bin/clang

# Specify the build type: Debug (with debug info) / Release (optimized) / RelWithDebInfo (optimized + debug info)
cmake .. -DCMAKE_BUILD_TYPE=Debug
```

The `-D` argument is how CMake is configured; the format is `-D变量名=值`. You can override any variable from CMakeLists.txt on the command line, which is very flexible.

## 6. Common Variables and Options

A slightly more substantial CMakeLists.txt:

```cmake
cmake_minimum_required(VERSION 3.10)
project(MyApp C)

# Set the C standard
set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Add compilation options
add_compile_options(-Wall -Wextra)

# Add preprocessor definitions
add_definitions(-DVERSION=\"1.0\")

# Executable
add_executable(myapp main.c utils.c network.c)
```

- `set()`: sets a variable
- `add_compile_options()`: adds compilation options globally
- `add_definitions()`: adds macro definitions (equivalent to `-D`)

## 7. How Does CMake Find the Makefile?

You may be wondering: I ran `cmake ..`, how does it know to generate a Makefile rather than Visual Studio project files?

CMake has a concept called a **generator**. By default it chooses one automatically based on your operating system:

- Linux / macOS: `Unix Makefiles`
- Windows: the generator for the corresponding Visual Studio version

You can also specify it manually:

```bash
# Generate Ninja build files (faster)
cmake .. -G Ninja
ninja

# Generate an Xcode project (macOS)
cmake .. -G Xcode
```

For now you don't need to agonize over this; the default `make` is perfectly good.

## 8. CMake vs Makefile: A Comparison Table

| Need | Makefile | CMake |
|------|----------|-------|
| Add a source file | Manually edit the OBJS variable | `add_executable(app main.c foo.c)` |
| Specify compilation options | `CFLAGS += -Wall` | `add_compile_options(-Wall)` |
| Bring in a library | Write `-I` `-L` `-l` by hand | `find_package()` + `target_link_libraries()` |
| Cross-platform | Basically impossible | Supported natively |
| Learning curve | Low | Medium |

CMake is indeed a bit steeper to learn than Makefile, but once you get the hang of it, the maintenance cost of large projects drops a great deal.

---

In the next article we'll learn the right way to approach "modern CMake" — the `target_*` family. This may be the most important lesson in your whole CMake journey.

A small step forward every day is a new height!
