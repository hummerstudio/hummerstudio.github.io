---
title: 构建工具（八）：交叉编译——在你的 x86 电脑上编译 ARM 程序
author: 唐明
categories: [build]
tags: [Linux, C/C++, 交叉编译, ARM, CMake]
---

* TOC
{:toc}

## 1、你会遇到这个需求

某天，你可能会遇到这样的场景：

- 要在树莓派（ARM 架构）上跑一个程序，但树莓派性能太弱，直接在上面编译慢得令人发指
- 你是做嵌入式的，目标板是 ARM 芯片，根本没操作系统，更不可能在上面装编译器
- 你想给 Android 或 iOS 设备编一个 native 库

这时候你就需要**交叉编译**（cross compilation）：在一种 CPU 架构上，编译出在另一种 CPU 架构上运行的程序。

这就好比你在中式厨房里做日料——工具和环境不一样，但你要做出能在另一个环境里吃的东西。

<!--以上为摘要内容-->

## 2、交叉编译的核心：工具链

要让 x86 的电脑编译出 ARM 能跑的程序，你需要三个东西：

1.  **交叉编译器**：生成 ARM 指令的 gcc（名字通常是 `arm-linux-gnueabihf-gcc` 而不是 `gcc`）
2.  **目标系统的头文件和库**：你得有 ARM 版本的 `libc`、`libm` 等基础库
3.  **一个叫做 sysroot 的东西**：目标系统文件系统的「快照」

先装工具链：

```bash
# Ubuntu / Debian
sudo apt install gcc-arm-linux-gnueabihf g++-arm-linux-gnueabihf

# 安装后，你的系统里就有了
arm-linux-gnueabihf-gcc --version
```

这个 `arm-linux-gnueabihf` 前缀的名字其实在告诉你：
- `arm` — 目标架构
- `linux` — 目标操作系统
- `gnueabihf` — 用的是 GNU C 库，硬件浮点（hard float）

不同的目标平台有不同的前缀，比如 `aarch64-linux-gnu-`、`arm-none-eabi-`（裸机嵌入式）。

## 3、手写交叉编译命令

直接用交叉编译器编译一个 ARM 程序：

```bash
arm-linux-gnueabihf-gcc -o hello_arm hello.c
```

编译成功。但你把这个 `hello_arm` 拷贝到树莓派上跑，它说找不到 `.so` 文件。为什么？

因为你编译的时候链接的是 x86 机器上的库（路径可能不对），而不是 ARM 目标系统上的库。

这就要用到 sysroot。

## 4、sysroot：目标系统的镜像

`sysroot` 是一个目录，它就是目标系统文件系统的「微缩版」——包含 ARM 架构的 `libc`、`libm` 等基础库和所有头文件。

典型用法：

```bash
# 假设你把树莓派的文件系统拷贝到了 /opt/rpi-sysroot
arm-linux-gnueabihf-gcc \
    --sysroot=/opt/rpi-sysroot \
    -o hello_arm hello.c
```

`--sysroot` 告诉编译器：所有搜索头文件和库的路径，都以这个目录为根。编译器找 `/usr/include` 时，实际上找的是 `/opt/rpi-sysroot/usr/include`。找 `/lib/libc.so` 时，实际上找的是 `/opt/rpi-sysroot/lib/libc.so`。

这样就确保了链接的都是 ARM 版本的正确库。

手动拷贝 sysroot 比较麻烦，好在有自动化工具。比如树莓派可以用 `rsync` 直接从开发板同步。对于常见的嵌入式平台，芯片厂商通常会提供 SDK，里面自带了 sysroot 和工具链。

## 5、CMake 的交叉编译：工具链文件

CMake 把交叉编译的配置抽成了一个文件：工具链文件（toolchain file）。

```cmake
# toolchain-arm.cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR arm)

# 交叉编译器
set(CMAKE_C_COMPILER arm-linux-gnueabihf-gcc)
set(CMAKE_CXX_COMPILER arm-linux-gnueabihf-g++)

# sysroot
set(CMAKE_SYSROOT /opt/rpi-sysroot)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)   # 不在 sysroot 里找编译工具
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)    # 只在 sysroot 里找库
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)    # 只在 sysroot 里找头文件
```

使用：

```bash
mkdir build-arm && cd build-arm
cmake .. -DCMAKE_TOOLCHAIN_FILE=../toolchain-arm.cmake
make
```

CMakeLists.txt **一行都不用改**。这就是 CMake 的威力——构建逻辑和平台配置分离。

`CMAKE_FIND_ROOT_PATH_MODE` 三个选项的含义：
- `PROGRAM` 设为 `NEVER`：编译时需要的工具（比如 `cmake`、`protoc`）应该用宿主机上的版本，不要到 sysroot 里找
- `LIBRARY` 设为 `ONLY`：库文件必须用目标架构的，只能在 sysroot 里找
- `INCLUDE` 设为 `ONLY`：同理，头文件也只能用目标系统的

## 6、实战：为树莓派交叉编译

假设我们要为树莓派 3（ARMv7）编译一个使用了 `libcurl` 的程序。

**第一步：准备 sysroot**

```bash
# 从树莓派同步文件系统
rsync -avz pi@raspberrypi:/lib pi@raspberrypi:/usr rpi-sysroot/
```

**第二步：写工具链文件**

```cmake
# toolchain-rpi.cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR armv7l)
set(CMAKE_C_COMPILER arm-linux-gnueabihf-gcc)
set(CMAKE_SYSROOT ${CMAKE_CURRENT_LIST_DIR}/rpi-sysroot)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
```

`${CMAKE_CURRENT_LIST_DIR}` 代表工具链文件所在的目录，用它做 sysroot 路径，可以避免硬编码绝对路径。

**第三步：编译**

```bash
mkdir build-rpi && cd build-rpi
cmake .. -DCMAKE_TOOLCHAIN_FILE=../toolchain-rpi.cmake
make -j4
```

程序编译完成，拷到树莓派上就能跑了。全程在 x86 机器上完成，用上了电脑的完整性能。

## 7、交叉编译的常见坑

- **库的架构不匹配**：sysroot 必须是目标架构的库，否则编译能过、运行就炸
- **find_package 失效**：很多库的 CMake Config 文件不在 sysroot 内，`find_package` 找不到。解决方法是手动导出或用 `pkg-config`
- **编译时能运行的程序**：用交叉编译器生成的程序，不能在你的开发机上直接跑——架构不同。除非用 QEMU 等模拟器

交叉编译比本地编译多了一层复杂度，但它打开了嵌入式和跨平台开发的大门。理解了这个流程，你就能在笔记本上为手机、路由器、IoT 设备编写程序了。

---

下一篇文章，我们来认识一个更快的构建后端——Ninja。它的 slogan 是：「我们只做一件事，就是让你编译得更快」。

每天前进一小步，就是一个新的高度！
