---
title: Jenkins FAQ Collection (Part 7)
date: 2019-08-14
author: Tang Moying
categories: [devops]
tags: [Jenkins, Pipeline]
lang: en
alt_url: /post/jenkins-faq-seven
---

## Question 31: I have multiple nodes with the same environment, and I want jobs to be automatically assigned to a free node. Is that possible?

Reference: You only need to configure the same label on nodes with the same environment, and have the job specify that label as its running node. Jenkins will then automatically select a free node to run the job.
Labels in Jenkins mean classification and grouping, just like the label feature in the WeChat contacts. However, it is not designed very obviously; if you don't know about it, it is easy to mistake it for a unique id.

## Question 32: How does Jenkins integrate with various static analysis tools?

<!--以上为摘要内容-->

Reference: This is a rather big question, and I will write a dedicated article about it later.

## Question 33: Besides turning GUI clicks into written code, what other advantages does Jenkins Pipeline have, and how can I understand it more deeply?

Reference: Turning mouse clicks into written code is one aspect of it; it looks like just replacing the parameter-filling of the previous GUI with your own code that makes the calls.
This is one aspect, and because these features become code whose keywords are simple and easy to understand, you can write just a few lines of code to achieve the same functionality.
There is another point: running a single job on multiple nodes. Everyone is probably already using this and taking it for granted, not even thinking of it as a feature unique to Pipeline!
There are also two very important points that people often overlook.
One is that you can write your own shared libraries to reuse code — that is, a long piece of logic can be encapsulated into a shared library, and calling it becomes a single simple command again;
the other is that Pipeline supports many native steps, and these steps are cross-platform and can be implemented directly in Pipeline,
such as unzipping, reading and storing text files and json files, determining whether a node is a Unix environment, sending HTTP requests, and so on. All of these can be invoked with pure Pipeline scripts,
native, cross-platform, native, cross-platform, native, cross-platform — important things should be said three times!
In the past, you might have had to write one Windows bat batch file and one Linux sh script to implement this yourself!

## Question 34: How is the Jenkinsfile best managed?

Reference: A fairly standard approach is to store it with the source code, in the root directory of the source repository, just as pom.xml is placed in the root directory of the source repository.
Sometimes, depending on the actual production situation, it can also be managed in a separate repository — a single repository or multiple repositories both work. If you have no special requirements, storing it with the source code is recommended.

## Question 20: When upgrading Jenkins, how do I choose a version?

Reference: Jenkins has two release lines: a long-term support version and a weekly iteration version. The long-term support version is updated every 12 weeks (close to 3 months, a quarter); the weekly iteration version, as its name suggests, is updated once a week. For production environments (enterprises, organizations, etc.), I recommend using the long-term support version; for personal use or learning, you can chase the newest and use the weekly iteration version to learn about the latest bug fixes and feature updates. The long-term support version is updated roughly once a quarter, so you can decide whether to upgrade your production environment as needed.

>This article is also published on the WeChat official account “DevOps持续交付” (DevOps Continuous Delivery), account ID: devopscd. You are welcome to follow it.
