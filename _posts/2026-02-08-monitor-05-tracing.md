---
title: 监控漫谈（五）：链路追踪——当一次请求穿越了 20 个微服务，你该怎么查它经历了什么
author: 唐明
categories: [monitor]
tags: [链路追踪, OpenTelemetry, Jaeger, 分布式系统, 可观测性, Tracing]
---

一个用户反馈：“我的订单提交了三次，每次都转圈 10 秒然后提示失败。”你打开日志，发现订单服务报错了——“调用库存服务超时”。你去查库存服务，库存服务说：“不是我慢，是支付服务回调慢。”你再去查支付服务……这就是分布式系统查问题的日常。一个请求经过了 10 个微服务，你没法靠翻日志来串起整个链路。这篇文章，聊聊链路追踪怎么帮你解决这个“请求到底去哪了”的问题。

<!--以上为摘要内容-->

## 一、单体时代 vs 分布式时代：查问题的模式变了

回想一下单体架构的年代：一个请求进来，你打开应用日志，从头看到尾，最多十几行，请求的生命周期一目了然。

到了分布式架构，一个下单请求可能是这样的：

```
用户 → API Gateway → 订单服务 → 库存服务 → 支付服务
                          ↓              ↓
                      用户服务        消息队列
                          ↓              ↓
                      缓存层         通知服务
```

一次请求变成了多个微服务之间的 RPC 调用链。每个服务都有自己独立的日志，这些日志分散在不同的服务器上。**出问题时，你面对的是一个“拼图游戏”**——从几十个服务的日志里，找出属于同一个请求的那些片段，然后按时间顺序拼起来。

链路追踪（Distributed Tracing）就是为了解决这个问题而生的。

## 二、链路追踪的核心概念

不需要背术语，理解这三个核心概念就够了：

### Trace（链路）

一次完整的请求从开始到结束，就是一个 Trace。一个 Trace 包含了这个请求经历过的所有服务调用。

可以把 Trace 想象成一次快递的全程追踪：从揽件 → 中转站 A → 中转站 B → 派送 → 签收。每一步都是一段 Span。

### Span（跨度）

Trace 中的每一步，就是一个 Span。每个 Span 记录了：
- 这一步做了什么（操作名称）
- 什么时候开始，什么时候结束（耗时）
- 谁调用了谁（父子关系）
- 是否成功（状态标签）
- 相关的上下文信息（标签，比如调用的是哪个接口、返回了什么状态码）

### Context Propagation（上下文传播）

这是链路追踪中最关键也最容易出错的部分。**要让链路串起来，每个服务调用时必须把 Trace ID 传下去。**

```
订单服务调用库存服务时：
  HTTP Header 里带上：traceparent: 00-{traceId}-{spanId}-01
  
库存服务收到请求后：
  从 Header 里读出 traceId，自己的日志和 Span 都关联到这个 traceId
```

如果某个服务没有把 traceId 传下去，链路就在那里断了。这就是为什么链路追踪必须每个服务都配合——**一个不传，全链路废掉。**

## 三、从 Jaeger 到 OpenTelemetry：链路追踪的演进

链路追踪这个概念最早源自 Google 的 Dapper 论文（2010 年），后来 Twitter 开源了 Zipkin，Uber 开源了 Jaeger。这两个是早期的代表性项目。

但真正让链路追踪走向“标准化”的是 **OpenTelemetry（简称 OTel）**。它是一个统一的可观测性框架，把 Tracing、Metrics、Logging 三者整合到了一起。

### 为什么 OpenTelemetry 这么重要？

在 OTel 出现之前，链路追踪有一个“供应商锁定”的问题。你用 Jaeger 的 SDK 写了埋点代码，想换成 Zipkin？——对不起，重写。你用了一个商业 APM 平台，想换？——重写。

**OTel 解决的是“一次埋点，到处可用”。** 你用 OTel 的 SDK 在代码里打点，数据想发给 Jaeger 就发 Jaeger，想发给 Zipkin 就发 Zipkin，想发给商业平台也支持。埋点代码和存储后端解耦了。

现在（2026 年），OTel 已经成为 CNCF 中仅次于 Kubernetes 的第二大活跃项目，是事实上的行业标准。

## 四、动手实践：给你的服务加上链路追踪

### 4.1 引入 OTel SDK

以 Java + Spring Boot 为例：

```java
// 在 Spring Boot 应用中加入 OTel 自动埋点
// 最简单的做法是用 Java Agent，一行代码都不用改

// 启动命令：
// java -javaagent:opentelemetry-javaagent.jar \
//      -Dotel.service.name=order-service \
//      -Dotel.traces.exporter=otlp \
//      -Dotel.exporter.otlp.endpoint=http://jaeger:4317 \
//      -jar order-service.jar
```

OTel 的 Java Agent 会自动为你的 HTTP 请求、数据库查询、消息队列等做埋点。常见的框架（Spring、gRPC、Kafka、Redis）都支持自动埋点。

### 4.2 手动埋点（当自动的不够时）

自动埋点覆盖了通用场景，但业务关键逻辑你最好自己加 Span：

