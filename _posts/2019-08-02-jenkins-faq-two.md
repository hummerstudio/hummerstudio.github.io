---
title: Jenkins常见问题集锦（二）
author: 唐明
categories: [Jenkins]
tags: [Jenkins, Pipeline, Blue Ocean, Python, Groovy]
---
* TOC
{:toc}

# 问题6：Blue Ocean和Jenkins是什么关系？

参考：通俗理解，Blue Ocean可以看作是Jenkins推出的新的UI界面，有更现代的外观和更好的交互。

当然最重要的还是对Jenkins 2.x推出的新的流水线任务类型的支持，可以清晰展示整个流水线（Pipeline）各个阶段（stage）的串并行关系和状态。

<!--以上为摘要内容-->

Blue Ocean是以插件的形式实现的，只要在Jenkins插件中心安装“Blue Ocean”插件即可。安装之后在经典UI界面，点击左侧的“打开 Blue Ocean”来访问新界面。

# 问题7：在共享库里面写的stage，能不能显示在Blue Ocean的界面上？

参考：可以。

# 问题8：怎么看Jenkins上的Groovy版本？比如我登录服务器，可以执行groovy --version来看服务器安装的Groovy版本。

参考：可以在`${JENKINS_HOME}/war/WEB-INF/lib`目录下面找到groovy对应的jar包。jar包名称上可以看到版本号。

# 问题9：Jenkins pipeline在一个stage里面执行bat指令，里面set一个变量，有办法在下一个stage的bat指令里获取这个变量的吗？通过groovy插值可以在bat里面获取groovy定义的变量，但能保存bat里面的变量到groovy吗？

参考：set定义的变量，本次bat命令结束生命周期就结束了，无法在下一个`stage`的bat命令里获取。就算是同一个`stage`，分开写2个bat命令，后一句也不能获取到前一句定义的变量值。这种情况，建议先将需要的信息写入到文件，再从文件中读取。如果两个stage在不同的节点上执行，中间再加一步归档文件的操作即可。

# 问题10：有没有python的库可以操作jenkins？

参考：有两个。一个叫`python-jenkins`，一个叫`jenkinsapi`。前者老一点，后者新一些。可以根据自己的爱好和功能需求选择合适的。

<https://pypi.org/project/python-jenkins/>

<https://pypi.org/project/jenkinsapi/>

>本文首发在我的微信公众号“左手编程右手文化”上，公众号ID：shanyshanb，欢迎关注。