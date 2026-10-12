---
title: Jira Issue Management and Workflow Design
date: 2025-11-02
author: Tang Moying
categories: [plan]
tags: [Jira, Workflows, Issue, Requirements Management]
lang: en
alt_url: /post/jira-issue-workflow
---

## 1. The Issue Is the Heart of Jira

The previous article introduced Jira's core concepts, among which the Issue is Jira's most basic unit. If a Project is the container, the Issue is the blood inside it. A team's daily work is essentially creating, transitioning, tracking and closing Issues.

## 2. Best Practices for Creating an Issue

Creating an Issue looks simple, but writing a "good" one that keeps later development and collaboration smooth comes with some conventions worth following:

### Title (Summary)

A good title should **say what is being done in one sentence**, following a "verb + object" format.

```
✅ 用户可以修改个人头像
✅ 修复订单金额计算精度问题
✅ 优化首页加载速度至 2 秒以内

❌ 需求
❌ bug 修复
❌ 首页问题
```

### Description

The description should answer three questions:

- **Why do it**: the background and the business value
- **What to do**: the functional scope, including acceptance criteria
- **How to do it**: the technical approach (optional; needed for complex work)

```markdown
## 背景
用户反馈无法在移动端查看订单物流信息。

## 验收标准
- 订单详情页新增"查看物流"按钮
- 点击后跳转到物流轨迹页面
- 物流信息实时从第三方 API 获取

## 技术方案
- 对接快递鸟物流查询 API
- 新增 OrderTracking 组件
```

### Relationships

Jira supports creating links between Issues:

| Link type | Meaning |
|---------|------|
| blocks / is blocked by | Blocking relationship; B cannot start until A is finished |
| relates to | Related relationship |
| clones / is cloned by | Cloning relationship |
| duplicates / is duplicated by | Duplicate relationship |
| causes / is caused by | Causal relationship |

Using Issue links correctly expresses working dependencies clearly and helps the team plan its schedule.

## 3. Workflow

A workflow defines the complete life cycle of an Issue from creation to closure. The design of each project's core workflow has a direct effect on the team's collaboration efficiency.

### Status

The most common status flow:

```
To Do → In Progress → Done
```

A status model closer to real development:

```
To Do → To Be Scheduled → In Development → Code Review → In Testing → Ready for Release → Done
              ↘ 阻塞（从任意状态进入，解决后回到原状态）
```

### Status Categories

Jira divides statuses into three categories:

| Category | Colour | Meaning |
|------|------|------|
| To Do | Grey | Work that has not started |
| In Progress | Blue | Work currently being handled |
| Done | Green | Work that is finished |

In a workflow, every status must be assigned to one of these three categories; Jira's boards and reports depend on that classification.

### Transition

A change between statuses is called a transition. A transition can be configured with:

- **Conditions**: who may perform this transition
- **Validators**: conditions that must be met before execution (such as "the assignee cannot be empty")
- **Post functions**: operations triggered automatically after execution (such as "assign the assignee", "update a field")
- **Transition button name**: the button text the user sees

### A Real Workflow Example

```
To Do ──claim task──▶ In Progress ──submit for review──▶ Code Review ──review passed──▶ Testing ──tests passed──▶ Done
                                             │
                                             ▼ Review failed
                                          In Progress（打回修改）
```

Let's explain the transition rules in the diagram:
- After the task is picked up from **To Do**, the status becomes **In Progress** (development starts)
- Once development is finished and the change is submitted for review, it enters **Code Review**
- If the review passes it enters **Testing**; if the review fails it is sent back to **In Progress** for revision
- Once testing passes, the status becomes **Done**
- Once testing passes, the status becomes **Done**

## 4. Workflow Schemes

Jira supports configuring different workflows for different Issue types:

- A Bug's workflow may be simpler: To Do → Confirmed → Fixing → Verified → Closed
- A Story's workflow may need to go through product review and acceptance
- An Epic may not need a workflow at all (it is just a container)

A workflow scheme is simply several workflows bundled together and assigned to a project. It lets different Issue types follow different processes while still being managed within one project.

## 5. Automation Rules

Jira has a powerful built-in automation engine that can cut a great deal of manual work. Here are a few automation rules that are practically useful:

### Rule 1: A Bug Automatically Inherits the Epic's Assignee

