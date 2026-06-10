---
title: SVN 冲突解决详解——告别合并恐惧症
author: 唐明
categories: [vcs]
tags: [SVN, 冲突, 合并]
---

## 1、什么时候会产生冲突

SVN 冲突发生在以下场景：

- **更新时冲突**：你修改了文件，同事也修改了同一文件的同一行并先提交了，你执行 `svn update` 时产生冲突。
- **合并时冲突**：将分支合并回主干，两个分支修改了同一文件的同一区域。
- **切换时冲突**：`svn switch` 到另一个分支时，本地修改与目标分支内容冲突。

## 2、识别冲突

发生冲突时，SVN 会生成以下文件：

```
file.txt           # 带冲突标记的原始文件
file.txt.mine      # 你的本地版本
file.txt.rOLD      # 冲突前的基础版本（BASE）
file.txt.rNEW      # 服务器/对方的新版本
```

`svn status` 会显示 `C`（Conflicted）：

```
C       src/main.cpp
?       src/main.cpp.mine
?       src/main.cpp.rOLD
?       src/main.cpp.rNEW
```

冲突标记在文件中是这样的：

```
<<<<<<< .mine
你的修改内容
=======
别人的修改内容
>>>>>>> .rNEW
```

## 3、解决冲突的方式

SVN 提供 `svn resolve` 命令，有多种接受策略：

### 使用你的版本（mine-full）

```bash
svn resolve --accept mine-full src/main.cpp
```

完全保留你的修改，丢弃别人的修改。**慎用**——可能导致同事的修改丢失。

### 使用对方的版本（theirs-full）

```bash
svn resolve --accept theirs-full src/main.cpp
```

完全采用服务器/对方的版本，丢弃你的修改。同样要谨慎。

### 使用基础版本（base）

```bash
svn resolve --accept base src/main.cpp
```

回到冲突发生之前的原始版本，放弃双方修改。

### 手动解决（working）

```bash
# 先用编辑器手动修改冲突文件
vim src/main.cpp

# 确认修改正确后标记为已解决
svn resolve --accept working src/main.cpp
```

这是最推荐的方式——手动审查冲突内容，选择保留哪些修改。

## 4、手动解决冲突的步骤

### 步骤一：更新/合并，允许冲突

```bash
svn update --accept postpone
# 或
svn merge ^/trunk --accept postpone
```

`--accept postpone` 让 SVN 不自动做任何决定，生成所有冲突文件供你审查。

### 步骤二：列出所有冲突

```bash
svn status | grep "^C"
```

### 步骤三：逐个解决

使用图形化合并工具会更高效：

```bash
# Windows 上可以用 TortoiseSVN 的合并工具
TortoiseMerge file.txt.mine file.txt.rOLD file.txt.rNEW

# 或使用通用的 diff 工具
meld file.txt.mine file.txt.rOLD file.txt.rNEW
```

### 步骤四：清理冲突文件

解决所有冲突后：

```bash
# 删除 .mine、.rOLD、.rNEW 临时文件
svn cleanup

# 确认状态
svn status
```

### 步骤五：提交

```bash
svn commit -m "解决合并冲突"
```

## 5、文本冲突 vs 树冲突

### 文本冲突（Text Conflict）

最常见的情况——两个版本修改了同一文件的同一行。

### 树冲突（Tree Conflict）

涉及文件/目录结构的变更：
- 你修改了文件，同事删除了它
- 你添加了文件，同事也添加了同名文件
- 你移动了文件，同事修改了它

树冲突用 `svn info` 查看：

```bash
svn info src/main.cpp
# 查看 "Tree conflict" 部分
```

树冲突的解决选项：

```bash
# 接受本地版本
svn resolve --accept mine-full src/main.cpp

# 接受远程版本
svn resolve --accept theirs-full src/main.cpp

# 手动处理
svn resolve --accept working src/main.cpp
```

## 6、预防冲突的最佳实践

### 频繁更新

```bash
# 每天开始工作前
svn update

# 提交前再次更新
svn update
svn commit
```

更新越频繁，冲突越小，越容易解决。

### 小步提交

每次提交只包含一个逻辑变更，不要攒一堆修改再提交。这样即使产生冲突，范围也很小。

### 沟通协作

修改公共文件前，和团队成员沟通。尤其是配置文件和核心模块。

### 使用分支隔离

大功能在独立分支上开发，开发期间不受主干变动影响。开发完成后一次性合并，冲突集中解决。

## 7、快速参考

| 场景 | 命令 |
|------|------|
| 更新时允许冲突 | `svn update --accept postpone` |
| 使用本地版本 | `svn resolve --accept mine-full file` |
| 使用远程版本 | `svn resolve --accept theirs-full file` |
| 手动解决后标记 | `svn resolve --accept working file` |
| 查看冲突列表 | `svn status \| grep "^C"` |
| 查看树冲突 | `svn info file` |
| 清理临时文件 | `svn cleanup` |
| 放弃所有本地修改 | `svn revert -R .` |

每天前进一小步，就是一个新的高度！
