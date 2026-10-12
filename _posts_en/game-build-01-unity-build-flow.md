---
title: 'Game Builds: Unity Build (Part 1): After You Click Build, How Much Does Unity Do For You?'
date: 2024-03-09
author: Tang Moying
categories: [build]
tags: [Game Development, Unity, Game Engines, Build Tools, Build Pipeline, Game Build]
lang: en
alt_url: /post/game-build-01-unity-build-flow
---


## 1. A Confusion Set Off by One Button

When I first got into Unity builds, my mindset was like this:

I'd spent ten years doing Java development before this, and a build was just `mvn clean package` or `./gradlew build`. I knew what the compiler was doing — `.java` compiles into `.class`, gets packaged into a `.jar`, done.

I opened Unity, went to `File → Build Settings`, and there was a big **"Build" button**. I thought, isn't this just Unity's version of `gradle build`? One click and we're done.

So I clicked it.

And then I waited twenty minutes.

And then I asked the colleague next to me, "What has Unity been doing for twenty minutes?"

He scratched his head. "No idea. Building, I guess."

That answer clearly wasn't good enough for me. So I started digging into Unity's build process — from clicking Build to producing an APK/EXE, how many steps actually happen? What is Unity doing at each stage? Why is it so slow?

This article is my "digging" notebook.

<!--以上为摘要内容-->

## 2. A Panorama of the Unity Build Pipeline

Let's start with the big picture. When you click the Build button, Unity goes through roughly these stages:

```
① Validate Build Settings configuration
    ↓
② Compile C# scripts (Script Compilation)
    ↓
③ Asset import and processing (Asset Import & Processing)
    ↓
④ Scene building (Scene Building)
    ↓
⑤ Asset bundling (Asset Bundling / Resource Inclusion)
    ↓
⑥ Engine code linking (Engine & IL2CPP Compilation)
    ↓
⑦ Platform-specific packaging (Platform Packaging)
    ↓
⑧ Output the final build artifact (APK / EXE / Xcode Project / ...)
```

That doesn't look like much — eight steps, that's all. But behind each one is a whole world. Let's take them apart one by one.

## 3. Step One: Validate Build Settings

This step is the fastest, usually just a few seconds. What Unity does:

- Checks that every Scene you selected actually exists (the ones under Build Settings → Scenes In Build)
- Checks whether the target platform supports the features you're currently using (WebGL, for example, doesn't support multithreading)
- Checks Player Settings for obvious configuration conflicts

If it errors out here, count yourself lucky — that beats erroring out after waiting forty minutes.

## 4. Step Two: Compile the C# Scripts

This is just compiling all the `.cs` files you wrote into Intermediate Language (IL).

Unlike Java, Unity's script compilation **doesn't happen inside the IDE** — it's done inside the Unity editor itself. Unity uses Roslyn (Microsoft's C# compiler) to compile your scripts into `.dll` assemblies.

There's a point here that's easy to overlook: Unity's script compilation is **staged**. It divides your scripts into different assemblies according to the Assembly Definition (`.asmdef`) layout, then compiles them in dependency order. If you haven't split them into Assembly Definitions by hand, Unity does it automatically by default rules — roughly:

- First stage: `Assembly-CSharp-firstpass` (scripts under Plugins or Standard Assets)
- Second stage: `Assembly-CSharp` (every other script)
- Third stage: `Assembly-CSharp-Editor` (scripts under the Editor directory)

That's why the time spent on "script compilation" is directly tied to how much C# code is in your project. In a large project with tens of thousands of lines of C#, compiling the scripts alone can take several minutes.

## 5. Step Three: Asset Import and Processing

This step is the greatest watershed between game builds and traditional software builds.

In the Java world, your "assets" might just be a few `.properties` or `.yaml` configuration files; the build basically ignores them and just stuffs them in when packaging.

In Unity, "assets" are models (`.fbx`, `.obj`), textures (`.png`, `.psd`, `.tga`), audio (`.wav`, `.mp3`), materials, animations, prefabs… often numbering in the thousands or tens of thousands.

What Unity has to do at this step:

- **Model import**: convert `.fbx` files into Mesh data the engine can use, computing normals, tangents and bounding boxes
- **Texture processing**: apply texture compression according to the platform settings, generate mipmaps, adjust the maximum size
- **Audio processing**: transcode to the target platform's audio format and set compression quality
- **Material compilation**: compile material parameters into Shader parameter blocks the target platform can run
- **Asset reference resolution**: check each asset's GUID and reference relationships

