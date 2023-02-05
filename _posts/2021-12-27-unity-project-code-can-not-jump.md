---
title: Visual Stuido中打开Unity工程脚本，方法无法跳转解决方法
author: 唐明
date: 2021-12-27
categories: [Unity]
tags: [Visual Studio]
---
* TOC
{:toc}

原因是Unity项目未和使用的Visual Studio关联。

按如下步骤操作即可：
1. 打开Unity项目
1. 菜单栏选择`Edit`-->`preferences`
1. 在弹出的窗口左边找到`External Tools`，选中
1. 在右侧窗口找到`External Scripts Editor`，下拉框中修改，选中自己使用的Visual Studio版本
1. 关闭设置窗口

此后不论是从Unity中打开项目，还是直接在资源管理器右键使用Visual Studio打开Unity项目，脚本方法都能正常跳转了。