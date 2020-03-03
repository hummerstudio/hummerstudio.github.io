---
title: Groovy语法系列教程之字符串（三）
author: 唐明
categories: [Groovy]
tags: [Groovy]
---
* TOC
{:toc}

# Groovy语法概述

本系列教程介绍Groovy编程语言的语法。Groovy的语法源自Java语法，但是通过特定类型对其进行了增强，并允许进行某些简化。

<!--以上为摘要内容-->

# 4. 字符串

文本文字以多个字符串联的形式表示,称为字符串。 

Groovy允许您实例化`java.lang.String`对象以及GString（`groovy.lang.GString`），后者在其他编程语言中也称为内插字符串。

## 4.1 单引号字符串

单引号字符串是一系列用单引号引起来的字符：
```groovy
'我的博客：https://shanyshanb.com/'
```

单引号字符串是纯粹的`java.lang.String`，不支持插值。

## 4.2 字符串连接

所有的Groovy字符串都可以用`+`运算符连接：

```groovy
assert 'ab' == 'a' + 'b'
```

## 4.3 三重单引号字符串

三重单引号字符串是一系列字符，由3个单引号包围：

```groovy
'''一个三重单引号字符串'''
```

三重单引号字符串也是纯粹的`java.lang.String`，不支持插值。

三重单引号字符串可能跨越多行。

字符串的内容可以跨越行边界，而无需将字符串分成几段，也不需要连接或换行符：

```groovy
def aMultilineString = '''第一行
第二行
第三行'''
```

如果您的代码是缩进的，例如在类的方法体中，则您的字符串将包含缩进的空格。 

Groovy开发工具包包含去除缩进的方法`String＃stripIndent()`和使用分隔符标识从字符串开头删除文本的方法`String＃stripMargin()`。

当按如下方式创建字符串：

```groovy
def startingAndEndingWithANewline = '''
第一行
第二行
第三行'''
```

您会注意到，结果字符串的第一个字符是换行符。可以通过用反斜杠转义换行符来删除该字符：

```groovy
def strippedFirstNewline = '''\
第一行
第二行
第三行'''

assert !strippedFirstNewline.startsWith('\n')
```

### 4.3.1 转义特殊字符

您可以使用反斜杠字符`\`对单引号进行转义，以避免终止字符串文字：
```groovy
'转义的单引号：\'需要反斜杠'
```

您可以使用双反斜杠来转义转义字符：

```groovy
'一个转义的转义字符：\\需要双反斜杠'
```

一些特殊字符还将反斜杠用作转义字符：

| 转义字符 | 意义 | 
| ------- | ---- | 
| \t      | 制表符 | 
| \b      | 退格 | 
| \n      | 换行 | 
| \r      | 回车 | 
| \f      | 换页 | 
| \\\     | 反斜杠 | 
| \'      | 单引号字符串中的单引号（对于三重单引号和双引号字符串是可选的） | 
| \"      | 双引号字符串中的双引号（对于三重双引号和单引号字符串是可选的） | 
| \t      | 制表符 | 
| \b      | 退格键 | 

在稍后介绍的其他类型的字符串中，我们将看到更多关于转义的知识。

### 4.3.2 Unicode转义序列

对于键盘上不存在的字符，可以使用Unicode转义序列：一个反斜杠，后跟'u'，然后是4个十六进制数字。

例如，欧元货币符号可以表示为：

```groovy
'欧元符号：\u20AC'
```

## 4.4 双引号字符串


双引号字符串是一系列用双引号引起来的字符：

```groovy
"双引号字符串"
```

如果没有插值表达式，则双引号字符串为纯`java.lang.String`；如果存在插值，则为`groovy.lang.GString`实例。

要转义双引号，可以使用反斜杠字符：`双引号：\""`。

### 4.4.1 字符串插值

Groovy表达式可以插入所有类型字符串中，除了单引号和三重单引号字符串。 

插值是在评估字符串时用其值替换字符串中占位符的行为。 占位符表达式由`${}`包围。 

对于明确的点分表达式，可以省略花括号，即在这种情况下，我们可以只使用`$`前缀。 

如果将GString传递给采用String的方法，则占位符内的表达式值将求值为其字符串表示形式（通过在该表达式上调用`toString()`），并将生成的String传递给该方法。

下面是一个带有占位符的字符串，该字符串引用一个局部变量：

```groovy
def url = 'https://shanyshanb.com' // a plain string
def greeting = "欢迎访问${url}"

