---
title: 本地大模型实践（二）：OpenCode——终端里的开源 AI 编程助手
author: 唐明
categories: [ai]
tags: [AI, OpenCode, AI编程, 开源替代, Claude Code, 内网部署, LSP]
---

上一篇文章我们在内网搭好了 AI 基础设施——Ollama 跑模型、vLLM 提性能、Open WebUI 给界面。有了这套底层能力之后，第一个实际问题就是：开发人员用什么工具来接入 AI 能力？公网上有 Cursor、有 Claude Code、有 GitHub Copilot，但如果你在内网，或者不想把代码交给第三方，这些工具都用不了。这时候你需要一个开源替代。

<!--以上为摘要内容-->

## 一、为什么一个 DevOps 工程师要研究 AI 编程工具

我是一名 DevOps 工程师。按常理说，AI 编程工具是开发人员的事——它怎么补全代码、怎么生成函数，跟管流水线、管部署的人关系不大。但 2025 年以来，我开始密切关注这个领域，原因不是“AI 能写代码”这件事本身，而是两件事让我感到不安。

**第一，开发人员正在大规模使用 AI 工具，但这些工具跑在 DevOps 的管控范围之外。** 你用 Cursor、用 Copilot、用 Claude Code——每一次和 AI 的对话、每一段被发送到外部服务器的代码、每一个 Prompt 里的业务信息，对于 DevOps 团队来说都是黑盒。没有日志、没有审计、没有使用策略。你知道团队在用 AI，但不知道用了多少、问了什么、数据去了哪里。

**第二，AI 工具正在反向调用 DevOps 基础设施。** 通过 MCP 协议或 CLI，一个终端里的编程 Agent 可以直接获取Jira问题单信息、提交代码到 Gitlab、创建Gitlab Merge Request，触发 Jenkins 构建等；这意味着 Jira、GitLab、Jenkins 这些基础研发服务，开发人员不需要经过统一的 DevOps 平台就能触达。而他们使用的 AI 工具，却不在企业的控制范围之内。

这就是我理解的“DevOps 左移”在这个语境下的真实含义：**开发人员获得了前所未有的能力触达范围，但 DevOps 的管控却没有跟着一起左移。** 这个能力缺口如果不补上，传统的研发治理体系就会被绕过。

带着这个问题，我开始研究开源 AI 编程工具。我的目标不是找一个“免费的 Copilot 替代品”，而是找一个**能在调用 AI 的路径上插入管控层的工具**——比如在 API 请求发出前存档提示词数据、记录使用频率、执行安全策略。开源工具意味着可以改代码、加中间件，这是闭源产品做不到的。

OpenCode，就是我找到的第一个答案。

## 二、闭源 AI 工具的管控难题

目前团队里最常用的 AI 编程工具，面临三个管控层面的问题：

**第一，黑盒运行。** Cursor、Copilot、Claude Code——这些工具把 AI 交互封装在内部。你的开发者每天在和 AI 对话，但作为 DevOps 负责人，你不知道他们问了多少次、问了什么、哪些 Prompt 里带了内部代码或敏感数据。AI 的使用在团队里是一个“事实存在但不可见”的状态。

**第二，数据流向不可控。** Cursor 会把代码片段发送到 Anthropic 或 OpenAI 的服务器做推理；Copilot 的数据流经 GitHub 的基础设施。虽然这些厂商都有隐私承诺，但对于金融、政务等有硬性合规要求的场景，数据离开内网本身就是风险，不管厂商承诺了什么。

**第三，持续付费。** Cursor $20/月、Copilot Enterprise $39/月、Claude Code 按 API Token 计费——个人用还好，团队规模一上来，年账单可观。而且你始终在租用能力，不拥有它。

所以问题不是“有没有一个便宜又好用的 AI 编程工具”——Copilot 现在也支持自定义模型了，Claude Code 能力也很强。真正的问题是：**有没有一个工具，让你能在 AI 调用链路上插入自己的管控层？** 比如在请求发到模型之前，先过一道日志存档、一道敏感信息脱敏、一道使用频率统计？

这就是开源的不可替代之处——你可以改代码。OpenCode 给了你这个切入点。

## 三、OpenCode 是什么

OpenCode 是一个完全开源的 AI 编程助手，由 anomalyco（SST 团队）开发，2025 年 6 月发布。截至 2026 年 4 月，GitHub 上已经有十余万 Star，迭代非常活跃。

它的核心定位很简单：**开源、不锁定模型供应商的 AI 编程助手。** 对你来说，最大的价值是：因为它是开源的，你可以在它调用 AI 模型的路径上插入自己的逻辑——日志、审计、脱敏、限流，想加什么就改代码。

MIT 开源许可，你可以免费使用、修改、分发。你可以把它部署在内网服务器上，接上自己的 Ollama 或 vLLM，让整个团队用——代码永远不出你的网络。

## 四、OpenCode 提供的使用形态

OpenCode 提供了四种使用形态：

**终端 TUI**：这是主打体验。由 Neovim 用户打造，在终端里有完整的 UI 交互界面，支持多面板、文件差异对比、交互式对话。

**桌面端**（Beta）：原生桌面应用，支持 macOS、Windows 和 Linux。不需要开终端，双击启动即可。

**IDE 插件**：可以嵌入 VS Code 等编辑器，通过快捷键调起 OpenCode 终端命令行，不是在侧边栏里对话。

**Web 界面**：通过 `opencode web` 启动本地 Web 服务器，浏览器访问。功能与终端 TUI 一致，适合不习惯终端的场景，也支持局域网内多人访问。

## 五、动手：安装与配置

聊了这么多，不如直接装一个试试。

**安装**（选一种方式）：

