---
title: 'Local LLM in Practice (Part 4): OpenHands — The Ideal and the Reality of an AI Full-Stack Software Engineer'
date: 2026-04-25
author: Tang Moying
categories: [ai]
tags: [AI, OpenHands, AI Agent, Autonomous Coding, Devin, SWE-bench, Open-Source Alternatives]
lang: en
alt_url: /post/ai-local-llm-04-openhands
---

In 2024, an AI tool called Devin burst onto the scene, claiming to be the "first AI software engineer", capable of autonomously handling the whole flow from requirements to deployment. Later the demo turned out to be embellished, and the community called it "Devin's lie". But Devin lit up a direction — AI not merely helping write code, but autonomously completing the entire software engineering workflow. OpenHands is the open-source implementation of that direction, with 76.5k GitHub stars. But there's still a fair distance between how it actually lands and the ideal.

<!--以上为摘要内容-->

## 1. Starting from Devin's Demo

In March 2024, Cognition AI released a demo video of Devin: an AI Agent autonomously analysed a development request on Upwork, wrote the code, ran the tests, and submitted a Pull Request. The tech world exploded — the concept of the "AI software engineer" appeared before the public in a tangible form for the first time.

Later the community found that Devin's demo was embellished. Some scenarios were carefully staged, and the actual capability fell short of what the demo showed. But Devin did push one thing forward: it turned "an AI Agent autonomously completing software engineering" from a theoretical concept into an engineering direction you could discuss.

OpenHands was originally called OpenDevin — as the name suggests, the open-source version of Devin. Its goal is to deliver, within the constraints of open source, the capability Devin promised.

## 2. What OpenHands Is

OpenHands is an AI-driven software engineering platform, developed in a mix of Python and TypeScript, open source under MIT (the enterprise edition has its source open but needs a licence for commercial use). As of June 2026, the latest version is v1.8.0.

Core positioning: **let an AI Agent work the way a human software engineer does — not just writing code, but understanding the task, planning on its own, executing operations, verifying results and iterating on fixes.**

It offers the richest set of usage forms among the four articles in this series:

**SDK**: a programmable Python library. You can write scripts to drive the Agent, customise its behaviour, and scale out to thousands of concurrent executions. This is what sets OpenHands apart from OpenCode and Cline — it is positioned not as a "tool" but as a "platform".

**CLI**: a command-line tool for lightweight use. The experience is similar to Claude Code or Codex CLI, suited to quick tasks.

**Local GUI**: a React single-page app + REST API, opened in the browser. The experience is like commercial products such as Devin and Jules — assign a task to the Agent in the browser and watch it work through it step by step.

**Cloud version**: a hosted version, supports GitHub / GitLab login, free trial. Suited to individual users who don't want to deploy it themselves.

**Enterprise edition**: supports private VPC deployment, with RBAC permission management, multi-user support and SSO integration. The source is open but commercial use needs a licence — on this point it differs from the purely MIT OpenCode, and it's worth noting.

## 3. Hands On: Docker Deployment

One command gets it running (Docker required):

```bash
docker run -it --rm --pull=always \
  -e LOG_ALL_EVENTS=true \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v ~/.openhands:/.openhands \
  -p 3000:3000 \
  --add-host host.docker.internal:host-gateway \
  --name openhands-app \
  docker.openhands.dev/openhands/openhands:1.8
```

Open `http://localhost:3000` in your browser and configure the model in settings. If you're connecting it to the local vLLM from the first article, put `http://host.docker.internal:8000/v1` in Base URL and the name of the model you deployed in Model.

**The first task**: create a new session in the interface and enter:

```text
在当前目录创建一个 Python Flask Hello World 应用，
包含单元测试，并写一个 README 说明如何运行。
```

OpenHands will create files, write code and run tests inside the Docker sandbox, then show you the result when it's done.

## 4. Core Capabilities

**The autonomous execution loop.** At the core of OpenHands is a loop of "perceive → think → act → verify". You give it a task, and it carries out the complete software development flow inside the Docker sandbox:

```text
任务: "把这个项目的单元测试覆盖率从 45% 提到 80%"

Agent 内部循环:
1. Analyse the project structure and identify the modules that are not covered
2. Generate test cases for each module
3. Run the tests and check the coverage
4. Find 3 test failures → analyse the causes → fix the code
5. Run again, coverage 78% → not enough → add boundary tests
6. Coverage 83% → meets the target → submit the PR
```

No human is involved in the whole process. The Agent thrashes around on its own in the sandbox, and when it's done it tells you the result.

