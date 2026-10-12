---
title: 'Local LLM in Practice (Part 2): OpenCode — The Open-Source AI Coding Assistant in Your Terminal'
date: 2026-04-11
author: Tang Moying
categories: [ai]
tags: [AI, OpenCode, AI Programming, Open-Source Alternatives, Claude Code, Intranet Deployment, LSP]
lang: en
alt_url: /post/ai-local-llm-02-opencode
---

In the previous article we set up our AI infrastructure on the intranet — Ollama running the models, vLLM improving performance, Open WebUI providing the interface. With that foundational capability in place, the first practical question is: what tools do developers use to access AI capabilities? On the public internet there's Cursor, Claude Code, GitHub Copilot — but if you're on an intranet, or you don't want to hand your code to a third party, none of those tools are usable. That's when you need an open-source alternative.

<!--以上为摘要内容-->

## 1. Why a DevOps Engineer Would Study AI Coding Tools

I'm a DevOps engineer. By conventional reckoning, AI coding tools are the developers' business — how they autocomplete code, how they generate functions, has little to do with the people who run pipelines and manage deployments. But since 2025 I've been watching this field closely, and the reason isn't "AI can write code" in itself — it's two things that make me uneasy.

**First, developers are using AI tools on a large scale, but those tools run outside DevOps' sphere of control.** You use Cursor, Copilot, Claude Code — every conversation with the AI, every piece of code sent to an external server, every bit of business information in a prompt is a black box to the DevOps team. No logs, no audit, no usage policy. You know your team is using AI, but not how much, what they asked, or where the data went.

**Second, AI tools are calling back into DevOps infrastructure.** Through the MCP protocol or a CLI, a coding agent in a terminal can pull Jira issue information directly, commit code to GitLab, create a GitLab merge request, trigger a Jenkins build, and so on. That means developers can reach foundational engineering services like Jira, GitLab, and Jenkins without going through a unified DevOps platform — while the AI tools they use sit outside the enterprise's sphere of control.

That's what I take "shifting DevOps left" to really mean in this context: **developers have gained an unprecedented reach of capability, but DevOps' controls haven't shifted left along with it.** If that capability gap isn't closed, the traditional research and development governance system gets bypassed.

With that question in hand, I started looking into open-source AI coding tools. My goal wasn't to find a "free Copilot replacement", but to find **a tool where I can insert a control layer into the path of AI calls** — for example, archiving prompt data before an API request goes out, recording usage frequency, enforcing security policy. Open-source means you can change the code and add middleware, which closed-source products can't do.

OpenCode is the first answer I found.

## 2. The Governance Problem with Closed-Source AI Tools

The AI coding tools most commonly used on teams today face three governance-level problems:

**First, they run as black boxes.** Cursor, Copilot, Claude Code — these tools encapsulate the AI interaction internally. Your developers talk to the AI every day, but as the person responsible for DevOps you don't know how many times they asked, what they asked, or which prompts carried internal code or sensitive data. AI usage on the team is in a state of "it exists as a fact, but it's invisible".

**Second, the data flow is uncontrollable.** Cursor sends code snippets to Anthropic's or OpenAI's servers for inference; Copilot's data flows through GitHub's infrastructure. These vendors all make privacy commitments, but for scenarios with hard compliance requirements — finance, government affairs — data leaving the intranet is itself a risk, no matter what the vendor promises.

**Third, continuous payment.** Cursor at $20/month, Copilot Enterprise at $39/month, Claude Code billed by API token — fine for an individual, but once the team scales up the annual bill is considerable. And you're always renting the capability, never owning it.

So the question isn't "is there a cheap and good AI coding tool" — Copilot supports custom models now, and Claude Code is very capable. The real question is: **is there a tool that lets you insert your own control layer into the AI call chain?** For example, before a request goes out to the model, first passing through log archiving, then sensitive-information redaction, then usage-frequency counting?

That's what makes open source irreplaceable — you can change the code. OpenCode gives you that entry point.

## 3. What OpenCode Is

OpenCode is a fully open-source AI coding assistant, built by anomalyco (the SST team) and released in June 2025. As of April 2026 it already has more than a hundred thousand stars on GitHub, and it iterates very actively.

Its core positioning is simple: **an open-source AI coding assistant that doesn't lock you to a model vendor.** For you, the biggest value is this: because it's open source, you can insert your own logic into the path where it calls AI models — logging, auditing, redaction, rate limiting, whatever you want to add, you change the code.

It's under the MIT open-source license, so you can use, modify, and distribute it for free. You can deploy it on an intranet server, hook it up to your own Ollama or vLLM, and let the whole team use it — your code never leaves your network.

## 4. The Forms OpenCode Comes In

OpenCode offers four ways to use it:

**Terminal TUI**: this is the flagship experience. Built by Neovim users, it provides a full interactive UI in the terminal, supporting multiple panes, file diff comparison, and interactive conversation.

**Desktop** (Beta): a native desktop application supporting macOS, Windows, and Linux. No terminal needed — double-click to launch.

**IDE plugin**: it can be embedded in editors such as VS Code, launching the OpenCode terminal command line with a keyboard shortcut — the conversation does not happen in a sidebar.

**Web interface**: start a local web server with `opencode web` and access it in a browser. It's functionally identical to the terminal TUI, suits scenarios where people aren't comfortable in a terminal, and also supports multiple users accessing it over the LAN.

## 5. Hands On: Installation and Configuration

We've talked enough — better to just install one and try it.

**Install** (pick one method):

