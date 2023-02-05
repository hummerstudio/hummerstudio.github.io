---
title: 统计Ant目标（Target）执行时间
date: 2023-01-09
categories: [Ant]
tags: [Ant]
---
* TOC
{:toc}

介绍两种方式。

<!--以上为摘要内容-->

一、使用`antcontrib`提供的`listener`
命令示例：
```
ant main -listener net.sf.antcontrib.perf.AntPerformanceListener
```
统计数据输出到文件（可选）：`-Dperformance.log=/tmp/performance.log `

输出示例：
```
Buildfile: D:\ant-test\build.xml

hello:
     [echo] 你好

main:
     [echo] 世界

BUILD SUCCESSFUL
Total time: 0 seconds

Statistics:
-------------- Target Results ---------------------
demo.main: 0.000 sec
demo.hello: 0.006 sec

-------------- Task Results -----------------------
demo.main.echo: 0.000 sec
demo.hello.echo: 0.006 sec
demo.<implicit>.path: 0.016 sec
demo.<implicit>.property: 0.089 sec

-------------- Totals -----------------------------
Start time: 星期二, 9 八月 2022 11:31:04.365
Stop time: 星期二, 9 八月 2022 11:31:04.588
Total time: 0.223 sec
```

二、使用`ProfileLogger`
```
ant main -logger org.apache.tools.ant.listener.ProfileLogger
```

效果：
```
property: started Tue Aug 09 11:21:18 CST 2022

property: finishedTue Aug 09 11:21:18 CST 2022 (78ms)

property: started Tue Aug 09 11:21:18 CST 2022

property: finishedTue Aug 09 11:21:18 CST 2022 (2ms)

property: started Tue Aug 09 11:21:18 CST 2022

property: finishedTue Aug 09 11:21:18 CST 2022 (0ms)

property: started Tue Aug 09 11:21:18 CST 2022

property: finishedTue Aug 09 11:21:18 CST 2022 (1ms)

property: started Tue Aug 09 11:21:18 CST 2022

property: finishedTue Aug 09 11:21:18 CST 2022 (1ms)

property: started Tue Aug 09 11:21:18 CST 2022

property: finishedTue Aug 09 11:21:18 CST 2022 (1ms)

path: started Tue Aug 09 11:21:18 CST 2022

path: finishedTue Aug 09 11:21:18 CST 2022 (18ms)

Target hello: started Tue Aug 09 11:21:18 CST 2022

echo: started Tue Aug 09 11:21:18 CST 2022
     [echo] 你好

echo: finishedTue Aug 09 11:21:18 CST 2022 (5ms)

Target hello: finishedTue Aug 09 11:21:18 CST 2022 (7ms)

Target main: started Tue Aug 09 11:21:18 CST 2022

echo: started Tue Aug 09 11:21:18 CST 2022
     [echo] 世界

echo: finishedTue Aug 09 11:21:18 CST 2022 (1ms)

Target main: finishedTue Aug 09 11:21:18 CST 2022 (2ms)

BUILD SUCCESSFUL
Total time: 0 seconds
```