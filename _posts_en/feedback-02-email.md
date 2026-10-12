---
title: 'Feedback Systems (Part 2): Email Notifications — The Oldest and Most Reliable Channel'
date: 2023-08-19
author: Tang Moying
categories: [feedback]
tags: [DevOps, Feedback Systems, Email Notifications, SMTP, SendGrid, Jenkins]
lang: en
alt_url: /post/feedback-02-email
---

With instant messaging tools flying everywhere these days, talking about email notifications can feel a little "outdated". But the reality is this — email is still the most basic and the most formal notification channel in DevOps. Build reports, release announcements, scheduled weekly summaries: in all of these situations email has advantages nothing else can replace.

More importantly, the SMTP protocol behind email is one of the few protocols across all notification systems whose underlying design you genuinely need to understand. Understand SMTP and you understand "how a message is delivered reliably".

<!--以上为摘要内容-->

## 1. SMTP Protocol Basics

SMTP (Simple Mail Transfer Protocol) is the standard protocol for sending email on the internet. Its first version, RFC 821, was published in 1982, and more than forty years later it is still the core of email.

SMTP's mode of operation is simple — **store and forward**:

```
Your application → SMTP server → (possibly through several relays) → recipient's SMTP server → inbox
```

A typical SMTP session looks like this:

```
客户端: HELO myapp.devops.com
服务器: 250 smtp.example.com Hello
客户端: MAIL FROM:<ci@myapp.com>
服务器: 250 OK
客户端: RCPT TO:<dev-team@myapp.com>
服务器: 250 OK
客户端: DATA
服务器: 354 Start mail input
客户端: From: CI System <ci@myapp.com>
        To: Dev Team <dev-team@myapp.com>
        Subject: Build Failed - v2.3.1
        Content-Type: text/html; charset=utf-8

        <h2>构建失败通知</h2>
        <p>项目: myapp</p>
        <p>分支: master</p>
        ......
        .
服务器: 250 OK: queued
客户端: QUIT
```

A few key points:

- **SMTP is a plain-text protocol**: commands and responses are readable text, and the default port is 25 (or 587/465 for TLS)
- **Sender and recipient are specified separately**: `MAIL FROM` is the envelope sender (envelope from), while the `From` in the message body is the header sender (header from); the two can differ
- **Multi-hop delivery**: a message may be forwarded through several SMTP servers, and each hop adds a `Received:` header line

### How SMTP Provides Reliability

SMTP itself is a "best effort" protocol — it guarantees that errors during transfer are detected, but it cannot guarantee delivery. Reliability comes from a retry mechanism at the layer above:

```
Send → failed? → retry (exponential backoff)
       success → write a log entry
```

Most SMTP servers keep retrying a failed delivery for a period of time (usually 24-72 hours). That is also why email sometimes "arrives late" — it has been retrying in the background the whole time.

## 2. Choosing an Email Service

There are usually three ways to send email in a DevOps setting:

| Approach | Description | When it fits |
|------|------|---------|
| **Self-hosted SMTP** | Deploy Postfix/Sendmail | High control requirements, needs ops skills |
| **Cloud email service** | SendGrid, AWS SES, Alibaba Cloud DirectMail (阿里云邮件推送) | The most common approach, no ops work |
| **Corporate mailbox** | The company's Exchange/corporate mail | Internal notifications, infrastructure already in place |

For most teams a **cloud email service** is the most pragmatic choice. With SendGrid, for example, integration is very simple:

```bash
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"email": "ci@myapp.com"},
    "subject": "Build Failed",
    "content": [{"type": "text/html", "value": "<h2>Build failed</h2>"}],
    "personalizations": [{"to": [{"email": "team@myapp.com"}]}]
  }'
```

## 3. Designing an Email Template

A good DevOps notification email should let you **spot the problem at a glance and decide quickly**. The core elements:

1. **Subject**: say what happened in one sentence
   - Good: `[BUILD FAILED] myapp/master - commit abc1234`
   - Bad: `通知`

2. **Summary block**: key information up front
   - Project, branch, who triggered it, which stage failed, how long it took

3. **Details block**: expand only if needed
   - Error log summary, link to the test report, recent commits

4. **Action block**: let people act directly
   - Links to the build page, the logs, the rollback button

A typical CI failure email template (HTML):

```html
<h2 style="color:#d32f2f;">构建失败</h2>
<table>
  <tr><td>项目</td><td>myapp</td></tr>
  <tr><td>分支</td><td>master</td></tr>
  <tr><td>触发人</td><td>张三</td></tr>
  <tr><td>失败阶段</td><td>单元测试</td></tr>
  <tr><td>耗时</td><td>3m 42s</td></tr>
</table>
<h3>关键错误</h3>
<pre>UserServiceTest.testLogin: expected 200 but got 500</pre>
<p><a href="https://jenkins.myapp.com/job/123">View build details →</a></p>
```

## 4. Integrating into CI/CD

Take Jenkins as the example: the `emailext` plugin is standard equipment:

```groovy
pipeline {
    agent any
    stages {
        stage('Build') { steps { sh 'mvn package' } }
        stage('Test')  { steps { sh 'mvn test' } }
    }
    post {
        failure {
            emailext(
                subject: "[BUILD FAILED] ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: """构建失败: ${env.BUILD_URL}
                        失败阶段: ${currentBuild.failureStage}
                        触发人: ${currentBuild.buildCauses}""",
                to: 'dev-team@myapp.com'
            )
        }
        success {
            emailext(
                subject: "[BUILD SUCCESS] ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "构建成功: ${env.BUILD_URL}",
                to: 'dev-leads@myapp.com'
            )
        }
    }
}
```

Key practices:

- **Notify on both failure and success**: successful builds need notification too, because the alternative may be that the build never ran or is still running
- **Differentiate the recipients**: build failures go to the development team, successful deployments go to the test team
- **Include the necessary metadata**: let the people involved locate or rule out the problem quickly, without opening the build page

## Summary

Email notification is the most basic channel in a feedback system. The SMTP protocol may be "old", but it is simple and reliable. Choose a suitable email service, design a clear template, integrate it into the `post` stage of your pipeline, and email notifications become genuinely practical.

Next time we will talk about SMS notifications — when should you use SMS? How do you integrate an SMS gateway? How do you prevent abuse?

A small step forward every day is a new height!
