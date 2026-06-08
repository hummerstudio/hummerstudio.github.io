---
title: GitHub Actions 常见问题集锦（一）
author: 唐明
categories: [ci-cd]
tags: [GitHub Actions, 问题集锦]
---
* TOC
{:toc}

## 问题1：Workflow 没有触发怎么办？

这是 GitHub Actions 新手最常遇到的困惑——明明 push 了代码，Workflow 却没有跑起来。

**排查清单**：

1. **文件路径是否正确？** 必须是 `.github/workflows/` 目录下，文件扩展名是 `.yml` 或 `.yaml`
2. **是否在正确的分支上？** Workflow 文件必须存在于触发事件所在的分支上。比如你在 `feature` 分支 push，但 Workflow 文件只在 `main` 分支上，则不会触发
3. **事件配置是否正确？** 检查 `on:` 下的条件

<!--以上为摘要内容-->

**常见错误示例**：

```yaml
# 错误：只写了 on，没写具体事件
on: push

# 正确写法
on:
  push:
    branches: [main]
```

另外，如果你的仓库是 Fork 的，默认情况下 Workflow 不会自动启用，需要手动在 Actions 页面点击启用。

---

## 问题2：如何在不同 Job 之间共享数据？

GitHub Actions 使用 `artifacts` 在 Job 之间传递数据：

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "hello" > output.txt
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: output.txt

  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build-output
      - run: cat output.txt
```

关键点：
- `upload-artifact` 上传产物
- `download-artifact` 下载产物
- `needs: build` 确保 test 在 build 之后运行

---

## 问题3：如何缓存依赖以加速构建？

使用 `actions/cache`：

```yaml
- name: Cache node_modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-

- name: Install dependencies
  run: npm ci
```

`key` 的设计是关键：`hashFiles` 确保依赖文件变化时缓存自动失效。

---

## 问题4：如何使用 Secrets？

敏感信息通过 GitHub Secrets 管理：

`Settings → Secrets and variables → Actions → New repository secret`

使用：

```yaml
- name: Deploy
  env:
    SSH_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
    API_TOKEN: ${{ secrets.API_TOKEN }}
  run: ./deploy.sh
```

**注意**：Secrets 在日志中会自动脱敏，但不要在脚本中用 `echo $SECRET` 打印。

---

## 问题5：Workflow 的免费额度是多少？

| 仓库类型 | 免费额度 |
|----------|----------|
| 公开仓库 | 无限制 |
| 私有仓库 | 2000 分钟/月（免费版） |
| macOS Runner | 按 10 倍计费（1 分钟 = 10 分钟额度） |
| Windows Runner | 按 2 倍计费 |

---

## 后记

GitHub Actions 上手简单，但深入之后你会发现它的能力远超预期。从简单的 CI 到复杂的多云部署、定时任务、自动化运维，都能胜任。

踩坑是学习的一部分，记录是成长的阶梯。愿这些常见问题的解答，能帮你少走一些弯路。

每天前进一小步，就是一个新的高度！
