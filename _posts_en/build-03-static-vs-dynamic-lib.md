---
title: 'Build Tools (Part 3): Static Libraries vs Dynamic Libraries — What Exactly Is the Difference Between .a, .so and .dylib'
date: 2023-07-08
author: Tang Moying
categories: [build]
tags: [Linux, C/C++, Static Libraries, Dynamic Libraries, Linking]
lang: en
alt_url: /post/build-03-static-vs-dynamic-lib
---


## 1. It Starts with an Awkward Experience

You've surely run into a scene like this:

A colleague hands you a compiled program, you double-click it full of excitement — and up pops an error box: `找不到 xxx.dll`.

Or you compile a program fine under Linux, copy it to another machine and run it:

```bash
./myapp: error while loading shared libraries: libxxx.so.1: cannot open shared object file
```

You're baffled: the compilation went perfectly, so why is it, in a different place, "missing this and short of that"?

The answer lies with the protagonists of this article — **dynamic libraries** and **static libraries**.

<!--以上为摘要内容-->

## 2. What Is a Library

A library is **a collection of code that someone else has written and already compiled**, which you can use directly instead of reinventing the wheel.

For instance, if you want to compute a square root in C, you don't need to implement the square-root algorithm yourself; you just `#include <math.h>` and link the math library, `libm`.

```bash
gcc -o calc calc.c -lm
```

Here `libm` is a library. `-lm` tells the linker: link the code from `libm` in for me.

So a library is **a reusable compilation product**. Depending on how it is linked, libraries come in two kinds:

## 3. Static Libraries: Stuffed Straight In at Compile Time

A static library is usually named `libxxx.a` (Linux/macOS) or `xxx.lib` (Windows).

`.a` is short for **archive**; in essence it just packs several `.o` files into one bundle:

```bash
# first compile into .o
gcc -c math_utils.c -o math_utils.o
gcc -c str_utils.c -o str_utils.o

# pack into a static library
ar rcs libutils.a math_utils.o str_utils.o
```

When you use it:

```bash
gcc -o myapp main.c -L. -lutils
```

The linker copies the **code that is actually used** out of `libutils.a` into the final executable.

**Characteristics of static libraries:**

- ✅ The resulting executable is **self-contained** and runs wherever you copy it
- ✅ No version-compatibility problems: the library version is locked in at compile time
- ❌ The executable is **large** (every program carries its own copy of the library code)
- ❌ When the library is updated, every program that uses it must be **recompiled**

An analogy: a static library is like printing the recipe straight into the book — you can read it wherever you go, but the book will be thick.

## 4. Dynamic Libraries: Loaded on Demand at Runtime

A dynamic library is named `libxxx.so` (Linux), `libxxx.dylib` (macOS) or `xxx.dll` (Windows).

`.so` is short for **shared object**; as the name suggests, **several programs share the same copy of the library**.

Creating a dynamic library:

```bash
gcc -shared -fPIC -o libutils.so math_utils.c str_utils.c
```

- `-shared`: tells gcc to produce a dynamic library
- `-fPIC`: produce **Position Independent Code**, which is the key to sharing — no matter where in memory the library is loaded, the code can execute correctly

Using it is the same as with a static library:

```bash
gcc -o myapp main.c -L. -lutils
```

**But at runtime**, the system needs to find where `libutils.so` is. By default, the system searches only a few standard paths:

- `/lib`, `/usr/lib`, `/usr/local/lib`
- the paths named by the `LD_LIBRARY_PATH` environment variable

If the library isn't in those paths, you can:

```bash
# specify it temporarily
export LD_LIBRARY_PATH=/path/to/libs:$LD_LIBRARY_PATH
./myapp
```

Or write the search path in at compile time:

```bash
gcc -o myapp main.c -L. -lutils -Wl,-rpath,/path/to/libs
```

**Characteristics of dynamic libraries:**

- ✅ The executable is **small** (the library code isn't inside it)
- ✅ Upgrading the library doesn't require recompiling the program (as long as the interface hasn't changed)
- ✅ **Several programs share the same copy of the library**, saving memory
- ❌ Deployment **must guarantee that the target machine also has this library**
- ❌ Version mismatches can occur (`libxxx.so.1` vs `libxxx.so.2`)

An analogy: a dynamic library is like a reference book in a library — everyone knows where the book is, and you go and consult it when you need it, but if you move house (change environments), the book can no longer be found.

## 5. A Comparison Table

| | Static libraries | Dynamic libraries |
|---|--------|--------|
| File suffix | `.a` / `.lib` | `.so` / `.dylib` / `.dll` |
| Linking time | Compile time | Runtime |
| Executable size | Large | Small |
| Deployment difficulty | Simple (self-contained) | Must ensure the target environment has the library |
| How to update | Recompile | Just replace the library file |
| Memory footprint | One copy per process | Shared by multiple processes |

## 6. A Piece of Practical Advice

In daily work, this is how I'd choose between the two kinds of library:

**Delivering commercial software**: link statically where you can, or package the dynamic libraries into the installation directory. You never want to get a call from a user saying "your software won't open".

**Linux system software**: link dynamically. Because you don't know the paths on the user's system, and the system's package manager will take care of the dependencies.

**Inside your own team**: link dynamically. Everyone's environment is uniform, upgrading dynamic libraries is convenient, and compatibility problems surface promptly.

**Libraries that need to iterate continuously and quickly**: link dynamically. Fix a bug and you don't have to make every downstream project recompile.

---

In the next article we'll talk about a wonderful tool for solving the dynamic-library lookup problem — `pkg-config`. It will put an end to the nightmare of typing `-I` and `-L` by hand.

A small step forward every day is a new height!
