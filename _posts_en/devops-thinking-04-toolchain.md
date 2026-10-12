---
title: 'DevOps Methodology Musings (Part 4): Toolchain Thinking — What Should Be in Your Arsenal'
date: 2025-12-14
author: Tang Moying
categories: [devops]
tags: [DevOps, Toolchain, Jenkins, CI/CD, Requirements Management, Monitoring]
lang: en
alt_url: /post/devops-thinking-04-toolchain
---

If the earlier articles were about "the way", this one starts on "the craft". Not, though, teaching you how to configure Jenkins or how to write a Dockerfile — there are already far too many tutorials for that online. What this article wants to discuss is: for every link in the DevOps loop, what perspective should you use to look at and choose tools, and what problem is each link really trying to solve.

<!--以上为摘要内容-->

## 1. A Toolchain ≠ a List of Tools

Many people understand the DevOps toolchain as a shopping list of tools: Jenkins for CI, Jira for requirements, GitLab for code, SonarQube for quality, Docker for deployment, Prometheus for monitoring. Once the tools are all assembled, it feels like everything is in place.

But the key to a toolchain is not "which tools there are" but **"how the tools are connected to one another"**.

Take an example: code is committed — can it automatically trigger a build? The build finishes — can it automatically trigger testing? The tests pass — can it automatically trigger deployment? After deployment, can the monitoring system automatically link back to the version number of this release?

These questions test not whether you can use some tool, but whether you have the ability to **string them together**. If the tools are disconnected and every step needs manual intervention, then no matter how good the tools are, they won't combine into the effect of DevOps.

So in this article we'll go through the loop's eight links one by one and discuss the core problem each one needs to solve, along with the key points to watch when choosing tools. We won't list specific configuration files, but we will make the "why" clear.

## 2. Requirements Management: Everything Starts with "Stating It Clearly"

Requirements management is the starting point of the whole loop, and also the link most easily overlooked by DevOps engineers.

Many people feel requirements have nothing to do with them — "the product manager writes the requirements document and I just follow it." But think about it carefully: a vague requirement leads to code being changed back and forth, test cases that don't line up, and rework after launch. In the end it's the DevOps process that bears all these costs.

When choosing requirements management tools, you don't look at whether the interface is pretty but at whether it can support a few key capabilities:

- **Requirement breakdown and traceability**: Can one Epic be broken into multiple Stories? Can a Story be linked to a code branch and test cases?
- **Status transitions**: Can the lifecycle state of a requirement be wired into the CI/CD process? For example, once a requirement is "development complete", can it automatically trigger testing?
- **Integration with the code hosting platform**: Can a requirement ID be written into the commit message, and can it automatically link to the code change?

Mainstream tools such as Jira, ZenTao (禅道), Trello and Feishu Bitable (飞书多维表格) each have their strengths. Which one you use doesn't matter; what matters is **whether your requirement items can be connected through to the technical links that follow**. If the requirements system and the code system are two separate worlds, then traceability is empty talk.

## 3. Code Management: More Than Just Storing Code

Code management is the ground every DevOps engineer must fight for — no matter what you ultimately own, the conventions of code management are the foundation on which you drive all automation.

The problems this link needs to solve:

- **Version control**: Git or SVN? Whichever you use, you must make sure every change can be traced.
- **Branching strategy**: main branch protection, naming conventions for feature branches, merge strategy (merge or rebase). The branching strategy directly determines how the CI trigger rules are written.
- **Code review**: Who has permission to merge? What are the review standards? Can the MR/PR approval process be automated?

At the tool level, there's little difference between platforms like GitHub, GitLab and Gitee; the key is to **actually use them**.

One more thing to add: code management conventions are not "a matter for R&D, nothing to do with DevOps". On the contrary, the DevOps engineer is the most eager champion of code conventions. Because your pipeline is triggered by code commits — if commits aren't standardised, the pipeline is just running blind.

A classic scenario: the commit message says "fix bug" — can you tell from that what was changed? Can you decide whether to trigger a full regression test? **Commit message conventions (such as Conventional Commits) are, in essence, written for the automation to read.**

## 4. Build: the Critical Gate from Code to Artifact

The build link is the core of the CI pipeline. Its input is source code, and its output is a runnable artifact (Jar, War, Docker Image).

The choice of build tool is usually determined by the technology stack: the Java ecosystem uses Maven or Gradle, Node.js uses npm/yarn/pnpm, and Go just compiles directly. The CI engine (Jenkins is the classic one) is responsible for running these build tasks automatically.

In the build link, a DevOps engineer's focus should not just be "does it run through" but:

- **Dependency management**: Are dependencies declared completely? Are there implicit dependencies ("I have a Jar locally that you don't have")? A healthy build should be: pull the code → run the build command → get an artifact, with no extra environment setup required.
- **Build speed**: Build time directly determines feedback speed. Maven's parallel compilation, incremental builds and caching mechanisms are all worth spending time to optimise.
- **Artifact management**: Where do the build products go? Nexus, Artifactory, Harbor — the artifact repository is the bridge between CI and CD.

## 5. Testing: a Quality Line of Defence, Not a Formality

Testing occupies a very special position in the DevOps loop: it is **the only checkpoint between the build and the deployment**. If that checkpoint is nominal, then DevOps is sprinting full speed while carrying bugs.

The core issue of this link is not the tools themselves (everyone can use JUnit, TestNG, Selenium and the like) but the **testing strategy**:

- **Layered testing**: unit tests, integration tests, end-to-end tests — what does each layer cover, and how is the ratio allocated?
- **Coverage**: Should code coverage have a threshold? Block the build below 80%? How do you avoid the formalism of "coverage for coverage's sake"?
- **Test environments**: How are the environments for integration testing managed? Who's responsible for maintaining them? How do you solve the "it passes locally but fails on CI" problem caused by inconsistent environments?

One more point that's easily overlooked: **testing is not a one-person job for a developer.** DevOps engineers should take part in defining the testing strategy. Because your pipeline runs the tests, you need to know when the tests count as passed and when delivery should be blocked.

## 6. Deployment: Making "Going Live" an Ordinary Affair

Deployment is the last mile in the loop from "development complete" to "usable by users". The DevOps philosophy is: **deployment should be low-risk, high-frequency and automated.**

At the tool level, containerisation (Docker) and container orchestration (Kubernetes) are the current mainstream, but traditional virtual machine or bare-metal deployment still exists in large quantities. Whichever form it takes, the core concerns are the same:

- **Environment consistency**: development, testing, pre-release and production — keep the four environments as consistent as possible. "It runs on my machine" should not be an excuse.
- **Deployment strategy**: full deployment, rolling update, blue-green deployment, canary release — you don't have to use them all, but you should know the scenario each strategy suits.
- **Rollback capability**: It's not deployment going wrong that's frightening; it's not knowing how to get back. Rollback must be fast and automated — not "wait for old Wang to come and sort it out".

## 7. Monitoring and Feedback: Making the Loop Actually Turn

Monitoring is the closing link of the loop: it feeds the real running state of the production environment back in, driving the next round of requirements and optimisation.

Divided by what's being monitored:

- **Infrastructure monitoring**: CPU, memory, disk, network — the Prometheus + Grafana combination is basically good enough.
- **Application monitoring**: API response time, error rate, throughput — APM tools such as SkyWalking and Pinpoint, or log aggregation such as ELK.
- **Business monitoring**: order volume, payment success rate, registration conversion rate — these usually require R&D to instrument the code themselves.

The choice of monitoring tool is not the most important thing; what matters is the **alerting strategy**:

- Which metric anomalies should trigger an alert? What thresholds do you set?
- Who does the alert go to? Which severity of alert goes through which channel?
- How do you follow up after an alert? Is there a SOP?

Many teams' monitoring systems are "alerts flying everywhere, but nobody watching". Alerts get muted and suppressed, and the problems that really need attention end up drowned in the noise. This is the classic case of "tools without conventions".

## 8. Closing the Feedback Loop: the Soul of the Toolchain

Finally, I want to stress a link that's easily overlooked: **the feedback chain**.

When monitoring finds performance degradation, can it automatically link back to which version introduced it? Once linked to the version, can you find the corresponding code change? Once you've found the code change, can a bug ticket be created automatically?

If this chain is entirely manual, a single incident eats half a day. If it's semi-automated or even fully automated, you can locate the root cause in a few minutes.

Implementing this chain doesn't require very advanced tools — Jira's webhooks, Jenkins plugins, Git tags and commit messages: stringing these together is enough. In the end it's still about mindset: **do you look at your tools as a chain, rather than a pile of loose parts.**

## 9. Summary

A toolchain is not a pile of tools but **a loop as its skeleton, with the tools of each link strung together into one complete delivery chain**.

A DevOps engineer's value lies not in how many tools they've mastered, but in their ability to see where a tool sits in the whole process and then put it in the right place, connecting it with what comes before and after.

Next time we'll take up a more personal topic: **what does a DevOps engineer actually need to know?** No vague talk — a concrete competency model and growth path.

A small step forward every day is a new height!
