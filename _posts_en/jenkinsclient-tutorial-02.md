---
title: 'Jenkinsclient Tutorial Series: Viewing Basic Information (Part 2)'
date: 2020-05-17
author: Tang Moying
categories: [devops]
tags: [Jenkinsclient]
lang: en
alt_url: /post/jenkinsclient-tutorial-02
---

Once Jenkinsclient is configured, you can operate Jenkins through commands!

The command format of jenkinsclient is:

`jenkins GROUP | COMMAND`

`GROUP` refers to a group of commands. For example, `job` is a group command, and it has the following commands:

```
jenkins job build   //build a job
jenkins job copy    //copy a job
jenkins job create  //create a job
jenkins job delete  //delete a job
jenkins job disable //disable a job
jenkins job enable  //enable a job
jenkins job has     //check whether a job already exists
jenkins job info    //show job information
jenkins job ls      //show the job list
jenkins job rename  //rename a job
jenkins job xml     //show the config.xml content of a job
```

Today we will not cover group commands yet; first let us look at the top-level `COMMAND`. These commands are basically used for viewing all kinds of information.

## 1. An Easter Egg — APP Mode

APP mode lets you operate Jenkins in a standalone window. The experience feels just like using an app.

Command:

`jenkins app`

Video demo:

<video width="400" controls Autoplay=autoplay>
  <source src="/assets/video/jenkinsclient_app模式.mov" type="video/mp4">
</video>

<!--以上为摘要内容-->

## 2. Show the Jenkins server version

Command:

`jenkins version`

Output:

```
ming@tangmingdeMacBook-Pro:~$ jenkins version
Jenkins server version: 2.234
```

## 3. Show the current user

Command:

`jenkins version`

Output:

```
ming@tangmingdeMacBook-Pro:~$ jenkins whoami
ming
```

## 4. Show the plugin list

Command:

`jenkins plugins`

Output:

```
ming@tangmingdeMacBook-Pro:~$ jenkins plugins
插件名称                            类型                                                                  版本
--------                            --------                                                              --------
pam-auth                            PAM Authentication plugin                                             1.6
blueocean-i18n                      i18n for Blue Ocean                                                   1.23.2
blueocean-events                    Events API for Blue Ocean                                             1.23.2
authentication-tokens               Authentication Tokens API Plugin                                      1.3
matrix-auth                         Matrix Authorization Strategy Plugin                                  2.6.1
jquery-detached                     JavaScript GUI Lib: jQuery bundles (jQuery and jQuery UI) plugin      1.2.1
workflow-api                        Pipeline: API                                                         2.40
token-macro                         Token Macro Plugin                                                    2.12
pipeline-utility-steps              Pipeline Utility Steps                                                2.5.0
pipeline-model-definition           Pipeline: Declarative                                                 1.6.0
blueocean-pipeline-api-impl         Pipeline implementation for Blue Ocean                                1.23.2
pipeline-model-declarative-agent    Pipeline: Declarative Agent API                                       1.1.1
pipeline-config-history             Pipeline Configuration History Plugin                                 1.6
credentials                         Credentials Plugin                                                    2.3.7
workflow-multibranch                Pipeline: Multibranch                                                 2.21
bouncycastle-api                    bouncycastle API Plugin                                               2.18
htmlpublisher                       HTML Publisher plugin                                                 1.23
jackson2-api                        Jackson 2 API Plugin                                                  2.11.0
workflow-scm-step                   Pipeline: SCM Step                                                    2.11
git-client                          Jenkins Git client plugin                                             3.2.1
windows-slaves                      WMI Windows Agents Plugin                                             1.6
ui-samples-plugin                   Jenkins UI sample plugin                                              2.0
handlebars                          JavaScript GUI Lib: Handlebars bundle plugin                          1.1.1
pipeline-model-extensions           Pipeline: Declarative Extension Points API                            1.6.0
lockable-resources                  Lockable Resources plugin                                             2.8
ace-editor                          JavaScript GUI Lib: ACE Editor bundle plugin                          1.1
cloudbees-folder                    Folders Plugin                                                        6.12
handy-uri-templates-2-api           Handy Uri Templates 2.x API Plugin                                    2.1.8-1.0
pipeline-input-step                 Pipeline: Input Step                                                  2.11
pipeline-milestone-step             Pipeline: Milestone Step                                              1.3.1
workflow-cps                        Pipeline: Groovy                                                      2.80
workflow-job                        Pipeline: Job                                                         2.39
blueocean-jwt                       JWT for Blue Ocean                                                    1.23.2
mailer                              Jenkins Mailer Plugin                                                 1.32
docker-java-api                     Docker API Plugin                                                     3.1.5.2
pipeline-graph-analysis             Pipeline Graph Analysis Plugin                                        1.10
ws-cleanup                          Jenkins Workspace Cleanup Plugin                                      0.38
pipeline-stage-step                 Pipeline: Stage Step                                                  2.3
github-branch-source                GitHub Branch Source Plugin                                           2.7.1
blueocean                           Blue Ocean                                                            1.23.2
blueocean-display-url               Display URL for Blue Ocean                                            2.3.1
blueocean-core-js                   Blue Ocean Core JS                                                    1.23.2
blueocean-commons                   Common API for Blue Ocean                                             1.23.2
pubsub-light                        Jenkins Pub-Sub "light" Bus                                           1.13
jira                                Jenkins Jira plugin                                                   3.0.15
docker-commons                      Docker Commons Plugin                                                 1.16
blueocean-dashboard                 Dashboard for Blue Ocean                                              1.23.2
blueocean-jira                      JIRA Integration for Blue Ocean                                       1.23.2
git-server                          Jenkins GIT server Plugin                                             1.9
blueocean-git-pipeline              Git Pipeline for Blue Ocean                                           1.23.2
ldap                                LDAP Plugin                                                           1.24
workflow-basic-steps                Pipeline: Basic Steps                                                 2.20
blueocean-bitbucket-pipeline        Bitbucket Pipeline for Blue Ocean                                     1.23.2
kubernetes-credentials              Kubernetes Credentials Plugin                                         0.6.2
resource-disposer                   Resource Disposer Plugin                                              0.14
google-oauth-plugin                 Google OAuth Credentials plugin                                       1.0.0
subversion                          Jenkins Subversion Plug-in                                            2.13.1
display-url-api                     Display URL API                                                       2.3.2
http_request                        HTTP Request Plugin                                                   1.8.26
apache-httpcomponents-client-4-api  Jenkins Apache HttpComponents Client 4.x API Plugin                   4.5.10-2.0
git                                 Jenkins Git plugin                                                    4.2.2
workflow-step-api                   Pipeline: Step API                                                    2.22
pipeline-rest-api                   Pipeline: REST API Plugin                                             2.13
plain-credentials                   Plain Credentials Plugin                                              1.7
kubernetes-client-api               Kubernetes Client API Plugin                                          4.9.1-1
github                              GitHub plugin                                                         1.30.0
sse-gateway                         Server Sent Events (SSE) Gateway Plugin                               1.23
email-ext                           Email Extension Plugin                                                2.69
pipeline-github-lib                 Pipeline: GitHub Groovy Libraries                                     1.0
pipeline-model-api                  Pipeline: Model API                                                   1.6.0
variant                             Variant Plugin                                                        1.3
log-file-filter                     Log File Filter Plugin                                                1.11
momentjs                            JavaScript GUI Lib: Moment.js bundle plugin                           1.1.1
branch-api                          Branch API Plugin                                                     2.5.6
durable-task                        Durable Task Plugin                                                   1.34
blueocean-config                    Config API for Blue Ocean                                             1.23.2
kubernetes                          Kubernetes plugin                                                     1.25.7
ssh-slaves                          SSH Build Agents plugin                                               1.31.2
workflow-cps-global-lib             Pipeline: Shared Groovy Libraries                                     2.16
pipeline-stage-view                 Pipeline: Stage View Plugin                                           2.13
pipeline-type-parser-steps          Pipeline Type Parser Steps                                            1.0
command-launcher                    Command Agent Launcher Plugin                                         1.4
favorite                            Favorite                                                              2.3.2
localization-support                Localization Support Plugin                                           1.1
timestamper                         Timestamper                                                           1.11.3
workflow-aggregator                 Pipeline                                                              2.6
jdk-tool                            Oracle Java SE Development Kit Installer Plugin                       1.4
pipeline-keep-running-step          Pipeline Keep Running Step                                            1.0
github-api                          GitHub API Plugin                                                     1.111
blueocean-pipeline-editor           Blue Ocean Pipeline Editor                                            1.23.2
oauth-credentials                   OAuth Credentials plugin                                              0.4
blueocean-web                       Web for Blue Ocean                                                    1.23.2
ant                                 Ant Plugin                                                            1.11
junit                               JUnit Plugin                                                          1.29
docker-workflow                     Docker Pipeline                                                       1.23
blueocean-rest-impl                 REST Implementation for Blue Ocean                                    1.23.2
ssh-credentials                     SSH Credentials Plugin                                                1.18.1
blueocean-personalization           Personalization for Blue Ocean                                        1.23.2
build-timeout                       Build Timeout                                                         1.19.1
mercurial                           Jenkins Mercurial plugin                                              2.10
docker-plugin                       Docker plugin                                                         1.2.0
jsch                                Jenkins JSch dependency plugin                                        0.1.55.2
matrix-project                      Matrix Project Plugin                                                 1.14
blueocean-rest                      REST API for Blue Ocean                                               1.23.2
cloudbees-bitbucket-branch-source   Bitbucket Branch Source Plugin                                        2.8.0
trilead-api                         Trilead API Plugin                                                    1.0.6
script-security                     Script Security Plugin                                                1.72
workflow-durable-task-step          Pipeline: Nodes and Processes                                         2.35
scm-api                             SCM API Plugin                                                        2.6.3
mapdb-api                           MapDB API Plugin                                                      1.0.9.0
blueocean-github-pipeline           GitHub Pipeline for Blue Ocean                                        1.23.2
structs                             Structs Plugin                                                        1.20
jenkins-design-language             Jenkins Design Language                                               1.23.2
pipeline-stage-tags-metadata        Pipeline: Stage Tags Metadata                                         1.6.0
antisamy-markup-formatter           OWASP Markup Formatter Plugin                                         2.0
credentials-binding                 Credentials Binding Plugin                                            1.23
gradle                              Gradle Plugin                                                         1.36
workflow-support                    Pipeline: Supporting APIs                                             3.4
pipeline-build-step                 Pipeline: Build Step                                                  2.12
blueocean-autofavorite              Autofavorite for Blue Ocean                                           1.2.4
blueocean-pipeline-scm-api          Pipeline SCM API for Blue Ocean                                       1.23.2
localization-zh-cn                  Localization: Chinese (Simplified)                                    1.0.14
```

