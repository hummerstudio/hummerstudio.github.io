---
title: 'Understanding AI (Part 3): Context Windows — How Short-Term Memory Works in AI'
date: 2025-11-22
author: Tang Moying
categories: [ai]
tags: [AI, Context Window, Large Language Models, LLM]
lang: en
alt_url: /post/理解AI-03-上下文窗口
---


## 1. "Amnesia" in Long Conversations

Have you ever run into this? 

After chatting with an AI for quite a while, you bring up some detail from the beginning, and the AI can't seem to "remember" it? Or the AI starts contradicting itself, with statements that don't line up?

This isn't the AI getting dumber — it has run into the limits of the **context window**.

## 2. What Is a Context Window?

**A context window = the total number of tokens the AI can "see."**

Remember tokens from the previous article? The unit in which AI processes text is the token. Every AI model has a maximum token count, and that is the context window.

For example, one version of GPT-4 has a context window of 32,768 tokens. This includes:

- all the text you type in
- all the answers the AI generates
- all the conversation history in between

**When the token count exceeds that ceiling, the earliest content gets "squeezed out."**

## 3. An Analogy: Flipping Through a Book

Imagine this scenario:

You have a super-thick book containing an enormous amount of information. But your desk can only hold a fixed number of pages (say, 100).

When you want to discuss the content from page 1 to page 300 of the book, you can't lay all those pages on the desk at once. All you can do is:

1. Flip to the relevant page
2. Flip it away once you've read it
3. Flip back when you need it again

But if the book's logic is "pages must be flipped in order," then you can only see the most recent 100 pages you flipped to. The earlier pages have already been flipped away.

**The context window is the AI's "desk," and tokens are the "page count."**

When the conversation gets too long, the early content gets "flipped away," and the AI "forgets" it.

## 4. KV Cache: The AI's "Bookmarks"

Technically, implementing a context window relies on a mechanism called **KV Cache**.

In the Transformer architecture (the foundation of modern LLMs), every time it generates a token, the AI has to "look back" over all the previous tokens. This process is called **Attention**.

But Attention is computationally expensive — if every new word required recomputing all the historical tokens, performance would be terrible.

The KV Cache solution is:

> Cache the Keys and Values that were computed earlier, so that each time a new token is generated, only the Attention for the newly added token needs to be computed and then merged with the cached results.

It's like slipping bookmarks into the important pages while flipping through a book. Next time you flip back, you don't have to search again — you go straight to the bookmark.

## 5. Why Is the KV Cache Also Limited by the Window?

Although the KV Cache speeds up computation, what it stores is **the Key-Value pairs of every historical token**.

These caches take up VRAM (GPU memory). The larger the context window, the more Key-Value pairs must be stored, and the higher the demand on VRAM.

So the size of the context window is limited by:

1. **Algorithm design**: the maximum length the model architecture itself supports
2. **Hardware conditions**: how much KV Cache the GPU memory can hold

This is why some models "support ultra-long contexts" but in practice need more GPU resources to run.

## 6. What Happens When the Context Window Fills Up?

When the total token count of a conversation approaches the context window limit, there are usually two ways to handle it:

### 6.1 Truncation

The conversation history at the very front gets "chopped off," keeping only the most recent part.

This causes the AI to forget:

- the background information from the beginning
- the user's preference settings
- earlier agreements or conclusions

### 6.2 Summarization

A smarter approach: periodically "compress" the early conversation into a summary, keeping the core information and discarding the details.

That way you can:

- keep the important context
- reduce the token count
- let the AI keep "remembering" the key information

But summarization inevitably loses some details, and that can lead to:

- the AI citing certain details inaccurately
- a slight drop in the conversation's consistency

## 7. Practical Suggestions for Real Use

Now that you understand the limits of the context window, here's what you can do when actually using AI:

1. **Summarize proactively in long conversations**: every so often, have the AI summarize the key conclusions so far, easing the burden on the context

2. **Put important information at the beginning or the end**: because truncation usually happens in the "middle," content at the start and the end is more likely to survive

3. **Split long documents when processing them**: if you want the AI to analyze a whole book, process it in sections first and synthesize at the end

4. **Avoid nagging**: some users keep hammering on the same point, which is actually unnecessary — the AI has already "remembered" it

## 8. What It Really Is

The context window is the upper limit on the total number of tokens the AI can handle at once; fundamentally, it's a capacity limit on **"working memory."**

The AI isn't really "memorizing" the conversation; it re-reads the "book" every time — feeding the conversation history in as input and processing it all together. The larger the window, the more "context" it can handle at once, but the greater the computation and VRAM consumption.

KV Cache is the key technique for efficient inference: by caching the results of past computations, it avoids recomputing them. But it too is limited by VRAM and cannot scale indefinitely.

Once you understand the context window, you understand the AI's "memory" mechanism and why long conversations run into trouble.

---

In the next article we'll talk about an interesting topic: **Temperature and Top-P — the AI's "creativity knobs," and why tweaking a parameter changes the answer?**

A small step forward every day is a new height!
