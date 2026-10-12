---
title: 'Jira Query Power Tools: JQL and Filters'
date: 2025-11-09
author: Tang Moying
categories: [plan]
tags: [Jira, JQL, Filters, Dashboards]
lang: en
alt_url: /post/jira-jql-filters
---

## 1. When There Are Too Many Issues to Find

A busy project easily accumulates several hundred Issues, or even a thousand. At that point, hunting for an Issue by eyeballing the board is no longer workable. Jira provides a powerful query language, **JQL (Jira Query Language)**, that lets you filter out exactly the data you want.

JQL is to Jira what SQL is to a database. Mastering JQL is an essential skill for using Jira efficiently.

## 2. JQL Basic Syntax

The basic structure of JQL:

```
字段 运算符 值 [关键字]
```

A few simple examples:

```sql
-- Find all unfinished Issues assigned to me
assignee = currentUser() AND status != Done

-- Find all Bugs in a project
project = PROJ AND issuetype = Bug

-- Find Issues created this week
project = PROJ AND created >= startOfWeek()

-- Find high-priority, unassigned Issues
priority = High AND assignee IS EMPTY
```

## 3. Common Fields

JQL supports almost every field in Jira:

| Field | Description | Example |
|------|------|------|
| `project` | Project | `project = "My Project"` |
| `issuetype` | Issue type | `issuetype = Story` |
| `status` | Status | `status = "In Progress"` |
| `assignee` | Assignee | `assignee = zhangsan` |
| `reporter` | Reporter | `reporter = currentUser()` |
| `priority` | Priority | `priority in (High, Highest)` |
| `created` | Created | `created >= "2025-11-01"` |
| `updated` | Updated | `updated < -7d` |
| `resolution` | Resolution | `resolution = Unresolved` |
| `labels` | Labels | `labels = frontend` |
| `fixVersion` | Fix version | `fixVersion = "v2.0"` |
| `sprint` | Sprint | `sprint in openSprints()` |
| `component` | Component | `component = "用户中心"` |
| `text` | Full-text search | `text ~ "登录"` |

## 4. Common Operators

| Operator | Description | Example |
|--------|------|------|
| `=` | Equals | `status = Done` |
| `!=` | Not equal | `assignee != currentUser()` |
| `>` `<` `>=` `<=` | Comparison | `created >= -7d` |
| `IN` | Matches several values | `status in (Done, Closed)` |
| `NOT IN` | Excludes several values | `status not in (Done, Closed)` |
| `~` | Fuzzy match | `summary ~ "登录"` |
| `!~` | Negative fuzzy match | `summary !~ "已废弃"` |
| `IS EMPTY` | Is empty | `assignee IS EMPTY` |
| `IS NOT EMPTY` | Is not empty | `description IS NOT EMPTY` |
| `WAS` | Historical status | `status WAS "In Progress"` |
| `CHANGED` | Field has changed | `assignee CHANGED AFTER -7d` |

## 5. Keywords and Functions

JQL provides a few special keywords and functions that make queries more flexible:

```sql
-- AND / OR combined conditions
project = PROJ AND (status = "In Progress" OR status = "In Review")

-- ORDER BY sorting
project = PROJ ORDER BY priority DESC, created ASC

-- Time functions
created >= startOfWeek()           -- this week
created >= startOfMonth()          -- this month
created >= -7d                      -- the last 7 days
due <= endOfWeek()                  -- due this week

-- User functions
assignee = currentUser()            -- the current user
assignee in membersOf("开发组")     -- members of a user group
```

## 6. Practical JQL Examples

Here are some JQL queries that are genuinely useful in day-to-day work:

### My Work Panel

```sql
-- Unfinished Issues I am responsible for
assignee = currentUser() AND resolution = Unresolved ORDER BY priority DESC, created ASC

-- Problems I reported (no matter who is handling them)
reporter = currentUser() ORDER BY updated DESC

-- Issues I need to review
status = "In Review" AND project = PROJ ORDER BY created ASC
```

