---
title: 'Monitoring Musings (Part 3): Metrics Monitoring — Numbers Don''t Lie, but Your Dashboard Does'
date: 2026-02-01
author: Tang Moying
categories: [monitor]
tags: [Prometheus, Grafana, Metrics Monitoring, Metrics, Observability, Time Series]
lang: en
alt_url: /post/monitor-03-metrics
---

Have you ever stared at a dashboard for five minutes, finally concluded "seems like… not a big deal?", and then closed it? If so, your metrics monitoring may be suffering from "dashboard obesity" — lots of data, very little information. The point of metrics monitoring isn't to display every piece of data you can collect; it's to find the numbers that are "the first to change when something goes wrong" and then keep a close eye on them. In this article, let's talk about how to use Prometheus and Grafana to build metrics monitoring that's actually "useful to look at".

<!--以上为摘要内容-->

## 1. What Is a "Good Metric"

The biggest difference between metrics and logs: **metrics are aggregated numbers, logs are raw records.** A log tells you "this request failed because the connection timed out"; a metric tells you "over the past five minutes, the failure rate rose from 0.1% to 5%".

A good metric has several characteristics:

- **Comparable**: it can be compared against historical data (year over year, period over period)
- **Aggregatable**: you can add up the data from multiple machines and look at it together
- **Trending**: the direction of change matters more than the absolute value
- **Actionable**: when you see this metric change, you know what to do

There are four most common metric types:

| Type | Meaning | Example |
|------|------|------|
| Counter | A count that only goes up, never down | Total requests, total errors |
| Gauge | An instantaneous value that can rise or fall | CPU usage, memory usage, queue length |
| Histogram | Data distribution | Request response time distribution |
| Summary | Quantile statistics | P50, P90, P99 latency |

The first two are the easiest to get started with; the last two are advanced usage. Get Counter and Gauge straight first, and your monitoring system can already solve 80% of your problems.

## 2. Prometheus: The De Facto Standard for Metrics Monitoring

### 2.1 How Prometheus Is Different from the Others

Traditional monitoring tools (Zabbix, Nagios and so on) use a "push" model — you install an agent, and the agent pushes data to the server. **Prometheus uses a "pull" model** — the Prometheus server periodically pulls data from your application.

This has a few advantages:
- You don't need to configure the monitoring server's address inside the application
- The server automatically discovers new instances
- An instance whose pull fails is itself a signal that it's "down"

### 2.2 Getting Started Quickly

For an application to expose metrics to Prometheus, the simplest way is to pull in a client library. Take Java as an example:

```java
// Pull in the prometheus client
import io.prometheus.client.Counter;
import io.prometheus.client.Histogram;

// Define a counter
static final Counter requestsTotal = Counter.build()
    .name("http_requests_total")
    .help("Total HTTP requests.")
    .labelNames("method", "endpoint", "status")
    .register();

// Define a response-time histogram
static final Histogram requestDuration = Histogram.build()
    .name("http_request_duration_seconds")
    .help("HTTP request duration in seconds.")
    .labelNames("method", "endpoint")
    .register();

// Record it in your business code
requestsTotal.labels("GET", "/api/orders", "200").inc();
requestDuration.labels("GET", "/api/orders").observe(0.15);
```

Then configure Prometheus to scrape it:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'my-app'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:8080']
```

That's all there is to it. A few minutes later, Prometheus starts collecting your application's metrics.

### 2.3 PromQL: The Query Language for Metrics

Prometheus has its own query language, PromQL. It looks like SQL but is more focused on time series. A few of the most practical queries:

```promql
# Over the past 5 minutes, the API's QPS
rate(http_requests_total[5m])

# Over the past 5 minutes, the error rate (5xx / total)
sum(rate(http_requests_total{status=~"5.."}[5m]))
/ sum(rate(http_requests_total[5m]))

# P99 response time
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Over the past 1 hour, the average CPU usage
avg_over_time(cpu_usage_percent[1h])
```

You don't need to memorize the syntax — just look it up when you need it. The key is understanding what each query is asking.

## 3. Grafana: Making Metrics "Visible"

Prometheus handles collection and storage; Grafana handles display. Grafana can do three things:

### 3.1 Turning Numbers into Charts

The most basic dashboard should contain at least:

- **Gold Signals**: Latency, Traffic, Errors, Saturation. These are the four core metrics proposed by Google SRE; if any one of them goes wrong, it means the service is unhealthy.
- **Business metrics**: order volume, sign-up volume, payment success rate. These are what the boss cares about, and they are also your ultimate standard for judging whether "the system is healthy or broken".
- **Resource metrics**: CPU, memory, disk, network. These tell you whether your infrastructure is being squeezed to its limit.

### 3.2 Correlating with Logs

If you also use Loki, you can click a chart on the same Grafana panel and drill straight down to the logs from the corresponding time range. **Metrics discover the anomaly; logs confirm the cause.** This linked troubleshooting is extremely efficient — those who use it know.

### 3.3 Alert Rules

Grafana can configure alert rules directly. But more alerts isn't better — and that's exactly what the next article will focus on.

## 4. A Few Principles for Designing a Dashboard

### Principle 1: One Dashboard Answers One Question

Don't cram all the information into one dashboard. A dashboard should answer only one question:
- "Is the system healthy right now?" → an overview dashboard
- "How is the latency users are experiencing?" → an application performance dashboard
- "Can the database hold up?" → a database dashboard

### Principle 2: Work Backwards from Business Metrics

Start by monitoring what users can feel — response time, success rate, page load speed. Then peel it apart layer by layer: is the application slow? Is the database slow? Or is there a network problem?

**From the outside it looks like "users feel it's slow"; from the inside you look for "what exactly is slow".** Your monitoring hierarchy should be an inverted pyramid: business metrics on top, application metrics below them, and infrastructure metrics below that.

### Principle 3: The USE and RED Methodologies

These are two classic methods for choosing metrics:

- **USE (Utilization, Saturation, Errors)**: for resources (CPU, memory, disk). Look at utilization, saturation and error count.
- **RED (Rate, Errors, Duration)**: for services. Look at request rate, error rate and duration.

An easy way to remember: **USE for hardware, RED for services.** Cover these six dimensions and your monitoring will basically have no blind spots.

## Summary

The value of metrics monitoring isn't in how pretty the charts are, but in **whether it lets you spot anomalies faster than everyone else**. A good dashboard is one you glance at and immediately know whether the system has a problem, rather than one you stare at for five minutes and still have to analyze. Starting today, take a hard look at your current monitoring panels — the charts you never look at, or look at without knowing what to do about them, delete them. White space is better than clutter.

Next time we'll talk about the link most easily botched — alert design.

A small step forward every day is a new height!
