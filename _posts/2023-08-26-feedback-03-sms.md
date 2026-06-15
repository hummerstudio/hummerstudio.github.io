---
title: 反馈体系漫谈（三）：短信通知——紧急事态的终极兜底
author: 唐明
categories: [feedback]
tags: [DevOps, 反馈体系, 短信通知, 告警, On-Call, 短信通道]
---

短信是所有通知通道里最“重”的——成本高、信息量少、还容易被滥用。但它有一个无可替代的优势：**强制触达**。半夜两点线上故障，邮件进了垃圾箱、IM 消息被静音，只有短信能把人叫起来。

换句话说：短信是反馈体系的“应急按钮”，不是日常工具。

<!--以上为摘要内容-->

## 一、短信通道的接入方式

短信通道本质上是一个**API 网关**——你把手机号和内容发给通道服务商，他们负责把短信送到运营商网络并最终下发到手机。

| 通道类型 | 代表 | 特点 |
|---------|------|------|
| **云服务商** | 阿里云短信、腾讯云短信 | 接入快、价格低、国内覆盖好 |
| **聚合平台** | 云片、Luosimao | 多通道聚合、灵活切换 |
| **国际通道** | Twilio、Nexmo | 国际化覆盖、API 质量高 |
| **运营商直连** | 移动/联通/电信 | 直达率高、但接入门槛高 |

选择短信通道时，重点关注三个指标：

- **送达率**：真正到手机上的比例。99% 和 95% 在紧急场景下天差地别
- **延迟**：从调用 API 到手机收到的时间。告警场景要求秒级
- **稳定性**：通道会不会偶尔挂掉？需不需要做多通道容灾？

### 短信 API 示例

以阿里云短信为例：

```java
// 发送短信告警
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

注意短信模板通常是**预先审核的**——你不能像邮件那样随时改内容。模板里用变量占位，发送时填充：

```
【DevOps告警】${severity}级告警：服务${service}异常，触发时间${time}，请立即处理。
```

## 二、短信适合什么场景

短信不应该到处用。下面是一个决策框架：

| 级别 | 场景 | 通道 | 示例 |
|------|------|------|------|
| P0 - 紧急 | 线上服务宕机、核心功能不可用 | **短信 + 电话** | 数据库挂了 |
| P1 - 严重 | 部分功能异常、性能下降 | **短信** | API 错误率 > 1% |
| P2 - 一般 | 非核心功能异常、需要关注 | **IM 通知** | 测试环境挂了 |
| P3 - 提示 | 信息通报 | **邮件** | 发布成功 |

核心原则：**只有需要立即行动的高优先级事件，才值得用短信。**

### On-Call 机制

短信通知通常和 On-Call 轮值配合使用：

```
告警触发 → 短信发给值班人 → 5分钟未响应？→ 升级到二线 → 仍无回应？→ 通知负责人
```

注意点：
- **单通道不可靠**：短信也可能不到（手机没信号、SIM 卡异常），P0 应该考虑多通道（短信 + 电话）
- **防抖设计**：同一个告警在 5 分钟内只发一次，避免“短信轰炸”
- **聚合窗口**：多个告警聚合后再发，5 个告警合并为一条

## 三、短信的防刷与成本控制

短信按条计费，国内一毛左右一条。一条两条不是事，但如果你的系统有 Bug，可能在 10 分钟内刷掉几百块钱的短信。

防刷策略：

```python
# 简单的防刷逻辑
def should_send_sms(phone, alert_id):
    # 同一告警 5 分钟内不重复发
    if redis.exists(f"sms:{phone}:{alert_id}"):
        return False
    
    # 同一个手机号 1 小时内最多 3 条
    if int(redis.get(f"sms:count:{phone}") or 0) >= 3:
        return False
    
    # 记录发送
    redis.setex(f"sms:{phone}:{alert_id}", 300, 1)
    redis.incr(f"sms:count:{phone}")
    redis.expire(f"sms:count:{phone}", 3600)
    return True
```

## 四、集成到 DevOps 流程

短信通知的典型集成点：

```
监控告警（Prometheus AlertManager）
    │
    ├── P0 告警 → Webhook → 短信网关 → On-Call 工程师
    ├── P1 告警 → Webhook → IM 通知 + 邮件
    └── P2 告警 → IM 通知
```

Prometheus AlertManager 配置示例：

```yaml
receivers:
  - name: 'sms-p0'
    webhook_configs:
      - url: 'http://alert-gateway.internal/sms/send'
        send_resolved: false
```

在 Pipeline 中，部署失败也可以触发短信（如果影响线上）：

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

## 小结

短信是反馈体系中“最高成本、最高保障”的通道。它不应该替代邮件或 IM，而是作为它们的兜底——当其他通道都失效时，短信是最后一道防线。用好的关键是：**严格控制触发条件、设计防抖和聚合、搭配 On-Call 轮值**。

下一篇，我们聊最常用的即时通讯通知——飞书和企业微信的机器人怎么配、Webhook 怎么设计、怎么在 Pipeline 中集成。

每天前进一小步，就是一个新的高度！