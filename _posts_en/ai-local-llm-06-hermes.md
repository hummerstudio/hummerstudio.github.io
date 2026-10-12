---
title: 'Local LLM in Practice (Part 6): Hermes Agent — a Self-Evolving AI Agent with Memory and Learning'
date: 2026-05-09
author: Tang Moying
categories: [ai]
tags: [AI, Hermes, AI Agent, Memory Systems, Self-Learning, Skill Creation, Open Source]
lang: en
alt_url: /post/ai-local-llm-06-hermes
---

When we talked about OpenClaw last time, I mentioned that its biggest weakness is its memory system — you have to teach the Agent all over again every time, and it can't remember your preferences or your project context. This isn't a problem unique to OpenClaw; it's a common failing of most AI Agents today: models keep getting stronger, yet every time you chat, the Agent acts like it's meeting you for the first time. Hermes Agent was built precisely to tackle this problem. Its core selling point isn't "a stronger AI" but "an AI that understands you better the more you use it".

<!--以上为摘要内容-->

## 1. What Is Hermes Agent

Hermes Agent is developed by the Nous Research team, released in February 2026, and open-sourced under MIT. Nous Research has a solid reputation in the open-source large-model scene — the Hermes series of models they released (fine-tuned from Llama) stand out in tool calling and instruction following. Hermes Agent is their foray into the Agent space, extending "tool-calling ability at the model level" into "a persistent Agent system with memory".

As of June 2026, Hermes Agent has tens of thousands of GitHub stars. That doesn't match OpenClaw's 190,000, but its focus is narrower — **memory and self-learning**.

## 2. The Three-Layer Memory Model

The most central design of Hermes Agent is its memory architecture — the "tripartite memory model":

**Procedural memory (SKILL.md)**: the operational skills the Agent has mastered. Things like "how to create a Git branch", "how to deploy a service on K8s", "how to analyze the performance bottleneck of a piece of code". These are all reusable operational knowledge.

**Episodic memory (MEMORY.md)**: the historical experience of the Agent's interactions with the user. Things like "last time you refactored UserService because you found its time complexity was O(n²)", "you prefer ciphertext comparison over direct string comparison for security checks". These are experiences automatically extracted and distilled from one conversation after another.

**Semantic memory (USER.md)**: the user profile. Things like "you are a backend developer, mainly using Go and Python", "your code style preference is concise naming and thorough unit tests", "you don't like JWT and prefer to use Session".

The division of labor between the three layers is clear: procedural memory is "I know how to do it", episodic memory is "I remember what you've done", and semantic memory is "I know who you are".

## 3. Hands On: Installation and First Use

**Install**:

```bash
pip install hermes-agent
```

**Initialize** (create your personal Agent):

```bash
hermes init
```

This command walks you through configuring a model (OpenAI-compatible interfaces are supported, so you can point it at a local vLLM/Ollama), setting a working directory, and creating the initial SKILL.md / MEMORY.md / USER.md files.

**Connect to the local vLLM from the first article**:

```bash
hermes init --provider openai_compatible \
  --base-url http://your-gpu-server:8000/v1 \
  --model qwen2.5-14b-instruct \
  --api-key not-needed
```

**First interaction**:

```bash
hermes chat "map out the current project's directory structure and tell me what each module does"
```

After the interaction ends, check `~/.hermes/MEMORY.md` — you should be able to see that the Agent has already automatically extracted the key information from this conversation.

## 4. Active Learning: Not Just "Remembering" but "Learning on Its Own"

The three-layer memory taxonomy isn't anything fresh — plenty of systems have a similar layering of memory. The real highlight of Hermes Agent is its **active learning mechanism**.

Most Agents' memory is passive: it remembers whatever you tell it. If you don't tell it, it doesn't know. OpenClaw works this way — its memory files are maintained by hand.

Hermes Agent does it differently. Every time an interaction with you ends, it **asynchronously reviews the conversation in the background**, automatically extracting reusable knowledge from it:

```text
对话内容：
你: "帮我把这段数据处理的时间复杂度从 O(n²) 优化到 O(n log n)"
Hermes: [完成优化，使用哈希表替代了嵌套循环]

后台学习：
Hermes 从这次交互中自动提取：
→ added to MEMORY.md: "the user cares about algorithmic performance and asked for O(n log n) complexity in the last data-processing task"
→ if a similar pattern appears repeatedly, it is auto-generated into SKILL.md: "performance optimization preference - prefer hash tables over nested loops"
```

By the time the next, completely different task comes along, the Agent's behavior has already been shaped by the earlier experience:

```text
新对话（完全不同的任务）：
你: "帮我写一个数据去重的方法"
Hermes: [生成使用 Set 的 O(n) 方案，而不是简单的 O(n²) 双重循环]
        [because it learned your performance preference from previous experience]
```

That's the value of active memory: **the Agent doesn't just answer questions — it comes to understand you better with every interaction.**

## 5. Automatic Skill Creation

