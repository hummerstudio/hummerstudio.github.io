---
title: 'Understanding AI (Part 4): Temperature and Top-P — the AI Creativity Knob'
date: 2025-11-23
author: Tang Moying
categories: [ai]
tags: [AI, Temperature, Top-P, Large Language Models, LLM, Sampling]
lang: en
alt_url: /post/理解AI-04-Temperature与TopP
---


## 1. The Same Question, Different Answers

Have you noticed that if you ask AI the same question several times, the answers you get may be different?

Sometimes AI answers very "conservatively" — precise but a bit boring; other times it is very "jumpy", full of creativity but possibly off topic.

This is not AI "freestyling at random"; it is the **sampling parameters** at work.

The two most critical parameters among them are **Temperature** and **Top-P**.

## 2. From a Probability Distribution to "Rolling Dice"

Recall the core of the first article: at heart, AI is doing "next Token prediction".

When AI is about to generate the next word, it actually has a **probability distribution** — every possible word has a probability value. For example:

```
“今天天气” 后面：
- “Good”  →  35%
- “Very good”  →  25%
- “Great”  →  20%
- “Very good”  →  10%
- Other    →  10%
```

AI does not pick the one with the highest probability; it **"rolls dice" to sample from this probability distribution**.

Why sample? Because that lets the answers have variation, instead of being exactly the same every time.

## 3. Temperature: Controlling How Much "Randomness"

**Temperature** is a parameter that controls randomness.

Its range of values is usually **0 to 2** (some models may differ).

How it works:

| Temperature value | Effect | Description |
|---------------|------|------|
| **0** | Almost deterministic | Always picks the word with the highest probability; the answer is almost fixed |
| **0.7** | Moderate | There is randomness, but it won't go too far off |
| **1.0** | Original distribution | Samples according to the model's original probability distribution |
| **1.5 - 2.0** | High randomness | Very "jumpy", possibly surprising |

### 3.1 The Mathematical Principle Behind Temperature

Temperature is essentially **"re-weighting" the probability distribution**.

Original probability distribution:
```
P = [0.35, 0.25, 0.20, 0.10, 0.10]
```

After Temperature is applied:

- **T < 1**: the probability distribution becomes "sharper", and high-probability words are more likely to be selected
- **T > 1**: the probability distribution becomes "flatter", and low-probability words also get a chance to be selected

Mathematically, this is done by dividing the logits (the raw scores) by T before the Softmax:
```
P_i = softmax(logit_i / T)
```

As T → 0, all the probability concentrates on the highest word; as T → ∞, the probabilities of all words tend toward equality.

### 3.2 When to Use a High Temperature? When to Use a Low One?

**Low Temperature (0 - 0.3)**:

- When you need deterministic answers: writing code, doing translation, summarizing facts
- Scenarios where you don't want creative improvisation
- Formatted output (such as JSON)

**High Temperature (0.7 - 1.2)**:

- When you need creative improvisation: writing stories, brainstorming, coming up with names
- Scenarios where you want the answers to have variety
- Open-ended question and answer

## 4. Top-P: Controlling the "Candidate Range"

**Top-P (also called Nucleus Sampling)** is another parameter that controls randomness.

Its range of values is **0 to 1** (usually around 0.9).

Top-P works like this: **start selecting from the highest-probability word, accumulate the probabilities, until you reach P**.

Take an example, P = 0.9:

```
排序后的概率分布：
- “Good”  →  35%
- “Very good”  →  25%  → cumulative 60%
- “Great”  →  20%  → cumulative 80%
- “Very good”  →  10%  → cumulative 90%  ← exceeds P, stop!
```

In the end, only these four words — ["不错", "很好", "很棒", "很好"] — become candidates, and the other words with very low probability are excluded.

### 4.1 An Intuitive Way to Understand Top-P

You can think of it as: **"I only consider the high-probability words whose probabilities add up to 90% of the total; I don't consider the other, too-rare words"**.

- Top-P very small (such as 0.1): only the few most certain words are selected; the answer is conservative
- Top-P very large (such as 0.95): the candidate range is very large, and some less certain words may be selected

## 5. The Relationship Between Temperature and Top-P

These two parameters are often used together, and they control the same thing — **the way words are sampled from the probability distribution**.

| Parameter | Dimension controlled | Description |
|------|---------|------|
| Temperature | The "shape" of the probability distribution | Controls how much overall randomness there is |
| Top-P | The number of candidate words | Controls how far into the "head" only words are considered |

In actual use, usually:

- Tune only Temperature, with Top-P set to 1 (no extra restriction)
- Or tune both parameters at the same time
- In extreme cases, Temperature = 0 + Top-P = 0.1 gives you very deterministic output

## 6. A Practical Example

Suppose we ask AI to come up with a project name:

**Prompt**: "Help me come up with a name for a newly developed note-taking app"

With **Temperature = 0**:
> "Spirit Note"
> Ask again, and it is still "Spirit Note"

With **Temperature = 0.8**:
> First time: "Ink Language Note"
> Second time: "Light Note"
> Third time: "Cloud Letter Note"

With **Temperature = 1.5**:
> First time: "Quantum Ink"
> Second time: "Memory Drift Bottle"
> Third time: "Ripples of Thought"

As you can see, the higher the temperature, the more creative the names, but also the more "floaty" they get.

## 7. What the Essence Is

Temperature and Top-P are both **sampling parameters**, and they control "how words are chosen from the probability distribution".

- Temperature controls the overall degree of randomness by re-weighting the probability distribution
- Top-P controls how "conservative" the sampling is by limiting the number of candidate words

These two parameters make it possible for AI's output to go from "mechanically fixed" to "randomly creative". They are the key to AI turning from a "search engine" into a "creative partner".

Once you understand these two parameters, you hold the first key to adjusting AI's behaviour.

---

In the next article, we will talk about a more fundamental question: **Embedding — how does AI "understand" semantics? Why can it tell that two pieces of text mean something similar?**

A small step forward every day is a new height!

