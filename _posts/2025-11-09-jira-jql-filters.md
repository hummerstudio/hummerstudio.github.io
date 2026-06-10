---
title: Jira 查询利器：JQL 与过滤器
author: 唐明
categories: [plan]
tags: [Jira, JQL, 过滤器, 仪表盘]
---

## 1、当 Issue 多到找不到时

一个活跃项目的 Issue 数量很容易达到几百甚至上千。这时候，靠肉眼翻看板找 Issue 已经不可行了。Jira 提供了强大的查询语言 **JQL（Jira Query Language）**，让你可以精确地筛选出想要的数据。

JQL 之于 Jira，就像 SQL 之于数据库。掌握 JQL 是高效使用 Jira 的必备技能。

## 2、JQL 基础语法

JQL 的基本结构：

```
字段 运算符 值 [关键字]
```

几个简单例子：

```sql
-- 查询所有分配给我的未完成 Issue
assignee = currentUser() AND status != Done

-- 查询某个项目的所有 Bug
project = PROJ AND issuetype = Bug

-- 查询本周创建的 Issue
project = PROJ AND created >= startOfWeek()

-- 查询高优先级且未分配的 Issue
priority = High AND assignee IS EMPTY
```

## 3、常用字段

JQL 支持 Jira 中的几乎所有字段：

| 字段 | 说明 | 示例 |
|------|------|------|
| `project` | 项目 | `project = "My Project"` |
| `issuetype` | Issue 类型 | `issuetype = Story` |
| `status` | 状态 | `status = "In Progress"` |
| `assignee` | 经办人 | `assignee = zhangsan` |
| `reporter` | 报告人 | `reporter = currentUser()` |
| `priority` | 优先级 | `priority in (High, Highest)` |
| `created` | 创建时间 | `created >= "2025-11-01"` |
| `updated` | 更新时间 | `updated < -7d` |
| `resolution` | 解决结果 | `resolution = Unresolved` |
| `labels` | 标签 | `labels = frontend` |
| `fixVersion` | 修复版本 | `fixVersion = "v2.0"` |
| `sprint` | 所属迭代 | `sprint in openSprints()` |
| `component` | 模块 | `component = "用户中心"` |
| `text` | 全文搜索 | `text ~ "登录"` |

## 4、常用运算符

| 运算符 | 说明 | 示例 |
|--------|------|------|
| `=` | 等于 | `status = Done` |
| `!=` | 不等于 | `assignee != currentUser()` |
| `>` `<` `>=` `<=` | 比较 | `created >= -7d` |
| `IN` | 多值匹配 | `status in (Done, Closed)` |
| `NOT IN` | 排除多值 | `status not in (Done, Closed)` |
| `~` | 模糊匹配 | `summary ~ "登录"` |
| `!~` | 不模糊匹配 | `summary !~ "已废弃"` |
| `IS EMPTY` | 为空 | `assignee IS EMPTY` |
| `IS NOT EMPTY` | 不为空 | `description IS NOT EMPTY` |
| `WAS` | 历史状态 | `status WAS "In Progress"` |
| `CHANGED` | 字段变更过 | `assignee CHANGED AFTER -7d` |

## 5、关键字与函数

JQL 提供了一些特殊关键字和函数，让查询更灵活：

```sql
-- AND / OR 组合条件
project = PROJ AND (status = "In Progress" OR status = "In Review")

-- ORDER BY 排序
project = PROJ ORDER BY priority DESC, created ASC

-- 时间函数
created >= startOfWeek()           -- 本周
created >= startOfMonth()          -- 本月
created >= -7d                      -- 最近 7 天
due <= endOfWeek()                  -- 本周截止

-- 用户函数
assignee = currentUser()            -- 当前用户
assignee in membersOf("开发组")     -- 某个用户组的成员
```

## 6、实用 JQL 示例

以下是一些在实际工作中非常实用的 JQL 查询：

### 我的工作面板

```sql
-- 我负责的未完成 Issue
assignee = currentUser() AND resolution = Unresolved ORDER BY priority DESC, created ASC

-- 我报告的问题（不管谁在处理）
reporter = currentUser() ORDER BY updated DESC

-- 我需要审查的 Issue
status = "In Review" AND project = PROJ ORDER BY created ASC
```

### Sprint 管理

