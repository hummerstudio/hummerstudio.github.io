---
title: 'Monitoring Musings (Part 1): Monitoring Is Nothing Fancy — It''s Just the System''s “Health Check Report”'
date: 2026-01-25
author: Tang Moying
categories: [monitor]
tags: [Monitoring, Observability, Operations, Metrics, Logging, Tracing]
lang: en
alt_url: /post/monitor-01-intro
---

Have you ever run into this situation: a user reports that “the system is really slow”, you open up the server and look at CPU and memory, and everything is normal. Then you're stuck — it's not that there's no problem, it's that you don't know where the problem is. That's the classic predicament of having no monitoring. Monitoring isn't some far-off, high-end technology; it's just giving the system a “health check” so you know what it's doing, how it's doing and whether it's sick.

<!--以上为摘要内容-->

## 1. An Analogy: Monitoring Is the System's Health Check Report

When you go to the hospital for a health check, the doctor won't take your temperature alone and then declare you healthy. They draw blood, take X-rays, run an ECG — each examination looks at something different: blood work shows the internal biochemical markers, an X-ray shows structure, an ECG shows the rhythm of your heartbeat.

**System monitoring is the same.** You can't look at CPU utilization alone and say “the system is very healthy”. You need to understand how the system is running from multiple dimensions.

A health check has three core categories of examination, and system monitoring has three pillars:

| Health Check | System Monitoring | The Question It Answers |
|------|---------|-----------|
| Blood work | **Metrics** | “What happened in the system?” |
| Medical records | **Logging** | “Why is the system like this?” |
| CT / MRI | **Tracing** | “Where did the request travel?” |

This is the famous “three pillars of observability” in the industry. Later articles will go into each of them in depth; today we'll build an overall mental framework first.

## 2. Why Monitoring Isn't Just “a Nice Extra”

Many teams' attitude toward monitoring is: “we'll deal with it once the system is stable”. That's like waiting until you're sick to buy insurance — too late.

**Without monitoring, shipping to production is flying blind.** Here are real situations I've seen:

- An API's response time creeps up from 50ms to 500ms and nobody notices. Only after users complain does engineering dig in and discover a missing database index. With even a simple response-time monitor, the problem would have been caught at 100ms.
- A release changed a feature-flag configuration, a canary group hit an unfinished feature, and a large number of requests went down the error-handling branch, producing hundreds of 500 errors every hour. Because there was no real-time monitoring alert on HTTP 500 status codes, the errors went on for a whole day before anyone noticed, and investigation only started after user complaints came in. With monitoring in place: QPS is normal but the error rate jumps from 0.1% to 5%, and the alert fires within minutes.
- Disk space gets filled up by logs day after day, until the service dies in the small hours and operations is woken up in a panic. A single disk-usage monitor could have prevented that middle-of-the-night barrage of frantic calls.

**Monitoring isn't wasting your time; it's saving you time.** It turns “reactively fighting fires” into “proactively preventing them”, and “the user tells you there's a problem” into “you know about the problem and tell the user”.

## 3. A Few Key Mindsets for Monitoring

Before we get into specific technologies, there are a few mindsets to establish first. These matter more than which tools you install.

### Mindset One: Have It First, Perfect It Later

Don't set out to build a perfect monitoring system right away. You don't even know where the problems are — how could you possibly build “perfect monitoring”? The right order is: **monitor the thing you worry about most first, then fill in the rest gradually based on problems you see in production.**

Step one: monitor the four basic metrics — CPU, memory, disk and network. This is free; any monitoring tool can do it.
Step two: monitor the response time and error rate of your business-critical endpoints. This is what your users actually feel.
Step three: work backwards from production incidents — every time something goes wrong, ask yourself “if I had monitored X, would this have been caught earlier?” Then add that metric.

### Mindset Two: Too Much Information Equals No Information

More monitoring isn't better. I've seen a team with more than 300 dashboards in Grafana, and not one person who could explain the current health of the system.

**Good monitoring is about the signal-to-noise ratio.** What you need isn't coverage of everything; it's a clear presentation of the key metrics. This becomes especially pointed when we get to alert design later — too many alerts equals no alerts, because everyone just mutes the notifications.

### Mindset Three: The Numbers Themselves Don't Matter — the Trend Does

CPU utilization at 80% — is that high? It depends. If it runs steadily at 80% and the business is fine, that may just be high resource utilization, not a problem. But if CPU utilization climbs from 20% to 80% within an hour and is still climbing, that's an emergency.

**A single data point easily misleads; the trend and the rate of change are where monitoring's real value lies.**

## 4. What's Coming in This Series

Monitoring is a huge topic and this article is only a start. Over the next few posts we'll dig into each piece in turn:

| Part | Topic | Core Content |
|------|------|---------|
| Part 2 | Log collection | How are logs collected, stored and queried? ELK or Loki — how do you choose? |
| Part 3 | Metrics monitoring | How do you set up Prometheus + Grafana? What makes a metric a good metric? |
| Part 4 | Alert design | Why do alerts make people numb? How do you design alerts that actually work? |
| Part 5 | Tracing | What does a request go through in a distributed system? How do you use Jaeger and OpenTelemetry? |

By the end of this series you should be able to build a basically usable monitoring setup for a small system on your own — starting from zero, without depending on any commercial monitoring platform.

## Summary

Monitoring isn't a technical problem, it's a problem of awareness. You don't need to become a monitoring expert to start monitoring; you just need to admit one fact: without monitoring, you're flying blind. Start by collecting the most basic metrics and by answering the question “how is the system doing right now?” clearly. The alerting, analysis and optimization that come later all rest on that foundation.

Next time we'll talk about logs — the most primitive, and yet the most easily overlooked, source of monitoring data.

A small step forward every day is a new height!
