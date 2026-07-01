---
title: LiteLLM——统一 LLM 网关：从 API Key 乱象到企业级 AI 基础设施
author: 唐明
categories: [ai]
tags: [AI, LiteLLM, API 网关, 企业级 AI, DevOps, 成本控制, 多模型路由, 基础设施]
---

当你开始用大模型做正经事——不是偶尔调一下 API 玩，而是把它当成团队基础设施来用——你会很快撞上一面墙。不是“模型不够强”那面，而是“管不住”这面：API Key 满天飞、不知道谁花了多少钱、某个模型挂了全部业务瘫掉、数据出没出内网完全不可审计。这时候你需要的不是一个更强的模型，而是一个能管理模型的网关。LiteLLM 就是这个网关。

<!--以上为摘要内容-->

## 一、问题：当你开始把 AI 当基础设施用

过去两年，大模型落地路径大致是这样的：先是个人用 ChatGPT 聊天 → 团队用 API 做各种尝试 → AI 能力逐渐嵌入到日常工作流中，变成和数据库、消息队列一样的“标配组件”。

问题就出在第三步。当 AI 从“个人玩具”变成“企业基础设施”，你会发现：

**场景一：API Key 满天飞。** 算法团队用 OpenAI，产品团队用 Claude，内网场景用本地 vLLM。每个团队各管各的 Key，各写各的调用代码。一个部门有五个项目组，就可能有五种不同的模型接入方式。运维想统一管理？对不起，谁也说不清楚到底有多少个 Key 在流通。

**场景二：成本黑洞。** 不知道哪个团队花了多少 Token。月结时 OpenAI 账单是一坨，分不清哪个项目用了 GPT-4 跑批量离线任务，哪个团队拿旗舰模型做简单翻译。想控制预算只能“一刀切”，没法精确到团队、项目、环境。

**场景三：单点故障链。** OpenAI 挂了，所有依赖它的服务全部停摆。本地 vLLM 实例重启，正在跑的任务集体失败。没有任何兜底机制——不是没想到，而是“改代码加 Fallback 的代价太大”。

**场景四：合规审计盲区。** 谁调了什么模型、传了哪些数据，没有统一日志。敏感数据是不是被发到了公网模型 API，事后完全不可追溯——不是不想管，是没法管。

这四个场景指向同一个根因：**模型调用层缺少统一的网关。** 就像微服务架构里，你不可能让每个服务自己去管理数据库连接和消息队列——你需要在中间加一层。大模型也一样，你需要在业务和模型之间加一个统一的接入层。LiteLLM 就是这个接入层。

## 二、LiteLLM 是什么

LiteLLM 是一个开源 LLM 网关（GitHub 20K+ Star），由 BerriAI 团队维护。它的核心思路很简单：**把所有模型 API 统一成 OpenAI 兼容格式，一个端点、一个接口协议，调用 100+ 种模型。**

它有两种使用模式：

- **SDK 模式**：纯 Python 库，`pip install litellm`，适合本地脚本和小工具。
- **Proxy 模式**：独立 HTTP 服务，生产环境的标准用法。

本文聚焦 **Proxy 模式**——这才是企业用的方式。Proxy 模式不仅提供统一接口，还提供路由、限流、多租户预算、审计日志、Fallback 兜底等全套网关能力。

**为什么是“OpenAI 兼容格式”？** 这是目前事实上的行业标准。绝大多数 AI 工具——Hermes Agent、OpenClaw、Cline、OpenHands——都支持以 OpenAI 兼容接口接入模型。LiteLLM 把你的所有模型（不管背后是 OpenAI、Claude、本地 vLLM 还是 Azure）都包装成 OpenAI 兼容格式。业务侧只需要改 `base_url` 和 `api_key`，不碰业务代码。

## 三、动手：快速部署 LiteLLM 网关

先搭一个最简版，把模型统一起来。然后逐步加功能。

### 3.1 最小可用配置

`config.yaml`：

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

用 Docker 一行启动：

```bash
docker run -d --name litellm -p 4000:4000 \
    -v $PWD/config.yaml:/app/config.yaml \
    -e OPENAI_API_KEY=$OPENAI_API_KEY \
    ghcr.io/berriai/litellm:v1.85.0 \
    --config /app/config.yaml --num_workers 4
```

