---
title: Jenkins FAQ Collection (Part 1)
date: 2019-08-01
author: Tang Moying
categories: [devops]
tags: [Jenkins, Pipeline, Docker]
lang: en
alt_url: /post/jenkins-faq-one
---

## Question 1: How Do Jenkins and Docker Fit Together?

Reference answer: combining Jenkins and Docker lets you use containers as Jenkins slave nodes, which has many advantages. For example, a unified execution environment, automatic creation and destruction of slaves, and no more cost of manually maintaining environments.

## Question 2: When Writing a Pipeline with Two Stages, the First Runs on a Randomly Specified Machine and the Second Needs to Be on the Same Machine as the First — Is There a Way to Do That?

<!--以上为摘要内容-->

Reference answer: set a global `agent`, and simply don't specify an agent separately for each stage.

## Question 3: How Do I Handle a Project That Compiles Part of Itself on Windows and Part on Linux, and Then Needs the Windows Artifacts Merged on Linux?

Reference answer: you could consider fixing the build machine, or putting all the artifacts on one fixed storage machine and then bringing them back.

## Question 4: What Advantages Does Pipeline Have Over Jenkins' Traditional Job Types?

Reference answer: for one thing, a single Pipeline job can span multiple nodes; for another, the code can be reused, which is more efficient than clicking through a graphical interface. Once the configuration has become code, it can be version-controlled, which makes it easier to manage.

## Question 5: When Starting a Pipeline, I Hope to Check Out Only the Jenkinsfile.
Reference answer: if you have this special requirement, it is advisable to manage the `Jenkinsfile` in a separate git repository rather than putting it together with the application source code.

>This article was first published on my WeChat official account "左手编程右手文化" (Left Hand Programs, Right Hand Culture), account ID: devopscd. Welcome to follow.
