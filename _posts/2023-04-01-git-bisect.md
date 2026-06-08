---
title: Git Bisect——用二分法快速定位问题提交
author: 唐明
categories: [vcs]
tags: [Git, Git Bisect, 调试]
---
* TOC
{:toc}

## 1、问题场景

某天你发现一个 bug，但不知道是从哪个提交引入的。代码仓库有几百个提交，一个一个 checkout 检查显然不现实。

这时 `git bisect` 就派上用场了——它使用二分查找法，自动帮你缩小范围，快速定位到引入 bug 的那次提交。

## 2、基本用法

假设当前版本有问题，而你知道 `v1.0` 标签的版本是正常的。在 `n` 个提交中，用二分法只需大约 `log₂n` 步就能定位。比如 100 个提交只需约 7 步。

### 启动 bisect

```bash
git bisect start
```

### 标记坏提交（当前版本）

```bash
git bisect bad HEAD
```

### 标记好提交（已知正常的版本）

```bash
git bisect good v1.0
```

执行后，Git 会自动检出中间位置的一个提交。你需要测试这个版本：

- 如果有 bug → `git bisect bad`
- 如果正常 → `git bisect good`

Git 会继续缩小范围，重复几次后，最终告诉你：

```
a1b2c3d4 is the first bad commit
```

### 结束 bisect

```bash
git bisect reset
```

这会让仓库回到 bisect 之前的状态。

## 3、自动化 bisect

如果你可以通过脚本判断 bug 是否存在，可以全自动运行：

```bash
git bisect start HEAD v1.0
git bisect run ./test-script.sh
```

`test-script.sh` 的退出码决定了结果：
- 退出码 `0` → 这个提交是好的（good）
- 退出码 `1~127`（不含 125）→ 这个提交是坏的（bad）
- 退出码 `125` → 这个提交无法测试，跳过（skip）

### 实际例子

比如某个单元测试失败了，你知道在 v1.0 时是通过的：

```bash
git bisect start HEAD v1.0
git bisect run npm test -- --testPathPattern=UserLogin
```

Git 会自动二分查找，直到找到导致测试失败的第一个提交。

## 4、高级用法

### 跳过无法测试的提交

有些提交可能无法编译或无法运行测试：

```bash
git bisect skip
```

Git 会跳过这个提交，选择附近的另一个提交继续测试。

### 使用术语替换

如果你觉得 good/bad 不够直观，可以用其他术语：

```bash
git bisect start --term-old=fast --term-new=slow
git bisect slow   # 当前版本慢（有性能问题）
git bisect fast v1.0  # v1.0 是快的
```

### 查看 bisect 日志

```bash
git bisect log
```

可以查看整个 bisect 过程，便于复盘或分享给同事。

### 可视化 bisect 过程

```bash
git bisect visualize
```

这会打开 `gitk`（如果安装了），以图形方式展示当前的二分查找范围，让你直观了解还有多少提交需要检查。

## 5、实战技巧

### 确认范围

在启动 bisect 前，确保你知道一个"好"的提交和一个"坏"的提交。如果不确定最早的坏提交在哪，可以从 `HEAD~50` 或某个较早的标签开始。

### 选择合适的测试方法

- **简单 bug**：手动测试即可，用 `git bisect good/bad`
- **可脚本化**：写自动化脚本，用 `git bisect run`
- **编译错误**：判断能否成功编译即可

### 中途保存进度

如果 bisect 过程很长，可以记录状态：

```bash
git bisect log > bisect.log
# 之后恢复
git bisect replay bisect.log
```

## 6、总结

`git bisect` 是 Git 中最被低估的功能之一。当你面对"不知道从哪个提交开始出问题"的场景时，它能节省大量时间。

**适用场景**：
- 回归 bug 定位
- 性能退化定位
- 编译错误定位
- 任何"之前正常，现在不正常"的问题

记住一个口诀：**二分法定位，good 好 bad 坏，最多 log₂n 步就能找到元凶。**

每天前进一小步，就是一个新的高度！
