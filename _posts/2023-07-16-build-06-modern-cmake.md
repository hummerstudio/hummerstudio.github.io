---
title: 构建工具（六）：现代 CMake 之道——target_* 与接口传播
author: 唐明
categories: [build]
tags: [Linux, C/C++, CMake, 现代CMake]
---

* TOC
{:toc}

## 1、一则警告

如果你用搜索引擎查 CMake 用法，大概率会搜到这样的代码：

```cmake
include_directories(${PROJECT_SOURCE_DIR}/include)
link_libraries(curl ssl crypto)
add_executable(myapp main.c)
```

这能跑。但如果你这样写——

**说明你看的是旧时代的 CMake。** 这种写法在 CMake 2.x 时代是主流，但从 CMake 3.0 开始，社区逐渐转向了另一种风格：**现代 CMake**（Modern CMake）。

这篇文章就是要讲清楚：为什么老写法不好，新写法好在哪。这可能是你学 CMake 过程中**最重要的观念转变**。

<!--以上为摘要内容-->

## 2、老写法的核心问题：全局污染

老写法的典型模式是「全局设置 + 局部目标」：

```cmake
# 老写法——全局污染
include_directories(include)
include_directories(third_party/json/include)
include_directories(third_party/zlib/include)
link_libraries(curl ssl crypto z)
add_executable(myapp main.c)
```

这种方式的问题在于：`include_directories` 和 `link_libraries` 是**全局命令**——它们对**所有**后面的 target 都生效。

如果项目里只有一个 target，这不是问题。但真实项目很可能有多个 target：

```cmake
include_directories(include)
add_executable(myapp main.c)
add_library(mylib lib.c)   # mylib 也被迫继承了上面的 include 路径
add_executable(tests test.c) # tests 也是
```

你不能精确控制「哪个 target 该有哪些头文件路径」。这种全局污染会导致意外的依赖关系，让项目的模块边界模糊不清。

打个比方：老写法就像在一栋大房子里只装了一个总电源开关——要么全屋亮灯，要么全屋熄。现代 CMake 则是给每个房间装独立的开关，精确控制。

## 3、现代 CMake 的核心：target 为本

现代 CMake 的哲学是：**一切都以 target 为中心，显式声明 target 之间的依赖关系。**

一切从 `add_executable` 或 `add_library` 创建的 target 出发，用 `target_*` 系列命令把属性精确绑定到每个 target 上。

```cmake
# 现代 CMake 写法
add_executable(myapp main.c)
target_include_directories(myapp PRIVATE include)
target_link_libraries(myapp PRIVATE curl ssl)
```

- `target_include_directories`：只对 `myapp` 这个 target 生效，其他 target 不受影响
- `target_link_libraries`：同样只对 `myapp` 生效

每个 target 管好自己的事情，各不干扰。

## 4、PUBLIC、PRIVATE、INTERFACE 三部曲

`target_*` 命令里最让人困惑的就是这三个关键字。但理解了它们，现代 CMake 就通了一大半。

假设你写了一个库叫 `mylib`：

```cmake
add_library(mylib mylib.c)
```

它有一个公共头文件 `mylib.h`，放在 `include/` 目录下。同时它内部实现用了 `zlib`。

### PRIVATE

`mylib` 私有的东西——自己要用，但使用者（下游的 target）不需要知道：

```cmake
# zlib 是 mylib 内部实现用的，使用者不需要关心
target_link_libraries(mylib PRIVATE z)
```

### PUBLIC

`mylib` 公开的东西——自己要用，使用者也要继承：

```cmake
# include/ 里的头文件，mylib 自己要用，使用者也必须看到
target_include_directories(mylib PUBLIC include)
```

当另一个 target 链接了 `mylib`：

```cmake
add_executable(myapp main.c)
target_link_libraries(myapp PRIVATE mylib)
```

`myapp` 会自动获得 `include/` 这个头文件路径——不需要再写一行 `target_include_directories(myapp ...)`。

这就是**接口传播**：依赖信息沿着 target 链自动传递。

### INTERFACE

只给使用者，自己不用：

```cmake
# header-only 库，自己没有编译产物，只有头文件路径需要传播
add_library(myheaderlib INTERFACE)
target_include_directories(myheaderlib INTERFACE include)
```

## 5、一张决断表

| 场景 | 用什么 |
|------|--------|
| 自己要用，使用者不需要知道 | `PRIVATE` |
| 自己要用，使用者也需要 | `PUBLIC` |
| 自己不用，只给使用者 | `INTERFACE` |

记住这个简单判断法：问自己「如果没人链接我的 target，这个东西还需要吗？」
- 不需要 → `PRIVATE`
- 需要 → `INTERFACE`
- 既需要又需要传出去 → `PUBLIC`

## 6、一个完整例子

```cmake
cmake_minimum_required(VERSION 3.10)
project(MyProject C)

# header-only 库
add_library(config INTERFACE)
target_include_directories(config INTERFACE include/config)

# 静态库，内部用了 zlib，对外暴露 api.h 里的接口
add_library(engine engine.c)
target_include_directories(engine
    PUBLIC include/engine      # 使用者需要看到 engine 的公开头文件
    PRIVATE third_party/helper  # 只有 engine 自己用的工具
)
target_link_libraries(engine
    PUBLIC config              # engine 公开了对 config 的依赖，传出去
    PRIVATE z                  # zlib 是实现细节，不传出去
)

# 可执行文件
add_executable(myapp main.c)
target_link_libraries(myapp PRIVATE engine)
# myapp 自动获得了 config 和 engine 的 PUBLIC 头文件路径
# 但不会受到 engine 的 PRIVATE 依赖影响
```

对比老写法，这个版本：
- 依赖关系一目了然
- 修改 library 时，影响范围被精确控制
- 新增 target 时，不会有意外的继承

## 7、小结

现代 CMake 的核心信条就两条：

1.  **以 target 为基本单位思考**，不要用全局命令
2.  **用 PUBLIC / PRIVATE / INTERFACE 精确表达依赖关系**

一旦习惯了这个思维，你会发现写 CMake 不再是「怎么配能跑」，而是「每个 target 该知道什么，不该知道什么」——这是一个架构问题，不只是配置问题。

---

下一篇文章，我们来解决实战问题：一个真实的多目录项目，CMakeLists.txt 该怎么组织？

每天前进一小步，就是一个新的高度！
