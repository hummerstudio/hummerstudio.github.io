---
title: MCP 与 CLI：Agent 调用 Tool 的两条路径，谁在侵蚀谁？
author: 唐明
categories: [ai]
tags: [AI, Agent, MCP, CLI, Tool, Function Calling, Token 优化, DevOps]
---

Agent 调用外部工具，大方向上有两条路：MCP 和 CLI。MCP（Model Context Protocol）是 Anthropic 在 2024 年底推出的标准化协议，目标是给 Agent 提供一套统一的方式来接入各种第三方服务。CLI 就是命令行——`kubectl get pods`、`git diff`、`docker ps`，Agent 直接执行命令，拿到输出。很多人下意识觉得 MCP 是更“高级”的方案——标准化、类型安全、动态发现，听起来就很先进，应该会逐渐取代粗糙的 CLI 调用。但实际情况刚好相反：CLI 正在反向侵蚀 MCP 的份额。这篇文章聊聊为什么。

<!--以上为摘要内容-->

## 一、MCP 的理想：一个标准，连接一切

先理解 MCP 想解决什么问题。

在 MCP 出现之前，让 Agent 接入一个新服务，你得做四件事：写一个 Tool 的定义（描述 + 参数 schema）、写执行逻辑、写错误处理、把 Tool 注册到 Agent。每接一个服务都来一遍。十个服务就是十份胶水代码。

MCP 的思路是：**定义一套标准协议，服务的提供方写一个 MCP Server，Agent 框架写一个 MCP Client，两者通过标准协议通信。** 你作为开发者不需要写胶水代码——Agent 通过 MCP 协议动态发现 Server 提供的能力，直接调用。

举个例子：GitHub 有一个 MCP Server，暴露了 `search_repositories`、`create_issue`、`get_pr` 这些工具。Agent 接入这个 MCP Server 之后，马上就“会”操作 GitHub 了——不需要你写任何代码。

```json
// MCP 工具定义示例——每个工具都有完整的 schema
{
  "name": "create_issue",
  "description": "Create a new GitHub issue in a repository",
  "inputSchema": {
    "type": "object",
    "properties": {
      "owner": { "type": "string", "description": "Repository owner" },
      "repo": { "type": "string", "description": "Repository name" },
      "title": { "type": "string", "description": "Issue title" },
      "body": { "type": "string", "description": "Issue description body" }
    },
    "required": ["owner", "repo", "title"]
  }
}
```

标准化、类型安全、动态发现——三个关键词看起来无懈可击。加上 Anthropic 和多家 AI 公司的背书，MCP 很快成了 Agent 工具调用的“正确选择”。

## 二、MCP 的现实：Token 账单比想象中贵得多

MCP 的标准化是有代价的。每个 Tool 都需要带着完整的描述和参数 schema 驻留在 System Prompt 中。上面那个 `create_issue` 的例子，不算太长——400 个 Token 左右。但一个完整的 MCP Server 通常有十几到几十个 Tool。

一个 GitHub MCP Server 暴露 20 个工具，平均每个 400 Token，这就是 8000 Token——**还没开始干活，System Prompt 就被占掉了 8000 Token。**

而且这些 Token 是每轮对话都要消耗的。不是用哪个加载哪个——所有 Tool 的定义都在 System Prompt 里，每次都带着。一个支持 50 个工具的 MCP Server，System Prompt 里光 Tool 定义就轻轻松松两万 Token 以上。

更麻烦的是：**这些定义跟你的实际任务可能毫无关系。** 你让 Agent “改个配置文件”，Agent 根本不需要知道 `create_issue` 和 `list_milestones` 的定义，但这些定义照样出现在 System Prompt 里，挤占本可以给文件上下文和对话历史的空间。

这还没算 MCP Server 本身的运维成本。跑一个 MCP Server 需要额外的进程、额外的网络开销、额外的认证管理。一个简单的 `git diff`，走 CLI 是一条命令，走 MCP 是“Agent → MCP Client → MCP Server → 本地 Git 命令 → 返回结果”——链路长了好几倍。

## 三、CLI 的回归：为什么模型“天生就会”命令行

MCP 的 Token 消耗问题让大家重新审视 CLI 这个“老方案”。结果发现，CLI 在 Agent Tool 调用中有一个 MCP 不具备的根本优势：**模型在训练的时候已经大量学习过这些命令了。**

GPT-4、Claude、Qwen、DeepSeek——任何一个主流模型，训练数据里都包含海量的 Shell 脚本、命令行教程、运维手册。`kubectl`、`git`、`docker`、`curl`、`grep`——这些命令的语法、参数、典型用法，模型已经内化了。

