---
title: 'DevOps Methodology Musings (Part 2): The DevOps Loop — End-to-End Software Delivery'
date: 2025-12-07
author: Tang Moying
categories: [devops]
tags: [DevOps, Feedback Loop, Software Life Cycle, CI/CD, Continuous Delivery]
lang: en
alt_url: /post/devops-thinking-02-loop
---

In the previous article we talked about the cultural foundations of DevOps. Today let's look at one of the most central concepts: the DevOps loop. If you ask me "what is DevOps actually doing?", I'd say that in essence it manages the entire software delivery process around a single closed loop. Once you understand the loop, you understand the skeleton of DevOps.

<!--以上为摘要内容-->

## 1. What Is the DevOps Loop?

Many people's impression of DevOps stops at "CI/CD" — you commit your code, it builds automatically, it deploys automatically, done. That process isn't wrong, but it's only one part of the loop.

**The DevOps loop is a closed, end-to-end loop covering the whole software delivery process.** It spans every link from the birth of a requirement to a running service and on to user feedback, and then starts a new cycle based on that feedback. You can picture it as a ring, where each link passes value on to the next:

```
Requirements → code → build → test → deploy → monitor → feedback
  ↑                                    ↓
  └─────────────────────────────────────┘
```

This loop has a few key implications:

**First, no link is isolated.** The people writing code need to know what environment their code will run in, and the operations people need to know why this service was written in the first place. Only when everyone shares the same view of the process can they collaborate effectively.

**Second, feedback must flow in both directions.** Problems on the right-hand side have to travel quickly to the left-hand side. An anomaly spotted by monitoring must be traceable back to which release introduced it and which piece of code caused it. Not "ops finds the problem and goes to the developers, the developers say they don't know, and ops says then never mind".

**Third, the quality of each link affects the next one.** If the requirements are unclear, the code will be wrong; if the code isn't reviewed, testing has to fill the holes; if the tests don't cover it, it blows up after deployment. You can't cut corners early on and expect the people downstream to cover for you.

## 2. A Walk Through Each Link

Let's go through the loop link by link and see what actually happens. You don't need to go deep on every one, but you do need to know what each link is doing and why it matters.

### 2.1 Requirements Management

The starting point of DevOps isn't code — it's **requirements**.

You might say: "Aren't requirements the product manager's job?" On the surface, yes — but the shape of a requirement directly affects how smoothly the whole downstream process runs. A vague, unverifiable requirement becomes, in the developers' hands, a source of repeated clarification and repeated rework. And in testing it becomes "I don't know how to test this either".

So in a DevOps context, requirements management has a few key demands:
- **Decomposable**: a large requirement must be splittable into small ones, and small ones into development tasks. Only then can it match the agile habit of "small commits, independent commits".
- **Verifiable**: state clearly "what counts as done". Acceptance criteria must be explicit, and ideally verifiable automatically.
- **Traceable**: every line of code and every test case should ultimately trace back to some requirement.

In practice, many teams use Jira, ZenTao (禅道) or a home-grown requirements management platform to break requirements into user stories linked to code branches and test cases. That is itself part of the DevOps loop.

### 2.2 Code Management

Once requirements have turned into development tasks, code management takes the stage.

The core of code management isn't "storing the code" — it's **standardizing how multiple people collaborate**. Branching strategy, code review, merge conventions — these look like "developer stuff", but they directly determine how the CI pipeline gets triggered, how builds are managed, and how versions are tagged.

Common code management tools are Git (paired with GitHub or GitLab) and SVN. Whatever tool you use, a few basic requirements are the same:
- **Branching conventions**: how are the main branch, the development branch and feature branches managed? Git Flow, GitHub Flow, or trunk-based?
- **Commit conventions**: how should commit messages be written? Can someone reconstruct what changed this time from the commit message?
- **Review mechanism**: who looks at the code? What are the review standards?

If code management is done badly, the build, test and deployment that follow are all castles in the air.

### 2.3 Build

Build is the process of turning code into a runnable artifact.

This sounds like purely technical work, but its place in the loop is special: it is the **first automated gate** after code is committed. The code is committed, and the pipeline automatically triggers a build. If the build passes, that means at least that the code compiles, the dependencies can be fetched, and the packaging succeeds. If the build fails, something in the earlier code management link went wrong — maybe the commit didn't follow convention, maybe a dependency wasn't declared.

