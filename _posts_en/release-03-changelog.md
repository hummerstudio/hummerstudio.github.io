---
title: 'Release Engineering (Part 3): Changelog and Release Notes — Making Every Version Traceable'
date: 2024-07-20
author: Tang Moying
categories: [release]
tags: [Changelog, Release Notes, Conventional Commits, Versioning, Release Engineering]
lang: en
alt_url: /post/release-03-changelog
---

Imagine a scenario: you take over a project that has been running for three years, and now you need to upgrade one of its dependencies. You want to know "what impact will upgrading from 1.5 to 2.0 have?", so you go digging through this library's release history — and all you find in the CHANGELOG is a single entry: "Bug fixes and performance improvements." Don't you just want to smash your computer?

A good changelog is the other half of the soul of version management. The version number tells you "how much changed"; the changelog tells you "what changed."

<!--以上为摘要内容-->

## 1. Changelog and Release Notes Are Two Different Things

Before we talk about how to write them, let's clear up a common confusion: a Changelog and Release Notes are not the same thing.

**Changelog** is aimed at developers. It records the technical changes in every version: what APIs were added, what bugs were fixed, what features were deprecated. Its readers want to know "which of my code will be affected by the changes in this version."

**Release Notes** are aimed at users. They describe, in non-technical language, what new features this version brings, what problems it solves, and what known limitations there are. Their readers want to know "what use is this version to me."

A professional project should have both. But the Changelog is the foundation — without a Changelog, Release Notes become water without a source.

## 2. The Keep a Changelog Convention

[Keep a Changelog](https://keepachangelog.com/zh-CN/) is currently the most widely accepted convention for writing a Changelog. Its core advice is simple:

**Organize by version; within each version, classify by type of change.**

A standard Changelog entry looks like this:

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

**A few principles of Keep a Changelog**:

1. **A Changelog is for people to read, not for machines.** Don't paste Git commit records straight in — a `fix typo`, a `wip`, a `tmp commit` means nothing to the reader.
2. **The latest version goes at the top.** The typical scenario for someone reading a Changelog is "what changed recently," so order from newest to oldest.
3. **Every version should be tagged with its release date.** Combined with the version number, this gives you a complete timeline view.
4. **Classify clearly.** At minimum distinguish "Added," "Changed," "Deprecated," "Removed," "Fixed," and "Security."

## 3. Writing by Hand vs. Generating Automatically

The upside of writing a Changelog by hand is that the quality is under your control — you can craft the wording so that every entry is accurate and clear. But the downside is obvious too: it is far too easy to forget. Once a release is done, updating the Changelog often slips to the next day, and then it never gets written again.

The upside of generating it automatically is that it's easy to miss nothing — the build pipeline generates it automatically when you tag a release, and nobody has to organize it by hand anymore. The downside is that it depends on the quality of your commit messages: if everyone's commit message is `update`, `fix`, or `改了点东西`, what you generate is a pile of hot air.

**A middle ground**: use automatic generation for the draft, then polish it by hand. The machine puts up the skeleton, the human fills in the flesh.

The most mainstream automatic generation solution today is **conventional-changelog**, which parses commit messages based on the Conventional Commits convention.

## 4. Conventional Commits: Making Commit Messages Machine-Readable

The [Conventional Commits](https://www.conventionalcommits.org/) convention requires commit messages to be formatted as:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Common types include:

| type | Meaning | Corresponding version number change |
|------|------|----------------|
| `feat` | New feature | MINOR |
| `fix` | Bug fix | PATCH |
| `BREAKING CHANGE` | Breaking change (noted in the footer) | MAJOR |
| `docs` | Documentation change | No change |
| `chore` | Build/tooling change | No change |
| `refactor` | Refactoring | No change |
| `test` | Test change | No change |
| `perf` | Performance optimization | PATCH |

An example:

```
feat(user): 支持手机号登录

新增了通过手机号和验证码登录的功能。
- 新增 /api/auth/sms 接口发送验证码
- 新增 /api/auth/login-by-sms 接口登录

BREAKING CHANGE: /api/auth/login 接口的响应格式变更，
status 字段从字符串改为整数。
```

With commit messages like this, the `conventional-changelog` tool can automatically generate a ChangeLog:

```bash
# a tool commonly used in the npm ecosystem
npm install -g conventional-changelog-cli
cd my-project
npx conventional-changelog -p angular -i CHANGELOG.md -s
```

In Maven/Gradle projects there are corresponding implementations too. For example, the `semantic-release` plugin can read Conventional Commits and automatically decide the next version number, then invoke the release steps you've configured (tagging, pushing artifacts, generating the Changelog).

## 5. Practical Advice for Changelogs

**Should you dig a Changelog out of the Git commit records?** Some people will say: "My Git log is the best Changelog there is, so why do it a second time?" The problem is, the Git log is for the people writing the code, while the Changelog is for the people using this version. You changed an internal class, optimized a private method, refactored a piece of configuration-loading logic — none of that means anything to the user, and it shouldn't appear in the Changelog.

**Should every commit correspond to one Changelog entry?** No. Multiple commits may solve the same problem, and one commit may touch several areas. The granularity of a Changelog should be "one change that matters to the user," not "one commit that matters to Git."

**Should you write breaking changes in the Changelog?** You must, and you should make them extra prominent. You can prefix breaking changes with `**BREAKING**`, and add a "migration guide from X to Y" section at the very top of the document, so users don't step into a pit without knowing it.

**A suggested real-world flow**:

```bash
# 1. Development stage: write commit messages with Conventional Commits
git commit -m "feat: 新增批量导出功能"
git commit -m "fix: 修复导出时 OOM 的问题"

# 2. Before release: review and fill in the Changelog by hand
# Generate a first draft with the tool, then tidy it up manually
npx conventional-changelog -p angular -i CHANGELOG.md -s

# 3. At release time: archive it all together
# A release point contains: Git Tag + artifact + Changelog
```

## 6. Summary

The version number, the Changelog, and the artifact — these three make up the "three-piece set" of a release. The version number tells you the structural relationship between versions, the Changelog tells you the specific changes in each version, and the artifact is the entity that can finally be deployed. You can't do without any of the three.

At this point, the first three articles have pretty much covered the philosophy and conventions of "release engineering." Starting with the next one, we move into hands-on territory: let's talk about artifact repositories. First up, Nexus — the most commonly used one in the Java ecosystem.

A small step forward every day is a new height!
