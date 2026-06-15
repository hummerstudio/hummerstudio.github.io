---
title: 发布工程（三）：Changelog 与 Release Notes——让每个版本有迹可循
author: 唐明
categories: [release]
tags: [Changelog, Release Notes, Conventional Commits, 版本管理, 发布工程]
---

想象一个场景：你接手了一个运行了三年的项目，现在要升级某个依赖库。你想知道“从 1.5 升到 2.0 会有什么影响”，于是去翻这个库的发布记录——结果发现 CHANGELOG 里只有一条：“Bug fixes and performance improvements”。你是不是很想把电脑砸了？

一个好的变更日志，是版本管理的另一半灵魂。版本号告诉你“变了多少”，变更日志告诉你“变了什么”。

<!--以上为摘要内容-->

## 一、Changelog 和 Release Notes 是两回事

在聊怎么写之前，先厘清一个常见的混淆：Changelog 和 Release Notes 不是同一个东西。

**Changelog（变更日志）**面向开发者。它记录每一个版本的技术变更：新增了什么 API、修复了什么 Bug、废弃了什么功能。它的读者想知道的是“这个版本改了我的哪些代码会受影响”。

**Release Notes（发布说明）**面向用户。它用非技术语言描述这个版本带来了什么新特性、解决了什么问题、有什么已知的限制。它的读者想知道的是“这个版本对我有什么用”。

一个专业的项目，两者都应该有。但 Changelog 是基础——没有 Changelog，Release Notes 就成了无源之水。

## 二、Keep a Changelog 规范

[Keep a Changelog](https://keepachangelog.com/zh-CN/) 是目前最被广泛接受的 Changelog 写作规范。它的核心建议很简单：

**按版本组织，每个版本按变更类型分类。**

一个标准的 Changelog 条目长这样：

```markdown
## [1.2.0] - 2024-03-15

### 新增
- 支持 XML 格式的配置导入
- 新增 `/api/v2/users` 接口

### 变更
- 数据库连接池默认大小从 10 调整为 20

### 废弃
- `/api/v1/users` 将在 2.0.0 中移除

### 移除
- 移除了对 Java 8 的支持

### 修复
- 修复并发场景下连接泄漏的问题
- 修复时区解析错误导致的时间偏移

### 安全
- 修复 CVE-2024-1234 SQL 注入漏洞
```

**Keep a Changelog 的几个原则**：

1. **Changelog 是给人看的，不是给机器看的。** 不要把 Git 提交记录直接粘贴进来——一条 `fix typo`、`wip`、`tmp commit` 对读者毫无意义。
2. **最新版本在最上面。** 人看 Changelog 的典型场景是“最近有什么变化”，所以从新到旧排列。
3. **每个版本都要标注发布日期。** 结合版本号，这给你提供了完整的时间线视图。
4. **分类要明确。** 至少区分“新增（Added）”“变更（Changed）”“废弃（Deprecated）”“移除（Removed）”“修复（Fixed）”“安全（Security）”。

## 三、手动写 vs 自动生成

手动写 Changelog 的好处是质量可控——你可以精心组织语言，让每一条变更都准确清晰。但坏处也很明显：太容易忘了。发布完了一个版本，Changelog 更新经常拖到第二天，然后就再也不写了。

自动生成的好处是不容易遗漏——构建流水线在打 Tag 的时候自动生成，再也不需要人手动整理。坏处是依赖你的提交信息质量：如果大家的 commit message 都是 `update`、`fix`、`改了点东西`，自动生成出来的就是一堆废话。

**折中的做法**：用自动生成做草稿，然后人工润色。机器把骨架搭好，人把血肉填上。

目前最主流的自动生成方案是 **conventional-changelog**，它基于 Conventional Commits 规范来解析提交信息。

## 四、约定式提交：让提交信息机器可读

[Conventional Commits](https://www.conventionalcommits.org/) 规范要求提交信息的格式为：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

常用的 type 包括：

| type | 含义 | 对应版本号变化 |
|------|------|----------------|
| `feat` | 新功能 | MINOR |
| `fix` | Bug 修复 | PATCH |
| `BREAKING CHANGE` | 不兼容变更（在 footer 中标注） | MAJOR |
| `docs` | 文档变更 | 不变 |
| `chore` | 构建/工具变更 | 不变 |
| `refactor` | 重构 | 不变 |
| `test` | 测试变更 | 不变 |
| `perf` | 性能优化 | PATCH |

举个例子：

```
feat(user): 支持手机号登录

新增了通过手机号和验证码登录的功能。
- 新增 /api/auth/sms 接口发送验证码
- 新增 /api/auth/login-by-sms 接口登录

BREAKING CHANGE: /api/auth/login 接口的响应格式变更，
status 字段从字符串改为整数。
```

有了这样的提交信息，`conventional-changelog` 工具就能自动生成 ChangeLog：

```bash
# npm 生态中常用的工具
npm install -g conventional-changelog-cli
cd my-project
npx conventional-changelog -p angular -i CHANGELOG.md -s
```

在 Maven/Gradle 项目里，也有对应的实现。比如 `semantic-release` 插件可以读取 Conventional Commits 并自动决定下一个版本号，然后调用你配置的发布步骤（打 Tag、推送制品、生成 Changelog）。

## 五、Changelog 的实践建议

**要不要在 Git 提交记录里找 Changelog？** 有人会说：“我的 Git log 就是最好的 Changelog，为什么还要多此一举？”问题是，Git log 是给写代码的人看的，Changelog 是给用这个版本的人看的。你改了一个内部类、优化了一个私有方法、重构了一个配置加载逻辑——这些对用户没有任何意义，不应该出现在 Changelog 里。

**要不要每条提交都对应一条 Changelog？** 不需要。多个提交可能解决同一个问题，一个提交可能涉及多个方面。Changelog 的粒度应该是“对使用者有意义的一次变更”，而不是“对 Git 有意义的一次提交”。

**要不要在 Changelog 里写不兼容变更？** 必须要，而且要格外醒目。你可以在不兼容变更前加上 `**BREAKING**` 前缀，在文档最前面加一段“从 X 升级到 Y 的迁移指南”，避免使用者在不知情的情况下踩坑。

**实际流程建议**：

```bash
# 1. 开发阶段：用 Conventional Commits 写提交信息
git commit -m "feat: 新增批量导出功能"
git commit -m "fix: 修复导出时 OOM 的问题"

# 2. 发布前：人工检查并补充 Changelog
# 用工具生成初稿，然后手动整理
npx conventional-changelog -p angular -i CHANGELOG.md -s

# 3. 发布时：一起归档
# 发布节点包含：Git Tag + 制品 + Changelog
```

## 六、小结

版本号、Changelog、制品——这三者构成了发布的“三件套”。版本号告诉你版本之间的结构关系，Changelog 告诉你每个版本的具体变化，制品是最终可以被部署的实体。三者缺一不可。

到这里，前面三篇文章把“发布工程”的理念和规范讲得差不多了。从下一篇开始，我们进入实操环节：聊聊制品仓库。首先是 Java 生态中最常用的 Nexus。

每天前进一小步，就是一个新的高度！
