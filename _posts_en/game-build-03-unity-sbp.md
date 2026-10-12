---
title: 'Game Build: Unity Build (Part 3): Scriptable Build Pipeline — Minimum Change, Maximum Cache Gain'
date: 2024-03-23
author: Tang Moying
categories: [build]
tags: [Game Development, Unity, Game Engines, Build Tools, SBP, Scriptable Build Pipeline, Game Build]
lang: en
alt_url: /post/game-build-03-unity-sbp
---


## 1. The Thing That Halves Your Build Time

Last time we went through the evolution of the AssetBundle interface across two generations — from generation 0, where you hand-wrote code to collect assets and dependencies were not handled automatically, to the two routes of generation 1 (tagging bundle names / defining bundles in code with `AssetBundleBuild[]`).

Although generation 1's `BuildAssetBundles` solved the reliability of dependency handling, it had two hard defects. **First, incremental builds are very inefficient** — you change the compression format of one texture in the project (from RGBA32 to ASTC, say); in theory only that one asset changed, so only that one Bundle should be repacked, right? In practice Unity's default `BuildAssetBundles` frequently "over-rebuilds" — Bundles that clearly have not changed get repacked anyway. On a large project, every build means waiting tens of minutes or even longer.

More crucial is the second problem: **the source code of the earlier packaging pipelines was closed.** When something goes wrong in the packaging process and you want to troubleshoot it yourself, or fix it yourself — sorry, you cannot see the source. You can only wait for Unity to ship an update, or work around it from the outside.

This is where the **Scriptable Build Pipeline (SBP for short)** makes its entrance.

<!--以上为摘要内容-->

## 2. What Is SBP?

SBP stands for Scriptable Build Pipeline. It is a **low-level replacement for the packaging API** provided by Unity itself, first released as a standalone Package (installed through the Package Manager) and later gradually becoming the packaging infrastructure Unity recommends.

Its positioning is clear: **replace `BuildPipeline.BuildAssetBundles` and provide a more efficient, more controllable asset packaging pipeline.**

Note that SBP replaces the "packaging interface", not the "loading interface". What you produce with SBP is still a `.bundle` file, and the way it is loaded at runtime (AssetBundle.LoadFromFile and so on) is completely unchanged. SBP affects only the **build stage**, not **runtime**.

That is also its greatest advantage: **low migration cost.** You do not have to change any game-logic code; you only need to switch the packaging script on CI from calling `BuildAssetBundles` to calling the SBP interface.

And **SBP's source code is open.** This stands in sharp contrast to the earlier packaging pipelines — before SBP, the source code of the build process was completely closed, and if you wanted to troubleshoot a problem or fix a bug yourself, there was simply no way in. With SBP you can read the source in the Package; although at the very bottom it still calls internal engine interfaces, at least most of the build logic is exposed, so you can read it, change it and debug it.

## 3. SBP's Three Core Advantages

### Advantage 1: Precise Incremental Builds

SBP's judgement of "what changed, what does not need rebuilding" is far more precise than `BuildAssetBundles`.

`BuildAssetBundles` makes a fairly crude incremental decision — and because the source is closed, you have no idea how Unity decides internally. It is like a black box; you often get "things that look unchanged being rebuilt anyway", and you cannot even begin to troubleshoot it.

SBP, by contrast, splits the whole packaging pipeline into several **independently cacheable steps**:

```
Asset collection → dependency calculation → content hashing → compression and packaging
```

Each step has its own cache. If you change the compression settings on a texture, SBP will:

1. Recompute this texture's Hash (the content changed)
2. Recompute its dependency relationships, which have not changed either (the prefabs referencing the same texture are unchanged)
3. Repack only the Bundle that contains this texture

while the other few dozen Bundles that do not reference this texture are **skipped entirely**.

For a large project, that improvement means: **everyday build times may drop from 40 minutes to 10 minutes or even less.**

### Advantage 2: A Programmable Build Pipeline

`BuildAssetBundles` is just a black box — the source is closed; you tag your assets, tell it the output directory, and it starts running. You cannot see any of the internal logic. If you want to insert a step into the packaging process (automatically checking before the build whether texture dimensions exceed a limit, or automatically generating a version file afterwards, say), you have to "wrap" it in the build script — call the API and then do your extra work.

