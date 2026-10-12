---
title: 'Build Tools (Part 7): Organizing CMake in a Multi-Directory Project — Managing Code Like Building Blocks'
date: 2023-07-22
author: Tang Moying
categories: [build]
tags: [Linux, C/C++, CMake, Project Structure]
lang: en
alt_url: /post/build-07-multi-dir-cmake
---


## 1. What do you do when the project grows up?

In the earlier articles, everything we wrote was a single-file or single-directory project — all the code in one place, handled by one `CMakeLists.txt`.

But a real C/C++ project is not like that. A typical project structure looks like this:

```
myapp/
├── CMakeLists.txt          # Top level
├── src/
│   ├── CMakeLists.txt      # src's own build configuration
│   ├── main.c
│   └── app/
│       ├── CMakeLists.txt  # build configuration for the app module
│       └── app.c
├── lib/
│   ├── CMakeLists.txt
│   ├── engine/
│   │   ├── CMakeLists.txt
│   │   ├── engine.c
│   │   └── engine.h
│   └── network/
│       ├── CMakeLists.txt
│       ├── network.c
│       └── network.h
├── tests/
│   ├── CMakeLists.txt
│   └── test_engine.c
└── external/
    └── ...
```

Every subdirectory has its own `CMakeLists.txt`, and each one is responsible for the build logic of its own little patch of ground. It is like a company — the CEO manages the overall direction (the top-level CMakeLists.txt), while department managers manage their own departments (the subdirectories' CMakeLists.txt). Once it is layered like this, responsibilities are clear and changes do not interfere with one another.

This article will teach you how to put these “building blocks” together.

<!--以上为摘要内容-->

## 2. The core directive: add_subdirectory

The top-level CMakeLists.txt uses `add_subdirectory` to “hang” the subdirectories onto the build:

```cmake
# Top-level CMakeLists.txt
cmake_minimum_required(VERSION 3.10)
project(MyApp C)

add_subdirectory(lib/engine)
add_subdirectory(lib/network)
add_subdirectory(src)
add_subdirectory(tests)
```

`add_subdirectory` does two things:
1.  It enters the subdirectory and executes the `CMakeLists.txt` there
2.  It brings the targets created in the subdirectory into the current scope

So the top-level CMakeLists.txt can access targets defined in subdirectories, but not the other way round. It is like the CEO knowing what each department is thinking, while a department manager has no idea what goes on inside another department.

## 3. How to write a library

Take `lib/engine` as an example:

```cmake
# lib/engine/CMakeLists.txt
add_library(engine STATIC
    engine.c
)

target_include_directories(engine
    PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}  # the current directory (engine/) exposed to the outside
)
```

The key point: `${CMAKE_CURRENT_SOURCE_DIR}` is a built-in CMake variable that represents the path where the current `CMakeLists.txt` lives. Use it to set the PUBLIC header directory, and CMake will automatically propagate those paths to downstream targets.

One thing that needs explaining is the `STATIC` type declaration. Whether `add_library` produces a shared library or a static library by default depends on the `BUILD_SHARED_LIBS` variable. Writing `STATIC` explicitly avoids ambiguity — if you want a static library, you get a static library; if you want a dynamic one, use `SHARED`.

`lib/network` has a similar structure. Each library is an independent “building block” with its own headers, source files and internal dependencies.

## 4. How to write an executable

```cmake
# src/CMakeLists.txt
add_subdirectory(app)

# src/app/CMakeLists.txt
add_executable(myapp app.c main.c)

target_link_libraries(myapp
    PRIVATE engine   # a library we wrote ourselves
    PRIVATE network
)
```

After `myapp` links against `engine` and `network`:
- It automatically gets the `engine/` and `network/` directories as header search paths (because of their PUBLIC declarations)
- There is no need to write `target_include_directories` to add header paths by hand

This is the power of modern CMake's interface propagation — declare the dependency once, and every compilation path comes out right automatically.

## 5. The test module

```cmake
# tests/CMakeLists.txt
enable_testing()  # Enable CTest

add_executable(test_engine test_engine.c)
target_link_libraries(test_engine PRIVATE engine)

add_test(NAME EngineTest COMMAND test_engine)
```

- `enable_testing()` enables the CTest test framework
- `add_test` registers a test case

To run the tests:

```bash
cd build && cmake .. && make && ctest
```

## 6. Bringing in third-party libraries

Projects often need to bring in third-party libraries. CMake offers several ways to do it:

**Option one: find_package (recommended, when the library is already installed on the system)**

```cmake
find_package(CURL REQUIRED)
target_link_libraries(myapp PRIVATE CURL::libcurl)
```

**Option two: FetchContent (CMake 3.11+, downloads the source and compiles it automatically)**

```cmake
include(FetchContent)
FetchContent_Declare(
    json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG v3.11.2
)
FetchContent_MakeAvailable(json)
target_link_libraries(myapp PRIVATE nlohmann_json::nlohmann_json)
```

**Option three: add_subdirectory (the source sits directly in the project)**

```cmake
add_subdirectory(external/thirdparty)
target_link_libraries(myapp PRIVATE thirdparty)
```

How to choose between the three: `find_package` is the cleanest but requires the library to be pre-installed; `FetchContent` can fetch things automatically but needs a network connection; `add_subdirectory` is the simplest but makes version management awkward.

## 7. A complete top-level CMakeLists.txt for reference

```cmake
cmake_minimum_required(VERSION 3.14)
project(MyApp VERSION 1.0.0 LANGUAGES C)

# C standard
set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Global compile options (they apply only to this directory and its subdirectories)
add_compile_options(-Wall -Wextra)

# Default build type
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Debug)
endif()

# Subdirectories
add_subdirectory(lib/engine)
add_subdirectory(lib/network)
add_subdirectory(src)
add_subdirectory(tests)
```

Concise, clear, obvious at a glance. Each subdirectory takes care of its own targets; the top level is only responsible for assembly.

## 8. Summary

There are only three organizing principles for a multi-directory CMake project:

1.  **One directory, one CMakeLists.txt**, each managing its own business
2.  **Expose the header path from a library with PUBLIC**, and downstream targets inherit it automatically
3.  **The top level only assembles**, and does not go deep into the implementation details of submodules

Once you have this pattern down, you can build a project like Lego bricks — every module independent, reusable and testable.

---

In the next article we will talk about a more advanced topic: cross-compilation. Can you compile a program on an x86 laptop that will run on an ARM development board?

One small step forward every day is a new height!
