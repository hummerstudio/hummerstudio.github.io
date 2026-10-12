---
title: Using the Latest Version of a Dependency in Gradle
date: 2023-02-19
author: Tang Moying
categories: [build]
tags: [Latest Version]
lang: en
alt_url: /post/gradle-dependency-use-latest-version
---

In `Gradle`, if you declare a dependency without specifying a version, it will fail with an error saying the dependency cannot be found.
But if you have a lot of dependencies, you would also have to go to the repository and look up the latest version of each library one by one.

So does gradle support using the latest version of a dependency directly?
The answer is yes, though the `gradle` documentation does not point it out in any prominent place.

The way to do it is to put a plus sign `+` where the `version` goes, and `gradle` will work out the latest version automatically and download it.

Once you have specified the latest version everywhere, you can then use the log to resolve the occasional dependency conflict errors — twice the result with half the effort.
