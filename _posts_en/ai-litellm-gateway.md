---
title: 'LiteLLM: A Unified LLM Gateway — From API Key Chaos to Enterprise AI Infrastructure'
date: 2026-05-16
author: Tang Moying
categories: [ai]
tags: [AI, LiteLLM, API Gateway, Enterprise AI, DevOps, Cost Control, Multi-Model Routing, Infrastructure]
lang: en
alt_url: /post/ai-litellm-gateway
---

When you start using large models for real work — not the occasional API call for fun, but treating them as team infrastructure — you soon hit a wall. Not the “the models aren't strong enough” wall, but the “I can't keep this under control” wall: API keys scattered everywhere, no idea who spent how much, one model goes down and the whole business goes dark, and no audit trail at all for whether data ever left the intranet. What you need at that point is not a stronger model, but a gateway that can manage models. LiteLLM is that gateway.

<!--以上为摘要内容-->

## 1. The Problem: When You Start Treating AI as Infrastructure

Over the past two years, the path large models have taken into production has looked roughly like this: first individuals chatting with ChatGPT → then teams using APIs for various experiments → then AI capabilities gradually embedding into daily workflows and becoming a “standard component”, just like your database or your message queue.

The problems start at the third step. Once AI goes from a “personal toy” to “enterprise infrastructure”, you'll find:

**Scenario one: API keys scattered everywhere.** The algorithm team uses OpenAI, the product team uses Claude, intranet scenarios use a local vLLM. Every team manages its own keys and writes its own calling code. One department with five project teams may have five different ways of integrating models. Ops wants unified management? Sorry — nobody can say with confidence how many keys are actually in circulation.

**Scenario two: the cost black hole.** No idea which team spent how many tokens. At month-end the OpenAI bill is one big lump: you can't tell which project ran batch offline jobs on GPT-4, and which team used a flagship model for simple translation. Budget control can only be all-or-nothing; there's no way to be precise down to team, project or environment.

**Scenario three: a chain of single points of failure.** OpenAI goes down and every service depending on it grinds to a halt. A local vLLM instance restarts and the running jobs all fail together. There is no fallback mechanism at all — not because nobody thought of it, but because “the cost of changing code to add a Fallback is too high”.

**Scenario four: compliance audit blind spots.** There's no unified log of who called which model and what data they sent. Whether sensitive data was sent out to a public model API is completely untraceable after the fact — not because you don't want to control it, but because you can't.

These four scenarios point to the same root cause: **the model-calling layer lacks a unified gateway.** Just as in a microservices architecture you would never let every service manage its own database connections and message queues — you add a layer in between. The same goes for large models: you need a unified access layer between your business and the models. LiteLLM is that access layer.

## 2. What LiteLLM Is

LiteLLM is an open-source LLM gateway (GitHub 20K+ stars), maintained by the BerriAI team. Its core idea is simple: **unify all model APIs into the OpenAI-compatible format — one endpoint, one interface protocol, calling 100+ kinds of models.**

It has two usage modes:

- **SDK mode**: a pure Python library, `pip install litellm`, suited to local scripts and small tools.
- **Proxy mode**: a standalone HTTP service, the standard way to run it in production.

This article focuses on **Proxy mode** — that's the way enterprises use it. Proxy mode not only provides a unified interface, but also a full set of gateway capabilities: routing, rate limiting, multi-tenant budgets, audit logs, Fallback and more.

**Why the “OpenAI-compatible format”?** It's the de facto industry standard today. The vast majority of AI tools — Hermes Agent, OpenClaw, Cline, OpenHands — support connecting to models through an OpenAI-compatible interface. LiteLLM wraps all your models (whether the backend is OpenAI, Claude, a local vLLM or Azure) into the OpenAI-compatible format. On the business side you only change `base_url` and `api_key`; you don't touch application code.

## 3. Hands On: Deploying a LiteLLM Gateway Quickly

Let's start with a minimal version that unifies the models, then add features step by step.

### 3.1 Minimal Working Configuration

`config.yaml`:

```yaml
model_list:
  - model_name: fast
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY

  - model_name: smart
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

  - model_name: local-qwen
    litellm_params:
      model: openai/qwen2.5-14b-instruct
      api_base: http://vllm-internal:8000/v1
      api_key: EMPTY

general_settings:
  master_key: sk-master-xxxxxx

litellm_settings:
  drop_params: true
  cache: true
```

Start it with a single Docker command:

```bash
docker run -d --name litellm -p 4000:4000 \
    -v $PWD/config.yaml:/app/config.yaml \
    -e OPENAI_API_KEY=$OPENAI_API_KEY \
    ghcr.io/berriai/litellm:v1.85.0 \
    --config /app/config.yaml --num_workers 4
```

Verify it:

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-master-xxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"model": "fast", "messages": [{"role": "user", "content": "Who are you?"}]}'
```

You'll get back a normal OpenAI-format response. To the business side, this is an “OpenAI service” — except that behind it, it may point at any model at all.

### 3.2 Connecting a Local vLLM

The most common intranet setup: local models as the mainstay, public models as a supplement. Add one entry to `model_list`:

```yaml
  - model_name: local-qwen
    litellm_params:
      model: openai/qwen2.5-14b-instruct
      api_base: http://your-gpu-server:8000/v1
      api_key: EMPTY
```

`model: openai/xxx` means: call it using the OpenAI-compatible protocol. `api_base` points at your vLLM instance. For any tool that supports an OpenAI-compatible interface — Hermes, OpenClaw, Cline — just change `base_url` to `http://litellm:4000`.

### 3.3 Key Security Settings

A few details that are easy to overlook:

- **Pin the image version** (`v1.85.0` rather than `latest`). In March 2026 there was an incident in which malicious code was injected into LiteLLM's PyPI package; since then, pinning the version and verifying image signatures is strongly recommended.
- **Salt Key**: `LITELLM_SALT_KEY` is used to encrypt the provider API keys in the database. Never change it once deployed — change it and all the historical encrypted data becomes undecryptable.
- **Master Key** is only for administrative operations, not for business calls. Use a Virtual Key for everyday calls.

## 4. Core Features: Routing and Fallback

Providing a unified interface alone isn't enough. The gateway's real value lies in **traffic control**.

### 4.1 Model Aliases — the Business Side Doesn't Notice Backend Changes

Give a model a “business name” (`fast`, `smart`, `local`); several backends can hang under the same business name:

```yaml
model_list:
  - model_name: fast
    litellm_params:
      model: openai/gpt-4o-mini
  - model_name: fast
    litellm_params:
      model: azure/gpt-4o-mini

router_settings:
  routing_strategy: simple-shuffle
```

Your business code calls `model="fast"`; whether that actually goes to OpenAI or Azure behind the scenes is decided by the gateway. Ops can switch the underlying model without the business changing a single line of code.

### 4.2 Fallback — a Dead Model Doesn't Affect the Business

This is a standard gateway capability:

```yaml
router_settings:
  fallbacks:
    - fast: ["smart", "local-qwen"]
  context_window_fallbacks:
    - fast: ["smart"]
  content_policy_fallbacks:
    - smart: ["fast"]
```

Three Fallback scenarios:
- **The model is down** (`fallbacks`): when OpenAI is unavailable, traffic automatically goes to Claude → local model. Users notice nothing.
- **Context limit exceeded** (`context_window_fallbacks`): when `gpt-4o-mini` runs out of context, automatically upgrade to `gpt-4o`.
- **Content policy refusal** (`content_policy_fallbacks`): when a model refuses to answer for compliance reasons, retry with another model.

**Fallback strategy advice for intranet DevOps scenarios**: in data-sensitive cases, fall back only to local models and never go to the public internet; in non-sensitive cases, public models can back each other up. Use model grouping and routing strategy for fine-grained control — for example, configure the `local-*` model group to fall back only within the group.

### 4.3 Choosing a Routing Strategy

