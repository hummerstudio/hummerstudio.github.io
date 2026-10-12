---
title: How to Fix GitHub Access Problems Without a VPN
date: 2025-06-26
author: Tang Moying
categories: [code]
tags: [GitHub, hosts, Networking]
lang: en
alt_url: /post/无法访问-github-非科学上网解决办法
---


## 1. Background

Accessing GitHub from inside the country is often flaky — sometimes it opens and sometimes it doesn't, `git clone` and `git push` time out and fail, or pages load extremely slowly. This is caused by the IP that DNS resolves to being interfered with or unavailable.

One simple and effective solution that doesn't involve a VPN is: modify the hosts file so that GitHub-related domains point directly at usable IPs, bypassing DNS poisoning.

## 2. The github-hosts Project

Someone already maintains a hosts list for GitHub specifically, updating the IP addresses automatically every day:

Project address: [https://github.com/maxiaof/github-hosts](https://github.com/maxiaof/github-hosts)

The project uses GitHub Actions to automatically check the usable IPs of each GitHub domain every day and generate the latest hosts configuration. The domains covered include:

- `github.com` — main site
- `api.github.com` — API endpoint
- `raw.githubusercontent.com` — raw file access
- `github.io` — GitHub Pages
- `gist.github.com` — Gist
- `codeload.github.com` — code download
- `github.dev` — online editor
- `avatars.githubusercontent.com` — avatars
- and so on — 30+ related domains

## 3. Steps

### Windows

**Step 1**: Open the hosts file in Notepad as administrator.

Path: `C:\Windows\System32\drivers\etc\hosts`

How to do it: right-click Notepad → Run as administrator → File → Open → paste the path above.

**Step 2**: Copy the content between `#Github Hosts Start` and `#Github Hosts End` from the github-hosts project, and paste it at the end of the hosts file.

**Step 3**: Save the file, then flush the DNS cache:

```bash
ipconfig /flushdns
```

### Mac / Linux

**Step 1**: Edit the hosts file (sudo privileges required):

```bash
sudo vi /etc/hosts
```

**Step 2**: Paste the hosts content from the github-hosts project at the end of the file, save and exit.

**Step 3**: Flush the DNS cache:

```bash
# Mac
sudo killall -HUP mDNSResponder

# Linux
sudo systemctl restart nscd
```

If it still doesn't take effect after flushing, just restart your computer.

## 4. Things to Note

- **Update regularly**: GitHub's IPs may change, so it's advisable to fetch the latest hosts configuration again every few weeks. The github-hosts project updates daily — just visit the page periodically and copy the latest content.
- **Don't add it repeatedly**: if you've added it before, first delete the old content between `#Github Hosts Start` and `#Github Hosts End`, then paste the new content.
- **Don't modify the IPs at will**: the IPs in the list have been tested and are usable; don't change them by hand, or the connection may fail.
- **Not a cure-all**: the hosts approach solves problems at the DNS level. If you run into more complex network restrictions, other solutions may still be needed.

A small step forward every day is a new height!
