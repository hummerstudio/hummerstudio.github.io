---
title: 'Blog Adds a New Page: "Reference Books"'
date: 2020-02-07
author: Tang Moying
categories: [deploy]
tags: [New Pages, Reference Books, Bash, coreutils, RFC2616, HTTP, Hypertext Transfer Protocol]
lang: en
alt_url: /post/blog-add-new-page
---

## A New Page: "Reference Books"

Friends who have read my other articles will know that I'd rather not write a fragmented blog. You can read the details in [this article](/en/post/share-an-idea-to-solve-a-problem).

So I was especially keen to bring into my blog some official reference manuals that are important yet overlooked by most people — ones that even people with years of industry experience may never have looked at — to help my readers.

After a good deal of effort, I finally added wiki functionality to the blog, and named it "Reference Books".

<!--以上为摘要内容-->

## A Preview of the Page

![The Reference Books page](/static/img/2020/02/07/001.png)

The entry point is at the far right of the menu bar.

## Introducing the First Batch of Books

Bash is the Linux sh we use most often. But most people conflate GNU Bash with GNU coreutils, and some don't even know what GNU is.

HTTP is another protocol we use all the time. Browsing web pages, building websites and web applications — and especially the microservices that are so popular right now — all of it is underpinned by HTTP. One part of my current job is RESTful API development, and at first I found it incredible that a colleague with years of web development experience didn't understand what HTTP status codes mean. So I asked a few more colleagues and found that none of them understood the HTTP specification. They used only 200 as a return code, without understanding what 200 means, and knew nothing about the other status codes (beyond a vague impression of the familiar 404 and 504).

You can see that everyone's knowledge points are rather fragmented. What people know is basically propped up by whatever they happen to encounter at work, with no systematic structure to it. This is a common phenomenon in the industry too.

This first batch of new books brings you the officially produced Bash reference manual, the GNU coreutils reference manual and the RFC2616 document (the HTTP 1.1 standard textß).

### The Bash Reference Manual

Try to judge whether the following statements are true or false:

1. `bash` and `sh` are the same thing.
1. `cat` is a command provided by `bash`.
1. `history` is a command provided by the operating system.
1. The pipe `|` is a command provided by the operating system.
1. `Ctrl-a` to move to the start of the line and `Ctrl-e` to move to the end of the line are keyboard shortcuts provided by the operating system.
1. Executing a `.sh` file is a feature of `Bash`, but executing commands at the command line is not a feature of `Bash` — it is a feature of the operating system.

If there is even one statement above that you think is true, then it is absolutely worth reading through this manual!

### The GNU Coreutils Reference Manual

Are you familiar with the concept of Shell built-in commands? Do you know which commands are provided by the Shell and which are not?

If one day an interviewer asks you:
>"I see you're quite familiar with the Shell language. Let me start with a simple question: what are the commands for sorting and for de-duplicating?"

And you answer like this:
>"The commands for sorting and de-duplicating are `sort` and `uniq` respectively. Strictly speaking. the `sort` and `uniq` commands are not commands of the Shell language, but commands provided by the GNU coreutils project. The Shell provides only a very limited set of built-in commands, generally related to language features — for example `declare` and `export` are used to define variables and environment variables respectively, `case`, `if` and `while` are used for conditionals and loops, and `alias` is used to define aliases. The commands with concrete functionality that we normally use are all provided by the GNU coreutils project. For example the basic operations `cp`, `mv`, `rm`, `dd`; the commands that change file attributes `chown`, `chgrp`, `chmod`; the disk-management commands `df`, `du`, and so on."

I'm sure you will leave the interviewer with a deep impression.

### RFC2616: Hypertext Transfer Protocol –- HTTP/1.1

For the questions below, do you know what the correct answers are?

1. Following the HTTP specification, what is the status code that should be returned when a resource is created successfully?
1. Following the HTTP specification, what is the status code that should be returned when resource information is updated successfully and there is no data to return?
1. Following the HTTP specification, what is the status code that should be returned when the request sent by the client is incorrect?

If you can't answer correctly, you really must read this protocol text.

Beyond that, did you know that besides GET and POST, HTTP methods also include PUT, DELETE and others?

If you didn't know, you really must read this protocol text.

The text defines and explains each concept of the HTTP protocol; by studying it you will gain a comprehensive understanding of the various concepts of HTTP at a systematic level.

## Further Reading — Octicons

This update involves an icon set software called Octicons.

Octicons is an open-source, extensible icon set produced by GitHub.

You can read the introduction to Octicons in [this article](/en/post/octicons).
