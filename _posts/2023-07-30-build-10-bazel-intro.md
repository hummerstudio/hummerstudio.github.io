---
title: 构建工具（十）：Bazel 入门——Google 级别的构建系统
author: 唐明
categories: [build]
tags: [Linux, C/C++, Bazel, 构建工具]
---


## 1、CMake 还不够好吗？

我们已经花了五篇文章学 CMake——从入门到现代写法，从多目录组织到交叉编译。对于绝大多数 C/C++ 项目来说，CMake + Ninja 已经是一套非常成熟的方案了。

但假设你的项目是这样的：

- 3000 个源文件，跨越 C++、Java、Python、Go、ProtoBuf 五种语言
- 50 人的团队，每个人都在频繁提交代码
- CI 系统每次 build 都要跑全量测试，但全量构建要 40 分钟

这时候你会发现 CMake 的某些「假设」开始不够用了：

- CMake 默认假设你的源码在一个仓库里，但「一个仓库」的规模是有限的
- 增量构建的判断粒度偏粗——一个 `.o` 变了，依赖它的所有 target 都要重新链接
- 跨语言的构建依赖关系，CMake 处理起来很吃力

Google 也遇到了同样的问题——只不过规模更大。它的整个代码库（Google3）是一个包含 20 亿行代码的巨型 monorepo。为解决这个问题，Google 设计了 Bazel。

<!--以上为摘要内容-->

## 2、Bazel 的设计哲学

Bazel 有三个核心主张：

**可重现构建（Hermetic Builds）**

在 Bazel 的世界里，同样的源码 + 同样的构建命令，无论在谁的机器上、什么时间跑，产生的结果必须一模一样。为实现这一点，Bazel 严格管理构建环境——编译器版本、系统库、环境变量，全部显式声明。不依赖「你机器上恰好装了某某库」这件事。

**增量构建的极致粒度**

Bazel 的增量构建不是看「文件时间戳变了没」，而是对每个 action（编译动作）的输入做哈希。只有哈希变了，才重新执行。这意味着：
- 加一行注释 → 不需要重新链接
- 改了函数实现 → 只重新编译改动的 `.cc`，重新链接受影响的 target
- 改了头文件 → 只重新编译引用了该头文件的 `.cc`

**跨语言统一建模**

在 Bazel 里，C++ 编译、Java 编译、ProtoBuf 代码生成、Python 测试，都是同一套「规则 + target」的抽象。这让跨语言的依赖管理变得自然——你可以在一个 BUILD 文件里同时声明 C++ 的 binary 和 Java 的 test，Bazel 会自己理清依赖顺序。

## 3、Bazel 的核心概念

Bazel 的构建模型围绕三个概念展开：

### Workspace（工作空间）

项目根目录下的 `WORKSPACE` 文件（新版本叫 `MODULE.bazel`）定义了整个项目的根。它声明对外部依赖的引用：

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

每个外部依赖都有唯一的 name、确定的下载地址和哈希值。没有「从系统里找一个叫 libcurl 的东西」这回事。

### Package（包）

每个包含 `BUILD` 文件的目录就是一个 package。`BUILD` 文件描述了该目录下「有什么可以构建的东西」。

### Target（构建目标）

一个 `BUILD` 文件里的构建规则实例。常见的 target 类型：

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

- `cc_library`：C++ 库
- `cc_binary`：C++ 可执行文件
- `cc_test`：C++ 测试

`visibility` 控制哪些 target 可以依赖它，`deps` 声明依赖关系。注意 `:hello-lib` 这种写法——冒号开头表示「同一个 BUILD 文件里的 target」。

### Label（标签）

Bazel 用 label 唯一标识一个 target：

```
//path/to/package:target-name
```

- `//main:hello-world` → 根目录下 main 包里的 hello-world target
- `:hello-lib` → 当前 BUILD 文件里的 hello-lib target
- `@com_google_absl//absl/strings` → 外部依赖 absl 里 strings 包的默认 target

## 4、一个完整的 Bazel 项目

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

