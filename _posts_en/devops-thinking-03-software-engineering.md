---
title: 'DevOps Methodology Musings (Part 3): Which Major Suits DevOps — How Your Professional Background Shapes Your Starting Point'
date: 2025-12-13
author: Tang Moying
categories: [devops]
tags: [DevOps, Software Engineering, Career Development, Professional Background, Competency Model]
lang: en
alt_url: /post/devops-thinking-03-software-engineering
---

In the previous article we went through every link in the DevOps loop. The loop covers the complete lifecycle of a piece of software from idea to launch — and how many links that journey has, and what capabilities each link demands, actually mirrors the differences between the training programmes of different majors. That naturally raises a question: for someone doing DevOps, which major fits best? And how does the starting point differ for people from different backgrounds? That's what this article is about.

<!--以上为摘要内容-->

## 1. Where Do DevOps People Come From?

In real work you'll find that the people doing DevOps come from all sorts of backgrounds. Some were developers, some were in operations, some moved over from testing, and some even switched careers from being a network administrator.

That's normal. DevOps itself is not a "formal academic major" — it's a combination of methodology and engineering practice. No university offers a "DevOps major" for you to enrol in; everyone walks into this field after they start working, following their own path.

But people from different backgrounds approach DevOps from very different angles. Look at two DevOps engineers, one from a development background and one from an operations background, and what they care about is likely to be completely different:

- People from a development background care more about **how code can get from the development environment to production faster and more safely**. They instinctively understand the pain points of R&D — branch management, code review, dependency conflicts, environment inconsistency.
- People from an operations background care more about **service stability and observability**. They're good at monitoring, alerting and capacity planning, but they're less interested in how the code actually came to be written.

Neither perspective is absolutely better, but there's one fact you can't ignore: **the DevOps loop starts with requirements, not deployment.** That means if someone only understands the second half (deployment → monitoring), their understanding of the first half (requirements → code → testing) is missing. And once the loop is broken, DevOps degenerates into ops automation.

To make this clear, let's look carefully at what a few typical majors actually teach. Only when you know each major's course structure can you truly understand where the strengths and weaknesses of people from different backgrounds doing DevOps lie.

> Note: the course listings for each major below are based on the typical training programmes of most universities. They differ between schools and between years — grasp the main thread and don't get hung up on the details.

## 2. Software Engineering — the Underrated Full-Lifecycle Major

Software engineering is a discipline that combines computer science theory with engineering management methods. Its core goal is not only to teach you how to write code, but how to build, test, deploy and maintain large-scale software systems efficiently, systematically and to a high standard.

Below, following the university training programme, let's look at the software engineering curriculum from the perspective of its course layers.

### 2.1 Core Foundations (Freshman ~ Sophomore Year)

The foundational inner strength that no hardcore software engineer can avoid. This part mainly answers "how does a computer work underneath" and "how do you write efficient code".

| Course | Content | Corresponding DevOps loop link |
|------|------|------------------|
| Programming Language Fundamentals | Usually starts with C/C++ (to build a feel for memory and low-level thinking), then advances to Java, Python or Go (object-oriented and mainstream engineering languages) | Code |
| Data Structures | Linked lists, trees, graphs, heaps, stacks, and how to organise data — the "soul course" of software | Code |
| Algorithm Design and Analysis | How to solve problems the fastest and most memory-efficient way (sorting, searching, dynamic programming, etc.) | Code |
| Computer Organization | How the CPU, memory, disk and other hardware work together to execute the code you write | Monitoring (understanding the underlying causes of performance bottlenecks) |
| Operating Systems | Processes, threads, memory management, file systems (the underlying logic of Linux systems) | Deployment + Monitoring |
| Computer Networks | How data travels across the internet (TCP/IP, HTTP, etc.) | Deployment (the network is the infrastructure of deployment) |

As you can see, the courses at this layer overlap heavily with those of the Computer Science and Technology major. **Software engineering is not "all process, no technology" — its foundational training is just as solid.** Anyone who thinks "software engineering is just learning UML and drawing flowcharts" probably misunderstands the major.

With those foundations under your belt, software engineering's real signature skill sits at the next layer — engineering methodology.

### 2.2 Software Engineering and Methodology (Sophomore ~ Junior Year)

