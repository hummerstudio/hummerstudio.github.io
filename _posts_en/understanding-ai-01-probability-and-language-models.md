---
title: 'Understanding AI (Part 1): What Is AI Actually Learning? — From Probability to Language Models'
date: 2025-11-15
author: Tang Moying
categories: [ai]
tags: [AI, Large Language Models, LLM]
lang: en
alt_url: /post/理解AI-01-概率与语言模型
---


## 1. Starting from the Matter of "Speaking"

Have you ever thought about it: most of what humans say every day is, in fact, predictable?

"The weather today is really—"
Most people would follow with something like "nice".
"Thank you for your—"
Most people would follow with something like "help".
"This thing is really—"
Most people would follow with "awesome", "great", "really useful".

This sounds a little strange, but if you think about it carefully, a great deal of what we say in everyday conversation is, in fact, **predictable**. Not because we have no creativity, but because language itself has very strong regularities.

## 2. What AI Is Doing: Predicting the Next Word

The essence of a large language model (LLM) is actually a **super-powerful "next word predictor"**.

When you say "please help me write an email", AI is not really "thinking" about how to write the email. What it is doing is: based on what you have input, computing from the vast amounts of text it has learned **what the next word most likely is**.

For example, when AI sees the characters "I like eating ap", it will predict that the next word is very likely "ple". Not 100% certain, but a very high probability.

Then it adds "ple" to the input, and predicts the next word again… and so the cycle repeats, until a complete sentence has been generated.

This is the famous **Next Token Prediction** (predicting the next token).

## 3. Why Can AI Do This?

The key lies in two characters: **统计** ("statistics").

During training, AI "reads" vast amounts of text — web pages, books, code, conversation logs… It does not truly understand the meaning of this content, but it is a **super-statistician**, and it can discover:

- the probability of "ple" following "ap" is very high
- "eating" is more likely to follow "I like" than "kicking"
- "is nice" is more likely to follow "the weather today" than "plays football"

When it has seen enough examples, it learns the **statistical regularities** in language. Not by rote memorization, but by grasping the patterns.

This is why ChatGPT can write articles and code and answer questions — not because it truly "understands", but because it has seen so much text that it has an extremely precise "probability distribution" over what word is most likely to follow a given context.

## 4. Probability Distribution: AI's "Space of Imagination"

Speaking of probability distribution, here is an important intuition: **AI is not answering "one question corresponds to one answer"; it is answering "one question corresponds to one probability distribution"**.

Here is an example.

When you ask: "I want to get a pet, any recommendations?"

AI can answer "cat", "dog", "hamster", "rabbit"… any one of them is possible. But which one it chooses depends on many factors — the context, your previous conversation, the model's own "inclinations".

This is why asking AI the same question several times may give you different answers. It is not choosing from a fixed answer bank; it is **sampling** from a probability distribution.

## 5. The Amazing Emergence of Probabilistic Models

Here is a very magical phenomenon: **when a model's scale is large enough and it is trained on enough data, some "unexpected" abilities emerge**.

For example, large models can understand maths problems, write code, and do translation — these abilities were not deliberately taught to them during training. The reason they "emerge" is that the model **taught itself** the associations between these patterns from vast amounts of text.

Scale is the key. A small model cannot translate well, but a large model can; a small model cannot do maths problems, but a large model can. This **emergent ability** is one of the most fascinating things about LLMs.

## 6. What the Essence Is

Back to the question in the title: what is AI actually learning?

It is not learning knowledge, not learning logic, not learning reasoning. What it learns is: **the statistical relationships between words in language**.

By doing statistics over vast amounts of text, it discovers the patterns in language, and then uses that set of patterns to "predict" the next word. This prediction is precise enough and diverse enough that it looks as if it is "thinking" and "understanding".

This is not magic; it is the victory of super-statistics.

Once you understand this, you will see AI's strengths and limitations:

- **Strengths**: content that is rich in language patterns and has clear regularities — writing articles, code, emails, summaries, translations
- **Limitations**: when what is needed is precise factual reasoning, long-range logic, or knowledge "outside language", it may "talk nonsense with a perfectly straight face"

Because at heart it is **generating the text that is most likely correct**, not **guaranteeing that the facts are correct**.

---

In the next article, we will talk about a very basic but very important question: **What is a Token? How does AI "read characters"?**

A small step forward every day is a new height!

