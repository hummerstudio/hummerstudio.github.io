---
title: 'Local LLMs in Practice (Part 1): Building Your AI Infrastructure on the Intranet'
date: 2026-03-07
author: Tang Moying
categories: [ai]
tags: [AI, Ollama, vLLM, Open WebUI, Local LLMs, Intranet Deployment]
lang: en
alt_url: /post/ai-local-llm-01-infra
---

When the company you work for can't use public-cloud LLMs because of data compliance rules, security policy or network isolation, does that mean AI capability stops there? The answer is no. With a combination of three open-source tools — Ollama, vLLM and Open WebUI — you can build a complete local AI infrastructure on your intranet, giving your team LLM inference that gives nothing away to the public-cloud experience, all of it without an internet connection.

<!--以上为摘要内容-->

## 1. Think It Through First: Why Run an LLM Yourself?

Calling the APIs of public-cloud LLMs (OpenAI, Claude, Qwen and so on) is certainly convenient, but in plenty of situations that road is closed. It's not a technical problem; it's a real-world constraint:

**First, the data stays in the building.** Finance, government and healthcare have hard data compliance requirements. Your code, your internal documents, your business data are not allowed to travel over the public internet — not even as a Prompt sent to an AI. This isn't "feeling that something is unsafe", it's "the regulations don't allow it".

**Second, there isn't even a network.** Classified networks, R&D intranets, defense environments — these networks are physically isolated by design. Never mind an API; they can't even resolve DNS. In an environment like that, AI capability can only be built in-house.

**Third, the cost is controllable.** Public APIs bill by Token, and with heavy use the monthly bill can be frightening. The marginal cost of a local deployment is close to zero — just electricity and GPU depreciation. The bigger the team, the more obvious the difference.

**Fourth, the capability is controllable.** The model you use won't be quietly upgraded by the provider, won't suddenly change behavior, won't get rate-limited. You decide when to switch models, when to fine-tune, when to adjust parameters.

But running an LLM yourself isn't something you finish by installing one piece of software. You need to get clear on three layers of the problem: how to get a model running (the inference runtime), how to guarantee performance (a production-grade inference engine), and how to let other people use it too (the interaction interface). Those three things happen to map exactly onto the three tools we're going to talk about today.

## 2. Three Tools, Each With Its Own Job

Here's a quick overview table so you can see where you fit:

| Tool | Role | Core value | Where it fits |
|------|------|----------|----------|
| **Ollama** | Model runtime | One command to bring up a model, zero configuration | Personal development, quick trials, lightweight deployment |
| **vLLM** | Production-grade inference engine | High throughput, low latency, efficient VRAM use | Team sharing, API as a service, high concurrency |
| **Open WebUI** | Interaction interface | A ChatGPT-style web interface | Lets non-technical people use LLMs too |

These three tools are not competitors; they are **complementary**. Ollama gets you running in a few minutes, vLLM gets you running well in a team setting, and Open WebUI gets everyone running.

In real work, the path most teams take looks like this: first use Ollama to get the model working and verify that it's usable, then move to vLLM for production deployment and to serve an API to others, and finally hang Open WebUI on it for the team's daily use. Let's look at each one in turn.

## 3. Ollama: The One-Command Model Runtime

If you remember only one sentence, remember this one: **Ollama makes running an LLM as simple as `docker run`.**

```bash
# Install Ollama (macOS / Linux)
curl -fsSL https://ollama.com/install.sh | sh

# Run a model
ollama run llama3.2
```

Two steps. No CUDA version to configure, no model weights to download by hand, no Python script to write. Ollama does all the dirty work for you.

The first time you run `ollama run`, it automatically pulls the model files from the model repository (usually somewhere between 4GB and a few dozen GB). Once the download finishes you enter an interactive chat and can talk to the model right there in your terminal. The experience is much like the command-line version of ChatGPT.

A few useful Ollama operations:

```bash
# List the models you already have locally
ollama list

# Pull a specific model (without entering a chat)
ollama pull qwen2.5:14b

# Start in API mode (expose an HTTP endpoint)
ollama serve

# Call it through the API
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:14b",
  "prompt": "Explain what DevOps is",
  "stream": false
}'
```

