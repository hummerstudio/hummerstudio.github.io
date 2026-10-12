---
title: 'Monitoring Musings (Part 4): Alert Design — Why Your Alerts Make People "Numb"'
date: 2026-02-07
author: Tang Moying
categories: [monitor]
tags: [Alerting, Alertmanager, On-Call, Monitoring, SRE, Alert Fatigue]
lang: en
alt_url: /post/monitor-04-alerting
---

Three in the morning, your phone rings. Half asleep, you pick it up and look — "CPU usage above 80%". You open the monitoring dashboard for a quick look; the business is completely normal, it's just a traffic peak. You sigh, mute the alert, and go back to sleep. The next day you get 30 more alerts like it. On the third day you turn notifications off. Congratulations — your alerting system is now brain-dead. It's not that you don't have enough alerts; it's that your alerts aren't good enough. This article is about how to design alerts that people will actually take seriously.

<!--以上为摘要内容-->

## 1. Alert Fatigue: Scarier Than Having No Alerts at All

"Alert fatigue" is a classic term in the operations world. Its logic is simple:

```
Too many alerts → too many false alerts → stop trusting any alert → miss real incidents
```

That's the same story as "the boy who cried wolf". The difference is that in the story it's a child shouting, whereas your alerts are a machine shouting — a machine feels no guilt, it just fires according to the rules.

**Typical symptoms of alert fatigue:**
- Dozens or hundreds of alerts a day in the team chat group, with nobody replying
- On-call staff turning alert notifications to silent
- After a major incident, the postmortem: "Didn't the alert go off?" — "Did it? I didn't see it."

If your team has any one of these symptoms, your alerting strategy needs a major overhaul.

## 2. The Golden Rules of Alerting

### Rule 1: An Alert Must Be Able to Trigger Action

This is the highest principle of alert design. If an alert fires and the recipient doesn't know what to do, then that alert shouldn't exist.

