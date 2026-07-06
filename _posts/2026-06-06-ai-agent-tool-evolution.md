---
title: Agent 的“手脚”——Tool 的能力边界与进化史
author: 唐明
categories: [ai]
tags: [AI, Agent, Tool, Function Calling, Computer Use, Browser Use, MCP, CLI]
---

大模型再聪明，不能和外部世界交互，也只是一个会说话的脑袋。聊聊天、写写诗、帮你改个函数——这些都还在“输出文本”的范畴里。但一旦你要让 Agent 做点实际的事——部署一个服务、查一下数据库、打开浏览器帮你填个表单——它就必须有“手”。在 Agent 的术语里，这只“手”就叫 Tool。从最早期的文件读写，到今天的 Computer Use 和 Browser Use，Tool 的能力边界一直在向外扩张。这篇文章梳理一下 Tool 的进化历程，以及在这个过程中，哪些东西始终没变。

<!--以上为摘要内容-->

## 一、Tool 是什么：函数调用不是“调用”，是“翻译”

聊 Tool 之前，得先搞清楚一件事：**大模型不会“调用”任何东西。**

你让 Agent “查一下天气”，Agent 并不会真的打开浏览器去查。它做的事情其实很简单——输出一段 JSON：

```json
{
  "name": "get_weather",
  "arguments": {
    "city": "北京"
  }
}
```

然后由宿主程序（比如 Hermes、ChatGPT 的 backend、你的 Python 脚本）去真正执行这个函数，把结果带回给模型，模型再基于结果给你一个自然语言的回复。

这个机制叫 **Function Calling**。名字有误导性——它本质上是“模型输出结构化的意图表达，宿主程序负责执行”。模型是大脑，Tool 是手脚，Function Calling 是神经信号。

理解这一点很重要，因为它解释了 Tool 的核心设计原则：**Tool 的质量不取决于它的功能多强大，而取决于它的“意图表达”有多清晰。** 一个 Tool 的描述、参数定义、返回值格式——这些决定了 Agent 能不能正确地“使用”它。一个写得烂的 Tool（描述模糊、参数名随意、返回值一团 JSON），跟一个断了神经的手没什么区别——再强壮也动不了。

## 二、Tool 的进化：从读写文件到操控世界

Tool 的形态经历了几个阶段。不是“新版本取代旧版本”，而是**能力边界在不断外扩**——就像人类工具从石斧到电钻不是替代，是能处理的事情越来越多了。

### 2.1 第一代 Tool：读写文件

最早的 Tool 几乎每个 Agent 框架都默认提供：读文件、写文件、执行 Shell 命令。

```json
// 最早的 Function Calling —— 简单直接
{
  "name": "write_file",
  "arguments": { "path": "/app/config.yaml", "content": "..." }
}
```

这个阶段的特点是：**Tool 能做的基本就是“把文字写下来”**。改代码、生成配置文件、写一个脚本——本质上都是文本生成 + 文件写入的组合。

这已经够解决很多问题了。你日常用 Hermes 让它帮你改个 Bug，它做的无非是：读文件（理解上下文）、输出修改方案、写回去。但对于“需要和外部系统交互”的场景，文件读写就不够了。

### 2.2 第二代 Tool：Web 请求与 API 调用

第二阶段的 Tool 开始突破“本地文件”的边界——**Agent 能直接调用外部 API 了。**

```json
{
  "name": "call_api",
  "arguments": {
    "method": "GET",
    "url": "https://api.example.com/v1/services",
    "headers": { "Authorization": "Bearer xxx" }
  }
}
```

这背后是 web_fetch、Shell 命令执行等一系列“对接外部系统”的 Tool。Agent 不再只是“在本地写文件”——它能查 API、跑数据库查询、触发 CI/CD 流水线，只要 Shell 能做的事，Agent 都能做。

这个阶段的 Tool 已经足够支撑“DevOps AI 化”的核心场景了：Agent 能操盘 CI/CD 全流程，从代码仓库到构建服务器到部署集群。

### 2.3 Tool 的标准化：MCP 如何让 Tool 从“厂商内置”走向“生态共建”

