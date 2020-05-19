---
title: Jenkins常见问题集锦（四）
author: 唐明
categories: [Jenkins]
tags: [Jenkins, Pipeline]
---
* TOC
{:toc}

# 问题16：设置超时时间能够用Pipeline代码实现吗？

参考：可以。如以下代码，表示设置超时时间1小时，在流水线全局和阶段（stage）级别都可以设置：

```
options {
  timeout(time: 1, unit: 'HOURS')
}
```

# 问题17：有什么可以监控Jenkins配置变化的插件吗？

<!--以上为摘要内容-->

参考：有。jobConfigHistory插件，可以监控、对比Jenkins任务配置的变化。原理上是对比对应的config.xml。
而对于Pipeline类型的任务，一般都是配置代码库，并指定Jenkinsfile文件位置。
这样的话即便修改了Jenkinsfile的内容，对应的config.xml也是不会变化的。
为了解决这个问题，就有了另外一个插件——Pipeline Configuration History，它不仅能够追踪Jenkinsfile，还可以追踪全局共享库的变化，非常全面。

# 问题18：邮件无法发送成功？

参考：原因有多种，一个比较常见的原因是系统配置页面中的“系统管理员邮件地址”没有配置的邮件发件人一致，容易忽略。

# 问题19：Jenkins有中文社区吗？

参考：有。官网：https://jenkins-zh.cn  目前还在建设中，欢迎多贡献代码、提PR，以及反馈意见建议。

# 问题20：有些时候从任务日志里面看不出来错误原因？

参考：可以试试看一下Jenkins系统日志，这里也藏着很多告警和错误信息，是个定位问题的好地方，一般人都不知道哦。路径：首页-系统管理-系统日志-所有系统日志。

>本文首发在微信公众号“DevOps持续交付”上，公众号ID：devopscd，欢迎关注。