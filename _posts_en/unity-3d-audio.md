---
title: Setting Up 3D Audio in Unity
date: 2022-03-03
author: Tang Moying
categories: [build]
tags: [Unity]
lang: en
alt_url: /post/unity-3d-audio
---

1. In `Audio Source`, set `Spatial Blend` to 1;

2. In `3D Sound Settings` under `Audio Source`, set `Min Distance` and `Max Distance`.

Within the minimum distance, the audio source plays the clip at maximum volume. Beyond that distance the volume decreases, and at the maximum distance the user no longer hears the audio.
