---
title: 'Feedback System Musings (Part 1): From "Seeing the Problem" to "Triggering Action"'
date: 2023-08-12
author: Tang Moying
categories: [feedback]
tags: [DevOps, Feedback Systems, Notifications, Email, SMS, Instant Messaging, CI/CD]
lang: en
alt_url: /post/feedback-01-intro
---

Have you ever run into this? The CI pipeline has been down for half an hour and nobody noticed, until a tester comes over to ask "why isn't the package out yet?" Production breaks, and you only find out from a user's screenshot? The release is finished, someone shouts about it in the group chat, and everyone who needed to know missed it?

The essence of all these problems is the same — **you didn't know at the moment you needed to know**.

So what's missing behind all this? Not monitoring. Prometheus is set up, the Grafana dashboards are glowing, logs are being collected. What's missing is the bridge between "seeing" and "acting" — **feedback**.

<!--以上为摘要内容-->

## 1. Two Versions of the DevOps Loop

Anyone who talks about DevOps has seen this loop: **Plan → Code → Build → Test → Release → Deploy → Operate → Monitor**. This is the most widely circulated classic version, and it includes a separate "Operate" stage.

But the navigation structure this blog uses is a different version: **Plan → Code → Build → Test → Release → Deploy → Monitor → Feedback**.

Compared with the classic version there are two differences. First, "Operate" is gone — deployment goes straight into monitoring, because in the DevOps practice we're discussing, operations is not a separate stage but runs throughout deployment and monitoring. Second, "feedback", which is implicit in the classic version, is made explicit — a Feedback stage stands on its own after Monitor and before the loop returns to Plan.

This blog's category navigation is organized in exactly this order: requirements → coding → build → testing → release → deployment → monitoring → feedback. This article is the first under the "feedback" category.

## 2. Why "Feedback" Deserves Its Own Stage

After Monitor — then what? The monitoring system sees an anomaly (CPU spikes, the error rate climbs, the build fails), but **who turns the problem Monitor saw into action by the people concerned?**

That is "feedback".

The word "feedback" originally means a system receiving information and returning it so as to influence the next step of behavior. In DevOps, feedback means: **pushing changes in system state to the people who need to know, so as to drive them to make decisions and take action.**

There's an important distinction here — at the level of the system, I call it the "feedback system"; at the level of a concrete action, it's a "notification". Notifications are the hands and feet of the feedback system, used to send messages out; the feedback system is the brain, deciding when, in what situation, to whom and how to notify.

A notification doesn't make decisions; it only puts the signal in someone's hands. The decision is made by people. The goal of the feedback system is to let people get the right information at the right time and make the right decision.

## 3. A Common Misconception: Is Feedback Only After Monitor?

It should be said that placing Feedback after Monitor is just its position in the loop model; it doesn't mean feedback only happens during the monitoring stage. In fact, feedback exists throughout the entire DevOps loop:

- **Coding stage**: comments in code review are feedback, driving you to revise your code
- **Build stage**: a notification that compilation failed is feedback, telling you there's a problem with your code
- **Testing stage**: a pushed test report is feedback, letting you know which cases failed
- **Release stage**: the approval result of a release ticket is feedback, determining whether you can go live
- **Deployment stage**: a deployment status notification is feedback, telling testing/operations they can start verifying
- **Monitoring stage**: a production alert is feedback, letting you know the system has a problem

So to be precise: **feedback runs through the whole of DevOps, but as an independent stage in the loop it specifically means systematically pushing the signals from every link to the right people and triggering the right action.** This independent stage exists so that you don't build monitoring and then forget the last mile of "notifying a person".

## 4. The Three Notification Channels

The execution layer of the feedback system is notification, and there are currently three kinds of notification channel most used in DevOps scenarios:

| Channel | Typical scenarios | Advantages | Drawbacks |
|---------|-------------------|------------|-----------|
| **Email** | Build reports, release announcements, weekly digests | High information volume, archiveable, cross-platform | Poor real-time performance, easily buried in the inbox |
| **SMS** | Production P0 alerts, waking up on-call staff | Forced reach; you get it even without looking at your phone | Costly, limited information volume |
| **Instant messaging** | Build status, deployment notifications, day-to-day operations | Good real-time performance, naturally suited to team collaboration | Dependent on third-party platforms, differing protocols |

These three are not substitutes for one another; they complement one another. A mature feedback system usually combines all three — day-to-day matters over IM, emergencies by SMS, archiving and formal notifications by email.

## 5. A Notification Is Not As Simple As "Sending a Message"

When I first started doing DevOps, I also thought a notification was just "sending a message" — if it fails, fire off an email, and that's that, right?

Only after doing it for a while did I realize a notification isn't that simple:

- **Channel choice**: when to send an email, when to send a text, when to go through instant messaging?
- **Content design**: what information should a notification carry? Cram it with logs and nobody reads it; too little and you can't locate the problem.
- **Delivery guarantees**: what if the email lands in spam? What if the carrier blocks the text? How do you design Webhook timeout retries?
- **Avoiding alert fatigue**: get 200 notifications a day and even something important gets ignored.

What's more troublesome is that these aren't questions you settle by "picking a tool". They involve protocol fundamentals (how does SMTP work? what's the protocol for the SMS channel? what's the push model of a Webhook?), they involve integration methods (how do you send a notification from inside a Jenkins Pipeline? how do you hook up a Feishu bot?), and they also involve team conventions (when should whom be notified? to what extent?).

## 6. Where Notification Sits in a CI/CD Pipeline

Take a typical Pipeline as an example:

```
Commit code → compile → unit test → static check → package → deploy to test environment
   │         │        │         │        │           │
   └─────────┴────────┴─────────┴────────┴───────────┘
                      │
                      ├── Failure → instant notification + email
                      ├── Success → instant notification (optional)
                      └── Deployment complete → notify stakeholders
```

Notifications shouldn't go out only on "failure". Successful builds should leave a record too (at least archived to email), and once deployment finishes the testing team should be told they can start verifying. The key is that **different events go through different channels and to different people** — that's called a notification policy.

## 7. The Plan for This Series

This series is planned as five articles, moving from channel fundamentals to system design to explain the feedback system in DevOps step by step:

| # | Article | Content |
|---|---------|---------|
| 1 | **Overview (this article)** | What a feedback system is, an overview of channels, a series overview |
| 2 | **Email notifications** | SMTP protocol fundamentals, email template design, Pipeline integration |
| 3 | **SMS notifications** | Integrating an SMS channel, designing alerts for DevOps scenarios |
| 4 | **Instant messaging notifications** | Feishu / WeCom bots, Webhook principles and practice |
| 5 | **Notification policy design** | Notification tiers, avoiding alert fatigue, DevOps notification conventions |

## Summary

Feedback, done shallowly, is just "wire up a Webhook and send a message"; done deeply, it's a system that needs to be designed with care — which channel to choose, what content to send, when to send it, whom to send it to, how to guarantee delivery. It sits between Monitor and Plan, and it's the key link that takes the DevOps loop from "seeing the problem" to "solving the problem".

Next time we start with the oldest channel of all — **email notifications**. We'll talk about how the SMTP protocol works, how to design an effective notification email, and how to integrate email notifications into a Jenkins Pipeline.

A small step forward every day is a new height!
