---
title: 'The Hands and Feet of an Agent: Tool Capability Boundaries and Their Evolution'
date: 2026-06-06
author: Tang Moying
categories: [ai]
tags: [AI, Agent, Tool, Function Calling, Computer Use, Browser Use, MCP, CLI]
lang: en
alt_url: /post/ai-agent-tool-evolution
---

However clever a large model is, if it cannot interact with the outside world it is just a talking head. Chatting, writing a poem, fixing a function for you — all of that is still within the scope of "outputting text". But the moment you want an Agent to do something practical — deploy a service, look something up in a database, open a browser and fill in a form for you — it has to have "hands". In Agent terminology, those "hands" are called Tools. From the earliest file reads and writes to today's Computer Use and Browser Use, the capability boundary of Tools has kept expanding outward. This article walks through the evolution of Tools, and, along the way, the things that never changed.

<!--以上为摘要内容-->

## 1. What a Tool Is: Function Calling Isn't "Calling", It's "Translating"

Before we talk about Tools, we need to get one thing straight: **a large model doesn't "call" anything.**

You tell an Agent to "check the weather" and the Agent does not really open a browser to check. What it does is actually quite simple — it outputs a piece of JSON:

```json
{
  "name": "get_weather",
  "arguments": {
    "city": "Beijing"
  }
}
```