assert greeting.toString() == '欢迎访问https://shanyshanb.com'
```

任何Groovy表达式都是有效的，如使用算术表达式：

```groovy
def sum = "2加3等于${2 + 3}"
assert sum.toString() == '2加3等于5'
```

在`${}`占位符之间不仅允许使用表达式，也允许使用语句。 但是，语句的值是`null`。
 
因此，如果在该占位符中插入了多个语句，则最后一个应以某种方式返回要插入的有意义的值。 例如，`"1和2的总和等于$ {def a = 1; def b = 2; a + b}"`受支持并按预期工作，但是一种好的做法通常是在GString占位符内部坚持简单的表达式 。

除了`${}`占位符，我们还可以在点分表达式前加上一个单独的`$`符号：

```groovy
def blog = [url: 'https://shanyshanb.com', author: hummerstudio]
assert "Url of $blog.author's blog is $blog.url" == "Url of hummerstudio's blog is https://shanyshanb.com"
```

但是只有`a.b`，`a.b.c`等形式的点分表达式有效。 

包含圆括号的表达式（例如方法调用，用于闭包的大括号，不属于属性表达式或算术运算符的点）将无效。
 
给定以下数字变量定义：

```groovy
def number = 3.14
```

以下语句将抛出异常`groovy.lang.MissingPropertyException`，因为Groovy认为您正在尝试访问该数字的`toString`属性，但该属性并不存在：

```groovy
shouldFail(MissingPropertyException) {
    println "$number.toString()"
}
```

您可以想到`"$number.toString()"`被解析器解释为`"${number.toString}()"`。

类似地，如果表达式有歧义，则需要保留大括号：

```groovy
String thing = 'treasure'
assert 'The x-coordinate of the treasure is represented by treasure.x' ==
    "The x-coordinate of the $thing is represented by $thing.x"   // <= 不允许：有歧义
assert 'The x-coordinate of the treasure is represented by treasure.x' ==
        "The x-coordinate of the $thing is represented by ${thing}.x"  // <= 需要花括号
```

如果您需要在GString中转义`$`或`${}占位符，以便它们按原样显示而无需插值，则只需要使用`\`反斜杠字符即可转义美元符号：

```groovy
assert '$5' == "\$5"
assert '${name}' == "\${name}"
```

### 4.4.2 内插闭包表达式的特殊情况


到目前为止，我们已经看到可以在`${}`占位符内插入任意表达式，但是闭包表达式有一种特殊情况和表示法。

当占位符包含箭头`${->}`时，该表达式实际上是一个闭包表达式——您可以将其视为一个在其前面加有美元符号的闭包：

```groovy
def sParameterLessClosure = "1 + 2 == ${-> 3}" 
assert sParameterLessClosure == '1 + 2 == 3'

def sOneParamClosure = "1 + 2 == ${ w -> w << 3}" 
assert sOneParamClosure == '1 + 2 == 3'
```

第一行代码中的闭包是无参闭包（不带参数的闭包）。

第三行代码中的闭包使用单个`java.io.StringWriter`参数，您可以在该参数后附加`<<` 左移操作符。

无论哪种情况，两个占位符都是嵌入式闭包。

从外观上看，它似乎是定义要内插的表达式的更详细的方法，但是闭包比单纯的表达式有一个有趣的优点：惰性求值。

让我们考虑以下示例：

```groovy
def number = 1 
def eagerGString = "value == ${number}"
def lazyGString = "value == ${ -> number }"

assert eagerGString == "value == 1" 
assert lazyGString ==  "value == 1" 

number = 2 
assert eagerGString == "value == 1" 
assert lazyGString ==  "value == 2" 
```

- 第1行。我们定义一个等于`1`的`number`变量，然后在两个GString中插值，作为`eagerGString`中的一个表达式和`lazyGString`中的一个闭包
- 第4行。我们期望结果字符串包含与`eagerGString`相同的字符串值1
- 第5行。类似的`lazyGString`
- 第6行。然后我们将变量的值更改为新的数字
- 第7行。使用普通的插值表达式，该值实际上是在创建GString时绑定的。

- 第8行。但是使用闭包表达式时，每次将GString强制转换为String时都会调用闭包，从而生成包含新数字值的字符串。

嵌入式闭包表达式带有多个参数将在运行时生成异常。 闭包仅允许有零或一个参数。

### 4.4.3 与Java的互操作性

当某个方法（无论是用Java还是Groovy实现）期望使用`java.lang.String`，但是我们传递了`groovy.lang.GString`实例时，则会自动透明地调用GString的`toString()`方法。

```groovy
String takeString(String message) {         
    assert message instanceof String        
    return message
}

def message = "The message is ${'hello'}"   
assert message instanceof GString           

def result = takeString(message)            
assert result instanceof String
assert result == 'The message is hello'
```

- 我们创建一个`GString`变量
- 我们再次检查它是`GString`的实例
- 然后，我们将该`GString`传递给采用`String`作为参数的方法
- `takeString()`方法的声明明确表示其唯一的参数是String
- 我们还验证该参数确实是`String`而不是`GString`

### 4.4.4  GString和String的哈希码

尽管可以使用内插的字符串代替普通的Java字符串，但是它们与字符串不同：它们的哈希码不同。

纯Java字符串是不可变的，而由GString生成的String表示形式可能有所不同，具体取决于其内插值。 

即使对于相同结果第字符串，GString和String的哈希码也是不同的。

```groovy
assert "one: ${1}".hashCode() != "one: 1".hashCode()
```

GString和String具有不同的哈希值，应避免使用GString作为Map的键，尤其是当我们尝试使用String而不是GString来取关联值时。

```groovy
def key = "a"
def m = ["${key}": "letter ${key}"]     

