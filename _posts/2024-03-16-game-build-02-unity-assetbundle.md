---
title: 游戏构建：Unity 构建（二）：AssetBundle 两代接口——从手写打包到自动依赖，经历了什么？
author: 唐明
categories: [build]
tags: [游戏开发, Unity, 游戏引擎, 构建工具, AssetBundle, Game Build]
---


## 1、没有 AssetBundle 的日子

在讲 AssetBundle 的接口演进之前，先想象一下：**如果 Unity 没有资源动态加载机制，游戏怎么做？**

答案很简单——把所有资源都放在工程里，构建时全部打进安装包。

这听起来好像也没啥？但你想一个真实手游，场景几十个，角色几十个，每个角色几张贴图、一个模型、好几套动画……光是贴图可能就几百上千张。全部打进 APK，包体直奔 2-3GB。

用户下载的时候看到「2.3GB」这个数字，手指悬在下载按钮上一秒钟，然后划向了竞品。

更要命的是**更新**。你修了一个 UI bug，改了 BuglyButton.prefab 这一个资源。但在「全部打进包」的模式下，用户必须重新下载完整的 2.3GB 安装包。这不是更新，这是在劝退。

所以，AssetBundle 的核心使命从诞生之初就很明确：**让资源可以按需下载、独立更新**。

但 AssetBundle 的 API 本身，其实也经历了「从坑到能用」的迭代。这篇文章，我们就来聊聊 AssetBundle 打包接口的两代变迁。

<!--以上为摘要内容-->

## 2、Resources 目录：最原始的资源加载方式

在 AssetBundle 之前，Unity 的资源动态加载只能靠 `Resources.Load()`。

你把资源放在 `Assets/Resources/` 目录下，代码里这样加载：

```csharp
GameObject prefab = Resources.Load<GameObject>("Enemies/Boss");
```

简单直接。

但它有一个致命缺陷：**Resources 目录里的所有资源，都会被打包进最终的安装包**。不管你用不用，只要在 Resources 里，就进包。

而且更坑的是，Resources 目录下的资源**没有引用计数的概念**。如果你把一个模型从场景引用变成了 Resources.Load，这个模型就不会被「正常引用」管理，Unity 无法判断它是否被需要，只能用最傻的办法：全打进包里。

所以 Resources 目录的定位从一开始就是「方便快速原型开发」，而不是「生产环境的资源管理方案」。

## 3、第 0 代：BuildPipeline.BuildAssetBundle（不带 s）

这是 AssetBundle 的史前时代，Unity 4.x 及更早版本里的接口。现在已经被废弃了，但理解它，才能理解后来为什么会有那些改进。

第 0 代的 API 长这样：

```csharp
// Unity 4.x 时代的用法（已废弃，仅供参考）
BuildPipeline.BuildAssetBundle(
    null,                           // 主资源（通常是 null）
    Selection.objects,              // 你自己手动收集的资源列表
    "Assets/StreamingAssets/myBundle.unity3d",  // 输出路径
    BuildAssetBundleOptions.None,   // 构建选项
    BuildTarget.StandaloneWindows   // 目标平台
);
```

注意这个名字：`BuildAssetBundle`，**没有结尾的 s**。和后面我们会讲到的 `BuildAssetBundles`（带 s）是完全不同的接口。

这种用法有两大痛点：

**痛点一：你得自己收集资源。**

`Selection.objects` 是 Unity Editor 里当前选中的资源对象。也就是说，你要打包哪些资源，得手动在编辑器中先选中它们，然后跑脚本。当然你也可以写代码用 `AssetDatabase.FindAssets()` 等方式收集，但总之——收集哪些资源进哪个包，这个逻辑**全要你自己写**。

**痛点二：不自动处理依赖。**

这是最大的问题。假如 `Boss.prefab` 引用了贴图 `Boss_Diffuse.png`。你用 `BuildAssetBundle` 把 `Boss.prefab` 打成一个包——但贴图呢？贴图不会自动跟进来。

