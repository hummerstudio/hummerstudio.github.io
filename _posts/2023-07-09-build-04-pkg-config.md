---
title: 构建工具（四）：pkg-config——解决依赖地狱的那把钥匙
author: 唐明
categories: [build]
tags: [Linux, C/C++, pkg-config, 依赖管理]
---


## 1、一个令人抓狂的场景

假设你要用 `libcurl` 写一个 HTTP 请求的程序。你知道代码怎么写：

```c
#include <curl/curl.h>
// 用 curl_easy_* 系列函数发请求
```

但是编译的时候，问题来了——你不知道该加哪些参数。

头文件在哪？库文件在哪？`libcurl` 还可能依赖别的库，那些库又在哪？

你试着这样编译：

```bash
gcc -o downloader downloader.c -lcurl
```

报错：找不到 `curl/curl.h`。

你加了 `-I`：

```bash
gcc -I/usr/local/include -o downloader downloader.c -lcurl
```

又报错：找不到 `libcurl.so`。

你继续加 `-L`：

```bash
gcc -I/usr/local/include -L/usr/local/lib -o downloader downloader.c -lcurl
```

还是报错：`undefined reference to ssl_xxx`。原来 `libcurl` 还依赖了 OpenSSL，你也得把 OpenSSL 的路径加上。

你陷入了参数地狱——每个库都要手动去查它的安装路径、头文件路径、它自己的依赖……这一切能不能自动化？

答案是能。那就是 `pkg-config`。

<!--以上为摘要内容-->

## 2、pkg-config 是什么

`pkg-config` 是一个**编译参数查询工具**。你告诉它你需要哪个库，它告诉你该加什么编译参数。

```bash
pkg-config --cflags --libs libcurl
```

输出：

```
-I/usr/local/include -lcurl
```

你只需要把这段输出嵌到你的编译命令里：

```bash
gcc -o downloader downloader.c $(pkg-config --cflags --libs libcurl)
```

一条命令搞定。不管 `libcurl` 安装在哪个目录，不管它依赖了多少子库，`pkg-config` 都替你想好了。

这就是它的价值：**把依赖信息标准化，让编译器查询，而不是靠人脑记忆**。

## 3、pkg-config 的工作原理

`pkg-config` 的魔法来自一种叫 `.pc` 的配置文件。

当你安装一个库时（通常通过 `make install` 或包管理器），它会顺便安装一个 `.pc` 文件到 `pkg-config` 的搜索路径下，通常是 `/usr/lib/pkgconfig/` 或 `/usr/local/lib/pkgconfig/`。

典型的 `.pc` 文件长这样：

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

`pkg-config` 做的事情非常简单：
- 在其搜索路径下找到 `libcurl.pc`
- 解析这个文件里的变量
- 根据你要求的参数（`--cflags` 或 `--libs`）输出相应的内容

`--cflags` 输出编译头文件需要的参数，`--libs` 输出链接需要的参数。分开是很有必要的——在 Makefile 里，头文件搜索路径在编译阶段用，库搜索路径在链接阶段用。

## 4、一个真实的例子

以 `gtk+-3.0`（一个 GUI 库）为例，看看它到底藏了多少依赖：

```bash
pkg-config --cflags --libs gtk+-3.0
```

输出可能长到你怀疑人生：

```
-pthread -I/usr/include/gtk-3.0 -I/usr/include/pango-1.0 -I/usr/include/glib-2.0 -I/usr/lib/glib-2.0/include -I/usr/include/harfbuzz -I/usr/include/freetype2 -I/usr/include/libpng16 -I/usr/include/libmount -I/usr/include/blkid -I/usr/include/fribidi -I/usr/include/cairo -I/usr/include/pixman-1 -I/usr/include/gdk-pixbuf-2.0 -I/usr/include/webp -I/usr/include/gio-unix-2.0 -I/usr/include/atk-1.0 -I/usr/include/at-spi2-atk/2.0 -I/usr/include/at-spi-2.0 -I/usr/include/dbus-1.0 -I/usr/lib/dbus-1.0/include -lgtk-3 -lgdk-3 -lpangocairo-1.0 -lpango-1.0 -lharfbuzz -latk-1.0 -lcairo-gobject -lcairo -lgdk_pixbuf-2.0 -lgio-2.0 -lgobject-2.0 -lglib-2.0
```

十几行参数。如果没有 `pkg-config`，这些参数你得一个一个人肉去查、去试。有了它，一行命令全部搞定。

这就是工具带来的解放。

## 5、在 Makefile 和 CMake 里怎么用

**在 Makefile 里：**

```makefile
CFLAGS += $(shell pkg-config --cflags libcurl)
LDFLAGS += $(shell pkg-config --libs libcurl)
```

**在 CMake 里更简单：**

```cmake
find_package(PkgConfig REQUIRED)
pkg_check_modules(CURL REQUIRED libcurl)

target_include_directories(myapp PRIVATE ${CURL_INCLUDE_DIRS})
target_link_libraries(myapp ${CURL_LIBRARIES})
```

CMake 会帮你把 `pkg-config` 的输出自动转成 CMake 能用的变量。

## 6、查看已安装的库

想看看你的系统上都有哪些库可以用？

```bash
# 列出所有 pkg-config 知道的库
pkg-config --list-all

# 查看某个库的详细信息
pkg-config --modversion libcurl     # 版本号
pkg-config --print-errors --exists libcurl  # 检查库是否存在
```

## 7、pkg-config 的局限

`pkg-config` 很好用，但它有个前提：**库必须提供了 `.pc` 文件**。如果某个库没有提供（或者你从源码编译后忘了 `make install`），`pkg-config` 就不知道它的存在。

这种情况下，你只能回到手敲参数的老路上。不过常见的开源库几乎都支持 `pkg-config`，所以这个痛点比以前小多了。

---

下一篇文章，我们把目光转向更高级的构建系统——CMake 来了。它不光能帮你找依赖，还能帮你生成 Makefile、管理项目结构、跨平台构建。准备好升级了吗？

每天前进一小步，就是一个新的高度！
