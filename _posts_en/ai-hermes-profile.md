---
title: Hermes Profile — Multiple Agent Personas, One Set of Tools Does It All
date: 2026-05-23
author: Tang Moying
categories: [ai]
tags: [AI, Hermes, Config Files, Multi-Agent, Role Personas, DevOps]
lang: en
alt_url: /post/ai-hermes-profile
---

You've raised an Agent well inside Hermes — it remembers your code style, your project structure, your frequently used commands. Now you have a second need: an Agent dedicated to managing deployments, and one more dedicated to ops inspections. They're three completely different roles, needing different memories, different skills, and even different model preferences. Surely you're not going to reinstall Hermes every time? That's exactly what Hermes's Profile mechanism was designed for.

<!--以上为摘要内容-->

## 1. The Problem: One Hermes Isn't Enough

A quick recap: Hermes Agent stores each Agent's configuration, memory, and skills under the `~/.hermes/` directory:

```text
~/.hermes/
├── config.yaml       # main config (model, tools, etc.)
├── .env              # environment variables (API Key, etc.)
├── MEMORY.md         # episodic memory
├── USER.md           # user profile
├── SKILL.md          # procedural memory
└── skills/           # skills directory
```

This structure is good — for one Agent, one role. But the real-world scenario is that you might need:

- **A code review Agent**: leaning toward code quality and refactoring suggestions, using a model with a large context
- **A deployment Agent**: leaning toward K8s and CI/CD operations, using a small, fast model
- **An ops inspection Agent**: running inspection tasks on a schedule and logging inspection records, using the cheapest model

The three roles' memory contents are completely different. The code review Agent remembers your coding conventions, the deployment Agent remembers your K8s cluster topology, and the ops Agent records historical failure patterns. Mix them together and the memory files turn into a pot of porridge.

You might think: then why not copy `~/.hermes/` three times, one for each role? Sure, that works — but that's exactly what Profile does, **only it manages it better for you**.

## 2. What Is a Profile

A Profile is Hermes's built-in **configuration isolation mechanism**. Each Profile is an independent Hermes configuration environment, containing its own config files, memory files, skills directory, and environment variables. One Profile = one logical Agent persona.

To put it more plainly: **without installing three Hermes instances, you can have three completely independent Agents.** Each keeps its own memories, configures its own model, and installs its own skills.

The Profile mechanism is everywhere in Hermes. With the `--profile` (or `-p`) global parameter, you can make any command act on a specified Profile; with `hermes profile use` you can switch the default Profile:

```bash
hermes profile create my-agent                  # create a new profile
hermes --profile my-agent chat "帮我看一段代码"  # run one conversation with the specified profile
hermes profile use my-agent                     # switch the default profile (omit --profile from then on)
hermes -p my-agent config set model qwen2.5     # configure using the -p shorthand
hermes -p my-agent skill add k8s-deploy-guide   # install a skill for the specified profile
```

When you don't specify `--profile`, Hermes uses the currently active default Profile (named `default` by default).

## 3. Hands On: Creating Your First Persona

Assume your default Profile is already a code review Agent. Now create a deployment Agent.

### 3.1 Creating a New Profile

```bash
# create a blank profile named deployer
hermes profile create deployer
```

You can also use `--clone` to copy the configuration from the current Profile:

```bash
# copy the current profile's config.yaml, .env and SOUL.md into the new profile
hermes profile create deployer --clone

# a full clone — memories, sessions and skills copied along too
hermes profile create deployer --clone-all
```

After creation, a `deployer/` subdirectory is generated under `~/.hermes/profiles/`, containing a brand-new set of config and memory files.

The two Profiles are completely isolated:

```text
~/.hermes/
├── config.yaml          # the default profile's configuration
├── MEMORY.md            # the default profile's memory
├── USER.md              # the default profile's user profile
├── SKILL.md             # the default profile's skills
├── .env                 # the default profile's environment variables
│
├── profiles/
│   └── deployer/
│       ├── config.yaml  # the deployer profile's configuration (separate!)
│       ├── MEMORY.md    # the deployer profile's memory
│       ├── USER.md
│       ├── SKILL.md
│       └── .env
```

