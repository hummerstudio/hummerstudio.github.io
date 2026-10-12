---
title: 'Game Build: Unity Build (Part 2): Two Generations of the AssetBundle Interface — From Hand-Written Packaging to Automatic Dependencies, What Happened Along the Way?'
date: 2024-03-16
author: Tang Moying
categories: [build]
tags: [Game Development, Unity, Game Engines, Build Tools, AssetBundle, Game Build]
lang: en
alt_url: /post/game-build-02-unity-assetbundle
---


## 1. The Days Without AssetBundle

Before we get into how the AssetBundle interface evolved, imagine this for a moment: **if Unity had no dynamic asset loading mechanism, how would you build a game?**

The answer is simple — put every asset in the project, and pack them all into the installer at build time.

That doesn't sound like much of a problem, does it? But picture a real mobile game: dozens of scenes, dozens of characters, and for each character several textures, a model, and several sets of animations... Textures alone might run to hundreds or thousands of files. Pack all of that into the APK and the package size heads straight for 2-3GB.

When users see the number "2.3GB" on the download page, their finger hovers over the download button for a second — and then they swipe over to a competitor.

Even worse is **updating**. You fix one UI bug, changing a single asset, BuglyButton.prefab. But under the "pack everything into the build" model, users have to re-download the complete 2.3GB installer. That isn't an update — that's actively driving people away.

So AssetBundle's core mission was clear from the day it was born: **let assets be downloaded on demand and updated independently**.

But the AssetBundle API itself also went through evolution "from full of pitfalls to actually usable". In this article, we'll look at two generations of change in the AssetBundle packaging interface.

<!--以上为摘要内容-->

## 2. The Resources Folder: The Most Primitive Way to Load Assets

Before AssetBundle, dynamic asset loading in Unity could only rely on `Resources.Load()`.

You put the asset under the `Assets/Resources/` directory and load it from code like this:

```csharp
GameObject prefab = Resources.Load<GameObject>("Enemies/Boss");
```

Simple and direct.

But it has one fatal flaw: **every asset in the Resources folder gets packed into the final installer**. Whether you use it or not, if it's in Resources, it goes into the build.

And the nastier part is that assets under the Resources folder **have no notion of reference counting**. If you change a model from a scene reference to a Resources.Load call, that model is no longer managed by "normal references", and Unity can't judge whether it's still needed — so it falls back on the dumbest possible approach: pack everything in.

So the Resources folder was positioned from the start as "convenient for fast prototyping", not as "an asset management solution for production".

## 3. Generation 0: BuildPipeline.BuildAssetBundle (No Trailing s)

This is the prehistoric era of AssetBundle — the interface in Unity 4.x and earlier. It's deprecated now, but understanding it is the only way to understand why the later improvements came about.

The Generation 0 API looks like this:

```csharp
// Unity 4.x-era usage (deprecated, for reference only)
BuildPipeline.BuildAssetBundle(
    null,                           // main asset (usually null)
    Selection.objects,              // the asset list you collected by hand
    "Assets/StreamingAssets/myBundle.unity3d",  // output path
    BuildAssetBundleOptions.None,   // build options
    BuildTarget.StandaloneWindows   // target platform
);
```

Note the name: `BuildAssetBundle`, **with no trailing s**. It is a completely different interface from the `BuildAssetBundles` (with the s) that we'll cover later.

This usage has two major pain points:

**Pain point one: you have to collect the assets yourself.**

`Selection.objects` is the set of asset objects currently selected in the Unity Editor. In other words, which assets get packed is decided by you selecting them manually in the editor and then running the script. Of course, you can also write code to collect them with `AssetDatabase.FindAssets()` and the like — but the point stands: the logic of **which assets go into which bundle is entirely yours to write**.

**Pain point two: dependencies aren't handled automatically.**

This is the biggest problem. Say `Boss.prefab` references the texture `Boss_Diffuse.png`. You use `BuildAssetBundle` to pack `Boss.prefab` into a bundle — but what about the texture? The texture doesn't come along automatically.