Then a host program (Hermes, ChatGPT's backend, your Python script) goes and really executes that function, carries the result back to the model, and the model gives you a natural-language reply based on the result.

This mechanism is called **Function Calling**. The name is misleading — what it really amounts to is "the model outputs a structured expression of intent, and the host program does the executing". The model is the brain, the Tool is the hands and feet, and Function Calling is the nerve signal.

Understanding this matters, because it explains the core design principle of Tools: **a Tool's quality does not depend on how powerful its function is, but on how clear its "expression of intent" is.** A Tool's description, its parameter definitions, its return-value format — these determine whether an Agent can "use" it correctly. A badly written Tool (vague description, arbitrary parameter names, a tangle of JSON for a return value) is no different from a hand with a severed nerve — however strong it is, it cannot move.

## 2. The Evolution of Tools: From Reading and Writing Files to Manipulating the World

The form of Tools has gone through several phases. It is not "a new version replacing an old version" but **a capability boundary that keeps expanding outward** — just as human tools went from the stone axe to the power drill, not as a replacement but as more and more things they can handle.

### 2.1 The First Generation: Reading and Writing Files

The earliest Tools, provided by default in almost every Agent framework: read a file, write a file, execute a Shell command.

```json
// The earliest Function Calling — simple and direct
{
  "name": "write_file",
  "arguments": { "path": "/app/config.yaml", "content": "..." }
}
```

The hallmark of this phase: **about all a Tool can do is "write text down"**. Changing code, generating a config file, writing a script — at bottom they are all a combination of text generation plus a file write.

That is already enough to solve many problems. In your day-to-day use of Hermes, when you ask it to fix a bug, all it does is: read the file (understand the context), output a revision plan, and write it back. But for scenarios that "need to interact with an external system", file reads and writes are not enough.

### 2.2 The Second Generation: Web Requests and API Calls

The Tools of the second phase began to break through the boundary of "local files" — **an Agent could now call external APIs directly.**

```json
{
  "name": "call_api",
  "arguments": {
    "method": "GET",
    "url": "https://api.example.com/v1/services",
    "headers": { "Authorization": "Bearer xxx" }
  }
}
```

Behind this sit a series of "connecting to external systems" Tools such as web_fetch and Shell command execution. The Agent is no longer just "writing files locally" — it can query APIs, run database queries, trigger CI/CD pipelines; anything a Shell can do, the Agent can do.

The Tools of this phase are already enough to support the core scenarios of "making DevOps AI-driven": an Agent can run the entire CI/CD process, from code repository to build server to deployment cluster.

### 2.3 Standardizing Tools: How MCP Took Tools From "Built by the Vendor" to "Built Together by the Ecosystem"

The two generations of Tools we discussed above — file reads and writes, web requests, Shell execution — are almost all built in by the Agent vendor itself. The vendor's engineering team defines the Tool's schema, writes the execution logic, and packages it into the product. Early on this was no problem, because there were few kinds of Tools and the scenarios were concentrated.

But the problem arrived before long: **there are far too many external platforms to integrate.** Databases include MySQL, PostgreSQL, MongoDB, Redis… cloud platforms include AWS, Azure, GCP, Alibaba Cloud… monitoring includes Grafana, Prometheus, Datadog… collaboration tools include Slack, Jira, Confluence… Every platform has its own API, its own authentication method, its own data format. No vendor could build all of that in — not for lack of wanting to, but because it is impossible.

Before there was a standardized protocol, if you wanted to add a "query Datadog monitoring" capability to an Agent, you either waited for the vendor to support it (which most likely never happened), or wrote your own glue code to wrap the Datadog API into a Tool the Agent could understand. And every vendor defined Tools differently — a Tool you had written for Claude Code would not work in Hermes, and the reverse was just as true. Tools and Agent platforms were **tightly coupled**.

That is the problem **MCP (Model Context Protocol)** exists to solve. MCP is a standardized Tool description protocol — it defines a "common language" for Tools: every Tool has a name, a description, a parameter schema and a return format. Whichever Agent platform it is, as long as it supports MCP it can understand and call any Tool Server that implements MCP. Tool developers and Agent platform developers can from then on **work independently of each other** — connecting through the standard protocol is all it takes.

The significance of this change: **the Tool ecosystem went from "built in by the vendor" to "built together by the community".** It used to be that you waited for Anthropic to add a Kubernetes Tool to Claude Code; now a community developer writes an MCP Server and every MCP-capable Agent can use it. Datadog, Grafana, Slack, Jira — as long as somebody writes an MCP Server, the Agent can connect. Vendors do not need to build those Tools in; they only need to implement the MCP protocol properly — that is the decoupling standardization brings.

### 2.4 The Third Generation: Computer Use — Letting an Agent Drive the Desktop

If the Tools of the first two generations operate on "systems that have an API", then Computer Use steps into "systems that have a user interface" — **an Agent can use desktop software the way a person does.**

Anthropic introduced Computer Use at the end of 2024. The principle: the Agent can see a screenshot of the screen, then output operation instructions — mouse clicks, keyboard input, scrolling — and after the host program executes those operations, it hands the Agent a fresh screenshot.

```json
{
  "action": "left_click",
  "coordinate": [450, 320]
}
```

What is the essential difference from the Tools above? The earlier Tools operate on "interfaces designed to be programmable" — the API has documentation, the parameters have types, the return value has a format. Computer Use operates on "interfaces made for people" — no documentation, no schema, and the output is just an image. The Agent has to **look**, **understand**, **decide** and **execute** — every step is a combination of visual understanding and reasoning.

What this capability means for DevOps: **not every system has an API.** Your company may have a server from 15 years ago whose management interface is just a web console, with no API at all. Before, you could only operate it by hand; now an Agent can do it for you — inelegant, but already usable.

Computer Use is not stable enough yet (the latency of each step, the accuracy of visual recognition and the reliability on complex interfaces are all still being improved), but the direction is clear: **the Agent's capability boundary is expanding from "the programmable world" to "the visible world".**

### 2.5 The Fourth Generation: Browser Use — A New Shape for Web Automation

Browser Use can be seen as a specialized version of Computer Use for the web. It lets an Agent open a browser, browse web pages, click buttons, fill in forms and download files — completing a full web interaction flow.

What is the difference from traditional Web Scraping? Scraping follows preset rules ("find the .price class and extract the text"), while Browser Use has the Agent deciding for itself ("I need to find the price, let me see which element on the page looks like a price"). Hard-coded rules break the moment the page is redesigned; an Agent that searches on the basis of semantic understanding is far more fault-tolerant and generalizes much better.

An example: you are troubleshooting a production issue and need to log into Grafana to look at the CPU trend of some service, and then post the screenshot into the group chat. That used to be three separate things — log into Grafana, take the screenshot, paste the image into the chat tool — and each one needed a person. With Browser Use, the Agent can do it all in one go: open Grafana → navigate to the corresponding Dashboard → set the time range → take a screenshot → send it to the messaging channel.

Behind Browser Use, Playwright or Puppeteer usually drives the browser, but the key difference is **who writes the control logic** — no longer a developer hard-coding locators and a sequence of operations, but the Agent "reading" the page in real time from a natural-language instruction and deciding what to do next.

## 3. How the Four Phases Relate: Not Replacement, but Expansion of Capability

Put these four generations of Tools side by side:

| Phase | What it operates on | Interaction mode | Typical scenario | Stability |
|------|---------|---------|---------|--------|
| File reads and writes | Local file system | Structured IO | Changing code, writing config, generating documents | ★★★★★ |
| Web/API calls | The APIs of external services | Structured request/response | Calling REST APIs, executing Shell scripts, CI/CD automation | ★★★★☆ |
| Computer Use | Desktop application interfaces | Screenshot + mouse/keyboard | Driving legacy systems that have no API | ★★★☆☆ |
| Browser Use | Web page interfaces | DOM + vision + clicks | Web automation, data collection, monitoring screenshots | ★★★☆☆ |

One key pattern: **the further to the right, the more "human-like" a Tool's operation is; the further to the left, the more "program-like".** "Human-like" means more general but less stable; "program-like" means more specialized but more reliable.

So in real engineering, the principle for choosing a Tool is: **if file reads and writes can solve it, don't call an API; if an API call can do it, don't reach for Computer Use.** Higher-level is not better — Computer Use sounds cool, but the latency and failure rate of each step are far higher than those of a stable API call. Choose the most "program-like" option, and until that option is no longer enough, take one step in the "human-like" direction.

## 4. More Tools Is Not Better

Having written out the history of their evolution, I have to say one counterintuitive thing: **more Tools is not better.**

The intuition of many Agent developers is that installing more Tools makes an Agent more capable. It is like adding functions to a Swiss Army knife — one more small blade, one more bottle opener, one more pair of tweezers — it always feels good.

But there is one fundamental difference between an Agent's Tools and a Swiss Army knife: **the Swiss Army knife's tools are physically separate, while an Agent's Tools are all crammed into the context.** Every extra Tool means one more description and one more set of parameter definitions in the System Prompt. Once the number of Tools goes up, the Agent has to "choose" among them — and that process itself consumes Tokens, consumes reasoning time, and increases the chance of choosing wrong.

Worse still: **Tools can interfere with each other.** Your JSON-validation Tool is called `validate_json`, and your weather Tool is called `get_weather`; they look like they keep to themselves. But when the Agent handles a "user request", it has to judge "which Tool's remit this request falls under". If the descriptions are not written precisely enough, the Agent may route "check this config file for me" to `get_weather` — because the config file happens to mention "deployed on the cloud", and the Agent's chain of reasoning links "cloud" to "weather".

So the design principle for Tools is not "the more the better" but **"just enough"**. The Tools you give an Agent should cover exactly what you need it to do; one more is interference.

## 5. Summary

From file reads and writes to Browser Use, the changing form of Tools reflects the steady expansion of the Agent's capability boundary. But however the form of Tools changes, a few principles have never changed:

1. **The essence of a Tool is "intent translation"** — the Agent does not really execute anything; it only outputs structured instructions. The clearer the description, the more reliably the Agent can use it.
2. **The more "program-like" the Tool you choose, the more reliable it is** — in scenarios with high stability requirements (DevOps automation, for example), prefer an API/CLI and keep Computer Use as a last resort.
3. **More Tools is not better** — every Tool is an occupation of Context and an interference with reasoning. Trimming down to just enough is the optimal answer.

Next time, we will talk about a concept that is often misunderstood — Skill. A Skill is not a sibling of Tool; it is something on another layer.

A small step forward every day is a new height!
