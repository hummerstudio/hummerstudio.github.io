---
title: Windows administrator用户没有管理员权限的解决方法
author: 唐明
date: 2021-04-24
categories: [Windows]
tags: [Windows]
---
* TOC
{:toc}

简言之，这是Windows的安全策略设置使得administrator的管理员权限需要批准。

可以按如下步骤修改这个策略：

1. 按Windows+R键，打开“运行”（或者开始菜单上右键选择“运行”），然后输入“gpedit.msc",就是打开组策略，这个在控制面板中也可以打开

1. 在组策略里找到“计算机配置”-“Windows设置”-“安全设置”-“本地策略”-“安全选项”

1. 在“安全选项”里找到“用户帐户控制-以管理员模式批准运行所有管理员”这项

1. 禁用此选项