### 3.2 Switching Profiles

There are two ways. One is to set the default Profile, after which all commands point to it automatically:

```bash
# set deployer as the default profile
hermes profile use deployer

# from now on, chat directly and deployer is used automatically
hermes chat "Write a K8s deployment template for me"
```

The second is to specify it temporarily for each command, without changing the default:

```bash
# temporarily chat with the deployer profile
hermes --profile deployer chat "帮我写一个 K8s deployment 模板"

# temporarily install a skill with the deployer profile
hermes -p deployer skill add k8s-deploy-guide
```

### 3.3 Viewing All Profiles

```bash
# list all profiles
hermes profile list
```

The output is something like:

```text
* default
  deployer
  maintainer
```

The one with a leading `*` is the currently active default Profile. Use `hermes profile use <name>` to switch.

### 3.4 Deleting a Profile

```bash
# delete the deployer profile (removing all of its configuration and memory)
hermes profile delete deployer
```

Note: a delete operation is irreversible. But each Profile is independent, and deleting `deployer` won't affect `default`.

## 4. Isolation and Sharing Between Profiles

We just said "completely isolated," but some things are shared:

| Item | Isolated? | Description |
|------|--------|------|
| Conversation history | Isolated | Each Profile has its own conversation records |
| MEMORY.md / USER.md / SKILL.md | Isolated | Each keeps its own |
| Model configuration | Isolated | Each Profile can use a different model |
| Skill files | Isolated | Each Profile installs different skills |
| Global plugins | Shared | Plugins are global and shared by all Profiles |
| Tool authorization | Isolated | Each Profile authorizes tool permissions independently |

You can configure them flexibly according to each role's needs:
- The code review Agent uses Qwen2.5-14B, with file operation tools enabled
- The deployment Agent uses DeepSeek-V3, with Shell execution tools enabled
- The ops Agent uses a small local model, with only log-reading tools enabled

**Three Profiles, three sets of memories, three differently positioned Agents — but all on the same machine, under the same Hermes installation.**

## 5. Why Profiles Are the Foundation for Multi-Agent Collaboration

By now you might feel that three Agents running independently, each keeping its own memories, is already pretty good. But once you really step into a multi-Agent collaboration scenario, you'll find a key problem: **they need to share some knowledge.**

For example:
- The code review Agent remembers that "your microservices are written in Go and deployed on K8s"
- The deployment Agent needs to know this background when writing deployment templates
- The ops Agent also needs to know that Go and K8s are in use when troubleshooting

Although the three Profiles isolate memory at the file level, you can absolutely **connect them to the same external Memory Provider** — that's the Hermes Memory Provider mechanism we'll cover in the next article, and in particular the Mem0 enterprise-grade memory layer.

```bash
# connect all profiles to the same Mem0 instance
hermes -p code-reviewer config set memory.provider mem0
hermes -p deployer config set memory.provider mem0
hermes -p maintainer config set memory.provider mem0
```

Profiles provide the foundation of "independent roles," and the Memory Provider provides the bridge for "shared knowledge." Put the two together and you have the complete solution for multi-Agent collaboration.

## 6. Summary

Profiles are the most easily skipped feature in Hermes — introductory tutorials usually don't need it, and one Agent is enough. But once you start seriously doing multi-role Agent collaboration, it becomes a foundation you can't route around.

Its value lies in this: **it gives you "persona" capability without changing your Hermes installation.** One machine, one Hermes, running three completely differently positioned Agents. And each Agent's configuration, memory, and skills are cleanly isolated from one another, with no cross-contamination.

This sets up the next article's connection — the Memory Provider lets these personas share an enterprise-grade knowledge layer beyond their file-based memory.

A small step forward every day is a new height!
