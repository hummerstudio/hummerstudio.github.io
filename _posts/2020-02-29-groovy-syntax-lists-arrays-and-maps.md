---
title: Groovy语法系列教程之集合（六）【完结】
author: 唐明
categories: [Groovy]
tags: [Groovy]
---
* TOC
{:toc}

# Groovy语法概述

本系列教程介绍Groovy编程语言的语法。Groovy的语法源自Java语法，但是通过特定类型对其进行了增强，并允许进行某些简化。

<!--以上为摘要内容-->

Groovy集合包括列表（Lists）、数组（Arrays）、映射（Maps）三种类型。

# 7. 列表

Groovy使用逗号分隔的值列表（用方括号括起来）表示列表。 

Groovy列表是JDK原生的`java.util.List`，Groovy并未定义自己的集合类。

定义列表文字时使用的具体列表实现默认情况下为`java.util.ArrayList`，除非您决定另行指定，我们在后面也很介绍。

```groovy
def numbers = [1, 2, 3]    

assert numbers instanceof List
assert numbers.size() == 3
```

- 我们定义一个列表号，以逗号分隔并用方括号括起来，然后将该列表分配给变量
- 该列表是Java的`java.util.List`接口的一个实例
- 列表的大小可以使用`size()`方法查询，我们的列表包含3个元素

在上面的示例中，我们使用了同类型列表，但您也可以创建包含不同类型值的列表：

```groovy
def heterogeneous = [1, "a", true]
```

这个列表包含一个数字，一个字符串和一个布尔值。

我们提到过，默认情况下，列表文字实际上是`java.util.ArrayList`的实例。

但是也可以通过`as`运算符使用类型强制，或者对变量使用显式类型声明，来为列表使用不同的后端类型:

```groovy
def arrayList = [1, 2, 3]
assert arrayList instanceof java.util.ArrayList

def linkedList = [2, 3, 4] as LinkedList    
assert linkedList instanceof java.util.LinkedList

LinkedList otherLinked = [3, 4, 5]          
assert otherLinked instanceof java.util.LinkedList
```

- 通过`as`运算符使用类型强制列表为`java.util.LinkedList`类型

- 对变量使用显式类型声明，声明为`java.util.LinkedList`类型

您可以使用带有正索引或负索引的`[]`下标运算符（用于读取和设置值）访问列表的元素，以正序或逆序访问元素，也使用`<<`运算符将元素追加到列表：

```groovy
def letters = ['a', 'b', 'c', 'd']

assert letters[0] == 'a'    // 1
assert letters[1] == 'b'

assert letters[-1] == 'd'   // 2
assert letters[-2] == 'c'

letters[2] = 'C'             
assert letters[2] == 'C'    // 3

letters << 'e'              // 4
assert letters[4] == 'e'
assert letters[-1] == 'e'

assert letters[1, 3] == ['b', 'd']      // 5  
assert letters[2..4] == ['C', 'd', 'e'] // 6
```

1. 访问列表的第一个元素（从零开始的计数）
1. 使用负索引访问列表的最后一个元素：-1是列表末尾的第一个元素
1. 为列表的第三个元素设置新值
1. 使用`<<`运算符将元素添加到列表的末尾
1. 一次访问两个元素，返回包含这两个元素的新列表
1. 使用范围来访问列表中从开始到结束范围元素的值

由于列表是可以有不同类型值的，因此列表还可以包含其他列表以创建多维列表：

```groovy
def multi = [[0, 1], [2, 3]]    // 1
assert multi[1][0] == 2         // 2
```

1. 定义一个元素为列表的列表
1. 访问第二个列表元素的第一个元素

# 8. 数组

Groovy数组复用了列表的符号，要制作特定类型数组，您需要通过强制类型转换或类型声明显式定义数组的类型。

```groovy
String[] arrStr = ['Ananas', 'Banana', 'Kiwi']  // 1

assert arrStr instanceof String[]   // 2
assert !(arrStr instanceof List)

def numArr = [1, 2, 3] as int[]     // 3

assert numArr instanceof int[]      // 4
assert numArr.size() == 3
```