前面聊的两代 Tool——文件读写、Web 请求、Shell 执行——基本都是 Agent 厂商自己内置的。厂商的开发团队定义 Tool 的 schema、写执行逻辑、打包进产品里。在早期这没什么问题，因为 Tool 种类少、场景集中。

但问题很快就来了：**需要对接的外部平台太多了。** 数据库有 MySQL、PostgreSQL、MongoDB、Redis……云平台有 AWS、Azure、GCP、阿里云……监控有 Grafana、Prometheus、Datadog……协作工具有 Slack、Jira、Confluence……每个平台都有自己的 API、自己的认证方式、自己的数据格式。厂商不可能把所有这些都内置进去——不是不想，是不可能。

在没有标准化协议之前，如果你想给 Agent 加一个“查 Datadog 监控”的能力，要么等厂商支持（大概率不会），要么自己写胶水代码把 Datadog API 包成 Agent 能理解的 Tool。而且每家厂商的 Tool 定义方式还不一样——你在 Claude Code 里写好的 Tool，拿到 Hermes 里不能用，反过来也一样。Tool 和 Agent 平台是**强耦合**的。

这就是 **MCP（Model Context Protocol）** 要解决的问题。MCP 是一套标准化的 Tool 描述协议——它定义了 Tool 的“通用语言”：每个 Tool 有名称、描述、参数 schema、返回格式。不管是哪个 Agent 平台，只要支持 MCP，就能理解并调用任何实现了 MCP 的 Tool Server。Tool 的开发者和 Agent 平台的开发者从此可以**各自独立工作**——用标准协议对接即可。

这个变化的意义在于：**Tool 的生态从“厂商内置”变成了“社区共建”。** 以前是你等 Anthropic 给 Claude Code 加 Kubernetes Tool，现在是社区开发者写一个 MCP Server，所有支持 MCP 的 Agent 都能用。Datadog、Grafana、Slack、Jira——只要有人写一个 MCP Server，Agent 就能接上。厂商不需要内置这些 Tool，只需要做好 MCP 协议的适配——这就是标准化带来的解耦。

### 2.4 第三代 Tool：Computer Use——让 Agent 操控桌面

如果说前两代的 Tool 是在“有接口的系统”上操作，那 Computer Use 就进入了“有界面的系统”——**Agent 能像人一样使用桌面软件了。**

Anthropic 在 2024 年底推出了 Computer Use 能力。它的原理是：Agent 能看到屏幕截图，然后输出鼠标点击、键盘输入、滚动的操作指令，宿主程序执行这些操作后，再给 Agent 新一帧截图。

```json
{
  "action": "left_click",
  "coordinate": [450, 320]
}
```

这跟前面的 Tool 有什么本质区别？前面的 Tool 操作的是“被设计成可编程的接口”——API 有文档、参数有类型、返回值有格式。Computer Use 操作的是“给人用的界面”——没有文档、没有 schema、输出就是一张图。Agent 必须**看**、**理解**、**决策**、**执行**——每一步都是视觉理解和推理的组合。

这个能力对于 DevOps 场景的意义在于：**不是所有系统都有 API。** 你企业里可能有一台 15 年前的服务器，管理界面就是一个 Web 控制台，没有任何 API。以前你只能手动操作，现在 Agent 能帮你操作——虽然不太优雅，但已经能用了。

Computer Use 目前还不够稳定（每一步的延迟、视觉识别的准确率、复杂界面的稳定性都在改善中），但方向是明确的：**Agent 的能力边界正在从“可编程的世界”扩展到“可视的世界”。**

### 2.5 第四代 Tool：Browser Use——Web 自动化的新形态

Browser Use 可以看作是 Computer Use 在 Web 领域的特化版本。它让 Agent 能打开浏览器、浏览网页、点击按钮、填写表单、下载文件——完成一套完整的 Web 交互流程。

和传统的 Web Scraping 有什么区别？Scraping 是预设规则的（“找到 .price 这个 class，提取文本”），Browser Use 是 Agent 自主决策的（“我要找到价格，看看页面上哪个元素像价格”）。规则写死的东西，页面改版就坏了；Agent 基于语义理解去找，容错性和泛化性强得多。

