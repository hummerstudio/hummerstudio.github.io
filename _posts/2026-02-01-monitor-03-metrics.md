---
title: 监控漫谈（三）：指标监控——数字不会说谎，但你的 dashboard 会
author: 唐明
categories: [monitor]
tags: [Prometheus, Grafana, 指标监控, Metrics, 可观测性, 时间序列]
---

你有没有盯着一个 dashboard 看了五分钟，最终得出结论“好像……问题不大？”然后关掉了。如果有，那你的指标监控可能得了“仪表盘肥胖症”——数据很多，信息很少。指标监控的核心不是把能收集的数据全展示出来，而是找到那些“出了事第一个会变”的数字，然后盯紧它们。这篇文章，我们就来聊聊怎么用 Prometheus 和 Grafana 做出“看了有用”的指标监控。

<!--以上为摘要内容-->

## 一、什么是“好指标”

指标（Metrics）和日志最大的区别：**指标是聚合后的数字，日志是原始的记录。** 日志告诉你“这个请求失败了，因为连接超时”，指标告诉你“过去五分钟，失败率从 0.1% 升到了 5%”。

好指标有几个特征：

- **可比较**：能跟历史数据对比（同比、环比）
- **可聚合**：能把多台机器的数据加在一起看
- **有趋势**：变化方向比绝对值更重要
- **能触发行动**：看到了这个指标变化，你知道该做什么

最常见的指标类型有四种：

| 类型 | 含义 | 例子 |
|------|------|------|
| Counter | 只增不减的计数 | 请求总数、错误总数 |
| Gauge | 可增可减的瞬时值 | CPU 使用率、内存占用、队列长度 |
| Histogram | 数据分布 | 请求响应时间分布 |
| Summary | 分位数统计 | P50、P90、P99 延迟 |

前面两种是最容易上手的，后面两种是进阶用法。先搞清楚 Counter 和 Gauge，你的监控系统就能解决 80% 的问题了。

## 二、Prometheus：指标监控的事实标准

### 2.1 Prometheus 和别人有什么不一样

传统监控工具（Zabbix、Nagios 等）是“推”模式——你装个 agent，然后 agent 把数据推到服务端。**Prometheus 是“拉”模式**——Prometheus 服务端定期去你的应用拉数据。

这样做有几个好处：
- 不需要在应用里配置监控服务端的地址
- 服务端自动发现新实例
- 拉失败的实例直接就是“挂掉”的信号

### 2.2 快速上手

应用要暴露指标给 Prometheus，最简单的方式是引入 client 库。以 Java 为例：

```java
// 引入 prometheus client
import io.prometheus.client.Counter;
import io.prometheus.client.Histogram;

// 定义一个计数器
static final Counter requestsTotal = Counter.build()
    .name("http_requests_total")
    .help("Total HTTP requests.")
    .labelNames("method", "endpoint", "status")
    .register();

// 定义一个响应时间直方图
static final Histogram requestDuration = Histogram.build()
    .name("http_request_duration_seconds")
    .help("HTTP request duration in seconds.")
    .labelNames("method", "endpoint")
    .register();

// 在业务代码中记录
requestsTotal.labels("GET", "/api/orders", "200").inc();
requestDuration.labels("GET", "/api/orders").observe(0.15);
```

然后配置 Prometheus 去拉取：

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'my-app'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:8080']
```

就这么简单。几分钟后，Prometheus 就开始收集你的应用指标了。

### 2.3 PromQL：指标的查询语言

Prometheus 有自己的查询语言 PromQL，它看起来像 SQL 但更专注于时间序列。几个最实用的查询：

```promql
# 过去 5 分钟，API 的 QPS
rate(http_requests_total[5m])

# 过去 5 分钟，错误率（5xx / total）
sum(rate(http_requests_total{status=~"5.."}[5m]))
/ sum(rate(http_requests_total[5m]))

# P99 响应时间
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# 过去 1 小时，CPU 使用率的平均值
avg_over_time(cpu_usage_percent[1h])
```

不需要背语法，用到时查就够了。关键是理解每条查询在问什么。

## 三、Grafana：让指标“看得见”

Prometheus 负责收集和存储，Grafana 负责展示。Grafana 能做三件事：

### 3.1 把数字变成图表

一个最基础的 dashboard 应该至少包含：

- **Gold Signals（黄金信号）**：延迟（Latency）、流量（Traffic）、错误率（Errors）、饱和度（Saturation）。这是 Google SRE 提出的四个核心指标，任何一个出问题都意味着服务异常。
- **业务指标**：订单量、注册量、支付成功率。这些是老板关心的，也是你判断“系统健康还是坏了”的最终标准。
- **资源指标**：CPU、内存、磁盘、网络。这些告诉你基础设施有没有压榨到上限。

### 3.2 关联日志

如果你同时用了 Loki，可以在 Grafana 的同一个面板上，点一下图表，直接下钻到对应时间段的日志。**指标发现异常，日志确认原因。** 这个联动排查效率极高，谁用谁知道。

### 3.3 报警规则

Grafana 可以直接配报警规则。但报警不是越多越好——这正是下一篇文章要重点讲的内容。

## 四、设计 dashboard 的几个原则

### 原则一：一个 dashboard 回答一个问题

不要在一个 dashboard 里塞下所有信息。一个 dashboard 应该只回答一个问题：
- “现在系统健康吗？” → 概览 dashboard
- “用户感受到的延迟怎么样？” → 应用性能 dashboard  
- “数据库撑得住吗？” → 数据库 dashboard

### 原则二：从业务指标倒推

先监控用户能感受到的东西——响应时间、成功率、页面加载速度。然后一层层往下拆：是应用慢了？还是数据库慢了？还是网络出了问题？

**从外面看是“用户感觉慢”，从里面找是“什么地方慢了”。** 监控的层级应该是倒金字塔：业务指标在最上面，下面是应用指标，再下面是基础设施指标。

### 原则三：USE 和 RED 方法论

这是两个经典的指标选择方法：

- **USE（Utilization, Saturation, Errors）**：适用于资源（CPU、内存、磁盘）。看利用率、饱和度和错误数。
- **RED（Rate, Errors, Duration）**：适用于服务。看请求速率、错误率和耗时。

简单记：**硬件看 USE，服务看 RED。** 把这六个维度覆盖到，你的监控就基本没有盲区了。

## 小结

指标监控的价值不在于图有多漂亮，而在于**能不能让你比别人更快发现异常**。一个好的 dashboard 是你瞟一眼就知道系统有没有问题，而不是盯着看五分钟还在分析。从今天开始，审视一下你现在的监控面板——那些你从来不看、或者看了也不知道该干什么的图表，删掉它们。留白比冗余更好。

下一篇，我们来聊最容易被搞砸的环节——告警设计。

每天前进一小步，就是一个新的高度！