You have to check by hand which dependencies each asset references, put those dependencies into `Selection.objects` as well, and make sure every referenced asset appears in the collected list. Otherwise the bundle that comes out is incomplete, and loading crashes at runtime.

Even worse: if two different bundles reference the same texture, under the Generation 0 mechanism **that texture gets packed twice, once into each bundle**. Unless you write your own code to compute hashes and deduplicate — but the vast majority of teams simply don't have the bandwidth for that.

So the experience of the Generation 0 interface is this: **you're not only worrying about "what to pack", you're also worrying about "is anything missing from the bundle" and "is anything duplicated"**. It's all manual grind.

## 4. Generation 1: Manually Marking Bundle Names + BuildPipeline.BuildAssetBundles (With the s)

Starting with Unity 5, Unity introduced a whole new mechanism — and that mechanism **is still the mainstream approach today**.

It has two core parts:

**Part one: manually mark assets with an AssetBundle name in the editor.**

Select an asset, and at the bottom of the Inspector panel there's an AssetBundle dropdown where you pick which bundle it belongs to. This marking information is stored in the `.meta` file and version-managed along with the asset.

**Part two: call `BuildPipeline.BuildAssetBundles()` (note the s).**

At build time, all you need to specify is the output directory and the target platform —

```csharp
BuildPipeline.BuildAssetBundles(
    "Assets/StreamingAssets/Bundles",  // output directory
    BuildAssetBundleOptions.None,      // build options
    BuildTarget.StandaloneWindows      // target platform
);
```

**Unity automatically reads the AssetBundle markings on every asset**, then automatically works out and handles the dependencies between them. Boss.prefab is marked as belonging to the `characters` bundle and references the texture Boss_Diffuse.png — Unity will automatically pack the texture into the `characters` bundle too, or record it correctly in the dependency relationships.

The difference in experience from Generation 0 is like night and day:

| Dimension | Generation 0 (no s) | Generation 1 (with s) |
|------|----------------|----------------|
| Asset collection | Manually collected in code | Editor markings, read automatically by the API |
| Dependency handling | Not automatic, needs manual management | Dependencies worked out and handled automatically |
| Asset deduplication | Requires manual hash computation to deduplicate | Deduplicated automatically by the engine |
| State carrier | None, entirely in code logic | The `.meta` file |

Marking + BuildAssetBundles is **an interlocking pair of moves** — the markings define the rules, the API executes them. They're not two separate usages; they work together.

### Another Way to Play It: AssetBundleBuild[] — No .meta Files, Bundling Defined Purely in Code

`BuildAssetBundles` has another overload with a completely different use case:

```csharp
// No need to mark assets in the editor first — pass the bundle definitions directly from code
AssetBundleBuild[] builds = new AssetBundleBuild[]
{
    new AssetBundleBuild
    {
        assetBundleName = "characters",
        assetNames = new string[]
        {
            "Assets/Prefabs/Characters/Boss.prefab",
            "Assets/Prefabs/Characters/Elite.prefab",
        }
    },
    new AssetBundleBuild
    {
        assetBundleName = "ui",
        assetNames = new string[]
        {
            "Assets/Prefabs/UI/MainMenu.prefab",
            "Assets/Textures/UI/MainMenu_BG.png",
        }
    }
};

// Pass AssetBundleBuild[] in place of reading the editor markings
BuildPipeline.BuildAssetBundles(
    "Assets/StreamingAssets/Bundles",
    builds,                         // ← here it is: no dependency on the markings in .meta
    BuildAssetBundleOptions.None,
    BuildTarget.StandaloneWindows
);
```

The core idea of this overload is: **bundling rules are defined in code, with no `.meta` file written.** That means:

- ✅ **No need to manually mark AssetBundle names in the editor** — all the bundling information lives in your build script
- ✅ **The meta file no longer takes part in the build configuration** — a clean break from the collaboration conflicts where "A changes a marking and B pulls it down into a mess"
- ✅ **Bundling rules can be version-managed cleanly** — your build script is just a `.cs` file, and its diffs are clear

