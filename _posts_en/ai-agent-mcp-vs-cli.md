---
title: 'MCP vs. CLI: The Two Paths for Agents to Call Tools, and Who Is Eroding Whom?'
date: 2026-06-13
author: Tang Moying
categories: [ai]
tags: [AI, Agent, MCP, CLI, Tool, Function Calling, Token Optimization, DevOps]
lang: en
alt_url: /post/ai-agent-mcp-vs-cli
---

When an Agent calls an external tool, there are two broad paths: MCP and the CLI. MCP (Model Context Protocol) is a standardized protocol Anthropic introduced at the end of 2024, with the goal of giving Agents one unified way to connect to every kind of third-party service. The CLI is just the command line — `kubectl get pods`, `git diff`, `docker ps` — where the Agent runs the command directly and takes the output. Many people instinctively feel that MCP is the more "advanced" approach: standardized, type-safe, dynamically discovered. It sounds so sophisticated that it ought to gradually replace crude CLI calls. But the reality is exactly the opposite — the CLI is eroding MCP's share in reverse. This article looks at why.

<!--以上为摘要内容-->

## 1. MCP's Ideal: One Standard to Connect Everything

First, let's understand what problem MCP set out to solve.

Before MCP existed, connecting an Agent to a new service meant doing four things: write a Tool definition (description + parameter schema), write the execution logic, write the error handling, and register the Tool with the Agent. You did all of it again for every service. Ten services meant ten pieces of glue code.

MCP's idea was this: **define a standard protocol; the service provider writes an MCP Server, the Agent framework writes an MCP Client, and the two communicate over the standard protocol.** As a developer you no longer write glue code — the Agent dynamically discovers the capabilities a Server offers through the MCP protocol and calls them directly.

For example: GitHub has an MCP Server that exposes tools like `search_repositories`, `create_issue` and `get_pr`. Once an Agent is connected to that MCP Server, it immediately "knows" how to work with GitHub — without you writing any code at all.

```json
// Example MCP tool definition — every tool carries a complete schema
{
  "name": "create_issue",
  "description": "Create a new GitHub issue in a repository",
  "inputSchema": {
    "type": "object",
    "properties": {
      "owner": { "type": "string", "description": "Repository owner" },
      "repo": { "type": "string", "description": "Repository name" },
      "title": { "type": "string", "description": "Issue title" },
      "body": { "type": "string", "description": "Issue description body" }
    },
    "required": ["owner", "repo", "title"]
  }
}
```

Standardized, type-safe, dynamically discovered — those three keywords look unassailable. Backed by Anthropic and a number of other AI companies, MCP quickly became the "correct choice" for Agent tool calling.

## 2. MCP's Reality: The Token Bill Is Much Steeper Than You Think

MCP's standardization comes at a price. Every Tool has to sit in the System Prompt with its complete description and parameter schema. The `create_issue` example above is not very long — around 400 Tokens. But a complete MCP Server usually has anywhere from a dozen to several dozen Tools.

A GitHub MCP Server exposes 20 tools at an average of 400 Tokens each; that is 8,000 Tokens — **before any work has begun, 8,000 Tokens of the System Prompt are already gone.**

What is more, those Tokens are consumed on every turn of the conversation. It is not "load whichever one you use" — every Tool definition lives in the System Prompt and is carried along every single time. For an MCP Server that supports 50 tools, the Tool definitions alone can easily take up more than 20,000 Tokens in the System Prompt.

More troublesome still: **those definitions may have nothing at all to do with your actual task.** You ask the Agent to "change a config file", and it has no need whatsoever to know the definitions of `create_issue` and `list_milestones`, yet those definitions still show up in the System Prompt, crowding out the space that could have gone to file context and conversation history.

And that is without counting the operational cost of the MCP Server itself. Running an MCP Server means an extra process, extra network overhead and extra authentication management. A simple `git diff` is one command through the CLI; through MCP it is "Agent → MCP Client → MCP Server → local Git command → return result" — a chain several times as long.

## 3. The Return of the CLI: Why Models "Already Know" the Command Line

The Token-consumption problem with MCP made everyone take another look at the CLI, that "old approach". What they found was that the CLI has one fundamental advantage over MCP in Agent tool calling: **models have already learned these commands in bulk during training.**

GPT-4, Claude, Qwen, DeepSeek — every mainstream model's training data contains an enormous volume of shell scripts, command-line tutorials and operations manuals. `kubectl`, `git`, `docker`, `curl`, `grep` — the syntax, the parameters and the typical usage of these commands have already been internalized by the model.

