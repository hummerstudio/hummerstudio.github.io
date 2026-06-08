---
title: SVN 回退与撤销——出错了怎么办
author: 唐明
categories: [vcs]
tags: [SVN, 回退, 撤销]
---
* TOC
{:toc}

## 1、区分几种"回退"场景

在使用 SVN 时，"回退"可能指不同的事情：

| 场景 | 说明 |
|------|------|
| 撤销本地未提交的修改 | 文件改错了，想回到修改前的状态 |
| 撤销某次已提交的修改 | 某次提交引入了 bug，要撤掉 |
| 回滚整个版本 | 整个仓库回退到某个历史版本 |

这三种场景的处理方式完全不同，下面逐一说明。

## 2、撤销本地未提交的修改

### 撤销单个文件

```bash
svn revert src/main.cpp
```

文件恢复到上次 `svn update` 或 `svn commit` 时的状态。**注意：不可恢复。**

### 撤销整个目录

```bash
svn revert -R .
```

递归撤销当前目录下所有文件的修改。

### 撤销已添加但未提交的新文件

```bash
svn revert new-file.txt
```

`svn add` 后未提交的文件，用 `svn revert` 可以取消添加。

### 查看即将撤销的内容

撤销前最好确认一下：

```bash
svn diff src/main.cpp
svn status
```

## 3、撤销某次已提交的修改（反向合并）

已经提交到仓库的修改，不能直接删除，而是通过"反向合并"来撤销。

### 找到要撤销的版本号

```bash
svn log -l 10
```

假设要撤销版本号 `r1234` 的修改：

```bash
svn merge -c -1234 .
```

`-c -1234` 表示反向应用版本 1234 的修改。这个操作会在本地工作副本中产生"反向修改"。

### 确认并提交

```bash
svn diff     # 检查撤销的内容是否正确
svn commit -m "撤销 r1234 的修改，原因是引入了登录 bug"
```

### 撤销多个版本

撤销 r1234、r1235、r1236 三个连续的版本：

```bash
svn merge -r 1236:1233 .
```

意思是：将版本 1236 到 1233 之间的修改反向应用（从高版本到低版本 = 反向）。

## 4、回滚整个仓库到历史版本

如果某段时间的修改全部有问题，需要让仓库回到之前的状态：

```bash
# 假设要回到 r1000 的状态
svn merge -r HEAD:1000 .
svn commit -m "回滚仓库到 r1000 版本"
```

这个操作会反向应用 r1000 之后的所有修改。

## 5、撤销 merge 操作

### 撤销还未提交的 merge

```bash
svn revert -R .
```

### 撤销已提交的 merge

```bash
# 查看 merge 的提交记录
svn log --stop-on-copy

# 假设 merge 提交是 r2000
svn merge -c -2000 .
svn commit -m "撤销 r2000 的合并操作"
```

### 查看哪些版本已被合并

```bash
svn mergeinfo ^/branches/feature-a --show-revs merged
```

## 6、实用技巧

### 使用 TortoiseSVN 图形界面

TortoiseSVN 的"显示日志"对话框提供了直观的版本回退功能：
- 右键点击要撤销的版本 → "Revert changes from this revision"
- 可以同时选择多个版本进行批量撤销

### 回退前先做备份

```bash
# 创建当前状态的补丁
svn diff > backup.patch

# 或直接创建分支作为备份
svn copy ^/trunk ^/branches/backup-before-revert -m "回退前的备份"
```

### 查看某次提交改了什么

```bash
svn diff -c r1234
```

在反向合并之前，先看清楚那次提交到底改了哪些文件。

## 7、常见错误处理

### 误撤销了本地修改

如果你用 `svn revert` 误撤销了还没备份的修改，很遗憾，SVN 本地撤销不可恢复。这再次说明：
- **提交前多检查**：`svn diff` 和 `svn status`
- **频繁提交**：不要攒太多修改

### revert 后还有修改？

`svn revert` 只撤销文件内容修改，不会删除未被版本控制的新文件。这些文件用 `svn status` 显示为 `?`，需要手动删除或加入 `.svnignore`。

```bash
# 查看未被版本控制的文件
svn status | grep "^?"

# 手动清理
rm unversioned-file.txt
```

## 8、快速参考

| 操作 | 命令 |
|------|------|
| 撤销未提交的修改 | `svn revert file` |
| 递归撤销目录 | `svn revert -R .` |
| 撤销单个版本 | `svn merge -c -REV .` |
| 撤销连续版本 | `svn merge -r HIGH:LOW .` |
| 回滚到指定版本 | `svn merge -r HEAD:REV .` |
| 查看修改内容 | `svn diff -c REV` |
| 查看提交日志 | `svn log -l 20` |
| 查看 merge 信息 | `svn mergeinfo ^/branches/BRANCH` |

记住核心原则：**已提交的修改不能删除，只能反向合并。** 这是 SVN 和 Git 的一个重要区别。

每天前进一小步，就是一个新的高度！
