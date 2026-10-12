---
title: 'Vibe Coding (Part 4): How to Make AI Truly Understand Your Project'
date: 2026-01-24
author: Tang Moying
categories: [ai]
tags: [AI, Vibe Coding, AI Programming, Context Management]
lang: en
alt_url: /post/vibe-coding-04-让AI理解你的项目
---


## 1. AI Has an "Amnesia" Problem

Have you ever had this experience: you're chatting with an AI, the code is flowing nicely, and then suddenly it starts talking nonsense — using an old API you've already abandoned, forgetting the project structure you described earlier, or suggesting an approach that doesn't fit your existing architecture at all.

It's not that the AI got dumber. It's that its **context window is limited**.

The context window is the upper limit on how much the AI can remember at one time. Imagine the AI has only one small blackboard — every time you say something, and the longer the conversation runs, the more of the old content on the blackboard gets erased. Once the conversation reaches a certain length, the AI "forgets" what you said at the beginning.

In Vibe Coding, this means: after 20 rounds of chat, the AI may have forgotten whether your project uses React 17 or React 18, forgotten whether your database is MySQL or PostgreSQL, forgotten that you said "don't use any third-party libraries."

**Understanding this limitation, and then working out how to get around it, is the core of context management.**

## 2. "Pin" the Key Information Somewhere the AI Can See It

Since the AI forgets, the simplest strategy is: **at the start of every conversation, tell it the most important information again.**

You don't need a long essay every time. A simple approach is to prepare a "project at a glance" blurb and paste it straight to the AI when you need it:

```text
项目概况：
- Tech stack: React 18 + TypeScript + Ant Design 5
- 状态管理：Zustand
- 后端 API：RESTful，base URL 是 /api/v1
- Code conventions: ESLint + Prettier, 2-space indent
- 文件结构：src/components/（组件）、src/utils/（工具函数）、src/api/（API 调用）
```

That's under 50 characters. But it eliminates most of the architectural modeling mistakes the AI might make — no guessing which framework you use, no guessing your directory structure, no guessing your API prefix.

Many AI coding tools now support **Project Rules** or **custom instructions** — you can configure this information so it's carried along automatically in every conversation. It's like giving the AI a "project manual" it can consult at any time.

## 3. @-Referencing Files: Worth More Than Ten Thousand Words of Description

This is the most underrated trick in Vibe Coding.

When you tell the AI "help me modify the user list page," its mental picture of that page is pure guesswork. But if you **@-reference the actual code file**, the AI sees real, definite code — and the changes it produces will be far more precise.

In practice it's very simple:

```text
"@UserList.tsx 这个组件的加载状态现在是一个转圈图标，改成骨架屏。参考 weibo 那种效果。"
```

The AI reads the code in `UserList.tsx` and sees your existing component structure, props definitions, and state management approach. The code it produces will very likely match your style and stay compatible with your interfaces.

The same logic applies to:

- When changing a function, @-reference that file
- When adding an API, @-reference an existing API file so the AI can follow the format
- When the AI needs to learn your project's naming conventions, @-reference a typical file as an example

**Remember this principle: showing the AI code is always more effective than describing code to the AI.**

## 4. A README Isn't Decoration — It's the AI's Onboarding

Many people think a README is for other developers to read. In the Vibe Coding era, the README has a new use: **a project manual for the AI to read.**

A good README is, for the AI, a round of "onboarding training." It should include:

- What the project does (in one sentence)
- The tech stack and key dependencies
- How to run it locally (`npm install && npm run dev`)
- The project's directory structure and what each directory is responsible for
- Key architectural decisions and conventions (why this approach was chosen)

When the AI reads this information, it's like a new colleague who understands the project's background — at least it won't make mistakes about the overall direction.

A concrete example. Suppose your project's README has this line:

> "The API response format is uniformly `{ code: 0, data: ..., message: '' }`, where code 0 means success."

When the AI writes API call code, it will automatically handle nested structures like `res.data.data`, because the README gave it this convention.

**Without this convention, the AI will assume the API returns data directly, and then your code will quietly throw an error somewhere inconspicuous.**

## 5. Control the Pace of the Conversation: One Thing at a Time

Many people using Vibe Coding tend to make one mistake: saying too much in one breath.

> "Build me a user management module, including a list page, a detail page, a create form, an edit form, and a delete confirmation modal; the list needs search and pagination, and the forms need validation."

When the AI gets this request, it tries to generate all the code at once. The result is usually a big pile of code that looks complete but is rough in every part — because your request was too "big," and the AI's attention got spread thin.

A better approach is to break it up:

> Round one: "Start with the user list page. I'll give you the backend API later — for now just build a static page skeleton, using Ant Design's Table component for the table."

> Round two (list page done): "Add a search box to the list that searches usernames, with debouncing on the frontend."

> Round three (search done): "Now build the form for adding a user, as a modal, with fields for username, email, and role. Validate the email format."

Each round of conversation focuses on one small goal. The AI can deliver high-quality code in each round, and it's easier for you to review and adjust the direction.

**That isn't inefficiency — it's what real efficiency looks like.** It's like you can't have an intern do five things at once and still expect all five to be done well. Focusing on one thing at a time works best.

## 6. Summary: Four Core Habits

Looking back at these four articles, the core of Vibe Coding really comes down to four habits:

1. **Be clear**: Don't make the AI guess. What you want, what technology to use, what constraints apply — the clearer you are, the better.
2. **Give context**: Let your code, your README, and your project rules speak for you. A written description is no match for showing the AI the code directly.
3. **Don't trust blindly**: Everything the AI writes is a draft. Check every external input, think through every error path, and write tests to verify.
4. **Go step by step**: Break big requirements into small ones and focus on one thing at a time. The AI performs best on small, well-defined tasks.

Master these four habits and you can move out of the trap of "the code AI generates often doesn't work" and into a state where "80% of the code the AI writes doesn't need changes."

Vibe Coding isn't magic; it's the way you and the AI work together. Get the way right and your efficiency doubles; get it wrong and you'd be better off writing the code yourself.

---

The Vibe Coding series ends here. But the world of AI programming changes extremely fast — by this time next year, perhaps half of this content will already be out of date. **But the underlying principles won't go out of date**: express yourself clearly, keep reviewing, iterate step by step, and make good use of context.

A small step forward every day is a new height!