**This is the core of what sets the software engineering major apart from a plain computer science degree.** It focuses on engineering practice, standardisation and teamwork, which map exactly onto the "process" and "quality" dimensions of the DevOps loop.

| Course | Content | Corresponding DevOps loop link |
|------|------|------------------|
| Introduction to Software Engineering | The software lifecycle (requirements → design → coding → testing → maintenance), the waterfall model, agile development (Agile) and the Scrum process | Full lifecycle |
| Object-Oriented Analysis and Design (OOAD) | Designing the structure of complex systems with UML — class diagrams, sequence diagrams, state diagrams, deployment diagrams | Design |
| Software Design Patterns | The "formulas" for highly extensible, loosely coupled code (singleton, factory, observer, strategy, etc.) | Code (writing maintainable code is the foundation of DevOps) |
| Software Requirements Engineering | How to turn the vague plain-language talk of a product manager or client into a precise technical requirements specification that programmers can understand | Requirements management |
| Software Testing and Quality Assurance | Unit tests, integration tests, automated testing tools, and how to guarantee code is "bug-free" | Testing |
| Software Project Management | How to schedule work, control costs, manage an R&D team and assess risk | Full lifecycle (iteration management and delivery cadence) |

Look closely at this table and you'll notice a striking coincidence: **nearly every course at this layer has a matching link in the DevOps loop.** Requirements engineering maps to requirements management, design patterns map to code quality, software testing maps to continuous testing, project management maps to iterative delivery — and that's no coincidence, because the DevOps loop is itself the engineering implementation of software engineering theory.

Having covered engineering methodology, the student's horizon moves up another level, into the realm of modern hands-on technology.

### 2.3 Modern Advanced Applications and Practice (Junior ~ Senior Year)

The courses at this layer lean towards putting mainstream industry technologies into practice. They vary a lot between schools, but overall they cover the complete chain from data storage to distributed architecture to cloud-native technology.

| Course | Content | Corresponding DevOps loop link |
|------|------|------------------|
| Principles of Database Systems | Designing relational databases (MySQL, PostgreSQL), SQL tuning, and NoSQL (Redis, MongoDB) | Code + Monitoring |
| Compiler Principles | How a compiler turns code into binary instructions the machine can understand | Build (understanding the essence of the compilation process) |
| Distributed Systems and Microservice Architecture | How to build large internet systems that withstand high concurrency (Spring Cloud, Service Mesh, RPC frameworks) | Deployment |
| Cloud Computing and Cloud-Native Technology | Containerisation (Docker), container orchestration (Kubernetes), and CI/CD and DevOps systems | Deployment + Full lifecycle |
| Web Development / Mobile Development | Hands-on separated front-end/back-end development, or Android / iOS development | Code |
| Fundamentals of Artificial Intelligence and Data Mining | An introduction to machine learning and deep learning algorithms and their applications | Broadening horizons |

It's particularly worth noting that the **Cloud Computing and Cloud-Native Technology** course has been appearing in more and more software engineering training programmes in recent years. This means some software engineering students encounter the concepts of Docker, Kubernetes and CI/CD while still at university. The depth is limited, but at least it means graduates don't enter the workplace in a state of "total ignorance" about DevOps.

Besides classroom teaching, software engineering also has a practical training system that runs all the way through.

### 2.4 Practice and Engineering Training (Running Through All Four Years)

Software engineering places enormous weight on "hands-on ability", so the whole degree comes with a large amount of practical work:

| Type of practice | Content | Corresponding DevOps loop link |
|----------|------|------------------|
| Course Projects | A data structures project (building a small game or management system), an operating systems project (writing a simple kernel or file system) | Code |
| Large-Scale Software Project Practice (Industrial Internship) | In junior year, a few students form a Scrum team and simulate a real corporate development process in full, collaborating to deliver a complete software product from 0 to 1 | **End-to-end full lifecycle** |
| Graduation Project | Drawing on four years of study, independently or in a team completing a genuinely useful system development or technical research topic | **End-to-end full lifecycle** |

This part is the "acceptance stage" of the whole software engineering education. **The industrial internship and the graduation project require students to go all the way from requirements analysis to system implementation and tested delivery — a mini version of the DevOps loop.** A graduate who has been through this training instinctively understands what "from requirements to launch" means — not a theoretical understanding, but one gained by having done it with their own hands.