The extension of active learning is **automatic skill creation**. Once you and the Agent have solved a complex problem together, the Agent can distill the whole process into a reusable skill:

- You teach the Agent a workflow of "code review → run tests → check coverage → submit a PR"
- The Agent automatically packages that workflow into a Skill
- Next time you say "review this PR using the same process as last time", the Agent runs the whole workflow automatically

Hermes Agent's skills follow the **agentskills.io** open standard. This isn't a standard you can only use on Hermes — in theory any Agent framework that supports the standard can load these skills. Skills are shareable across platforms.

## 6. Other Capabilities

**Parallel sub-Agents**. Hermes Agent can spawn isolated sub-Agents to handle tasks in parallel. Sub-Agents consume almost none of the shared context window between them, which means you can push several independent tasks forward in parallel without your token consumption rising.

**Multi-platform messaging gateway**. Supports Telegram, Discord, Slack, WhatsApp, CLI and other platforms. It doesn't connect as many platforms as OpenClaw's 50+, but the coverage is already enough for everyday use.

**Scheduled automation**. A built-in cron scheduler supports unattended tasks such as overnight backups, daily reports and scheduled inspections.

**MLOps support**. Hermes Agent can generate tool-call traces for model fine-tuning and reinforcement learning training. If you plan to train your own Agent model, Hermes can provide the training data. Most users won't need this capability for now, but it embodies an idea — "an Agent can improve itself": once enough data has accumulated, you can use it to train a model that understands you better.

## 7. Comparison with OpenClaw

The previous article covered OpenClaw in detail; here is a direct comparison:

| Dimension | OpenClaw | Hermes Agent |
|------|----------|-------------|
| Core positioning | Local Agent gateway (execution) | Self-evolving Agent (memory + learning) |
| Memory system | Passive (files maintained by hand) | Active (tripartite model + automatic extraction) |
| Learning ability | No automatic learning | Self-learning loop + automatic skill creation |
| Skill ecosystem | 13,000+ community skills on ClawHub | agentskills.io open standard, skills generated automatically |
| Messaging platforms | 50+ | 6+ (Telegram/Discord/Slack/WhatsApp/CLI) |
| Development language | TypeScript (Node.js) | Python |
| Enterprise investment | Higher (needs a server) | Lower (a $5/month VPS is enough) |
| Strengths | Broad: many platforms, many Agents, many skills | Deep: strong memory, self-learning, better with use |

The two tools are almost complementary in positioning. OpenClaw is strong in **"breadth"** — many platforms, many Agents, an enterprise-grade gateway. Hermes is strong in **"depth"** — self-evolving memory, getting smarter with use, low-cost and lightweight.

This isn't a question of "which is better". It's whether you want a gateway that can connect to everything but has an average memory, or an assistant that lives only in the terminal but understands you better and better.

## 8. Why Memory Is the Agent's Moat

Finally, I want to expand on a question that's easy to overlook: **why is the memory system the Agent's real moat?**

You might think an Agent's core competitiveness is model capability — whoever has the stronger model has the better Agent. But model capability is a commodity. Today your Agent uses GPT-5; tomorrow Hermes supports it too, and the day after OpenClaw connects to it as well. The gap at the model level will only get smaller.

But memory doesn't commoditize. After 100 interactions with your Hermes, it has remembered your preferences, your project structure, your code style, your frequently used commands — and this Hermes becomes irreplaceable to you. Even if another Agent connects to a stronger model, you won't switch, because switching means **teaching an apprentice from scratch all over again**.

It's like a good work partner. After three months on a project together, he knows when you need a code review, what kind of commit message format you like, and which kind of Bug you hate most. Swap him for someone else — maybe more capable — and the rapport has to be rebuilt.

**Memory is the rapport between an Agent and its user.**

This is also why, although Hermes wasn't as hot as OpenClaw when it launched, many OpenClaw users end up noticing Hermes after using it heavily — because once they get used to "having an Agent do things for me", they naturally ask: can this Agent remember everything I've done? And Hermes happens to be the one that pushes the single dimension of memory to its extreme.

## 9. Summary

From OpenCode to Cline to OpenHands to OpenClaw to Hermes Agent, six articles cover the complete chain from "using AI to write code" to "letting AI remember you":

| Tool | Problem it solves |
|------|-----------|
| OpenCode | Write code in the terminal without vendor lock-in |
| Cline | Program autonomously in the IDE with Plan/Act mode |
| OpenHands | Let AI complete development tasks autonomously in a sandbox |
| OpenClaw | Let AI do work beyond programming and chain tools together |
| Hermes Agent | Let AI remember your preferences and get smarter with use |

All six tools are open source and all support local deployment. As a DevOps engineer building AI infrastructure on an intranet, you don't need to adopt every one of them — but you do need to know what problem each one solves and when to use which. My own take: figure out each tool's positioning first, then choose based on your team's actual pain points, rather than chasing stars blindly.

A small step forward every day is a new height!
