---
title: The Difference Between Android App Bundle (AAB) and APK
date: 2021-12-21
author: Tang Moying
categories: [build]
tags: [Android, AAB, APK]
lang: en
alt_url: /post/android-app-bundle-copy
---

An Android App Bundle is a publishing format that contains all of the app's compiled code and resources, and it hands the generation and signing of APKs over to the app store to complete.

<!--以上为摘要内容-->

The app store uses the App Bundle to generate and serve an optimized APK for each device configuration, so only the code and resources that a particular device needs are downloaded to run the app.

App developers no longer have to build, sign and manage multiple APKs in order to optimize support for different devices, and users get a smaller, better optimized download package.

In short, apk is still the file format that ends up installed on the user's device.

Before the aab format appeared, developers who wanted to optimize for different devices had to package multiple apk files themselves. For example, app_1.apk for model 1 and app_2.apk for model 2. If there are a lot of devices, then in order for users to have the best possible experience, every release had to be packaged into n apk files.

After the aab format appeared, the step of packaging apks is handed over to the app store. Developers only need to generate the aab file format and upload it to the app store; the work of packaging apks for different devices is handled by the app store.

The aab format cannot be installed directly on a device; what gets installed on the user's device is still an apk file, it is just that this file is no longer created by the developer.
