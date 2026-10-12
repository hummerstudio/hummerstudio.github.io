---
title: 'Game Build: Unity Build (Part 4): Addressables — a "Correct Answer" That Changes Far More'
date: 2024-03-30
author: Tang Moying
categories: [build]
tags: [Game Development, Unity, Game Engines, Build Tools, Addressables, AssetBundle, SBP, Game Build]
lang: en
alt_url: /post/game-build-04-unity-addressables
---


## 1. From SBP to Addressables: Two Different Upgrade Paths

In the previous two articles we talked about the evolution of the underlying AssetBundle interface: Generation 0 (manual collection + no dependency handling) → Generation 1 (marking the package name, or defining the splits in code with `AssetBundleBuild[]`, with automatic dependencies) → SBP (precise incremental builds, with the source code open).

SBP is an upgrade path with the **smallest change** — you only swap out the underlying packaging interface, and the incremental cache kicks in immediately. But SBP has nothing to say about how assets are "managed and loaded."

At this point, if you ask: "Can we simplify asset loading as well?" the answer is **Addressables**.

But one thing has to be made clear up front — Addressables is not the same as SBP. SBP is "swap in a different packaging engine, everything else stays the same." Addressables is "redefine how you reference assets, how you load assets, how you update assets" — **this is an upgrade that changes a great deal more.**

<!--以上为摘要内容-->

## 2. What Problems Does Addressables Solve That SBP Didn't?

SBP solved "slow packaging," but it didn't solve the following problems:

- **Verbose loading code**: every asset load has to write `AssetBundle.LoadFromFile` + `LoadAsset`, a pile of boilerplate
- **Dependency order**: you have to parse the Manifest yourself and make sure Bundle B (A's dependency) is loaded before Bundle A
- **Asset location**: you have to know that the Boss asset is in `characters.bundle`, and that `characters.bundle` is under the `StreamingAssets/Bundles/characters` path
- **Hot-update flow**: you need a whole set of logic to download new Bundles, replace old Bundles, clear caches, and manage versions

None of these are SBP's responsibility — SBP just makes packaging faster.

**What Addressables sets out to solve is the entire "runtime asset management" layer.**

## 3. The Core Idea of Addressables: Replacing "Paths" with "Addresses"

In Addressables, loading an asset looks like this:

```csharp
// You don't need to know which Bundle or which path the asset is in
GameObject boss = await Addressables.LoadAssetAsync<GameObject>("Boss").Task;
```

Compare that with how loading worked in the AssetBundle era:

```csharp
// You have to know the path, know the Bundle name, load the Bundle manually, then load the Asset
AssetBundle bundle = AssetBundle.LoadFromFile(
    Path.Combine(Application.streamingAssetsPath, "characters"));
GameObject boss = bundle.LoadAsset<GameObject>("Boss");
```

An "address" is essentially just a string key. It can be an asset name, a file path, a custom label... Internally, Addressables keeps a mapping table (the Catalog) that takes you from an "address" to "which Bundle this asset is in, and which CDN path that Bundle is at."

You say "I want Boss," and Addressables sorts everything out — loading the Bundle, resolving dependencies, returning the asset. You don't have to care which package it's in or what it depends on.

## 4. Grouping and Building in Addressables

In Addressables, assets aren't bound directly to an AssetBundle; they're first placed in a logical grouping called a "Group." A Group ultimately produces one or more AssetBundles.

Groups are far more useful than the raw AssetBundle names, because at the Group level you can configure:

- **Packaging strategy**: are the assets in the Group packed into one package, or packed separately?
- **Update strategy**: can this Group be hot-updated? What's the CDN address?
- **Loading strategy**: shipped with the installation package, or downloaded on demand from a remote server?

Common groupings:

- **Remote Group**: for assets that need hot updates (character models, UI textures, audio), with the remote package on a CDN
- **Local Group**: for assets that don't need updating but must ship with the package (base shaders, core framework prefabs)

What's more, Addressables' group configuration lives in separate `.asset` config files and **is not written to `.meta`**. This solves the Generation 1 AssetBundle collaboration pain point of "`.meta` files conflicting all over the place."

## 5. Under the Hood: AssetBundle + SBP

No matter how shiny Addressables looks on the surface, **underneath it's still AssetBundle.**

Here's how it works:

1. You drag assets into an Addressables Group
2. At build time, Addressables generates a packaging plan from the Group configuration
3. It calls the packaging interface to produce `.bundle` files — here you can use `BuildAssetBundles`, or configure it to use **SBP**
4. It generates a Catalog file (the mapping table of asset address → Bundle location → CDN path)
5. At runtime, `LoadAssetAsync("Boss")` → look up the Catalog → find the Bundle → load the Bundle → return the asset

So the relationship between Addressables and SBP is: **Addressables handles "which assets are managed how," SBP handles "how to efficiently pack those assets into Bundles."** The two complement each other and can be stacked.

## 6. Why Is Addressables Such a Big Change?

Back to the point from the opening — Addressables changes far more than SBP, because:

**It changes how you reference assets.**

In the traditional AssetBundle system, game code references an asset with a direct reference (a prefab references a texture, a scene references a prefab). At build time, Unity analyzes these direct references to decide where assets belong.

But in Addressables, an asset reference becomes an "address string." `GetComponent` becomes `LoadAssetAsync("key")`. That means:
- All of your asset-loading code has to change
- Loading becomes an asynchronous operation — data you used to get synchronously now has to wait for a callback
- Asset lifetime management (when to Load, when to Release) needs to be reworked

**It changes the hot-update flow.**

In the traditional approach, hot updates are something you design yourself — how version numbers are managed, which Bundles get updated, how to fall back when a download fails... everyone's design is different.

Addressables provides a standardized hot-update flow: Catalog version comparison → diff to compute the changed Bundles → download → cache. But this flow is opinionated — you have to do it its way. If your legacy project already has a mature hot-update scheme, the migration cost is not low.

**It changes how you think about asset grouping.**

In the traditional approach, what you care about is "how many packages these assets are packed into, and what each package is called." In Addressables, what you care about is "which assets belong to the same Group, and which CDN that Group is on." The granularity of management shifts from "packages" to "groups and addresses," and even the way you understand your project structure changes.

## 7. The New Three-Generation Evolution, Summed Up

With SBP added, the full picture of Unity's asset packaging evolution updates as follows:

| Generation | Method | Core characteristic |
|------|------|----------|
| Generation 0 | `BuildAssetBundle` (no `s`) | Manually collect assets, no dependency handling, deprecated |
| Generation 1 | Marking the package name / `AssetBundleBuild[]` + `BuildAssetBundles` (with `s`) | Automatically tracks dependencies (marking mode); pure code, no `.meta` file (code mode); still the mainstream today |
| Generation 2 (lower layer) | SBP | Precise incremental builds, big cache gains, very low migration cost |
| Generation 2 (upper layer) | Addressables | Address-based loading, standardized hot updates, but a big change |

SBP and Addressables both belong to Generation 2, but one works on the lower layer and the other on the upper layer, and they solve different problems. **SBP makes packaging faster; Addressables makes loading simpler. Using both together is the end state Unity recommends.**

---

Next time, we'll talk about something even lower-level — IL2CPP. Why does Unity turn C# code into C++ and then compile it? What exactly is the difference between Mono and IL2CPP? What pitfalls will you hit when going cross-platform?

A small step forward every day is a new height!