That means: **you do not need to tell the model what `kubectl get pods` means or how to use it. The model already knows.** All you have to do is give the Agent an `execute_shell` Tool, and it will construct the right command for itself when it needs one.

Compare the Token consumption:

| Call method | System Prompt footprint | Extra Tokens per call |
|---------|-------------------|-------------------|
| MCP (full toolset) | 15,000~25,000 Tokens (all Tool definitions) | Small (results returned structured) |
| CLI (one Shell Tool) | ~200 Tokens (one Tool definition) | Small (command output text) |

That is two orders of magnitude apart. And MCP's Token consumption is **fixed** — whether or not this conversation uses those Tools, the definitions sit in the System Prompt. The CLI's Token consumption is on demand — it costs you only when you actually call a command.

That is why the CLI is eroding MCP's share in reverse. Not because the CLI is better, but because it is cheaper. And in an era when Tokens are money, "cheaper" is itself productivity.

## 4. But the CLI Is Not Perfect Either

The CLI saves Tokens, but it has problems of its own.

**Uncontrolled output.** When the Agent runs `kubectl get pods -o json`, the output may be 500 lines of JSON — including a pile of metadata, status details, managedFields and so on that the Agent does not need. Shoving all of that into the context is another Token expense. MCP's responses are usually filtered on the Server side and return only the key fields after structuring — on the "information density" of the return value, MCP wins.

**Crude error handling.** The CLI's output is just stdout + stderr + exit code. The Agent has to work out for itself why a command failed. An MCP Server can hand back structured error information the moment a failure occurs, making it easier for the Agent to understand where the problem lies.

**Blurry security boundaries.** Giving the Agent a general-purpose `execute_shell` Tool is giving it access to the entire file system and every executable command. There is no way to say "the Agent may run `git` but may not run `rm -rf`" — a Shell Tool does not make that distinction. MCP can achieve fine-grained permission control.

**Parameter combinations depend on the Agent "guessing".** `kubectl` has countless parameters, and although the model "knows" them, complex parameter combinations (fetching a specific field of a specific resource in a specific namespace in a specific format, say) can go wrong. MCP's type-safety constraints can prevent that class of error.

So the return of the CLI does not mean the death of MCP. It just means the two suit different kinds of scenarios.

## 5. How to Choose: A Decision Table

| Scenario | Recommendation | Reason |
|------|------|------|
| Everyday Git operations (diff, log, commit) | CLI | Already internalized by the model; extremely Token-cheap |
| Common kubectl / docker operations | CLI | The model saw command-line usage in bulk during training |
| Complex GitHub APIs (Issue management, PR review) | MCP | Many parameters, many steps, type safety needed |
| Database queries | MCP | Needs connection management, structured results, permission control |
| Monitoring and alerting (Prometheus / Grafana) | It depends | Simple queries via CLI (`curl`), complex configuration via MCP |
| In-house internal services | MCP | No ready-made CLI; MCP is the standardized way in |
| One-off scripts and text processing | CLI | The Agent writes its own Shell script and runs it — flexible and efficient |

One practical principle: **try the CLI first, and only reach for MCP when the CLI cannot get the job done.** Do not start from the assumption that "MCP is better". MCP's Token overhead is there the moment you go live; the CLI's Token overhead is on demand — start with the cheap option and add more only when it is not enough. That is the most pragmatic path in engineering.

## 6. Summary

The relationship between MCP and the CLI is exactly the reverse of what many people's intuition suggests. It is not "standardized MCP replacing the crude CLI" but "lightweight CLI proving, in practice, that it is already good enough in most scenarios, and squeezing MCP back into the few areas where it is genuinely necessary".

That is not a bad thing. This is simply how technology evolves — not every "advanced" approach survives; what survives is the approach with the best cost-performance ratio. MCP has irreplaceable value in the standardized integration of complex third-party services, but across a large number of everyday operations and development scenarios, the CLI — riding on two advantages, "already internalized by the model" plus "zero extra Token cost" — has proved to be the most pragmatic way to call a Tool.

Across three articles — Tool, Skill, and MCP vs. CLI — the same point is really being made: **Agent engineering is a process of subtraction.** More Tools is not better, more Skills is not better, and a more "advanced" way of calling a Tool is not better either. Restraint, pragmatism, and understanding the trade-offs at each layer — that is the right way to do Agent development.

A small step forward every day is a new height!