The core concerns of the build link:
- **Automation**: it must be triggered automatically by a commit, not by someone clicking a button.
- **Reproducibility**: the same code should produce a consistent artifact no matter when it is built.
- **Speed**: build time has to stay within a reasonable range, or the feedback lags.

On the tooling side, Maven and Gradle are the mainstream build tools in the Java ecosystem, scheduled by Jenkins or a similar CI engine.

### 2.4 Testing

A passing build is only the first step — **testing is the real line of defense for quality.**

Testing within the DevOps loop emphasizes **layering and automation**. You can't expect manual testing to keep up with the pace of frequent delivery. Every commit should run tests automatically, and the verification should happen at several different levels:

- **Unit tests**: verify that the code logic is correct. Written by the developers themselves, and code coverage needs to go up.
- **Integration tests**: verify that the interaction between modules is fine. The interfaces, databases and middleware have to be spun up and actually exercised.
- **End-to-end tests**: verify that a complete business flow can run through from start to finish.

If the tests don't pass, the pipeline should stop it. That's a hard rule. If that rule can be bypassed at will, testing has lost its meaning.

### 2.5 Deployment

Once the tests pass, the artifact can be deployed.

In the DevOps loop, deployment isn't "the ops team's job" — it's **the last link in automating the whole process**. A good deployment should be:
- **Automated**: one-click release, or even automatic release.
- **Rollback-capable**: when something goes wrong, you can quickly revert to the previous version.
- **Canary/staged**: instead of cutting everything over at once, roll it out gradually to lower the risk.

Container technology (Docker) and container orchestration (Kubernetes) have greatly improved the standardization and automation of deployment, but in essence they are only means. Without containerization — on virtual machines or even physical machines — as long as the process is disciplined and the automation is in place, DevOps still works.

### 2.6 Monitoring and Feedback

Going live is not the end point. **Monitoring and feedback are what close the DevOps loop.**

How is the service you deployed actually running? Has the response time gotten longer? Has the error rate gone up? If this information isn't collected and fed back, the DevOps loop is broken.

Monitoring covers several layers:
- **Infrastructure monitoring**: CPU, memory, disk, network.
- **Application monitoring**: QPS, response time, error rate, business metrics.
- **Alerting**: when something goes wrong, the right person has to be notified, and accurately — too many alerts is the same as no alerts.

But monitoring alone isn't enough; the key is that **the feedback forms a closed loop**. A performance regression spotted by monitoring has to be linkable to a specific release record and code change. Only then can developers locate and fix it quickly, instead of ops and developers passing the buck back and forth.

## 3. The Key to Loop Thinking: a Systems Perspective

Having walked the whole loop, you should be able to see one important fact: **no link is independent, and no role is independent either.**

If the people writing code don't understand the characteristics of the deployment environment, writing code that "works on my machine" becomes the norm. If the ops people don't understand the business logic, then whenever an alert fires all they can do is restart the service, and they'll never fix the root cause. If the testers don't understand the background of the requirement, the cases they write are just "good enough to pass".

So the real value of the DevOps loop isn't making you an expert in every link; it's letting you **build a systems perspective** — you can read the whole process, you know which link you're in, what upstream hands you, and what you produce and hand downstream. That kind of global view is the essential difference between DevOps and the traditional "everyone minds their own patch" model.

## 4. How the Loop Relates to Software Engineering

At this point, I wonder whether you've noticed something: most of the links in this loop — requirements, code, testing, deployment, monitoring — correspond exactly to the core knowledge areas of **software engineering**.

Requirements management is "requirements engineering" in software engineering. Code management is "configuration management". Testing is "software quality assurance". Deployment and monitoring are "software operations and evolution".

In other words, the DevOps loop is essentially taking the theory of software engineering and landing it in the day-to-day development process through automation.

This observation matters because it raises a question: **people from different professional backgrounds start from different places and see DevOps from different angles.** In the next article we'll talk about exactly that — what advantages and weaknesses people from software engineering, computer science and operations backgrounds each bring to DevOps.

A small step forward every day is a new height!