## 5. Show the job list

Command:

`jenkins jobs`

Output:

```
ming@tangmingdeMacBook-Pro:~$ jenkins jobs
任务名称                      类型                          链接
--------                      --------                      --------
f1                            Folder                        http://localhost:83/job/f1/
f2                            Folder                        http://localhost:83/job/f2/
freestyle-job                 FreeStyleProject              http://localhost:83/job/freestyle-job/
job2                          FreeStyleProject              http://localhost:83/job/job2/
pipeline-project              WorkflowJob                   http://localhost:83/job/pipeline-project/
test_toFloat                  WorkflowJob                   http://localhost:83/job/test_toFloat/
test_toJson                   WorkflowJob                   http://localhost:83/job/test_toJson/
f1/job1                       WorkflowJob                   http://localhost:83/job/f1/job/job1/
f1/job2                       WorkflowJob                   http://localhost:83/job/f1/job/job2/
f2/job2                       WorkflowJob                   http://localhost:83/job/f2/job/job2/
```
## 6. Show the queue list

Command:

`jenkins queues`

Output:

```
任务ID	任务链接                                              	原因

```
## 7. Show the node list

Command:

`jenkins nodes`

Output:

```
节点名称                       架构                 可用交换空间          可用内存空间          可用临时空间           可用磁盘空间              
--------                      --------            --------            --------            --------            --------            
(master)                      Linux (amd64)       1024.0/1024.0 MB    1872.38/3938.3 MB   43664 MB            43664 MB
```

## 8. Show the credentials list

Command:

`jenkins creds`

Output:

```
ID                                      名称                            类型                                                          描述
94e00416-20d6-4fdf-8a38-8d799684a7ee     user1/******                   <class 'jenkinsapi.credential.UsernamePasswordCredential'>   
6d369c60-67b1-4820-ba7e-ab640df1eac1     user2/****** (user2 describe)  <class 'jenkinsapi.credential.UsernamePasswordCredential'>   user2 describe
user3                                    user3/******                   <class 'jenkinsapi.credential.UsernamePasswordCredential'>   
ming                                     ming (ming)                    <class 'jenkinsapi.credential.SSHKeyCredential'>             ming
```

This tutorial series will cover these commands in detail, so stay tuned!
