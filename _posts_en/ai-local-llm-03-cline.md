---
title: 'Local LLM in Practice (Part 3): Cline — the Open-Source Coding Agent in VS Code'
date: 2026-04-18
author: Tang Moying
categories: [ai]
tags: [AI, Cline, VSCode, AI Programming, Claude Dev, MCP, Open-Source Alternatives, Intranet Deployment]
lang: en
alt_url: /post/ai-local-llm-03-cline
---

Last time we talked about OpenCode in the terminal, but for many developers the center of gravity of daily work is in the IDE. The VS Code sidebar, inline completion, the file tree — these are the high-frequency touchpoints of everyday development. If you're looking for an open-source alternative to GitHub Copilot, then Cline is the one most worth watching right now — 63.1k GitHub stars, open-sourced under Apache 2.0, also in the form of an IDE plugin, and also supporting conversational programming and task execution.

<!--以上为摘要内容-->

## 1. What Is Cline

Cline's predecessor was called Claude Dev, and it started out as a VS Code extension. It was later renamed Cline and gradually grew into several forms: a CLI, a JetBrains plugin, a kanban multi-agent panel, an SDK and more.

Its relationship with GitHub Copilot is worth spelling out. By 2026, Copilot is no longer just a code completion tool — it has an Agent mode and can converse, plan and execute multi-step tasks. So the core difference between Cline and Copilot isn't "one is an Agent and the other is completion"; it's that:

- Copilot is a **commercial product**, with a free edition and a paid edition, deeply tied to the GitHub ecosystem;
- Cline is an **open-source product**, Apache 2.0, tied to no vendor or platform.

The user experience also differs: Cline has no inline code completion, only conversational interaction; Copilot has both. If you're used to the "write half of it and let the AI complete the rest" workflow, Cline can't help; but if you want an IDE programming assistant that's open source and controllable, lets you switch models freely, and can be deployed locally, Cline is the most mature choice available.

## 2. The Forms Cline Comes In

Like OpenCode, Cline comes in several forms, and the coverage is broader:

**VS Code extension** (the main form). Install it straight from the VS Code extension marketplace, open the panel from the Activity Bar on the left, and describe your task in natural language. This is where most users first come into contact with it, and it's the friendliest form for IDE users.

**JetBrains plugin**. IntelliJ IDEA, PyCharm, GoLand and other JetBrains IDEs can all install it. The functionality is the same as the VS Code version.

**CLI**. A command-line version that supports interactive use and a headless mode. The headless mode can be embedded in a CI/CD pipeline and run agent tasks on a Cron schedule.

**Kanban multi-agent task board**. Manage multiple agent tasks in parallel through a web interface; each agent works independently and state is persisted. Suited to scenarios where several tasks need to move forward in parallel.

**SDK**. Provides a complete programming API for building custom AI agents, toolchains and multi-agent team collaboration systems.

All five forms share the same core engine (implemented in TypeScript), and the configuration and rules stay consistent across the different forms.

## 3. Hands On: Installation and Configuration

**Install the VS Code extension**: search for `Cline` in the VS Code extension marketplace and click install. A Cline icon appears in the Activity Bar on the left; click it and you're in the chat panel.

**Connect a local model**. In the Cline panel's settings, choose `Ollama` as the API Provider, fill in `http://localhost:11434` for the Base URL, and put the name of the model you're running locally (such as `qwen2.5:14b`) in Model. Now you can use AI capability inside the intranet, and the code never leaves the machine.

**Configure project rules**. Create a `.clinerules` file in the project root:

```text
# Coding conventions
- 使用 TypeScript 严格模式
- 所有函数必须有 JSDoc 注释
- 测试覆盖率不低于 80%

# Security rules
- 禁止修改 src/auth/ 目录下的文件，除非显式要求
- 数据库迁移脚本必须人工审查后才能执行

# Auto-approve (use with caution)
- 允许自动批准：读取文件、运行 npm test
- 必须审批：git push、npm publish、rm -rf
```

Cline reads this file automatically, and every operation obeys the rules you defined.

**First use**: open the Cline panel, enter a task description, choose Plan mode to have it produce a plan first, and once you've confirmed it, switch to Act mode to execute.

## 4. The Plan/Act Dual Mode

Cline's most central design is its **Plan/Act dual mode**.

**Plan mode**: the agent only reads, it doesn't write. You describe a task, and Cline first explores the codebase, understands the project structure, and then proposes a structured execution plan. It tells you: which files I intend to change, what operations I'll perform, and what the expected result is. If you're not satisfied, you can keep discussing and adjust the direction.

**Act mode**: once the plan is confirmed, switch to Act mode and Cline starts executing. Every file edit and every terminal command requires your manual approval by default. You can turn on auto-approve for certain kinds of operations (such as reading files), but keep approval required for dangerous operations (such as `git push`, `rm -rf`, database migrations).

