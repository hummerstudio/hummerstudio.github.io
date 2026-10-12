---
title: How to Fix Method Navigation in Unity Project Scripts Opened in Visual Stuido
date: 2021-12-27
author: Tang Moying
categories: [build]
tags: [Visual Studio]
lang: en
alt_url: /post/unity-project-code-can-not-jump
---

The cause is that the Unity project is not associated with the Visual Studio you are using.

Just follow the steps below:
1. Open the Unity project
1. Select `Edit` --> `preferences` in the menu bar
1. On the left side of the window that pops up, find and select `External Tools`
1. In the right-hand pane, find `External Scripts Editor` and change it in the dropdown, selecting the Visual Studio version you use
1. Close the settings window

From then on, whether you open the project from Unity or right-click the Unity project in File Explorer and open it with Visual Studio, script methods will navigate normally.
