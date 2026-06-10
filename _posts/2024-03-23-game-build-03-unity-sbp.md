---
title: 游戏构建：Unity 构建（三）：Scriptable Build Pipeline——用最小改动，换最大缓存提升
author: 唐明
categories: [build]
tags: [游戏开发, Unity, 游戏引擎, 构建工具, SBP, Scriptable Build Pipeline, Game Build]
---


## 1、那个让构建时间砍半的东西

上一篇我们讲了 AssetBundle 的两代接口演进——从第 0 代「手写代码收集资源、不自动处理依赖」，到第 1 代的两条路线（标记包名 / `AssetBundleBuild[]` 代码定义分包）。

虽然第 1 代的 `BuildAssetBundles` 解决了依赖处理的可靠性问题，但它有两个硬伤。**第一，增量构建的效率很差**——你改了项目中一个贴图的压缩格式（比如从 RGBA32 改成 ASTC），理论上只改了这一个资源，应该只重新打包这一个 Bundle 吧？实际上 Unity 默认的 `BuildAssetBundles` 经常「过度重打」——明明没变的 Bundle 也被重新打包了。大型项目里，每次出包都要等几十分钟甚至更久。

更关键的是第二个问题：**前几代打包 Pipeline 的源码是不开放的**。打包流程出了问题，你想自己排查、自己修——对不起，源码你看不到。你只能等 Unity 官方更新，或者在外面绕道 workaround。

这时候，**Scriptable Build Pipeline（简称 SBP）** 登场了。

<!--以上为摘要内容-->

## 2、SBP 是什么？

SBP 的全称是 Scriptable Build Pipeline。它是 Unity 官方提供的一套**底层打包 API 替代方案**，最早以独立的 Package 形式发布（通过 Package Manager 安装），后来逐渐成为 Unity 推荐的打包基础设施。

它的定位很明确：**替代 `BuildPipeline.BuildAssetBundles` ，提供更高效、更可控的资源打包流程。**

注意，SBP 替代的是「打包接口」，不是「加载接口」。你用 SBP 打出来的依然是 `.bundle` 文件，运行时加载方式（AssetBundle.LoadFromFile 等）完全不变。SBP 只影响**构建阶段**，不影响**运行时**。

这也是它最大的优点：**迁移成本低。** 你不需要改任何游戏逻辑代码，只需要把 CI 上的打包脚本从调 `BuildAssetBundles` 换成调 SBP 的接口。

而且，**SBP 的源码是开放的**。这和前几代打包 Pipeline 形成了鲜明对比——SBP 之前，打包流程的源码完全不开放，你想排查问题、想自己修 bug，根本无从下手。SBP 的源码你可以在 Package 里看到，虽然底层最终也调了引擎内部接口，但至少大部分打包逻辑是暴露出来的，你可以读、可以改、可以调试。

## 3、SBP 的三大核心优势

### 优势一：精确的增量构建

SBP 对「什么变了、什么不需要重打」的判断比 `BuildAssetBundles` 精准得多。

`BuildAssetBundles` 的增量判断比较粗糙——而且因为源码不开放，你根本不知道 Unity 内部是怎么判断的。它就像一个黑盒，经常出现「看起来没变的东西也被重打了」的情况，你连排查都无从下手。

SBP 则把整个打包流程拆成了多个**可独立缓存的步骤**：

```
资源收集 → 依赖计算 → 内容哈希 → 压缩打包
```

每一步都有独立的缓存。如果你的贴图改了压缩参数，SBP 会：

1. 重新计算这个贴图的 Hash（内容变了）
2. 重新计算它的依赖关系也没变（引用同一张贴图的预制体没变）
3. 只重新打包包含这个贴图的 Bundle

而其他几十个没有引用这个贴图的 Bundle，**完全跳过**。

对于大型项目来说，这个改进意味着：**日常构建时间可能从 40 分钟降到 10 分钟甚至更少。**

### 优势二：可编程的构建流程

`BuildAssetBundles` 就像一个黑盒——源码不开放，你把资源标记好，告诉它输出目录，它就开始跑。内部逻辑你完全看不到。你想在打包过程中插一个步骤（比如打包前自动检查贴图尺寸是否超限、打完包自动生成版本文件），你得在构建脚本里「包一层」，调完 API 再做额外操作。

