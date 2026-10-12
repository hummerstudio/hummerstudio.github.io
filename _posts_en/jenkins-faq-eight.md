---
title: Jenkins FAQ Collection (Part 8)
date: 2020-05-20
author: Tang Moying
categories: [devops]
tags: [Jenkins, Pipeline]
lang: en
alt_url: /post/jenkins-faq-eight
---

## Question 36: What Is the Relationship Between Hudson and Jenkins?

Reference answer: both are open-source continuous integration tools written in Java.

In fact, Jenkins is a fork of Hudson.

<!--以上为摘要内容-->

Hudson was started by Sun in 2004, and the first version was released on java.net in 2005.

Starting in 2007, Hudson gradually took over the position held by CruiseControl and other open-source build tools.

At the 2008 JavaOne conference it won a Duke's Choice Award in the developer solutions category.

In November 2010, Oracle's acquisition of Sun brought up the question of Hudson's ownership.

Between the main project contributors and Oracle, although many agreements were reached, one key issue remained: the trademark name "Hudson".

Oracle asserted in December 2010 that it owned the name and the right to apply for the trademark.

Therefore, on January 11, 2011, a vote was called to change the project name from "Hudson" to "Jenkins".

On January 29, 2011, the proposal was approved by a community vote, and the Jenkins project was created.

On February 1, 2011, Oracle said that it intended to continue developing Hudson, and considered Jenkins merely a branch rather than a rename.

As a result, Jenkins and Hudson continued as two separate projects, each regarding the other as its own branch.

By December 2013, Jenkins on GitHub had 567 project members and around 1,100 public repositories, while Hudson had 32 project members and 17 public repositories.

By now the two have diverged even more; it's fair to say Jenkins has comprehensively surpassed Hudson.

Also, perhaps out of a dislike of Oracle, as a Java developer you naturally ought to support and use Jenkins.

From the two projects' logos you can also see the family relationship between them — they're both old men. Later Hudson was donated by Oracle to the Eclipse Foundation, so the Hudson old man has an Eclipse halo.

Hudson has stopped development and hasn't released a new version for years (the latest version was released in 2016), while Jenkins's community and development are unusually active, and Jenkins 2.x has extended it into the CD domain.

Jenkins1 is already the most widely used CI/CD tool on the market.


## Question 37: What Are the Similarities and Differences Between Jenkins Plugins and Shared Libraries? When Should You Use a Plugin, and When a Shared Library?

Reference answer: a shared library is a feature only Pipeline-type jobs can use.

Plugins focus on extending the functionality of the Jenkins system itself, and their scope is broader. For example, defining new job types (Pipeline itself is implemented as a plugin), new parameter types, new trigger types, new SCM types, new notification types, new authorization strategies, new cloud types, and so on.

A plugin can also define new build steps, configured through a graphical interface in freestyle jobs, and can be optimised for compatibility with Pipline jobs and invoked through the DSL.

Pipeline also has a dedicated API, used to define new DSL steps (callable only through code).

Plugins are written in Java, shared libraries are written in Groovy, and a shared library can in turn call the DSL steps that plugins provide.

To use a plugin, you have to install the plugin package on the Jenkins master for it to take effect; if you're upgrading it, you also have to restart the master.

A shared library, by contrast, only needs its address configured in the Jenkins system to be usable, and you can specify different branches to use. Changes to the shared library code take effect in real time.

In terms of best practice, plugins provide generic steps at the tool level (building blocks), and shared libraries implement functional steps (assembling the blocks), combining steps and sharing them across multiple Jenkins jobs. It's similar to the relationship between an API and an APP.


## Question 38: Can Jenkins Do Everything?

Reference answer: be clear that Jenkins is an automation server. It can automate your operations, and automation mainly consists of three parts. The first is trigger automation — you can set up certain rules to trigger Jenkins jobs automatically, such as triggering on a schedule, or when a change is committed to the repository, or when the content of the repository changes, and so on. The second is execution automation; the third is notification automation. The second part is defined by users themselves, and where Jenkins is convenient is that it supports calling automation scripts in all kinds of ways — ant, maven, sh, bat, powershell, python, groovy and so on — while the automation scripts themselves are something users have to write.
Only once an operation has first been reworked so that it can be achieved through an automation script can it be hooked up to Jenkins and executed automatically. So a Jenkins engineer should be thoroughly familiar with automation principles and with the various automation scripting languages and automation tools, and should provide advice and guidance for the team's operations automation work.

## Question 39: What Is the Relationship Between slave, node and agent — Are They Different?

Reference answer: conceptually they're basically the same. agent can be seen as the new name for slave (because slave carries the meaning of "enslaved person"...). In usage, as a Pipeline keyword there's a slight difference.
In scripted pipelines you use node to specify the execution node; in declarative pipelines you use the agent keyword, and under the agent keyword there are further keywords such as node, docker and kubernetes.

## Question 40: How Does Jenkins Connect to Tools Such as Ant and Maven?

Reference answer: build tools of this kind have two ways of being used in Jenkins.

One is to pre-configure them in Jenkins's global tool configuration, setting a tool name and path, then specifying the name when you use it.
The advantage of this approach is that Jenkins can automatically install the build tool on the `agent` machine and add the executable to the `PATH` directory.
The inconvenience is that it requires pre-configuration, you have to specify the name explicitly when using it, and automatic installation requires the machine to be able to access the external network.

The other approach is to install the corresponding tool on the `agent` machine in advance, and configure its executable into the system `PATH` directory.
The advantage of this approach is that you can use the `ant` and `mvn` commands directly. The downside is that it requires pre-installation — but it can also avoid the problem of jobs failing because the machine can't access the external network.
Pre-installation also makes the `agent`'s environment more controllable. In practice `agent`s always need some tools installed, and that installation is automated. Adding one more tool doesn't make much difference to the workload.

If your Jenkins environment is on the external network, and Ant and Maven both use the default configuration (repository address and so on), you can use the first approach. In other cases the second is recommended.

>This article was first published on the WeChat public account "DevOps持续交付" (DevOps Continuous Delivery), account ID: devopscd. Welcome to follow.
