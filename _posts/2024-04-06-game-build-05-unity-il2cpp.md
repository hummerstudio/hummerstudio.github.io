---
title: 游戏构建：Unity 构建（五）：IL2CPP 与跨平台——一次开发，多端发布是怎么实现的？
author: 唐明
categories: [build]
tags: [游戏开发, Unity, 游戏引擎, 构建工具, IL2CPP, Mono, Cross-Platform, Game Build]
---


## 1、为什么 C# 需要"转译"？

C# 是一个托管语言。你写的 C# 代码编译后得到的不是机器码，而是 IL（Intermediate Language，中间语言）。运行时由 .NET Runtime 或者 Mono Runtime 来解释执行或者 JIT（Just-In-Time）编译执行。

在 PC 上，这毫无问题。Windows 自带了 .NET Runtime，或者 Unity 可以内嵌一个 Mono Runtime 在你的游戏里。JIT 编译一下，跑得飞起。

但是 iOS 呢？

苹果的规则很严格：**iOS 不允许 JIT 编译**。你不能在运行的时候动态生成可执行代码。所以 Mono 的 JIT 模式在 iOS 上直接就被毙了。

这就是 IL2CPP 诞生的原因。

<!--以上为摘要内容-->

## 2、Mono 时代：简单，但不够

Unity 最早的后端是 Mono。C# 脚本 → 编译成 IL → Mono Runtime 解释执行。

在早期，Mono 基本够用。但有几个问题慢慢暴露出来：

- **iOS 上的 JIT 限制**：Mono 在 iOS 只能用 AOT 模式（Ahead-Of-Time，提前编译）。但 Mono 的 AOT 支持并不完善，很多 C# 高级特性（泛型、反射的某些用法）在 AOT 下会出问题
- **Mono 版本跟不上**：Unity 用的 Mono 版本长期停留在 .NET 2.0/3.5 时代，和 .NET 社区的主流版本差距越来越大
- **性能天花板**：Mono 的 JIT 编译器优化不如现代编译器，游戏这种对性能极度敏感的场景，差 10% 可能就是 30fps 和 33fps 的区别

所以 Unity 做了一个重大的技术决策——**开发 IL2CPP，把 C# IL 转成 C++，再用平台原生编译器编译**。

## 3、IL2CPP 是怎么工作的？

名字已经透露了一切：IL → To → C++。

它的工作流程分两步：

**第一步：IL2CPP.exe（转译器）**

IL2CPP 是一个独立的可执行文件（在 Unity 安装目录里）。它做的是：

1. 读入所有 C# 脚本编译出来的 IL 程序集（`.dll` 文件）
2. 把 IL 代码**转译成 C++ 代码**
3. 同时生成一份 C++ 版本的 GC（垃圾回收器）、线程模型、反射支持代码

这个「转译」的过程是**静态的，在构建时完成**。不存在运行时 JIT。

**第二步：平台编译器**

生成的 C++ 代码交给对应平台的原生编译器：

- iOS → Xcode 的 clang
- Android → NDK 的 clang
- Windows → MSVC 或 clang
- macOS → Xcode 的 clang

原生编译器把生成的 C++ 编译成机器码，最终链接成可执行文件。

## 4、IL2CPP 带来了什么好处？

**跨平台统一**。不管你发布到哪个平台，C# 代码都先转成 C++，再用该平台的原生编译器编译。这样 Unity 只需要维护一套 IL → C++ 的转译器，而不是为每个平台维护一套 Runtime。

**性能提升**。C++ 编译器（clang、MSVC）已经发展了二十多年，优化能力极强。同样的逻辑，经过 IL2CPP → C++ → clang -O2 这条链路，通常比 Mono JIT 跑得更快。官方数据说 IL2CPP 比 Mono 快 1.5 到 2 倍。

**安全性**。IL2CPP 输出的是原生机器码，不像 IL 那样容易被反编译工具（如 ILSpy、dnSpy）直接还原成可读的 C# 源码。对防破解有一点帮助（虽然只是提高门槛，不是绝对安全）。

## 5、IL2CPP 的代价：构建时间

享受性能提升的代价，就是**构建时间暴涨**。

