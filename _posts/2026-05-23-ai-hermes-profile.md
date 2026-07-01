---
title: Hermes Profile——多个 Agent 分身，一套工具搞定
author: 唐明
categories: [ai]
tags: [AI, Hermes, 配置文件, 多 Agent, 角色分身, DevOps]
---

你在 Hermes 里调教好了一个 Agent——它记住了你的代码风格、项目结构、常用命令。现在你有了第二个需求：需要一个专门管部署的 Agent，再要一个专门做运维巡检的 Agent。它们是三个完全不同的角色，需要不同的记忆、不同的技能、甚至不同的模型偏好。你总不能每次都重装 Hermes 吧？Hermes 的 Profile 机制就是为这个设计的。

<!--以上为摘要内容-->

## 一、问题：一个 Hermes 不够用

简单回顾一下，Hermes Agent 把每个 Agent 的配置、记忆、技能都存在 `~/.hermes/` 目录下：

```text
~/.hermes/
├── config.yaml       # 主配置（模型、工具等）
├── .env              # 环境变量（API Key 等）
├── MEMORY.md         # 情景记忆
├── USER.md           # 用户画像
├── SKILL.md          # 程序性记忆
└── skills/           # 技能目录
```

这个结构很好——对于一个 Agent、一个角色来说。但现实场景是：你可能需要：

- **代码审查 Agent**：偏重代码质量、重构建议，用一个大上下文模型
- **部署 Agent**：偏重 K8s、CI/CD 操作，用一个小而快的模型
- **运维巡检 Agent**：定时跑巡检任务，记巡检日志，用最便宜的模型

三个角色的记忆内容完全不同。代码审查 Agent 记住的是你的代码规范，部署 Agent 记住的是你的 K8s 集群拓扑，运维 Agent 记录的是历史故障模式。把它们混在一起，记忆文件会变成一锅粥。

你可能会想：那我复制三份 `~/.hermes/`，每个角色用一份？可以，但这正是 Profile 做的事——**只是它帮你管理得更好**。

## 二、Profile 是什么

Profile 是 Hermes 内置的**配置隔离机制**。每个 Profile 是一套独立的 Hermes 配置环境，包含自己的配置文件、记忆文件、技能目录、环境变量。一个 Profile = 一个逻辑上的 Agent 分身。

用更直白的话说：**你不装三个 Hermes，就能拥有三个完全独立的 Agent。** 它们各记各的、各配各的模型、各装各的技能。

Profile 机制在 Hermes 中无处不在。用 `--profile`（或 `-p`）全局参数，可以让任何命令作用到指定 Profile 上；用 `hermes profile use` 可以切换默认 Profile：

```bash
hermes profile create my-agent                  # 创建一个新 profile
hermes --profile my-agent chat "帮我看一段代码"  # 用指定 profile 执行一次对话
hermes profile use my-agent                     # 切换默认 profile（此后省略 --profile）
hermes -p my-agent config set model qwen2.5     # 用 -p 简写配置
hermes -p my-agent skill add k8s-deploy-guide   # 为指定 profile 装技能
```

不指定 `--profile` 时，Hermes 使用当前激活的默认 Profile（默认名为 `default`）。

## 三、动手：创建第一个分身

假设你的默认 Profile 已经是代码审查 Agent。现在创建一个部署 Agent。

### 3.1 创建新 Profile

```bash
# 创建一个名为 deployer 的空白 profile
hermes profile create deployer
```

也可以用 `--clone` 从当前 Profile 复制配置：

```bash
# 复制当前 profile 的 config.yaml、.env 和 SOUL.md 到新 profile
hermes profile create deployer --clone

# 完全克隆——连记忆、会话、技能一起复制
hermes profile create deployer --clone-all
```

创建后，在 `~/.hermes/profiles/` 下会生成 `deployer/` 子目录，内含全新的配置和记忆文件。

两个 Profile 完全隔离：

```text
~/.hermes/
├── config.yaml          # default profile 的配置
├── MEMORY.md            # default profile 的记忆
├── USER.md              # default profile 的用户画像
├── SKILL.md             # default profile 的技能
├── .env                 # default profile 的环境变量
│
├── profiles/
│   └── deployer/
│       ├── config.yaml  # deployer profile 的配置（独立的！）
│       ├── MEMORY.md    # deployer profile 的记忆
│       ├── USER.md
│       ├── SKILL.md
│       └── .env
```

