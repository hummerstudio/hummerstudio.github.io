---
title: 游戏构建：Unity 构建（一）：点下 Build 按钮后，Unity 替你做了多少事？
author: 唐明
categories: [build]
tags: [游戏开发, Unity, 游戏引擎, 构建工具, Build Pipeline, Game Build]
---


## 1、一个按钮引发的困惑

刚接触 Unity 构建的时候，我的心态是这样的：

之前用 Java 做了十年开发，构建就是 `mvn clean package` 或者 `./gradlew build`。我知道编译器在干什么——`.java` 编译成 `.class`，打包成 `.jar`，完事。

打开 Unity，看到 `File → Build Settings`，里面有一个大大的 **「Build」按钮**。我心想，这不就是 Unity 版的 `gradle build` 吗？点一下就好。

然后我就点了。

然后我就等了二十分钟。

然后我问旁边同事：「这二十分钟 Unity 在干什么？」

同事挠了挠头：「不知道啊，反正在构建。」

这个答案显然不能让我满意。于是我开始挖 Unity 的构建流程——从点下 Build 按钮到生成 APK/EXE，到底发生了多少步？每一阶段 Unity 在做什么？为什么这么慢？

这篇文章，就是我的「挖坑」笔记。

<!--以上为摘要内容-->

## 2、Unity 构建流程全景图

先给一张全景图。当你点下 Build 按钮，Unity 大致经历以下阶段：

```
① 验证 Build Settings 配置
    ↓
② 编译 C# 脚本（Script Compilation）
    ↓
③ 资源导入与处理（Asset Import & Processing）
    ↓
④ 场景构建（Scene Building）
    ↓
⑤ 资源打包（Asset Bundling / Resource Inclusion）
    ↓
⑥ 引擎代码链接（Engine & IL2CPP Compilation）
    ↓
⑦ 平台特定打包（Platform Packaging）
    ↓
⑧ 输出最终产物（APK / EXE / Xcode Project / ...）
```

看起来好像不多，八步而已。但每一步的背后，都是一个不小的世界。我们来逐个拆解。

## 3、第一步：验证 Build Settings

这一步最快，通常几秒钟。Unity 做的事：

- 检查你选的 Scenes 是否都存在（Build Settings → Scenes In Build 里的那些）
- 检查目标平台是否支持你当前用的功能（比如 WebGL 不支持多线程）
- 检查 Player Settings 里有没有明显的配置冲突

如果这里报错，算你运气好——总比等了四十分钟再报错强。

## 4、第二步：编译 C# 脚本

就是把你写的所有 `.cs` 文件编译成中间语言（IL，Intermediate Language）。

和 Java 不同的是，Unity 的脚本编译**不是在 IDE 里做的**，而是在 Unity 编辑器内部完成的。Unity 使用 Roslyn（微软的 C# 编译器）把你的脚本编译成 `.dll` 程序集。

这里有一个容易被忽略的点：Unity 的脚本编译是**分阶段**的。它按照 Assembly Definition（`.asmdef`）的划分，把脚本分成不同的程序集，然后按依赖顺序编译。如果你没手动分 Assembly Definition，Unity 就会按默认规则自动分——大致是：

- 第一阶段：`Assembly-CSharp-firstpass`（Plugins 或 Standard Assets 里的脚本）
- 第二阶段：`Assembly-CSharp`（其他所有脚本）
- 第三阶段：`Assembly-CSharp-Editor`（Editor 目录下的脚本）

这就是为什么「脚本编译」的时间和你项目里的 C# 代码量直接相关。一个几万行 C# 的大型项目，光编译脚本就可能要几分钟。

## 5、第三步：资源导入与处理

这一步，是游戏构建和传统软件构建最大的分水岭。

在 Java 世界，你的「资源」可能就是一些 `.properties` 或 `.yaml` 配置文件，构建时基本不管它们，打包时塞进去就行。

在 Unity 里，「资源」是模型（`.fbx`、`.obj`）、贴图（`.png`、`.psd`、`.tga`）、音频（`.wav`、`.mp3`）、材质、动画、预制体……数量动辄成千上万。

Unity 在这一步要做的事：

- **模型导入**：把 `.fbx` 转成引擎能用的 Mesh 数据，计算法线、切线、包围盒
- **贴图处理**：根据平台设置做纹理压缩、生成 Mipmap、调整尺寸上限
- **音频处理**：转码为目标平台的音频格式，设置压缩质量
- **材质编译**：把材质参数编译成目标平台能跑的 Shader 参数块
- **资源引用解析**：检查每个资源的 GUID 和引用关系

