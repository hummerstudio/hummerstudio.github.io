---
title: Git Rebase——让你的提交历史更优雅
author: 唐明
categories: [vcs]
tags: [Git, Git Rebase]
---

## 1、Rebase vs Merge

在 Git 中，整合两个分支的修改有两种方式：`merge` 和 `rebase`。

**Merge** 会创建一个新的"合并提交"，保留完整的分支历史：

```
      A---B---C  feature
     /         \
D---E---F---G---H  main
```

**Rebase** 则是将 feature 分支的提交"移植"到 main 分支的最新提交之后，形成一条线性历史：

```
D---E---F---A'---B'---C'  feature
```

两者的最终代码结果一样，但历史记录截然不同。Rebase 让提交历史更加清晰、线性，这也是很多开源项目要求贡献者使用 rebase 的原因。

## 2、基本用法

### 将当前分支变基到目标分支

```bash
git checkout feature
git rebase main
```

这会把 feature 分支上的所有提交，逐个"重放"到 main 分支的最新提交之后。

如果一切顺利，你会看到一条干净的线性历史。

### 交互式 rebase（最常用）

```bash
git rebase -i HEAD~3
```

这表示要对最近 3 个提交进行交互式操作。执行后会打开编辑器，显示类似：

```
pick a1b2c3d 添加登录功能
pick e4f5g6h 修复登录 bug
pick i7j8k9l 优化登录页面样式
```

你可以修改每个提交前的命令：

| 命令 | 作用 |
|------|------|
| `pick` | 保留该提交（默认） |
| `reword` | 保留提交，但修改提交信息 |
| `edit` | 保留提交，但停下来让你修改内容 |
| `squash` | 合并到上一个提交，保留两个提交信息 |
| `fixup` | 合并到上一个提交，丢弃本提交信息 |
| `drop` | 删除该提交 |

### 合并多个提交

```
pick a1b2c3d 添加登录功能
squash e4f5g6h 修复登录 bug
squash i7j8k9l 优化登录页面样式
```

保存后，这三个提交会合并成一个提交，提交信息可以重新编辑。这在功能开发完成后整理提交历史时非常有用——把一系列"修复拼写错误""调整格式"等琐碎提交合并成一个有意义的提交。

## 3、解决冲突

Rebase 过程中如果出现冲突，Git 会暂停并提示你解决：

```bash
# 解决冲突后
git add .
git rebase --continue

# 如果想跳过这个提交
git rebase --skip

# 如果想放弃整个 rebase
git rebase --abort
```

**重要提示**：rebase 过程中每个提交是逐个应用的，如果有 10 个提交，可能需要解决 10 次冲突。这时可以考虑先用 `squash` 合并提交再 rebase，减少冲突次数。

## 4、黄金法则与安全实践

> **永远不要对已经推送到公共仓库的提交执行 rebase！**

Rebase 会改写提交历史（生成新的 commit hash）。如果你 rebase 了已推送的提交并强制推送，其他协作者基于旧提交的工作就会产生混乱。

**安全的使用场景：**
- 在自己的 feature 分支上整理提交，然后再推送
- 在合并到 main 之前，rebase main 到 feature 分支
- 使用 `git pull --rebase` 代替 `git pull`，保持线性历史

### git pull --rebase

```bash
git pull --rebase
```

等同于：

```bash
git fetch origin
git rebase origin/main
```

这样拉取远程代码时不会产生多余的 merge commit，保持历史整洁。

可以设为默认行为：

```bash
git config --global pull.rebase true
```

## 5、实用技巧

### 撤销 rebase

如果你对 rebase 结果不满意，可以使用 `git reflog` 找回 rebase 前的状态：

```bash
git reflog
# 找到 rebase 之前的 HEAD
git reset --hard HEAD@{n}
```

### 只 rebase 到某个特定提交

```bash
git rebase --onto main feature~3 feature
```

这表示：取 feature 分支上最近 3 个提交之外的所有提交，将它们 rebase 到 main 分支上。适用于需要把分支的一部分提交迁移到另一个分支的场景。

## 6、总结

| 场景 | 推荐方式 |
|------|----------|
| 合并公共分支到特性分支 | `git rebase main` |
| 合并特性分支到公共分支 | `git merge feature` |
| 整理本地未推送的提交 | `git rebase -i` |
| 拉取远程更新 | `git pull --rebase` |

Rebase 是一个强大的工具，但需要谨慎使用。核心原则：**只 rebase 你自己的、未推送的提交**。

每天前进一小步，就是一个新的高度！
