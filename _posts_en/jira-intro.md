---
title: 'Jira, the Requirements Management Power Tool: An Overview and Core Concepts'
date: 2025-11-01
author: Tang Moying
categories: [plan]
tags: [Jira, Requirements Management, DevOps]
lang: en
alt_url: /post/jira-intro
---

## 1. DevOps Starts With Requirements

The DevOps lifecycle is usually described as: **plan → code → build → test → release → deploy → operate → monitor**, and then feed back around the loop. Many people put their attention on the CI/CD and operations automation further along, and overlook the starting point — **requirements management**.

Without good requirements management, however pretty the automation that follows may be, it is just "doing the wrong thing efficiently".

In the field of requirements management, **Jira** is the de facto industry standard. Jira, produced by Atlassian, has grown from its earliest days as a bug-tracking tool into a comprehensive platform covering requirements management, agile development and project management. This series takes a DevOps perspective and systematically introduces Jira's core usage.

## 2. Jira's Core Concepts

A few core concepts run through all of Jira; understanding them is the prerequisite for using it:

### Project

A project is the topmost organisational unit in Jira. One project corresponds to one product, one team or one body of work. Each project has its own:

- **Issue type scheme**: defines which issue types this project can use
- **Workflow**: defines the rules for how an issue's status moves
- **Permission scheme**: who can do what
- **Notification scheme**: who gets notified and when

When creating a project, Jira offers three templates:

| Template type | Where it fits |
|---------|---------|
| Scrum | Iterative agile development, with the concept of sprints |
| Kanban | Continuous-flow management, with no fixed iteration cycle |
| Bug tracking | Simple defect management |

### Issue

An issue is the most basic unit in Jira. Everything is an issue — requirements, tasks, bugs, improvement suggestions are all issues in Jira.

### Issue Type

Different issue types represent different kinds of work. The common ones are:

- **Epic**: a large feature or goal, containing multiple Stories
- **Story**: a functional requirement described from the user's point of view
- **Task**: a concrete piece of development or non-development work
- **Bug**: a problem that needs fixing
- **Sub-task**: a further breakdown of a Story or Task

### Field

Every issue is made up of several fields, and Jira provides a rich set of built-in ones:

| Field | Description |
|------|------|
| Summary | The issue title |
| Description | A detailed description |
| Assignee | The person handling it |
| Reporter | The person who reported it |
| Priority | Priority |
| Status | The current status |
| Fix Version | The fix version |
| Component | The module it belongs to |
| Sprint | The iteration it belongs to (Scrum projects) |
| Story Points | Story point estimate (Scrum projects) |

Custom fields are one of Jira's powerful features — teams can add arbitrary fields to meet their own management needs.

## 3. Jira's Hierarchy

The hierarchy from largest to smallest:

```
Project
  └── Epic
       ├── Story
       │    └── Sub-task
       ├── Task
       │    └── Sub-task
       └── Bug
            └── Sub-task
```

An Epic usually corresponds to a fairly large feature or business goal (such as "a user centre redesign"), while a Story is a deliverable increment described from the user's perspective (such as "a user can change their avatar"), and a Task is work at the technical implementation level.

## 4. Jira and the DevOps Toolchain

In the DevOps toolchain, Jira plays the role of the "source":

```
Jira (requirements/tasks) → Git (commits linked to Issues) → Jenkins/GitLab CI (builds linked to Issues)
     ↑                                                         │
     └──── status updated automatically (Webhook/Callback) ────┘
```

Common integration patterns:
- **Jira + Git**: reference the Issue Key in the commit message (such as `PROJ-123`), and Jira links the commit record automatically
- **Jira + CI/CD**: build and deployment status sync to the Jira issue automatically
- **Jira + Confluence**: requirement documents and issues are linked in both directions

## 5. Jira Software vs Jira Work Management

Jira has three main products:

| Product | Positioning |
|------|------|
| Jira Software | For development teams; supports Scrum, Kanban and DevOps integrations |
| Jira Work Management | For business teams (marketing, HR and so on); simpler task management |
| Jira Service Management | For IT service desks; supports SLAs and ticket management |

This series focuses on Jira Software, the version most commonly used in DevOps scenarios.

## 6. Cloud vs Data Center

Jira offers two deployment models:

- **Cloud**: hosted by Atlassian, billed as a per-user subscription, upgraded automatically, with no operations work. Suited to small and medium teams.
- **Data Center**: self-hosted, suited to large enterprises; supports high availability and clustered deployment, for scenarios with higher requirements on data security.

## 7. Summary

As a requirements management tool, Jira sits at the starting point of the DevOps toolchain. Understanding core concepts such as Project, Issue, Epic, Story, Task and Bug is the foundation for using Jira. In the next article we dig into the most central operations in Jira — managing issues and designing workflows.

A small step forward every day is a new height!
