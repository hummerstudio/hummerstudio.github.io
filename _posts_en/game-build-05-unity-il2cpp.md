---
title: 'Game Build: Unity Build (Part 5): IL2CPP and Cross-Platform — How Does "Develop Once, Ship Everywhere" Actually Work?'
date: 2024-04-06
author: Tang Moying
categories: [build]
tags: [Game Development, Unity, Game Engines, Build Tools, IL2CPP, Mono, Cross-Platform, Game Build]
lang: en
alt_url: /post/game-build-05-unity-il2cpp
---


## 1. Why Does C# Need "Translation"?

C# is a managed language. When you compile the C# code you write, what you get isn't machine code but IL (Intermediate Language). At runtime it's interpreted by the .NET Runtime or the Mono Runtime, or compiled and executed through JIT (Just-In-Time) compilation.

On PC, this is no problem at all. Windows ships with the .NET Runtime, or Unity can embed a Mono Runtime in your game. One JIT compile and it flies.

But what about iOS?

Apple's rules are strict: **iOS does not allow JIT compilation**. You can't dynamically generate executable code at runtime. So Mono's JIT mode is simply shot down on iOS.

That's why IL2CPP was born.

<!--以上为摘要内容-->

## 2. The Mono Era: Simple, But Not Enough

Unity's earliest backend was Mono. C# scripts → compiled to IL → interpreted by the Mono Runtime.

Early on, Mono was basically sufficient. But several problems gradually surfaced:

- **JIT restrictions on iOS**: on iOS, Mono can only use AOT mode (Ahead-Of-Time compilation). But Mono's AOT support isn't complete, and many advanced C# features (generics, certain uses of reflection) misbehave under AOT
- **Mono versions fall behind**: the Mono version Unity used stayed stuck in the .NET 2.0/3.5 era for a long time, drifting ever further apart from the mainstream versions in the .NET community
- **A performance ceiling**: Mono's JIT compiler doesn't optimize as well as modern compilers, and in a scenario as performance-sensitive as games, a 10% gap can be the difference between 30fps and 33fps

So Unity made a major technical decision — **develop IL2CPP, convert C# IL into C++, and then compile it with the platform's native compiler**.

## 3. How Does IL2CPP Work?

The name already gives everything away: IL → To → C++.

Its workflow has two steps:

**Step one: IL2CPP.exe (the translator)**

IL2CPP is a standalone executable (in the Unity installation directory). What it does is:

1. Read in the IL assemblies compiled from all your C# scripts (the `.dll` files)
2. **Translate the IL code into C++ code**
3. At the same time, generate a C++ version of the GC (garbage collector), the threading model, and reflection support code

This "translation" process is **static and happens at build time**. There is no runtime JIT.

**Step two: the platform compiler**

The generated C++ code is handed to the native compiler for the corresponding platform:

- iOS → Xcode's clang
- Android → the NDK's clang
- Windows → MSVC or clang
- macOS → Xcode's clang

The native compiler turns the generated C++ into machine code, which is finally linked into an executable.

## 4. What Does IL2CPP Bring?

**Unified cross-platform handling**. No matter which platform you publish to, the C# code is first converted to C++ and then compiled with that platform's native compiler. This way Unity only has to maintain one IL → C++ translator, instead of maintaining a Runtime for each platform.

**Better performance**. The C++ compilers (clang, MSVC) have evolved for over twenty years and are extremely strong at optimizing. The same logic, taken through the IL2CPP → C++ → clang -O2 chain, usually runs faster than Mono JIT. Official figures say IL2CPP is 1.5 to 2 times faster than Mono.

**Security**. IL2CPP outputs native machine code, which — unlike IL — can't easily be restored into readable C# source by decompilers such as ILSpy and dnSpy. It helps a little against cracking (though it only raises the bar; it isn't absolutely safe).

## 5. The Cost of IL2CPP: Build Time

The price for enjoying the performance gain is **build times exploding**.