```java
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.Tracer;

@Autowired
private Tracer tracer;

public Order createOrder(OrderRequest request) {
    // 为一个关键业务逻辑创建自定义 Span
    Span span = tracer.spanBuilder("order-creation")
        .setAttribute("order.amount", request.getAmount())
        .setAttribute("order.userId", request.getUserId())
        .startSpan();
    
    try {
        // ... 业务逻辑
        span.setStatus(StatusCode.OK);
        return order;
    } catch (Exception e) {
        span.setStatus(StatusCode.ERROR, "订单创建失败");
        span.recordException(e);
        throw e;
    } finally {
        span.end(); // 一定要记得关闭！
    }
}
```

手动埋点的原则：**只给“你不会想错过的关键步骤”加 Span。** 比如支付、库存扣减、核心业务计算。

### 4.3 关联日志

前面第二篇我们讲了日志，第五篇讲链路追踪——这两者是天生的一对。关键做法是**把 traceId 打到日志里**：

```java
// 从 OTel context 中取 traceId 写入 MDC
String traceId = Span.current().getSpanContext().getTraceId();
MDC.put("traceId", traceId);  // MDC 是 SLF4J 的线程上下文，会把 traceId 自动附加到每条日志
logger.info("开始处理订单");
```

MDC（Mapped Diagnostic Context）会把 `traceId` 暂存在当前线程的上下文中，日志框架（Logback / Log4j）输出每条日志时自动带上它。前提是你的日志 pattern 里配了 `%X{traceId}`，比如：

```xml
<!-- logback.xml -->
<pattern>%d [%thread] %-5level %logger - [traceId=%X{traceId}] %msg%n</pattern>
```

这样打印出来的日志会是：

```
2026-02-08 14:30:01 [http-nio-8080-1] INFO  OrderService - [traceId=a1b2c3d4] 开始处理订单
```

在日志系统里搜这个 traceId，就能看到整个请求链路里所有服务的日志。**链路追踪的 Span 告诉你“请求去了哪里、哪里慢了”，日志告诉你“那个地方为什么会慢”。**

## 五、看透一条 Trace

有了链路追踪后，你在 Jaeger（或 Grafana Tempo）上看到的追踪界面大概是这样的：

```
Trace: 订单创建 (总耗时 2.3s)
├── Gateway 接收请求           ── 5ms
├── 订单服务.创建订单          ── 200ms
│   ├── 用户服务.查询用户      ── 15ms
│   └── 库存服务.扣减库存      ── 180ms  ← 慢在这里！
│       └── 数据库查询         ── 175ms      ← 根因：缺索引
└── 支付服务.创建支付          ── 2000ms ← 也慢！
    ├── 风险评估               ── 30ms
    └── 银行接口调用           ── 1960ms    ← 外部依赖慢
```

一眼就能看到：
- 整个请求耗时 2.3 秒
- 库存服务的数据库查询占了 175ms（可能是缺索引）
- 支付服务的银行接口耗时 1.96 秒（外部依赖问题，可能不是你的锅）

**在没有链路追踪的年代，要定位到“库存服务的数据库缺索引”这个根因，可能需要一个下午。有了 Tracing，一分钟之内就能锁定。**

## 六、Tracing 落地时的常见问题

### 问题一：采样率怎么设？

如果每次请求都记录 Trace，在流量大的系统里会产生海量数据。常见的做法是**采样**——只记录一部分请求的 Trace。

```yaml
# 采样策略
- 错误请求：100% 采样（错误本来就不多，全保留）
- 正常请求：10-20% 采样（量大的话，越低越好）
- 关键接口：50%+ 采样（支付、下单等核心链路）
```

采样率是在“信息完整度”和“存储成本”之间的权衡。对于中小系统，全量采样往往也是可行的。

### 问题二：异步链路断了怎么办？

消息队列、异步回调这些场景下，Trace 上下文不会自动传播。你需要手动传递：

```java
// 发送消息时，把 trace context 塞进消息头
message.setHeader("traceparent", getCurrentTraceParent());

// 消费消息时，从消息头恢复 context
String traceParent = message.getHeader("traceparent");
restoreContext(traceParent);
```

任何“请求跨越进程边界”的地方，都需要显式地传递 Trace 上下文。这是落地过程中最容易遗漏的地方。

### 问题三：链路追踪需要全团队配合

链路追踪不像指标监控——你一个人在订单服务装了 Prometheus 埋点，就能看到订单服务的指标。但链路追踪是“一条链，一根绳”：订单服务把 traceId 传给了库存服务，库存服务没传下去，链就断了。

**链路追踪落到最后，是一个组织协作问题，不只是技术问题。**

## 小结

本系列到此结束。回顾一下我们走过的路：

1. **监控入门** —— 监控不是锦上添花，是系统运行的“体检报告”
2. **日志采集** —— 先写好日志，再用 ELK 或 Loki 把它们管起来
3. **指标监控** —— Prometheus + Grafana，用 RED 和 USE 方法选指标
4. **告警设计** —— 少即是多，每条告警都应该能触发行动
5. **链路追踪** —— 分布式系统的“X 光”，让你看到请求的完整路径

监控不是装个工具、配几个 dashboard 就完了。它是一种能力——知道你的系统在干什么、有没有出问题、出问题后能不能快速定位的能力。希望这五篇文章，能帮你建立起这个能力。

每天前进一小步，就是一个新的高度！
