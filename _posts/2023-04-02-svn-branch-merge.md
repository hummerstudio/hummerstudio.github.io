---
title: SVN 分支与合并——主干开发的正确姿势
author: 唐明
categories: [code]
tags: [SVN, 分支, 合并]
---

## 1、SVN 分支的本质

SVN 的分支和 Git 的分支有本质区别。在 SVN 中，分支本质上就是仓库中的一个目录副本。当你创建一个分支时，SVN 只是将主干（trunk）的目录结构复制一份到 `branches/` 目录下。

标准的 SVN 仓库结构：

```
project/
├── trunk/        # 主干，稳定版本
├── branches/     # 分支目录
│   ├── feature-a/
│   └── release-1.0/
└── tags/         # 标签，只读快照
    └── v1.0.0/
```

## 2、创建分支

```bash
svn copy https://svn.example.com/project/trunk \
         https://svn.example.com/project/branches/feature-login \
         -m "创建登录功能分支"
```

注意：`svn copy` 在服务端执行，不会在本地复制文件。创建分支是瞬间完成的，因为它只创建了一个指向 trunk 的"软链接"（copy-on-write 机制）。

也可以在本地工作副本中创建：

```bash
svn copy trunk branches/feature-login
svn commit -m "创建登录功能分支"
```

## 3、切换分支

```bash
svn switch https://svn.example.com/project/branches/feature-login
```

`svn switch` 只会更新有差异的文件，比重新 checkout 快得多。

查看当前工作在哪个分支：

```bash
svn info | grep "^URL:"
```

## 4、合并分支

### 将主干更新合并到分支（保持同步）

在 feature 分支上工作时，主干可能已有新的提交。定期将主干的修改合并到分支，避免后期合并冲突过大：

```bash
# 确保在分支目录下
svn merge ^/trunk
svn commit -m "同步主干最新修改到登录功能分支"
```

`^/` 是仓库根目录的简写。

### 将分支合并回主干（功能完成）

```bash
# 切换到主干
svn switch ^/trunk

# 合并分支
svn merge ^/branches/feature-login

# 检查无误后提交
svn commit -m "合并登录功能分支到主干"
```

### 查看合并信息

```bash
# 查看分支上尚未合并到主干的修改
svn mergeinfo ^/branches/feature-login --show-revs eligible

# 查看已合并的修改
svn mergeinfo ^/branches/feature-login --show-revs merged
```

## 5、常见分支策略

### 功能分支（Feature Branch）

```
trunk ──→ 创建 feature-a 分支 ──→ 开发 ──→ 合并回 trunk
```

适用于独立功能开发，不会影响主干稳定性。

### 发布分支（Release Branch）

```
trunk ──→ 创建 release-1.0 分支 ──→ 测试、修 bug ──→ 合并回 trunk + 打 tag
```

当功能开发完成、准备发布时，从主干创建发布分支。在发布分支上只做 bug 修复，不做新功能。修复的 bug 要同时合并回主干。

### 热修复分支（Hotfix）

```
tag v1.0.0 ──→ 创建 hotfix-xxx 分支 ──→ 修复 ──→ 合并回主干 + 合并到发布分支
```

用于紧急修复线上问题，修复完成后要同时合并到主干和当前发布分支。

## 6、合并冲突处理

当两个分支修改了同一个文件的同一行时，合并会产生冲突。SVN 会生成冲突标记文件：

```
file.txt
file.txt.mine       # 你的版本
file.txt.rOLD       # 合并前的基础版本
file.txt.rNEW       # 对方的版本
```

解决方法：

```bash
# 使用你的版本
svn resolve --accept mine-full file.txt

# 使用对方的版本
svn resolve --accept theirs-full file.txt

# 手动解决后标记为已解决
svn resolve --accept working file.txt
```

推荐使用图形化合并工具：

```bash
svn merge ^/trunk --accept postpone
# 手动解决冲突后
svn resolve --accept working file.txt
svn commit -m "解决合并冲突"
```

## 7、SVN vs Git 分支对比

| 特性 | SVN | Git |
|------|-----|-----|
| 分支本质 | 目录副本 | 指针 |
| 创建速度 | 快（copy-on-write） | 极快 |
| 分支切换 | `svn switch` | `git checkout` / `git switch` |
| 合并方式 | 基于版本号范围 | 基于提交图 |
| 离线操作 | 不支持 | 完全支持 |
| 学习曲线 | 较简单 | 较陡 |

## 8、总结

SVN 的分支合并虽然不如 Git 灵活，但对于习惯了集中式版本控制的团队来说，理解和操作都更直观。关键原则：

- 分支开发完成后尽快合并，避免长时间分离导致大量冲突
- 定期从主干同步更新到分支
- 合并前先用 `svn mergeinfo` 确认差异范围

每天前进一小步，就是一个新的高度！