The `/api/generate` endpoint that `ollama serve` exposes is compatible with the OpenAI API format. That means any tool that supports an OpenAI-compatible interface can switch to Ollama seamlessly — you only need to change `base_url` from `https://api.openai.com` to `http://localhost:11434`.

Ollama's model management is intuitive too. The official model repository holds hundreds of pre-quantized models, from Llama, Qwen and Mistral to CodeGemma and DeepSeek-Coder, covering the two mainstream use cases of general conversation and code generation. The model tags let you see versions at different parameter sizes and quantization levels, such as `qwen2.5:7b`, `qwen2.5:14b` and `qwen2.5:32b`.

**But Ollama has one obvious limitation: weak concurrency.** By default it handles requests on a single thread, so when several people call it at the same time, later requests have to queue. That is why team settings need vLLM.

## 4. vLLM: When "It Works" Isn't Enough and You Need "It Works Well"

Ollama is fine for you on your own. But when your goal is to **get the whole team onto an LLM through an API**, what you need is a production-grade inference engine. That is what vLLM is for.

vLLM's core capability can be explained with a few numbers: compared with the default inference of HuggingFace Transformers, its throughput can be **10 to 20 times** higher. This is not marketing talk; it comes from one key thing it does — **PagedAttention**.

In traditional Transformer inference, the KV Cache (the intermediate results of the attention mechanism) is allocated per request, with each request holding a block of VRAM exclusively. When a request generates a long piece of text, it reserves a large block of VRAM, even though most of the time that space goes unused. This leads to VRAM fragmentation and concurrency that won't climb.

vLLM's PagedAttention borrows the idea of virtual memory paging from the operating system — it cuts the KV Cache into fixed-size blocks that are allocated on demand and mapped dynamically. This improvement lifts VRAM utilization a long way: on the same hardware, the level of concurrency jumps from single digits to dozens or even a hundred.

```bash
# Install vLLM
pip install vllm

# Start an inference service compatible with the OpenAI API
vllm serve Qwen/Qwen2.5-14B-Instruct \
  --host 0.0.0.0 \
  --port 8000 \
  --max-model-len 8192 \
  --gpu-memory-utilization 0.9
```

Once it is started, vLLM also exposes the OpenAI-compatible `/v1/chat/completions` endpoint. Your application needs no changes at all — just point `OPENAI_API_BASE` at vLLM's address.

vLLM also has some practical production features:

- **Continuous Batching**: it does not wait for every request in a batch to finish before handling the next one, but inserts new requests dynamically. The inference process never spins idle.
- **Quantization support**: it supports GPTQ, AWQ, FP8 and other quantization formats to reduce VRAM usage.
- **Multi-GPU inference**: a model too large for a single graphics card is automatically split across several cards.

When should you move from Ollama to vLLM? A simple test: **when you find Ollama requests queuing for more than 5 seconds, it is time for vLLM.** That moment usually corresponds to the team growing past 3 to 5 people, or to a plan to call the LLM as the underlying service of some application.

## 5. Open WebUI: Giving Your LLM a Good-Looking "Storefront"

Chatting with an LLM in the command line — you're fine with it, your colleagues may not be. A product manager, a designer, a manager — what they need is an interface that opens in a browser and looks like ChatGPT.

Open WebUI is what does this. It can connect to Ollama's API, or directly to an OpenAI-compatible API (including vLLM). Deployment is simple too:

```bash
# Deploy with Docker, one line does it
docker run -d -p 3000:8080 \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  -v open-webui:/app/backend/data \
  --name open-webui \
  ghcr.io/open-webui/open-webui:main
```

Open a browser and visit `http://localhost:3000` and you will see an interface almost identical to ChatGPT. Conversations are saved automatically, multi-turn chat is supported, file upload as context is supported, and Markdown rendering and code highlighting are supported.

But Open WebUI is not just a "skin". It has several features that are very practical in a team setting:

**Switching between multiple models**: you can switch the underlying model at any time in the chat interface. You can connect both a general conversation model (such as Qwen) and a code model (such as DeepSeek-Coder), using the former when chatting and the latter when writing code.

