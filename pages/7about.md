---
layout: page
title: 关于
permalink: /about/
icon: octicon-heart
isNavItem: true
noGlassCard: true
---

## 关于站长

唐莫盈（真名唐明），“莫盈”二字取自“明”的拆字谐音，我琢磨了很久的~

90后，2014年开始工作，专注于DevOps&持续集成&持续交付领域相关技术栈。

老家在有“闽台祖地，唐人故里”之称的河南省固始县。

主要使用编程语言有`Python`、`Groovy`、`Java`、`Batch`、`Shell`等（现在已经 Vibe Coding，100% AI来写了）。

先后从事过的工作：

- J2EE开发

- 大数据开发工程师（分布式数据库HBase）

- 持续集成工程师（CIE），及10+规模持续集成团队管理经验

- 持续集成架构师（云原生的大规模的可靠的Jenkins集群架构）

- DevOps工程师

- 高级CI工程师 & DevOps效能部负责人（3~5人规模）

开源爱好者，部分证书及荣耀：

- [Certified Jenkins Enginner](/i-get-certified-jenkins-engineer-credential)

- [中国DevOps社区优秀志愿者](https://mp.weixin.qq.com/s/P9kqOk5024aGTHAvNAG_5Q)

- [Jenkins中文社区第二期明星贡献者](https://jenkins-zh.cn/about/star-plan/)

### DevOps缘起

我属于对计算机技术很感兴趣的一类人，乐学善思，喜欢研究，学习能力强，因此涉猎比较广泛，知识面广，经验丰富，能够触类旁通，对新软件新技术能快速上手。

回顾过往，已经工作快9年了。

大学时就喜欢折腾Linux、自学Web开发做网站、搭博客，自学Android开发写App等。（使用HTML5开发浏览器插件，没想到被人收购，卖出了7000元，收获人生第一桶金；Android App也意外上了手机厂商应用商店的编辑推荐。当然这都是过去时了，但想来还是十分激动~）

最早从事纯开发工作，2016年因为工作原因接触到持续集成和Jenkins，最开始只是顺带维护，而后持续集成工作独立，有机会在开发和CI专项团体中抉择。因为工作中依然不减持续学习的兴趣，对新语言、新工具总是想了解和把玩，最终选择成为一名DevOps领域从业者，以后一直从事DevOps相关工作。

DevOps是一种方法论，贯穿一个项目的各个阶段，最完整的DevOps流程，从需求开始，到产品上线，都囊括其中。包含需求管理、缺陷管理、源代码管理、分支策略管理、开发工具集成、开发环境管理、代码检查、编译、打包、测试、部署、监控等等各个方面。

开发出身从事DevOps工作，可以说是游刃有余的。大部分DevOps岗位从业者都是运维出身，不懂代码，发展容易遭遇天花板。在云原生的浪潮下，`基础架构即代码`成为一种趋势。DevOps领域`配置即代码`、`流水线即代码`也已成为事实。开发人员，既能：

- 写代码：轻松驾驭流水线DSL语言（如Jenkins `Pipeline as Code`，基于`Groovy`的DSL语言），编写流水线；

又能：

- 看代码：DevOps流水线中集成的大量工具，大部分都是开源的，有能力查看源码调试和解决问题，是非常大的优势。

---

另一大爱好是学习中华优秀传统文化，汲取古人智慧。

当代的教育，主要是知识的教育。

知识可以创造财富，使人身存，却难以让人心安。

读古书，既是静心，也是修心，更是立志。

无关紧要的事情上则表现地像一个赤子，保持上古天真的状态。

有感而发就写写诗，体验文字之美。

对文字保持敬畏，认为文以载情，文以载道。

总之，做事的时候理性地行动，没事的时候保持一种自然恬适的状态，自得其乐。

---

## 关于本站

### 1、域名

本站域名为 [tangmoying.com](https://tangmoying.com)，[tangming.me](https://tangming.me) 会自动跳转至此。


### 2、公众号
微信公众号名“DevOps持续交付”，ID：`devopscd`，欢迎搜索关注，或扫描下方二维码关注。❤️

![二维码](/assets/img/qrcode_for_devopscd.jpg)


### 内容和栏目介绍

本站文章按 DevOps 全流程组织导航，从需求、编码、构建、测试、发布、部署、监控到反馈，覆盖软件交付全链路。

此外还设有 **DevOps**、**AI** 等专题分类，以及**墨影闲谈**栏目收录文化随笔与日常随想。

<div id="gitalk-container"></div>
<link rel="stylesheet" href="https://unpkg.com/gitalk/dist/gitalk.css">
<script src="https://unpkg.com/gitalk/dist/gitalk.min.js"></script>
<script src="/assets/js/md5.min.js"></script>
<script>
console.log("md5 of location.pathname: " + md5(location.pathname))
var gitalk = new Gitalk({
  clientID: 'd73e98e707bf5f9b582e',
  clientSecret: '803614808dfcf6f46d82d4c723a51fb18c6e3c2e',
  repo: 'gitalk-of-shanyshanb',
  owner: 'hummerstudio',
  admin: ['hummerstudio'],
  id: md5(location.pathname),      // Ensure uniqueness and length less than 50
  distractionFreeMode: false  // Facebook-like distraction free mode
})

gitalk.render('gitalk-container')
</script>
