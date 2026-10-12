---
title: 'Vibe Coding (Part 2): Treating the AI as a New Intern'
date: 2026-01-10
author: Tang Moying
categories: [ai]
tags: [AI, Vibe Coding, AI Programming, Prompt]
lang: en
alt_url: /post/vibe-coding-02-如何与ai对话
---


## 1. A Universal Mental Model

If you can only remember one technique from Vibe Coding, remember this one: **treat the AI as a new intern.**

Think about it — what is an intern who just joined the team like:

- Very capable, learns fast, knows a little bit about everything
- But doesn't understand your project, doesn't know your coding standards, doesn't know the ins and outs of the business
- If the task you give him is too vague, he'll guess — and there's a good chance he'll guess wrong
- If the task you give him is clear enough, he does it fast and well
- When he's done you need to check his work, because newcomers tend to miss edge cases

Sound exactly like an AI?

The beauty of this mental model is: **you don't need to learn any of the jargon of prompt engineering — just think about how you'd assign the task if you were mentoring an intern, and then say the same thing to the AI.**

## 2. Vague Requirements vs. Clear Requirements

Let's look at two versions of the same conversation.

**A bad requirement**:

> "Write a login feature."

The intern takes this task and his head is full of question marks: which framework? Is the username an email or a phone number? Is there a verification code? What are the password rules? Where is the token stored? How long until the session expires?

The AI is the same. It guesses at an implementation, and odds are it isn't what you wanted.

**A good requirement**:

> "Implement a simple login endpoint with Express.js + JWT. The user enters an email and password; after the backend verifies them it returns a JWT token. Passwords are stored encrypted with bcrypt. The token is valid for 7 days. Do basic validation of the email format (just make sure there's something before and after the @ symbol)."

The intern takes this task and immediately knows what to do.

See, the difference isn't in how long the requirement is; it's in **whether your requirement eliminates ambiguity**. Every ambiguity you remove earns the AI one more point.

## 3. What a Good Prompt Looks Like

There's no mysterious formula needed. A good prompt usually contains these elements:

**Goal**: what am I trying to do? (a function / a page / an endpoint)
**Input**: what data will it receive? In what format?
**Output**: what result do you expect? In what format?
**Constraints**: what technology to use? What limits apply? What must it not do?
**Context**: what environment will this code run in? Which parts of the project does it touch?

For example, say I want to build a data-masking function:

> Goal: write a data-masking utility function `maskSensitive`
>
> Input: two parameters — `data` (an object), `fields` (an array of the field names to mask)
>
> Output: return a new object in which the values of the specified fields are replaced with `***`
>
> Constraints:
> - Write it in TypeScript
> - `data` must not be nested more than 2 levels deep (only handle one level of nesting like `data.field`)
> - If a field in `data` doesn't exist, just skip it — don't throw an error
> - Don't use third-party libraries like lodash

This prompt isn't complex, but it's very information-dense. The AI hardly has to guess anything, so the code it generates will most likely match your expectations.

## 4. Iterative Dialogue: Coarse First, Then Fine

You don't have to get the prompt perfect from the start. A more practical approach is **coarse first, then fine**.

**Round one (coarse)**: "Write a counter component in React with plus and minus buttons."

The AI generates code. You take a look:
- Can the number go below 0? I don't want it going negative.
- Something seems to be missing… right, add a reset button.
- The styling is too ugly; at least align it.

**Round two (fine)**: "It can't go below 0. Add a reset button that returns it to zero. Line the three buttons up horizontally and show the number in the middle."

The AI makes the changes. You're basically satisfied. Then you think a bit more:
- Can the current value be saved to localStorage so it survives a page refresh?

**Round three (finer)**: "Save the current value to localStorage and read it back when the page loads. Use `counter_value` as the key, and be careful to handle the case where JSON parsing fails."

This is the real rhythm of Vibe Coding. **You're not writing a requirements document; you're having a conversation with the AI.** Saying too much at once tends to make a mess; split it into several rounds, solve one problem per round, and it works better.

## 5. Letting the AI See Your Code Is the Best Prompt

A lot of people don't know this: **giving the AI your code is more effective than giving it your description.**

For example, suppose you say:

> "Help me add a CSV export feature, with the format based on the data in the table."

The AI may spend ages guessing.

But if you say:

> "Help me add a CSV export feature to this page." (and then paste in the code for the current page as well)

The AI sees your real data structures, how your existing components are written, the framework version you're using — and the code it generates needs almost no changes.

This is why many AI programming tools (Cursor, CodeBuddy, Copilot) support **@file references** — letting the AI read your project code directly is more precise than any written description.

## 6. A Counterintuitive Trick: Saying "No" to the AI

When the AI gets something wrong, many people's first reaction is to fix the code by hand themselves. That actually wastes Vibe Coding's biggest advantage.

The better approach is: **tell the AI what's wrong and let it fix it itself.**

For example, the code the AI wrote uses a utility function you've already deprecated:

Don't say "forget it, I'll fix it myself." Say:

> "The `formatDate` function is deprecated; we're replacing it with `dayjs`. Please switch to `dayjs(date).format('YYYY-MM-DD')`."

Once you build this habit, you'll find yourself getting lazier and lazier — but your code output gets faster and faster. Because you're training the AI to understand your project instead of explaining everything from scratch every time.

---

In the next article, we'll talk about a key safety mindset: **why can't you blindly trust code written by an AI? What typical mistakes does it make?**

A small step forward every day is a new height!