Note that these operations **are all affected by your platform choice**. Choose Android, for instance, and textures are compressed to ASTC; choose PC and they may be compressed to DXT/BC7. That means the same set of assets has to be **processed all over again** when you switch platforms.

This is one of the big reasons why "switching platforms to build" is so time-consuming.

## 6. Step Four: Scene Building

A Scene is the basic unit for organizing the game world in Unity. One scene may hold hundreds of GameObjects, and each GameObject has a pile of Components attached to it.

When building a scene, what Unity does:

- Serialize all the GameObject and Component data in the scene
- Resolve cross-scene references
- Strip out Editor-only data (temporary data marked in Editor scripts, for example)
- Generate the scene's serialized file

This step usually runs in parallel with, or interleaved with, asset processing. If the scene references assets such as textures or models, Unity triggers the import handling for those assets.

## 7. Step Five: Asset Bundling

This is the step in a Unity build that **most needs the developer's involvement**.

Unity provides the low-level `BuildPipeline.BuildAssetBundles()` interface. But **which assets go into which bundle, how they're grouped, how dependencies are handled** — all of that logic you have to write yourself in C# scripts.

If you haven't configured AssetBundle or Addressables, Unity packs every asset that's used into the final package. That's fine for a small project, but for a large one a single package can be tens of gigabytes, and hot updates become out of the question.

We'll cover the evolution of AssetBundle and Addressables in a dedicated pair of articles later. Here you just need to know that **asset bundling is the part of the whole build pipeline that demands the most thinking from the developer**, and also the one most prone to error.

## 8. Step Six: Engine Code Linking

With the Mono backend (older Unity versions, or the PC platform), this step is just packaging the Mono runtime together with your C# intermediate code (IL).

But with the IL2CPP backend (iOS and most modern projects), things get more complicated:

1. Unity **translates your compiled C# IL code into C++ code**
2. It then uses the platform's C++ compiler (Xcode's clang or the Android NDK's clang) to compile the generated C++ into native machine code

This is the core reason IL2CPP builds are **so slow** — you're not just compiling C#, you're generating tens of thousands of lines of C++ and then compiling those tens of thousands of lines. We'll dig into more IL2CPP details in part four.

## 9. Step Seven: Platform-Specific Packaging

By this point Unity has sorted out all the code and assets; all that's left is "packing the box".

Each platform packs things differently:

- **Windows**: produces a `游戏名_Data` folder plus an `.exe` launcher
- **macOS**: produces an `.app` bundle
- **Android**: packages into an APK or AAB (requires the Android SDK + JDK)
- **iOS**: produces an Xcode project which you then have to compile again with Xcode on a Mac before you get an IPA

For Android, the final step is Unity calling `gradle` internally to build the APK/AAB — and that's the only place in this whole process where you'll find anything resembling a "traditional build".

## 10. Step Eight (Which Doesn't Really Exist): Your Work Has Only Just Begun

Unity has produced the build artifact, but the work is far from over.

- The APK is out; now you have to test whether it installs
- The iOS Xcode project is out; now you have to compile it with Xcode on a Mac
- The asset bundles are out; now you have to verify reference integrity
- Did the hot-update bundle miss any assets? Can the live version load them?

A Unity build produces "a package", but turning it into "a package that can ship" still takes a mountain of work.

That's also why the CI/CD pipeline for a big game is usually not as simple as "click a button, wait twenty minutes" — you have to write scripts that wrap layer after layer of checks and quality gates.

## 11. Summary

Back to the original confusion: "After you click Build, what is Unity actually doing?"

The answer is far more complex than I imagined: compile scripts → process assets → build scenes → bundle assets → compile engine code → platform packaging.

The essential difference from `gradle build` is this: **a game build doesn't just handle code, it handles "code + a sea of assets" at the same time**. The scale of assets and the complexity of processing them is a dimension that barely exists in traditional software builds.

And what Unity gives the developer is the lowest-level `BuildPipeline` interface — "How do you want to handle assets? Write your own script." The automation on top, the bundling strategy, the CI integration — you have to carry all of it yourself.

---

Next time we'll talk about the evolution of Unity's asset-bundling interfaces — from the generation-0 manual bundling of `BuildAssetBundle` (without the "s") to the generation-1 approach of tagging a bundle name plus `BuildAssetBundles` (with the "s") and automatic dependency tracking. What detours did Unity take on the road to bundling assets?

A small step forward every day is a new height!
