---
title: 'DevOps Methodology Musings (Part 1): Culture Comes First — Why We Start with Culture'
date: 2025-12-06
author: Tang Moying
categories: [devops]
tags: [DevOps, Team Culture, Agile, Lean, Blame]
lang: en
alt_url: /post/devops-thinking-01-culture
---

After all these years doing DevOps, I've noticed a rather interesting phenomenon: when many teams introduce DevOps, the first thing they do is set up Jenkins, containerise everything, and roll out K8s. They build up a whole toolchain and configure the process beautifully, but the results are always less than satisfactory. No matter how fast the pipeline runs, the problems that should occur still occur, and the blame that should be passed still gets passed. Why? Because DevOps was never a purely technical problem — it is, first and foremost, a cultural one.

<!--以上为摘要内容-->

## 1. Tools Are Never the First Problem to Solve

Think back — have you ever heard things like this:

"We'll just set up a Jenkins and that'll do."

"Get Docker into use and DevOps is basically implemented."

"Once K8s is up, we're doing DevOps."

These statements sound perfectly reasonable, but think about them carefully and they share one problem: **equating DevOps with building a toolchain**.

Tools matter, of course. Without tools, continuous integration and continuous delivery are just empty talk. But if you understand DevOps as merely "knowing how to use Jenkins", "knowing how to write a Dockerfile" or "knowing how to configure K8s YAML", then you may have set off down a different road — ops automation, not DevOps.

**So where's the difference between ops automation and DevOps?** Ops automation means "using scripts to automate the ops work" — its perspective is that of operations. DevOps, by contrast, takes the perspective of the **entire end-to-end software delivery flow**, and it requires collaboration between development, testing and operations. Which determines one thing: without a culture of collaboration as the foundation, no matter how well the tools are set up, everyone still works in their own silo, and when something goes wrong they still blame each other.

So my view is this: **culture comes first, tools follow.** First let the team form the right culture and mindset, then bake that culture into the tools and the process.

## 2. A Culture of Blame Is DevOps's Biggest Enemy

"There was an incident in production last night — who did it?"

That sentence is probably the last thing anyone working in DevOps wants to hear.

In many teams, the first reaction when something goes wrong is to **find the person**. Find out who committed the code, who changed the config, who clicked the deploy button. Once that's done, the person responsible takes the blame and the matter counts as "handled". Then you hold a postmortem, write up an improvement plan, and carry on as usual.

But here's the problem: **the very process of hunting for a person drains trust.**

When you reflexively assign blame, your team members' subconscious becomes: **"Do less, make fewer mistakes; do nothing, make no mistakes."** People start to become conservative — code that doesn't have to change doesn't get changed, config that doesn't have to be touched doesn't get touched. What's more frightening is that once something goes wrong, everyone's first reaction is not how to recover quickly but how to distance themselves from it — "It wasn't me", "I never changed that", "I flagged this problem ages ago".

In that kind of atmosphere, DevOps can't possibly be done well. Because one of the core spirits of DevOps is **frequent delivery**. Frequent delivery means lots of change, and lots of change means a high probability of mistakes. If every mistake is a trial of an individual, then who would still dare to deliver frequently?

## 3. Look Forward, Don't Assign Blame

So what do you do when an incident happens? If you don't assign blame, does nobody take responsibility any more?

Of course not. **Not assigning blame is not the same as not taking responsibility.** What we need to do is: **turn blame aimed at people into improvement of the process.**

Put plainly, it's simple: an incident is, in all likelihood, not someone "deliberately sabotaging things" but the result of a series of factors piling up:
- Code review didn't cover it
- Test cases weren't complete
- The release process lacked a gate
- Monitoring and alerting weren't timely enough
- The operating docs weren't clear enough

These are the things that actually need solving. So after an incident, the right approach is:

1. **Stop the bleeding first**: restore service quickly and limit the blast radius.
2. **Postmortem**: not "who did it", but "why did this process allow this to happen".
3. **Improve**: for the weak links in the process, add automated gates, fill in missing tests, improve monitoring.

That's what "looking forward" means — **the focus is always "how do we prevent it next time", never "who did it last time".**

Interestingly, once you genuinely achieve "no blame", people actually become more willing to take responsibility on their own initiative. Because they know that admitting a problem brings no punishment, only improvement. Once that kind of trust is established, your team's self-drive will exceed anything you imagined.

## 4. Agile Culture: Small Commits, Independent Commits

Another important foundation of DevOps culture is **agile development culture**.

Many teams say they practise agile, but the way they commit code is not agile at all. A feature is developed over three or five days, then dumped in one huge commit of several thousand lines — just looking at it gives anyone a headache. For DevOps that way of committing is catastrophic: code review can't go deep, conflict resolution is painful, and when something goes wrong, locating the cause is extremely hard.

What DevOps needs is **small commits and independent commits**:
- **Small commits**: each commit does one thing only, with the size of the change kept within reason. That way reviewers can actually read it, and if something goes wrong it's easy to trace back.
- **Independent commits**: each commit is self-contained and doesn't depend on "there's a pile more code coming later". Once it's committed, at minimum it compiles.

You might ask: how do you commit when the feature isn't finished? Simple — **break a big feature into small steps**. This isn't a technical problem, it's a matter of habit. With feature flags, branching strategy, interface-first development and similar techniques, small-step commits and continuous integration are entirely achievable.

Once that habit takes hold, the DevOps process becomes far smoother. The CI pipeline fires frequently, each change is a controllable size, and both the probability of problems and the difficulty of fixing them drop sharply.

## 5. Lean Thinking: Deliver Frequently, Accept Feedback

Complementing agile culture is **lean thinking**.

One of the cores of lean is **small batches and fast delivery**. In software development that means: don't sit on a big release for a month; ship small releases as frequently as you can. Only then do you get feedback quickly.

The pipeline is one of the core mechanisms of DevOps. Code goes in, it builds, tests and deploys automatically, and when it's finished it tells you the result — passed or failed. The heart of lean thinking is this: **you have to actively accept that feedback and respond to it quickly.**

Some teams behave like this: the pipeline goes red and so what, it's not my problem. Or the pipeline goes red, they take a look, decide it's a problem with their own business code, and leave it — it's only the test environment anyway. That mindset is the classic case of "tools built, culture not built".

The genuinely lean approach is: **a red pipeline is the most important thing right now.** Either fix the code, or fix the pipeline, or confirm it's a false alarm and close it — in short, you can't leave red hanging there. Because once red hangs around long enough, people become "desensitised" to the pipeline: if a red light is the normal state, can it still serve as feedback?

## 6. Summary

The real difficulty in implementing DevOps is usually not the toolchain but **people's mindset and the team's culture**.

- **Look forward, don't assign blame**: treat an incident as an opportunity to improve the process, not as a trial of an individual.
- **Agile culture**: small commits and independent commits, so the CI process runs frequently and safely.
- **Lean thinking**: deliver frequently, and take every piece of pipeline feedback seriously.

These three aren't slogans to hang on the wall; they're practices to weave into day-to-day development habits.

Tools are the carrier of culture. Build the good culture first, then add the right tools, and DevOps can truly deliver value. Conversely, if the culture isn't in place, no amount of tools is more than decoration.

Next time we'll talk about one of DevOps's most central concepts: **the DevOps loop** — understanding the end-to-end software delivery flow.

A small step forward every day is a new height!