| Strategy | How it works | When to use it |
|------|------|----------|
| `simple-shuffle` | Simple round-robin (automatically weighted when there are rpm/tpm limits) | Small to medium scale, good enough |
| `least-busy` | Routes to the backend with the lowest current load (requires Redis) | High concurrency, many replicas |
| `usage-based-routing-v2` | Spreads pressure by TPM usage rate | Multi-instance deployments |
| `latency-based-routing` | Selects by response latency | Latency-sensitive services |

For a small team, `simple-shuffle` is enough. When you need to scale vLLM instances out horizontally, move up to `least-busy`.

## 5. Enterprise Features: Multi-Tenancy and Budget Control

This may be the most “valuable” part of LiteLLM for DevOps teams — **managing AI resources as infrastructure**.

### 5.1 Production Deployment: Add Postgres

The minimal configuration has no database and can only be driven by `config.yaml`. In production you need Postgres to store virtual keys, team configuration and spend logs:

```yaml
general_settings:
  master_key: sk-master-xxxx
  database_url: postgresql://litellm:password@postgres:5432/litellm
```

A Docker Compose reference:

```yaml
services:
  postgres:
    image: postgres:18-alpine
    environment:
      POSTGRES_DB: litellm
      POSTGRES_USER: litellm
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U litellm"]
      interval: 5s
      timeout: 5s
      retries: 5

  litellm:
    image: ghcr.io/berriai/litellm:v1.85.0
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "4000:4000"
    volumes:
      - ./config.yaml:/app/config.yaml
    environment:
      DATABASE_URL: postgresql://litellm:${DB_PASSWORD}@postgres:5432/litellm
      LITELLM_MASTER_KEY: ${LITELLM_MASTER_KEY}
      LITELLM_SALT_KEY: ${LITELLM_SALT_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    command: --config /app/config.yaml --num_workers 4

volumes:
  pgdata:
```

With a database in place, all of LiteLLM's operation history is recorded automatically in the `LiteLLM_SpendLogs` table, and from then on API calls have a complete “ledger”.

### 5.2 The Admin Panel — Day-to-Day Ops Without curl

Once the database is configured, LiteLLM's built-in web admin panel is activated. Visit `http://litellm:4000/ui` and log in with the Master Key, and you'll see a complete admin interface. Here you can:

- Create and manage Teams, setting a per-team budget cap and a whitelist of available models
- Generate, revoke and edit Virtual Keys — bind them to a Team, set a spending limit, configure rate limits
- View the live request stream, per-model QPS and P95 latency
- Browse spend reports and break spending down by team, Key and model
- Search call logs to quickly locate errors

This is what ops looks like when it follows engineering practice. Day-to-day operations — issuing a Key for a new project, adjusting a team budget, revoking a leaked Key — are all done with a few clicks in the UI. No digging through docs to type curl commands.

The API examples below are kept for two purposes: first, to show the full meaning of every parameter (the UI and the API correspond one-to-one), and second, to make it easy for you to automate operations in CI/CD or ops scripts.

### 5.3 Team — Resource Isolation by Team

Creating a Team in the admin panel takes only a name, a budget and the allowed models. The API parameters behind it are as follows:

```bash
# Create the backend team
curl http://litellm:4000/team/new \
  -H "Authorization: Bearer sk-master-xxxx" \
  -d '{
    "team_alias": "backend-team",
    "max_budget": 500.0,
    "budget_duration": "30d",
    "models": ["fast", "smart", "local-qwen"]
  }'

# Create the product team (cheap models only)
curl http://litellm:4000/team/new \
  -H "Authorization: Bearer sk-master-xxxx" \
  -d '{
    "team_alias": "product-team",
    "max_budget": 100.0,
    "budget_duration": "30d",
    "models": ["fast", "local-qwen"]
  }'
```

One budget cycle is 30 days; requests are automatically rejected once the budget is exceeded, so there are no end-of-month reconciliation shocks.

### 5.4 Virtual Key — Fine-Grained Control by Environment and by Service

In the admin panel, open a Team's detail page and click “Create Key” to generate a Virtual Key — just fill in an alias, budget, rate limits and a model whitelist. The corresponding API parameters are as follows:

```bash
# Production: permissive
curl http://litellm:4000/key/generate \
  -H "Authorization: Bearer sk-master-xxxx" \
  -d '{
    "key_alias": "backend-prod",
    "team_id": "team-id-xxx",
    "max_budget": 400.0,
    "budget_duration": "30d",
    "tpm_limit": 200000,
    "rpm_limit": 1000,
    "models": ["fast", "smart", "local-qwen"]
  }'

# Development: rate-limited, to prevent misuse
curl http://litellm:4000/key/generate \
  -H "Authorization: Bearer sk-master-xxxx" \
  -d '{
    "key_alias": "backend-dev",
    "team_id": "team-id-xxx",
    "max_budget": 100.0,
    "budget_duration": "30d",
    "tpm_limit": 20000,
    "rpm_limit": 100,
    "models": ["fast", "local-qwen"]
  }'
```

### 5.5 Using It from the Business Side — Completely Transparent

Once you have a Virtual Key, the business side simply uses it as an OpenAI key:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://litellm-internal:4000/v1",
    api_key="sk-xxxx-backend-prod-virtual-key"
)

response = client.chat.completions.create(
    model="fast",
    messages=[{"role": "user", "content": "Write a unit test for me"}]
)
```

From the business side it's completely invisible — they neither know nor care whether the backend is OpenAI, Claude or a local vLLM. They only need to know “same place, same Key, same format”.

## 6. Cost Tracking and Observability

Once LiteLLM is connected to Postgres, every API call is recorded in the `LiteLLM_SpendLogs` table. The core fields: which Team, which Key, which model, input/output tokens, the amount spent (US dollars), and a timestamp.

### 6.1 The Admin Panel — Check Spending in the UI Day to Day

The admin panel (`http://litellm:4000/ui`) comes with a Usage page, so checking spending day to day doesn't require leaving the browser:

- **Spend**: view team spending trends by day/week/month, and see at a glance how much each Key has spent
- **Usage**: request volume, token consumption and average latency per model
- **Logs**: detailed logs for every call — request content, response, cost, latency — with filtering and search
- **Teams / Keys**: budget utilization per team, so you can see directly which one is about to exceed its budget

Checking spending, reconciling, tracking down “why did this Key spend so much today” — the UI handles all of it. This is the way that matches engineering instincts: first give people something to look at, then talk about advanced tricks.

### 6.2 Going Further: Query the Database Directly

When the UI's aggregation dimensions aren't enough — say you want to group by project tag (`metadata`), export CSV for finance, or feed an internal data platform — you can query the `LiteLLM_SpendLogs` table directly:

```sql
-- Team spend ranking for the last 7 days
SELECT team_id, SUM(spend) AS total_spend, COUNT(*) AS num_requests
FROM "LiteLLM_SpendLogs"
WHERE "startTime" > NOW() - INTERVAL '7 days'
GROUP BY team_id
ORDER BY total_spend DESC;
```

```sql
-- Daily spend trend for a given Key
SELECT DATE("startTime") AS day, SUM(spend) AS daily_spend
FROM "LiteLLM_SpendLogs"
WHERE api_key = 'sk-xxxx-backend-prod'
GROUP BY day
ORDER BY day DESC;
```

For DevOps, SQL is flexible for aggregating by any dimension and for join analysis. But day-to-day ops doesn't need it — the UI is enough.

Beyond that, if you already have a monitoring stack such as Grafana, LiteLLM can also expose Prometheus metrics, which can be wired into your existing dashboards.

### 6.3 Alerting Strategy Advice

The same thinking as for any other infrastructure you operate — key metrics must have alerts:

- A single team's daily spend exceeds 60% of its budget → notify the team lead
- A Key's RPM suddenly jumps 5x → risk alert (could be a code bug or a leaked Key)
- A backend model's error rate stays above 10% for 5 minutes → ops alert
- A local vLLM instance becomes unavailable → alert immediately (the intranet model is a core dependency)

## 7. A Kubernetes Production Deployment Reference

