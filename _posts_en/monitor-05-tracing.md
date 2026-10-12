---
title: 'Monitoring Musings (Part 5): Tracing — When One Request Crosses 20 Microservices, How Do You Trace What It Went Through'
date: 2026-02-08
author: Tang Moying
categories: [monitor]
tags: [Tracing, OpenTelemetry, Jaeger, Distributed Systems, Observability]
lang: en
alt_url: /post/monitor-05-tracing
---

A user reports: "I submitted my order three times, and every time it spun for 10 seconds and then told me it had failed." You open the logs and find that the order service threw an error — "timed out calling the inventory service". You go and check the inventory service, and it says: "It is not me that is slow, it is the payment service’s callback that is slow." So you go and check the payment service… This is everyday life when you troubleshoot a distributed system. One request passes through 10 microservices, and you cannot string the whole chain together by flipping through logs. This article is about how tracing helps you solve the problem of "where did this request actually go".

<!--以上为摘要内容-->

## 1. Monolith Era vs. Distributed Era: the Troubleshooting Model Has Changed

Think back to the monolith era: a request comes in, you open the application log and read it from top to bottom — a dozen lines at most — and the life cycle of the request is clear at a glance.

In a distributed architecture, one order request might look like this:

```
User → API Gateway → Order Service → Inventory Service → Payment Service
                          ↓              ↓
                      用户服务        消息队列
                          ↓              ↓
                      缓存层         通知服务
```

A single request has turned into a chain of RPC calls between several microservices. Each service keeps its own independent logs, and those logs are scattered across different servers. **When something goes wrong, you are facing a jigsaw puzzle** — finding, among the logs of dozens of services, the fragments that belong to the same request, and then putting them together in chronological order.

Distributed tracing was born to solve exactly this problem.

## 2. The Core Concepts of Tracing

There is no need to memorise the terminology; understanding these three core concepts is enough:

### Trace

One complete request, from beginning to end, is a Trace. A Trace contains every service call that request went through.

You can think of a Trace as tracking a parcel all the way: collection → hub A → hub B → out for delivery → signed for. Every step is a Span.

### Span

Every step in a Trace is a Span. Each Span records:
- what this step did (the operation name)
- when it started and when it ended (the duration)
- who called whom (the parent-child relationship)
- whether it succeeded (the status tag)
- related context information (tags, such as which endpoint was called and what status code came back)

### Context Propagation

This is the most critical and the most error-prone part of tracing. **For the chain to hold together, every service call must pass the Trace ID onward.**

```
订单服务调用库存服务时：
  HTTP Header 里带上：traceparent: 00-{traceId}-{spanId}-01
  
库存服务收到请求后：
  从 Header 里读出 traceId，自己的日志和 Span 都关联到这个 traceId
```

If some service fails to pass the traceId onward, the chain breaks right there. This is why tracing requires every service to cooperate — **one service that does not pass it brings the whole chain down.**

## 3. From Jaeger to OpenTelemetry: the Evolution of Tracing

The idea of tracing goes back to Google’s Dapper paper (2010), and later Twitter open-sourced Zipkin and Uber open-sourced Jaeger. Those two are the representative early projects.

But what really took tracing towards standardisation was **OpenTelemetry (OTel for short)**. It is a unified observability framework that brings Tracing, Metrics and Logging together in one place.

### Why Is OpenTelemetry So Important?

Before OTel appeared, tracing had a vendor lock-in problem. You wrote instrumentation code with Jaeger’s SDK and now you want to switch to Zipkin? — Sorry, rewrite it. You adopted a commercial APM platform and want to move off it? — Rewrite it.

**What OTel solves is "instrument once, use everywhere".** You instrument your code with the OTel SDK, and if you want to send the data to Jaeger you send it to Jaeger, if you want to send it to Zipkin you send it to Zipkin, and commercial platforms are supported as well. Instrumentation code and storage backend are decoupled.

Today (2026), OTel has become the second most active project in the CNCF after Kubernetes, and the de facto industry standard.

## 4. Hands On: Adding Tracing to Your Service

### 4.1 Bringing In the OTel SDK

Take Java + Spring Boot as an example:

```java
// Add OTel auto-instrumentation to a Spring Boot application
// The simplest approach is the Java Agent: not a single line of code has to change

// Startup command:
// java -javaagent:opentelemetry-javaagent.jar \
//      -Dotel.service.name=order-service \
//      -Dotel.traces.exporter=otlp \
//      -Dotel.exporter.otlp.endpoint=http://jaeger:4317 \
//      -jar order-service.jar
```

The OTel Java Agent automatically instruments your HTTP requests, database queries, message queues and so on. Common frameworks (Spring, gRPC, Kafka, Redis) all support automatic instrumentation.

### 4.2 Manual Instrumentation (When the Automatic Kind Is Not Enough)

Automatic instrumentation covers the common cases, but for business-critical logic you had better add your own Span:

```java
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.Tracer;

@Autowired
private Tracer tracer;

public Order createOrder(OrderRequest request) {
    // Create a custom Span for a piece of critical business logic
    Span span = tracer.spanBuilder("order-creation")
        .setAttribute("order.amount", request.getAmount())
        .setAttribute("order.userId", request.getUserId())
        .startSpan();
    
    try {
        // ... business logic
        span.setStatus(StatusCode.OK);
        return order;
    } catch (Exception e) {
        span.setStatus(StatusCode.ERROR, "订单创建失败");
        span.recordException(e);
        throw e;
    } finally {
        span.end(); // Remember to close it!
    }
}
```

The principle for manual instrumentation: **only add a Span for "the critical steps you would not want to miss".** Payment, inventory deduction, core business calculations, for instance.

### 4.3 Correlating Logs

In the second post we talked about logging, and in this fifth post about tracing — the two are a natural pair. The key practice is **putting the traceId into your logs**:

```java
// Read the traceId out of the OTel context and write it into the MDC
String traceId = Span.current().getSpanContext().getTraceId();
MDC.put("traceId", traceId);  // MDC is SLF4J’s thread context; it attaches the traceId to every log line automatically
logger.info("开始处理订单");
```

MDC (Mapped Diagnostic Context) holds the `traceId` in the context of the current thread, and the logging framework (Logback / Log4j) attaches it automatically to every log line it outputs. The prerequisite is that your log pattern includes `%X{traceId}`, for example:

```xml
<!-- logback.xml -->
<pattern>%d [%thread] %-5level %logger - [traceId=%X{traceId}] %msg%n</pattern>
```

A log line printed this way looks like this:

```
2026-02-08 14:30:01 [http-nio-8080-1] INFO  OrderService - [traceId=a1b2c3d4] 开始处理订单
```

Search for this traceId in your logging system and you can see the logs of every service along the whole request chain. **The Span of a trace tells you "where the request went and what was slow"; the logs tell you "why that place was slow".**

## 5. Reading a Trace End to End

With tracing in place, the trace view you see in Jaeger (or Grafana Tempo) looks roughly like this:

```
Trace: 订单创建 (总耗时 2.3s)
├── Gateway receives request   ── 5ms
├── Order.create order         ── 200ms
│   ├── User.query user        ── 15ms
│   └── Inventory.deduct stock ── 180ms  ← slow here!
│       └── Database query     ── 175ms      ← root cause: missing index
└── Payment.create payment     ── 2000ms ← also slow!
    ├── Risk assessment        ── 30ms
    └── Bank interface call    ── 1960ms    ← external dependency is slow
```

At a glance you can see:
- the whole request takes 2.3 seconds
- the inventory service’s database query accounts for 175ms (probably a missing index)
- the payment service’s bank interface takes 1.96 seconds (an external dependency problem, possibly not your fault)

**In the era before tracing, pinning down the root cause "the inventory service’s database is missing an index" could take an afternoon. With tracing, you lock it down within a minute.**

## 6. Common Problems When Rolling Out Tracing

### Problem One: How Should the Sampling Rate Be Set?

If you record a Trace for every request, a high-traffic system will generate an enormous amount of data. The usual approach is **sampling** — recording Traces for only a portion of the requests.

```yaml
# Sampling strategy
- 错误请求：100% 采样（错误本来就不多，全保留）
- 正常请求：10-20% 采样（量大的话，越低越好）
- 关键接口：50%+ 采样（支付、下单等核心链路）
```

Sampling is a trade-off between "completeness of information" and "storage cost". For small and medium-sized systems, sampling everything is often feasible as well.

### Problem Two: What Do You Do When an Asynchronous Chain Breaks?

With message queues and asynchronous callbacks, the Trace context does not propagate automatically. You have to pass it along by hand:

```java
// When sending a message, put the trace context into the message header
message.setHeader("traceparent", getCurrentTraceParent());

// When consuming a message, restore the context from the message header
String traceParent = message.getHeader("traceparent");
restoreContext(traceParent);
```

Anywhere a "request crosses a process boundary", the Trace context has to be passed explicitly. This is the easiest thing to miss when rolling tracing out.

### Problem Three: Tracing Needs the Whole Team on Board

Tracing is not like metrics monitoring — you can install Prometheus instrumentation in the order service by yourself and see the order service’s metrics. But tracing is "one chain, one rope": the order service passes the traceId to the inventory service, the inventory service does not pass it on, and the chain is broken.

**Once all is said and done, tracing is an organisational collaboration problem, not just a technical one.**

## Summary

This series ends here. Let us look back at the road we have travelled:

1. **Getting Started with Monitoring** — monitoring is not a nice-to-have; it is the system’s health report
2. **Log Collection** — write good logs first, then manage them with ELK or Loki
3. **Metrics Monitoring** — Prometheus + Grafana, choosing metrics with the RED and USE methods
4. **Alert Design** — less is more; every alert should be able to trigger action
5. **Tracing** — the X-ray of a distributed system, showing you the full path of a request

Monitoring is not a matter of installing a tool and setting up a few dashboards. It is a capability — the ability to know what your system is doing, whether something is wrong, and, when something is wrong, to pin it down quickly. I hope these five articles help you build that capability.

A small step forward every day is a new height!
