---
title: 'Feedback System Musings (Part 3): SMS Notifications — the Ultimate Fallback for Emergencies'
date: 2023-08-26
author: Tang Moying
categories: [feedback]
tags: [DevOps, Feedback Systems, SMS Notifications, Alerting, On-Call, SMS Channel]
lang: en
alt_url: /post/feedback-03-sms
---

SMS is the "heaviest" of all the notification channels — expensive, low in information density, and easy to abuse. But it has one irreplaceable advantage: **forced delivery**. When production breaks at two in the morning, email has landed in the spam folder and IM messages have been muted; only an SMS can get someone out of bed.

In other words: SMS is the "emergency button" of a feedback system, not an everyday tool.

<!--以上为摘要内容-->

## 1. How to Connect an SMS Channel

An SMS channel is essentially an **API gateway** — you send the phone number and the content to the channel provider, and they take care of delivering the message into the carrier network and ultimately down to the phone.

| Channel type | Examples | Characteristics |
|---------|------|------|
| **Cloud providers** | Alibaba Cloud SMS, Tencent Cloud SMS | Fast to onboard, low price, good coverage in mainland China |
| **Aggregators** | Yunpian (云片), Luosimao | Multiple channels aggregated, flexible switching |
| **International channels** | Twilio, Nexmo | Global coverage, high API quality |
| **Direct carrier connections** | China Mobile / China Unicom / China Telecom | High direct-delivery rate, but a high barrier to onboarding |

When choosing an SMS channel, focus on three metrics:

- **Delivery rate**: the proportion that actually reaches the phone. In an emergency, 99% and 95% are worlds apart
- **Latency**: the time from calling the API to the phone receiving the message. Alerting scenarios demand second-level latency
- **Reliability**: does the channel occasionally go down? Do you need multi-channel failover?

### SMS API Example

Take Alibaba Cloud SMS as an example:

```java
// Send an SMS alert
DefaultProfile profile = DefaultProfile.getProfile(
    "cn-hangzhou", "<accessKeyId>", "<accessSecret>");
IAcsClient client = new DefaultAcsClient(profile);

CommonRequest request = new CommonRequest();
request.setSysMethod(MethodType.POST);
request.setSysDomain("dysmsapi.aliyuncs.com");
request.setSysVersion("2017-05-25");
request.setSysAction("SendSms");
request.putQueryParameter("PhoneNumbers", "13800138000");
request.putQueryParameter("SignName", "DevOps告警平台");
request.putQueryParameter("TemplateCode", "SMS_123456");
request.putQueryParameter("TemplateParam", 
    "{\"severity\":\"P0\",\"service\":\"user-api\",\"time\":\"02:30\"}");

CommonResponse response = client.getCommonResponse(request);
```

Note that SMS templates are usually **pre-approved** — you can't change the content whenever you like the way you can with email. The template uses variable placeholders that are filled in at send time:

```
【DevOps告警】${severity}级告警：服务${service}异常，触发时间${time}，请立即处理。
```

## 2. What Scenarios SMS Suits

SMS should not be used everywhere. Here is a decision framework:

| Tier | Scenario | Channel | Example |
|------|------|------|------|
| P0 - Emergency | Production service down, core functionality unavailable | **SMS + phone call** | The database is down |
| P1 - Critical | Some functionality abnormal, performance degraded | **SMS** | API error rate > 1% |
| P2 - General | Non-core functionality abnormal, needs attention | **IM notification** | The test environment is down |
| P3 - Informational | Information bulletin | **Email** | Release succeeded |

Core principle: **only high-priority events that require immediate action are worth an SMS.**

### The On-Call Mechanism

SMS notifications are usually used together with an On-Call rotation:

```
Alert fires → SMS to the person on duty → No response in 5 minutes? → Escalate to the second line → Still no answer? → Notify the person in charge
```

Points to note:
- **A single channel is unreliable**: an SMS may also fail to arrive (no phone signal, an abnormal SIM card), so P0 should consider multiple channels (SMS + phone call)
- **Debouncing**: send the same alert only once within 5 minutes, to avoid an "SMS bombardment"
- **Aggregation window**: aggregate several alerts before sending — 5 alerts merged into one message

## 3. Anti-Abuse and Cost Control for SMS

SMS is billed per message, around one jiao (0.1 yuan) a message in mainland China. One or two messages are nothing, but if your system has a bug it might burn through several hundred yuan of SMS in 10 minutes.

Anti-abuse strategies:

```python
# Simple anti-abuse logic
def should_send_sms(phone, alert_id):
    # Don't resend the same alert within 5 minutes
    if redis.exists(f"sms:{phone}:{alert_id}"):
        return False
    
    # At most 3 messages per phone number within 1 hour
    if int(redis.get(f"sms:count:{phone}") or 0) >= 3:
        return False
    
    # Record the send
    redis.setex(f"sms:{phone}:{alert_id}", 300, 1)
    redis.incr(f"sms:count:{phone}")
    redis.expire(f"sms:count:{phone}", 3600)
    return True
```

## 4. Integrating Into the DevOps Flow

Typical integration points for SMS notifications:

```
Monitoring alerts (Prometheus AlertManager)
    │
    ├── P0 alert → Webhook → SMS gateway → On-Call engineer
    ├── P1 alert → Webhook → IM notification + email
    └── P2 alert → IM notification
```

Prometheus AlertManager configuration example:

```yaml
receivers:
  - name: 'sms-p0'
    webhook_configs:
      - url: 'http://alert-gateway.internal/sms/send'
        send_resolved: false
```

In a Pipeline, a failed deployment can also trigger an SMS (if it affects production):

```groovy
post {
    failure {
        script {
            if (env.DEPLOY_ENV == 'production') {
                sh """
                    curl -X POST http://sms-gateway/send \
                      -d 'phone=13800138000' \
                      -d 'msg=生产环境部署失败: ${env.JOB_NAME} Build#${env.BUILD_NUMBER}'
                """
            }
        }
    }
}
```

## Summary

SMS is the "highest cost, highest assurance" channel in a feedback system. It should not replace email or IM; it serves as their fallback — when the other channels all fail, SMS is the last line of defence. The key to using it well: **keep the trigger conditions strictly controlled, design debouncing and aggregation, and pair it with an On-Call rotation**.

In the next post we'll talk about the most commonly used instant messaging notifications — how to configure the bots for Feishu (飞书) and WeCom (企业微信), how to design the webhook, and how to integrate them into a Pipeline.

A small step forward every day is a new height!
