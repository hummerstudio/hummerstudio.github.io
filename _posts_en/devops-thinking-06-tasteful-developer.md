---
title: 'DevOps Methodology Musings (Part 6): The Tasteful Developer Does DevOps — Not Just "Can It Run" but "Does It Look Good"'
date: 2025-12-21
author: Tang Moying
categories: [devops]
tags: [DevOps, Code Quality, Architectural Thinking, Product Thinking, Engineering Taste]
lang: en
alt_url: /post/devops-thinking-06-tasteful-developer
---

We've reached the last article in the series, and I want to raise a slightly personal topic: **what's the essential difference between a tasteful developer doing DevOps and traditional ops doing DevOps?**

Of course there's no belittling ops here. There are plenty of masters who came up through ops, and their depth of understanding of stability and incident handling is something many from a development background can't match. But one fact I've observed is this: someone with solid development literacy who moves into DevOps brings along some "good developer habits", and those habits happen to be exactly the parts of DevOps practice that are easily overlooked yet crucial.

<!--以上为摘要内容-->

## 1. "As Long As It Runs" vs "Writing It Beautifully"

If there's one habit most common among DevOps engineers from an ops background, it's **"as long as it runs, it's fine"**.

The script is written, the feature is implemented, the service is up — OK. What the code looks like doesn't matter, whether the naming follows conventions is irrelevant, comments depend on the mood, duplicated code gets copied and pasted without a care. It's not like anyone's going to read it anyway — run it and you're done.

But an engineer who has done development for a long time has nerves trained by code review to be highly sensitive. Seeing non-standard naming makes them uncomfortable, seeing duplicated code makes them want to extract a method, seeing critical logic without comments makes them want to fill them in. This isn't showing off — it's **muscle memory**.

This habit of "writing it beautifully", translated into the DevOps context, means:

- **Script readability**: A Shell script isn't done the moment you write it — you have to consider whether the people who come after can understand it. Variable names should be meaningful, and complex logic should be commented.
- **Configuration as code**: Jenkins Pipelines, Dockerfiles, K8s YAML — in essence these are all code. And since they're code, they should follow code conventions: consistent formatting, clear structure, documented key parameters.
- **The DRY principle**: Common logic that appears in multiple pipelines should be extracted into a shared library or template, not copy-pasted six times.

Over the short term, none of this shows any difference. But a year later, when ten services and twenty pipelines are interwoven, the debt of "as long as it runs" comes due — changing one config means hunting through six places, and debugging one problem means flipping through scripts for half a day.

## 2. CleanCode Awareness: Code Is Written to Be Read by People

CleanCode is a classic idea in the development world, but scripts and configuration in the DevOps world are, in essence, also code. And since they're code, the principles of CleanCode apply just the same.

A few real scenarios:

**Scenario one: magic numbers in a Shell script.**

```bash
# The bad way
if [ $retry_count -gt 3 ]; then
  exit 1
fi

# The good way
MAX_RETRY_COUNT=3
if [ $retry_count -gt ${MAX_RETRY_COUNT} ]; then
  exit 1
fi
```

Extract the constant and its meaning becomes instantly clear.

**Scenario two: the layering strategy of a Dockerfile.**

A Dockerfile without CleanCode awareness is usually one RUN doing everything at once, with all the operations crammed together. But with even a little "structural awareness" you'd think of it: separate operations that change at different frequencies, and make full use of Docker's layer cache.

**Scenario three: single responsibility in pipeline configuration.**

One Pipeline does four things — compile, test, deploy, send notifications — with every stage hard-coded into the same file. Someone with structural awareness would think: can each stage be split into a reusable module? Can a shared library be used to manage them?

These are all things that look "neither urgent nor important" but in fact determine how far you'll go.

## 3. Architectural Thinking: Don't Let Immediate Requirements Lead You by the Nose

Another hidden advantage of people with development experience doing DevOps is **architectural thinking**.

What is architectural thinking? Put plainly, it's **splitting into modules, defining boundaries and sorting out dependencies**.

In the DevOps context:

- Not all services should use the same pipeline — services with different technology stacks and different risk levels need different process templates, but they should share common components.
- CI and CD are not the same thing — don't write a Jenkins script that tangles CI and CD together. CI cares about "is the code acceptable"; CD cares about "can it go live". The two concerns must be kept separate.
- Environment abstraction must be sensible — with the four environments of development, testing, pre-release and production, you have to be clear about which configuration is environment-related and which belongs to the service itself. Don't copy a set of configuration per environment.