SBP turns the build process into an **assemblable pipeline**. It exposes a number of `IBuildTask` interfaces, so you can insert your own steps into the standard packaging pipeline:

```csharp
// A simplified sketch of a custom build pipeline with SBP
var buildTasks = new List<IBuildTask>
{
    new CalculateAssetDependencyData(),  // calculate dependencies
    new CalculateCustomHashes(),          // calculate Hash (custom)
    new StripUnusedSpriteSources(),       // custom: strip unused Sprite source data
    new GenerateBundlePacking(),          // generate the packing plan
    new WriteSerializedFiles(),           // write the serialized assets
    new ArchiveAndCompressBundles(),      // compress and pack
};
```

This lets a team tailor the build process to its own needs instead of being locked into Unity's default behaviour.

### Advantage 3: Transparent Caching and Logging

With SBP, the logs make it perfectly clear what each step did, which incremental changes hit the cache and which assets were rebuilt. For troubleshooting questions like "why does this Bundle get rebuilt every time", SBP is far friendlier than the default interface.

## 4. The Relationship Between SBP and Addressables

Here is a point that is very easy to confuse: **what is the relationship between SBP and Addressables?**

Put simply:

- **SBP** is low-level infrastructure — it replaces `BuildAssetBundles` and governs "how to build"
- **Addressables** is a higher-level asset management system — it governs "what to build", "how to load it" and "how to update it"

They are two independent Packages and can be used separately:

- **SBP only, no Addressables**: if your project already runs well under the generation-1 AssetBundle system and you only want faster builds and better cache efficiency, you can use SBP alone to replace the low-level packaging interface. The loading logic stays put; runtime is unchanged. This is the **smallest-change** upgrade path.
- **Addressables only, no SBP**: by default Addressables uses `BuildAssetBundles` for its low-level packaging (though newer versions of Addressables already recommend pairing with SBP).
- **SBP + Addressables together**: this is the end state Unity recommends — Addressables for asset management, SBP for low-level packaging. It is also the best practice for new projects.

## 5. A Minimal Migration from Generation 1 to SBP

If you are on route A, the tagging mode (manually tagging bundle names + `BuildAssetBundles`), migrating to SBP is very simple. Roughly:

1. Install the `com.unity.scriptablebuildpipeline` package through the Package Manager
2. Keep your existing AssetBundle tags (the bundle names in the `.meta` files are unchanged)
3. Replace the call to `BuildPipeline.BuildAssetBundles()` in your packaging script with SBP's `CompatibilityBuildPipeline.BuildAssetBundles()`

That is all there is to it — the name changes, the parameter format is largely compatible, SBP reads the existing AssetBundle tags automatically, and the incremental cache takes effect on its own.

If you are on route B (defining bundles in code with `AssetBundleBuild[]`), that is fine too — SBP also provides an interface compatible with `AssetBundleBuild[]`, or you can use SBP's advanced API to rewrite the packaging process outright for finer control. Whichever route you are on, the migration cost is small.

Of course, if you want finer control, you can later replace the compatibility mode with SBP's advanced API step by step — but this is already the smoothest way in.

## 6. Summary

| Dimension | BuildAssetBundles (generation 1) | SBP (generation-2 low level) |
|------|---------------------------|-------------------|
| Incremental builds | Crude; frequent over-rebuilding | Precise; incremental decisions based on content Hash |
| Customizability | Black box (closed source), a fixed process you cannot customize | Custom BuildTasks can be inserted (open source) |
| Migration cost | — | Extremely low; compatibility mode needs almost no changes |
| Relationship to Addressables | Addressables may optionally use it | Addressables is recommended to pair it with SBP |
| Runtime impact | — | None; what it produces is still a .bundle |

SBP solves the problem of "how to make packaging faster and smarter". The questions of "how assets are managed, loaded and hot-updated" are a layer it does not handle — that is **Addressables**' home turf.

---

Next time we will talk about Addressables — Unity's currently recommended asset management solution. Building on generation-1 AssetBundle + SBP, what further layer of problems does it solve? And why is the change it requires so much larger than SBP's?

A small step forward every day is a new height!