### 3.2 切换 Profile

有两种方式。一是设定默认 Profile，之后所有命令自动指向它：

```bash
# 将 deployer 设为默认 profile
hermes profile use deployer

# 此后直接对话，自动使用 deployer
hermes chat "帮我写一个 K8s deployment 模板"
```

二是每次命令临时指定，不改变默认：

```bash
# 临时用 deployer profile 对话
hermes --profile deployer chat "帮我写一个 K8s deployment 模板"

# 临时用 deployer profile 装技能
hermes -p deployer skill add k8s-deploy-guide
```

### 3.3 查看所有 Profile

```bash
# 列出所有 profile
hermes profile list
```

输出类似：

```text
* default
  deployer
  maintainer
```

前面带 `*` 的是当前激活的默认 Profile。用 `hermes profile use <name>` 即可切换。

### 3.4 删除 Profile

```bash
# 删除 deployer profile（删掉它的所有配置和记忆）
hermes profile delete deployer
```

注意：删除操作不可逆。但每个 Profile 是独立的，删掉 `deployer` 不会影响 `default`。

## 四、Profile 之间的隔离与共享

上面说了“完全隔离”，但有些东西是共享的：

| 内容 | 隔离？ | 说明 |
|------|--------|------|
| 对话历史 | 隔离 | 每个 Profile 有自己的对话记录 |
| MEMORY.md / USER.md / SKILL.md | 隔离 | 各记各的 |
| 模型配置 | 隔离 | 每个 Profile 可以用不同的模型 |
| 技能文件 | 隔离 | 每个 Profile 装不同的技能 |
| 全局插件 | 共享 | 插件是全局的，所有 Profile 共用 |
| 工具授权 | 隔离 | 每个 Profile 独立授权工具权限 |

你可以根据角色需求灵活配置：
- 代码审查 Agent 用 Qwen2.5-14B，启用文件操作工具
- 部署 Agent 用 DeepSeek-V3，启用 Shell 执行工具
- 运维 Agent 用本地小模型，只启用日志读取工具

**三个 Profile，三套记忆，三个不同定位的 Agent——但都在同一台机器上，同一套 Hermes 安装。**

## 五、为什么 Profile 是多 Agent 协作的基础

到这里你可能觉得：三个 Agent 独立运行，各记各的，已经很好了。但当你真正进入多 Agent 协作场景，你会发现一个关键问题：**它们需要共享一些知识。**

比如：
- 代码审查 Agent 记住了“你的微服务是用 Go 写的，部署在 K8s 上”
- 部署 Agent 在写部署模板时，需要知道这个背景
- 运维 Agent 做故障排查时，也需要知道用的是 Go 和 K8s

三个 Profile 虽然在文件层面隔离了记忆，但你完全可以**给它们接入同一个外部的 Memory Provider**——这就是下篇文章要聊的 Hermes Memory Provider 机制，特别是 Mem0 企业级记忆层。

```bash
# 所有 profile 接入同一个 Mem0 实例
hermes -p code-reviewer config set memory.provider mem0
hermes -p deployer config set memory.provider mem0
hermes -p maintainer config set memory.provider mem0
```

Profile 提供了“角色独立”的基础，Memory Provider 提供了“知识共享”的桥梁。两者合在一起，才是多 Agent 协作的完整方案。

## 六、小结

Profile 是 Hermes 中最容易被跳过的功能——入门教程通常不需要它，一个 Agent 够用了。但当你开始认真做多角色 Agent 协作，它就是绕不开的基础。

它的价值在于：**让你在不改变 Hermes 安装的情况下，拥有了“分身”能力。** 一台机器、一个 Hermes，跑三个完全不同定位的 Agent。而且每个 Agent 的配置、记忆、技能都干净地隔离开，不会互相污染。

这为下一篇的连接做好了准备——Memory Provider 让这些分身在文件记忆之外，还能共享企业级的知识层。

每天前进一小步，就是一个新的高度！
