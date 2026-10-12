---
title: 'Game Builds: Unreal Build (Part 3): Pak Files — How Unreal Wraps Its Assets'
date: 2024-05-04
author: Tang Moying
categories: [build]
tags: [Game Development, Unreal, Game Engines, Build Tools, Pak, Game Build]
lang: en
alt_url: /post/game-build-08-unreal-pak
---


## 1. Cook Is Done, Now What?

In the previous article we finished going through Cook — Unreal cooked the “raw assets” in the editor into “finished products” usable on the target platform.

Once Cook finishes, a mass of Cooked files appears in your project directory. Textures become `.utexture2D`, models become `.uasset` and `.uexp`, and shaders become `.ushaderbytecode`. These are all platform-native asset formats now.

But here's the problem: if a game has thousands or tens of thousands of Cooked files, how do you deliver them to the player?

Send them down one at a time? Read them one at a time off the OS file system? The disk read speed would make you want to smash your computer.

The solution is **packaging** — combining a large number of small files into one big file, which cuts down IO operations, makes transfer easier and even lets you encrypt them.

Unreal's packaging format is called **Pak**.

<!--以上为摘要内容-->

## 2. What Is a Pak?

Pak is short for **Package**. It is essentially an **archive file** — similar to `.zip` or `.tar`, but better suited to game scenarios than either:

- **Random access**: you don't need to unpack the whole pak; you can locate a single file and read it directly
- **Built-in compression**: you can optionally compress an individual file or the whole pak
- **Mounting**: at runtime you mount a Pak the way you'd “mount a hard drive”, and the engine reads the contents transparently, just as if they were local files
- **Encryption and signing**: supports AES encryption and digital signatures, to stop assets from being extracted or tampered with

The internal structure of a Pak file looks roughly like this:

```
[ Pak Header ]
    - Pak 版本号
    - 文件索引偏移
    - 挂载点路径

[ File Index ]
    - Filename → data offset + size
    - 是否压缩
    - 哈希值

[ File Data ]
    - resource1.uasset
    - resource2.utexture2D
    - resource3.ushaderbytecode
    - ...
```

When the engine reads a Pak file, it reads the Header first and gets the location of the file index. Then it finds the data offset of the target file from the index and seeks straight there to read it. The whole process is one disk IO seek plus one contiguous read. On a modern NVMe SSD that barely counts as a performance bottleneck at all.

## 3. IO Store: The Fourth-Generation Archive Format

If you're on UE5, you may have come across something called **IO Store** in the documentation. It is Unreal's **fourth-generation** asset archiving system.

Here's a quick look at how Unreal's asset archive formats have evolved:

| Generation | Name | Era | Characteristics |
|------|------|------|------|
| First | Direct file access | UE1 ~ UE2 | No packaging, reads file system files directly |
| Second | `.upk` files | UE3 | Packaged, but read-only, no partial loading |
| Third | Legacy Pak | UE4 | Supports mounting, compression, encryption, hot updates |
| Fourth | IO Store | UE5 | Optimized for high-speed NVMe SSDs, supports direct mapping |

The biggest difference between IO Store and Legacy Pak is this: with Legacy Pak, accessing each file requires an IO seek. In the era of mechanical hard drives that wasn't a big problem, but on an NVMe SSD the seek itself has become fast enough to be worth optimizing away — IO Store uses large contiguous blocks of storage directly, organizing the file index and the file data better together, and making full use of the SSD's bandwidth.

Conceptually, though, IO Store does the same thing as Pak: **combine a large number of small files into a big file and access them transparently from inside the game.**

## 4. Chunks and the Patch System

A large game's install package won't be a single ten-plus-GB Pak file — that way every update would mean re-downloading the entire package.

Unreal supports splitting assets into multiple Chunks. A Chunk is simply a logical grouping, and each Chunk corresponds to one or more Pak files.

Common ways of splitting Chunks:

- **Chunk 0**: the core boot package, containing every asset required to start the game. You generally keep it as small as possible so users can get into the game as soon as it finishes downloading
- **Chunk 1+**: content packages, split by feature or by map. The corresponding Chunk is downloaded when the player reaches a given level

Patches are built on Chunks too: you change a few assets, re-Cook + re-Pak those Chunks, and then push out the new Chunk Pak files to replace the old versions. Players download only the few Chunks that changed, instead of the entire game again.

Mechanically this is the same idea as Unity Addressables' “Catalog Diff + per-Bundle update downloads”; Unreal just does it more systematically when it comes to tooling and configuration management.

## 5. Pak Encryption and Signing

Protecting game assets from theft is an old topic.

Pak supports enabling **AES encryption** at build time through configuration. Once a Pak file is encrypted, someone without the key can extract it and still not read the assets inside directly.

The key is usually configured in the project's config file (`DefaultGame.ini`), under the `[Crypto]` section:

```ini
[Crypto]
EncryptionKey=你的AES密钥
bEncryptPakIniFiles=True
bEncryptPakIndex=True
```

You can also enable Pak file signing at the same time, to prevent assets from being tampered with.

Of course, these measures only **raise the bar**; they aren't absolute security. A key stored on the client will be reverse-engineered one day. But for most projects, stopping the majority of players who want to unpack your assets is enough.

## 6. Comparison with Unity AssetBundle

| Dimension | Unity AssetBundle | Unreal Pak |
|------|------------------|------------|
| File format | `.bundle` (Unity's custom binary format) | `.pak` (Legacy) or `.utoc/.ucas` (IO Store) |
| Loading | Code loads Bundles and Assets manually | Engine mounts Paks automatically, transparent file access |
| Dependency management | Developers parse and manage the Manifest by hand | Handled automatically inside the engine |
| Encryption support | Needs a third-party solution or custom encryption | Built-in AES encryption + signing |
| Chunk/splitting | Indirectly supported through Addressables Groups | Native Chunk support |

The biggest difference is how much complexity is exposed to the developer.

AssetBundle exposes a great deal of low-level detail to you — you write the loading code yourself, manage dependencies yourself, think about encryption yourself. Addressables wraps up part of it, but the core logic is still in your hands. Pak is the opposite: the engine handles most of the detail for you — you configure the Chunk partitioning and the engine takes care of loading, dependencies and memory management automatically.

This difference in design philosophy is cut from the same cloth as the overall Unity vs. Unreal styles I described in the earlier articles.

## 7. Summary

Pak files are the last link in Unreal's asset build chain. Cook turns assets into native formats, and Pak bundles those files into large files that are convenient to transfer and load.

For hot updates, Unreal's approach is Chunk + Patch: Cook the new assets → Pak them into a new Chunk → push it out to replace the old Chunk.

Combined with UAT's command-line automation, this flow lets a complete “change assets → produce a build → ship an update” pipeline run fully automatically on CI.

---

Next time we'll talk about the ultimate problem that gives every Unreal developer a headache — **shader compilation**. Why do players have to wait twenty minutes on every update? What's going on with DDC and PSO Cache? Can it all be settled at the build stage?

A small step forward every day is a new height!
