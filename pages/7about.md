---
layout: page
title: 关于
permalink: /about/
icon: octicon-heart
isNavItem: true
---

## 关于博主

姓名：唐明

92年生，目前人在珠海。

先后做过J2EE开发、大数据开发工程师、持续集成工程师，有10+规模团队管理经验。某上市集团公司高级软件工程师。

目前为一名DevOps开发工程师，开发某行基于Jenkins的DevOps平台，专注于DevOps&持续集成&持续交付领域相关技术栈。

公众号DevOps持续交付（ID：devopscd）号主。

[Certified Jenkins Enginner](/i-get-certified-jenkins-engineer-credential)

[中国DevOps社区优秀志愿者](https://mp.weixin.qq.com/s/P9kqOk5024aGTHAvNAG_5Q)

[Jenkins中文社区第二期明星贡献者](https://jenkins-zh.cn/about/star-plan/)

属于对计算机技术很感兴趣的一类人，乐学善思，喜欢研究，学习能力强，因此涉猎比较广泛，知识面广，经验丰富，能够触类旁通，对新软件新技术能快速上手。

目前使用的主要编程语言：Python、Groovy、Java。

---

另一大爱好是学习中华优秀传统文化，汲取古人智慧。

当代的教育，主要是知识的教育。

知识可以创造财富，使人身存，却难以让人心安。

读古书，既是静心，也是修心，更是立志。

无关紧要的事情上则表现地像一个赤子，保持上古天真的状态。

有感而发就写写诗，体验文字之美。

对文字保持敬畏，认为文以载情，文以载道。

总之，做事的时候理性地行动，没事的时候保持一种自然恬适的状态，自得其乐。

### 工作、生活态度

入世干活，出世生活。

尽心尽力建设美好社会，

天席地被感受自然滋味。

---

工作高效率，生活慢悠悠。

闲暇看看书，看看电影，种种菜，做做饭，自得其乐。

喜欢精致的生活，但不喜欢小资的生活。

我指的精致，是用心，物质上少但足、少但精，断舍离，极简主义。

我指的小资，是偏于物质，虚于表面，自身财力不及，又极力想展现给他人的虚荣姿态。

## 关于本站

域名和微信公众号ID相同，均为`shanyshanb`，是善有善报的拼音和简称。

微信公众号名“左手编程右手文化”，欢迎扫描关注。❤️下面是二维码：

![二维码](/assets/img/shanyshanb_qrcode.jpg)

注册这个域名，是因为近期打算写2个开源项目，却被包名怎么起难住来，然后就想起了微信公众号的ID，一查com域名没有被注册，于是赶紧下手了！

### 内容和栏目介绍

目前网站刚刚建立，内容计划和公众号一样，有技术类的，也有文化/文学类的。

技术类的会按照软件产品的名称来做分类。

文化/文学类的还未想好，等有一些博文后再做分类。主要目的是分享和交一些志同道合的朋友。

【中华文化】/【明哥讲道】：主要讲一些和正统华夏文化相关的内容，主要为道、儒、法、墨、医、兵六家的内容。

【代码如诗】：代码有理，也有文。编程语言也是语言，语言自然有其通于文学的一面。

【文趣】：自己的日常随想、思维闪光与火花，低级的打油诗等等。

其他：技术类文章。按照语言、技术、产品的角度命名。

[点击这里](/category)按分类查看文章。

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