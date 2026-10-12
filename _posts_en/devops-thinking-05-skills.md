---
title: 'DevOps Methodology Musings (Part 5): What a DevOps Engineer Needs to Know — An Unconventional Competency Model'
date: 2025-12-20
author: Tang Moying
categories: [devops]
tags: [DevOps, Competency Model, Career Development, Skill Tree, Engineer Growth]
lang: en
alt_url: /post/devops-thinking-05-skills
---

There's no shortage of discussion out there about the skills a DevOps engineer needs, but go and read those articles and most of them just list the tools you ought to learn: Jenkins, Docker, K8s, Ansible, Terraform... and then tell you "once you've learned all this, you're doing DevOps". That statement isn't wrong exactly, but it's far too narrow a frame. Tools go out of date; thinking doesn't. This article wants to approach it from a more fundamental angle: what capabilities should a DevOps engineer actually have?

<!--以上为摘要内容-->

## 1. Tools Go Out of Date; Methodology Doesn't

Take an example: five years ago the hottest CI tool was probably Jenkins with a pile of plugins, three years ago it became GitLab CI's YAML configuration, and now people are talking about GitHub Actions and Argo Workflows. Can you keep up with all of it? Every time you change company, the tool stack may be completely different.

But no matter how the tools change, some things don't:
- After code is committed, it has to build automatically
- After the build, it has to test automatically
- After the tests pass, it has to deploy automatically
- After deployment there's monitoring, and when something goes wrong there's a rollback

You don't change these flows just because you changed tools. So for a genuinely mature DevOps engineer, the core capability isn't "mastery of Jenkins" but **understanding what problem each stage of the delivery flow is meant to solve, and how to support it with tools**.

Below, based on my own understanding, I've divided a DevOps engineer's capabilities into four layers. This is not some "officially certified" competency model — take it as a reference only.

## 2. Layer One: Tool Proficiency — Your Ticket into the Field

This is the most basic layer, and it's the part every interview tests. You need to be comfortable using the mainstream DevOps tools:

- **Code management**: Git (branching, merging, rebasing, cherry-pick), plus GitHub/GitLab platform operations.
- **CI/CD**: master at least one CI engine (Jenkins is the most universal choice), and be able to write Pipeline scripts.
- **Build tools**: understand at least one (Maven/Gradle/npm), including dependency management and the plugin mechanism.
- **Containerisation**: Docker image builds, networking, storage, multi-stage builds.
- **Deployment and orchestration**: K8s basics (Pod, Service, Deployment, ConfigMap), and the ability to write basic YAML.
- **Scripting languages**: Shell is mandatory, plus at least one of Python or Groovy.

The things in this layer are the baseline for being able to do the job. But if you stop at this layer, you're a "tool user" — tell you to use Jenkins today and you use Jenkins; swap it for Argo tomorrow and you're lost.

## 3. Layer Two: Process Design — from "Using" to "Designing"

This is the key step from being someone who executes to someone who designs.

Process design capability means this: **given a team's business shape and technology stack, you can design a delivery process that suits them.**

You need to be able to answer questions like these:
- What branching strategy should this team use? Trunk-based or Git Flow?
- How many CI pipelines should there be? Which scenario triggers which pipeline?
- What are the deployment strategies for different environments? The development environment can deploy automatically — should production require manual approval?
- How should the test strategy be layered? Which tests run in CI, which run before CD?
- Where do you put the code review gate? How do you configure the MR approval flow?

There are no standard answers to these questions; it depends on the team's size, the risk level of the business and the release cadence. Being able to produce a sound process design for a specific situation is a far more advanced skill than mastering some tool.

A practical suggestion: **don't start out by designing a "perfect process".** Start from the smallest working process (commit code → build → test → manual deployment), then add gates and automation step by step based on the team's feedback. Processes evolve; they aren't designed.

## 4. Layer Three: Engineering Literacy — a T-Shaped Knowledge Structure

By this layer, you need to be able to hold an effective conversation with the relevant people at every stage of the loop.

Note that this means "able to hold a conversation", not "more expert than they are". For example:
- Talking with developers: you can understand their branching strategy and code review flow, and offer suggestions on the CI side.
- Talking with testers: you can understand test layering and coverage strategy, and wire the test flow into the pipeline.
- Talking with operations: you can understand network topology, load balancing and failover, and work with them to define deployment and rollback plans.

That ability comes from **a deep understanding of every stage of the loop**. You don't have to be an expert in each stage, but at minimum you need to know each stage's core problem and its basic solution. That's what's called a T-shaped person — depth in the vertical domain of CI/CD, and enough breadth across everything upstream and downstream.

How do you build it? **Talk to people in different roles more, and watch how they work more.** Watch developers commit code once, watch testers write cases once, watch operations deploy once. Watch enough and you'll be able to string the whole loop together in your head.

## 5. Layer Four: Soft Skills — the Ability to Drive Change

This is the hardest layer, and the watershed that separates a good engineer from an excellent one.

DevOps is essentially organisational change. You have to push the team to change how it works: what used to be released by hand now has to be automated; what used to have no tests now has to have them; what used to be mutual finger-pointing when something broke now has to look forward. Every one of these changes will meet resistance.

The abilities you need include:

- **Communication and persuasion**: you can't say "we have to do it this way"; you have to say "here's what this way buys us". Let the data do the talking — how much release efficiency improved after automation, how much recovery time was cut.
- **Incremental progress**: don't try to change everything at once. Start with the stage that hurts least, produce a result, win trust with facts, then push the next step.
- **Empathy**: understand what's hard for each role. Developers don't want to write tests not because they're lazy, but possibly because the schedule is tight or because they don't know how to. Operations doesn't want to automate possibly because it's afraid of losing control. Only when you find the real reason can you remove the real obstacle.

The abilities in this layer are hard to learn from books; they're ground out through one round after another of hitting a wall and then finding a way.

## 6. Practical Advice on Which Tools to Learn

I've been saying all along that thinking matters more than tools, but when it comes down to an actual learning path you still need something to grab hold of. My advice:

**Pick one mainstream technology stack and learn it deeply and thoroughly.**

- CI/CD: **Jenkins** — it's the most classic and most universal, and has the highest share in enterprises. Once you understand Jenkins's Pipeline as Code idea, switching to another CI tool is just a matter of different syntax.
- Containers: **Docker + Kubernetes** — the current de facto standard, and it won't change in the short term.
- Build: depends on the stack you work with — for Java learn Maven/Gradle, for front-end learn npm/webpack.
- Scripting: **Shell + Python**.

No need to be greedy; mastering one set is far more useful than dabbling in ten.

## 7. Summary

To recap the four-layer competency model:

1. **Tool proficiency** — can do the work.
2. **Process design** — can design.
3. **Engineering literacy** — can connect the whole thing through.
4. **Soft skills** — can drive change.

Many people's growth path looks like this: focus on layer one when you enter the field, start working at layer two after two or three years on the job, and gradually move into layers three and four after five years. You can't skip levels — you can't start designing processes before you can even configure Jenkins, and you can't go pushing organisational change if you can't even design a process well.

But if your goal is just to be satisfied with "using Jenkins, Docker and K8s fluently", then yes, you'll still find a job — you just won't go very far. The most valuable part of DevOps is always one layer above the tools.

Next time is the final article in this series, and we'll take an interesting angle: **what's the essential difference between a developer with taste doing DevOps and an ordinary operations person doing DevOps.**

A small step forward every day is a new height!
