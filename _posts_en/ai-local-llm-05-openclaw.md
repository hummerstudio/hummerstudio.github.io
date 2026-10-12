---
title: 'Local LLMs in Practice (Part 5): OpenClaw — A Local Agent Gateway That Gives LLMs "Digital Hands and Feet"'
date: 2026-05-02
author: Tang Moying
categories: [ai]
tags: [AI, OpenClaw, AI Agent, Agent Gateway, Local Execution, Messaging Platforms, Open Source]
lang: en
alt_url: /post/ai-local-llm-05-openclaw
---

The previous three articles all covered agents in the programming domain — OpenCode writes code, Cline executes tasks inside the IDE, and OpenHands autonomously completes the whole development workflow. But an LLM's abilities don't stop at programming. If you want an LLM to manage files for you, drive a browser, run scheduled inspections of your services, or even respond to your instructions at any moment inside the messaging apps you already use (WeChat / Feishu / DingTalk) — what you need is an agent gateway, not a programming tool. That's exactly what OpenClaw does.

<!--以上为摘要内容-->

## 1. The Story of 190,000 Stars in Three Months

In January 2026, an open-source project called ClawdBot suddenly went viral — it gained 60,000 GitHub stars in 72 hours. It was briefly renamed Moltbot, and finally settled on the name OpenClaw. In three months, its star count passed 190,000.

That pace is rare among open-source projects. Why did it take off? Because it solves a very direct need: **it lets your LLM stop just chatting and actually get things done.** And it does so running locally, without sending your data to the cloud, and usable straight from WeChat / Feishu / DingTalk.

OpenClaw's author is Peter Steinberger, an independent developer from Austria (and the founder of PSPDFKit). The project is written in TypeScript (Node.js), and its core design idea is the "agent gateway" — it doesn't provide AI capability itself, but builds a bridge between the AI models you already have and your digital life.

## 2. What OpenClaw Is

OpenClaw's official positioning is **"a platform-agnostic, local-first AI agent".** In plain terms: it's an agent gateway that runs on your own device, can connect to all kinds of LLMs, link up all kinds of tools and platforms, and execute tasks for you automatically.

Three things are key to understanding it:

**First, it doesn't provide AI capability itself.** OpenClaw is not a model; it doesn't train and it doesn't infer. What it does is connect to your LLM (whether a self-hosted Ollama model or the Claude or GPT API) and then give that model "hands and feet" — the ability to work with the file system, run commands, drive a browser and call APIs.

**Second, it's local-first.** All your data lives on your own device and never passes through any third-party server. Deploy OpenClaw on an intranet server, hook it up to a local LLM, and the whole system is completely offline.

**Third, it connects to many platforms.** OpenClaw supports more than 50 messaging platforms — WeChat, Feishu, DingTalk, Telegram, Discord, WhatsApp, Slack, iMessage, Google Chat… You don't need to open a dedicated app; you can drive your agent from the chat software you already use.

## 3. Hands On: Deployment and Configuration

**Installation**:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

After installation, run the setup wizard, which walks you through configuring your model API key and messaging platforms. You can also edit the configuration file by hand to connect a local Ollama:

```yaml
# ~/.openclaw/config.yaml example
models:
  - provider: ollama
    model: qwen2.5:14b
    base_url: http://localhost:11434

gateways:
  - platform: telegram
    token: YOUR_BOT_TOKEN
    chat_id: YOUR_CHAT_ID
```

**Your first automated task** — in Telegram, tell the agent:

```text
每隔一小时检查 https://example.com 能不能访问，
如果 HTTP 状态码不是 200，就发消息提醒我。
```

The agent writes a cron job on its own and starts the inspection.

## 4. Core Capabilities

**Giving the model "digital hands and feet".**

With a traditional AI chat tool, you say something and it answers. OpenClaw is different — it's an agent that lives on your device and can actually do these things:

- **File system operations**: read and write files, organize directories, search content
- **Browser control**: open web pages, take screenshots, scrape content
- **System command execution**: run scripts, manage processes, schedule jobs
- **Account management**: manage API keys, passwords and account information
- **External API calls**: integrate with any HTTP API and chain different systems together

For example, you can send the agent a message in WeChat:

```text
"帮我看看那台服务器的磁盘使用情况，超过 80% 就发告警"
```

The agent logs into the server over SSH, runs `df -h`, and if disk usage is above 80% it automatically posts an alert to the group chat. You don't have to write a single script for any of this — you describe the requirement in natural language and the agent carries it out itself.

**A skill marketplace (ClawHub).**

OpenClaw has a community skill marketplace called ClawHub, with 13,000+ community-contributed skills. You don't have to start from scratch — install one with a click and the agent gains a new ability. Weather lookups, stock alerts, GitHub project management, Jira ticket operations… all of these have ready-made skill plugins.

**Multi-agent gateway architecture.**

OpenClaw can manage several independent agent instances at the same time, each with its own workspace, memory files and configuration. In an enterprise setting, members of different teams can use their own separate agents on different messaging channels without interfering with one another.

The technical architecture has three layers:
- **Gateway layer**: a central router that connects to all kinds of messaging channels and external platforms
- **Agent Runtime layer**: manages multiple independent agent instances
- **Skill plugin layer**: extends the agent's abilities through the skill ecosystem

**Scheduled automation.**

It has a built-in cron scheduler. You can have the agent run inspections daily, generate a report weekly or check service status once an hour — completely unattended.

## 5. What Using It Looks Like

How you use OpenClaw is a bit unusual — it has no traditional "IDE plugin" or "desktop client". It works like this:

- You deploy OpenClaw on a server (your own PC, a Raspberry Pi, an intranet server)
- You configure the AI model to connect to (a local Ollama or a cloud API)
- You configure the messaging platforms to connect to (WeChat / Feishu / Telegram and so on)
- And then you can interact with the agent inside those messaging platforms

What does that feel like? Like having an AI assistant that's online around the clock. It lives on a server, you can reach it through any chat app, and you can put it to work for you.

## 6. The Memory System's Design

Here we have to touch on a topic that's often used for comparison: OpenClaw's memory system.

OpenClaw's memory is file-system based — each agent has a set of `SOUL.md`, `AGENTS.md`, `USER.md` and `MEMORY.md` files that store state and context. The design is simple and direct, but it comes with limitations:

- Memory is **passive**. You have to hand-write AGENTS.md to tell the agent how it should behave. The agent doesn't learn lessons from its interactions on its own.
- Cross-session context is unstable. A preference you gave the agent last week may be "forgotten" this week — because maintaining the memory files is essentially manual.

This is the point OpenClaw gets criticized for most, and it's why the Hermes Agent we'll cover next has been able to rise on its back.

## 7. What It's Suited To

Given its characteristics, OpenClaw fits the following scenarios better:

- **You need an automation assistant that's online around the clock.** Scheduled inspections, anomaly alerts, data synchronization — these don't need a good memory, just the ability to execute.
- **You need the same agent across several messaging platforms.** Feishu at the office, WeChat when you're out, Telegram at home — the same agent, reached from different platforms.
- **You need to chain several tools and systems together.** GitHub → Jenkins → Slack → Feishu, with the agent as the glue in the middle.
- **Data can't go to the cloud.** Local deployment + local model + local execution, fully offline.

Where it doesn't fit so well: if you want an agent that understands you better the more you use it and remembers your preferences and working habits, OpenClaw's passive memory model will disappoint you. That's also why many OpenClaw users end up paying attention to the Hermes Agent.

## 8. Summary

If you line up the four tools we've covered and compare their form factors:

| Tool | Interaction form | Positioning |
|------|------------------|-------------|
| OpenCode | Terminal TUI | A coding assistant in the terminal |
| Cline | IDE plugin | A coding agent inside the IDE |
| OpenHands | Web GUI + SDK | An autonomous engineer in a sandbox |
| OpenClaw | Messaging platforms | A local, all-purpose execution gateway |

OpenClaw is not a programming tool; it's a gateway that gives an LLM "hands and feet". Its value lies in its breadth — many platforms, many skills, many agents. But its memory system is passive: what you haven't told it, it won't remember.

Is there a tool that can make up for that shortcoming — one that's not just "you do, I say", but that "learns from interactions on its own"? Next article: the Hermes Agent.

A small step forward every day is a new height!