assert m["a"] == null   
```

使用GString作为键，当我们尝试使用String键获取值时，我们将找不到它，因为String和GString具有不同的哈希值。

## 4.5 三重双引号字符串

三重双引号字符串的行为类似于双引号字符串，但它们可以是多行的，与三重单引号字符串类似。

```groovy
def name = '同学们'
def template = """
    Dear ${name},

    你好！

    学习Groovy、Jenkins
    
    欢迎访问https://shanyshanb.com
"""

assert template.toString().contains('同学们')
```

双引号或单引号都不需要在三重双引号字符串中进行转义。

## 4.6 斜线字符串

除了通常引用的字符串外，Groovy还提供了斜线字符串，它们使用`/`作为开始和结束定界符。 

斜线字符串对于定义正则表达式和模式特别有用，因为不需要转义反斜杠。

斜线字符串示例：

```groovy
def fooPattern = /.*foo.*/
assert fooPattern == '.*foo.*'
```

仅需使用正斜杠将反斜杠转义：

```groovy
def escapeSlash = /字符 \/ 是正斜杠/
assert escapeSlash == '字符 / 是正斜杠'
```

斜线字符串为多行：

```groovy
def multilineSlashy = /第一行
    第二行
    第三行/

assert multilineSlashy.contains('\n')
```

斜线字符串可以被认为是定义`GString`的另一种方式，但是具有不同的转义规则。 因此，它们支持插值：

```groovy
def color = 'blue'
def interpolatedSlashy = /a ${color} car/

assert interpolatedSlashy == 'a blue car'
```

### 4.6.1 特殊情况

空的斜杠字符串不能用双斜杠表示，因为Groovy解析器将其理解为行注释。

这就是为什么以下断言实际上不会编译的原因，因为它看起来像是一个未完成的语句：

```
assert '' == //
```

由于斜线字符串的主要目的是使正则表达式更容易使用，因此像`$()`或`$5`等在GString中会出错的内容，在斜线字符串中使用是可以的。

请记住，不需要转义反斜杠。或者可以理解为实际上不支持转义。斜线字符串`/\t/`将不包含制表符，而是包含反斜杠，后跟字符“t”。

仅允许对斜杠字符进行转义，即`/\/folder/`将是包含`'/folder'`的斜杠字符串。

斜杠转义的很重要的一点是，斜线字符串不能以反斜杠结尾。否则，它将转义斜线字符串终止符。

您可以改用一个特殊技巧，`/ends with slash ${'\'}/`。但最好避免在这种情况下使用斜线字符串。

## 4.7 美元斜线字符串

美元斜线字符串是多行GString，以`$/`开始`/$`结束。 

转义字符是美元符号，它可以转义另一个美元或正斜杠。 

美元和正斜杠都不需要转义，除了`/$`和`$/`。

示例：

```groovy
def name = "Guillaume"
def date = "April, 1st"

def dollarSlashy = $/
    Hello $name,
    today we're ${date}.

    $ 美元符号
    $$ 转义美元符号
    \ 反斜杠
    / 正斜杠
    $/ 转义正斜杠
    $$$/ 转义$/
    $/$$ 转义/$
/$

assert [
    'Guillaume',
    'April, 1st',
    '$ 美元符号',
    '$ 转义美元符号',
    '\\ 反斜杠',
    '/ 正斜杠',
    '/ 转义正斜杠',
    '$/ 转义$/',
    '/$ 转义/$'
].every { dollarSlashy.contains(it) }
```

它的创建是为了克服斜线转义规则的某些限制。

当其转义规则适合你的字符串内容时使用（通常是有一些你不想转义的斜杠时）。

## 4.8 各类字符串汇总表

| 字符串类型 | 字符串语法 | 可插值 | 可多行 | 转义字符 |
| -------- | --------- | ----- | ----- | ------- |
| 单引号    | `'...'`   | ❌    | ❌    | `\`     |
| 三重单引号 | `'''...'''` | ❌ | ✅    | `\`     |
| 双引号    | `"..."`   | ✅   | ❌    | `\`     |
| 三重双引号 |   `""""..."""` | ✅  | ✅  | `\`   |
| 斜线      | `/.../`  | ✅   | ✅     | `\`     |
| 美元斜线 | `$/.../$`  | ✅  | ✅      | `$`    |

## 4.9 字符

与Java不同，Groovy没有明确的字符文字。 

但是，你可以通过三种不同的方式明确地将Groovy字符串转为实际字符：

```groovy
char c1 = 'A' //第一种
assert c1 instanceof Character

def c2 = 'B' as char //第二种
assert c2 instanceof Character

def c3 = (char)'C' //第三种
assert c3 instanceof Character
```

- 第一种：通过显式指定`char`类型声明变量
- 第二种：通过`as`运算符强制转换
- 第三种：通过强制转换为char操作

当要将字符保留在变量中时，使用第一种方法；而当必须将char类型值作为方法调用的参数传递时，可使用其他两种方法。