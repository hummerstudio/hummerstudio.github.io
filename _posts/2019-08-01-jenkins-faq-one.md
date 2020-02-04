---
title: Jenkins常见问题集锦（一）
author: 唐明
categories: [Jenkins]
tags: [Jenkins, Pipeline, Docker]
---
* TOC
{:toc}

# 问题1：Jenkins和Docker怎么结合？

参考：Jenkins和Docker结合可以将容器作为Jenkins的slave节点，有很多优点。比如实现执行环境的统一，slave的自动创建和销毁，免去了人工维护环境的成本等。

# 问题2：写pipeline时，两个stage，第一个随机指定一台机器运行，第二个需要跟第一个在同一台机器上，有什么办法来做吗？

<!--以上为摘要内容-->

参考：设置全局`agent`，每个stage不单独指定agent即可。

# 问题3：项目在Windows和Linux上各编译一部分，然后把Windows上的产物合并到Linux上，如何处理？

参考：可以考虑编译机器固定，或者产物都放到一个固定存放机器，再拿回来。

# 问题4：Pipeline和Jenkins传统类型的任务比有什么优点？

参考：Pipeline一个是单个任务可以多节点，另外代码可以复用，比图形界面点击有效率。配置变成代码了，就可以进行版本化控制，便于管理。

# 问题5：启动Pipeline的时候，希望能够只检出Jenkinsfile文件。
参考：如果说有这种特殊需求，建议把`Jenkinsfile`单独放到一个git库里管理，不和应用源码放一起。

>本文首发在我的微信公众号“左手编程右手文化”上，公众号ID：shanyshanb，欢迎关注。