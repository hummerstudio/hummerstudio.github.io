---
title: Jenkins——the thing which auto everything
date: 2019-08-06
author: Tang Moying
categories: [devops]
tags: [Jenkins]
lang: en
alt_url: /post/jenkins-the-thing-which-auto-everything
---

## Jenkins, with nothing of its own, capable of everything

Jenkins is, in essence, an automation server.

Create a job on Jenkins and configure it, and that job will run automatically in whatever way you want. Archimedes once said: “Give me a fulcrum, and I will move the whole earth.” Wozkishuode also said: “Give me a Jenkins, and I can automate everything.”

<!--以上为摘要内容-->

I have summed up four defining characteristics for it:

### 1. Anything you wish for — a comprehensive set of triggers

A job created on Jenkins can be triggered manually; it can also be triggered on a schedule; it can also poll the code repository on a schedule and trigger only when the code has been updated; or you can generate a link and trigger the job simply by sending a request to that link.

You could call that a whole array of options, very complete and very considerate.

### 2. Connecting everything — exceptional extensibility

Jenkins itself can only be counted as an automation server. But its architecture is excellent: it provides a great many extension points of its own, and plugins can add new functions and new features through them. Its powerful capabilities are almost all implemented by plugins. Plugins can even add new extension points by extending extension points, and those can then be used by other plugins. (It is precisely through these plugins that Jenkins has integrated every kind of version control system, every kind of source build tool, every kind of static analysis tool, every kind of testing tool, every kind of cloud platform, every kind of…, and thereby become the de facto standard for continuous integration / continuous delivery / DevOps practice today.)

You could say it is endlessly growing, inexhaustible.

### 3. Building and sharing together — active open-source community support

Jenkins is an open-source project, and its source code can be obtained conveniently. The open-source mechanism means the Jenkins tool itself will never become a black box; everything is transparent. Anyone can contribute code to it to fix problems and add new features, and other people can directly enjoy the benefits those lines of code bring. Issue tracking and progress can also be looked up publicly online. The many plugins in the Jenkins plugin center are all open source too.

As the saying goes, open source has power: build together and share together.

### 4. An efficiency revolution — the new Pipeline-as-Code feature

The new generation of Jenkins introduced a new Pipeline job type. It changes many clicks and repeated graphical configuration operations into executing script code, greatly improving the efficiency of job configuration. It also raises the work in Jenkins from the level of operating an application to the level of code development.

As the saying goes, code changes the world.

---

### Afterword

At present, Pipeline-type jobs have already become the mainstream, and converting classic job types into Pipeline type is an unstoppable trend. But even in the “old era” before the Pipeline type existed, Jenkins — because of the many plugins it integrates and because, as a continuous integration / continuous delivery tool, it runs through every stage of the software development lifecycle — had the character of holding a great number of knowledge points that are fragmented and scattered. In the “new era” of using Pipelines, putting things into code makes the expression of configuration more concentrated and unified and has solved some old problems, but it still follows the rule that “the greater the capability, the higher the demands”: it still has the character of being “easy to get started, hard to master”.

Let us learn together and keep accumulating.

Let me share a motto of mine: one small step forward every day is a new height!

>This article was first published on my WeChat official account “Programming with the Left Hand, Culture with the Right” (左手编程右手文化), account ID: devopscd. You are welcome to follow.