SBP 把构建流程变成了**可组装的管道**。它暴露了多个 `IBuildTask` 接口，你可以在标准的打包流程中插入自己的步骤：

```csharp
// 用 SBP 自定义构建流程的简化示意
var buildTasks = new List<IBuildTask>
{
    new CalculateAssetDependencyData(),  // 计算依赖
    new CalculateCustomHashes(),          // 计算 Hash（自定义）
    new StripUnusedSpriteSources(),       // 自定义：移除未使用的 Sprite 源数据
    new GenerateBundlePacking(),          // 生成打包计划
    new WriteSerializedFiles(),           // 写入序列化资源
    new ArchiveAndCompressBundles(),      // 压缩打包
};
```

这使得团队可以按自己的需求定制打包流程，而不是被 Unity 的默认行为锁死。

### 优势三：透明的缓存和日志

SBP 的每一步做了什么、哪些增量命中了缓存、哪些资源被重打了，日志里都一清二楚。排查「为什么这个 Bundle 每次都被重打」之类的问题，SBP 比默认接口友好很多。

## 4、SBP 和 Addressables 的关系

有一个很容易混淆的点：**SBP 和 Addressables 是什么关系？**

简单说：

- **SBP** 是底层基础设施——替换 `BuildAssetBundles`，管「怎么打」
- **Addressables** 是上层资源管理系统——管「打什么」「怎么加载」「怎么更新」

它们是两个独立的 Package，可以分开使用：

- **只用 SBP，不用 Addressables**：如果你的项目已经在第 1 代 AssetBundle 体系下跑得很好了，只想提升构建速度和缓存效率，那可以只用 SBP 替换底层的打包接口。加载逻辑不动，运行时不变。这是**改动最小**的升级路径。
- **只用 Addressables，不用 SBP**：Addressables 默认底层的打包用的就是 `BuildAssetBundles`（不过新版本 Addressables 已经推荐搭配 SBP）。
- **SBP + Addressables 一起用**：这是 Unity 官方推荐的最终状态——Addressables 做资源管理，SBP 做底层打包。也是新项目的最佳实践。

## 5、从第 1 代到 SBP 的最小化迁移

如果你用的是标记模式的路线 A（手动标记包名 + `BuildAssetBundles`），迁移到 SBP 非常简单。大致步骤：

1. 通过 Package Manager 安装 `com.unity.scriptablebuildpipeline` 包
2. 保留你现有的 AssetBundle 标记（`.meta` 文件中的包名不变）
3. 把打包脚本中调用 `BuildPipeline.BuildAssetBundles()` 的地方，替换为 SBP 的 `CompatibilityBuildPipeline.BuildAssetBundles()`

就这么简单——名字换了，参数格式基本兼容，SBP 会自动读取现有的 AssetBundle 标记，增量缓存自动生效。

如果用的是路线 B（`AssetBundleBuild[]` 代码定义分包），也没问题——SBP 也提供了兼容 `AssetBundleBuild[]` 的接口，或者你可以直接使用 SBP 的高级 API 来重写打包流程，获得更精细的控制。不论哪条路线，迁移成本都不大。

当然，如果你想要更精细控制，后续可以逐步用 SBP 的高级 API 替换兼容模式，但这已经是最平滑的入门路径了。

## 6、小结

| 维度 | BuildAssetBundles（第 1 代） | SBP（第 2 代底层） |
|------|---------------------------|-------------------|
| 增量构建 | 粗糙，经常过度重打 | 精确，基于内容 Hash 的增量判断 |
| 可定制性 | 黑盒（源码不开放），不可定制的固定流程 | 可插入自定义 BuildTask（源码开放） |
| 迁移成本 | — | 极低，兼容模式几乎零改动 |
| 与 Addressables 的关系 | Addressables 可选用它 | Addressables 推荐搭配使用 |
| 运行时影响 | — | 无影响，打出来的仍是 .bundle |

SBP 解决的是「怎么让打包更快、更智能」的问题。而「资源怎么管理、怎么加载、怎么热更新」这个层面的问题，它不负责——那是 **Addressables** 的主场。

---

下一篇，我们来聊聊 Addressables——它是 Unity 目前推荐的资源管理方案。在第 1 代 AssetBundle + SBP 的基础上，它又解决了一层什么问题？为什么它的改动比 SBP 大得多？

每天前进一小步，就是一个新的高度！