你必须手动检查每个资源引用了哪些依赖，把依赖也放进 `Selection.objects` 里，确保所有被引用的资源都出现在收集列表中。否则打出来的包不完整，运行时加载就崩。

更要命的是，如果有两个不同的包引用了同一张贴图，在第 0 代的机制下，**这张贴图会被重复打包进两个包里**。除非你自己写代码计算 Hash 去重——但绝大多数团队根本没精力搞这个。

所以第 0 代接口的体验就是：**你不仅要操心「打什么包」，还要操心「包里缺不缺东西」和「东西是不是重复了」**。全是体力活。

## 4、第 1 代：手动标记包名 + BuildPipeline.BuildAssetBundles（带 s）

从 Unity 5 开始，Unity 引入了一套全新的机制，而且这套机制**至今仍是主流用法**。

它的核心由两部分组成：

**第一部分：在编辑器里给资源手动标记 AssetBundle 名称。**

选中一个资源，在 Inspector 面板底部有一个 AssetBundle 的下拉框，你手动选择它属于哪个包。这个标记信息存在 `.meta` 文件里，跟随资源一起被版本管理。

**第二部分：调用 `BuildPipeline.BuildAssetBundles()`（注意，带 s）。**

构建的时候，你只需要指定输出目录和目标平台——

```csharp
BuildPipeline.BuildAssetBundles(
    "Assets/StreamingAssets/Bundles",  // 输出目录
    BuildAssetBundleOptions.None,      // 构建选项
    BuildTarget.StandaloneWindows      // 目标平台
);
```

**Unity 会自动读取所有资源上的 AssetBundle 标记**，然后自动计算和处理资源之间的依赖关系。Boss.prefab 标记了属于 `characters` 包，引用了贴图 Boss_Diffuse.png——Unity 会自动把贴图也打进 `characters` 包里，或者在依赖关系里正确记录。

这和第 0 代的体验简直是天壤之别：

| 维度 | 第 0 代（无 s） | 第 1 代（有 s） |
|------|----------------|----------------|
| 资源收集 | 手动写代码收集 | 编辑器标记，API 自动读取 |
| 依赖处理 | 不自动处理，需手动管理 | 自动计算和处理依赖关系 |
| 资源去重 | 需手动 Hash 计算去重 | 引擎自动去重 |
| 状态载体 | 无，全靠代码逻辑 | `.meta` 文件 |

标记 + BuildAssetBundles 是**一套组合拳**——标记定义规则，API 执行规则。不是两个独立的用法，而是互相配合的。

### 另一种玩法：AssetBundleBuild[]——不写 .meta，纯代码定义分包

`BuildAssetBundles` 还有一个重载版本，使用场景完全不同：

```csharp
// 不用先在编辑器里标记资源，直接通过代码传入分包定义
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

// 传入 AssetBundleBuild[]，取代读取编辑器标记
BuildPipeline.BuildAssetBundles(
    "Assets/StreamingAssets/Bundles",
    builds,                         // ← 这里，不依赖 .meta 里的标记
    BuildAssetBundleOptions.None,
    BuildTarget.StandaloneWindows
);
```

这个重载的核心理念是：**分包规则由代码定义，不写 `.meta` 文件。** 这意味着：

- ✅ **不需要在编辑器里手动标记 AssetBundle 名称**——所有分包信息都在你的构建脚本里
- ✅ **meta 文件不再参与构建配置**——彻底告别「A 改了标记 B 拉下来就乱」的协作冲突
- ✅ **分包规则可以被版本管理得清清楚楚**——你的构建脚本就是一个 `.cs` 文件，diff 清晰

但代价也很明显：

