---
title: 需求管理利器：Jira 概述与核心概念
author: 唐明
categories: [pm]
tags: [Jira, 需求管理, DevOps]
---
* TOC
{:toc}

## 1、DevOps 从需求开始

DevOps 的生命周期通常被描述为：**计划 → 编码 → 构建 → 测试 → 发布 → 部署 → 运维 → 监控**，然后循环反馈。很多人把关注点放在后面的 CI/CD 和运维自动化上，却忽略了起点——**需求管理**。

没有好的需求管理，后面的自动化再漂亮也是“高效地做错误的事情”。

在需求管理领域，**Jira** 是事实上的行业标准。Atlassian 公司出品的 Jira，从最早的 Bug 追踪工具，发展成了覆盖需求管理、敏捷开发、项目管理的综合平台。本系列将从 DevOps 视角，系统介绍 Jira 的核心用法。

## 2、Jira 的核心概念

Jira 有几个贯穿始终的核心概念，理解它们是使用 Jira 的前提：

### Project（项目）

项目是 Jira 中最顶层的组织单元。一个项目对应一个产品、一个团队或一项工作。每个项目有独立的：

- **Issue 类型方案**：定义这个项目能用哪些 Issue 类型
- **工作流**：定义 Issue 的状态流转规则
- **权限方案**：谁可以做什么
- **通知方案**：什么时候通知谁

创建项目时，Jira 提供三种模板：

| 模板类型 | 适用场景 |
|---------|---------|
| Scrum | 迭代式敏捷开发，有 Sprint 概念 |
| Kanban | 持续流动式管理，无固定迭代周期 |
| Bug 追踪 | 简单的缺陷管理 |

### Issue（事务）

Issue 是 Jira 中最基本的单元。一切皆 Issue——需求、任务、Bug、改进建议，在 Jira 里都是 Issue。

### Issue Type（事务类型）

不同类型的 Issue 代表不同的工作性质。常见的有：

- **Epic（史诗）**：大型功能或目标，包含多个 Story
- **Story（故事）**：从用户角度描述的功能需求
- **Task（任务）**：开发或非开发的具体工作
- **Bug（缺陷）**：需要修复的问题
- **Sub-task（子任务）**：Story 或 Task 的进一步拆分

### Field（字段）

每个 Issue 由多个字段组成，Jira 提供丰富的内置字段：

| 字段 | 说明 |
|------|------|
| Summary | Issue 标题 |
| Description | 详细描述 |
| Assignee | 经办人 |
| Reporter | 报告人 |
| Priority | 优先级 |
| Status | 当前状态 |
| Fix Version | 修复版本 |
| Component | 所属模块 |
| Sprint | 所属迭代（Scrum 项目） |
| Story Points | 故事点估算（Scrum 项目） |

自定义字段是 Jira 的强大功能之一——团队可以添加任意字段来满足自己的管理需求。

## 3、Jira 的组织层级

从大到小的层级关系：

```
Project（项目）
  └── Epic（史诗）
       ├── Story（故事）
       │    └── Sub-task（子任务）
       ├── Task（任务）
       │    └── Sub-task（子任务）
       └── Bug（缺陷）
            └── Sub-task（子任务）
```

Epic 通常对应一个较大的功能或业务目标（如"用户中心改版"），Story 则是从用户视角描述的可交付增量（如"用户可以修改头像"），Task 是技术实现层面的工作。

## 4、Jira 与 DevOps 工具链

在 DevOps 工具链中，Jira 扮演着"源头"的角色：

```
Jira（需求/任务） → Git（代码提交关联 Issue） → Jenkins/GitLab CI（构建关联 Issue）
     ↑                                                         │
     └──────────── 状态自动更新（Webhook/Callback） ─────────────┘
```

常见的集成方式：
- **Jira + Git**：commit message 中引用 Issue Key（如 `PROJ-123`），Jira 自动关联提交记录
- **Jira + CI/CD**：构建和部署状态自动同步到 Jira Issue
- **Jira + Confluence**：需求文档和 Issue 双向关联

## 5、Jira Software vs Jira Work Management

Jira 有三个主要产品：

| 产品 | 定位 |
|------|------|
| Jira Software | 面向开发团队，支持 Scrum、Kanban、DevOps 集成 |
| Jira Work Management | 面向业务团队（市场、HR 等），更简洁的任务管理 |
| Jira Service Management | 面向 IT 服务台，支持 SLA、工单管理 |

本系列聚焦 Jira Software，这是 DevOps 场景中最常用的版本。

## 6、Cloud vs Data Center

Jira 提供两种部署方式：

- **Cloud**：Atlassian 托管，按用户订阅付费，自动升级，免运维。适合中小团队。
- **Data Center**：自托管，适合大型企业，支持高可用和集群部署，对数据安全有更高要求的场景。

## 7、总结

Jira 作为需求管理工具，在 DevOps 工具链中处于起点位置。理解 Project、Issue、Epic、Story、Task、Bug 这些核心概念是使用 Jira 的基础。下一篇文章，我们深入探讨 Jira 中最核心的操作——Issue 的管理和工作流设计。

每天前进一小步，就是一个新的高度！