验证一下：

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-master-xxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"model": "fast", "messages": [{"role": "user", "content": "你是谁？"}]}'
```

你会收到正常的 OpenAI 格式响应。对业务侧来说，这就是一个“OpenAI 服务”——只是它背后可能指向任何模型。

### 3.2 接本地 vLLM

内网场景最常见：主用本地模型，公网模型做补充。在 `model_list` 里加一条：

```yaml
  - model_name: local-qwen
    litellm_params:
      model: openai/qwen2.5-14b-instruct
      api_base: http://your-gpu-server:8000/v1
      api_key: EMPTY
```

`model: openai/xxx` 的意思是：用 OpenAI 兼容协议调用。`api_base` 指向你的 vLLM 实例。所有支持 OpenAI 兼容接口的工具——Hermes、OpenClaw、Cline——把 `base_url` 改成 `http://litellm:4000` 就行了。

### 3.3 关键安全配置

几个容易被忽略的细节：

- **用固定的镜像版本**（`v1.85.0` 而非 `latest`），2026 年 3 月 LiteLLM 的 PyPI 包曾发生过恶意代码植入事件，自那以后强烈建议固定版本并做镜像签名验证。
- **Salt Key**：`LITELLM_SALT_KEY` 用于加密数据库中的 Provider API Key。一旦部署后绝不要更改——换了之后历史的加密数据全部无法解密。
- **Master Key** 只用于管理操作，不用于业务调用。日常调用用 Virtual Key。

## 四、核心功能：路由与 Fallback

只做统一接口不够。网关真正的价值在于**流量控制**。

### 4.1 模型别名——业务侧不感知后端变化

给模型起一个“业务名”（`fast`、`smart`、`local`），同一个业务名下可以挂多个后端：

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

业务代码里调用 `model="fast"`，背后到底走 OpenAI 还是 Azure，由网关决定。运维切换底层模型，业务一行代码不用改。

### 4.2 Fallback——模型挂了业务不受影响

这是网关的标配能力：

```yaml
router_settings:
  fallbacks:
    - fast: ["smart", "local-qwen"]
  context_window_fallbacks:
    - fast: ["smart"]
  content_policy_fallbacks:
    - smart: ["fast"]
```

三种 Fallback 场景：
- **模型挂了**（`fallbacks`）：OpenAI 不可用时自动走 Claude → 本地模型。用户无感知。
- **上下文超限**（`context_window_fallbacks`）：`gpt-4o-mini` 上下文不够时自动升级到 `gpt-4o`。
- **内容策略拒绝**（`content_policy_fallbacks`）：某个模型因合规原因拒绝回答时，换另一个模型重试。

**DevOps 内网场景的 Fallback 策略建议**：数据敏感场景只 Fallback 到本地模型，不走公网；非敏感场景可以公网模型互备。通过模型分组和路由策略实现精细控制——比如给 `local-*` 模型组配置只在组内 Fallback。

### 4.3 路由策略选择

| 策略 | 原理 | 适用场景 |
|------|------|----------|
| `simple-shuffle` | 简单轮询（有 rpm/tpm 限制时自动加权） | 中小规模，够用 |
| `least-busy` | 路由到当前负载最低的后端（需 Redis） | 高并发，多副本 |
| `usage-based-routing-v2` | 按 TPM 使用率分散压力 | 多实例部署 |
| `latency-based-routing` | 按响应延迟选择 | 对延迟敏感的服务 |

小团队用 `simple-shuffle` 就够了。当你需要横向扩展 vLLM 实例时，上 `least-busy`。

## 五、企业级功能：多租户与预算控制

这可能是 LiteLLM 对 DevOps 团队最“值钱”的部分——**把 AI 资源当成基础设施来管理**。

### 5.1 生产部署：加 Postgres

最小配置没有数据库，只能靠 `config.yaml` 驱动。生产环境需要 Postgres 来存储虚拟密钥、团队配置和花费日志：

```yaml
general_settings:
  master_key: sk-master-xxxx
  database_url: postgresql://litellm:password@postgres:5432/litellm
```

Docker Compose 参考：

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

有了数据库，LiteLLM 所有操作历史自动记录到 `LiteLLM_SpendLogs` 表，从此 API 调用有了完整的“账本”。

