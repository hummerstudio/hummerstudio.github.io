---
title: 构建工具（五）：CMake 入门——为什么你的项目需要一个 CMakeLists.txt
author: 唐明
categories: [build]
tags: [Linux, C/C++, CMake, 构建工具]
---

* TOC
{:toc}

## 1、从 Makefile 到 CMake：为什么还要再学一个工具？

前面几篇文章，我们一直在聊 Makefile。它够用了吗？

如果你的项目只在 Linux 上用 gcc 编译，make 基本够用。但一旦你需要：
- 在 Windows 上用 Visual Studio 编译
- 在 macOS 上用 Xcode 编译
- 检测系统上有没有某个库
- 根据系统版本选择不同的编译选项
- 让团队成员（用着不同的操作系统）都能编译通过

手写 Makefile 就会变成一个噩梦。不同平台的编译器和构建工具完全是两套语言——Windows 用 `cl.exe` 和 `nmake`，Linux 用 `gcc` 和 `make`，你没法写一个通用的 Makefile。

CMake 就是来解决这个问题的：**你写一份构建描述，它帮你生成对应平台的构建文件**。

<!--以上为摘要内容-->

## 2、CMake 的定位

CMake 不是构建系统本身——它是**构建系统的生成器**。

```
CMakeLists.txt → cmake → 生成构建文件 → 构建系统执行编译
```

我打个比方：
- `make` 是厨师，直接炒菜
- CMake 是点菜系统——你告诉它要点什么菜，它帮你生成适合这个厨房的菜单（Makefile / Ninja / Visual Studio 工程文件）

这种设计的最大好处：**一份 `CMakeLists.txt`，到处能用**。不管是 Linux 开发者用 `make`，还是 Windows 开发者用 Visual Studio，大家改的都是同一份 CMakeLists.txt。

## 3、你的第一个 CMakeLists.txt

假设你有一个单文件的 C 项目：

```
myapp/
├── main.c
└── CMakeLists.txt
```

`CMakeLists.txt` 可以简单到只有三行：

```cmake
cmake_minimum_required(VERSION 3.10)
project(MyApp C)
add_executable(myapp main.c)
```

解释一下：
- `cmake_minimum_required`：声明你需要的 CMake 最低版本。这是每个 CMakeLists.txt 的第一行。
- `project`：给你的项目起个名字，同时声明使用的语言（C、CXX 等）。
- `add_executable`：告诉 CMake 我们要生成一个可执行文件，名字叫 `myapp`，源码是 `main.c`。

看上去很简单？那是因为 CMake 有大量的**默认行为**——它会自动检测你的编译器、系统类型，帮你配置好了。

## 4、构建流程

CMake 有一个非常重要的习惯：**源码外构建**（out-of-source build）。

意思是：不要让编译生成的临时文件污染干净的源代码目录。

标准流程：

```bash
cd myapp
mkdir build && cd build
cmake ..
make
```

- `mkdir build`：创建构建目录
- `cmake ..`：告诉 cmake 去上级目录找 `CMakeLists.txt`，在当前目录生成构建文件
- `make`：执行编译

编译产物都在 `build/` 里，源代码目录干干净净。想清理？直接 `rm -rf build` 就行。这就是源码外构建的好处。

## 5、指定编译器和构建类型

CMake 让你可以灵活控制编译行为：

```bash
# 指定 C 编译器
cmake .. -DCMAKE_C_COMPILER=/usr/bin/clang

# 指定构建类型：Debug（带调试信息）/ Release（优化）/ RelWithDebInfo（优化+调试信息）
cmake .. -DCMAKE_BUILD_TYPE=Debug
```

`-D` 参数是 CMake 的配置方式，格式是 `-D变量名=值`。你可以在命令行里覆盖 CMakeLists.txt 里的任何变量，非常灵活。

## 6、常见的变量和选项

一个稍微充实一点的 CMakeLists.txt：

```cmake
cmake_minimum_required(VERSION 3.10)
project(MyApp C)

# 设置 C 标准
set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

# 添加编译选项
add_compile_options(-Wall -Wextra)

# 添加预处理器定义
add_definitions(-DVERSION=\"1.0\")

# 可执行文件
add_executable(myapp main.c utils.c network.c)
```

- `set()`：设置变量
- `add_compile_options()`：全局添加编译选项
- `add_definitions()`：添加宏定义（相当于 `-D`）

## 7、CMake 是如何找到 Makefile 的？

你可能会想：我执行了 `cmake ..`，它怎么知道要生成 Makefile 而不是 Visual Studio 工程文件？

CMake 有一个概念叫**生成器**（generator）。默认情况下，它根据你的操作系统自动选择：

- Linux / macOS：`Unix Makefiles`
- Windows：Visual Studio 对应版本的生成器

你也可以手动指定：

```bash
# 生成 Ninja 构建文件（更快）
cmake .. -G Ninja
ninja

# 生成 Xcode 工程（macOS）
cmake .. -G Xcode
```

目前你不需要纠结这个，默认的 `make` 就很好。

## 8、CMake vs Makefile：一个对照表

| 需求 | Makefile | CMake |
|------|----------|-------|
| 添加源文件 | 手动修改 OBJS 变量 | `add_executable(app main.c foo.c)` |
| 指定编译选项 | `CFLAGS += -Wall` | `add_compile_options(-Wall)` |
| 引入库 | 手动写 `-I` `-L` `-l` | `find_package()` + `target_link_libraries()` |
| 跨平台 | 基本不可能 | 天然支持 |
| 学习曲线 | 低 | 中 |

CMake 的学习确实比 Makefile 陡一些，但一旦上手，大型项目的维护成本会低很多。

---

下一篇文章，我们学习「现代 CMake」的正确打开方式——`target_*` 系列的用法。这可能是你学习 CMake 过程中最重要的一节课。

每天前进一小步，就是一个新的高度！