这意味着：**你不需要告诉模型“kubectl get pods 是什么意思、怎么用”。模型自己知道。** 你只需要给 Agent 一个 `execute_shell` 的 Tool，它在需要时会自己构造出合适的命令。

对比一下 Token 消耗：

| 调用方式 | System Prompt 占用 | 单次调用额外 Token |
|---------|-------------------|-------------------|
| MCP（全套工具） | 15,000~25,000 Token（所有 Tool 定义） | 少量（结果结构化返回） |
| CLI（一个 Shell Tool） | ~200 Token（一个 Tool 定义） | 少量（命令输出文本） |

差了两个数量级。而且 MCP 的 Token 消耗是**固定的**——不管这次对话用不用这些 Tool，定义都在 System Prompt 里。CLI 的 Token 消耗是按需的——只在你实际调用命令时才消耗。

这就是为什么 CLI 在反向侵蚀 MCP 的份额。不是 CLI 更好，是 CLI 更省。而在 Token 就是钱的今天，“更省”本身就是生产力。

## 四、但 CLI 也不是完美的

CLI 省 Token，但也有它自己的问题。

**输出不可控。** Agent 执行 `kubectl get pods -o json`，输出可能是 500 行的 JSON——包括一堆 Agent 不需要的 metadata、status 细节、managedFields 等等。这些信息塞进上下文，又是一笔 Token 开销。MCP 的返回通常经过 Server 端过滤，只返回结构化后的关键字段——在返回值的“信息密度”上，MCP 更好。

**错误处理粗糙。** CLI 的输出就是 stdout + stderr + exit code。Agent 需要自己解析“命令为什么失败”。MCP Server 可以在错误发生时就给出结构化的错误信息，方便 Agent 理解问题所在。

**安全边界模糊。** 给 Agent 一个通用的 `execute_shell` Tool，等于给了它整个文件系统和所有可执行命令的访问权。你没法说“Agent 可以跑 `git` 命令但不能跑 `rm -rf`”——Shell Tool 不区分。MCP 可以做到细粒度的权限控制。

**参数组合靠 Agent “猜”。** `kubectl` 的参数多如牛毛，模型虽然“会”，但复杂的参数组合（比如用一个特定格式获取特定命名空间的特定资源的特定字段）可能会出错。MCP 的类型安全约束能防止这类错误。

所以 CLI 的回归不等于 MCP 的消亡。只是它们各自适合不同类型的场景。

## 五、怎么选：一张决策表

| 场景 | 推荐 | 原因 |
|------|------|------|
| 日常 Git 操作（diff、log、commit） | CLI | 模型已内化，Token 极省 |
| kubectl / docker 常用操作 | CLI | 命令行用法模型训练时大量见过 |
| 复杂 GitHub API（Issue 管理、PR review） | MCP | 多参数、多步骤、需要类型安全 |
| 数据库查询 | MCP | 需要连接管理、结果结构化、权限控制 |
| 监控告警（Prometheus / Grafana） | 视情况 | 简单查询用 CLI（`curl`），复杂配置用 MCP |
| 内部自建服务 | MCP | 没有现成 CLI，MCP 是标准化的接入方式 |
| 一次性脚本和文本处理 | CLI | Agent 自己写 Shell 脚本执行，灵活高效 |

一个实用原则：**先用 CLI 试试，遇到 CLI 搞不定的再上 MCP。** 不要一上来就假设“MCP 更好”。MCP 的 Token 开销是上线就有的，CLI 的 Token 开销是按需的——先用便宜的方案，不够再加，这是工程上最务实的路径。

## 六、小结

MCP 和 CLI 之间的关系，跟很多人直觉想象的正好相反。不是“标准化的 MCP 取代粗糙的 CLI”，而是“轻量的 CLI 用事实证明了自己在大部分场景下已经够好，正在把 MCP 挤回它真正必要的几个使用场景”。

这不是坏事。技术的演进本来就是这样——不是所有“高级”方案都能活下去，能活下来的是性价比最高的方案。MCP 在复杂第三方服务的标准化接入上有不可替代的价值，但在大量日常运维和开发场景中，CLI 靠“模型已内化 + 零额外 Token 成本”这两个优势，证明了它才是最务实的 Tool 调用方式。

三篇文章下来——Tool、Skill、MCP 与 CLI——其实在讲同一件事：**Agent 工程是一个做减法的过程。** Tool 不是越多越好，Skill 不是越多越好，Tool 的调用方式也不是越“高级”越好。克制、务实、理解每一层的取舍——这才是 Agent 开发的正确姿势。

每天前进一小步，就是一个新的高度！