This design solves a key problem: **the balance between execution capability and safety.** A fully automatic Agent is too dangerous — you don't know whether it will delete something it shouldn't. But confirming every step is too slow — clicking to approve even a file read is extremely inefficient. Plan/Act mode lets the user hold the line at the strategic level (confirming the Plan) and delegate at the execution level (Act auto-approving safe operations), and it's a fairly pragmatic approach today.

## 5. Core Capabilities

**Native MCP protocol support**. Cline natively supports MCP (Model Context Protocol), so it can connect to databases, query APIs, manage cloud resources and fetch internal documentation — it doesn't just read the files in your project, it can also reach organization-level knowledge bases. For example, before running a database migration it can check the production table schema automatically; when writing an API it can consult the company's internal interface conventions automatically.

**Headless browser testing**. This is a rather special capability of Cline. Most AI programming tools can only write front-end code; they can't see the result. Cline can launch a headless browser, take screenshots of the page, and verify that a UI change is correct. Tell it to "change the button color to blue" and it will change the code, refresh the page, and take a screenshot to confirm the button really did turn blue. This capability is especially practical in projects with the front end and back end separated.

**BYOK model access**. Cline is tied to no model vendor. It supports Anthropic, OpenAI, Google, Mistral, DeepSeek, OpenRouter (200+ models), AWS Bedrock, Azure, and local models via Ollama — just about every model provider you can think of. You can use a cheap model to do planning first and then a high-end model to execute a complex refactor, controlling cost flexibly.

**`.clinerules` project rules**. Put a `.clinerules` file in the project root to define coding conventions, commands allowed to auto-approve, and directories that must not be modified. The team shares one set of rules, so Cline behaves consistently across developers.

**Transparent real-time cost**. Every operation shows real-time token usage and estimated cost. There's no monthly fee; cost is determined entirely by your API usage.

## 6. Comparison with Copilot and Cursor

| Dimension | Cline | Cursor | GitHub Copilot |
|------|-------|--------|----------------|
| Open source | Apache 2.0, fully open source | Closed source | Closed source |
| Inline completion | No | Yes | Yes |
| Working style | Conversational, Plan/Act dual mode | Conversational + Composer agent | Conversational + Agent mode + inline completion |
| Editor requirement | Standard VS Code / JetBrains extensions | A standalone VS Code fork | Extensions for many IDEs |
| Business model | Open source and free + bring your own API Key | $20/month subscription | Free/Pro/Enterprise |
| Model choice | BYOK, supports almost all mainstream models, including local ones | Partially supports BYOK | Built-in multiple models (Claude/GPT etc.) |
| Approval gating | Every step needs approval (auto-approve configurable) | Has a similar mechanism | Has security controls |
| MCP support | Native | Limited | Supported |

One key difference: **Cline has no inline code completion.** If you're used to the "I write half and the AI completes the other half" workflow, Cline isn't for you — it only has conversational interaction. But if you want an open-source, controllable, locally deployable Copilot alternative with free model switching, Cline is the most mature choice.

## 7. The Enterprise Self-Build Perspective

From the perspective of a company building its own setup, Cline has several concrete advantages:

**Data never leaves the door**. The BYOK model means you can use your own API Key, or even run entirely on local models (through Ollama), keeping code and conversations completely inside the intranet.

**Zero subscription fees**. There's no monthly fee, and cost is calculated entirely by API usage. The larger the team, the more obvious the advantage over subscription-based plans ($20-$39 per person per month).

**A standard VS Code extension**. You don't have to have the team switch editors, and you don't have to push an "AI-native IDE". Cline is just an extension: install it and use it.

**Approval gating**. Every operation needs human approval, which is the basic safety guarantee in an enterprise environment. You can use `.clinerules` to define which operations may be auto-approved and which must be approved.

**A programmable SDK**. If you need to customize a deeper integration, Cline's SDK provides a complete programming interface. You can build your own toolchain and multi-agent collaboration system on top of Cline's core engine.

## 8. Summary

Cline and OpenCode from the previous article are actually solving the same class of problem — replacing commercial AI programming tools with open-source alternatives. But they enter from different paths:

- **OpenCode** enters from the terminal, with CLI/TUI as the main form and native LSP integration as the highlight, suiting developers who are used to working in a terminal.
- **Cline** enters from the IDE, with the VS Code extension as the main form and the Plan/Act dual mode as the highlight, suiting developers who are used to working in an IDE.

Both are open source, both support local models, and neither is tied to a vendor. You don't have to choose one — use OpenCode when writing scripts in the terminal and Cline when writing business code in VS Code. That's perfectly fine.

But they share one limitation: **whether OpenCode or Cline, they are only Agents for the "programming" stage.** They help you write code, but they can't run tests, deploy, or fix environment problems on their own. They act under your instructions — you assign the task, they execute it.

Is there a tool that goes further — one that doesn't just "write code on command" but "takes a task and finishes it on its own"? That's OpenHands, the subject of the next article.

A small step forward every day is a new height!
