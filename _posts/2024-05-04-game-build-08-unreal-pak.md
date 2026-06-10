---
title: 游戏构建：Unreal 构建（三）：Pak 文件——Unreal 的资源包裹方式
author: 唐明
categories: [build]
tags: [游戏开发, Unreal, 游戏引擎, 构建工具, Pak, Game Build]
---


## 1、Cook 完了，然后呢？

上一篇文章我们讲完了 Cook——Unreal 把编辑器里的「生资源」烹饪成了目标平台可用的「成品」。

Cook 完成后，你的项目目录下会多出大量的 Cooked 文件。贴图变成了 `.utexture2D`，模型变成了 `.uasset` 和 `.uexp`，Shader 变成了 `.ushaderbytecode`。这些都是平台原生的资源格式了。

但问题是：如果一个游戏有几千上万个 Cook 后的文件，你怎么给玩家？

一个一个下发？OS 文件系统上一个一个读？那读盘速度会让你想砸电脑。

解决方案是**打包**——把大量小文件合成一个大文件，减少 IO 操作、方便传输、还能加密。

Unreal 的打包格式叫 **Pak**。

<!--以上为摘要内容-->

## 2、Pak 是什么？

Pak 的全称就是 **Package**（包）。它本质上是一个**归档文件**——类似于 `.zip` 或 `.tar`，但比它们更适合游戏场景：

- **随机访问**：不需要解压整个 pak，可以直接定位到某个文件读出
- **内建压缩**：可选对单个文件或整个 pak 做压缩
- **挂载机制**：运行时像「挂载硬盘」一样挂载 Pak，引擎像读本地文件一样透明地读取 Pak 里的内容
- **加密与签名**：支持 AES 加密和数字签名，防资源被提取篡改

一个 Pak 文件的内部结构大致是这样的：

```
[ Pak Header ]
    - Pak 版本号
    - 文件索引偏移
    - 挂载点路径

[ File Index ]
    - 文件名 → 数据偏移 + 大小
    - 是否压缩
    - 哈希值

[ File Data ]
    - resource1.uasset
    - resource2.utexture2D
    - resource3.ushaderbytecode
    - ...
```

引擎读一个 Pak 文件时，先读 Header，拿到文件索引的位置。然后根据索引找到目标文件的数据偏移，直接 seek 过去读。整个过程是一次硬盘 IO seek + 一次连续读取。对于现代 NVMe SSD 来说，几乎不构成性能瓶颈。

## 3、IO Store：第四代存档格式

如果你用的是 UE5，可能会在文档中看到一个叫 **IO Store** 的东西。它是 Unreal 的**第四代**资源归档系统。

简单说一下 Unreal 的资源归档格式演进：

| 代数 | 名称 | 年代 | 特点 |
|------|------|------|------|
| 第一代 | 直接文件访问 | UE1 ~ UE2 | 不打包，直接读文件系统文件 |
| 第二代 | `.upk` 文件 | UE3 | 打包了，但只读不写，不支持部分加载 |
| 第三代 | Legacy Pak | UE4 | 支持挂载、压缩、加密、热更新 |
| 第四代 | IO Store | UE5 | 为高速 NVMe SSD 优化，支持直接映射 |

IO Store 和 Legacy Pak 最大的区别在于：Legacy Pak 对每个文件的访问都需要一次 IO seek，在机械硬盘时代这不是大问题，但在 NVMe SSD 上，「seek」这个动作本身已经快到了可以被优化的地步——IO Store 直接使用连续的大块存储，把文件索引和文件数据更好地组织在一起，充分利用 SSD 的带宽。

但概念上，IO Store 做的事情和 Pak 是一样的：**把大量小文件合成大文件，在游戏里透明地访问它们。**

## 4、Chunk 与补丁系统

大型游戏的安装包不会是一个十几 GB 的单一 Pak 文件——那样每次更新都要重新下载整个包。

Unreal 支持把资源分成多个 Chunk。Chunk 就是一个逻辑分组，每个 Chunk 对应一个或多个 Pak 文件。

常见的 Chunk 划分：

- **Chunk 0**：核心启动包，包含了游戏启动必需的所有资源。一般尽量做小，让用户下载完就能进游戏
- **Chunk 1+**：内容包，按功能或者地图分。用户玩到某个关卡时再下载对应的 Chunk

补丁（Patch）也是基于 Chunk 做的：你改了几个资源，重新 Cook + Pak 这些 Chunk，然后下发新的 Chunk Pak 文件替换老版本。玩家只下载变了的那几个 Chunk，不用重新下载整个游戏。

这个机制和 Unity Addressables 的「Catalog Diff + 按 Bundle 下载更新」本质上是同一个思想，只是 Unreal 在工程化和配置管理上做得更系统。

## 5、Pak 加密与签名

游戏资源的防盗是一个老话题了。

Pak 支持在构建时通过配置启用 **AES 加密**。加密后的 Pak 文件，没有密钥的人即使提取出来也无法直接读取里面的资源。

密钥通常配置在项目配置文件（`DefaultGame.ini`）的 `[Crypto]` 节下：

```ini
[Crypto]
EncryptionKey=你的AES密钥
bEncryptPakIniFiles=True
bEncryptPakIndex=True
```

同时可以启用 Pak 文件签名，防止资源被篡改。

当然，这些手段只是**提高门槛**，不是绝对安全。密钥存客户端总有一天会被逆向出来。但对于大多数项目来说，能把大部分想解包的玩家拦住就够了。

## 6、和 Unity AssetBundle 的对比

| 维度 | Unity AssetBundle | Unreal Pak |
|------|------------------|------------|
| 文件格式 | `.bundle`（Unity 自定义二进制格式） | `.pak` (Legacy) 或 `.utoc/.ucas` (IO Store) |
| 加载方式 | 代码手动加载 Bundle，手动加载 Asset | 引擎自动挂载 Pak，透明文件访问 |
| 依赖管理 | 开发者手动解析 Manifest 管理 | 引擎内部自动处理 |
| 加密支持 | 需要第三方方案或自定义加密 | 内建 AES 加密 + 签名 |
| Chunk/分包 | 通过 Addressables 的 Group 间接支持 | 原生 Chunk 支持 |

最大的区别在于「对开发者暴露了多少复杂度」。

AssetBundle 把底层细节大量暴露给了你——你要自己写加载代码、自己管依赖、自己考虑加密。Addressables 封装了一部分，但核心逻辑依然在你的掌控范围内。Pak 则相反，引擎帮你处理了大部分细节——你配置好 Chunk 划分，引擎自动处理加载、依赖、内存管理。

这两个设计哲学的差异，和前几篇文章里说的 Unity vs Unreal 的整体风格一脉相承。

## 7、小结

Pak 文件是 Unreal 资源构建的最后一环。Cook 把资源变成原生格式，Pak 把这些文件打包成便于传输和加载的大文件。

对于热更新，Unreal 的思路是 Chunk + Patch：Cook 出新资源 → Pak 打成新的 Chunk → 下发替换旧 Chunk。

这套流程配合 UAT 的命令行自动化，能让一个完整的「改资源 → 出包 → 发更新」流水线在 CI 上全自动跑完。

---

下一篇，我们来聊聊让所有 Unreal 开发者都头疼的终极问题——**Shader 编译**。为什么每次更新玩家都要等二十分钟？DDC 和 PSO Cache 是怎么回事？能不能在构建阶段就搞定？

每天前进一小步，就是一个新的高度！