注意，这些操作**都受你的平台选择影响**。比如你选 Android，贴图会压成 ASTC；选 PC，贴图可能压成 DXT/BC7。这意味着同一批资源，切不同平台要**重新处理一遍**。

这也是为什么「切平台构建」非常耗时的重要原因之一。

## 6、第四步：场景构建

场景（Scene）是 Unity 里组织游戏世界的基本单元。一个场景里可能有几百个 GameObject，每个 GameObject 上挂了一堆 Component。

构建场景时，Unity 要做的事：

- 序列化场景里所有的 GameObject 和 Component 数据
- 解析跨场景的引用
- 剥离 Editor-Only 的数据（比如 Editor 脚本里标记的临时数据）
- 生成场景的序列化文件

这一步通常和资源处理并行或交错进行。如果场景里引用了贴图、模型等资源，Unity 会触发这些资源的导入处理。

## 7、第五步：资源打包

这是 Unity 构建里**最需要开发者介入**的步骤。

Unity 提供了 `BuildPipeline.BuildAssetBundles()` 这个底层接口。但**哪些资源打哪个包、怎么分组、依赖怎么处理**——这些逻辑全要你自己写 C# 脚本。

如果你没有配置 AssetBundle 或 Addressables，Unity 就会把所有用到的资源全部打进最终包里。小项目还好，大项目的话，一个包可能几十个 G，热更新更是无从谈起。

关于 AssetBundle 和 Addressables 的演进故事，我们后面两篇会专门讲。这里只需要知道：**资源打包是整个构建流程中最需要开发者动脑子的环节**，也是最容易出错的环节。

## 8、第六步：引擎代码链接

如果是 Mono 后端（比较老的 Unity 版本或 PC 平台），这一步就是打包 Mono 运行时和你的 C# 中间代码（IL）。

但如果是 IL2CPP 后端（iOS 和大多数现代项目），情况就复杂了：

1. Unity 把你编译好的 C# IL 代码**翻译成 C++ 代码**
2. 然后用平台的 C++ 编译器（Xcode 的 clang 或 Android NDK 的 clang）把生成的 C++ 编译成原生机器码

这也是 IL2CPP 构建**特别慢**的核心原因——你不仅要编译 C#，还要生成几万行 C++，然后编译这几万行 C++。关于 IL2CPP 的更多细节，我们第四篇会深入。

## 9、第七步：平台特定打包

到了这一步，Unity 已经把代码和资源都整理好了，就差「打包装箱」了。

不同平台的包装方式不同：

- **Windows**：生成一个 `游戏名_Data` 文件夹 + 一个 `.exe` 启动器
- **macOS**：生成一个 `.app` Bundle
- **Android**：打包成 APK 或 AAB（需要 Android SDK + JDK）
- **iOS**：生成一个 Xcode Project，你在 Mac 上再用 Xcode 编译一遍才能出 IPA

对于 Android，最终一步 Unity 内部会调 `gradle` 来打 APK/AAB——这也是你唯一能在这整个流程里找到和「传统构建」沾边的地方。

## 10、第八步（其实没有）：你的工作才开始

Unity 输出了构建产物，但工作远没有结束。

- APK 出了，要测能不能装
- iOS Xcode Project 出了，要上 Mac 用 Xcode 编译
- 资源包出了，要验证引用完整性
- 热更新包里有没有漏的资源？线上版本能不能加载？

Unity 构建产出了「一个包」，但把它变成「一个能上线的包」，还有一大堆事要做。

这也是为什么大型游戏的 CI/CD 流程通常不是「点个按钮，等二十分钟」这么简单——要写脚本包一层层的检查和质量门。

## 11、小结

回到最初的困惑：「点下 Build 按钮后，Unity 到底在干什么？」

答案远比我想象的复杂：编译脚本 → 处理资源 → 构建场景 → 打包资源 → 编译引擎代码 → 平台打包。

和 `gradle build` 的本质区别在于：**游戏构建不是只处理代码，而是同时处理「代码 + 海量资源」**。资源的规模和处理复杂度，是传统软件构建中几乎不存在的维度。

而 Unity 给开发者的，是最底层的 `BuildPipeline` 接口——「你想怎么处理资源？自己写脚本」。上层的自动化、分包策略、CI 集成，全都得你自己扛。

---

下一篇，我们聊聊 Unity 资源打包的接口演进史——从第 0 代 `BuildAssetBundle`（不带 s）的手工打包，到第 1 代标记包名 + `BuildAssetBundles`（带 s）的自动依赖追踪，Unity 在打包这件事上走了哪些弯路？

每天前进一小步，就是一个新的高度！