- ❌ **依赖追踪仍然要自己管**：你传给 `AssetBundleBuild` 的资源列表是「你认为是这些资源就行了」。如果 Boss.prefab 引用了 Boss_Diffuse.png，你没有把贴图写进 `assetNames` 里——那贴图就不会进包。Unity 不会自动帮你补全。（这和「标记包名 + 简单调用」那种自动读取标记并补充依赖的行为不一样——因为那个模式下 Unity 有标记信息可以追溯依赖，而这个模式下全看你传入的数组。）
- ❌ **增量构建要自己实现**：你传入的 `builds` 数组决定了「这次要打哪些包」。但哪些资源变了、哪些包需要重打——Unity 在这个重载下的增量判断也比你想象的粗糙。如果你想实现精确的增量（只重打发生了变化资源的包），你需要自己在构建脚本里实现变动检测逻辑——比如对比上次和本次的资源 Hash，只把变了的资源所在的 AssetBundleBuild 放进数组。

所以，这个重载的本质是把控制权交给了开发者，但同时也把「追踪依赖」和「增量判断」的责任交了回来。它是第 1 代接口中**更灵活但也更容易出错**的用法。

## 5、第 1 代的痛点：虽然比第 0 代好多了，但依然不够

第 1 代接口解决了「自动追踪依赖」的核心问题（在标记模式下），但它也制造了新的痛点。

**标记写在 `.meta` 文件里**。

这意味着 meta 文件变成了「构建配置的一部分」。团队里 A 改了某个资源的分包规则 → meta 文件变了 → 提交到 Git → B 拉下来发现莫名其妙某个资源变包了。在分支频繁切换的游戏开发节奏里，meta 文件的冲突是家常便饭。

而且，你有几千个资源，不可能一个一个手点。于是大家开始写工具脚本，用一个配置文件（比如 Excel 或 JSON）定义分包规则，然后写脚本在构建前自动给每个资源设置 AssetBundle 名称，打完包再清除标记。每次出包，几千个资源的标记都要刷一遍。

**依赖管理仍然需要开发者手动介入**。

虽然引擎帮你处理了打包时的依赖关系，但运行时加载的顺序依然要你自己管。假设预制体 Boss.prefab 引用了贴图 Boss_Diffuse.png，两者在不同包里——你必须先加载贴图包，再加载预制体包。Unity 不会在运行时帮你自动处理这个顺序。

社区的做法是解析 Build 生成的 `.manifest` 文件，在加载包里维护一张依赖图。但说实话，复杂项目里依赖图一旦有几十上百条边，人工维护的可靠性就会直线下降。

而且，不管你打包多么小心，这套接口本身有一个绕不开的局限——**它是 Unity Editor 内部的 API**。`BuildAssetBundles` 只能在编辑器里跑，所以你的 CI 机器必须装完整 Unity + `-batchmode`。这和 Unreal 的独立命令行工具比起来，显得笨重。

## 6、总结：两代接口的演进逻辑

从第 0 代到第 1 代，AssetBundle API 的演进逻辑是清晰的：

- **第 0 代的痛**：手工收集资源 + 不自动处理依赖 → 打包不可靠
- **第 1 代的两条路**：
  - **路线 A（标记模式）**：编辑器标记 + 简单调 `BuildAssetBundles()` → 自动读标记 + 自动依赖处理，但标记写 `.meta` 协作麻烦
  - **路线 B（代码模式）**：`AssetBundleBuild[]` 传入 `BuildAssetBundles(builds)` → 纯代码定义分包，不碰 `.meta`，但依赖追踪和增量判断又回到开发者手里

两种方式都没有解决「运行时加载顺序」「增量构建效率」和「整体资源管理」这些更高层的问题。而这些，正是后来 **Scriptable Build Pipeline（SBP）** 和 **Addressables** 试图解决的——我们接下来两篇接着聊。

---

下一篇，我们来聊聊 Scriptable Build Pipeline（SBP）——它是 BuildAssetBundles 的底层替代品。为什么它能大幅提升增量构建缓存效率？它和 Addressables 又是什么关系？

每天前进一小步，就是一个新的高度！
