---
title: 'Game Build: Unreal Builds (Part 2): What Is Cook? Why Does Every Build Have to "Do the Cooking"?'
date: 2024-04-20
author: Tang Moying
categories: [build]
tags: [Game Development, Unreal, Game Engines, Build Tools, Cook, Game Build]
lang: en
alt_url: /post/game-build-07-unreal-cook
---


## 1. Where Did the Name "Cook" Come From?

In Unreal's build process, "Cook" is a concept you can't get around.

At first I was puzzled — why call it "Cook"? Was Unreal comparing asset processing to cooking?

Later I found out that's exactly what it is. Unreal's engineers think of it this way: **assets in the editor are "raw ingredients" that have to go through "cooking" before they become "finished products" usable on each target platform.**

The analogy is actually quite apt.

In the editor, asset formats are **generic formats** — a texture might be a `.png`, a model might be `.fbx`, and a material is a Blueprint node graph full of parameters. These formats are convenient for editing, but they aren't suitable for direct use in a game.

What Cook does is cook these "raw ingredients" into "finished products" that the target platform can consume directly.

<!--以上为摘要内容-->

## 2. What Does Cook Actually Do?

If you break Cook down, it mainly does a few things:

### Texture Format Conversion

In the editor your textures are generic formats like `.png`, `.tga`, `.psd`. During Cook, they're converted to the target format for the target platform:

- PC → DXT/BC family
- iOS → ASTC
- Android → ETC2 or ASTC

It also generates mipmaps (multiple downscaled copies of the texture), so distant objects use a lower-resolution version and save video memory.

### Model Optimization

`.fbx` model files contain a lot of information the editor needs (naming, hierarchy, import parameters, and so on) that isn't needed at runtime. Cook extracts the model into the engine's mesh data format, computes the LODs and collision bodies, and throws away the editor-only metadata.

### Material Baking

A material in the editor is a Blueprint node graph with dozens of parameters you can tweak in real time. During Cook, Unreal **compiles the material into shaders for the target platform** — "translating" those Blueprint nodes into HLSL/GLSL/Metal Shading Language code.

You can almost think of this as "AOT compilation for materials."

### Shader Compilation

This is the most time-consuming part of Cook. Unreal's shader system is extremely flexible, and a single material can have thousands of shader permutations (combinations). For example, "shadows on + shadows off," "with normal map + without normal map," "PC platform + Android platform"… Each combination theoretically needs its own separate compilation result.

Cook walks through every material used in the project and compiles shaders for every possible permutation. Cooking a mid-sized project may require compiling tens of thousands — even hundreds of thousands — of shader variants. That explains why Cook is so slow.

### Reference Analysis

Unreal's Cook has to work out which assets get packaged into the final build and which don't. It starts from a level or an entry asset and walks the **reference graph** — which materials this level uses, which textures those materials reference, which assets those textures reference in turn… following the chain all the way down.

Only assets referenced from a "root node" get cooked. This mechanism is called **Cook by the book**, and at heart it's a reachability analysis.

## 3. The Cook Modes

Unreal provides several Cook modes for different situations:

### CookOnTheFly (during development)

The editor is running, and Cook happens on demand in the background. When you open a level or load an asset, Cook is triggered dynamically — anything not yet cooked gets cooked, and anything already cooked is taken straight from the cache.

The upside is that developers barely notice it. The downside is that opening a very large level for the first time can mean a long wait.

### CookByTheBook (when packaging)

The mode used for official builds. You specify an entry point (usually the Game's default map), and then Cook works through the reference graph "by the book," layer by layer. This is the most complete Cook mode, and the slowest.

### SkipCook (skipping Cook)

If you're sure nothing about the assets has changed (say, you only changed C++ code and touched no assets), you can skip Cook. This cuts build time substantially. But get it wrong once — assets not updated, old textures still in place — and it's an incident in production.

## 4. Why Is Cook So Slow?

The fundamental reason Cook is slow is **too many assets + too fine-grained processing**.

Cooking a mid-sized project can take tens of minutes. The time goes mainly to:

1. **Shader compilation** (the biggest share): tens of thousands of shader variants, each of which has to go through the GPU compiler
2. **Texture conversion**: hundreds or thousands of textures, each re-encoded to the platform format and given mipmaps
3. **Reference traversal**: if the asset reference graph is complex, the traversal itself isn't fast

Interestingly, **most of those processing results can actually be reused**. For the same texture, as long as the source file hasn't changed and the Cook parameters haven't changed, the cooked result won't change. Unreal realized this too — which is why it introduced DDC.

## 5. DDC: Cook's Cache System

DDC stands for **Derived Data Cache**.

The concept is simple: store the Cook results, and the next time you cook, if the source assets haven't changed, take the result straight from the cache and skip the processing.

DDC can be configured with several storage backends:

- **Local DDC**: stored on the local disk, valid only for you
- **Shared DDC**: stored on the team's NAS or network storage; one person cooks it and the whole team can use it
- **Cloud DDC**: the Zen storage Unreal officially provides, good for remote teams

Experienced projects always set up a shared DDC. A new colleague clones the project plus the team's shared DDC, and the first Cook may finish in a few minutes — because most assets have already been cooked by someone else, and they only need to compile the parts that are newly changed or unique to their machine.

Caching is one place where Unreal is streets ahead of Unity.

## 6. What Do You Do When Cook Fails?

The two most common problems during Cook:

**First: Cook gets stuck on some asset and won't move.**

Usually some asset has a problem (an absurdly huge texture, broken model topology, a shader that fails to compile). The way to troubleshoot is to read the Cook log, find out which asset Cook stopped on, and check whether that asset is broken.

**Second: the cooked result looks different from what you see in the editor.**

This is the biggest headache. Everything looks perfect in the editor, but after Cook the textures are blurry, materials are missing, models turn black. The reason is that the editor uses the "uncooked" generic assets, while cooked assets have gone through platform conversion. Tracking down this kind of problem means comparing the assets before and after Cook.

My advice: always run a full Cook + Pak + Run test before packaging.

## 7. Summary

Cook is the most central and most time-consuming step in an Unreal build. If you had to sum up what it does in one sentence:

> **Convert the editor's generic assets into the target platform's native formats, and precompile all the shaders.**

Its slowness is by design — you trade build time for runtime loading speed and rendering efficiency. DDC is the soothing balm for that trade-off.

---

Next time, we'll talk about Pak files — how does Unreal pack cooked assets into `.pak` files? Compared with Unity's AssetBundle, what's the same and what's different about Pak?

A small step forward every day is a new height!