When a Bug is created and linked to an Epic, automatically set the Epic's assignee as the Bug's assignee:

```
触发器：Issue 创建时
条件：Issue 类型 = Bug 且 Epic Link 不为空
Action: Edit Issue field → Assignee = the parent Epic's assignee
```

Configuration steps:
1. Go to **Project Settings → Automations**
2. Create a new rule and choose "Issue created" as the trigger
3. Add a condition: Issue Type = Bug
4. Add another condition: Epic Link IS NOT EMPTY
5. Add an action: Edit Issue → Assignee → "Linked epic's assignee"

That way, once someone fills in the linked Epic on a Bug, the assignee is filled in automatically, with no manual assignment.

### Rule 2: Send a Feishu Notification on a Status Change

When an Issue's status changes, automatically call a Feishu webhook to send a notification:

```
触发器：Issue 状态变更时
条件：无
Action: Send a web request → POST to the Feishu webhook URL
```

Feishu webhook configuration steps:
1. In the Feishu group → Group Settings → Group Bots → Add Bot → Custom Bot
2. Get the webhook URL
3. In Jira Automation, add a Web Request action:
   - URL: the Feishu webhook URL
   - Method: POST
   - Headers: Content-Type: application/json
   - Body:
     ```json
     {
       "msg_type": "text",
       "content": {
         "text": "🔔 {{issue.key}} status changed: {{trigger.issue.fromStatus}} → {{trigger.issue.toStatus}}\nAssignee: {{issue.assignee.displayName}}\nLink: {{issue.permalink}}"
       }
     }
     ```

### Rule 3: Notify the Assignee When an Issue Is Commented On

When someone adds a comment to an Issue, automatically forward the comment content to the assignee:

```
触发器：Issue 被评论时
条件：无
Action: Send a web request → POST to the Feishu webhook URL
```

Example body:
```json
{
  "msg_type": "text",
  "content": {
    "text": "💬 {{issue.key}} received a new comment\nCommenter: {{comment.author.displayName}}\nContent: {{comment.body}}\nLink: {{issue.permalink}}"
  }
}
```

Automation rules are configured through the "trigger → condition → action" pattern and need no code. Jira Automation offers a rich set of built-in triggers and actions that cover most everyday needs.

## 6. Issue Templates

For Issue types you create frequently (a Bug report, for example), you can preset a template to make sure the information is complete:

```markdown
## 问题描述
（请描述你遇到的问题）

## 复现步骤
1.
2.
3.

## 期望结果
（请描述你期望的正确行为）

## 环境信息
- 浏览器：
- 操作系统：
- 应用版本：

## 截图
（如有，请附上截图）
```

### Implementing Templates with Jira Automation

Jira has no built-in Issue template feature, but you can achieve a similar effect with Automation — every time an Issue of a particular type is created, the Description field is filled in automatically:

```
触发器：Issue 创建时
条件：Issue 类型 = Bug
Action: Edit Issue field → Description =
  "## 问题描述\n（请描述你遇到的问题）\n\n## 复现步骤\n1. \n2. \n3. \n\n## 期望结果\n（请描述你期望的正确行为）\n\n## 环境信息\n- 浏览器：\n- 操作系统：\n- 应用版本：\n\n## 截图\n（如有，请附上截图）"
```

Configuration steps:
1. Go to **Project Settings → Automations**
2. Create a new rule and choose "Issue created" as the trigger
3. Add a condition: Issue Type = Bug (if it is a Story, use Story instead)
4. Add an action: Edit Issue → Description → paste the template content into the template editor

You can create a matching automation rule for every Issue type; the preset template is filled in automatically on creation, which keeps the information consistent without any member having to copy and paste by hand.

> **Note**: a template set up in Automation only fills the Description field. If you need a more complex template (with required-field validation, attachment-upload guidance and so on), consider using **Jira Composite Fields** or a third-party plugin such as **Jira Suite Utilities**.

## 7. Summary

The Issue is Jira's core unit of operation, and the workflow defines its life cycle. A good workflow design should:

- **Reflect the team's real development process**, rather than copying a theoretical model wholesale
- **Not have too many statuses**: 5-8 statuses is usually enough; too many only confuses the team
- **Work with automation**: fewer manual operations, and status transitions that feel more natural

Next time we will talk about the Scrum board — how Jira supports agile development.

A small step forward every day is a new height!
