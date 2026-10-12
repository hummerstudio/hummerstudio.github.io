---
title: 'Jenkins Plugin Update Center Address Changer: One-Click Switch to a Domestic Mirror'
date: 2020-04-06
author: Tang Moying
categories: [devops]
tags: [Plugin Center, Jenkins]
lang: en
alt_url: /post/change-jenkins-plugin-center-source-to-cn
---

## A Domestic Mirror for the Jenkins Plugin Center

The 1500+ plugins Jenkins has are its most valuable resource and its most distinctive feature. They give Jenkins powerful capabilities, great flexibility, and the ability to connect and interact with other platforms.

Recently, however, users in China have clearly felt that Jenkins downloads plugins very slowly, and that downloads frequently time out and fail. This has caused a great deal of trouble for users in China.

The main reason is that the Jenkins open-source community's network infrastructure servers are all located abroad.

In November 2019, the Jenkins Chinese Community (Jenkins 中文社区) launched a domestic mirror address.

That mirror source solved the problem that had always plagued other mirror sources — that they could not really be used — and lets users in China take full advantage of the broadband speed they actually have when downloading plugins.

<!--以上为摘要内容-->

## The Bar to Switching Is High

But switching the Jenkins plugin center to the domestic mirror address is not easy.

Users not only have to change the plugin center address; they also have to manually add certificate files in a specific directory.

In practice, users often run into all kinds of problems and propose all kinds of solutions based on their own understanding, which makes the configuration methods even more confusing.

So I built the Jenkins plugin update center address changer (jenkins-update-center-changer), which can switch to the domestic mirror address in one click.

## One-Click Switch Script

Using it is very simple: just run the following command in any directory on the Jenkins master server (the script automatically reads the `JENKINS_HOME` environment variable):

`bash -c "$(curl -fsSL https://gitee.com/hummerstudio/jenkins-update-center-changer/raw/master/jenkins-update-center-changer.sh)"`

After the change succeeds, the script also prints the follow-up instructions:

![jenkins-update-center-changer](/static/img/2020/04/jenkins-update-center-changer.png)

## An Open-Source Project — Contributions Welcome

This tool is an open-source project; everyone is welcome to file issues and submit PRs!

Gitee address: [https://gitee.com/hummerstudio/jenkins-update-center-changer](https://gitee.com/hummerstudio/jenkins-update-center-changer)

Github address: [https://github.com/hummerstudio/jenkins-update-center-changer](https://github.com/hummerstudio/jenkins-update-center-changer)

(The Gitee repository is the primary one, mainly because it is a domestic service and therefore faster.)
