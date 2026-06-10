---
title: 游戏构建：Unity 构建（四）：Addressables——一个改动大得多的"正确答案"
author: 唐明
categories: [build]
tags: [游戏开发, Unity, 游戏引擎, 构建工具, Addressables, AssetBundle, SBP, Game Build]
---


## 1、从 SBP 到 Addressables：两种不同的升级路径

前两篇文章，我们聊了 AssetBundle 的底层接口演进：第 0 代（手工收集+不处理依赖）→ 第 1 代（标记包名 或 AssetBundleBuild[] 代码定义分包，自动依赖）→ SBP（精确增量构建，源码开放）。

SBP 是一条**改动最小**的升级路径——你只要换了底层打包接口，增量缓存立马生效。但 SBP 不管资源「怎么管理、怎么加载」。

这时候，如果你问：「能不能连资源加载也一起简化？」答案就是 **Addressables**。

不过必须提前说清楚——Addressables 和 SBP 不同。SBP 是「换个打包引擎，其他一切照旧」。Addressables 是「重新定义你怎么引用资源、怎么加载资源、怎么更新资源」——**这是一个改动大得多的升级。**

<!--以上为摘要内容-->

## 2、Addressables 解决了哪些 SBP 没解决的问题？

SBP 解决了「打包慢」，但没解决以下问题：

- **加载代码冗长**：每次加载资源都要写 `AssetBundle.LoadFromFile` + `LoadAsset`，样板代码一堆
- **依赖顺序**：你得自己解析 Manifest，确保加载 Bundle A 之前把 Bundle B（A 的依赖）先加载好
- **资源定位**：你得知道 Boss 这个资源在 `characters.bundle` 里，而 `characters.bundle` 又在 `StreamingAssets/Bundles/characters` 路径下
- **热更新流程**：你得一整套逻辑来下载新 Bundle、替换旧 Bundle、清理缓存、版本管理

这些都不是 SBP 的职责范围——SBP 只负责让打包更快。

**Addressables 要解决的，是这整个「运行时资源管理」层面的问题。**

## 3、Addressables 的核心思想：用"地址"代替"路径"

Addressables 里，加载资源变成了这样：

```csharp
// 你不需要知道资源在哪个 Bundle、哪个路径
GameObject boss = await Addressables.LoadAssetAsync<GameObject>("Boss").Task;
```

对比 AssetBundle 时代的加载方式：

```csharp
// 你得知道路径、知道 Bundle 名字、手动加载 Bundle 再加载 Asset
AssetBundle bundle = AssetBundle.LoadFromFile(
    Path.Combine(Application.streamingAssetsPath, "characters"));
GameObject boss = bundle.LoadAsset<GameObject>("Boss");
```

「地址」本质上就是一个字符串 key。它可以是资源名称、文件路径、自定义标签……Addressables 在内部维护了一张映射表（Catalog），帮你从「地址」查到「这个资源在哪个 Bundle、这个 Bundle 在 CDN 的哪个路径」。

你说「我要 Boss」，Addressables 去搞定一切——加载 Bundle、处理依赖、返回资源。你不用关心它在哪个包、依赖了什么。

## 4、Addressables 的分组与构建

Addressables 里，资源不是直接绑定到 AssetBundle，而是先放在一个叫「Group」的逻辑分组里。一个 Group 最终会生成一个或多个 AssetBundle。

Group 比 AssetBundle 的原始名称好用得多，因为你在 Group 层面就能配置：

- **打包策略**：Group 内的资源是打成一个包？还是各打各的？
- **更新策略**：这个 Group 能不能热更新？CDN 地址是啥？
- **加载策略**：随安装包下发？还是远程按需下载？

常见分组：

- **Remote Group**：放需要热更新的资源（角色模型、UI 贴图、音频），远程包放 CDN
- **Local Group**：放不需要更新但必须随包走的资源（基础 Shader、核心框架预制体）

并且，Addressables 的分组配置存在独立的 `.asset` 配置文件里，**不写 `.meta`**。这解决了第 1 代 AssetBundle 「meta 文件到处冲突」的协作痛点。

## 5、Addressables 底层：AssetBundle + SBP

不管 Addressables 的表面多么光鲜，**底层依然是 AssetBundle**。

它的工作方式：

1. 你把资源拖进 Addressables Group
2. 构建时，Addressables 根据 Group 配置生成打包计划
3. 调用打包接口生成 `.bundle` 文件——这里可以用 `BuildAssetBundles`，也可以配成用 **SBP**
4. 生成 Catalog 文件（资源地址 → Bundle 位置 → CDN 路径的映射表）
5. 运行时，`LoadAssetAsync("Boss")` → 查 Catalog → 找到 Bundle → 加载 Bundle → 返回资源

所以 Addressables 和 SBP 的关系是：**Addressables 管「什么资源怎么管理」，SBP 管「怎么高效地把这些资源打成 Bundle」**。两者互补，可以叠加使用。

## 6、Addressables 为什么改动大？

回到开篇的观点——Addressables 比 SBP 改动大得多，因为：

**它改变了你引用资源的方式。**

在传统 AssetBundle 体系里，游戏代码里引用一个资源，用的是直接引用（prefab 引用贴图，scene 引用 prefab）。Unity 在构建时通过分析这些直接引用，决定资源归属。

但在 Addressables 里，资源引用变成了「地址字符串」。GetComponent 变成了 LoadAssetAsync("key")。这意味着：
- 你所有加载资源的代码都要改
- 加载变成了异步操作——原来同步拿到的数据现在要等回调
- 资源生命周期管理（什么时候 Load、什么时候 Release）需要重新梳理

**它改变了热更新的流程。**

传统方式下，热更新是你自己设计的——版本号怎么管理、哪些 Bundle 要更新、下载失败怎么回退……每个人的设计都不一样。

Addressables 提供了一套标准化的热更新流程：Catalog 版本比对 → Diff 计算变化 Bundle → 下载 → 缓存。但这套流程是 opinionated 的——你得按它的方式来。如果你的老项目已经有一套成熟的热更新方案，迁移成本不低。

**它改变了资源分组的思维。**

传统方式里，你关心的是「这些资源打成几个包、每个包叫什么」。Addressables 里，你关心的是「哪些资源属于同一个 Group、这个 Group 在哪个 CDN 上」。管理的粒度从「包」变成了「组和地址」，对项目结构的理解方式都变了。

## 7、新的三代演进总结

加上 SBP 之后，Unity 资源打包体系的演进全景更新如下：

| 阶段 | 方式 | 核心特点 |
|------|------|----------|
| 第 0 代 | `BuildAssetBundle`（无 s） | 手动收集资源，不处理依赖，已废弃 |
| 第 1 代 | 标记包名 / `AssetBundleBuild[]` + `BuildAssetBundles`（有 s） | 自动追踪依赖（标记模式），纯代码不分 .meta（代码模式），至今主流 |
| 第 2 代底层 | SBP | 精确增量构建，缓存大幅提升，迁移成本极低 |
| 第 2 代上层 | Addressables | 地址化加载，标准化热更新，但改动大 |

SBP 和 Addressables 同属第 2 代，但一个走底层、一个走上层，解决的是不同的问题。**SBP 让打包变快，Addressables 让加载变简单。两个一起用，才是 Unity 推荐的最终状态。**

---

下一篇，我们聊一个更底层的话题——IL2CPP。为什么 Unity 要把 C# 代码转成 C++ 再编译？Mono 和 IL2CPP 到底有什么区别？跨平台中会遇到哪些坑？

每天前进一小步，就是一个新的高度！
