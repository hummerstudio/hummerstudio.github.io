---
title: 'Game Build: Unreal Builds (Part 4): The Shader Compilation Nightmare — Why Does Every Update Make Players Wait Twenty Minutes?'
date: 2024-05-11
author: Tang Moying
categories: [build]
tags: [Game Development, Unreal, Game Engines, Build Tools, Shader, DDC, PSO, Game Build]
lang: en
alt_url: /post/game-build-09-unreal-shader
---


## 1. Have You Seen This Scene Before?

When you play certain Unreal games, you have definitely been through this:

You finish the update and excitedly double-click the icon. Then a window pops up on screen — "Compiling Shaders: 1 / 23847". The progress bar crawls forward, estimated time remaining: 20 minutes.

Your face: 😐

Why does every update have to compile shaders? Why is shader compilation so slow? **Is there any way to keep players from waiting?**

This article is here to answer those three questions.

<!--以上为摘要内容-->

## 2. Why Do Shaders Have to Be Compiled? Aren't They "Code"?

A shader really is a kind of code. The logic you write in material blueprint nodes is ultimately translated by Unreal into HLSL (DirectX) or GLSL (OpenGL) or MSL (Metal) code.

That translation process is called **shader compilation**. It happens at two moments:

- **At build time**: during the Cook stage, Unreal precompiles as many shaders as it can
- **At runtime**: while the game is running, if it hits a shader variant that Cook didn't cover, a runtime compile is triggered

So here's the question: **if Cook already compiled them, why is there still compiling to do at runtime?**

That brings us to the biggest feature of Unreal's shader system — and its biggest pain — **shader permutations**.

## 3. Combinatorial Explosion: Why "20,000" and Not "50"

Unreal's material system is extremely flexible. A single material can have a dozen or more switchable features:

- Does it receive dynamic lighting?
- Does it cast shadows?
- Does it have a normal map?
- Does it have emission?
- Is translucency enabled?
- Does it use Instance Stereo (VR)?
- Is the target platform DirectX, or Vulkan, or Metal?
- Is the quality level Low / Medium / High / Epic?

Each option is a "switch". Combined, these switches can produce tens of thousands of **different shader variants**.

But here's the catch: with that many variants, your project **may only use a fraction of them**.

For example:

- In scene A, your project uses the "dynamic lighting + shadows + normal map" combination
- In scene B it uses the "no dynamic lighting + no shadows" combination
- But not one material in the project uses the "VR Instanced Stereo + translucency + emission" combination

During the Cook stage, Unreal compiles the variants that are **referenced**, based on reference analysis (Cook by the book). Cook won't compile the combinations "your project never uses".

So in theory, the Cook stage can never cover every variant. If a player triggers an uncompiled variant in some particular situation, the engine has to compile it on the spot. This is called **shader compilation stutter**.

## 4. PSO Cache: The Answer to Runtime Compilation

PSO stands for **Pipeline State Object**.

Put simply, a PSO is an object that packs together "shader code + render state (blend mode, depth test, rasterizer state and so on)". Before the GPU can execute a render, that PSO has to be ready.

**A PSO Cache is simply the common PSOs compiled ahead of time and stored**, so that when players hit the corresponding rendering scenario in-game, there is no on-the-spot compilation — the cached PSO loads directly.

There are two moments when a PSO Cache can be generated:

- **Pre-generated at build time**: before shipping, developers run the collection tool once to precompile the common PSOs, which then ship with the build
- **Generated locally on the player's machine**: the first time the player runs the game, it compiles quietly in the background and stores the result in a local PSO Cache. The next session is fast

The ideal is the first — pre-generation at build time. That way the player gets the build and can play smoothly. But it also means that besides Cook and Pak, your CI/CD gains one more step: **PSO collection and cache generation**.

And collecting PSOs requires "actually rendering everything once" — you need to run through every level in the editor or in a dedicated tool, covering as many rendering scenarios as possible, letting the engine record which PSOs were used, and then compile them and write them into the cache.

## 5. DDC: The Cache System That Keeps Cook From Repeating Work

We mentioned DDC briefly in the previous article. On the topic of shader compilation, its importance deserves emphasis once more.

Shader compilation is the slowest part of Cook. And DDC is what makes it possible that "shaders already compiled don't need recompiling".

