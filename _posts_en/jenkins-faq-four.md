---
title: Jenkins FAQ Collection (Part 4)
date: 2019-08-05
author: Tang Moying
categories: [devops]
tags: [Jenkins, Pipeline]
lang: en
alt_url: /post/jenkins-faq-four
---

## Question 16: Can a Timeout Be Set in Pipeline Code?

Reference answer: yes. As in the following code, this sets a timeout of 1 hour, and it can be set both globally for the pipeline and at the stage level:

```
options {
  timeout(time: 1, unit: 'HOURS')
}
```

## Question 17: Is There a Plugin That Can Monitor Changes to the Jenkins Configuration?

<!--以上为摘要内容-->

Reference answer: yes. The jobConfigHistory plugin can monitor and compare changes to Jenkins job configuration. In principle it does this by comparing the corresponding config.xml.
For Pipeline-type jobs, however, the usual practice is to configure a repository and specify the location of the Jenkinsfile.
In that case, even if the contents of the Jenkinsfile are modified, the corresponding config.xml does not change.
To solve this problem there is another plugin — Pipeline Configuration History. It can track not only the Jenkinsfile but also changes to global shared libraries; it is very comprehensive.

## Question 18: Email Fails to Send?

Reference answer: there are many causes. A fairly common one is that the “System Administrator e-mail address” on the system configuration page is not consistent with the configured mail sender, and that is easy to overlook.

## Question 19: Is There a Jenkins Chinese Community?

Reference answer: yes. Official site: https://jenkins-zh.cn  It is still under construction, and contributions of code, PRs and feedback are welcome.

## Question 20: Sometimes the Cause of an Error Isn't Visible in the Job Log?

Reference answer: try taking a look at the Jenkins system log. Plenty of alerts and error messages are hidden there too, and it is a good place to track a problem down — most people don't know about it, you know. Path: Home - Manage Jenkins - System Log - All System Logs.

>This article was first published on the WeChat public account "DevOps持续交付" (DevOps Continuous Delivery), account ID: devopscd. Welcome to follow.
