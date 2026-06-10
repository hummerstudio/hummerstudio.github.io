---
title: AssetBundle解包——使用AssetStudio提取Unity资源
author: 唐明
categories: [build]
tags: [Unity, AssetBundle, AssetStudio, 资源提取]
---


## 1、什么是AssetBundle解包

AssetBundle 是 Unity 的资源打包格式，游戏中的模型、贴图、音频等资源都打包在其中。解包就是将这些打包好的资源逆向提取出来，查看里面的具体内容。

在构建流程中，AssetBundle 解包有几个很实用的场景：

- **分析构建产物**：构建完成后，解包 AssetBundle 可以检查实际打包进去了哪些资源，确认资源是否正确打进对应的包中。
- **排查资源重复**：不同 AssetBundle 可能引用了同一张贴图或同一个材质，解包后对比各包的资源列表，就能发现冗余问题，优化包体大小。
- **检查素材缺失**：预期在某个 AssetBundle 中的资源没找到，或者引用丢失，通过解包可以快速定位是构建配置问题还是资源依赖问题。
- **验证资源压缩效果**：解包后查看贴图的尺寸、格式和压缩率，对比原始资源，评估压缩效果是否达标。
- **提取和复用资源**：从 AssetBundle 中导出模型、贴图、音频等，用于学习参考或素材收集。

AssetStudio 是目前最流行的开源 Unity 资源提取工具，由 Perfare 开发，zhangjiequan 继续维护，支持 Unity 3.x 到 2022.3.x 的 AssetBundle 解析。

项目地址：[zhangjiequan/AssetStudio](https://github.com/zhangjiequan/AssetStudio)

## 2、下载与安装

从 GitHub Releases 页面下载最新版本（目前 v0.16.53）：

- `AssetStudio.net472.zip` — 需要 .NET Framework 4.7.2
- `AssetStudio.net6.zip` — 需要 .NET Desktop Runtime 6.0

解压后直接运行 `AssetStudioGUI.exe` 即可，无需安装。

## 3、加载AssetBundle文件

有两种加载方式：

### 直接加载

**File → Load file** 选择单个文件，或 **File → Load folder** 加载整个文件夹。这种方式直接将 AssetBundle 解压到内存中读取，处理大文件时可能消耗较多内存。

### 解压后加载（推荐）

先用 **File → Extract file** 或 **Extract folder** 将 AssetBundle 解压到文件夹，再加载读取。这种方式更节省内存，推荐处理大型 AssetBundle 时使用。

```plaintext
1. File → Extract folder → 选择 AssetBundle 所在目录 → 选择输出目录
2. File → Load folder → 选择上一步的输出目录
```

加载完成后，左侧面板会显示资源树结构，按类型分类为：Texture2D、AudioClip、Mesh、Font、TextAsset、Shader、MonoBehaviour 等。

## 4、导出资源

在资源列表中选中资源后，右键选择 **Export** 即可导出。支持的导出格式如下：

| 资源类型 | 导出格式 |
|---------|---------|
| Texture2D（纹理） | PNG、TGA、JPEG、BMP |
| Sprite（精灵） | 从纹理裁剪后导出 PNG 等格式 |
| AudioClip（音频） | MP3、OGG、WAV、M4A |
| Font（字体） | TTF、OTF |
| Mesh（网格） | OBJ |
| TextAsset（文本） | 文本格式 |
| Shader（着色器） | 支持预览和导出 |
| MonoBehaviour | JSON |
| Animator | 导出为 FBX，自动绑定 AnimationClip |

批量导出：按住 Ctrl 多选资源，右键 **Export** 即可。

## 5、导出模型和动画

AssetStudio 支持导出带动画的 3D 模型：

- **导出静态模型**：在"场景层级"面板选择模型，使用 **Model** 菜单导出为 FBX 或 OBJ。
- **导出带动画的模型**：在"场景层级"选中模型，然后在"资源列表"中按住 Ctrl 多选 AnimationClip，使用 **Model → Export selected objects with AnimationClip**。
- **导出动画控制器**：在"资源列表"中选择 Animator，使用 **Export** 菜单导出，会自动绑定相关动画。

## 6、IL2CPP项目处理

对于使用 IL2CPP 编译的 Unity 项目，需要额外步骤：

1. 先用 [Il2CppDumper](https://github.com/Perfare/Il2CppDumper) 对 `global-metadata.dat` 和 `GameAssembly.dll` 进行 dump，生成虚拟 DLL 文件。
2. 在 AssetStudio 中首次选择 MonoBehaviour 类型资源时，指定虚拟 DLL 所在的文件夹。
3. 之后即可正常查看和导出脚本数据。

## 7、常见问题

**Q：加载 AssetBundle 时提示版本不支持？**

A：在 `AssetsManager.cs` 中手动设置 `SpecifyUnityVersion` 属性指定 Unity 版本，然后重新编译。

**Q：提取的贴图是模糊的？**

A：检查导出设置中的纹理格式选项，优先选择 PNG 无损格式。

**Q：模型导出后没有材质？**

A：导出时勾选 **Export Materials** 选项。

## 8、总结

AssetStudio 是 Unity 资源提取的利器，功能全面。推荐先解压再加载以节省内存，处理 IL2CPP 项目时配合 Il2CppDumper 使用。

每天前进一小步，就是一个新的高度！
