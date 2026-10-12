---
title: 'Build Tools (Part 1): From Typing gcc by Hand to the Makefile — The First Evolution of Build Tools'
date: 2023-07-01
author: Tang Moying
categories: [build]
tags: [Linux, C/C++, Makefile, Build Tools]
lang: en
alt_url: /post/build-01-makefile-basics
---


## 1. How Did You First Compile a C Program?

Think back: what was the situation when you wrote your first C program?

```c
// hello.c
#include <stdio.h>
int main() {
    printf("hello world\n");
    return 0;
}
```

Then you opened a terminal and typed:

```bash
gcc -o hello hello.c
./hello
```

The screen printed `hello world`, and in that moment you felt you had opened the door to a new world.

Later the project grew, and you had three source files:

```bash
gcc -o myapp main.c utils.c network.c
```

Still tolerable. But once you had a dozen source files and a third-party library to link:

```bash
gcc -o myapp main.c utils.c network.c config.c \
    logger.c parser.c database.c cache.c auth.c \
    -I/usr/local/include -L/usr/local/lib -lcurl -lssl -lcrypto
```

Every time you changed one line of code, you had to type that long command string all over again. Even pressing the up arrow to search your command history was maddening.

This is the **pain of building by hand**: repetitive, error-prone, and harder to maintain when a team works together.

<!--以上为摘要内容-->

## 2. The First Solution: Write a Script

Clever people immediately thought: why not put that command string into a shell script?

```bash
#!/bin/bash
# build.sh
gcc -o myapp main.c utils.c network.c config.c \
    logger.c parser.c database.c cache.c auth.c \
    -I/usr/local/include -L/usr/local/lib -lcurl -lssl -lcrypto
```

Running `./build.sh` for every build really did save a lot of trouble.

But this approach has a fatal flaw: **change any single file and it recompiles every file**. That doesn't matter while the project is small, but once you have several hundred source files, one full build can take minutes or even tens of minutes.

The smarter approach is to **compile only the files that changed**. But doing that by hand in a script is far too much trouble — you would have to check each file's modification time, work out which ones need recompiling, and maintain the dependencies yourself.

So `make` made its entrance.

## 3. Make's Core Idea: Dependencies and Rules

`make` has a very plain design: you have to tell it two things —

1.  Which **source files** the **target file** depends on
2.  What **command** to run to produce the target file from the source files

Written as a Makefile, that looks like this:

```makefile
# The simplest Makefile
hello: hello.c
	gcc -o hello hello.c
```

- `hello` is called the target
- `hello.c` is called a prerequisite
- `gcc -o hello hello.c` is called the recipe

`make` has a very neat mechanism: **if the target's modification time is newer than all of its prerequisites, skip the compilation**. In other words, `make` only re-runs the gcc command when you have modified `hello.c`.

This mechanism is called the **incremental build**, and it is the essence of make.

## 4. A Slightly More Realistic Example

Suppose your project is structured like this:

```makefile
# Makefile
myapp: main.o utils.o network.o
	gcc -o myapp main.o utils.o network.o

main.o: main.c utils.h network.h
	gcc -c main.c

utils.o: utils.c utils.h
	gcc -c utils.c

network.o: network.c network.h utils.h
	gcc -c network.c
```

There are two levels of targets here:
- First level: link the three `.o` files into the final executable `myapp`
- Second level: compile each `.c` file into its corresponding `.o` file

When you modify `utils.c` and then run `make`:
- The prerequisites of `main.o` are unchanged → skip
- The prerequisites of `network.o` are unchanged → skip
- The prerequisites of `utils.o` have changed → recompile
- The prerequisites of `myapp` (`utils.o`) have changed → relink

Only what needs compiling gets compiled. That is the appeal of incremental builds.

## 5. Variables and Wildcards in a Makefile

The Makefile above has one glaring problem: file names are repeated far too many times. Renaming one file might mean editing seven or eight places.

`make` provides variables and wildcards to solve this:

```makefile
# Using variables and wildcards
CC = gcc
CFLAGS = -Wall -g
OBJS = main.o utils.o network.o
TARGET = myapp

$(TARGET): $(OBJS)
	$(CC) -o $@ $^

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@
```

There are a few important things here:

- `$(CC)`, `$(CFLAGS)`: user-defined variables; `$(变量名)` retrieves the value
- `$@`: an automatic variable standing for the name of the current target
- `$^`: an automatic variable standing for all of the prerequisites
- `$<`: an automatic variable standing for the first prerequisite
- `%.o: %.c`: a pattern rule, matching every `.o`-from-`.c` conversion

With this template in place, adding a new file later means adding one name to `OBJS`, and the Makefile automatically knows how to compile it.

## 6. The Limits of Makefiles

Useful as `make` is, it comes with some annoyances:

- **Differences between platforms**: on Linux you use `gcc`, on macOS people habitually use `clang`, and Windows is even more painful
- **Finding libraries**: the same library may sit at completely different paths on different systems
- **Makefiles themselves grow long**: in large projects the maintenance cost of a hand-written Makefile keeps climbing

That is why **tools that generate Makefiles** appeared later — that is, higher-level build systems. But however advanced a build system is, in the end it is solving the same problem:

**Letting the computer know: whatever changed is what has to be recompiled.**

Understand that and you understand the essence of every build system.

---

In the next article we will take up a more fundamental topic: what exactly does the `.c` file you wrote go through on its way to becoming an executable program?

A small step forward every day is a new height!
