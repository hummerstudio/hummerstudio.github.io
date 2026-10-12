---
title: 'Vibe Coding (Part 1): You''re Not Writing Code, You''re Describing Requirements'
date: 2026-01-03
author: Tang Moying
categories: [ai]
tags: [AI, Vibe Coding, AI Programming, Large Language Models]
lang: en
alt_url: /post/vibe-coding-01-什么是vibe-coding
---


## 1. Two Ways of "Cooking"

Imagine you want to cook a meal.

**The traditional way**: you walk into the kitchen yourself, wash the vegetables, chop them, control the heat, season the dish — every step done with your own hands. You know when to flip it over, you know how much salt to add, you know whether the heat is right. You are the chef.

**The Vibe Coding way**: you sit at the table and tell a very capable chef: "I'd like a hot-and-sour dish, with a bit of Southeast Asian flavor, not too greasy, and ideally some seafood." The chef goes off and cooks it, brings it out, you taste it and say, "A bit more sour, and go easy on the chili." The chef adjusts and brings it out again, and you say, "That's about the taste I was after."

That is the essence of Vibe Coding — **you no longer write every line of code yourself; instead you describe what you want in natural language and let the AI generate the code.**

## 2. What Has Changed? What Hasn't?

The name Vibe Coding comes from Andrej Karpathy (one of the co-founders of OpenAI), who put the concept forward in early 2025. The core idea is: **you don't need to care about "how to write it," only about "what you want."**

Let me illustrate with a practical example.

Suppose you want to write a function that formats the phone number a user enters.

**In traditional programming**, your brain is thinking:
- Which string-handling function should I use? `slice` or `substring`?
- How do I write the regular expression? Is `/^1[3-9]\d{9}$/` right?
- Edge cases: what if the user typed spaces? What if they typed a `+86` prefix?
- Which file should this code go in? What should the function be called?

**In Vibe Coding**, your brain is thinking:
- I want the phone number displayed in the `138-1234-5678` format
- If the user enters spaces or dashes, strip them out first
- If the input isn't valid, don't crash — show a message
- This is a utility function, so it goes in `utils/format.js`

You tell all this to the AI, and the AI writes the code. You read the code, run the tests, and if there's no problem you move on.

**The core change**: your role goes from "implementer of code" to "definer of requirements + reviewer of code."

**What hasn't changed**: you still need to know what good code looks like, what a sound architecture looks like, what the correct business logic is. Vibe Coding isn't about throwing your programming knowledge away; it's about putting more of your energy into **thinking at a higher level**.

## 3. What Scenarios Does It Suit?

Vibe Coding isn't a silver bullet. It's especially useful in some scenarios and calls for caution in others.

**Scenarios it suits especially well:**

- **Rapid prototyping and MVPs.** You want to validate an idea and stand up something runnable in 30 minutes — Vibe Coding is extremely fast.
- **Repetitive code.** CRUD endpoints, form validation, data-format conversion — for code like this with fixed patterns, the AI writes fast and accurately.
- **Languages or frameworks you're not familiar with.** You know Python but need to write a bit of SQL, you know the front end but need to put together some Nginx configuration — just tell the AI what you want.
- **Exploratory programming.** "Turn this API's response data into a chart and let's have a look" — try it quickly, and if it doesn't work, change direction.

**Scenarios that call for caution:**

- **Core algorithms or complex business logic.** You need to genuinely understand what this code is doing; you can't settle for "it looks like it runs."
- **Security-sensitive code.** User authentication, payments, permission control — the AI may write code with security holes.
- **Large refactors that require deep contextual understanding.** The AI doesn't know the whole shape of your project, and changing one place may affect something far away.

A good rule of thumb: **if this code breaks, can you fix it yourself within 5 minutes?** If so, use Vibe Coding with confidence. If not, you're on firmer ground writing it yourself.

## 4. Vibe Coding Is Not "Letting the AI Write Code for You"

This is an easy place to misunderstand.

Vibe Coding is not "I toss my requirements at the AI and then go get coffee." It's more like **a collaboration between you and the AI**:

1. You describe the requirement (the prompt)
2. The AI generates code
3. You read the code and understand it
4. You suggest changes
5. The AI revises
6. You test and review
7. Repeat until you're satisfied

Throughout the whole process, **you are always the one in charge**. The AI is your accelerator, not your replacement.

It's like an experienced master craftsman with a quick-handed apprentice — the master says "sand that piece of wood smooth," the apprentice sands it, the master inspects it and says "this side still isn't smooth enough," and the apprentice keeps sanding. The work gets done, but **what it ultimately turns into is the master's call**.

## 5. The Core Skills You Need

Since the role has changed, so have the skills required:

- **The ability to describe requirements**: can you say what's in your head clearly? This is the most important basic skill in Vibe Coding.
- **The ability to read code**: you should at least be able to follow what the AI's code is doing. You don't need to be a source-level expert, but you need to be able to follow the flow of logic.
- **A reviewing instinct**: does this code handle its edge cases? Will it have performance problems? Are the exception paths covered?
- **The ability to break problems down**: split big requirements into small ones, and small ones into smaller ones. Rather than having the AI write 500 lines in one go, write 100 lines five times.

Put simply: **you don't need to be the best driver, but you need to know where the destination is and how the road goes.**

## 6. A Real Workflow

Suppose I want to build a web page that shows the current weather — you just type in a city name.

I won't say: "Build me a weather website."

I'll say:

> "Use HTML + JS to build a single-page weather lookup tool. The input box takes a city name in English, calls the free Open-Meteo weather API, and once the response comes back displays the current temperature, conditions, humidity and wind speed on the page. Keep the styling clean and mobile-friendly. Don't use any framework — plain HTML + JS."

After the AI generates the code, I look it over:
- Is the API call right?
- Is there error handling? (What if the city doesn't exist? What if the network drops?)
- Is the HTML structure semantic?
- How does the styling look on a phone?

When I find a problem, I keep the conversation going:
> "When the request fails the page just goes blank right now — add an error message. Also, pressing Enter in the input box should trigger the lookup too."

And so it goes, iteration after iteration. **This isn't "the AI writing code for me," it's "me pair-programming with the AI."**

---

In the next article we'll talk about the most important basic skill in Vibe Coding: **how do you talk to an AI? How do you turn a fuzzy requirement into a good piece of code?**

A small step forward every day is a new height!
