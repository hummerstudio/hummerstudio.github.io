---
title: 'Feedback Systems Miscellany (Part 4): Instant Messaging Notifications — Webhook Connects Everything'
date: 2023-09-02
author: Tang Moying
categories: [feedback]
tags: [DevOps, Feedback Systems, Instant Messaging, Feishu (Lark), WeCom, Webhook, CI/CD]
lang: en
alt_url: /post/feedback-04-im
---

In real DevOps work, instant messaging tools (IM) are the most commonly used notification channel. Did the build succeed, is the deployment finished, which stage has the Pipeline reached — this kind of everyday information is best delivered with a quick word in a group chat. Compared with the formality of email and the heaviness of SMS, IM is the one that is “just right”.

The core technology behind IM notifications is the **Webhook** — a simple HTTP callback mechanism. Once you understand it, the same approach works for Feishu, WeCom, DingTalk and Slack.

<!--以上为摘要内容-->

## 1. What a Webhook is

A webhook is essentially **a URL: you POST data to it, and it delivers the message to the place you specify**.

```
Your system → HTTP POST → Webhook URL → IM platform → Group chat message
```

No complicated protocol, no long-lived connection, no SDK to install. All you need is to send a single HTTP request:

```bash
curl -X POST https://open.feishu.cn/open-apis/bot/v2/hook/xxxxx \
  -H "Content-Type: application/json" \
  -d '{
    "msg_type": "text",
    "content": {
      "text": "Build failed: myapp/master Build#42"
    }
  }'
```

It really is that simple. Everything else — how the message is rendered, how it is pushed to the client — the IM platform handles for you.

## 2. Feishu bots

### Creating a bot

1. Feishu group → Settings → Group bots → Add bot → Custom bot
2. Set a name (for example “CI Notification Assistant”) and the security settings (adding signature verification is recommended)
3. Copy the webhook address

### Message formats

Feishu bots support several message types:

```json
// Text message
{
  "msg_type": "text",
  "content": {
    "text": "[Build notification] myapp/master build succeeded, took 3m"
  }
}

// Rich text (recommended, high information density)
{
  "msg_type": "interactive",
  "card": {
    "header": {
      "title": {"tag": "plain_text", "content": "Build failed"},
      "template": "red"
    },
    "elements": [
      {"tag": "div", "text": {"tag": "lark_md", "content": "**Project**: myapp\n**Branch**: master\n**Failed stage**: Test"}},
      {"tag": "action", "actions": [
        {"tag": "button", "text": {"tag": "plain_text", "content": "View logs"}, "url": "https://jenkins/123"}
      ]}
    ]
  }
}
```

**Card messages** are far better than plain text — colour can distinguish success from failure, buttons can jump to the log page, and the information is clearly divided into sections.

### Security settings

Feishu supports three kinds of security check:

| Method | Description | Recommendation |
|------|------|------|
| **Signature verification** | The request carries a timestamp + sign, which the server verifies | ✅ Recommended |
| **IP allowlist** | Only requests from the specified IPs are allowed | Use as a secondary measure |
| **No verification** | Anyone who knows the webhook address can call it | ❌ Not recommended |

How the signature is computed:

```python
import hashlib, hmac, time

def generate_sign(secret, timestamp):
    string_to_sign = f"{timestamp}\n{secret}"
    hmac_code = hmac.new(
        string_to_sign.encode(), digestmod=hashlib.sha256
    ).digest()
    return hmac_code.hex()
```

## 3. WeCom bots

WeCom's webhook mechanism is almost identical:

1. Group chat → Group bots → Add
2. Get the webhook URL: `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxx`

Sending a message:

```json
{
  "msgtype": "markdown",
  "markdown": {
    "content": "## Build failed <font color=\"warning\">myapp/master</font>\n> Failed stage: Unit test\n> [View details](https://jenkins/123)"
  }
}
```

WeCom's `markdown` type supports colour tags, which makes it very well suited to intuitive build-status notifications.

### Feishu vs WeCom

| | Feishu | WeCom |
|---|------|---------|
| Message format | Text + card (interactive) | Text + Markdown + image-text |
| Rich-text capability | Strong (card layout) | Average (Markdown) |
| Buttons/interaction | Supported | Not supported |
| Signature verification | Supported | Not supported (the key is the authentication) |
| Suitable for | Complex notifications (with buttons and sections) | Concise notifications |

## 4. Integrating with a Jenkins Pipeline

```groovy
// Jenkinsfile - Feishu notification example
pipeline {
    agent any
    environment {
        FEISHU_WEBHOOK = credentials('feishu-webhook-url')
    }
    stages {
        stage('Build') { steps { sh 'mvn package' } }
        stage('Test')  { steps { sh 'mvn test' } }
    }
    post {
        failure {
            script {
                def msg = [
                    msg_type: "interactive",
                    card: [
                        header: [
                            title: [tag: "plain_text", content: "Build failed"],
                            template: "red"
                        ],
                        elements: [[
                            tag: "div",
                            text: [tag: "lark_md", 
                                   content: "**Project**: ${env.JOB_NAME}\n**Build number**: #${env.BUILD_NUMBER}\n**Stage**: ${env.STAGE_NAME}\n**Log**: [View](${env.BUILD_URL})"]
                        ]]
                    ]
                ]
                sh "curl -X POST ${FEISHU_WEBHOOK} -H 'Content-Type: application/json' -d '${groovy.json.JsonOutput.toJson(msg)}'"
            }
        }
        success {
            script {
                sh "curl -X POST ${FEISHU_WEBHOOK} -H 'Content-Type: application/json' -d '{\"msg_type\":\"text\",\"content\":{\"text\":\"✅ ${env.JOB_NAME} #${env.BUILD_NUMBER} build succeeded\"}}'"
            }
        }
    }
}
```

A few practical suggestions:

- **Store the webhook URL as a Jenkins Credential**; don't hard-code it in the Jenkinsfile
- **Use a concise message for success and a detailed card for failure** — a failure needs more information to pin down
- **Send to different groups in different environments**: notify the development group in development, and the operations group in production
- **Add `@ 人` support**: Feishu cards support naming a person with `at`, so on failure you can @ whoever triggered the build
- **In real use, implement this in a Jenkins shared library**; the Jenkinsfile only needs to call the shared library method

## Summary

The webhook is the core mechanism of instant messaging notifications. Whether it is Feishu, WeCom or any other IM tool, the principle is the same: “POST JSON data to a URL”. Once you have that, all that is left is to choose the right message format, get the security settings right, and send to the right group for each environment and each scenario.

Instant messaging notifications sit at the “everyday” level of use — high frequency, lightweight, real time. In the next article, which is also the last one, we will look at how to string email, SMS and IM together into a complete notification strategy.

One small step forward every day is a new height!