**SWE-bench evaluation.** SWE-bench is a benchmark that tests AI coding ability on real GitHub issues and PRs. Paired with Claude 4.5 Sonnet, OpenHands's resolution rate reached 53%+, close to the level Devin claimed early on.

**Separated planning and execution.** Version v1.6.0 added a planning mode: the Agent first analyses the task and produces an execution plan, and only starts work once a human confirms. This pattern is similar to Cline's Plan/Act, but OpenHands does its planning in the sandbox environment — the Agent explores the code structure and reads the relevant files before producing the plan.

**Sandbox isolation.** All code execution happens inside a dedicated Docker container, with support for network isolation, command allow-lists and file access control. However much the Agent thrashes around, it won't affect the host environment.

## 5. Real-World Limitations

After all those capabilities, I have to be honest too — OpenHands is still in an exploratory phase, and there's a distance to "production-ready".

**The official word: not suitable for multi-tenant deployment.** OpenHands's official documentation states clearly that the current version is designed for a single user on a local workstation, has no built-in authentication system, and is not suitable for a shared multi-user environment. That means if you want to deploy it as a team-shared "AI development platform" — you can't do that yet.

**Insufficient frontend/UI capability.** When AI writes frontend code, it can't see the page rendering in real time. It writes HTML/CSS/JS, but without Cline's headless-browser screenshot ability to verify it — it can only "check whether the code is written correctly", not "check whether the page displays correctly".

**It can't be fully autonomous.** Planning mode needs human confirmation, and in real use any step may require a human to step in. SWE-bench's 53% resolution rate means there is still nearly half of real-world work it can't handle.

**Deployment isn't cheap.** You have to maintain the Docker environment yourself, configure API keys and harden security. Teams with no ops fundamentals can't get it off the ground at all.

To sum up: OpenHands's thinking is very advanced, but its current state in practice is — **fine for individual exploration or automating open-source projects, still too early to embed in an enterprise DevOps pipeline.**

## 6. An Objective Comparison

| Dimension | OpenHands | OpenCode | Cline |
|------|-----------|----------|-------|
| Positioning | Autonomous software engineering platform | Terminal AI coding assistant | IDE coding Agent |
| Stars | 76.5k | 173k | 63.1k |
| Forms | SDK/CLI/GUI/Enterprise | CLI/TUI/Desktop/Web/Headless | VS Code/JetBrains/CLI/SDK |
| Degree of autonomy | High (fully autonomous execution loop) | Medium (Plan/Build modes) | Medium (Plan/Act dual mode) |
| Security isolation | Docker sandbox | Permission configuration | Approval gating |
| LSP integration | None | Native (about 40 languages) | None |
| Multi-tenancy | Not recommended officially | Client-server architecture | SDK is customisable |
| Open-source licence | MIT (enterprise edition needs a licence) | MIT | Apache 2.0 |
| Maturity | Exploratory | Young but usable | Fairly mature |

## 7. Why Pay Attention to It Anyway?

You may ask: with all those limitations, why write about it at all?

Because the direction it points out is right: **AI Agents moving from "assisting" to "autonomous", that trend won't change.** Doing it badly now doesn't mean it will always be done badly. OpenHands's architecture — sandbox isolation, separated planning and execution, a programmable SDK — is all paving the way for the goal of "AI autonomously completing software engineering".

As developers, the things you can do right now are:

- **Automate personal projects**: let OpenHands add tests, fix bugs and update dependencies for you. Even if it can't be 100% autonomous, it saves a lot of time.
- **Maintain open-source projects**: those "refactor this piece of code" tasks in your issues — throw them at OpenHands to thrash on, and review the result when it's done.
- **Learn Agent architecture**: if you want to understand how AI Agents are designed, OpenHands's code is an excellent study object — it turns concepts like "perceive → plan → execute → verify" into runnable code.

## 8. Summary

OpenHands's ideal is "an AI full-stack software engineer"; its reality is "still in the exploratory phase". That isn't disparagement — every generation of tools has the ideal first and the reality after. Devin's demo was watered down, but it opened up a direction for discussion; OpenHands isn't perfect, but it turned that direction into open-source code.

Across the three articles — OpenCode is the coding assistant in your terminal, Cline is the coding Agent in your IDE, OpenHands is the autonomous engineer in a sandbox — the three tools span the spectrum from "assisted coding" to "autonomous execution".

But they share one pain point: **they are all "one-off".** Every new session means introducing the project background again, teaching it your preferences and way of working again. They can't remember you.

The memory system of an AI Agent is the key to whether it can stay with you over the long term. Next time, we'll talk about a project that pushes the "memory" dimension to an extreme — OpenClaw.

A small step forward every day is a new height!
