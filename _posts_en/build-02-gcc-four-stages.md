---
title: 'Build Tools (Part 2): The Four Stages of GCC Compilation — What Your .c File Actually Goes Through'
date: 2023-07-02
author: Tang Moying
categories: [build]
tags: [Linux, C/C++, GCC, Compilers]
lang: en
alt_url: /post/build-02-gcc-four-stages
---


## 1. A Seemingly Simple Question

Every day you type `gcc -o hello hello.c`, press enter, and get an executable file. It all seems perfectly natural.

But if you open that executable, you'll see a pile of gibberish — it's no longer anything a human can read.

So what actually happens while a `.c` file turns into `hello`?

The answer is more complicated than you'd think: **the compiler doesn't do it in one step; it goes through four stages**.

<!--以上为摘要内容-->

## 2. The Four Stages at a Glance

```
hello.c → preprocessing → hello.i → compilation → hello.s → assembly → hello.o → linking → hello
```

Let me use an analogy:

- **Preprocessing**: buying groceries at the market, getting all the ingredients ready (expanding header files, substituting macros)
- **Compilation**: chopping and stir-frying in the kitchen, turning the ingredients into a dish (C code becomes assembly code)
- **Assembly**: packing that dish into a takeout box (assembly code becomes machine code)
- **Linking**: putting all the takeout boxes into one bag, adding chopsticks and napkins (multiple `.o` files and libraries are merged into an executable)

Let's look at them one by one.

## 3. Stage One: Preprocessing

What preprocessing does is actually very simple: **it handles every directive that begins with `#`**.

For example, if your code contains:

```c
#include <stdio.h>
#define PI 3.14
```

After preprocessing:
- `#include <stdio.h>` is replaced by the entire contents of `stdio.h` (thousands of lines of code)
- `PI` is replaced by `3.14` everywhere it appears
- comments are deleted

You can look at the result of preprocessing yourself:

```bash
gcc -E hello.c -o hello.i
```

Open `hello.i` and you'll be shocked to find that a 5-line `hello.c` becomes hundreds or even thousands of lines after preprocessing. That's because `stdio.h` itself nests other header files, unfolding layer after layer.

This is the core task of the preprocessing stage: **assembling code fragments scattered all over into one complete piece of code ready for compilation**.

## 4. Stage Two: Compilation

This is where the real work finally starts: **translating C code into assembly code**.

Assembly is a low-level language in which each line corresponds to roughly one CPU instruction. For example, `a + b` might become:

```asm
movl    -8(%rbp), %eax
addl    -4(%rbp), %eax
```

You can inspect the result of compilation:

```bash
gcc -S hello.c -o hello.s
```

Open `hello.s` and you'll see a pile of instructions beginning with `mov`, `push` and `call`. This is what your program looks like in the eyes of the CPU.

At this stage the compiler performs a great deal of optimization — it analyzes your code and makes equivalent transformations so that the generated assembly runs faster. For example:
- hoisting computations that don't change inside a loop out of the loop
- deleting unused variables outright
- replacing hand-written logic with a more efficient instruction sequence

## 5. Stage Three: Assembly

The assembly stage is simple: **translate assembly code into machine code**.

Machine code is binary instructions made of `0`s and `1`s, which the CPU can understand directly.

```bash
gcc -c hello.c -o hello.o
```

You now have a `.o` file (an object file)! But note that this `.o` file still can't be executed. If you force it to run, the system will throw an error.

Why? Because it's still missing something — it calls `printf`, but `printf`'s code isn't in this `.o` file. It has merely left a marker saying "`printf` is needed here."

That marker is an **undefined reference** in the symbol table.

## 6. Stage Four: Linking

The linker says: missing `printf`, are you? Here, let me fill it in for you.

The linker's task is: **to stitch multiple `.o` files and library files into one complete executable**.

```bash
gcc -o hello hello.o
```

At this point gcc automatically links `hello.o` together with the standard C library (`libc`). `printf`'s code lives in `libc`; the linker finds it and stuffs it into the final executable.

The linker also has one very important job: **address relocation**. The addresses inside each `.o` file are relative before linking, and the linker has to adjust them into the absolute addresses (or loadable virtual addresses) in the final executable.

## 7. A Few Compiler Parameters That Often Get Confused

Once you understand these four stages, the following gcc parameters become easy to remember:

- `-I /path/to/include`: tells the **preprocessor** where to find header files (I = Include)
- `-L /path/to/lib`: tells the **linker** where to find library files (L = Library path)
- `-l 库名`: tells the **linker** which library to link (`-lm` links `libm`, the math library)
- `-D 宏名=值`: equivalent to adding a `#define` line at the very top of the code; belongs to the **preprocessing stage**
- `-Wall`: turn on all warnings; belongs to the **compilation stage**
- `-g`: generate debugging information so that gdb can locate source code
- `-O2`: optimization level; belongs to the **compilation stage**

A classic confusion: many people can't tell `-I` from `-L`. Now is a good time to distinguish them — the former governs finding header files (preprocessing), the latter governs finding library files (linking); they are completely different things.

## 8. Summary

| Stage | Input | Output | What it does |
|------|------|------|--------|
| Preprocessing | `.c` | `.i` | Expand #include and #define, remove comments |
| Compilation | `.i` (or `.c`) | `.s` | C → assembly, with optimization |
| Assembly | `.s` | `.o` | Assembly → machine code |
| Linking | `.o` + library | Executable | Stitching, address relocation |

These four stages are the foundation for understanding how C/C++ compilation works. Next time you hit an `undefined reference` error, you'll know the linking stage is the problem — not that you wrote the code wrong.

---

In the next article we'll talk about libraries — what `.a` and `.so` actually are, and why your program sometimes runs and sometimes won't start at all.

A small step forward every day is a new height!
