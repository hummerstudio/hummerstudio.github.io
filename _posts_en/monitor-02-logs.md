---
title: 'Monitoring Musings (Part 2): Log Collection — Your First-Hand Material for Troubleshooting, Yet Often Missing When You Need It Most'
date: 2026-01-31
author: Tang Moying
categories: [monitor]
tags: [Logging, ELK, Loki, Log Collection, Observability, Filebeat]
lang: en
alt_url: /post/monitor-02-logs
---

Something went wrong in production. What's your first reaction? I believe the answer for the vast majority of developers is: look at the logs. But reality is usually this — the logs are scattered across a dozen servers and you have to SSH into each one and `grep`; or the logs only go back two days and the ones from three days ago have already been rolled over and overwritten; worse still, some logs are written but nobody is actually outputting them. It isn't that you have no logs, it's that “you haven't been taking care of them”. This article is about how to make logs a real help rather than a decoration.

<!--以上为摘要内容-->

## 1. Starting from “Writing Good Logs”

Before we talk about log collection systems, let's start with a more basic question: are your logs worth collecting?

I've seen far too many logs that look like this:

```java
// A meaningless log
logger.info("处理完成");
logger.error("出错啦: " + e.getMessage());
```

What's wrong with this log? First, “processing done” — processing what? With what parameters? How long did it take? You can't tell anything from it. Second, only the exception message is printed, not the stack trace, so when something goes wrong you have no idea which line threw the error.

**A good log should read like a “miniature incident report”.** At the very least it should contain:

- **Time**: when it happened
- **Context**: which request, which user, which parameters
- **Result**: success or failure? How long did it take?
- **Correlation ID**: can you follow this ID to find the related logs?

A better version:

```java
String traceId = MDC.get("traceId");
logger.info("订单处理完成 [orderId={}, userId={}, amount={}, duration={}ms]",
            orderId, userId, amount, duration);
```

With logs like this, when something goes wrong you don't have to rely on “guessing” to locate it — the log itself tells you the key information.

**First principle: log collection presupposes that you've first written logs worth collecting.**

## 2. The Evolution of Log Collection: From “People Looking for Logs” to “Logs Waiting for People”

The evolution of how we manage logs is basically a microcosm of the software industry's growth.

### Stage 1: Reading Logs by Hand (the Stone Age)

```bash
ssh server-01
tail -f /var/log/app.log
grep "ERROR" /var/log/app.log | less
```

A few servers is fine, but what about dozens? What about hundreds? And log files roll over and get overwritten; logs from three days ago may already be gone.

### Stage 2: Centralized Storage (Entry Level)

Mount an NFS or shared storage on all the servers, and write all the logs to one place. The advantage is that the logs are centralized, but query efficiency is extremely low. To find one error message in hundreds of GB of log files, a single `grep` might take several minutes.

### Stage 3: Structured Collection and Search (the Modern Approach)

This is the problem that solutions like ELK (Elasticsearch + Logstash + Kibana) and Loki exist to solve: automatic log collection, structured storage, and fast search. Logs are no longer “files” — they become a queryable database.

## 3. The Two Mainstream Approaches: ELK vs Loki

### 3.1 ELK Stack

ELK is the veteran solution in the logging space, and the three components each have their own job:

- **Elasticsearch**: handles storage and full-text search. When logs arrive it builds an inverted index, and queries are extremely fast.
- **Logstash**: handles log collection, filtering and transformation. It can parse raw text logs into structured JSON.
- **Kibana**: handles visualization. It provides a rich set of dashboards and a search interface.

In real deployments people often add a **Filebeat** as well — it's a lightweight log collection agent, deployed on every application server, responsible for “sending the logs to Logstash”. It's far lighter than Logstash and barely consumes any resources.

```
Application server → Filebeat → Logstash → Elasticsearch → Kibana (query and display)
```

ELK's strengths are that it's mature, has a rich ecosystem, and has extremely powerful search. But you have to accept that it's fairly “heavy” — Elasticsearch is notorious for eating memory, and small teams may find it hard to stomach.

### 3.2 Loki + Grafana

Loki is the lightweight logging solution put out by Grafana Labs. Its design philosophy is the exact opposite of ELK's:

**Loki doesn't build a full-text index over log content; it indexes log labels.** In other words, when you search you aren't “searching for a keyword across all the log text”; you first filter out the relevant logs by label, then search within those logs in a `grep`-like way.

The result of this design is that Loki is very resource-efficient and can easily run on small and mid-sized servers. The cost is that full-text search isn't as fast as ES.

### 3.3 So Which One?

| Dimension | ELK | Loki |
|------|-----|------|
| Resource footprint | High (ES eats memory) | Low |
| Search capability | Extremely strong (full-text index) | Strong (label index + text scan) |
| Grafana integration | Requires configuration | Native integration |
| Learning curve | Medium to high | Fairly low |
| Where it fits | Enormous log volume, high search demands | Small to mid-scale, already running Prometheus+Grafana |

If your team is already using Prometheus + Grafana for metrics monitoring, then Loki is the natural complement for logs — on the same Grafana page you look at metrics on top and logs below, and correlating them to troubleshoot a problem is very satisfying.

If you're running a large system with enormous log volumes, terabytes a day, and you often need to do complex full-text searches through the logs — then ELK is the more suitable choice.

## 4. Practical Points: A Few Things to Settle Before Going Live

Whichever you choose, ELK or Loki, there are a few things you must think through before going live:

### 4.1 Log structure must be uniform

Logs should be in JSON format, with standardized field names. All services' logs should use the same set of field conventions:

```json
{
  "timestamp": "2026-01-31T10:00:00Z",
  "level": "INFO",
  "service": "order-service",
  "traceId": "abc123",
  "message": "Order processing complete",
  "orderId": "ORD-001",
  "durationMs": 45
}
```

Don't have this service use `userId`, that service use `user_id`, and a third service use `uid`. Standardize the naming so that queries don't “miss” logs.

### 4.2 Log levels must be reasonable

Don't log everything at INFO level. A simple division of levels:

- **ERROR**: problems that need immediate attention (payment failure, database down)
- **WARN**: not quite normal but not currently affecting the business (a retry succeeded, quota approaching its limit)
- **INFO**: key business events (order placed successfully, user registered)
- **DEBUG**: debugging information, off by default in production

The consequence of confused levels is this: when you're digging through production logs, the key information is drowned out by a flood of DEBUG logs.

### 4.3 Log retention policy

Logs can't be stored forever — disk space costs money. The usual approach:

- Hot data (the last 3-7 days): kept on fast storage, for convenient high-frequency querying
- Warm data (7-30 days): moved to low-cost storage
- Cold data (over 30 days): archived or deleted

This policy depends on business requirements. Financial businesses may be required to retain logs for years; for a typical internet business, one to three months is enough.

## Summary

Log collection isn't something that's “done once you install a tool”. It requires three levels working together: you write good logs, the collection system centralizes them, and the team develops the habit of looking at them. Take away any one link and the logging system is just decoration.

Next time we'll talk about metrics monitoring — if logs tell you “why something went wrong”, then metrics tell you “whether something has gone wrong”.

A small step forward every day is a new height!