```bash
# macOS (recommended)
brew tap anomalyco/tap && brew install opencode

# Linux / macOS universal
curl -fsSL https://opencode.ai/install | bash

# Front-end developers
npm install -g opencode-ai
```

After installing, verify with `opencode --version`.

**Connect the local model you set up in the previous article**. Edit the config file (on macOS/Linux it's at `~/.config/opencode/opencode.json`, on Windows at `%APPDATA%\opencode\opencode.json`):

```json
{
  "lsp": true,
  "models": [
    {
      "name": "qwen2.5:14b",
      "provider": "ollama",
      "baseURL": "http://localhost:11434/v1",
      "apiKey": "ollama"
    },
    {
      "name": "claude-sonnet-4-20250514",
      "provider": "anthropic",
      "apiKey": "YOUR_ANTHROPIC_KEY"
    }
  ],
  "defaultModel": "qwen2.5:14b"
}
```

**Run your first interaction**:

```bash
# start a conversation
opencode

```

Once it's configured, `opencode` and Enter drops you into the TUI conversation interface.

```bash
# Non-interactive mode — hand it a task directly (useful for CI/CD scenarios)
opencode run "Explain the core logic in src/main.go and generate comments" \
  --model ollama/qwen2.5:14b \
  --file src/main.go \
  --format json
```

## 6. Core Features

**Unlimited pipeline integration**. This is OpenCode's most valuable feature for a DevOps engineer. OpenCode supports a non-interactive mode (`opencode run "提示词"`), which can be embedded directly into CI/CD pipelines, scripts, and scheduled jobs. More importantly, it's MIT open source: no usage quota, no token limit, no license fee. The non-interactive modes of commercial tools such as Claude Code and Copilot CLI, by contrast, are constrained by their respective license terms and quota systems. OpenCode + a local model = unlimited runs in your pipelines at zero marginal cost.

**LSP integration** (requires configuration to enable). OpenCode has built-in LSP (Language Server Protocol) support for more than 30 languages, which you enable by first setting `"lsp": true` in `opencode.json`. Once enabled, it detects the language as you write code and starts the corresponding LSP, forming a self-correcting code loop: you describe the requirement → OpenCode writes the code → the LSP detects an error → OpenCode fixes it automatically → it checks again. In TypeScript and Python scenarios this loop is especially effective — type errors, missing imports, and misspelled variable names all get corrected automatically. One caveat: the documentation also points out that not every project is suited to having LSP on — it consumes memory, and for some projects going straight to lint/typecheck on the command line may be better.

**Multi-model support**. OpenCode is not tied to any model vendor. It supports more than 75 model providers, including Anthropic, OpenAI, Google, Mistral, DeepSeek, as well as local models connected through Ollama. You can even reuse an existing GitHub Copilot subscription — using Copilot's API as OpenCode's model backend.

That means: you can run a Qwen or DeepSeek-Coder model on Ollama inside the intranet, and OpenCode talks to it directly. Your code never leaves the intranet, and API consumption is zero.

**Multi-agent system**. OpenCode has a built-in division of labor between a primary agent and sub-agents. The primary agent switches between Build mode (writing code directly) and Plan mode (producing a plan before executing); sub-agents are invoked with `@general` and similar, and handle specific types of subtasks.

**Fine-grained permission control**. Each command can be configured individually as allow (permit automatically), ask (prompt every time), or deny (block outright). For example, you can set `git push` to ask and `rm -rf` to deny.

**Undo/Redo**. A snapshot is created automatically before every file modification, and `/undo` rolls it back in one keystroke.

**MCP protocol support**. You can extend its tool capabilities and connect external data sources and APIs.

## 7. The Reality and Limits of Enterprise Self-Hosting

From an enterprise governance standpoint, OpenCode's value is that it gives you **a programmable entry point**:

- **AI interactions are auditable**. Because all requests go through your own infrastructure, you can add logging at the middle layer, archive prompts and responses, and track each person's usage frequency. This is something Cursor/Copilot/Claude Code can't do — they encapsulate the interaction in a black box.
- **Data never leaves the intranet**. Hook up a local Ollama/vLLM and all computation happens inside the intranet. Even when you call an external API, the request passes through your control layer before it goes out.
- **No vendor lock-in**. You want to switch models, you switch models, with no lock-in whatsoever.
- **Zero monthly fee**. No subscription cost; the only expense is the compute consumed by model inference.

But the reality also needs to be stated clearly: OpenCode is still very young. It was only released in June 2025, the documentation is incomplete, it has had security vulnerabilities, and for now it's better suited to individuals or small teams as a productivity tool. **As for the idea of adding a control layer to the call chain — the direction is right, but today you still have to modify the code yourself, and an out-of-the-box enterprise-grade solution doesn't exist yet.**

## 8. Wrap-Up

OpenCode's value to a DevOps engineer isn't that "it can write code for you", but that **it gives you an entry point for bringing AI tools into your governance system** — an open-source architecture means you can add middleware, add auditing, add policy. Of course, for now that idea is more directional than concrete; it's still some distance from a mature enterprise-grade solution.

In terms of form factor, it offers four choices — terminal TUI, desktop, IDE plugin, and web interface — but the most mature is still the terminal TUI. The desktop app is still in Beta, and the IDE plugin is mainly a keyboard shortcut that launches the command line. If your team is used to chatting in an IDE sidebar and enjoying the smooth experience of inline code completion, then OpenCode as it stands today may not be the most comfortable choice.

In the next article, we'll look at a tool of a different shape — Cline, which embeds directly into VS Code, runs on a dual Plan/Act mode, and is likewise open source and free.

A small step forward every day is a new height!