The Mono build pipeline is: C# → IL → package the Mono Runtime + IL → produce the package. The IL2CPP build adds two "heavy" steps:

1. IL → C++ translation (the more C# code you have, the more C++ gets generated)
2. Native compilation (clang compiling tens of thousands or even hundreds of thousands of lines of generated C++ code)

For a project with twenty or thirty thousand lines of C#, IL2CPP may generate over a hundred thousand lines of C++. You should have a good idea of the normal compile time for a hundred-odd thousand lines of C++.

To make matters worse, every Unity build **regenerates the C++ code in full** and then recompiles it in full. If the native compiler doesn't have a good caching mechanism (Xcode's DerivedData, say), every build starts from zero.

Some teams handle it this way:
- Local development uses the Mono backend (fast builds, convenient iteration)
- CI / packaging uses the IL2CPP backend (slow builds, but the output is a proper release package)
- Use a cache-server to cache intermediate compilation artifacts

## 6. Platform Differences: Not All Platforms Are Alike

### iOS

- IL2CPP is mandatory (Apple doesn't allow JIT)
- The build output is an Xcode Project, which has to be compiled once more with Xcode on a Mac
- Texture compression is forced to PVRTC or ASTC
- The longest build times (because after generating the Xcode Project you have to compile it again)

### Android

- Mono or IL2CPP, your choice
- IL2CPP builds require the NDK
- APK or AAB output
- Texture compression usually uses ETC2 or ASTC
- Build time is mostly stuck in the NDK compilation stage

### Windows / macOS / Linux

- Desktop platforms; Mono or IL2CPP, your choice
- The fastest builds (no need for the extra layer of Xcode compilation iOS needs)

### WebGL

- Only IL2CPP works (a requirement of WebAssembly)
- The build output is a WebAssembly file
- The C# code is converted to C++ and then compiled to Wasm
- Build times are very long; WebAssembly restricts multithreading, so compilation is slow

## 7. Common Pitfalls

**Generics + IL2CPP**. Generic code that runs fine under Mono may throw "ExecutionEngineException" or simply crash under IL2CPP. That's because IL2CPP needs to determine every generic instantiation in use at build time and AOT-compile it. If you use a lot of dynamic reflection + generics, IL2CPP may be unable to guess your actual type arguments.

The good news is that Unity has made many improvements in recent years — the `[Preserve]` attribute, `link.xml` configuration, and Managed Stripping Level control let developers intervene manually in IL2CPP's stripping behavior.

**Build failures leave no useful error message**. When IL2CPP translation or compilation fails, the error message is often drowned in tens of thousands of lines of output. Debugging it is extremely painful. It's best to use `-logFile` to write the build log out to a file, then search for the `error` keyword.

**Incremental builds aren't reliable**. In theory IL2CPP supports incremental builds — you change a bit of C# code, and the next build should only regenerate and compile what changed. In practice, many teams' incremental builds quietly stop working and turn into full rebuilds. The cause is usually cache files in the Library directory being cleaned up or going out of sync.

## 8. Summary

IL2CPP is the technical solution Unity created to bridge the platform gap. Its logic is very clear:

> Since different platforms have different compilers and restrictions, just convert C# uniformly into C++ — a language almost every platform can compile.

The idea is elegant; the price is build time. This trade-off of "sacrificing build efficiency for runtime efficiency" is a very classic one in the game engine world.

And with that, the five posts on Unity builds are done. We've been through:

- The full build pipeline (the eight stages behind the Build button)
- The evolution of the AssetBundle interface (generation 0 written by hand → generation 1 with the two tagging/code routes → generation 2 SBP → generation 2 Addressables)
- The Addressables asset management system
- IL2CPP's cross-platform mechanism (C# → C++ → machine code)

---

Starting with the next post, we switch over to Unreal — first up, what UBT and UAT are, and how a `.uproject` turns into an `.exe`.

A small step forward every day is a new height!
