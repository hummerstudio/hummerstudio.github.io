---
title: 'Build Tools (Part 8): Cross-Compilation — Compiling ARM Programs on Your x86 Computer'
date: 2023-07-23
author: Tang Moying
categories: [build]
tags: [Linux, C/C++, Cross-Compilation, ARM, CMake]
lang: en
alt_url: /post/build-08-cross-compilation
---


## 1. You Will Run Into This Need

One day you may find yourself in a scenario like this:

- You want to run a program on a Raspberry Pi (ARM architecture), but the Pi is too weak, and compiling directly on it is unbelievably slow
- You work on embedded systems, and your target board is an ARM chip with no operating system at all, so installing a compiler on it is even less of an option
- You want to build a native library for an Android or iOS device

That's when you need **cross-compilation**: compiling, on one CPU architecture, a program that runs on another CPU architecture.

It's like making Japanese food in a Chinese kitchen — the tools and the environment are different, but what you make has to be eaten in another environment.

<!--以上为摘要内容-->

## 2. The Core of Cross-Compilation: The Toolchain

To get an x86 computer to compile a program that ARM can run, you need three things:

1.  **A cross-compiler**: a gcc that emits ARM instructions (usually named `arm-linux-gnueabihf-gcc` rather than `gcc`)
2.  **The target system's headers and libraries**: you need ARM versions of the base libraries such as `libc` and `libm`
3.  **Something called a sysroot**: a "snapshot" of the target system's filesystem

First install the toolchain:

```bash
# Ubuntu / Debian
sudo apt install gcc-arm-linux-gnueabihf g++-arm-linux-gnueabihf

# after installation, your system has
arm-linux-gnueabihf-gcc --version
```

That `arm-linux-gnueabihf` prefix is actually telling you:
- `arm` — the target architecture
- `linux` — the target operating system
- `gnueabihf` — it uses the GNU C library with hardware floating point (hard float)

Different target platforms have different prefixes, such as `aarch64-linux-gnu-` and `arm-none-eabi-` (bare-metal embedded).

## 3. Writing the Cross-Compilation Command by Hand

Compile an ARM program directly with the cross-compiler:

```bash
arm-linux-gnueabihf-gcc -o hello_arm hello.c
```

The compilation succeeds. But when you copy this `hello_arm` to the Raspberry Pi and run it, it says it can't find a `.so` file. Why?

Because when you compiled it, what got linked in were the libraries on the x86 machine (whose paths may well be wrong), not the libraries on the ARM target system.

That's where the sysroot comes in.

## 4. sysroot: A Mirror of the Target System

`sysroot` is a directory; it is a "miniature edition" of the target system's filesystem — containing the base libraries such as `libc` and `libm` for the ARM architecture, along with all the headers.

A typical usage:

```bash
# suppose you copied the Raspberry Pi's filesystem to /opt/rpi-sysroot
arm-linux-gnueabihf-gcc \
    --sysroot=/opt/rpi-sysroot \
    -o hello_arm hello.c
```

`--sysroot` tells the compiler: every path it searches for headers and libraries is rooted at this directory. When the compiler looks for `/usr/include`, it is in fact looking at `/opt/rpi-sysroot/usr/include`. When it looks for `/lib/libc.so`, it is in fact looking at `/opt/rpi-sysroot/lib/libc.so`.

That ensures that only the correct ARM-version libraries get linked in.

Copying a sysroot by hand is a bit of a chore, but fortunately there are automated tools. A Raspberry Pi, for instance, can be synced straight from the board with `rsync`. For common embedded platforms, the chip vendor usually provides an SDK that ships with its own sysroot and toolchain.

## 5. Cross-Compilation with CMake: Toolchain Files

CMake extracts the cross-compilation configuration into a single file: the toolchain file.

```cmake
# toolchain-arm.cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR arm)

# cross-compiler
set(CMAKE_C_COMPILER arm-linux-gnueabihf-gcc)
set(CMAKE_CXX_COMPILER arm-linux-gnueabihf-g++)

# sysroot
set(CMAKE_SYSROOT /opt/rpi-sysroot)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)   # don't look for build tools inside the sysroot
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)    # only look for libraries inside the sysroot
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)    # only look for headers inside the sysroot
```

To use it:

```bash
mkdir build-arm && cd build-arm
cmake .. -DCMAKE_TOOLCHAIN_FILE=../toolchain-arm.cmake
make
```

Not a single line of CMakeLists.txt has to change. That is CMake's power — build logic and platform configuration kept apart.

The meaning of the three `CMAKE_FIND_ROOT_PATH_MODE` options:
- `PROGRAM` set to `NEVER`: tools needed during the build (such as `cmake`, `protoc`) should come from the host machine, and must not be hunted for inside the sysroot
- `LIBRARY` set to `ONLY`: library files must be of the target architecture, so they may only be searched for inside the sysroot
- `INCLUDE` set to `ONLY`: likewise, headers may only come from the target system

## 6. In Practice: Cross-Compiling for a Raspberry Pi

Suppose we want to compile, for a Raspberry Pi 3 (ARMv7), a program that uses `libcurl`.

**Step one: prepare the sysroot**

```bash
# sync the filesystem from the Raspberry Pi
rsync -avz pi@raspberrypi:/lib pi@raspberrypi:/usr rpi-sysroot/
```

**Step two: write the toolchain file**

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

`${CMAKE_CURRENT_LIST_DIR}` stands for the directory the toolchain file lives in; using it for the sysroot path avoids hard-coding an absolute path.

**Step three: compile**

```bash
mkdir build-rpi && cd build-rpi
cmake .. -DCMAKE_TOOLCHAIN_FILE=../toolchain-rpi.cmake
make -j4
```

The program is built, and it runs as soon as you copy it to the Raspberry Pi. The whole process happens on the x86 machine, drawing on the computer's full performance.

## 7. Common Pitfalls of Cross-Compilation

- **Mismatched library architecture**: the sysroot must hold libraries of the target architecture, otherwise compilation passes and running blows up
- **`find_package` fails**: many libraries' CMake Config files aren't inside the sysroot, so `find_package` can't find them. The fix is to export things by hand or use `pkg-config`
- **A program that builds but won't run**: a program produced by the cross-compiler can't be run directly on your development machine — the architectures differ. Unless you use an emulator such as QEMU

Cross-compilation adds one more layer of complexity compared with native compilation, but it opens the door to embedded and cross-platform development. Once you understand this workflow, you can write programs on your laptop for phones, routers and IoT devices.

---

In the next article we'll get to know a faster build backend — Ninja. Its slogan is: "We do one thing only, and that's make your compilation faster".

A small step forward every day is a new height!