If your team uses K8s, here's a reference structure:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: litellm
spec:
  replicas: 2
  selector:
    matchLabels:
      app: litellm
  template:
    metadata:
      labels:
        app: litellm
    spec:
      containers:
        - name: litellm
          image: ghcr.io/berriai/litellm:v1.85.0
          args:
            - "--config=/etc/litellm/config.yaml"
            - "--num_workers=4"
            - "--port=4000"
          ports:
            - containerPort: 4000
          envFrom:
            - secretRef:
                name: litellm-secrets
          volumeMounts:
            - name: config
              mountPath: /etc/litellm
              readOnly: true
          livenessProbe:
            httpGet:
              path: /health/liveliness
              port: 4000
          readinessProbe:
            httpGet:
              path: /health/readiness
              port: 4000
          resources:
            requests:
              cpu: 500m
              memory: 512Mi
            limits:
              cpu: 2
              memory: 2Gi
      volumes:
        - name: config
          configMap:
            name: litellm-config
```

A few key points:
- **Multiple replicas**: LiteLLM itself is stateless (state lives in Postgres), so multiple replicas natively support high availability. `--num_workers 4` is the number of workers inside each replica.
- **Secret management**: the Master Key, Salt Key and every provider's API Key all come from K8s Secrets — never hard-code them into the ConfigMap.
- **Health checks**: `/health/liveliness` and `/health/readiness` are LiteLLM's own standard endpoints.
- **Redis**: in multi-replica scenarios, add Redis (`router_settings.redis_host`) so that replicas share routing state.

## 8. Lessons from the Trenches

Pitfalls that are easy to hit during an actual deployment:

**1. The side effects of drop_params.** Once enabled, parameters that the target model doesn't support are silently dropped. In multi-model scenarios this is genuinely convenient — you pass `reasoning_effort=high` to GPT-4o, and it's automatically dropped when the request routes to Claude, without an error. But during debugging, turn it off first, or you'll find yourself asking “I clearly passed the parameter, so why isn't it taking effect?”

**2. Postgres connection bloat.** `num_workers=4` + 2 replicas = 8 database connection pools. If your Postgres is configured with a low `max_connections`, you may run out of connections. The solution is to put PgBouncer in front, or lower `database_connection_pool_limit`.

**3. A Fallback may be more expensive.** The fallback model may cost more than the primary — for example, `gpt-4o-mini` goes down and traffic falls back to `gpt-4o`, a 10x price difference. When configuring a Fallback chain, confirm the price of each model and prefer ones in the same price range.

**4. The Salt Key cannot be changed.** Generate `LITELLM_SALT_KEY` before deployment, and never change it afterwards. Once changed, every encrypted Provider Key in the database becomes undecryptable, and you need to wipe the database and rebuild it.

**5. Don't mix configuration sources.** After `store_model_in_db: true`, model configuration is loaded from the database. At that point, don't modify `config.yaml` and add or remove models through the API at the same time — the two configuration sources overwrite each other, and debugging that is painful. Pick one approach and stick with it to the end.

**6. Don't expose local models to the public internet.** LiteLLM can mix local vLLM and public models on one gateway. Take care to use `model.info.access_groups` for access control — make sure call chains carrying sensitive data only route to local models.

## 9. Wrapping Up: Back to “Infrastructure” Thinking

Going from large-model APIs to a unified gateway, the essence of that leap is a switch in thinking — from “using AI tools” to “operating AI infrastructure”. Just as you wouldn't hard-code a database connection string into every microservice, you shouldn't let every team manage its own API Keys, maintain its own Fallback logic and do its own reconciliation.

The problems LiteLLM solves are exactly the ones you inevitably run into on the way from “one person calling an API” to “a team using AI”: a unified entry point, traffic control, cost accounting, security auditing. It doesn't produce stronger AI, but it makes your AI infrastructure as manageable, measurable and auditable as your database or your message queue.

The deployment cost isn't high — one Docker Compose (Postgres + LiteLLM) plus the vLLM instance you already have, and it's running on your intranet in half an hour. Worth a try.

A small step forward every day is a new height!
