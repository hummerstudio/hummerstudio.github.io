---
title: 'Game Builds: Unreal Build (Part 1): How Does a .uproject Become an .exe?'
date: 2024-04-13
author: Tang Moying
categories: [build]
tags: [Game Development, Unreal, Game Engines, Build Tools, UBT, UAT, Game Build]
lang: en
alt_url: /post/game-build-06-unreal-ubt-uat
---


## 1. Two Unfamiliar Acronyms

In the previous five articles we talked about Unity's build system. From the eight stages behind the Build button, to the three-generation evolution of the AssetBundle APIs (generation 0 written by hand → generation 1 tagging → generation 2 SBP), and on to the cross-platform approach of Addressables and IL2CPP.

Starting today, we switch over to Unreal.

If you're new to building in Unreal, you'll quickly run into two acronyms: **UBT** and **UAT**.

The first time I saw these two acronyms, my reaction was roughly: “What on earth are these?”

In the opening article I made the point that Unreal's build system is far more industrial than Unity's. The most direct expression of that “industrialization” is these two standalone command-line tools, UBT and UAT. They are not features you can only use by opening an editor window — they are **standalone CLI programs** with a clear split of steps and parameter control. Of course, they still require the Unreal engine to be installed on the build machine (packaging, cooking, shader compilation and other actual operations all need the engine to perform them), but the entry point is completely independent of the editor GUI.

In this article, we're going to get clear on what they actually are, and how a `.uproject` project eventually becomes an `.exe`.

<!--以上为摘要内容-->

## 2. UBT: Unreal's Compilation Engine

UBT stands for **UnrealBuildTool**.

Its job is very narrow: **compile your C++ source code into an executable**.

Sounds about the same as what Make and CMake do? Right. UBT is essentially a build system, except that it's Unreal-specific and has a deep understanding of Unreal's module system.

UBT is a C# project, and its source code lives under `Engine/Source/Programs/UnrealBuildTool/` in your Unreal installation directory. It's a standalone command-line tool — you don't need to open an editor window, you don't need a GUI, you just call the command line directly from a CI script. Of course, it still depends on the Unreal engine being installed (it needs the engine's compiler toolchain and headers), but the entry point is pure CLI.

Invocation looks roughly like this:

```bash
# Compile the project's Development Editor configuration
Engine/Build/BatchFiles/RunUBT.bat \
    MyGameEditor \
    Development \
    Win64 \
    -Project="D:/MyGame/MyGame.uproject"
```

The meaning of the parameters here:
- `MyGameEditor` → the Target name (with the Editor suffix = compile the editor version)
- `Development` → the build configuration (Development / DebugGame / Shipping)
- `Win64` → the target platform
- `-Project` → the project path

## 3. Target and Module: UBT's Two Levels of Organizational Units

The way UBT looks at an Unreal project splits into two levels.

### Target

A Target is the **top-level goal** of a build. A `.uproject` project can define multiple Targets, each corresponding to one kind of output:

- **Game Target** (e.g. `MyGame`): the runtime version that ships as the final package
- **Client Target** (e.g. `MyGameClient`): the client version for dedicated servers
- **Server Target** (e.g. `MyGameServer`): the dedicated server version, without rendering
- **Editor Target** (e.g. `MyGameEditor`): the editor version, including editor functionality

Each Target corresponds to a `.Target.cs` file under `Source/`. Something like this:

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

A Module is a **functional grouping unit** inside a Target. One Target can contain multiple Modules, and each Module is an independent compilation unit.

Modules are defined by the `.Build.cs` files in the various subdirectories under `Source/`:

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

In `.Build.cs` you declare which other modules this module depends on (Public or Private), and UBT then knows how to handle the compilation order and the link parameters.

This is more complicated than Unity's Assembly Definition (`.asmdef`), but also more powerful — UBT understands the whole module dependency graph and can automatically handle compilation order, precompiled headers (PCH), link parameters, and a whole pile of other things.

## 4. UAT: Unreal's Build Dispatch Center

If UBT is the “engine”, UAT is the “chief dispatcher”.