For a team with **a shared DDC** configured correctly, shader compilation feels like this:

- Colleague A: Cooked the entire project, compiled every shader, took 40 minutes. The results were written to the shared DDC.
- Colleague B: pulled the code and Cooked, found that most shaders were cache hits in the shared DDC, and only had to compile the shaders A never touched. Took 5 minutes.
- CI machine: configured the team's shared DDC as a read-only source, syncing the DDC once before every Cook; compile time dropped from 40 minutes to 10.

So DDC is not just "a cache" — it is almost **essential infrastructure** for building an Unreal project. In an Unreal project without a properly configured DDC, every person recompiles every shader from scratch on every Cook — which becomes unacceptable once the team grows.

## 6. How Do You Keep Players From Waiting?

Back to the original question: **can we stop players from waiting twenty minutes for shader compilation at game startup?**

A few routes:

**Option 1: Precompile every shader at build time**

When shipping, run a full Cook by the book over every level and every possible shader variant. The upside is that nothing is missed; the downside is that Cook takes an extremely long time (possibly several hours), and the build gets bigger.

**Option 2: Pre-generate a PSO Cache at build time and ship it with the build**

This is what Epic recommends. At shipping time you run the PSO collection flow to gather every PSO the levels use, compile them, and pack them into the installer or the hot-update package. The player can play as soon as the download finishes, with no shader compilation at startup.

**Option 3: Compile in the background**

The installer doesn't include a complete PSO Cache, but on first launch or while idle the game silently compiles some common PSOs in the background. By the time the player actually reaches a heavy scene, most shaders are already ready.

**Option 4: Driver-level caching**

Modern GPU drivers (NVIDIA, AMD) usually come with their own shader caching mechanism. Even if a game has no explicit PSO Cache, the driver stores the result locally after the first compile of a shader. Next time the same game starts, the same shader doesn't need recompiling. But driver caching is coarser-grained than a PSO Cache, and it isn't cross-platform.

In practice, the best results come from **combining options 1 and 2**: compile as many shaders as possible during Cook, and generate a PSO Cache to ship with the build. On the player's first launch, the engine comes up to speed quickly using the PSO Cache, with nothing compiled on the spot.

## 7. Summary

The reason shader compilation is slow comes down to **the flexibility of Unreal's materials leading to a combinatorial explosion** — one material can correspond to tens of thousands of shader variants, and not all variants can be covered at build time.

The core line of thinking for solving it:

- **Cook stage**: cache compilation results in the DDC to reduce repeated compilation
- **Shipping stage**: pre-generate a PSO Cache and ship it with the build
- **Runtime**: use the PSO Cache instead of on-the-spot compilation, eliminating the startup wait

In fact this converges with the IL2CPP approach — **move dynamic compilation at runtime forward so it happens at build time**. What the user receives is a build that has already been "cooked", with no oven preheating to wait for.

---

## A Final Word

And that brings the four Unreal build articles to a close. Together with the earlier opening article and the five Unity build articles, we've written ten articles all told, going from the shift in understanding between "web builds vs. game builds" to a deep teardown of the two build systems, Unity and Unreal.

Let's look back at the journey:

| Article | Content |
|------|------|
| Prologue | From Java to the game industry, understanding "build" all over again |
| Unity (Part 1) | The eight steps behind the Build button |
| Unity (Part 2) | The evolution of the AssetBundle API — two routes from generation 0 to generation 1 |
| Unity (Part 3) | SBP — maximum cache improvement for minimum change |
| Unity (Part 4) | Addressables — a far more invasive approach to asset management |
| Unity (Part 5) | How IL2CPP achieves cross-platform support |
| Unreal (Part 1) | The roles of UBT and UAT, and the build flow |
| Unreal (Part 2) | Cook — why assets need "cooking" |
| Unreal (Part 3) | Pak file packaging and hot updates |
| Unreal (Part 4) | Shader compilation — why it's so slow, and how to keep players from waiting |

If you've read all the way here, then like me you have a strong interest in what a build system is really doing. I hope these ten articles help you, when you face a build problem in Unity or Unreal, to no longer be completely lost but to know clearly — "oh, so that's the step it's stuck on."

From CPU to GPU, from Java to C#/C++, from the web to games — this turn in a career is worth recording properly. And I hope these records help the people who come after me, just as I came after others.

A small step forward every day is a new height!