Without this kind of architectural thinking, what does DevOps practice degenerate into? — **add a service and you copy a pipeline, add an environment and you copy a set of configuration.** It's fast at first, but you soon fall into maintenance hell.

Architectural thinking makes you instinctively reach for **abstraction and layering** when facing a complex system. That instinct is the norm in development work, but it's not common in traditional ops thinking.

## 4. MR/CODEOWNERS: the Power of Collaboration Conventions

A tasteful developer has usually been through a strict code review process. They know how an MR (Merge Request) should be written — a clear title, a description that explains what changed and why, a linked requirement ticket, and the test results attached.

They also know the value of the CODEOWNERS mechanism — for important modules, merging must go through approval by specific people.

What do these habits mean in the DevOps context?

- **Changes to pipeline configuration should also go through the MR process.** "It's just a config change, just merge it" — that attitude is unacceptable in a development mindset. Any change that affects the production environment should be reviewed.
- **Infrastructure-as-code (IaC) repositories should also have CODEOWNERS.** For example, changes to network configuration or security policy must be approved by the relevant ops or security staff.
- **Ops scripts should also have version control and review.** Those scripts sitting in a corner of some server, written by nobody knows who, that no one dares to change, are essentially technical debt.

You may think these things are too "idealistic". But think about it: the development side demands code review because without review you get bugs. So for configuration changes on the DevOps side — is it fine if something goes wrong? The logic is exactly the same. **It's just that people's awareness hasn't caught up yet.**

## 5. Product Thinking: the Big-Picture Perspective That Building a Small Project of Your Own Gives You

Finally I want to raise a point that's easily overlooked: **product thinking**.

Many excellent developers have experience building a small project from scratch — whether a personal blog, a small tool, or a side project. This experience looks unrelated to DevOps, but it gives you a particularly valuable perspective: **the complete chain from user requirement to final delivery**.

When you build a small tool, you have to think for yourself about what the requirement is, how to design the features, how to write the code, whether to add tests, how to deploy it for others to use, and how to troubleshoot it when something goes wrong. Isn't that a miniature version of the DevOps loop?

Someone with that experience, when doing DevOps, will naturally think:

- "Who's actually going to use this pipeline in the end? What's their real pain point?"
- "Once this process is designed, what's the experience like for the user? Is the barrier too high?"
- "This tool isn't just about getting it set up — it needs ongoing maintenance: how do we build the docs, the training and the feedback channel?"

That's product thinking. You're not "setting up a Jenkins", you're "providing the team with a continuous delivery service". Looking at DevOps from a product perspective, your focus naturally shifts from "how do I configure this" to "how do they use it".

## 6. The Essential Difference Between a Development Background and an Ops Background

Having got this far, I can draw some conclusions.

DevOps engineers from an ops background are strong in **stability and incident handling**. They know how terrifying it is when production goes wrong, so they put stability first. But their mental inertia easily turns DevOps into "ops automation" — with their focus concentrated on the second half of the loop (deployment → monitoring).

DevOps engineers from a development background are strong in **end-to-end perspective and engineering literacy**. They understand how code comes to be written, they understand the meaning of review and testing, and they bring CleanCode habits into automation and configuration management. Their mental inertia is to focus on the first half of the loop (requirements → code → testing), treating automation and stability as means that serve delivery quality.

Which is better? **I'm not making a value judgement.** But if you ask me, "which capabilities should I fill in?", my answer is:

- If you come from ops, go write business code for a while. Not writing Hello World — genuinely take part in the whole process of a service from requirement to launch. Feel the pain of R&D and only then will you understand why the first half of the DevOps loop matters.
- If you come from development, go run a production environment. Not setting it up and walking away — genuinely taking the alerts, troubleshooting the incidents and doing capacity planning. Feel the pressure of stability and only then will you understand why ops people are so "conservative".

Only when you've touched both sides are you a DevOps engineer in the true sense.

## 7. A Word at the End of the Series

Six articles in, we've gone from culture to the loop, from professional background to toolchain, from competency model to developer taste. If I had to sum up the core idea this series wants to convey in one sentence, it would be:

**DevOps is not a job title, nor a set of tools, but a way of thinking — looking at software delivery from an end-to-end perspective, using engineering methods to drive process improvement, and replacing adversarial walls with a culture of collaboration.**

No matter what background you come from or what toolchain you work with, as long as you're moving in this direction, you're doing DevOps.

A small step forward every day is a new height!
