---
title: One Article to Sort Out How rake, Rakefile, gem, gemspec, bundler, bundle and Gemfile Relate to Each Other
date: 2020-02-15
author: Tang Moying
categories: [build]
tags: [rake, Rakefile, gem, gemspec, bundler, bundle, Gemfile, Ruby]
lang: en
alt_url: /post/rake-rakefile-gem-gemfile-bundler
---

## Overview

These are all concepts from the Ruby language. Below I'll introduce the meaning of each term and compare it with other similar tools, so that readers can understand them.

<!--以上为摘要内容-->

## Ruby

`Ruby` means ruby the gemstone, and it's the name of a programming language. The logo of the `Ruby` language is a ruby.

`Ruby` is an open-source dynamic programming language that emphasizes concision and efficiency. Its syntax is elegant, natural to read and comfortable to write.

The extension of `Ruby` source files is `.rb`.

## rake and Rakefile

`rake` is `Ruby`'s `make`-like program. You can define tasks and source code dependencies in it.

rake = r(uby's m)ake

Just as `make` has a `Makefile`, `rake` has a corresponding `Rakefile`.

Both of them fall into the category of build tools.

Shown in a table:

| Language | Build tool name | Build tool config file |
| --- | ---------- | ------------- |
| C   | Make       | Makefile      |
| Ruby | Rake      | Rakefile      |


## gem and gemspec

`gem` means gemstone. It's easy to see that it belongs to the same family as the `Ruby` ruby.

`gem` is `Ruby`'s package management system; the command is `gem`, and the package extension is also `.gem`, similar to `rpm`.

However, `rpm` can only install local packages and cannot download over the network. Downloading over the network requires `yum` or `dnf`.

Likewise, on the Debian family, the package management system is `dpkg`, which cannot download over the network. Downloading over the network requires `apt`.

A gemspec file is the description file for a gem, containing gem-related information such as package name, version, summary, description, author and homepage.

Similarly, dpkg packaging needs a spec file, and deb packaging needs a control file.

Shown in a table:

| Language | Package manager | Package extension | Local | Network | Description file name |
| --- | ---------- | ---- | ---- | --- | --------- |
| Ruby | gem       | .gem |  ✅  | ✅  | \<package-name\>.gemspec |
| Red Hat family | rpm  | .rpm |  ✅  | ❌  | SPECS/\<package-name\>.spec    |
| Red Hat family | yum/dnf  | .rpm |  ❌  | ✅ |  -                  |
| Debian family  | dpkg | .deb |  ✅  | ❌ |  debian/control         |
| Debian family  | apt | .deb |  ❌  | ✅  |  -                      |

Note here that the file corresponding to gem is gemspec. The Gemfile has nothing to do with gem — it's actually the name of bundler's configuration file.


## bundler, bundle and Gemfile

`bundler` is the external dependency management tool for Ruby applications.

`bundle` is another gem, meant to solve the problem of "misspelling bundler as bundle." Its only function is to install bundler, so that the two agree and no error is reported.

The `Gemfile` file describes the external dependency gems needed to run the related Ruby application, containing information such as the source, gem names and gem versions.

When you run `bundler install`, `bundler` reads the `Gemfile` and installs all the dependency gems in one go.

## Summary

rake is Ruby's build tool, and its configuration file is the Rakefile.

gem is Ruby's package management tool, and the extension of its configuration file is .gemspec.

bundler is Ruby's external dependency management tool; it has an alias called "bundle", and its configuration file is the Gemfile.