```sql
-- 当前 Sprint 中所有未完成的 Issue
sprint in openSprints() AND status != Done

-- 当前 Sprint 中没有故事点的 Issue（遗漏了估算）
sprint in openSprints() AND "Story Points" IS EMPTY

-- Sprint 中被移除的 Issue
sprint = "Sprint 10" AND sprint not in openSprints()
```

### 版本管理

```sql
-- 指定版本中未解决的 Bug
fixVersion = "v2.0" AND issuetype = Bug AND resolution = Unresolved

-- 版本中未完成的所有 Issue
fixVersion = "v2.0" AND status not in (Done, Closed)
```

### 质量追踪

```sql
-- 超过 7 天没有更新的进行中 Issue
status = "In Progress" AND updated <= -7d

-- 没有经办人的未关闭 Issue
assignee IS EMPTY AND resolution = Unresolved

-- 高优先级 Bug 且没有故事点
issuetype = Bug AND priority = Highest AND "Story Points" IS EMPTY
```

## 7、过滤器（Filter）

写好的 JQL 可以保存为过滤器，方便复用和分享：

### 保存过滤器

在 Jira 中执行 JQL 后，点击"保存为过滤器"，命名并选择可见范围：

- **私有**：只有自己能看到
- **团队共享**：项目成员可以看到
- **全局共享**：所有登录用户可以看到

### 过滤器的应用场景

过滤器不只是查询，它还是 Jira 其他功能的基础：

| 功能 | 用途 |
|------|------|
| **仪表盘（Dashboard）** | 将多个过滤器的结果以图表展示 |
| **看板（Board）** | 看板的数据来源就是一个过滤器 |
| **订阅** | 定期将过滤器结果发送到邮箱 |
| **批量操作** | 对过滤结果批量修改字段 |
| **Confluence 嵌入** | 在文档中嵌入 Jira 过滤器结果 |
| **REST API** | 通过 API 导出过滤器数据 |

### 邮件订阅

对于需要定期关注的查询（如"所有阻塞的 Issue"），可以设置邮件订阅：

```
过滤器: status = Blocked ORDER BY created ASC
订阅周期: 每天早上 9:00
收件人: 开发团队邮件组
```

这样每天早上团队都能收到当前阻塞列表，不需要手动去查。

## 8、仪表盘（Dashboard）

仪表盘是多个小工具的集合，每个小工具的数据源通常是一个过滤器：

```
┌─────────────────────────────────────────────────────────────┐
│  My Dashboard                                                │
├──────────────────────┬──────────────────────────────────────┤
│  "我的待办"            │  "当前 Sprint 燃尽图"                 │
│  (过滤器小工具)         │  (燃尽图小工具)                       │
│  PROJ-123  用户登录    │  ████████░░░░░░░░                    │
│  PROJ-125  首页改版    │  ████████████░░░░                    │
│  PROJ-128  搜索Bug    │                                      │
├──────────────────────┼──────────────────────────────────────┤
│  "未分配的高优Bug"      │  "两周内创建 vs 解决"                  │
│  (过滤器小工具)         │  (二维统计小工具)                     │
│  PROJ-130  Crash      │  创建: ████████████  35               │
│  PROJ-132  白屏       │  解决: ██████████    28               │
└──────────────────────┴──────────────────────────────────────┘
```

建议每个团队至少创建以下仪表盘：
- **个人仪表盘**：我的待办 + 我关注的 Issue
- **Sprint 仪表盘**：燃尽图 + Sprint 进度 + 阻塞列表
- **质量仪表盘**：Bug 趋势 + 未解决 Bug 数量 + Bug 响应时间

## 9、总结

JQL 是 Jira 高效使用的分水岭。会 JQL 的用户和不会的用户，使用效率差距非常大。

掌握 JQL 的路径：
1. 先记住最常用的字段和运算符（`project`、`assignee`、`status`、`=`、`AND`、`IN`）
2. 把常用的查询保存为过滤器，建立自己的过滤器库
3. 学会使用函数（`currentUser()`、`startOfWeek()`、`-7d`）
4. 在过滤器基础上搭建仪表盘

下一篇，我们来看 Jira 如何与 DevOps 工具链中的其他工具（Git、CI/CD）集成。

每天前进一小步，就是一个新的高度！
