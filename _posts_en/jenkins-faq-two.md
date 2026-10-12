---
title: Jenkins FAQ Collection (Part 2)
date: 2019-08-02
author: Tang Moying
categories: [devops]
tags: [Jenkins, Pipeline, Blue Ocean, Python, Groovy]
lang: en
alt_url: /post/jenkins-faq-two
---

## Question 6: What is the relationship between Blue Ocean and Jenkins?

Reference: to put it plainly, Blue Ocean can be seen as a new UI that Jenkins introduced, with a more modern look and better interaction.

The most important thing, of course, is its support for the new pipeline job type introduced in Jenkins 2.x, which can clearly display the serial and parallel relationships and the status of each stage of the whole Pipeline.

<!--以上为摘要内容-->

Blue Ocean is implemented in the form of a plugin; you just install the "Blue Ocean" plugin from the Jenkins plugin center. After installing it, in the classic UI interface, click "Open Blue Ocean" on the left to access the new interface.

## Question 7: Can a stage written in a shared library be displayed on the Blue Ocean interface?

Reference: yes.

## Question 8: How do I check the Groovy version on Jenkins? For example, I can log into the server and run groovy --version to see the Groovy version installed on the server.

Reference: you can find the jar for groovy under the `${JENKINS_HOME}/war/WEB-INF/lib` directory. The version number is visible in the jar file's name.

## Question 9: In a Jenkins pipeline, if I run a bat command inside one stage and set a variable in it, is there a way to get that variable in the bat command of the next stage? Through groovy interpolation I can get groovy-defined variables inside bat, but can I save the variables from bat into groovy?

Reference: a variable defined with set ends its life cycle the moment this bat command finishes, so it cannot be obtained in the bat command of the next `stage`. Even within the same `stage`, if you write two separate bat commands, the later one cannot get the variable value defined by the earlier one. In this situation, I'd suggest first writing the information you need into a file, then reading it back from the file. If the two stages run on different nodes, just add a step in between to archive the file.

## Question 10: Is there a python library for operating jenkins?

Reference: there are two. One is called `python-jenkins`, the other `jenkinsapi`. The former is older, the latter newer. You can choose whichever suits your taste and functional needs.

<https://pypi.org/project/python-jenkins/>

<https://pypi.org/project/jenkinsapi/>

>This article was first published on my WeChat official account “左手编程右手文化” (Coding Left, Culture Right), account ID: devopscd. Welcome to follow.
