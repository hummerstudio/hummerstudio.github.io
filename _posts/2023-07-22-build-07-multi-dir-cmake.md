---
title: 构建工具（七）：多目录项目的 CMake 组织——像搭积木一样管理代码
author: 唐明
categories: [build]
tags: [Linux, C/C++, CMake, 项目结构]
---


## 1、项目长大了怎么办？

前面的文章里，我们写的都是单文件或单目录项目——所有代码放在一起，一个 `CMakeLists.txt` 搞定。

但真实的 C/C++ 项目可不是这样的。一个典型的项目结构长这样：

```
myapp/
├── CMakeLists.txt          # 顶层
├── src/
│   ├── CMakeLists.txt      # src 自己的构建配置
│   ├── main.c
│   └── app/
│       ├── CMakeLists.txt  # app 模块的构建配置
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

每个子目录都有自己的 `CMakeLists.txt`，每个负责自己那一亩三分地的构建逻辑。这就像一家公司——CEO 管大方向（顶层 CMakeLists.txt），部门经理管各自部门（子目录的 CMakeLists.txt）。分层之后，职责清晰，修改互不影响。

这篇文章就来教你怎么搭这个「积木」。

<!--以上为摘要内容-->

## 2、核心指令：add_subdirectory

顶层 CMakeLists.txt 用 `add_subdirectory` 把子目录「挂」进来：

```cmake
# 顶层 CMakeLists.txt
cmake_minimum_required(VERSION 3.10)
project(MyApp C)

add_subdirectory(lib/engine)
add_subdirectory(lib/network)
add_subdirectory(src)
add_subdirectory(tests)
```

`add_subdirectory` 做了两件事：
1.  进入子目录，执行那里的 `CMakeLists.txt`
2.  把子目录里创建的 target 带入当前作用域

所以顶层 CMakeLists.txt 可以访问子目录里定义的 target，反之则不行。就像 CEO 知道各部门在想什么，但部门经理不知道别的部门内部在干嘛。

## 3、library 该怎么写

以 `lib/engine` 为例：

```cmake
# lib/engine/CMakeLists.txt
add_library(engine STATIC
    engine.c
)

target_include_directories(engine
    PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}  # 当前目录（engine/）对外暴露
)
```

关键点：`${CMAKE_CURRENT_SOURCE_DIR}` 是 CMake 的内置变量，代表当前 `CMakeLists.txt` 所在的路径。用它来设置 PUBLIC 头文件目录，CMake 会自动把这些路径传播给下游 target。

需要说明的是 `STATIC` 的类型声明。`add_library` 默认生成的是共享库还是静态库取决于 `BUILD_SHARED_LIBS` 变量。显式写 `STATIC` 可以避免歧义——你要静态库就静态库，要动态库就 `SHARED`。

`lib/network` 也是类似的结构。每个 library 就是一个独立的「积木块」，有自己的头文件、源文件、内部依赖。

## 4、可执行文件怎么写

```cmake
# src/CMakeLists.txt
add_subdirectory(app)

# src/app/CMakeLists.txt
add_executable(myapp app.c main.c)

target_link_libraries(myapp
    PRIVATE engine   # 自己写的库
    PRIVATE network
)
```

`myapp` 链接了 `engine` 和 `network` 之后：
- 自动获得了 `engine/` 和 `network/` 目录作为头文件搜索路径（因为它们的 PUBLIC 声明）
- 不需要再写 `target_include_directories` 来手动添加头文件路径

这就是现代 CMake 接口传播的威力——依赖关系声明一次，所有编译路径自动对。

## 5、测试模块

```cmake
# tests/CMakeLists.txt
enable_testing()  # 启用 CTest

add_executable(test_engine test_engine.c)
target_link_libraries(test_engine PRIVATE engine)

add_test(NAME EngineTest COMMAND test_engine)
```

- `enable_testing()` 启用 CTest 测试框架
- `add_test` 注册一个测试用例

运行测试：

```bash
cd build && cmake .. && make && ctest
```

## 6、第三方库的引入

项目里经常需要引入第三方库。CMake 提供了多种方式：

**方式一：find_package（推荐，当库已安装到系统时）**

```cmake
find_package(CURL REQUIRED)
target_link_libraries(myapp PRIVATE CURL::libcurl)
```

**方式二：FetchContent（CMake 3.11+，自动下载源码编译）**

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

**方式三：add_subdirectory（源码直接放在项目里）**

```cmake
add_subdirectory(external/thirdparty)
target_link_libraries(myapp PRIVATE thirdparty)
```

三种方式的取舍：`find_package` 最干净但要求库已预装；`FetchContent` 能自动拉取但需要网络；`add_subdirectory` 最简单但不方便管理版本。

## 7、一个完整的顶层 CMakeLists.txt 参考

```cmake
cmake_minimum_required(VERSION 3.14)
project(MyApp VERSION 1.0.0 LANGUAGES C)

# C 标准
set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

# 全局编译选项（仅对当前目录及子目录生效）
add_compile_options(-Wall -Wextra)

# 构建类型默认值
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Debug)
endif()

# 子目录
add_subdirectory(lib/engine)
add_subdirectory(lib/network)
add_subdirectory(src)
add_subdirectory(tests)
```

简洁、清晰、一目了然。每个子目录管好自己的 target，顶层只负责组装。

## 8、小结

多目录 CMake 项目的组织原则只有三条：

1.  **一个目录一个 CMakeLists.txt**，各管各的
2.  **library 用 PUBLIC 暴露头文件路径**，下游自动继承
3.  **顶层只做组装**，不深入子模块的实现细节

掌握了这个套路，你就能把项目搭得像乐高积木一样——每个模块独立、可复用、可测试。

---

下一篇文章，我们来聊一个进阶话题：交叉编译。你能在 x86 的笔记本电脑上编译出 ARM 开发板上能跑的程序吗？

每天前进一小步，就是一个新的高度！
