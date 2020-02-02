---
layout: page
title: 关于
permalink: /about/
icon: octicon-heart
---

<h2>关于 - 我</h2>
<p>唐明，一名九零后，工作5年，目前人在珠海。</p>
<p>正式工作先后做过J2EE开发、大数据开发工程师、CIE（持续集成工程师），带过团队。</p>
<p>目前为一名DevOps开发工程师，主要做Jenkins的二次开发及运维工作，专注于DevOps&持续集成&持续交付领域相关技术栈。</p>
<a href="https://jenkins-zh.cn/about/star-plan/" target="_blank"><p>Jenkins中文社区第二期明星贡献者。</p></a>
<p>中国DevOps社区·内容运营组成员</p>
<p>属于对计算机技术很感兴趣的一类人，乐学善思，喜欢研究，学习能力强，因此涉猎比较广泛。在校时即折腾过Win32图形界面开发、浏览器插件开发、J2EE博客系统开发、Android应用开发等，知识面广，经验丰富，能够触类旁通，对新软件新产品能快速上手。
<p>目前使用的主要编程语言：Python、Groovy、Java。</p>
<p><e>另一大爱好是学习中华优秀传统文化，汲取古人智慧。</e></p>
<p>当代的教育，主要是知识的教育。</p>
<p>知识可以创造财富，使人身存，却难以让人心安。</p>
<p>读古书，既是静心，也是修心，更是立志。</p>
<p>行事上更像一个老干部（这个评价来自于一个相亲对象，我还是比较喜欢的），而不是一个程序员。</p>
<p>无关紧要的事情上则表现地像一个赤子，保持上古天真的状态。</p>
<p>有感而发就写写诗，体验文字之美。</p>
<p>对文字保持敬畏，认为文以载情，文以载道。</p>
<p>总之，做事的时候理性地行动，没事的时候保持一种自然恬适的状态，自得其乐。</p>
<h2>工作、生活态度</h2>
<p>入世干活，出世生活。</p>
<p>尽心尽力建设美好社会，</p>
<p>天席地被感受自然滋味。</p>
<p>----------</p>
<p>工作高效率，生活慢悠悠。</p>
<p>没事看看书，看看电影，种种菜，做做饭。自给自足，自得其乐。</p>
<p>喜欢精致的生活，但不喜欢小资的生活。</p>
<p>我指的精致，是用心，物质上少但足、少但精，断舍离，极简主义。</p>
<p>我指的小资，是偏于物质，虚于表面，自身财力不及，又极力想展现给他人的虚荣姿态。</p>
<h2>关于 - 本站</h2>
<p>域名和微信公众号ID相同，均为 `shanyshanb`，是善有善报的拼音和简称。</p>
<p>下面是公众号二维码，公众号名“左手编程右手文化”，欢迎扫描关注。❤️</p>
<img src="/assets/img/shanyshanb_qrcode.jpg"/>
<p>注册这个域名，是因为近期打算写2个开源项目，却被包名怎么起难住来，然后就想起了微信公众号的ID，一查com域名没有被注册，于是赶紧下手了！</p>
<h2>关于 - 内容和栏目介绍</h2>
<p>目前网站刚刚建立，内容计划和公众号一样，有技术类的，也有文化/文学类的。</p>
<p>技术类的会按照软件产品的名称来做分类。</p>
<p>文化/文学类的还未想好，等有一些博文后再做分类。主要目的是分享和交一些志同道合的朋友。</p>
<p>【明哥讲道】：主要讲一些和正统华夏文化相关的内容，主要为道、儒、法、墨、医、兵六家的内容。</p>
<p>【代码如诗】：代码有理，也有文。编程语言也是语言，语言自然有其通于文学的一面。</p>
<p>【文字】：自己的日常随想、思维闪光与火花，低级的打油诗等等。</p>
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