UAT stands for **UnrealAutomationTool**. Its job isn't to compile code directly, but to **orchestrate the entire build pipeline** — Cook, Pak, Stage, Deploy… all of these tasks are dispatched and executed by UAT.

UAT is also a standalone C# project, with its source in `Engine/Source/Programs/AutomationTool/`.

A typical UAT invocation looks like this:

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

What each parameter means:
- `BuildCookRun` → tells UAT to run the standard “build + Cook + run-ready” flow
- `-cook` → perform Cook (converting assets to the platform format)
- `-stage` → gather the build outputs together
- `-pak` → pack the assets into Pak files
- `-archive` → output to the archive directory

As you can see, UAT's BuildCookRun is really an **orchestration command** — internally it first calls UBT to compile the C++ code, then calls the Cook command to process assets, then calls the Pak command to package assets, and finally gathers everything into the output directory. All in one step.

## 5. The Complete Build Flow: From .uproject to .exe

A complete Unreal project build flow looks like this:

```
① UAT receives the input arguments (platform, configuration, whether to Cook / Pak, etc.)
    ↓
② UAT invokes UBT → compiles all the C++ code
    （UBT 解析 Target / Module 依赖图，调用平台编译器）
    ↓
③ UAT invokes the Cook Commandlet → processes all the assets
    （贴图转格式、材质烘焙、Shader 预编译等）
    ↓
④ UAT invokes the Pak tool → packs the cooked assets into .pak files
    ↓
⑤ UAT arranges the output (Stage) → puts the .exe + .pak + runtime DLLs together
    ↓
⑥ UAT outputs to the archive directory (Archive) → done
```

This process **you can complete on a pure command line**. No editor window to open, no GUI, and one CI script can run the whole thing automatically. UAT splits each step of Build → Cook → Pak → Archive into independent subtasks that can be controlled with parameters, rather than, as with Unity, only being able to start a full editor process and then pray it doesn't crash.

That is the “smell of industrialization” I talked about in the opening article.

## 6. A Comparison with Unity's Build

| Dimension | Unity | Unreal |
|------|-------|--------|
| Code compilation | Roslyn compiles C# inside the editor | UBT (standalone CLI) invokes the platform compiler to compile C++ |
| Asset processing | Importer/Processor inside the Editor | Cook Commandlet |
| Asset packaging | BuildPipeline API (inside the editor process) | Pak tool (standalone CLI) |
| CI entry point | `-batchmode` starts a full editor process and reimports assets every time | UAT CLI, calling engine functionality step by step, with a flow that can be split and parameterized |
| Build orchestration | Write your own script to chain the flow | UAT's BuildCookRun, orchestrated with one command |
| Source openness | For the earlier generations (before SBP) the packaging source was closed | Fully open source |

Unity's build **can only use the editor process as its entry point** — `-batchmode` is essentially starting a complete Unity Editor, just without a GUI. Every invocation inevitably loads the engine and imports assets, and the developer has almost no control over the internal flow. Unreal made both the compiler (UBT) and the dispatcher (UAT) into standalone command-line tools; although they still need the engine installed to perform the actual work, the entry point is CLI, and the flow can be split by step and controlled by parameters.

There's another easily overlooked difference: **source openness**. Before SBP, Unity's packaging pipeline source was not open — if packaging went wrong, you had no way to fix it yourself, and could only wait for an official update or take a workaround. SBP's source is open (although underneath it ultimately calls internal engine APIs too, at least most of the logic is exposed). **Unreal, by contrast, is completely open source** — you can read, modify and debug the source of UAT, UBT, Cook and Pak. In the field of build automation, that is a huge advantage.

## 7. Summary

UBT and UAT's names may be unfamiliar, but their responsibilities are very clear:

- **UBT**: compiles C++ code, manages compilation dependencies and linking
- **UAT**: orchestrates the entire build pipeline, the whole Build → Cook → Pak → Archive set

Understand these two tools and you understand half of Unreal's build skeleton. The other half — how Cook and Pak handle assets — we'll pick up in the next two articles.

---

Next time we'll talk about Cook — the heart of Unreal's asset building. Why does Unreal call asset processing “cooking”? How much stuff does a single Cook actually have to process? Why is every Cook so slow?

A small step forward every day is a new height!