### Sprint Management

```sql
-- All unfinished Issues in the current Sprint
sprint in openSprints() AND status != Done

-- Issues in the current Sprint with no story points (the estimate was missed)
sprint in openSprints() AND "Story Points" IS EMPTY

-- Issues that were removed from the Sprint
sprint = "Sprint 10" AND sprint not in openSprints()
```

### Version Management

```sql
-- Unresolved Bugs in a given version
fixVersion = "v2.0" AND issuetype = Bug AND resolution = Unresolved

-- All unfinished Issues in a version
fixVersion = "v2.0" AND status not in (Done, Closed)
```

### Quality Tracking

```sql
-- In-progress Issues not updated for more than 7 days
status = "In Progress" AND updated <= -7d

-- Unresolved Issues with no assignee
assignee IS EMPTY AND resolution = Unresolved

-- High-priority Bugs with no story points
issuetype = Bug AND priority = Highest AND "Story Points" IS EMPTY
```

## 7. Filters

A JQL query you have written can be saved as a filter, which makes it easy to reuse and share:

### Saving a Filter

After running a JQL query in Jira, click "Save as filter", give it a name and choose its visibility:

- **Private**: only you can see it
- **Shared with the team**: project members can see it
- **Shared globally**: every logged-in user can see it

### Where Filters Are Used

A filter is not just a query; it is also the foundation of other Jira features:

| Feature | Use |
|------|------|
| **Dashboard** | Show the results of several filters as charts |
| **Board** | A board's data source is a single filter |
| **Subscription** | Send filter results to a mailbox on a schedule |
| **Bulk operations** | Modify fields in bulk on filtered results |
| **Confluence embedding** | Embed Jira filter results in a document |
| **REST API** | Export filter data through the API |

### Email Subscriptions

For queries that need regular attention (such as "all blocked Issues"), you can set up an email subscription:

```
过滤器: status = Blocked ORDER BY created ASC
订阅周期: 每天早上 9:00
收件人: 开发团队邮件组
```

That way the team receives the current list of blockers every morning without anyone having to look it up by hand.

## 8. Dashboards

A dashboard is a collection of gadgets, and each gadget's data source is usually a filter:

```
┌─────────────────────────────────────────────────────────────┐
│  My Dashboard                                                │
├──────────────────────┬──────────────────────────────────────┤
│  "My to-dos"         │  "Current Sprint burndown"           │
│  (filter gadget)     │  (burndown chart gadget)             │
│  PROJ-123 User login │  ████████░░░░░░░░                    │
│  PROJ-125 Home revamp│  ████████████░░░░                    │
│  PROJ-128 Search Bug │                                      │
├──────────────────────┼──────────────────────────────────────┤
│"Unassigned high Bugs"│  "Created vs resolved in two weeks"  │
│  (filter gadget)     │  (2D statistics gadget)              │
│  PROJ-130  Crash     │  Created: ████████████  35           │
│  PROJ-132  Blank page│  Resolved: ██████████    28          │
└──────────────────────┴──────────────────────────────────────┘
```

I suggest every team create at least the following dashboards:
- **Personal dashboard**: my to-dos + the Issues I am watching
- **Sprint dashboard**: burndown chart + Sprint progress + blocked list
- **Quality dashboard**: Bug trend + number of unresolved Bugs + Bug response time

## 9. Summary

JQL is the watershed for using Jira efficiently. The efficiency gap between users who know JQL and users who don't is enormous.

The path to mastering JQL:
1. Start by memorising the most common fields and operators (`project`, `assignee`, `status`, `=`, `AND`, `IN`)
2. Save the queries you use often as filters and build up your own filter library
3. Learn to use functions (`currentUser()`, `startOfWeek()`, `-7d`)
4. Build dashboards on top of your filters

In the next article, we will look at how Jira integrates with the other tools in the DevOps toolchain (Git, CI/CD).

A small step forward every day is a new height!
