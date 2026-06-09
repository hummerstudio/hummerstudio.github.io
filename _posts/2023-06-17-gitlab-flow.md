---
title: Git 分支模型（三）：GitLab Flow
author: 唐明
categories: [vcs]
tags: [Git, GitLab Flow, 分支模型]
---
* TOC
{:toc}

## 1、Git Flow 太重，GitHub Flow 太轻

前两篇分别介绍了 Git Flow 和 GitHub Flow。前者规则严谨但繁琐，后者极简但对多版本维护支持不足。有没有一个折中方案？

GitLab 团队也思考了这个问题。他们在实践中发现 GitHub Flow 的一个明显缺陷：当需要维护多个版本或需要环境隔离时，只有一个 `main` 分支是不够的。于是他们提出了 **GitLab Flow**。

GitLab Flow 的核心思想是：**在 GitHub Flow 的基础上，根据需要引入额外的长期分支来处理版本管理和环境部署。**

## 2、环境分支（Environment Branches）

如果你有多个部署环境（如开发、预发布、生产），GitLab Flow 建议为每个环境创建一个对应的分支：

```
main ──────────●──────────────────●──────────────────●
               │                  │                  │
pre-production─┼──────────────────●──────────────────●
               │                  │
production─────┼──────────────────────────────────────●
```

工作流程：

```bash
# 在 main 上开发完成后，合并到 pre-production 进行测试
git checkout pre-production
git merge main

# 预发布环境验证通过后，合并到 production
git checkout production
git merge pre-production
```

**上游优先原则**：代码始终从上游向下游流动（`main` → `pre-production` → `production`），绝不能反向合并。

这种方式的好处是：
- 每个环境都有对应的分支，知道什么代码在什么环境
- 可以在环境分支上直接 cherry-pick 紧急修复
- 部署操作就是简单的 `git merge`

## 3、发布分支（Release Branches）

如果需要同时维护多个版本（如 v1.x 和 v2.x），GitLab Flow 建议为每个主版本创建发布分支：

```
main:    ●────●────●────●────●────●  (v2.x 开发)
         │
v1.x:    ●────●────●  (v1.x 维护，只合 bug 修复)
```

```bash
# 发布 v1.0 时创建发布分支
git checkout -b v1.x main
git tag v1.0.0

# v1.x 上的 bug 修复需要 cherry-pick 到 main（如果 bug 在 v2 也存在）
git checkout v1.x
git cherry-pick <bug-fix-commit>
git checkout main
git cherry-pick <bug-fix-commit>
```

发布分支的工作原则：
- **主版本开发在 `main`**：新功能始终在 `main` 上开发。
- **旧版本只修 bug**：发布分支上只合入 bug 修复，不加新功能。
- **bug 修复向上游合并**：先在最旧的受影响版本修复，然后依次 cherry-pick 到更新的版本。

## 4、综合示例：环境分支 + 发布分支

一个同时使用环境分支和发布分支的项目，分支结构可能是这样的：

```
main ──────────────────────────────────────────
  │                    │
  ├── pre-production ──┤
  │                    │
  ├── production ──────┤
  │                    │
  ├── v1.x ────────────┤ (仅 cherry-pick bug 修复)
  │                    │
  └── v2.x ────────────┘ (仅 cherry-pick bug 修复)
```

这种结构既能做到环境隔离（通过环境分支），又能维护多个线上版本（通过发布分支），GitLab 本身也大量使用这种模型。

## 5、Merge Request 与 GitLab CI

GitLab Flow 中，Merge Request（MR，等价于 GitHub 的 PR）同样扮演核心角色。结合 GitLab CI，可以实现完整的自动化流水线：

```yaml
# .gitlab-ci.yml 示例
stages:
  - test
  - deploy_dev
  - deploy_staging
  - deploy_prod

test:
  stage: test
  script: npm test
  only:
    - merge_requests
    - main

deploy_dev:
  stage: deploy_dev
  script: ./deploy.sh dev
  only:
    - main

deploy_staging:
  stage: deploy_staging
  script: ./deploy.sh staging
  only:
    - pre-production

deploy_prod:
  stage: deploy_prod
  script: ./deploy.sh prod
  only:
    - production
  when: manual  # 生产部署需要手动触发
```

每个分支的 CI 配置清晰对应到各自的部署环境，一目了然。

## 6、三种模型的对比

| 对比维度 | Git Flow | GitHub Flow | GitLab Flow |
|---------|----------|-------------|-------------|
| 长期分支 | `main` + `develop` | 仅 `main` | `main` + 可选环境/发布分支 |
| 短期分支 | `feature`、`release`、`hotfix` | `feature` | `feature` |
| 多版本支持 | ✅ 好 | ❌ 不足 | ✅ 好（通过发布分支） |
| 环境隔离 | ❌ 不直接支持 | ❌ 不直接支持 | ✅ 好（通过环境分支） |
| 复杂度 | 高 | 低 | 中 |
| 灵活度 | 低（规则固定） | 中 | 高（按需选择） |

## 7、如何选择

GitLab Flow 的设计哲学是"按需选择"，而不是一刀切：

- 只做一个 Web 应用，频繁部署？只需要 `main` 分支，本质就是 GitHub Flow。
- 需要区分开发/预发布/生产环境？加上环境分支。
- 需要同时维护 v1.x 和 v2.x？加上发布分支。
- 以上都需要？全都加上。

这种渐进式的复杂度增加，让团队可以根据自己的实际情况灵活选择，而不是一开始就背上 Git Flow 的全部规则。

## 8、总结

GitLab Flow 不是一个全新的模型，而是对 GitHub Flow 的补充和扩展。它保留了 GitHub Flow 的简洁核心（`main` + 特性分支 + MR），同时通过环境分支和发布分支解决了多环境部署和多版本维护的实际需求。

下一篇，我们来看一个更极端的模型——**Trunk-Based Development**，它把"分支要短命"这一理念推到了极致。

每天前进一小步，就是一个新的高度！