```bash
# macOS（推荐）
brew tap anomalyco/tap && brew install opencode

# Linux / macOS 通用
curl -fsSL https://opencode.ai/install | bash

# 前端开发者
npm install -g opencode-ai
```

安装后 `opencode --version` 验证。

**连接上一篇文章搭好的本地模型**。编辑配置文件（macOS/Linux 在 `~/.config/opencode/opencode.json`，Windows 在 `%APPDATA%\opencode\opencode.json`）：

```json
{
  "lsp": true,
  "models": [
    {
      "name": "qwen2.5:14b",
      "provider": "ollama",
      "baseURL": "http://localhost:11434/v1",
      "apiKey": "ollama"
    },
    {
      "name": "claude-sonnet-4-20250514",
      "provider": "anthropic",
      "apiKey": "YOUR_ANTHROPIC_KEY"
    }
  ],
  "defaultModel": "qwen2.5:14b"
}
```

**跑第一次交互**：

```bash
# 启动对话
opencode

```

配置好之后，`opencode` 回车就进入 TUI 对话界面了。

```bash
# 非交互模式——直接给任务（可用于 CI/CD 场景）
opencode run "解释 src/main.go 里的核心逻辑并生成注释" \
  --model ollama/qwen2.5:14b \
  --file src/main.go \
  --format json
```

## 六、核心功能

**无限制的流水线集成**。这是 OpenCode 对 DevOps 工程师最有价值的特性。OpenCode 支持非交互模式（`opencode run "提示词"`），可以直接嵌入 CI/CD 流水线、脚本、定时任务中。更关键的是——它是 MIT 开源的，没有使用配额、没有 Token 额度限制、没有许可证费用。而 Claude Code、Copilot CLI 等商业工具的非交互模式，受限于各自的许可条款和配额体系。OpenCode + 本地模型 = 流水线里无限跑、零增量成本。

**LSP 集成**（需配置启用）。OpenCode 内置了 30 余种语言的 LSP（Language Server Protocol）支持，需要先在 `opencode.json` 中设置 `"lsp": true` 来启用。启用后，写代码时自动检测语言、启动对应的 LSP，形成代码自修正闭环：你描述需求 → OpenCode 写代码 → LSP 检测到错误 → OpenCode 自动修正 → 再次检测。在 TypeScript 和 Python 场景下，这个闭环的效果尤其明显——类型错误、导入缺失、变量名拼写错误，都会被自动修正。不过要注意，文档也提醒了不是所有项目都适合开 LSP——它会消耗内存，对于某些项目直接用命令行 lint/typecheck 可能更好。

**多模型支持**。OpenCode 不绑定任何模型供应商。它支持 75 个以上的模型提供商，包括 Anthropic、OpenAI、Google、Mistral、DeepSeek，以及通过 Ollama 接入的本地模型。你甚至可以复用已有的 GitHub Copilot 订阅——把 Copilot 的 API 作为 OpenCode 的模型后端。

这意味着：你可以在内网用 Ollama 跑一个 Qwen 或者 DeepSeek-Coder，OpenCode 直接对接。代码不出内网，API 消费为零。

**多 Agent 系统**。OpenCode 内置了主 Agent 和子 Agent 的分工机制。主 Agent 支持 Build 模式（直接写代码）和 Plan 模式（先出计划再执行）切换；子 Agent 通过 `@general` 等方式调用，处理特定类型的子任务。

**细粒度权限控制**。每个命令可以单独配置为 allow（自动允许）、ask（每次询问）或 deny（直接禁止）。比如你可以设置 `git push` 为 ask、`rm -rf` 为 deny。

**Undo/Redo**。每次文件修改前自动创建快照，`/undo` 一键回滚。

**MCP 协议支持**。可以扩展工具能力，接入外部数据源和 API。

## 七、企业自建的现实与局限

从企业管控的角度，OpenCode 的价值在于它给了你一个**可编程的切入点**：

- **AI 交互可审计**。因为所有请求都经过你自己的基础设施，你可以在中间层加日志、存档提示词和响应、追踪每个人的使用频率。这是 Cursor/Copilot/Claude Code 做不到的——它们把交互封装在黑盒里。
- **数据不出内网**。接上本地 Ollama/vLLM，所有计算都在内网完成。即使调用外部 API，请求先经过你的管控层再发出。
- **不绑定厂商**。你想换模型就换模型，没有任何锁定。
- **零月费**。没有订阅费，成本只有模型推理的算力消耗。

但也要说清楚现实：OpenCode 还很年轻。2025 年 6 月才发布，文档不完善，有过安全漏洞，目前更适合个人或小团队作为效率工具使用。**至于在调用链路上加管控层这个想法——方向是对的，但目前还需要自己动手改代码，开箱即用的企业级方案还不存在。**

## 八、小结

OpenCode 对 DevOps 工程师的价值不在于“它能帮你写代码”，而在于**它给了你一个把 AI 工具纳入管控体系的切入点**——开源架构意味着你可以加中间件、加审计、加策略。当然，目前这个想法更多是方向性的，离成熟的企业级方案还有距离。

使用形态上，它提供了终端 TUI、桌面端、IDE 插件、Web 界面四种选择，但最成熟的还是终端 TUI。桌面端还在 Beta，IDE 插件主要是快捷键调起命令行。如果你们团队习惯了在 IDE 侧边栏里对话、享受内联代码补全的流畅体验，那 OpenCode 当前的状态不一定是最顺手的选择。

下一篇，我们来聊一个不同形态的工具——直接嵌入 VS Code、用 Plan/Act 双模式驱动、而且同样开源免费的 Cline。

每天前进一小步，就是一个新的高度！
