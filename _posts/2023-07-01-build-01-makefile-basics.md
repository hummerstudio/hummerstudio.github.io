---
title: 构建工具（一）：从手敲 gcc 到 Makefile——构建工具的第一次进化
author: 唐明
categories: [build]
tags: [Linux, C/C++, Makefile, 构建工具]
---

* TOC
{:toc}

## 1、你最早是怎么编译 C 程序的？

回想一下，你第一次写 C 程序是什么场景？

```c
// hello.c
#include <stdio.h>
int main() {
    printf("hello world\n");
    return 0;
}
```

然后打开终端，敲下：

```bash
gcc -o hello hello.c
./hello
```

屏幕输出 `hello world`，那一刻你感觉自己打开了新世界的大门。

后来项目变大了，你有了三个源文件：

```bash
gcc -o myapp main.c utils.c network.c
```

还能接受。但当你有十几个源文件，还依赖了第三方库的时候：

```bash
gcc -o myapp main.c utils.c network.c config.c \
    logger.c parser.c database.c cache.c auth.c \
    -I/usr/local/include -L/usr/local/lib -lcurl -lssl -lcrypto
```

每次改一行代码，都要重新敲一遍这一长串命令。就算按上方向键找历史命令，也让人崩溃。

这就是**手工构建的痛点**：重复、容易出错、团队协作时更难维护。

<!--以上为摘要内容-->

## 2、第一种解决方案：写个脚本

聪明人马上想到：把这串命令放到一个 shell 脚本里不就行了？

```bash
#!/bin/bash
# build.sh
gcc -o myapp main.c utils.c network.c config.c \
    logger.c parser.c database.c cache.c auth.c \
    -I/usr/local/include -L/usr/local/lib -lcurl -lssl -lcrypto
```

每次编译跑 `./build.sh`，确实省了不少事。

但这个方案有个致命的毛病：**每次修改任意一个文件，它都会重新编译所有文件**。项目小的时候无所谓，但当你有了几百个源文件，一次全量编译可能要几分钟甚至几十分钟。

更聪明的做法是：**只编译修改过的文件**。但这靠手写脚本太麻烦了——你需要检查每个文件的修改时间，判断哪些需要重编译，手动维护依赖关系。

于是，`make` 登场了。

## 3、Make 的核心思想：依赖与规则

`make` 的设计非常朴素：你要告诉它两件事——

1.  **目标文件**依赖哪些**源文件**
2.  从源文件生成目标文件，要执行什么**命令**

翻译成 Makefile 就是这样：

```makefile
# 最简单的 Makefile
hello: hello.c
	gcc -o hello hello.c
```

- `hello` 叫目标（target）
- `hello.c` 叫依赖（prerequisite）
- `gcc -o hello hello.c` 叫配方（recipe）

`make` 有一个非常巧妙的机制：**如果目标的修改时间比所有依赖都新，就跳过编译**。也就是说，只有当你修改了 `hello.c`，`make` 才会重新执行 gcc 命令。

这个机制叫**增量构建**，它是 make 的精髓。

## 4、一个稍微真实的例子

假设你的项目结构是这样的：

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

这里有两个层次的目标：
- 第一层：链接三个 `.o` 文件得到最终的可执行文件 `myapp`
- 第二层：编译每个 `.c` 得到对应的 `.o` 文件

当你修改 `utils.c` 后运行 `make`：
- `main.o` 的依赖没变 → 跳过
- `network.o` 的依赖没变 → 跳过
- `utils.o` 的依赖变了 → 重新编译
- `myapp` 的依赖（`utils.o`）变了 → 重新链接

只编译了该编译的部分。这就是增量构建的魅力。

## 5、Makefile 的变量与通配符

上面的 Makefile 有一个很明显的问题：文件名重复了太多次。改一个文件名可能要改七八处。

`make` 提供了变量和通配符来解决这个问题：

```makefile
# 使用变量和通配符
CC = gcc
CFLAGS = -Wall -g
OBJS = main.o utils.o network.o
TARGET = myapp

$(TARGET): $(OBJS)
	$(CC) -o $@ $^

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@
```

这里有几个重要的东西：

- `$(CC)`、`$(CFLAGS)`：自定义变量，`$(变量名)` 取值
- `$@`：自动变量，代表当前目标名
- `$^`：自动变量，代表所有依赖
- `$<`：自动变量，代表第一个依赖
- `%.o: %.c`：模式规则，匹配所有 `.o` 到 `.c` 的转换

有了这个模板，以后加新文件只需要在 `OBJS` 里加一个名字，Makefile 自动就知道怎么编译它。

## 6、Makefile 的局限

`make` 虽然好用，但也有一些烦恼：

- **不同平台的差异**：Linux 下用 `gcc`，macOS 下习惯用 `clang`，Windows 更麻烦
- **库的查找**：不同系统下同一个库的路径可能完全不同
- **Makefile 本身会变得很长**：大型项目中，手写 Makefile 的维护成本越来越高

所以后来出现了**生成 Makefile 的工具**——也就是更高级的构建系统。但无论多高级的构建系统，最终都在解决同一个问题：

**让计算机知道：改了什么，就要重新编译什么。**

理解了这一点，你就理解了所有构建系统的本质。

---

下一篇文章，我们聊一个更基础的话题：你写的 `.c` 文件，在变成可执行程序的过程中，到底经历了什么？

每天前进一小步，就是一个新的高度！
