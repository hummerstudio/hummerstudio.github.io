---
title: 'Understanding AI (Part 2): What Is a Token? — How AI Reads and How Tokenisation Works'
date: 2025-11-16
author: Tang Moying
categories: [ai]
tags: [AI, Token, Tokenization, Large Language Models, LLM]
lang: en
alt_url: /post/理解AI-02-Token与分词
---


## 1. Token? Not Just a "Word"

If you have used ChatGPT or another large language model, you have certainly come across the phrase "billed by Token". How much do 1K tokens cost, how much do 100K tokens cost.

So what exactly is a Token?

A common misconception is that **1 Token = 1 English word**.

That is half right, but not entirely right. To be precise, a Token is the **basic unit** with which AI processes text, but its size is not fixed.

## 2. How Does AI "Split Up" Text?

AI does not process text by "words" or by "Chinese characters"; it uses a tokenisation algorithm called **BPE (Byte Pair Encoding)**.

BPE's core idea is very plain:

> Merge the character combinations that most often appear together into a "new character".

An example. Suppose AI reads a large amount of English text and finds that:

- "e" appears on its own very frequently
- "r" appears on its own very frequently
- but the combination "er" appears even more frequently

Then BPE will merge "er" into a single Token.

Continue the process:

- "er" + "er" → "erer"
- "er" + " " → "er "
- ...

In the end, AI forms a "vocabulary" of its own, in which every Token is a **high-frequency combination that keeps recurring**.

## 3. English vs Chinese: Why Are the Token Counts Different?

This is the key to understanding Tokens.

**Tokens in English text ≈ number of words × 0.75**

Because an English word usually corresponds to 1-2 Tokens. For example, `hello` is one Token, while `artificial` may be split into two: `art` + `ificial`.

**Tokens in Chinese text ≈ number of characters × 1.5 to 2**

Because Chinese has no natural "spaces" as separators, AI has to combine consecutive Chinese characters into Tokens. A typical Token may be 1-2 Chinese characters.

An example:

| Text | English Token count (est.) | Chinese Token count (est.) |
|------|-------------------|-------------------|
| `Hello, world!` | ~3 | - |
| 你好，世界！ | - | ~6-8 |

This is why **conversing with AI in Chinese usually consumes more Tokens in practice**.

## 4. Some Interesting Properties of Tokens

### 4.1 Incomplete Words

BPE tokenisation may **split a complete English word in half**, putting the two halves in different Tokens.

For example, `tokenization` may be cut into:

- `token` + `ization`

This is not a bug but the normal behaviour of the BPE algorithm — what it pursues is **encoding efficiency**, not "semantic completeness".

### 4.2 How Numbers Are Split

Numbers are a real "luxury" in AI's eyes.

Every digit character (0-9) is essentially a separate Token. The larger the number, the more Tokens:

- `1` → 1 Token
- `123` → 3 Tokens
- `1234567890` → 10 Tokens

This is also why AI is often imprecise with numbers — the digits get chopped into pieces and lose their "sense of magnitude".

### 4.3 The Token Efficiency of Code

Interestingly, AI's Token efficiency with code is often higher than with English text.

Because code is full of repeated patterns: variable names, function names, keywords… These high-frequency combinations are quickly merged into single Tokens.

So for the same 1000 Tokens, code often conveys more information than ordinary text does.

## 5. Token Limits: AI's "Memory Window"

Every AI model has a **Token limit** (context window), for example:

- GPT-3.5 Turbo: 16K / 128K Tokens
- GPT-4: 8K / 32K / 128K Tokens
- Claude 3: 200K Tokens
- Claude 3.5: 1M Tokens (an ultra-long context)

This limit covers the total number of Tokens for both **input** and **output**.

When you talk to AI:

- Your question counts as Tokens
- AI's answer counts as Tokens
- The earlier conversation history also counts as Tokens

If the conversation gets too long and exceeds this limit, AI "forgets" the earlier content — not really forgetting: **the earliest part gets "trimmed off"**.

This is why AI shows signs of "amnesia" in long conversations.

## 6. Why Understanding Tokens Matters

Once you understand Tokens, you can:

1. **Estimate the cost**: know roughly how many Tokens a piece of text will consume
2. **Optimise prompts**: cut Token consumption by trimming how much you say
3. **Understand AI's behaviour**: why long texts are handled badly, why arithmetic is imprecise
4. **Use AI better**: know how to organise information so that AI grasps your intent more efficiently

## 7. What the Essence Is

A Token is the **basic unit** with which AI processes text; it is not a natural unit of language.

Using algorithms such as BPE, AI cuts text into high-frequency "word chunks". The size of these chunks is not fixed: for English it is usually 0.75 times the number of words, for Chinese usually 1.5-2 times the number of characters.

The concept of the Token explains a whole series of questions: AI billing, long-context limits, number handling. Understand Tokens and your knowledge of AI goes one level deeper.

---

In the next article we will talk about a question that confuses many people: **what is a context window, and why does AI get "amnesia"?**

A small step forward every day is a new height!