**根目录 BUILD：空或只放全局配置。**

**lib/BUILD：**

```python
cc_library(
    name = "hello-lib",
    srcs = ["hello.cc"],
    hdrs = ["hello.h"],
    visibility = ["//visibility:public"],
)
```

**main/BUILD：**

```python
cc_binary(
    name = "hello-world",
    srcs = ["main.cc"],
    deps = ["//lib:hello-lib"],
)
```

构建命令：

```bash
# 构建所有 target
bazel build //...

# 构建特定 target
bazel build //main:hello-world

# 运行
bazel run //main:hello-world

# 跑测试
bazel test //...
```

Bazel 会自动分析依赖图，确定哪些需要重新编译，然后并行执行。

## 5、Bazel 的增量构建有多精确？

假设你只改了 `hello.cc` 里的一个函数实现（没改头文件），Bazel 的构建过程是这样的：

1. 检测到 `hello.cc` 的输入哈希变了
2. 重新编译 `hello.cc` → `hello.o`
3. 重新打包 `//lib:hello-lib`
4. 检测到 `main.cc` 的哈希没变 → 跳过编译
5. 检测到 `//main:hello-world` 的链接输入变了（因为 `hello-lib` 变了） → 重新链接

如果你在 `hello.h` 里加了一行注释（语义不变），Bazel 怎么知道不需要重新编译 `main.cc` 呢？它会对 `.o` 文件的内容做哈希对比——如果最终产物完全一致，Bazel 会认为「什么都没变」，下游 target 也不触发。这比 CMake + make/Ninja 单纯依赖时间戳的粒度更精细。

当然，这种精确性有代价——Bazel 的运行时比 Ninja 重，启动时间也更长。但在超大规模项目里，省下来的编译时间是启动时间的几十倍。

## 6、Bazel 的缺点

必须诚实地说：

- **学习曲线陡**：WORKSPACE、BUILD、`.bzl` 扩展、Starlark 语言……概念体系比 CMake 还多
- **运行时重**：Bazel 本身是 Java 程序，启动慢，内存占用大
- **生态比 CMake 小**：虽然 Google 内部在用，但开源社区的大多数 C/C++ 库不以 Bazel 作为首要构建方式
- **迁移成本高**：从 CMake 切到 Bazel，基本等于重写整个构建系统
- **对小项目过度设计**：10 个源文件的项目用 Bazel，就像开着卡车去买菜

## 7、什么时候该考虑 Bazel？

| 场景 | 推荐 |
|------|------|
| 个人项目 / < 100 个源文件 | **不要用**。CMake 足够了 |
| 中型团队项目 | CMake + Ninja 是最佳组合 |
| 大型 C++ 项目（1000+ 源文件） | 可以考虑，但如果 CMake 没遇到瓶颈就别折腾 |
| monorepo + 多语言（C++/Java/Go/Python） | **Bazel 的优势场景** |
| 对构建可重现性有严格要求 | Bazel 的 hermetic 设计天然支持 |
| 从零开始的新大型项目 | 值得评估，团队能接受学习成本的话 |

一个实用的判断标准：**如果你不觉得 CMake 慢，就别换 Bazel。**

## 8、小结

Bazel 是「构建系统里的高速公路」——建造成本很高，但一旦通了，能承载的流量是普通公路无法比拟的。

它解决的是 CMake 没有覆盖的那些问题：超大规模、跨语言、毫不动摇的可重现性。但这些问题，大多数项目一辈子也遇不到。

理解 Bazel 的意义在于：当你看到有人讨论「为什么 Chromium 不用 Bazel」「为什么 TensorFlow 用 Bazel」，你能理解背后的权衡——不是技术好坏的问题，是在什么规模下、什么需求下做选择的问题。

---

下一篇文章，我们来做一次全景回顾——从 make 到 Bazel，Linux/C/C++ 的构建工具这些年都发生了什么？面对一个新项目，你到底该选哪个工具？

每天前进一小步，就是一个新的高度！