举个例子：你在排查一个线上问题，需要登录 Grafana 查看某个服务的 CPU 趋势、然后把截图发到群里。以前这是三件事——登录 Grafana、截图、在聊天工具里贴图——每件事都需要人来做。有了 Browser Use，Agent 可以一次性完成：打开 Grafana → 导航到对应 Dashboard → 设置时间范围 → 截图 → 发送到消息通道。

Browser Use 背后通常用 Playwright 或 Puppeteer 驱动浏览器，但关键区别在于**谁来写控制逻辑**——不再是开发者写死定位器和操作序列，而是 Agent 根据自然语言指令实时“看懂”页面并决定下一步做什么。

## 三、四个阶段的关系：不是替代，是能力外扩

把这四代 Tool 放在一起看：

| 阶段 | 操作对象 | 交互方式 | 代表场景 | 稳定性 |
|------|---------|---------|---------|--------|
| 文件读写 | 本地文件系统 | 结构化 IO | 改代码、写配置、生成文档 | ★★★★★ |
| Web/API 调用 | 外部服务的 API | 结构化请求/响应 | 调用 REST API、执行 Shell 脚本、CI/CD 自动化 | ★★★★☆ |
| Computer Use | 桌面应用界面 | 截图 + 鼠标/键盘 | 操控无 API 的遗留系统 | ★★★☆☆ |
| Browser Use | 网页界面 | DOM + 视觉 + 点击 | Web 自动化、数据采集、监控截图 | ★★★☆☆ |

一个关键规律：**越往右，Tool 的操作越“像人”；越往左，Tool 的操作越“像程序”。** “像人”意味着更通用但更不稳定，“像程序”意味着更专用但更可靠。

所以在实际工程中，Tool 的选择原则是：**能用文件读写解决的不调 API，能调 API 的不上 Computer Use。** 不是越高级越好——Computer Use 听起来酷，但每步操作的延迟和失败率远高于一个稳定的 API 调用。选择最“像程序”的方案，直到那个方案不够用，再往“像人”的方向走一步。

## 四、Tool 不是越多越好

写完进化历程，必须说一个反直觉的点：**Tool 不是越多越好。**

很多 Agent 开发者的直觉是：多装 Tool，Agent 能力就更强。就像给瑞士军刀加功能——多一把小刀、多一个开瓶器、多一个镊子——感觉总是好的。

但 Agent 的 Tool 和瑞士军刀有一个根本区别：**瑞士军刀的工具是物理上独立的，Agent 的 Tool 全部塞在上下文里。** 每多一个 Tool，System Prompt 里就多一段描述、多一套参数定义。当 Tool 数量上去了，Agent 需要在这些 Tool 之间“挑选”——这个过程本身消耗 Token、消耗推理时间、增加选错的可能性。

更糟的是：**Tool 之间可能互相干扰。** 你做 JSON 验证的 Tool 叫 `validate_json`，查天气的 Tool 叫 `get_weather`，看起来各管各的。但 Agent 在处理“用户请求”时，需要判断“这个请求属于哪个 Tool 的职责范围”。如果描述写得不够精确，Agent 可能把“帮我检查这个配置文件”路由到 `get_weather`——因为配置文件里恰好提到了“部署在云上”，而 Agent 的推理链把“云”和“天气”关联起来了。

所以 Tool 的设计原则不是“越多越好”，而是**“刚好够用”**。给 Agent 的 Tool 应该正好覆盖你需要它做的事情，再多一个都是干扰。

## 五、小结

从文件读写到 Browser Use，Tool 形态的变化折射出 Agent 能力边界的持续扩展。但无论 Tool 的形态怎么变，有几个原则始终没变：

1. **Tool 的本质是“意图翻译”**，Agent 不会真的执行，它只是输出结构化指令。描述越清晰，Agent 用起来越稳。
2. **Tool 的选择越“像程序”越可靠**，在稳定性要求高的场景（比如 DevOps 自动化），优先用 API/CLI，Computer Use 作为最后手段。
3. **Tool 不是越多越好**，每个 Tool 都是对 Context 的占用和对推理的干扰。精减到刚好够用，才是最优解。

下一篇，我们聊一个经常被误解的概念——Skill。Skill 不是 Tool 的兄弟，它是另一层的东西。

每天前进一小步，就是一个新的高度！