### 2.5 Summary from a Software Engineering Perspective

Having read the curriculum above, you'll notice one fact: **the software engineering major is not a "weaker version of computer science" but an "engineered version of computer science".** It covers computer science's hard foundational courses (data structures, operating systems, computer networks), layers engineering methodology on top (requirements, design, testing, project management), adds a modern technology stack (distributed systems, cloud-native, AI), and finally stitches it all together with a large amount of hands-on project work.

From a DevOps perspective, the software engineering education system is almost "tailor-made for DevOps" — not because anyone designed it that way on purpose, but because DevOps is essentially the industrial-scale implementation of software engineering theory through automation. Software engineering teaches you "how software should be built", while DevOps is about "how to automate and systematise that".

## 3. Computer Science and Technology — Deep Technical Strength, Missing Engineering Perspective

Computer science is the most "general-purpose" and also the most "hardcore" direction among computer-related majors. Its curriculum leans towards theory and the low level, and its core goal is to train research and technical talent in the field of computing.

### 3.1 The Computer Science Curriculum

| Course category | Typical courses | Characteristics |
|----------|----------|------|
| Mathematics foundations | Advanced mathematics, linear algebra, probability and statistics, discrete mathematics | Deeper than software engineering, laying the groundwork for later theory courses |
| Programming foundations | C/C++, Java or Python (usually 1–2 languages) | Possibly fewer languages than software engineering, but deeper at the low level |
| Data structures and algorithms | Data structures, algorithm design and analysis | **A core strength of computer science**; depth and difficulty often exceed software engineering |
| Low-level systems | Computer organization, operating systems, compiler principles | **Another core strength of computer science**, going deep into hardware and systems |
| Networking | Computer networks | On par with software engineering |
| Databases | Database systems | On par with software engineering |
| Theory track | Theory of computation, formal languages and automata, numerical analysis | Unique to computer science, research-oriented |
| Application track | Artificial intelligence, computer graphics, information security | Varies widely between schools |
| Software engineering | **Usually just one course**, Introduction to Software Engineering | **This is the key difference** |

### 3.2 DevOps Fit Analysis for Computer Science

Computer science's core strength is plain to see: **strong technical depth and a thorough understanding of the low level.** When computer science graduates doing DevOps run into technical problems involving operating systems, network protocols or the compilation process, they can often pinpoint the root cause quickly. When a pipeline build fails, for instance, someone from computer science may see at a glance that it's a linker problem; when a service has a performance bottleneck, they can analyse it down to the level of CPU cache misses.

But computer science's weak spots are just as obvious:

**First, the absence of software engineering process.** A single Introduction to Software Engineering is usually assessed by coursework rather than by exam, and many students finish it knowing only the words "waterfall model" and "agile", with no idea how to write a requirements analysis, how to define a test strategy, or how to do configuration management. Yet requirements management, code review, test layering and deployment strategy in the DevOps loop are precisely the things that live at the level of engineering process.

**Second, insufficient training in teamwork.** Computer science course projects are usually done solo or in small teams of two or three, rarely simulating the ten-plus-person Scrum team that works on a project for a whole semester the way software engineering does. This missing training leaves computer science graduates without a visceral sense of why code review, branch management and MR/PR workflows — these "conventions of multi-person collaboration" — matter.

**Third, an easy slide into "technicism".** Because their technical foundations are good, people from computer science can easily fall into a mindset when doing DevOps: "as long as the technical solution is correct, the problem will be solved." But many DevOps problems are not technical problems at all — they're process problems, communication problems, culture problems. You can build a flawless K8s cluster, but if the team has no appetite for containerisation, that cluster is just decoration.

**In one sentence**: people from computer science have a natural technical edge in the "second half of the loop" (build → deploy → monitor) when doing DevOps, but there is a clear gap in their training when it comes to the "first half of the loop" (requirements → code → testing process) and their ability to "connect the links".

## 4. Network Engineering / Operations — the Infrastructure Specialists

For students in network engineering or operations-related tracks, the curriculum revolves around networking, systems and security.

### 4.1 The Network Engineering / Operations Curriculum

