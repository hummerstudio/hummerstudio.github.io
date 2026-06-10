---
title: 游戏构建：Unreal 构建（一）：.uproject 是怎么变成一个 .exe 的？
author: 唐明
categories: [build]
tags: [游戏开发, Unreal, 游戏引擎, 构建工具, UBT, UAT, Game Build]
---


## 1、两个陌生的缩写

前五篇文章我们聊了 Unity 的构建体系。从 Build 按钮背后的八个阶段，到 AssetBundle 三代接口演进（第 0 代手写 → 第 1 代标记 → 第 2 代 SBP），再到 Addressables 和 IL2CPP 的跨平台方案。

今天开始，我们转战 Unreal。

如果你刚接触 Unreal 的构建，你会很快碰到两个缩写：**UBT** 和 **UAT**。

我第一次见这两个缩写的时候，反应大概是：「这又是什么东西？」

在开篇文章里我提过一个观点：Unreal 的构建体系比 Unity 工业得多。这个「工业化」最直接的体现，就是 UBT 和 UAT 这两个独立的命令行工具。它们不是你打开编辑器窗口才能用的功能——它们是**独立的 CLI 程序**，有清晰的步骤拆分和参数控制。当然，它们仍然需要 Unreal 引擎安装在构建机器上（打包、Cook、Shader 编译等实际操作都需要引擎执行），但入口完全独立于编辑器 GUI。

这篇文章，我们就来搞清楚它们到底是什么，以及一个 `.uproject` 项目是怎么最终变成一个 `.exe` 的。

<!--以上为摘要内容-->

## 2、UBT：Unreal 的编译发动机

UBT 的全称是 **UnrealBuildTool**。

它的职责非常单一：**把你的 C++ 源代码编译成可执行文件**。

听上去和 Make、CMake 干的事差不多？对的。UBT 本质就是一个构建系统，只不过它是 Unreal 专用的，对 Unreal 的模块体系有深入理解。

UBT 是一个 C# 项目，源码就在你的 Unreal 安装目录的 `Engine/Source/Programs/UnrealBuildTool/` 下。它是一个独立的命令行工具——你不需要打开编辑器窗口，不需要 GUI，在 CI 脚本里直接调命令行即可。当然，它仍然依赖 Unreal 引擎的安装（需要引擎的编译工具链和头文件），但入口是纯 CLI 的。

调用方式大致是这样：

```bash
# 编译项目的 Development Editor 版本
Engine/Build/BatchFiles/RunUBT.bat \
    MyGameEditor \
    Development \
    Win64 \
    -Project="D:/MyGame/MyGame.uproject"
```

这里的参数含义：
- `MyGameEditor` → Target 名称（带 Editor 后缀 = 编译编辑器版本）
- `Development` → 编译配置（Development / DebugGame / Shipping）
- `Win64` → 目标平台
- `-Project` → 项目路径

## 3、Target 和 Module：UBT 的两层组织单元

UBT 看待一个 Unreal 项目的方式，分为两个层级。

### Target

Target 是构建的**顶层目标**。一个 `.uproject` 项目可以定义多个 Target，每个 Target 对应一种输出：

- **Game Target**（如 `MyGame`）：最终出包的运行时版本
- **Client Target**（如 `MyGameClient`）：专用服务器的客户端版本
- **Server Target**（如 `MyGameServer`）：专用服务器版本，不含渲染
- **Editor Target**（如 `MyGameEditor`）：编辑器版本，包含编辑器功能

每个 Target 对应一个 `Source/` 下的 `.Target.cs` 文件。类似这样：

```csharp
// MyGame.Target.cs
public class MyGameTarget : TargetRules
{
    public MyGameTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Game;
        DefaultBuildSettings = BuildSettingsVersion.V5;
        ExtraModuleNames.Add("MyGame");
    }
}
```

### Module

Module 是 Target 内部的**功能分组单元**。一个 Target 里面可以有多个 Module，每个 Module 是一个独立的编译单元。

Module 由 `Source/` 下各个子目录里的 `.Build.cs` 文件定义：

```csharp
// MyGame.Build.cs
public class MyGame : ModuleRules
{
    public MyGame(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
        
        PublicDependencyModuleNames.AddRange(new string[] {
            "Core",
            "CoreUObject",
            "Engine",
            "InputCore"
        });
        
        PrivateDependencyModuleNames.AddRange(new string[] {
            "Slate",
            "SlateCore"
        });
    }
}
```

`.Build.cs` 里你声明这个模块依赖了哪些其他模块（Public 还是 Private），UBT 就知道编译顺序、链接参数该怎么处理了。

这比 Unity 的 Assembly Definition（`.asmdef`）复杂，但也更强大——UBT 理解整个模块依赖图，能自动处理编译顺序、预编译头（PCH）、链接参数等一大堆事情。

## 4、UAT：Unreal 的构建调度中心

如果说 UBT 是「发动机」，UAT 就是「总调度」。