### 5.2 管理面板——日常运维不靠 curl

配好数据库后，LiteLLM 自带的 Web 管理面板就激活了。访问 `http://litellm:4000/ui`，用 Master Key 登录，你会看到一个完整的管理界面。在这里可以：

- 创建和管理 Team，设置每团队预算上限和可用模型白名单
- 生成、吊销、编辑 Virtual Key——绑定 Team、设消费额度、配速率限制
- 查看实时请求流、各模型 QPS 和 P95 延迟
- 浏览花费报表，按团队、Key、模型维度拆解消费
- 检索调用日志，快速定位错误

这才是符合工程实践的运维方式。日常操作——给新项目发 Key、调整团队预算、吊销泄露的 Key——全部在 UI 上点几下完成。不需要翻文档敲 curl。

下面的 API 示例保留下来，有两个用途：一是展示每个参数的完整含义（UI 和 API 一 一对应），二是方便你在 CI/CD 或运维脚本里自动化操作。

### 5.3 Team——团队维度资源隔离

在管理面板中创建一个 Team 只需要填名称、预算、允许的模型。背后的 API 参数如下：

```bash
# 创建后端团队
curl http://litellm:4000/team/new \
  -H "Authorization: Bearer sk-master-xxxx" \
  -d '{
    "team_alias": "backend-team",
    "max_budget": 500.0,
    "budget_duration": "30d",
    "models": ["fast", "smart", "local-qwen"]
  }'

# 创建产品团队（只给便宜模型）
curl http://litellm:4000/team/new \
  -H "Authorization: Bearer sk-master-xxxx" \
  -d '{
    "team_alias": "product-team",
    "max_budget": 100.0,
    "budget_duration": "30d",
    "models": ["fast", "local-qwen"]
  }'
```

30 天一个预算周期，超预算自动拒绝，不会出现月底对账吓一跳的情况。

### 5.4 Virtual Key——按环境、按服务精细控制

在管理面板中，进入某个 Team 的详情页，点“Create Key”就能生成 Virtual Key——填写别名、预算、速率限制、模型白名单即可。对应的 API 参数如下：

```bash
# 生产环境：宽松
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

# 开发环境：限流，防误用
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

### 5.5 业务侧使用——完全透明

拿到 Virtual Key 后，业务侧直接当 OpenAI Key 用：

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://litellm-internal:4000/v1",
    api_key="sk-xxxx-backend-prod-virtual-key"
)

response = client.chat.completions.create(
    model="fast",
    messages=[{"role": "user", "content": "帮我写一个单元测试"}]
)
```

对业务侧来说完全无感知——不知道也不关心背后是 OpenAI、Claude 还是本地 vLLM。他们只需要知道“老地方、老 Key、老格式”。

## 六、成本追踪与可观测

LiteLLM 接上 Postgres 后，每次 API 调用都会被记录到 `LiteLLM_SpendLogs` 表。核心字段：哪个 Team、哪个 Key、用了哪个模型、输入/输出 Token、花费金额（美元）、时间戳。

### 6.1 管理面板——日常看花费用 UI

管理面板（`http://litellm:4000/ui`）自带 Usage 页面，日常查看花费不需要离开浏览器：

- **Spend**：按日/周/月查看团队消费趋势，哪个 Key 花了多少钱一目了然
- **Usage**：各模型的请求量、Token 消耗、平均延迟
- **Logs**：每次调用的详细日志——请求内容、响应、花费、延时，支持筛选和搜索
- **Teams / Keys**：各团队的预算使用率，哪个快超预算了直接能看到

日常查花费、对账、排查"这个 Key 今天怎么花了这么多"——UI 上全部能搞定。这才是符合工程直觉的方式：先有界面看，再谈高阶玩法。

### 6.2 进阶：直接查数据库

当 UI 的聚合维度不够用时——比如你想按项目标签（`metadata`）分组统计、导出 CSV 给财务、或者接入内部数据中台——可以直接查 `LiteLLM_SpendLogs` 表：

```sql
-- 最近 7 天各团队花费排行
SELECT team_id, SUM(spend) AS total_spend, COUNT(*) AS num_requests
FROM "LiteLLM_SpendLogs"
WHERE "startTime" > NOW() - INTERVAL '7 days'
GROUP BY team_id
ORDER BY total_spend DESC;
```

