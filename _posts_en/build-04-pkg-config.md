---
title: 'Build Tools (Part 4): pkg-config — The Key That Solves Dependency Hell'
date: 2023-07-09
author: Tang Moying
categories: [build]
tags: [Linux, C/C++, pkg-config, Dependency Management]
lang: en
alt_url: /post/build-04-pkg-config
---


## 1. A maddening scenario

Suppose you want to write a program that makes HTTP requests using `libcurl`. You know how to write the code:

```c
#include <curl/curl.h>
// send requests with the curl_easy_* family of functions
```

But when it comes to compiling, here comes the problem — you don't know which parameters to add.

Where are the headers? Where are the library files? `libcurl` may also depend on other libraries, and where are those?

You try compiling like this:

```bash
gcc -o downloader downloader.c -lcurl
```

Error: cannot find `curl/curl.h`.

You add `-I`:

```bash
gcc -I/usr/local/include -o downloader downloader.c -lcurl
```

Another error: cannot find `libcurl.so`.

You keep adding `-L`:

```bash
gcc -I/usr/local/include -L/usr/local/lib -o downloader downloader.c -lcurl
```

Still an error: `undefined reference to ssl_xxx`. It turns out `libcurl` also depends on OpenSSL, so you have to add the OpenSSL path as well.

You have fallen into parameter hell — for every library you have to manually look up its installation path, its header path, its own dependencies... can all of this be automated?

The answer is yes. That is `pkg-config`.

<!--以上为摘要内容-->

## 2. What pkg-config is

`pkg-config` is a **compilation-parameter query tool**. You tell it which library you need, and it tells you which compilation parameters to add.

```bash
pkg-config --cflags --libs libcurl
```

Output:

```
-I/usr/local/include -lcurl
```

You just need to embed this output into your compilation command:

```bash
gcc -o downloader downloader.c $(pkg-config --cflags --libs libcurl)
```

One command does it. No matter which directory `libcurl` is installed in, no matter how many sub-libraries it depends on, `pkg-config` has it figured out for you.

That is its value: **standardize the dependency information so the compiler can query it, instead of relying on human memory**.

## 3. How pkg-config works

The magic of `pkg-config` comes from a kind of configuration file called `.pc`.

When you install a library (usually through `make install` or a package manager), it also installs a `.pc` file into `pkg-config`'s search path, usually `/usr/lib/pkgconfig/` or `/usr/local/lib/pkgconfig/`.

A typical `.pc` file looks like this:

```
# libcurl.pc
prefix=/usr/local
exec_prefix=${prefix}
libdir=${exec_prefix}/lib
includedir=${prefix}/include

Name: libcurl
Description: A library for transferring data with URLs
Version: 7.79.1
Libs: -L${libdir} -lcurl
Cflags: -I${includedir}
```

What `pkg-config` does is very simple:
- Find `libcurl.pc` under its search path
- Parse the variables in this file
- Output the corresponding content according to the parameters you request (`--cflags` or `--libs`)

`--cflags` outputs the parameters needed to compile the headers, and `--libs` outputs the parameters needed for linking. Keeping them separate is very necessary — in a Makefile, the header search path is used at the compilation stage and the library search path is used at the linking stage.

## 4. A real example

Take `gtk+-3.0` (a GUI library) as an example, and see just how many dependencies it hides:

```bash
pkg-config --cflags --libs gtk+-3.0
```

The output may be long enough to make you doubt life itself:

```
-pthread -I/usr/include/gtk-3.0 -I/usr/include/pango-1.0 -I/usr/include/glib-2.0 -I/usr/lib/glib-2.0/include -I/usr/include/harfbuzz -I/usr/include/freetype2 -I/usr/include/libpng16 -I/usr/include/libmount -I/usr/include/blkid -I/usr/include/fribidi -I/usr/include/cairo -I/usr/include/pixman-1 -I/usr/include/gdk-pixbuf-2.0 -I/usr/include/webp -I/usr/include/gio-unix-2.0 -I/usr/include/atk-1.0 -I/usr/include/at-spi2-atk/2.0 -I/usr/include/at-spi-2.0 -I/usr/include/dbus-1.0 -I/usr/lib/dbus-1.0/include -lgtk-3 -lgdk-3 -lpangocairo-1.0 -lpango-1.0 -lharfbuzz -latk-1.0 -lcairo-gobject -lcairo -lgdk_pixbuf-2.0 -lgio-2.0 -lgobject-2.0 -lglib-2.0
```

A dozen or so lines of parameters. Without `pkg-config`, you would have to look these parameters up and try them one by one, by hand. With it, a single command takes care of everything.

That is the liberation that tools bring.

## 5. How to use it in a Makefile and in CMake

**In a Makefile:**

```makefile
CFLAGS += $(shell pkg-config --cflags libcurl)
LDFLAGS += $(shell pkg-config --libs libcurl)
```

**It's even simpler in CMake:**

```cmake
find_package(PkgConfig REQUIRED)
pkg_check_modules(CURL REQUIRED libcurl)

target_include_directories(myapp PRIVATE ${CURL_INCLUDE_DIRS})
target_link_libraries(myapp ${CURL_LIBRARIES})
```

CMake will help you automatically convert `pkg-config`'s output into variables that CMake can use.

## 6. Viewing installed libraries

Want to see which libraries are available on your system?

```bash
# list all the libraries pkg-config knows about
pkg-config --list-all

# view detailed information about a library
pkg-config --modversion libcurl     # version number
pkg-config --print-errors --exists libcurl  # check whether the library exists
```

## 7. The limitations of pkg-config

`pkg-config` is very handy, but it has a precondition: **the library must provide a `.pc` file**. If a library doesn't provide one (or you forgot `make install` after compiling from source), `pkg-config` won't know it exists.

In that case, you can only go back to the old way of typing parameters by hand. However, almost all common open-source libraries support `pkg-config`, so this pain point is much smaller than before.

---

In the next article, we turn our attention to a more advanced build system — CMake has arrived. It can not only help you find dependencies, but also help you generate a Makefile, manage the project structure, and build across platforms. Ready to level up?

A small step forward every day is a new height!