**Examples of alerts you shouldn't have**:
- CPU usage above 80% (this may just be a normal traffic fluctuation, no human intervention needed)
- Disk usage above 70% (there's still 30% left, no need to wake someone up in the middle of the night)
- Some scheduled job taking more than 10 seconds to run (the data volume may simply have grown)

**Examples of alerts you should have**:
- Payment success rate dropping from 99.5% to 95% (users are being affected right now, immediate intervention needed)
- API 5xx error count exceeding the threshold for 3 consecutive minutes (something is wrong with the service)
- Disk usage above 95% and still growing fast (it's about to go down)

A good test: **every time you add an alert rule, ask yourself "if this alert fires at 3 a.m., what is the recipient supposed to do?"** If the answer isn't clear, the rule shouldn't exist.

### Rule 2: Alerts Should Report "Symptoms", Not "Causes"

This principle comes from Google SRE's best practices. An alert should be about the symptom "users are being affected", not about "some internal metric that might be a problem".

```
告警"用户支付失败" ✓  —— 症状，用户已经受影响了
告警"数据库连接池达到 80%" ✗ —— 病因，用户可能还没受影响
```

Why? Because "database connection pool at 80%" might fix itself, and it might never affect users — alerting on it just creates noise. The purpose of an alert isn't to let you know "what the system is doing internally", it's to tell you "what users are going through right now".

### Rule 3: Distinguish Degrees of Urgency

Not every problem warrants waking someone up at 3 a.m. Alerts must be graded:

| Level | Meaning | Notification method | Response requirement |
|------|------|---------|---------|
| **P0 / Critical** | Users are being affected; the service is unavailable | Phone + SMS + IM | Respond within 5 minutes |
| **P1 / Warning** | At risk but not yet affecting users | IM + email | Handle within 30 minutes |
| **P2 / Info** | Worth attention but not urgent | Email or no notification | Handle during working hours |

Many teams start out by making every alert P0 — with the result that there are no P0s left.

## 3. The Five Elements of a Good Alert

When you write an alert rule, check these five things:

### 1. A Clear Trigger Condition

It can't be a simple threshold; it needs a duration judgement:

```yaml
# A bad alert rule: fires on the instant
- alert: HighErrorRate
  expr: error_rate > 5%
  
# A good alert rule: only fires after 5 minutes
- alert: HighErrorRate
  expr: error_rate > 5%
  for: 5m
```

Adding a `for` condition filters out a large amount of momentary jitter and greatly increases an alert's credibility.

### 2. A Clear Alert Title

The title has to tell the recipient "which service, what problem, how serious":

- Bad: "Alert: error rate too high"
- Good: "[P0] Order Service - payment API error rate 12% (threshold 5%) - lasting 6 minutes"

### 3. Useful Alert Details

The alert message should contain the key information needed to troubleshoot:
- Which service
- Which metric is abnormal
- Current value vs threshold
- Duration
- A link to the relevant dashboard
- A link to the relevant runbook (operating manual)

### 4. A Sensible Notification Strategy

Not every alert goes to everybody. **Alerts should go to "the people who need to know" and "the people who can deal with them".**

- Application-related alerts → on-call developers
- Infrastructure alerts → on-call operations staff
- Severe P0 alerts → escalate to the technical lead

### 5. Silence and Inhibition

This one is often overlooked, but it matters a great deal. Alerting should support:
- **Silence**: during planned maintenance, don't let alerts pester people
- **Inhibition**: if "the server is down" has already fired, then "the service on that server is unavailable" doesn't need to fire as well — the former already includes the latter
- **Grouping**: merge alerts of the same kind into one, don't send 100 separate messages

## 4. Alertmanager: the Alerting Hub of the Prometheus Ecosystem

Prometheus's alerts are managed through Alertmanager. Its core flow is:

```
Prometheus triggers alert rule → Alertmanager receives → group/inhibit/silence → send notification
```

A simple Alertmanager configuration example:

```yaml
# alertmanager.yml
route:
  group_by: ['alertname', 'severity']
  group_wait: 30s        # wait 30 seconds, so alerts in the same group go out together
  group_interval: 5m     # when a new alert joins the group, wait 5 minutes before notifying again
  repeat_interval: 4h    # remind once every 4 hours about alerts that haven't recovered
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'oncall-phone'
    - match:
        severity: warning
      receiver: 'team-im'

receivers:
  - name: 'oncall-phone'
    webhook_configs:
      - url: 'http://phone-call-service/alert'
  - name: 'team-im'
    webhook_configs:
      - url: 'http://wechat-bot/alert'
```

The key parameters:
- `group_wait`: alerts in the same group wait 30 seconds before being sent, avoiding one-after-another notifications during an alert storm
- `group_interval`: for new alerts added to an existing group, wait at least 5 minutes before notifying
- `repeat_interval`: alerts that stay unresolved are reminded once every 4 hours

These three parameters give precise control over alert frequency, and they're the key configuration for avoiding pestering people.

## 5. Common Pitfalls in Practice

### Pitfall 1: Rules Configured in the Daytime Only Show Their Problems at Night

During the daytime business peak things may look perfectly normal, but in the quiet overnight hours those "fluctuation-type" alert rules blow up. **Let any new alert rule run through at least one complete business cycle (24h) before you formally enable it.**

### Pitfall 2: It Alerts, but Nobody Knows What to Do

Many teams configure alerts but have no runbook. The alert fires, the on-call person opens the message and sees: error rate above threshold. And then they don't know what to do next.

**Every alert rule should have a runbook to go with it** — a simple document that tells you what this alert means, what to check first, what to check second, and who can help.

### Pitfall 3: Recovery Notifications Matter More Than the Alerts Themselves

Many teams only care about "when does it fire" and completely ignore "when has it recovered". The point of a recovery notification is: you no longer have to keep staring at the monitoring — it's fixed.

**Alertmanager sends recovery notifications by default — don't turn that off.**

## Wrap-up

The essence of alerting is to let machines do the "on-call shift" for people, not to make people anxious on the machine's behalf. A good alerting system should make the on-call engineer trust it — every alert deserves to be taken seriously, and for every alert you know what to do. If your alerting system can't manage that, then it isn't a helper, it's a burden.

Starting today, review the alert rules you have. Delete the ones where "it fires and you still don't know what to do", add a `for` condition to the rest, and fill in the missing runbooks. Fewer alerts, but every one of them genuinely useful — that's the right direction.

Next time, the final article in this series, we'll talk about distributed tracing — when a single request passes through a dozen microservices, how are you supposed to know what it actually went through?

A small step forward every day is a new height!
