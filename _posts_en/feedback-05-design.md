---
title: 'Feedback System Musings (Part 5): Notification Strategy Design — When to Notify Whom'
date: 2023-09-09
author: Tang Moying
categories: [feedback]
tags: [DevOps, Feedback Systems, Notification Strategy, Alert Severity, Alert Fatigue, On-Call]
lang: en
alt_url: /post/feedback-05-design
---

The previous four posts covered the technical details and integration approaches for three channels: email, SMS, and instant messaging. Now that the mechanics (术) are in place, the last thing to talk about is the philosophy (道) — how to combine these channels into a notification system that really works.

There is only one core question in notification system design: **at the right time, deliver the right information, through the right channel, to the right person.**

<!--以上为摘要内容-->

## 1. Notification Tiers: Not Every Failure Is Worth an SMS

Events in DevOps vary enormously. A log warning and a production database going down are completely different in nature. If every notification goes through the same channel to the same group of people, the result is inevitably **alert fatigue** — everyone treats notifications as background noise, and the things that genuinely matter get ignored.

A basic framework for tiering notifications:

| Tier | Meaning | Notification channel | Recipient | Response requirement |
|------|------|---------|---------|---------|
| **P0 - Emergency** | Production service unavailable, core functionality interrupted | SMS + phone + IM | On-Call + owner | Immediate response (within 5 minutes) |
| **P1 - Critical** | Service abnormal but not completely down | SMS (single message) + IM | On-Call | Respond as soon as possible (within 30 minutes) |
| **P2 - General** | Non-core functionality abnormal, needs attention | IM notification | Related developers | Handle during working hours |
| **P3 - Informational** | Information bulletins, routine reports | Email / silenced IM | All members | No response needed |

### Dimensions for Judging the Tier

How do you decide which tier an event should be classified as? Three dimensions:

1. **Impact scope**: How many users are affected? Is it core functionality?
2. **Duration**: How long has it been going on? How much longer is it expected to last?
3. **Recoverability**: Can it recover automatically? Would a rollback work?

An example judgment:

```
场景：用户服务 API 错误率从 0.01% 升到 5%，持续 3 分钟
→ Impact scope: Medium (API still available, but some requests fail)
→ Duration: Not long, but the trend is bad
→ Recoverability: Uncertain
→ Severity: P1 (Severe)
→ Action: SMS notification to On-Call + IM group notification
```

## 2. Recipients: Not Everyone Needs to Know Everything

Recipients should be divided by role, rather than "if there's a notification, send it to everyone":

```
Pipeline 事件
    ├── Build failed → triggerer + related module owners
    ├── Deploy to test environment → test team
    ├── Deploy to production environment → ops + all-hands announcement
    └── Security vulnerability scan → security team

线上告警
    ├── P0 → On-Call (primary) + team lead (escalate)
    ├── P1 → On-Call + service owner
    └── P2 → service owner (weekdays)
```

### Designing the On-Call Rotation

On-Call can't be "whoever's around takes it"; there has to be an explicit schedule:

```
第1周: 张三（主） + 李四（备）
第2周: 王五（主） + 赵六（备）
第3周: 张三（主） + 李四（备）
...

Escalation rule: primary On-Call no ack within 5 minutes → notify backup On-Call → still no response → notify team lead
```

Practical suggestions:
- **One week per rotation**: too short and you switch constantly; too long and the burden is heavy
- **There must be a backup**: the primary On-Call might be in the shower, or driving
- **Do a handoff**: when you hand over, explain what happened last week and what loose ends remain

## 3. Alert Aggregation and Debouncing

A single failure can trigger a dozen alerts — the DB can't be reached, so the API errors; the API errors, so the upstream errors; one root cause splits into dozens of notifications.

Without aggregation, the result is an **alert storm**:

```
21:30 - [P1] 数据库连接超时
21:30 - [P1] 用户服务 API 错误率上升
21:30 - [P1] 订单服务调用超时
21:30 - [P1] 支付服务异常
21:30 - [P1] 网关 502
21:30 - [P1] 前端页面不可用
21:31 - [P1] 数据库连接超时
21:31 - [P1] 用户服务 API 错误率上升
...
```

It should be aggregated into something like this:

