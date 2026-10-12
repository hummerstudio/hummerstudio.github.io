---
title: An Agent's "Code of Conduct" — the Essence of Skill and the Common Misconceptions
date: 2026-06-07
author: Tang Moying
categories: [ai]
tags: [AI, Agent, Skill, Hermes, Process Design, Custom Rules, Context Management]
lang: en
alt_url: /post/ai-agent-skill-principles
---

Last time we talked about Tools — the "hands and feet" an Agent uses to operate on the outside world. Once it has hands and feet, the next question follows: how should the Agent use them? When should it do what, how far is far enough to count as "done", and how should it judge a situation that is ambiguous? That is the problem Skill solves. It is not what tells the Agent "how you use kubectl" — that is the Tool's business. What Skill tells the Agent is "the right process and principles for doing a thing". But many people have a deep-rooted misconception about Skill, and this article is about that.

<!--以上为摘要内容-->

## 1. What a Skill Is: Custom Processes and Principles

Let's start from a concrete scenario. You have written a Skill in Hermes called `code-review`. It goes roughly like this:

```markdown
## Code Review Skill

在进行代码审查时，遵循以下流程和原则：

### 审查流程
1. 先理解改动的业务背景（从 PR 描述和关联 Issue 中获取）
2. 检查安全性问题（SQL 注入、XSS、敏感信息泄露）
3. 检查性能瓶颈（N+1 查询、不必要的循环、大对象创建）
4. 检查代码风格和可读性
5. 检查测试覆盖（改动是否包含测试，测试是否覆盖了边界情况）

### 判断原则
- 安全问题是 blocker，必须修复
- 性能问题视影响范围决定是否 blocking
- 代码风格问题建议修改但不强制
- 不确定的地方标记为"建议确认"，不要直接判断

### 输出格式
每个问题标注严重程度：[Blocker] / [Major] / [Suggestion]
```

Notice that this Skill contains no technical detail at all — it does not tell you how `grep` is used or how `git diff` is invoked. It is all about **process** (what order to check things in), **principles** (what counts as a blocker, what counts as a suggestion) and **output conventions** (how to label severity).

That is the essence of a Skill: **turning experience into an Agent's code of conduct.** The judgements that run naturally through a senior engineer's head during a code review — "check security first, then performance, style last; zero tolerance on security issues, stop at a hint on style issues" — become rules an Agent can follow, by way of a Skill.

**A Skill is not a manual for a Tool.** A Tool answers "what can be done"; a Skill answers "how to do it". The two are not on the same dimension and do not stand in a relationship of replacement or competition.

## 2. "The More Skills the Better" — The Most Common Misconception

This is also the most deeply held of all the misconceptions about Skill.

Many people using Hermes or similar Agent tools share an intuition: the more Skills you install, the more powerful the Agent becomes. You find a "Python best practices" Skill and install it; you find a "K8s operations standards" Skill and install it; a "database optimization" Skill, install that too. In the end the Agent's Skill list is enormously long, and it feels reassuring — "my Agent can do everything".

**That intuition is wrong.** Adding Skills does not increase an Agent's capability linearly. The more likely result is that the Agent actually gets dumber.

There are three reasons.

### 2.1 The Context Blows Up

An Agent's context window has limits. On every conversation, the content of all the Skills has to be injected into the System Prompt — it is not "load the one you use" but "inject all of them". Install 20 Skills at 500 words each and your System Prompt has 10,000 extra words. Add the conversation history, the Tool definitions and file memory, and the context is soon filled up.

What gets squeezed out is not Skills but **the information the Agent genuinely needs** — the complete content of the file you have open right now, or the complete context of your conversation. The Agent is forced to trade off between "remembering the Skills" and "understanding your problem", and that trade-off itself lowers the quality of its answers.

### 2.2 Skills May Contradict Each Other

One Skill says "a function should not exceed 50 lines"; another says "do not split for splitting's sake; logical completeness comes first". When it comes time to act, the Agent does not know whose rule to follow when the two conflict, because Skill definitions usually contain no priority. The Agent will most likely pick one at random, or take both into account — and the result is a function that gets split and then merged again, the Agent fighting itself.

When you maintain 20 Skills yourself, the further along you get, the harder it is to spot which of them contradict each other. Skills usually come from different sources and are installed at different times — reviewing them all as a whole to check for conflicts is very hard.

### 2.3 The Agent's "Difficulty Choosing"

A Skill is not only a "passive rule". Many Skills also shape the Agent's behaviour pattern — a `code-review` Skill, for instance, steers the Agent into "review mode": more cautious in what it says, asking more confirming questions, preferring to flag a TODO rather than change the code directly. A `debugging` Skill steers it into "investigation mode": running diagnostic commands on its own initiative, analysing logs, offering several possibilities.

When the Agent has a pile of Skills loaded at the same time, it becomes hesitant about "which mode to enter". Its behaviour grows unstable — the same problem, and sometimes it enters review mode (only offering suggestions), sometimes investigation mode (executing commands on its own). This is not the Agent "getting smarter"; it is behaviour drift caused by too many Skills.

## 3. How to Write a Good Skill

The "few but fine" principle for Skills also points, in reverse, to how a Skill should be designed. A good Skill has a few characteristics:

**1. A clear scenario.** Do not write a catch-all Skill like "backend development best practices" — the scenario is too broad, and covering everything amounts to covering nothing. It should be a Skill with a clear scenario such as "Code Review", "Pre-deployment checks" or "Database query optimization". Then, when the Agent is handling the matching scenario, it can recognize at once that "this Skill is the one to use now".

**2. Priorities and decision criteria.** Do not list a pile of rules and let the Agent choose for itself; tell it explicitly what counts as a Blocker, what counts as a Suggestion, and which rule wins when two of them conflict. Write the "judgement" that lives in human experience out in a structured form.

**3. Good examples and counter-examples.** A bare description of a rule is not as good as an example. For a performance check, for instance, do not just write "avoid N+1 queries" — attach a before-and-after code comparison. An Agent (like a human) learns more solidly from examples than from rules.

**4. No overlap with existing Skills.** Before installing a new Skill, go through the list of Skills you already have and confirm that the new Skill's function is not a subset of an existing Skill and that there are no obviously conflicting rules.

**5. Light on context.** If a rule can be stated clearly, do not write more. A process that can be told in 500 words should not be padded into a 3,000-word encyclopaedia to look "professional". A Skill's goal is to help the Agent make decisions, not to help a person look things up in documentation.

## 4. Summary

If this article conveys one thing, it is this: **a Skill is a code of conduct, not a feature list; quality matters far more than quantity.**

A Tool lets an Agent "be able to"; a Skill lets an Agent "know how to" — two entirely different questions. However good its hands and feet, without a set of principles and processes for getting things done, the Agent is just flailing. But the reverse holds too: too many principles, fighting each other, and the Agent is worse off than with none — it does not know whose rule to follow, which mode to enter, and it cannot even remember your question in full.

Designing Skills is a process of "subtraction". What matters is not how many rules you found but how many genuinely useful ones you kept in the end. Three clear enough Skills beat twenty contradictory ones a hundred times over.

Next time, MCP vs. CLI — the two paths for an Agent to call a Tool, and why the situation is the exact opposite of what our intuition suggests.

A small step forward every day is a new height!