But the cost is obvious too:

- ❌ **Dependency tracking is still on you**: the asset list you pass to `AssetBundleBuild` is "whatever you believe is enough". If Boss.prefab references Boss_Diffuse.png and you didn't write the texture into `assetNames`, then the texture won't go into the bundle. Unity won't fill in the blanks for you. (This differs from the "mark the bundle name + make a simple call" behavior, which reads the markings and augments dependencies automatically — in that mode Unity has marking information to trace dependencies from, whereas in this mode it's entirely down to the array you pass in.)
- ❌ **Incremental builds are yours to implement**: the `builds` array you pass decides "which bundles get built this time". But which assets changed and which bundles need rebuilding — Unity's incremental detection under this overload is cruder than you'd expect. If you want precise incrementality (rebuilding only the bundles whose assets changed), you need to implement the change detection logic yourself in the build script — for example, comparing this run's asset hashes against the previous run's, and putting only the `AssetBundleBuild` entries containing changed assets into the array.

So the essence of this overload is that it hands control to the developer — and hands back responsibility for dependency tracking and incremental detection along with it. It's the **more flexible but also more error-prone** way to use the Generation 1 interface.

## 5. Generation 1's Pain Points: Much Better Than Generation 0, but Still Not Enough

The Generation 1 interface solved the core problem of tracking dependencies automatically (in marking mode), but it created new pain points of its own.

**The markings are written in `.meta` files.**

That means the meta file becomes "part of the build configuration". Developer A changes the bundling rule for some asset → the meta file changes → it gets committed to Git → developer B pulls it down and finds that some asset has inexplicably moved to a different bundle. In the game development rhythm, where branches switch frequently, meta file conflicts are an everyday occurrence.

And when you have thousands of assets, you can't click through them one by one by hand. So people started writing tool scripts: define the bundling rules in a config file (Excel or JSON, say), then write a script that automatically sets an AssetBundle name on every asset before the build, and clears the markings after packing. Every time you cut a build, the markings for thousands of assets have to be stamped all over again.

**Dependency management still requires the developer to step in manually.**

Although the engine handles the dependency relationships at pack time, the loading order at runtime is still yours to manage. Say the prefab Boss.prefab references the texture Boss_Diffuse.png, and the two live in different bundles — you must load the texture bundle first, then the prefab bundle. Unity won't handle that order for you at runtime.

The community's approach is to parse the `.manifest` file the build generates and maintain a dependency graph inside the loader. But honestly, once a dependency graph in a complex project has dozens or hundreds of edges, the reliability of maintaining it by hand falls off a cliff.

And no matter how careful you are about packing, this interface has a limitation you can't get around: **it's an API internal to the Unity Editor**. `BuildAssetBundles` can only run inside the editor, so your CI machine has to have a full Unity installation plus `-batchmode`. Compared with Unreal's standalone command-line tools, that looks clunky.

## 6. Summary: The Evolution Logic of the Two Generations of Interface

From Generation 0 to Generation 1, the evolution of the AssetBundle API follows a clear logic:

- **Generation 0's pain**: collecting assets by hand + no automatic dependency handling → unreliable packing
- **Generation 1's two paths**:
  - **Path A (marking mode)**: editor markings + a simple `BuildAssetBundles()` call → markings read automatically + dependencies handled automatically, but the markings live in `.meta` files and make collaboration painful
  - **Path B (code mode)**: `AssetBundleBuild[]` passed to `BuildAssetBundles(builds)` → bundling defined purely in code, never touching `.meta`, but dependency tracking and incremental detection come back to the developer

Neither approach solves the higher-level problems of "runtime load order", "incremental build efficiency" and "overall asset management". Those are exactly what **Scriptable Build Pipeline (SBP)** and **Addressables** later set out to solve — and we'll pick both up in the next two articles.

---

In the next article, we'll talk about the Scriptable Build Pipeline (SBP) — the low-level replacement for BuildAssetBundles. Why can it dramatically improve incremental build cache efficiency? And what is its relationship to Addressables?

A small step forward every day is a new height!
