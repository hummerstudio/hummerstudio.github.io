---
title: Jira Scrum Agile Boards in Practice
date: 2025-11-08
author: Tang Moying
categories: [plan]
tags: [Jira, Scrum, Agile, Kanban]
lang: en
alt_url: /post/jira-scrum-board
---

## 1. From Workflow to Board

The previous article introduced Jira's workflow, which defines the rules for how an Issue's status transitions. A **board**, by contrast, is the vehicle that visualizes the workflow — showing Issues as cards in different status columns so the team can see the state of the work at a glance.

Jira supports two board modes:

- **Scrum board**: built for iterative development, with Sprints, a Backlog, and burndown charts
- **Kanban board**: built for continuous-flow management, emphasizing work-in-progress (WIP) limits

This article focuses on the Scrum board, the most commonly used mode for requirements management.

## 2. Core Scrum Concepts

Before diving into the board, let's sort out a few key Scrum concepts:

| Concept | Description |
|------|------|
| **Product Backlog** | An ordered list of all outstanding work, maintained by the Product Owner |
| **Sprint** | A fixed time box (usually 1-4 weeks) in which the team commits to finishing a set of work |
| **Sprint Backlog** | The list of Issues planned for completion in the current Sprint |
| **Story Point** | A relative estimation unit, used to measure effort rather than time |
| **Velocity** | The total number of story points the team can complete in each Sprint |
| **Sprint Goal** | The business objective to be achieved in the current Sprint |

## 3. Managing the Backlog

The Backlog is the core workspace of requirements management. In Jira's Backlog view, every Issue that hasn't entered a Sprint is listed here.

### Ordering the Backlog by Priority

The Backlog is not an arbitrary list but a queue ordered by priority:

```
Backlog（从上到下，优先级递减）

  Story: User login feature (P0)    ← highest priority
  Story: 首页改版（P0）
  Story: 搜索功能（P1）
  Bug:   修复订单金额计算（P1）
  Story: 用户反馈入口（P2）
  Story: Data export feature (P3)   ← lowest priority
  ...
```

Ordering principles:
- **P0**: core functionality or a blocking problem, must be handled as soon as possible
- **P1**: important functionality that needs to be finished in the current release
- **P2**: needed but not urgent
- **P3**: icing on the cake; do it when there are resources to spare

Jira supports drag-and-drop ordering, so the Product Owner can adjust priorities at any time.

### Creating Epics and Stories

In the Backlog, the relationship between Epics and Stories is plainly visible:

```
Epic: 用户中心改版
  ├── Story: User registration flow optimization
  ├── Story: Profile edit page
  ├── Story: Avatar upload
  └── Story: Account security settings

Epic: 数据看板
  ├── Story: Sales data overview
  ├── Story: User behavior analysis
  └── Story: Report export
```

The Epic panel helps the team focus on the most important feature modules right now.

## 4. Sprint Management

### Creating a Sprint

Select the Issues you need to finish in this Sprint from the Backlog and drag them into the Sprint area to create a Sprint:

```
Backlog                              Sprint 1 (2周, 目标: 用户中心核心功能上线)
─────────────────                    ─────────────────
Story: 搜索功能 (P1)                  Story: 用户登录功能 (P0)          5 pts
Story：用户反馈入口 (P2)              Story: 首页改版 (P0)              8 pts
...                                  Story: 用户注册流程优化 (P1)       3 pts
                                     Story: 修复订单金额计算 (P1)       2 pts
                                     ─────────────────────────────────────
                                     Total: 18 pts (预估速率: 20 pts)
```

### Estimating Story Points

Story points are not man-hours; they measure relative complexity:

- **1 point**: a simple change, doable in half an hour
- **3 points**: an ordinary feature, half a day to a day
- **5 points**: a medium feature, needs 1-2 days
- **8 points**: a complex feature, needs 2-3 days
- **13 points**: a large feature, needs to be split

A common practice is **Planning Poker**: team members each give an estimate, and where the estimates diverge widely the team discusses and re-estimates until they converge.

### Sprint Capacity Planning

```
Sprint 容量 = 团队速率 × 可用天数比例

例：团队速率 30 pts/Sprint，本 Sprint 有人休假
可用容量 = 30 × 0.85 = 25 pts
```

A team using Scrum for the first time has no historical velocity data, so it's advisable to estimate conservatively for the first 2-3 Sprints and calibrate gradually.

## 5. The Board View

Once a Sprint begins, the board shows how Issues are distributed across statuses in the form of columns:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  To Do          In Progress        In Review         Testing         Done       │
├─────────────┬────────────────┬────────────────┬──────────────┬─────────────────┤
│  PROJ-12    │  PROJ-15       │  PROJ-17       │  PROJ-18     │  PROJ-10        │
│  Search     │  User login    │  Home revamp   │  Order bug   │  Registration   │
│  5 pts      │  5 pts         │  8 pts         │  2 pts       │  3 pts          │
├─────────────┼────────────────┼────────────────┼──────────────┼─────────────────┤
│  PROJ-14    │  PROJ-16       │                │              │                 │
│  Dashboard  │  Image upload  │                │              │                 │
│  3 pts      │  3 pts         │                │              │                 │
└─────────────┴────────────────┴────────────────┴──────────────┴─────────────────┘
```

The core value of the board:
- **Visualizing bottlenecks**: a pile-up in the In Review column means reviews can't keep up with development
- **Spotting blockers**: an Issue that sits in one column without moving for a long time needs attention
- **The daily standup**: the team syncs on progress around the board instead of reporting status

### The Daily Standup

The standard standup flow around the board (no more than 1 minute per person):

1. What did I do yesterday? (look at the cards in the Done column)
2. What am I going to do today? (move cards to In Progress)
3. What's blocking me? (flag the blocker or ask for help)

## 6. Sprint Reports

### Burndown Chart

The burndown chart is the core chart of Sprint management: the horizontal axis is time, the vertical axis is the remaining work:

```
故事点
  │
20│●
  │  ●
15│     ●
  │        ●
10│           ●
  │              ●
 5│                 ●
  │                    ●────●
 0│____________________________ Time
   Day1  Day3  Day5  Day7  Day9
```

- The actual line below the reference line = ahead of schedule
- The actual line above the reference line = behind schedule, and it needs attention

### Sprint Report

After a Sprint ends, Jira generates a report automatically, containing:
- Issues planned for completion vs. issues actually completed
- Issues added / removed
- The completion rate as a percentage

This data feeds the Sprint Retrospective and helps the team improve continuously.

## 7. Summary

The Scrum board is Jira's most central requirements-management tool. From ordering the Backlog to Sprint planning, from the daily standup to the Sprint retrospective, Jira provides support for every part of Scrum.

A few practical suggestions:
- Keep grooming the Backlog continuously; don't wait until a Sprint begins to scramble for a schedule
- Estimate story points together as a team; don't let one person just call it
- The burndown chart is a reference, not a performance assessment — watch the trend, not the absolute number

Next up, we'll talk about Jira's queries and filters — how to quickly find the information you want among a large number of Issues.

A small step forward every day is a new height!
