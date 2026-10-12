---
title: Unpacking AssetBundles — Extracting Unity Assets with AssetStudio
date: 2025-07-11
author: Tang Moying
categories: [build]
tags: [Unity, AssetBundle, AssetStudio, Asset Extraction]
lang: en
alt_url: /post/AssetBundle-解包
---


## 1. What AssetBundle Unpacking Is

An AssetBundle is Unity's asset packaging format: a game's models, textures, audio and other assets are all packed into it. Unpacking means extracting those packaged assets back out in reverse, to look at exactly what is inside.

In a build pipeline, AssetBundle unpacking has several very practical uses:

- **Analysing build output**: after a build finishes, unpacking the AssetBundles lets you check which assets were actually packed in, confirming that they went into the right bundles.
- **Hunting down duplicate assets**: different AssetBundles may reference the same texture or the same material; after unpacking, comparing the asset lists of each bundle reveals the redundancy, and you can shrink the bundle size.
- **Checking for missing assets**: when an asset you expected in some AssetBundle is not there, or a reference is broken, unpacking lets you quickly tell whether it is a build configuration problem or an asset dependency problem.
- **Verifying asset compression**: after unpacking, look at the size, format and compression ratio of the textures and compare them with the originals to judge whether the compression meets your targets.
- **Extracting and reusing assets**: export models, textures, audio and so on out of the AssetBundle, for study or for building up your own asset collection.

AssetStudio is the most popular open-source Unity asset extraction tool today. Developed by Perfare and now maintained by zhangjiequan, it supports parsing AssetBundles from Unity 3.x through 2022.3.x.

Project page: [zhangjiequan/AssetStudio](https://github.com/zhangjiequan/AssetStudio)

## 2. Download and Install

Download the latest version from the GitHub Releases page (currently v0.16.53):

- `AssetStudio.net472.zip` — requires .NET Framework 4.7.2
- `AssetStudio.net6.zip` — requires .NET Desktop Runtime 6.0

Unzip it and run `AssetStudioGUI.exe` directly; no installation is needed.

## 3. Loading AssetBundle Files

There are two ways to load them:

### Loading Directly

**File → Load file** to pick a single file, or **File → Load folder** to load an entire folder. This approach decompresses the AssetBundle into memory to read it, and may consume a fair amount of memory when handling large files.

### Extract First, Then Load (Recommended)

First use **File → Extract file** or **Extract folder** to extract the AssetBundle into a folder, then load from there. This approach saves memory, and is recommended when handling large AssetBundles.

```plaintext
1. File → Extract folder → select the directory containing the AssetBundle → select the output directory
2. File → Load folder → select the output directory from the previous step
```

Once loading is finished, the left-hand panel shows the asset tree, categorised by type: Texture2D, AudioClip, Mesh, Font, TextAsset, Shader, MonoBehaviour and so on.

## 4. Exporting Assets

Select an asset in the asset list, then right-click and choose **Export** to export it. The supported export formats are as follows:

| Asset type | Export format |
|---------|---------|
| Texture2D (texture) | PNG, TGA, JPEG, BMP |
| Sprite | Cropped from the texture and then exported as PNG and other formats |
| AudioClip (audio) | MP3, OGG, WAV, M4A |
| Font | TTF, OTF |
| Mesh | OBJ |
| TextAsset (text) | Text format |
| Shader | Preview and export supported |
| MonoBehaviour | JSON |
| Animator | Exported as FBX, with AnimationClips bound automatically |

Batch export: hold Ctrl to select several assets, then right-click **Export**.

## 5. Exporting Models and Animations

AssetStudio supports exporting 3D models together with their animations:

- **Exporting a static model**: select the model in the "Scene Hierarchy" panel and use the **Model** menu to export it as FBX or OBJ.
- **Exporting a model with animations**: select the model in "Scene Hierarchy", then hold Ctrl in the "Asset List" to select several AnimationClips, and use **Model → Export selected objects with AnimationClip**.
- **Exporting an animator controller**: select the Animator in the "Asset List" and export it via the **Export** menu; the related animations are bound automatically.

## 6. Handling IL2CPP Projects

For Unity projects compiled with IL2CPP, an extra step is required:

1. First use [Il2CppDumper](https://github.com/Perfare/Il2CppDumper) to dump `global-metadata.dat` and `GameAssembly.dll`, producing dummy DLL files.
2. The first time you select a MonoBehaviour-type asset in AssetStudio, point it at the folder containing the dummy DLLs.
3. After that you can view and export the script data normally.

## 7. Common Questions

**Q: Loading an AssetBundle says the version is unsupported?**

A: Set the `SpecifyUnityVersion` property manually in `AssetsManager.cs` to specify the Unity version, then recompile.

**Q: The extracted textures are blurry?**

A: Check the texture format option in the export settings, and prefer the lossless PNG format.

**Q: The model has no materials after export?**

A: Tick the **Export Materials** option when exporting.

## 8. Summary

AssetStudio is a sharp tool for Unity asset extraction, with comprehensive features. Extract first and then load to save memory, and pair it with Il2CppDumper when handling IL2CPP projects.

A small step forward every day is a new height!
