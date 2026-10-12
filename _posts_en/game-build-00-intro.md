---
title: 'Game Build Musings (Part 0): From Java to Unity/Unreal, How I Came to Understand the Word "Build" All Over Again'
date: 2024-01-13
author: Tang Moying
categories: [build]
tags: [Game Development, Game Engines, Unity, Unreal, Build Tools, Game Build]
lang: en
alt_url: /post/game-build-00-intro
---


## 1. A New Industry, and a New Understanding of “Build”

Last year I changed jobs.

I moved from the internet industry to the game industry. My development language went from Java to C# and C++, and my IDE went from IntelliJ IDEA to Rider and Visual Studio.

Honestly, the switch in tech stack went more smoothly than I expected — all programming languages are fundamentally connected, after all. But one thing gave me a solid shock.

**The build system.**

Back when I was doing Java development in the internet industry, building was the simplest thing in the world:

```bash
./gradlew build
```

Or, for a Maven project:

```bash
mvn clean package
```

One command, and compilation, testing and packaging all come together within three minutes. You might even wire up CI so it runs automatically on every push.

Once I got into the game industry, I realized that the old “build” was only kindergarten-level.

There's no convenient world here where one command settles everything. There's no simple model where everything is a jar package. There's no Maven Central where you reach out and every dependency is handed to you.

What there is, is tens of gigabytes of asset files, models, textures, audio, shaders, animation state machines… and the daily puzzlement of “why does this build take 40 minutes?”

Worse still — the company **uses both the Unity and Unreal engines at the same time**.

<!--以上为摘要内容-->

## 2. Building on the Internet Is Fundamentally Programming for the CPU

Looking back on those ten years in the internet industry, what I was doing was fundamentally **programming for the CPU**.

Your program runs with data going in and data coming out. An HTTP request comes in, you query the database, do some computation, and an HTTP response goes out. What you worry about is thread pools, GC pauses, SQL optimization, cache consistency.

Every problem boils down to: **how do I make the CPU compute faster and more reliably?**

The role the build system plays in this world is very simple — compile `.java` into `.class`, package it into a jar, stuff it into a container image. The complexity of Maven and Gradle shows up mainly in dependency resolution and version conflicts, which follows directly from the CPU's execution model.

## 3. Building a Game Is Fundamentally Programming for the GPU

In the game industry, the picture changes abruptly.

A game is not “computing numbers”; a game is “rendering images”. When your program runs, the engine is loading hundreds of models, decoding thousands of textures, compiling tens of thousands of shader variants, and then throwing one frame at the GPU every 16 milliseconds.

What you have to worry about becomes — draw calls, LOD, mipmaps, texture compression, shader compilation caches, light baking…

Your opponent has changed from the CPU to the **GPU**.

The role the build system plays in this world is completely different too. It isn't just “compiling code” — it has to handle a huge amount of **assets**: models need importing, textures need format conversion, materials need baking, shaders need precompiling and caching.

Looking back, from “programming for the CPU” to “programming for the GPU”, from “computing numbers” to “rendering images” — that makes for a fairly complete career. Ha ha.

## 4. Building in Unity: One-Click Build Is an Illusion

When I first got into Unity, I saw `File → Build Settings → Build` and thought this was the game-industry version of `gradle build`.

Naive of me.

Unity does have a one-click build UI, but there's a mountain of things you have to do before you click it. You have to write C# scripts to tell Unity **which AssetBundle package each asset belongs to**. The system provides the `BuildPipeline.BuildAssetBundles()` API, but “which assets go into which bundle, how to group them, how to name them, how to handle dependencies” — all of that logic is yours to write.

More of a headache still: in the earlier versions, the asset bundle tags were **hardcoded in the `.meta` files**. Which bundle an asset belongs to is written in its meta. Change machines or switch branches, and the meta tags come along for the ride. Sounds like no big problem, but on a game project with multiple collaborators and frequent branch switching, it is a genuine nightmare.

To put it bluntly — Unity gives you **the lowest-level API**, and the entire bundle-splitting logic on top of it has to be carried by the developer. And all of this **depends on the Unity editor environment**. Want to run it on a pure command line / CI server? You can, but it isn't elegant. You have to install a complete Unity Editor and run it with `-batchmode` and `-nographics`.

This isn't “one-click build”; this is “kicking the ball of complexity over to you”.

## 5. Building in Unreal: The Smell of Industrialization

By comparison, Unreal's build system is far more industrial.

First, Unreal's build tools (UBT and UAT) are **standalone command-line tools**. They are two genuine C# projects with a clear split of steps and parameter control — you can use parameters like `-cook`, `-pak`, `-stage` to control exactly what each step does. No editor window to open, no GUI required, and one CI script does the whole thing.

Of course, this doesn't mean “you don't need to install the Unreal engine” — the packaging flow still needs the engine to perform the actual operations of cooking, compiling shaders and so on. But its entry point is a standalone CLI, unlike Unity, where **the editor's batch mode is the only entry point**. Unity's `-batchmode` always starts a full editor process and reimports all assets, which is very limiting. Unreal's UAT is a real command-line dispatcher: it knows what to call first, what to call next, and how to pass parameters, and it breaks the flow down clearly. For CI/CD, that is a qualitative difference.

Second, when it comes to asset handling, Unreal has the Cook flow — the engine automatically analyzes reference relationships and “cooks” what's needed into the package. You don't have to manually tag every asset with “which bundle it belongs to”. Of course, chunk partitioning rules still have to be specified in configuration, but that isn't on the same order of magnitude of effort as Unity's “write a script to decide where every asset belongs”.

Third, Unreal's caching system — DDC (Derived Data Cache) and Shader Pipeline Cache — is more systematic. For the same assets, cook once and compile the shaders once, and the second time is lightning fast. In multi-person collaboration you can even share the DDC: one person finishes cooking and the whole team uses it directly.

To summarize how I feel: **Unity exposes build complexity to you; Unreal digests build complexity inside the toolchain.**

## 6. Why I'm Writing This Series

I've said all that above, but the core of it is really one sentence —

“Building” in the game industry and “building” in the internet industry are not the same thing at all.

Unfortunately, there isn't much Chinese material on this. Most of what you can find is either a translation of official documentation or a fast-food tutorial like “package a Unity game in three steps”. What's missing is content that starts from first principles and explains, step by step, “what game building is actually doing”.

So I plan to write two series, recording what I've learned about Unity and Unreal builds, and the potholes I've stepped into along the way.

**The Unity build series** — starting from the basic Build Settings flow, through the evolution of AssetBundle asset packaging, on to the design philosophy of Addressables and the cross-platform mechanics of IL2CPP. No skipped steps, no piled-up jargon, just a step-by-step walk through why Unity's build system grew into what it is today.

**The Unreal build series** — starting from the roles of UBT and UAT, then what the Cook flow does, then the packaging mechanics of Pak files, and finally the old intractable problem that gives everyone a headache: shader compilation.

---

Next time, we start with **Unity Build (Part 1)** — when you click the “Build” button in Build Settings, how many steps does Unity actually do for you?

A small step forward every day is a new height!