Mono 构建的流程是：C# → IL → 打包 Mono Runtime + IL → 出包。IL2CPP 构建多了两道「重」工序：

1. IL → C++ 转译（你的 C# 代码越大，生成的 C++ 越多）
2. 原生编译（clang 编译几万甚至几十万行生成的 C++ 代码）

两三万行 C# 的项目，IL2CPP 可能生成十几万行 C++。十几万行 C++ 的正常编译时间，你应该心里有数。

更雪上加霜的是，Unity 每次构建都会**全量重新生成 C++ 代码**，然后全量重新编译。如果原生编译器没有很好的缓存机制（比如 Xcode 的 DerivedData），每次构建都是从零开始。

一些团队的做法是：
- 本地开发用 Mono 后端（构建快，迭代方便）
- CI / 出包用 IL2CPP 后端（构建慢，但出的是正式包）
- 用 cache-server 缓存编译中间产物

## 6、平台差异：不是所有平台都一样

### iOS

- 必须用 IL2CPP（苹果不允许 JIT）
- 构建产物是 Xcode Project，需要 Mac 上用 Xcode 再编译一次
- 纹理压缩强制使用 PVRTC 或 ASTC
- 构建时间最长（因为生成 Xcode Project 后还要再编译一遍）

### Android

- 可选 Mono 或 IL2CPP
- IL2CPP 构建需要 NDK
- APK 或 AAB 输出
- 纹理压缩通常用 ETC2 或 ASTC
- 构建时间主要卡在 NDK 编译阶段

### Windows / macOS / Linux

- 桌面平台，可选 Mono 或 IL2CPP
- 构建最快（不需要像 iOS 那样再套一层 Xcode 编译）

### WebGL

- 只能用 IL2CPP（WebAssembly 的要求）
- 构建产物是 WebAssembly 文件
- C# 代码被转成 C++ 然后编译成 Wasm
- 构建时间很长，WebAssembly 限制了多线程，编译速度慢

## 7、常见坑点

**泛型 + IL2CPP 的组合**。Mono 下能跑的泛型代码，在 IL2CPP 下可能会出「ExecutionEngineException」或者直接崩溃。因为 IL2CPP 需要在构建时确定所有用到的泛型实例化，做 AOT 编译。如果你用了大量动态反射 + 泛型，IL2CPP 可能「猜不到」你的实际类型参数。

不过好消息是，Unity 近年做了很多改进——`[Preserve]` 特性、`link.xml` 配置、Managed Stripping Level 控制，可以让开发者手动干预 IL2CPP 的裁剪行为。

**构建失败不留有效错误信息**。IL2CPP 转译或编译失败的时候，错误信息常常淹没在几万行输出里。排查起来非常痛苦。建议用 `-logFile` 把构建日志输出到文件，再搜索 `error` 关键字。

**增量构建不靠谱**。理论上 IL2CPP 支持增量构建——你只改了一点 C# 代码，下次构建应该只重新生成和编译变化的部分。但实践中，很多团队的增量构建跑着跑着就失效了，变成全量重编。原因通常是 Library 目录里的缓存文件被清理或不一致。

## 8、小结

IL2CPP 是 Unity 为了跨越平台鸿沟而生的技术方案。它的逻辑很清晰：

> 既然不同平台有不同的编译器和限制，那就把 C# 统一转成 C++——一个几乎所有平台都能编译的语言。

思路是优雅的，代价是构建时间。这种「牺牲构建效率换运行效率」的取舍，在游戏引擎领域是非常经典的 trade-off。

到这里，Unity 构建五篇文章就写完了。我们走过了：

- 构建流程全景（Build 按钮背后的八个阶段）
- AssetBundle 接口演进（第 0 代手写 → 第 1 代标记/代码两种路线 → 第 2 代 SBP → 第 2 代 Addressables）
- Addressables 资源管理系统
- IL2CPP 的跨平台机制（C# → C++ → 机器码）

---

下一篇开始，我们转战 Unreal——先聊聊 UBT 和 UAT 是什么，`.uproject` 是怎么变成一个 `.exe` 的？

每天前进一小步，就是一个新的高度！