UAT 的全称是 **UnrealAutomationTool**。它的职责不是直接编译代码，而是**编排整个构建流程**——Cook、Pak、Stage、Deploy……这些任务都由 UAT 来调度执行。

UAT 也是一个独立的 C# 项目，源码在 `Engine/Source/Programs/AutomationTool/`。

一个典型的 UAT 调用长这样：

```bash
Engine/Build/BatchFiles/RunUAT.bat \
    BuildCookRun \
    -project="D:/MyGame/MyGame.uproject" \
    -platform=Win64 \
    -clientconfig=Shipping \
    -serverconfig=Shipping \
    -cook \
    -stage \
    -pak \
    -archive \
    -archivedirectory="D:/BuildOutput"
```

各参数含义：
- `BuildCookRun` → 告诉 UAT 执行标准的「构建 + Cook + 运行就绪」流程
- `-cook` → 执行 Cook（资源转平台格式）
- `-stage` → 把构建产物整理到一起
- `-pak` → 把资源打成 Pak 文件
- `-archive` → 输出到归档目录

你可以看到，UAT 的 BuildCookRun 其实是一个**编排命令**——它在内部会先调 UBT 编译 C++ 代码，然后调 Cook 命令处理资源，然后调 Pak 命令打包资源，最后整理到输出目录。一步到位。

## 5、完整构建流程：从 .uproject 到 .exe

一个完整的 Unreal 项目构建流程如下：

```
① UAT 接收入参（平台、配置、是否 Cook / Pak 等）
    ↓
② UAT 调用 UBT → 编译所有 C++ 代码
    （UBT 解析 Target / Module 依赖图，调用平台编译器）
    ↓
③ UAT 调用 Cook Commandlet → 处理所有资源
    （贴图转格式、材质烘焙、Shader 预编译等）
    ↓
④ UAT 调用 Pak 工具 → 把 Cook 后的资源打成 .pak 文件
    ↓
⑤ UAT 整理输出（Stage）→ 把 .exe + .pak + 运行时 DLL 放到一起
    ↓
⑥ UAT 输出到归档目录（Archive）→ 完成
```

这个过程，**你可以在纯命令行上完成**。不需要打开编辑器窗口，不需要 GUI，一个 CI 脚本就能全自动跑通。UAT 把 Build → Cook → Pak → Archive 每一步都拆分成独立的、可传参控制的子任务，而不是像 Unity 那样只能启动一个完整编辑器进程然后祈祷它别崩。

这就是我在开篇文章里说的「工业化」的味道。

## 6、和 Unity 构建的对标

| 维度 | Unity | Unreal |
|------|-------|--------|
| 代码编译 | 编辑器内部 Roslyn 编译 C# | UBT（独立 CLI）调平台编译器编译 C++ |
| 资源处理 | Editor 内 Importer/Processor | Cook Commandlet |
| 资源打包 | BuildPipeline API（在编辑器进程中） | Pak 工具（独立 CLI） |
| CI 入口 | `-batchmode` 启动完整编辑器进程，任何时候都会重新导入资源 | UAT CLI，按步骤调引擎功能，流程可拆分传参 |
| 构建调度 | 自己写脚本串流程 | UAT 的 BuildCookRun 一键编排 |
| 源码开放性 | 前几代（SBP 之前）打包源码不开放 | 完全开源 |

Unity 的构建**只能用编辑器进程作为入口**——`-batchmode` 本质上就是启动一个完整的 Unity Editor，只是没有 GUI。每次调用都必然加载引擎、导入资源，开发者对内部流程几乎不可控。Unreal 把编译器（UBT）和调度器（UAT）都做成了独立的命令行工具，虽然它们仍然需要引擎安装来执行实际工作，但入口是 CLI 的，流程可以按步骤拆分、按参数控制。

还有一个容易被忽略的差异：**源码开放性**。Unity 在 SBP 之前，打包 Pipeline 的源码是不开放的——打包出了问题，你想自己修都没门，只能等官方更新或者绕道 workaround。SBP 的源码是开放的（虽然底层最终也调了引擎内部接口，但至少大部分逻辑暴露出来了）。而 **Unreal 是完全开源的**——UAT、UBT、Cook、Pak 的源码你都可以看、可以改、可以调试。这在构建自动化这个领域，是巨大的优势。

## 7、小结

UBT 和 UAT 的名字虽然陌生，但职责很清晰：

- **UBT**：编译 C++ 代码，管编译依赖和链接
- **UAT**：编排整个构建流程，Build → Cook → Pak → Archive 一整套

理解这两个工具，你就理解了 Unreal 构建骨架的一半。另一半——Cook 和 Pak 怎么处理资源——我们下两篇文章接着说。

---

下一篇，我们来聊聊 Cook——Unreal 资源构建的核心。为什么 Unreal 要把资源处理叫做「做菜」（Cook）？一次 Cook 到底要处理多少东西？为什么每次 Cook 都这么慢？

每天前进一小步，就是一个新的高度！
