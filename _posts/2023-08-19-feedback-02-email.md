---
title: 反馈体系漫谈（二）：邮件通知——最古老也最可靠的通道
author: 唐明
categories: [feedback]
tags: [DevOps, 反馈体系, 邮件通知, SMTP, SendGrid, Jenkins]
---

在一堆即时通讯工具满天飞的今天，聊邮件通知似乎有点“过时”。但实际情况是——邮件仍然是 DevOps 中最基础、最正式的通知通道。构建报告、发布公告、定时周报，这些场景下，邮件有不可替代的优势。

更重要的是，邮件背后的 SMTP 协议，是所有通知系统中少数几个你真正需要理解协议原理的。理解了 SMTP，你就理解了“消息怎么被可靠地送出去”。

<!--以上为摘要内容-->

## 一、SMTP 协议基础

SMTP（Simple Mail Transfer Protocol）是互联网上发送邮件的标准协议，1982 年发布第一版 RFC 821，至今四十多年，依然是邮件的核心。

SMTP 的工作模式很简单——**存储转发**：

```
你的应用 → SMTP 服务器 → （可能经过多个中转）→ 收件方 SMTP 服务器 → 收件箱
```

一次典型的 SMTP 会话长这样：

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

几个关键点：

- **SMTP 是纯文本协议**：命令和响应都是可读的文本，默认端口 25（或 587/465 for TLS）
- **发件人和收件人是分开指定的**：`MAIL FROM` 是信封发件人（envelope from），邮件正文里的 `From` 是头部发件人（header from），两者可以不同
- **多段传输**：一封邮件可能经过多跳 SMTP 服务器转发，每跳都加一行 `Received:` 头

### SMTP 的可靠性保障

SMTP 本身是一个“尽力而为”的协议——它保证传输过程中的错误能被检测到，但不能保证一定送达。可靠性来源于上层的重试机制：

```
发送 → 失败？→ 重试（指数退避）
      成功 → 记录日志
```

大多数 SMTP 服务器会在一定时间内（通常是 24-72 小时）持续重试失败的投递。这也是为什么有时候邮件会“延迟到达”——它一直在后台重试。

## 二、邮件服务的选择

在 DevOps 场景中发邮件，通常有三种方式：

| 方式 | 说明 | 适用场景 |
|------|------|---------|
| **自建 SMTP** | 部署 Postfix/Sendmail | 高管控需求，需运维能力 |
| **云邮件服务** | SendGrid、AWS SES、阿里云邮件推送 | 最常用的方式，免运维 |
| **企业邮箱** | 公司 Exchange/企业邮 | 内部通知，已有基础设施 |

对于大多数团队，**云邮件服务**是最务实的选择。以 SendGrid 为例，接入非常简单：

```bash
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"email": "ci@myapp.com"},
    "subject": "Build Failed",
    "content": [{"type": "text/html", "value": "<h2>构建失败</h2>"}],
    "personalizations": [{"to": [{"email": "team@myapp.com"}]}]
  }'
```

## 三、邮件模板设计

一封好的 DevOps 通知邮件，应该做到**一眼定位问题、快速决策**。核心要素：

1. **标题**：一句话说清楚发生了什么
   - 好：`[BUILD FAILED] myapp/master - commit abc1234`
   - 坏：`通知`

2. **摘要区**：关键信息前置
   - 项目、分支、触发人、失败阶段、耗时

3. **详情区**：有需要再展开
   - 错误日志摘要、测试报告链接、最近的提交记录

4. **操作区**：让人能直接行动
   - 链接到构建页面、日志、回滚按钮

一个典型的 CI 失败邮件模板（HTML）：

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
<p><a href="https://jenkins.myapp.com/job/123">查看构建详情 →</a></p>
```

## 四、集成到 CI/CD

以 Jenkins 为例，`emailext` 插件是标配：

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

关键实践：

- **失败、成功都要通知**：成功的构建也要通知，因为可能是没跑/在跑
- **区分收件人**：构建失败通知开发团队，部署成功通知测试团队
- **包含必要元数据**：让相关方能不进入构建页面就能快速定位/排除问题

## 小结

邮件通知是反馈体系中最基础的通道。SMTP 协议虽然“老”，但它简单可靠。选择合适的邮件服务、设计清晰的模板、集成到 Pipeline 的 `post` 阶段，就能让邮件通知变得实用。

下一篇，我们聊短信通知——什么时候该用短信？怎么接入短信通道？怎么做防刷？

每天前进一小步，就是一个新的高度！