```
21:30 - [P0] 核心服务大面积故障
  根因: 数据库主库连接超时
  影响: 用户服务、订单服务、支付服务、网关
  已自动触发主备切换，正在恢复中...
```

Aggregation strategies:
- **Time window**: aggregate related alerts within the same time window (within 2 minutes, say)
- **Dependency topology**: based on service dependencies, attribute downstream alerts to the upstream root cause
- **Deduplication**: don't send the same alert twice

```python
# simple alert aggregation logic
def process_alert(alert):
    key = f"{alert.service}:{alert.type}"  # aggregation key
    
    # aggregate alerts of the same kind within 2 minutes
    if redis.exists(f"alert:flood:{key}"):
        redis.hincrby(f"alert:flood:{key}", "count", 1)
        return None  # don't send a notification
    
    # new alert
    redis.setex(f"alert:flood:{key}", 120, '1')
    return send_notification(alert)
```

## 4. Designing the Notification Content

Notification content should follow the **pyramid principle** — the most important thing comes first:

```
[Level] [Status] [Title]                 ← Most critical, seen at a glance
─────────────────────
Basic info: project, env, trigger, time  ← Quick orientation
Key info: error summary, impact, action  ← Aids decisions
Details: log links, dashboards, records  ← Expand when needed
```

An example of a good notification:

```
🔴 [P1] 用户服务 API 错误率异常
──────────────────────────────
环境: 生产环境
服务: user-api
指标: 错误率 5.2%（正常 < 0.1%）
持续: 3 分钟
Action: view monitoring → check logs → roll back if needed
──────────────────────────────
📊 Grafana | 📋 日志 | 🔄 回滚
```

## 5. Practices for Avoiding Alert Fatigue

Alert fatigue is the biggest enemy of a notification system. A few core principles:

1. **Notifications must be actionable**: after receiving one, you know what to do; otherwise it's just noise
   - ❌ `CPU 使用率 85%` (and then what?)
   - ✅ `CPU 使用率 85%，是否加扩容？[一键扩容]`

2. **Silence periods have meaning**: nothing below P2 outside working hours, nothing during maintenance windows

   ```yaml
   # Prometheus AlertManager silence rules
   mute_time_intervals:
     - name: outside-business-hours
       time_intervals:
         - weekdays: ['monday':'friday']
           times:
             - start_time: '18:00'
               end_time: '09:00'
   ```

3. **Regularly clean up useless alerts**: every month, review which alerts have never been acted on and either remove or downgrade them

4. **Keep channels clean**: the IM notification group carries only DevOps notifications — don't mix in day-to-day chatter

## 6. The Complete Notification System Architecture

Stringing the previous four posts together, here's the complete architecture of a notification system:

```
事件源层
  ├── CI/CD Pipeline（Jenkins/GitLab CI）
  ├── Monitoring alerts (Prometheus/Grafana)
  ├── Log analysis (ELK/Loki)
  └── Security scanning (SonarQube/Trivy)
         │
         ▼
路由层（通知中心）
  ├── Severity classification (P0/P1/P2/P3)
  ├── Aggregation & dedup (debounce + dependency topology)
  ├── Silence rules (maintenance window/business hours)
  └── Channel selection (SMS/IM/email)
         │
         ▼
通道层
  ├── Email (SMTP/SendGrid)
  ├── SMS (Alibaba Cloud/Twilio)
  └── IM (Feishu/WeCom Webhook)
         │
         ▼
接收层
  └── Distribute by role + severity to the right people
```

## Summary

Notification system design isn't a question of which tool to choose; it's a **decision framework**:

- **What tiers**: P0 through P3, based on impact / duration / recoverability
- **Whom to notify**: by role and On-Call schedule, without disturbing people who aren't involved
- **How to aggregate**: merge by root cause, deduplicate within the same time window
- **What to say**: a pyramid structure, with the most important thing first
- **How to prevent fatigue**: actionable, with silence periods, cleaned up regularly

From the first post, which talked about email and SMTP, to finishing the discussion of notification system design here, this series comes to a close. Feedback is the key link that carries the DevOps loop from Monitor back to Plan. A good feedback system takes people from "not knowing" to "being the first to know", and from "responding passively" to "acting proactively".

A small step forward every day is a new height!