**Multi-user management**: registration and login are supported, and an administrator can control who gets to use which models. Not everyone needs the strongest model — assign a 7B model for everyday Q&A and a 32B model for code generation, allocating resources sensibly.

**Document RAG**: you can upload the team's internal documents (technical designs, API docs, operations manuals) and Open WebUI will automatically vectorize and retrieve them. After that, in a conversation, the model can cite those documents in its answers. This is especially useful in a situation where "the intranet has no search engine and the documents are scattered everywhere".

## 6. Putting It Together: What a Team's Intranet AI Infrastructure Looks Like

Each of the three tools is simple on its own; put them together and it's a different story. Here is a typical team deployment topology:

```text
┌──────────────────────────────────────────┐
│  User browser (Open WebUI :3000)         │
│  ┌─────────────────────────────────────┐ │
│  │ Chat UI / Doc upload / Model switch │ │
│  └──────────────┬──────────────────────┘ │
└─────────────────┼────────────────────────┘
                  │ API call
┌─────────────────▼────────────────────────┐
│  vLLM inference service (:8000)          │
│  ┌─────────────────────────────────────┐ │
│  │ Model: Qwen2.5-14B (general)        │ │
│  │ Model: DeepSeek-Coder-V2 (code)     │ │
│  │ → High concurrency / Batching / VRAM│ │
│  └─────────────────────────────────────┘ │
└─────────────────┬────────────────────────┘
                  │ running on
┌─────────────────▼────────────────────────┐
│  GPU server                              │
│  2× A100 or 4× RTX 4090                  │
└──────────────────────────────────────────┘
```

Under this topology, developers can call the LLM through the API from their IDE for code completion, a product manager can have the model help polish a PRD in Open WebUI, and the ops person can let the model read the operations manual and help troubleshoot. Everyone shares the same underlying inference service, but each takes what they need.

The deployment order is clear as well:
1. **Install Ollama on the GPU server first.** Use it to pull models quickly and test the results, confirming that "this model will do".
2. **Then move to vLLM.** Migrate the model from Ollama to vLLM, configure the concurrency parameters, and open the API to the team.
3. **Finally hang Open WebUI on it.** Connect it to vLLM's API, turn on multi-user mode, and upload the internal documents.

## 7. Get It Running First, but Don't Expect Too Much

One last piece of practical advice.

Many teams hesitate for a long time over the question of whether to build their own LLM setup. They worry the hardware isn't good enough, worry the model isn't strong enough, worry the maintenance cost is high. And so they put off starting, and AI capability stays absent.

My advice is: **start with an idle GPU machine plus Ollama plus Open WebUI.** A single RTX 3090 can run a 7B to 14B parameter model.

But first be clear about what it can do and what it demands of the hardware.

Small local models do fairly well on tasks like **document Q&A, text summarization, format conversion and simple script generation**, and a single RTX 3090 running a 7B to 14B model is up to the job.

But **code generation** demands much more of a model. Even code written by a top-tier cloud LLM needs human review and revision, and for local code generation to reach a level close to a public-cloud LLM you need to deploy a model with a much larger parameter count (DeepSeek-V3 or Qwen at 70B and above, for example), which means multiple cards or even multiple machines, and both hardware investment and operations cost rise significantly. A large company with an ample GPU budget can take this road — the vLLM we discussed earlier supports multi-GPU inference, and with the hardware in place the local code-assistant experience can approach the public-cloud level. But for an ordinary team, the cost-benefit ratio needs to be weighed carefully.

In other words, once it is running you will discover two things: first, that lightweight tasks really are usable and produce output; second, that heavy tasks need heavy investment and won't be handled by one consumer-grade graphics card. Knowing these two things in advance beats hesitating forever and never running it at all.

**AI capability doesn't fall out of the sky; you have to bring it in yourself.** And the Ollama, vLLM and Open WebUI trio is currently the lowest-cost, shortest-path way of bringing it in. But how much it can do once it is in depends on whether you clearly recognize its boundaries.

A small step forward every day is a new height!
