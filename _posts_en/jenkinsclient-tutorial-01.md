---
title: 'Jenkinsclient Tutorial Series: Introduction and Installation (Part 1)'
date: 2020-05-17
author: Tang Moying
categories: [devops]
tags: [Jenkinsclient]
lang: en
alt_url: /post/jenkinsclient-tutorial-01
---

## Introduction to jenkinsclient

Jenkinsclient is a powerful, open-source, cross-platform Jenkins command-line client. It provides a Docker-style command line that lets users operate Jenkins.

Jenkinsclient is written in Python, and the project source code is open-sourced under the domestic Mulan Open Source License. You can view it on Gitee and Github.

Gitee: [https://gitee.com/hummerstudio/jenkinsclient](https://gitee.com/hummerstudio/jenkinsclient)

Github: [https://github.com/hummerstudio/jenkinsclient](https://github.com/hummerstudio/jenkinsclient)

Project homepage: [https://pypi.org/project/jenkinsclient](https://pypi.org/project/jenkinsclient)

<!--以上为摘要内容-->

## Jenkinsclient features

### Feature 1: Open source

As mentioned above, the Jenkinsclient project source code is open-sourced under the domestic Mulan Open Source License. Contributions, code submissions, problem reports, documentation, and helping to spread and share the word are all very welcome.

### Feature 2: Cross-platform

From the very beginning of development, Jenkinsclient was positioned for cross-platform use, and Python was ultimately chosen for the implementation.

Windows, Linux, Mac and Unix all have a Python runtime environment, which guarantees that Jenkinsclient can be used across platforms.

### Feature 3: Support for multiple instances

Jenkinsclient supports multiple Jenkins instances.

You can use the `jenkins config generate` command to generate a configuration file, configure the information of several Jenkins servers in it, and use the `use` field to specify the server operated on by default.

### Feature 4: Simple and easy to use

In order to achieve a simple and easy-to-use command-line experience, a great deal of technology selection work went into Jenkinsclient's design from the start.

My goal was to design a Docker-style command line; in short, to express operations with commands/keywords rather than the traditional approach of doing them through parameters/options.

For example, to start a docker container, we use:

```
docker container start CONTAINER
```

For jenkinsclient, for example to trigger a job, the command line I wanted to be able to implement looks like this:

```
jenkins job build JOB_NAME
```

By contrast, a traditional-style command-line implementation would look like this:

```
jenkins job -b JOB_NAME
```

Or like this:

```
jenkins-job build JOB_NAME
```

Python has several libraries for developing command-line tools, but most of them can only produce traditional-style command-line tools. After careful screening and writing demos, I chose Fire. Fire fully meets the requirements above.

Now, with Jenkinsclient, you can perform Jenkins operations using a natural command-line syntax like this:

```
jenkins jobs                          // Show the job list
jenkins job build JOB_NAME            // Trigger a Jenkins job
jenkins job disable JOB_NAME          // Disable a Jenkins job
jenkins job enable JOB_NAME           // Enable a Jenkins job

jenkins plugins                       // Show the plugin list
jenkins plugin install PLUGIN_NAME    // Install a plugin
jenkins plugin uninstall PLUGIN_NAME  // Uninstall a plugin
jenkins plugin search KEY_WORD        // Search for a plugin
```

### Feature 5: Powerful

Jenkinsclient's architecture gives it the ability to implement all Jenkins-related operations. The major features implemented so far are:

- Configure Jenkins server information
- Manage Jenkins nodes
- Manage Jenkins plugins
- Manage Jenkins credentials
- Manage Jenkins jobs
- Manage Jenkins queues
- Manage Jenkins executors
- Manage Jenkins builds

These basically cover all the various kinds of Jenkins resources that can be operated on.

## Installation

The simplest way is to install jenkinsclient, which is hosted on PyPI, via pip. Just use the following command:

```
pip3 install jenkinsclient
```


You can also download the source code, unzip it, enter the root directory, and install it manually with the setuptools tool:

```
python setup.py install
```

## Upgrade

```
pip3 install -U jenkinsclient
```

## Quick start

### Configure server information

Use `jenkins config generate` to configure the Jenkins server information.

This command generates a configuration template file for jenkinsclient, and then you need to fill in the actual values.

### View help information

Try typing `jenkins jobs` to view all the jobs on the Jenkins server.

Try typing `jenkins plugins` to view all the plugins on the Jenkins server.

For more commands, type `jenkins`.

Or type `jenkins <command group>` to display the help information for a command group; for example, to view the help information for the Jenkins job management commands:

```
jenkins job
```

To view the help information for the Jenkins plugin management commands:

```
jenkins plugin
```

This tutorial series will introduce these commands in detail, so stay tuned!