| Course category | Typical courses | Characteristics |
|----------|----------|------|
| Basic programming | C, Python scripting | Limited programming depth — enough to write scripts, but a long way from engineering-grade development |
| Computer networks | Computer networks, routing and switching technology, network protocol analysis, network programming | **A core strength of network engineering**; far deeper than in other majors |
| System administration | Linux system administration, Windows Server administration | A strongly hands-on track |
| Security | Network security, firewall technology, intrusion detection | Core knowledge for operations security |
| Databases | Database fundamentals (usually fairly shallow) | Adequate, but not deep |
| Hardware-related | Structured cabling, network engineering design and implementation | Physical-layer material |
| Missing key courses | Data structures, algorithms, operating system principles, compiler principles | **These core computing courses are almost entirely absent or very shallow** |
| Missing engineering courses | Software engineering, software testing, requirements analysis, design patterns | **Completely absent** |

### 4.2 DevOps Fit Analysis for Network Engineering / Operations

The strengths of people from network engineering / operations are concentrated in the second half of the DevOps loop:

- **Deployment**: network configuration, load balancing, firewall rules — this is their home turf.
- **Monitoring**: Linux performance tuning, network troubleshooting — equally second nature.
- **Script automation**: writing ops scripts, automated inspections — they already do this in their day-to-day work.

But the weak spots are just as striking:

**First, a total absence of the R&D process.** In the network engineering / operations curriculum, the requirements and design stages are a complete blank. They don't know what happens between a requirement being "one sentence from the product manager" and becoming "a testable development task", they don't know why code review matters, and they don't know what design patterns are for. This makes it hard for them to have a genuinely effective conversation with R&D when doing DevOps — you say "this MR needs a rebase", and they may not even know what an MR is.

**Second, a lack of engineering-grade programming ability.** Writing an ops script and writing an engineering-grade module are two different things. Engineering-grade code has to account for readability, testability and extensibility, not just "it runs, so it's fine". That kind of engineering literacy is built up through a great deal of code practice, and the network engineering / operations curriculum offers no such training.

**Third, confusing "ops automation" with "DevOps".** Because they lack understanding of the first half of the loop, people with an operations background easily read DevOps as "ops automation" — "just automate the ops work with scripts, isn't that enough?" But as noted earlier, DevOps has to manage the end-to-end lifecycle, and ops automation is only one link in it.

## 5. Side-by-Side Comparison of the Three Majors

Put the three majors side by side and the differences are plain:

| Competency dimension | Software Engineering | Computer Science and Technology | Network Engineering / Operations |
|----------|----------|------------------|-----------------|
| Programming ability | ★★★★ Engineering-grade | ★★★★★ Low-level + algorithms | ★★ Script-level |
| Algorithms and data structures | ★★★ Adequate | ★★★★★ Core strength | ★ Almost absent |
| Operating systems / hardware | ★★★ | ★★★★★ Core strength | ★★ Can use them, doesn't know the principles |
| Computer networks | ★★★ | ★★★ | ★★★★★ Core strength |
| Requirements engineering | ★★★★ | ★ One course | ☆ Completely absent |
| Software design | ★★★★ UML + design patterns | ★ Not systematic | ☆ Completely absent |
| Software testing | ★★★★ | ★ One chapter in one course | ☆ Completely absent |
| Project management / process | ★★★★ | ★ Familiar with the concepts | ☆ Completely absent |
| Hands-on teamwork | ★★★★ Large-scale project practice | ★★ Small team or solo | ★ Almost absent |
| Cloud-native / DevOps concepts | ★★★ Being added in recent years | ★ Rarely covered | ★★ Skewed towards an ops perspective |

This table isn't meant to rank who is "better" — it's meant to show you that **each major's curriculum determines its graduates' default perspective.**

- Software engineering's default perspective is the **end-to-end lifecycle** — so when they do DevOps they naturally see the whole loop.
- Computer science's default perspective is **technical depth** — so when they do DevOps they can naturally handle hard technical problems, but they easily overlook process and culture.
- Network engineering's default perspective is **infrastructure** — so when they do DevOps they're strong in the last few links, but disconnected from the R&D process that comes before.

## 6. Why Does the Software Engineering Curriculum Match the DevOps Loop So Well?

Back to the point we started with: the DevOps loop = requirements management → code management → build → testing → deployment → monitoring → feedback.

Now look at the software engineering curriculum again:

| DevOps loop link | Corresponding software engineering course | Depth |
|-----------------|-------------|----------|
| Requirements management | Software Requirements Engineering (a standalone course) | Deep |
| Code management | Programming languages (C/C++/Java) + design patterns | Deep |
| Build | Compiler principles (understanding the nature of a build) | Moderate |
| Testing | Software Testing and Quality Assurance (a standalone course) | Deep |
| Deployment | Cloud Computing and Cloud-Native (added in recent years) | Moderate |
| Monitoring | Operating systems + networking (you have to understand the low level to understand monitoring) | Deep (low level) |
| Feedback | Software Project Management + agile development (the core of iteration-driven work) | Deep |
| Full lifecycle | Introduction to Software Engineering + large-scale project practice | Deep |

Eight to eight — almost complete coverage. And it's not coverage of the "mentioned in passing" kind; **every link is backed by a standalone course or a large amount of training.**

What does that degree of match mean? It means that when a software engineering graduate takes a DevOps role, they don't need to understand from scratch "why do we do requirements management", "why do we do testing", "why do we need a project management process" — they have already studied these things, and even practised them hands-on. All they need to pick up is the specific tools and automation techniques.

By contrast, the other two majors both have a very large blind spot to make up when they enter DevOps: computer science has to make up the entire content of process, management and collaboration, and network engineering has to make up the entire content of the R&D process and engineering-grade programming. These are not gaps you close by learning a few tools; they're cognitive frameworks that take a long soak to build.

## 7. A More Convincing Perspective: Quantifying by Course Count

If the discussion above still feels too subjective, let's do a more direct comparison — **count the number of courses directly related to the DevOps loop.**

| Major | Number of courses directly related to DevOps | Loop links covered (/8) |
|------|---------------------------|---------------------|
| Software Engineering | 12+ (requirements engineering, design patterns, software testing, project management, agile development, cloud-native, compiler principles, OS, networking, databases, OOAD, large-scale project practice, ...) | 8 / 8 |
| Computer Science and Technology | 5–6 (OS, compiler principles, networking, databases, data structures and algorithms, possibly one introduction to software engineering) | 5 / 8 |
| Network Engineering / Operations | 2–3 (networking, Linux administration, security) | 2 / 8 |

This gap isn't about "software engineering people working harder" — it's a **structural difference in the training programmes**. The foundation you lay with 12 courses and the foundation you lay with 3 are obviously not the same starting line.

## 8. What Needs Saying — and What Doesn't

At this point I think a disclaimer is in order.

I come from a software engineering background myself, so the analysis above is inevitably suspect as "self-promotion". But the reason I've written so much isn't that I think software engineering is "a cut above" — it's that **I really have felt the help this training gives me, again and again, in my work, and only in hindsight did I realise that the way the courses were set up back then made sense**.

This isn't a boast — it's a kind of "gratitude in hindsight". It's like someone who has built a house telling you the foundation matters — not because they're bragging, but because they really did step in the pitfalls, and looking back only then understood how much trouble the foundation saved them.

At the same time I want to stress: **your professional background determines your starting point, but not your finish line.**

- Came from operations? Go learn agile development, get to grips with requirements management, write a few test cases, and fill in the first half of the loop.
- Came from computer science? Start paying attention to process and culture, learn how to organise code review and how to drive process improvement, and fill in the engineering mindset.
- Came from software engineering? Keep honing your technical depth — you can't get by knowing only how to draw flowcharts and never writing a script.

What's most interesting about DevOps is that it doesn't require you to be a top expert in any single link; it requires you to **understand each link a little and be able to string them together**. This "T-shaped talent" model is precisely DevOps's greatest value for personal growth.

## 9. Summary

This article has spent a fairly long stretch on professional background because I've noticed that many people — including friends of mine — have an unclear picture of their own starting point. They either belittle themselves ("I'm not from a formal CS programme, I can't do DevOps") or overreach ("I'm from computer science, DevOps is just setting up Jenkins, isn't it?").

Looking objectively at your own strengths and weak spots, and filling in whatever you're missing — that's the right posture for growth.

Next time we'll take up a more practical topic: **toolchain thinking** — the perspective a DevOps engineer should use when looking at that dazzling array of tools.

A small step forward every day is a new height!