```sql
-- 某个 Key 的每日花费趋势
SELECT DATE("startTime") AS day, SUM(spend) AS daily_spend
FROM "LiteLLM_SpendLogs"
WHERE api_key = 'sk-xxxx-backend-prod'
GROUP BY day
ORDER BY day DESC;
```

对 DevOps 来说，SQL 按任意维度聚合、做关联分析都很灵活。但日常运维不需要——UI 足够。

除此之外，如果你已有 Grafana 等监控体系，LiteLLM 也支持暴露 Prometheus 指标，可以接进现有大盘。

### 6.3 告警策略建议

和运维其他基础设施一样的思路——关键指标必须有告警：

- 单团队日消费超过预算 60% → 通知团队负责人
- 某个 Key 的 RPM 突增 5 倍 → 风控告警（可能是代码 Bug 或 Key 泄漏）
- 后端模型错误率超过 10% 持续 5 分钟 → 运维告警
- 本地 vLLM 实例不可用 → 立即告警（内网模型是核心依赖）

## 七、Kubernetes 生产部署参考

如果你的团队用 K8s，给一个参考结构：

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

几个关键点：
- **多副本**：LiteLLM 本身是无状态的（状态在 Postgres），多副本天然支持高可用。`--num_workers 4` 是每个副本内部的 worker 数。
- **Secret 管理**：Master Key、Salt Key、各 Provider 的 API Key 全部走 K8s Secret，绝不写死在 ConfigMap 里。
- **健康检查**：`/health/liveliness` 和 `/health/readiness` 是 LiteLLM 自带的标准端点。
- **Redis**：多副本场景建议加 Redis（`router_settings.redis_host`），让多个副本间共享路由状态。

## 八、踩坑经验

实际部署过程中容易踩的坑：

**1. drop_params 的副作用。** 开启后，不是目标模型支持的参数会被静默丢弃。这在多模型场景下确实方便——你传 `reasoning_effort=high` 给 GPT-4o，路由到 Claude 时自动丢掉了，不会报错。但调试阶段建议先关掉，否则你会发现“明明传了参数为什么不生效”。

**2. Postgres 连接数膨胀。** `num_workers=4` + 2 副本 = 8 个数据库连接池。如果你的 Postgres 配置了较低的 `max_connections`，可能连接不够用。解决方案是前面挂 PgBouncer，或者调低 `database_connection_pool_limit`。

**3. Fallback 可能更贵。** 兜底模型可能比主模型贵——比如 `gpt-4o-mini` 挂了，Fallback 到 `gpt-4o`，价格差了 10 倍。配置 Fallback 链时确认每个模型的价格，优先用同价位的。

**4. Salt Key 不可更改。** 部署前生成好 `LITELLM_SALT_KEY`，之后永远不要改。一旦改了，数据库中所有加密的 Provider Key 都无法解密，需要清库重建。

**5. 不要混用配置来源。** `store_model_in_db: true` 之后，模型配置会从数据库加载。此时不要同时修改 `config.yaml` 和通过 API 增删模型——两套配置来源会互相覆盖，排查起来很痛苦。选一种方式，坚持到底。

**6. 本地模型不要暴露到公网。** LiteLLM 可以把本地 vLLM 和公网模型混在一个网关上。注意通过 `model.info.access_groups` 做访问控制——确保敏感数据的调用链只路由到本地模型。

## 九、小结：回到“基础设施”思维

从大模型 API 到统一网关，这一步跳跃的本质是思维切换——从“用 AI 工具”切换到“管 AI 基础设施”。就像你不会把数据库连接字符串硬编码在每个微服务里一样，你也不应该让每个团队自己管理 API Key、自己维护 Fallback 逻辑、自己对账。

LiteLLM 解决的问题，正是你从“一个人调 API”到“一个团队用 AI”过程中必然会遇到的：统一入口、流量控制、成本核算、安全审计。它不生产更强的 AI，但它让你的 AI 基础设施像管理数据库、消息队列一样可管理、可度量、可审计。

部署成本不高——一个 Docker Compose（Postgres + LiteLLM）加上已有的 vLLM 实例，内网半小时就能跑起来。值得试试。

每天前进一小步，就是一个新的高度！