1. 使用显式变量类型声明定义字符串数组
1. 断言我们创建了一个字符串数组
1. 使用`as`运算符创建一个整数数组
1. 断言我们创建了一个原始整数数组

您还可以创建多维数组：

```groovy
def matrix3 = new Integer[3][3]         // 1
assert matrix3.size() == 3

Integer[][] matrix2                     // 2
matrix2 = [[1, 2], [3, 4]]
assert matrix2 instanceof Integer[][]
```

1. 您可以定义新数组的范围
1. 或者声明一个数组而不指定大小

访问数组元素的方式与列表相同：

```groovy
String[] names = ['Cédric', 'Guillaume', 'Jochen', 'Paul']
assert names[0] == 'Cédric'     // 1

names[2] = 'Blackdrag'          // 2
assert names[2] == 'Blackdrag'
```

1. 获取数组的第一个元素
1. 将数组的第三个元素的值设置为新值

Groovy不支持Java数组初始化表示法，因为大括号与Groovy闭包表示法有冲突。

下面是Java数组初始化的语句示例：

```
int a[] = {2, 0, 1, 9, 2020};
```

# 9. 映射

有时在其他语言中称为字典或关联数组，Groovy支持映射功能。 

映射将键与值相关联，键和值之间用冒号分隔，将每个键/值对之间用逗号分隔，并将整个键和值括在方括号中。

```groovy
def colors = [red: '#FF0000', green: '#00FF00', blue: '#0000FF']   // 1

assert colors['red'] == '#FF0000'    // 2
assert colors.green  == '#00FF00'    // 3

colors['pink'] = '#FF00FF'           // 4
colors.yellow  = '#FFFF00'           // 5

assert colors.pink == '#FF00FF'
assert colors['yellow'] == '#FFFF00'

assert colors instanceof java.util.LinkedHashMap
```

1. 我们定义了一个字符串颜色名称的映射，并与它们的十六进制编码的html颜色相关联
1. 我们使用下标符号来检查与`red`键关联的内容
1. 我们还可以使用属性符号来声明绿色的十六进制表示形式
1. 同样，我们可以使用下标符号来添加新的键/值对
1. 或使用属性符号，添加黄色

当使用作为键的名称时，我们实际上在映射中定义了字符串类型的键。

Groovy创建的映射实际上是`java.util.LinkedHashMap`的实例。

如果您尝试访问映射中不存在的键，将返回`null`值：

```groovy
ssert colors.unknown == null
```

在上面的示例中，我们使用了字符串类型的键，但是您也可以将其他类型的值用作键：

```groovy
def numbers = [1: 'one', 2: 'two']

assert numbers[1] == 'one'
```

在这里，我们使用数字作为键，因为数字可以明确地识别为数字，因此Groovy不会像前面的示例那样创建字符串类型的键。 

但请考虑以下情况：您要传递变量来代替键，以使该变量的值成为键：

```groovy
def key = 'name'
def person = [key: 'Guillaume']      // 1

assert !person.containsKey('name')   // 2
assert person.containsKey('key')     // 3
```

1. 与“Guillaume”名称关联的`key`实际上是`“key”`字符串，而不是与`key`变量关联的值
1. 映射不包含`'name'`键
1. 相反，映射包含一个`'key'`键

您还可以传递带引号的字符串作为键：`["name"："Guillaume"]`。
 
如果您的键字符串不是有效的标识符，则这是强制性的，必须使用引号将其声明为字符串。

例如，如果您想使用一个这样的字符串键：`["street-name"："Main street"]`。


当需要在映射定义中将变量值作为键传递时，必须用括号将变量或表达式括起来：

```groovy
person = [(key): 'Guillaume']        // 1

assert person.containsKey('name')    // 2
assert !person.containsKey('key')    // 3
```

1. 这次，我们用圆括号将`key`变量括起来，以指示解析器传递变量而不是定义字符串键
1. 该映射确实包含`name`键
1. 映射没有像以前一样包含`key`键