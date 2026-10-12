---
title: 'Groovy Syntax Tutorial Series: Strings (Part 3)'
date: 2020-02-21
author: Tang Moying
categories: [build]
tags: [Groovy]
lang: en
alt_url: /post/groovy-syntax-strings
---

## Groovy Syntax Overview

This tutorial series introduces the syntax of the Groovy programming language. Groovy's syntax derives from Java's syntax, but enhances it with specific types and allows a number of simplifications.

<!--以上为摘要内容-->

## 4. Strings

A text literal is written as several characters strung together, which is called a string.

Groovy lets you instantiate `java.lang.String` objects as well as GStrings (`groovy.lang.GString`), the latter also known in other programming languages as interpolated strings.

### 4.1 Single-Quoted Strings

A single-quoted string is a series of characters enclosed in single quotes:

```groovy
'我的博客：https://shanyshanb.com/'
```

Single-quoted strings are plain `java.lang.String` and do not support interpolation.

### 4.2 String Concatenation

All Groovy strings can be concatenated with the `+` operator:

```groovy
assert 'ab' == 'a' + 'b'
```

### 4.3 Triple Single-Quoted Strings

A triple single-quoted string is a series of characters surrounded by 3 single quotes:

```groovy
'''一个三重单引号字符串'''
```

Triple single-quoted strings are also plain `java.lang.String` and do not support interpolation.

Triple single-quoted strings can span multiple lines.

The content of the string can cross line boundaries without splitting the string into several pieces, without concatenation and without newline characters:

```groovy
def aMultilineString = '''第一行
第二行
第三行'''
```

If your code is indented, for example in the body of a method of a class, then your string will contain the indentation whitespace.

The Groovy development kit includes the `String＃stripIndent()` method for stripping indentation and the `String＃stripMargin()` method for removing text from the start of a string identified by a delimiter.

When a string is created as follows:

```groovy
def startingAndEndingWithANewline = '''
第一行
第二行
第三行'''
```

You will notice that the first character of the resulting string is a newline character. That character can be removed by escaping the newline character with a backslash:

```groovy
def strippedFirstNewline = '''\
第一行
第二行
第三行'''

assert !strippedFirstNewline.startsWith('\n')
```

#### 4.3.1 Escaping Special Characters

You can escape a single quote with the backslash character `\` in order to avoid terminating the string literal:
```groovy
'转义的单引号：\'需要反斜杠'
```

You can escape the escape character itself with a double backslash:

```groovy
'一个转义的转义字符：\\需要双反斜杠'
```

Some special characters also use the backslash as an escape character:

| Escape character | Meaning | 
| ------- | ---- | 
| \t      | tab character | 
| \b      | backspace | 
| \n      | newline | 
| \r      | carriage return | 
| \f      | form feed | 
| \\\     | backslash | 
| \'      | single quote inside a single-quoted string (optional for triple single-quoted and double-quoted strings) | 
| \"      | double quote inside a double-quoted string (optional for triple double-quoted and single-quoted strings) | 
| \t      | tab character | 
| \b      | backspace key | 

In the other string types introduced later we will see more about escaping.

#### 4.3.2 Unicode Escape Sequences

For characters that don't exist on the keyboard, you can use a Unicode escape sequence: a backslash, followed by 'u', then 4 hexadecimal digits.

For example, the euro currency symbol can be represented as:

```groovy
'欧元符号：\u20AC'
```

### 4.4 Double-Quoted Strings


A double-quoted string is a series of characters enclosed in double quotes:

```groovy
"双引号字符串"
```

If there is no interpolated expression, a double-quoted string is a plain `java.lang.String`; if there is interpolation, it is an instance of `groovy.lang.GString`.

To escape a double quote, you can use the backslash character: `双引号：\""`.

#### 4.4.1 String Interpolation

Groovy expressions can be interpolated in all types of string, except single-quoted and triple single-quoted strings.

Interpolation is the act of replacing placeholders in a string with their values when the string is evaluated. Placeholder expressions are surrounded by `${}`.

For unambiguous dotted expressions the curly braces can be omitted, that is, in that case we can use only the `$` prefix.

If a GString is passed to a method that takes a String, the value of the expression inside the placeholder is evaluated to its string representation (by calling `toString()` on that expression), and the resulting String is passed to the method.

Below is a string with a placeholder that references a local variable:

```groovy
def url = 'https://shanyshanb.com' // a plain string
def greeting = "欢迎访问${url}"

assert greeting.toString() == '欢迎访问https://shanyshanb.com'
```

Any Groovy expression is valid, as in the case of an arithmetic expression:

```groovy
def sum = "2加3等于${2 + 3}"
assert sum.toString() == '2加3等于5'
```

Between the `${}` placeholders, not only expressions but also statements are allowed. However, the value of a statement is `null`.

So if multiple statements are inserted in that placeholder, the last one should somehow return the meaningful value to be inserted. For example, `"1和2的总和等于$ {def a = 1; def b = 2; a + b}"` is supported and works as expected, but a good practice is generally to stick to simple expressions inside a GString placeholder.

Besides the `${}` placeholder, we can also prefix a dotted expression with a lone `$` sign:

```groovy
def blog = [url: 'https://shanyshanb.com', author: hummerstudio]
assert "Url of $blog.author's blog is $blog.url" == "Url of hummerstudio's blog is https://shanyshanb.com"
```

But only dotted expressions of the form `a.b`, `a.b.c` and so on are valid.

Expressions containing parentheses (for example method calls, curly braces used for closures, or a dot that isn't part of a property expression or an arithmetic operator) will not work.

Given the following numeric variable definition:

```groovy
def number = 3.14
```

The following statement will throw a `groovy.lang.MissingPropertyException`, because Groovy thinks you are trying to access the `toString` property of that number, but that property does not exist:

```groovy
shouldFail(MissingPropertyException) {
    println "$number.toString()"
}
```

You can think of `"$number.toString()"` as being interpreted by the parser as `"${number.toString}()"`.

Similarly, if an expression is ambiguous, the curly braces need to be kept:

```groovy
String thing = 'treasure'
assert 'The x-coordinate of the treasure is represented by treasure.x' ==
    "The x-coordinate of the $thing is represented by $thing.x"   // <= not allowed: ambiguous
assert 'The x-coordinate of the treasure is represented by treasure.x' ==
        "The x-coordinate of the $thing is represented by ${thing}.x"  // <= curly braces are required
```

If you need to escape `$` or `${}` placeholders in a GString so that they show up as-is without interpolation, you only need to escape the dollar sign with the `\` backslash character:

```groovy
assert '$5' == "\$5"
assert '${name}' == "\${name}"
```

#### 4.4.2 The Special Case of Interpolated Closure Expressions


So far we have seen that arbitrary expressions can be interpolated inside `${}` placeholders, but closure expressions have a special case and notation.

When a placeholder contains the arrow `${->}`, that expression is in fact a closure expression — you can think of it as a closure with a dollar sign prepended:

```groovy
def sParameterLessClosure = "1 + 2 == ${-> 3}" 
assert sParameterLessClosure == '1 + 2 == 3'

def sOneParamClosure = "1 + 2 == ${ w -> w << 3}" 
assert sOneParamClosure == '1 + 2 == 3'
```

The closure in the first line of code is a parameterless closure (a closure that takes no parameters).

The closure in the third line of code takes a single `java.io.StringWriter` parameter, to which you can append with the `<<` left-shift operator.

In either case, both placeholders are embedded closures.

Superficially it looks like a more verbose way of defining the expression to be interpolated, but closures have one interesting advantage over a plain expression: lazy evaluation.

Let us consider the following example:

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

- Line 1. We define a `number` variable equal to `1`, then interpolate it in two GStrings, as an expression in `eagerGString` and as a closure in `lazyGString`
- Line 4. We expect the resulting string to contain the same string value 1 as `eagerGString`
- Line 5. Likewise for `lazyGString`
- Line 6. Then we change the value of the variable to a new number
- Line 7. With a plain interpolation expression, the value is in fact bound when the GString is created.

- Line 8. With a closure expression, however, the closure is called every time the GString is coerced to a String, producing a string containing the new numeric value.

An embedded closure expression with several parameters will produce an exception at runtime. Closures are only allowed to have zero or one parameter.

#### 4.4.3 Interoperability with Java

When a method (whether implemented in Java or in Groovy) expects a `java.lang.String` but we pass it a `groovy.lang.GString` instance, the GString's `toString()` method is called automatically and transparently.

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

- We create a `GString` variable
- We check again that it is an instance of `GString`
- Then we pass that `GString` to a method that takes a `String` as its parameter
- The declaration of the `takeString()` method states explicitly that its only parameter is a String
- We also verify that the parameter really is a `String` and not a `GString`

#### 4.4.4  Hash Codes of GString and String

Although interpolated strings can be used in place of plain Java strings, they differ from strings: their hash codes are different.

Plain Java strings are immutable, whereas the String representation produced by a GString may vary, depending on its interpolated values.

Even for the same resulting string, the hash codes of a GString and a String are different.

```groovy
assert "one: ${1}".hashCode() != "one: 1".hashCode()
```

GStrings and Strings have different hash values, and you should avoid using a GString as a key of a Map, especially when we try to fetch the associated value using a String rather than a GString.

```groovy
def key = "a"
def m = ["${key}": "letter ${key}"]     

assert m["a"] == null   
```

With a GString used as the key, when we try to fetch the value using a String key we won't find it, because String and GString have different hash values.

### 4.5 Triple Double-Quoted Strings

Triple double-quoted strings behave like double-quoted strings, but they can be multiline, similar to triple single-quoted strings.

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

Neither double quotes nor single quotes need to be escaped in triple double-quoted strings.

### 4.6 Slashy Strings

Besides the usually quoted strings, Groovy also provides slashy strings, which use `/` as their opening and closing delimiter.

Slashy strings are particularly useful for defining regular expressions and patterns, because there is no need to escape backslashes.

Example of a slashy string:

```groovy
def fooPattern = /.*foo.*/
assert fooPattern == '.*foo.*'
```

Only the backslash needs to be escaped with a forward slash:

```groovy
def escapeSlash = /字符 \/ 是正斜杠/
assert escapeSlash == '字符 / 是正斜杠'
```

Slashy strings are multiline:

```groovy
def multilineSlashy = /第一行
    第二行
    第三行/

assert multilineSlashy.contains('\n')
```

Slashy strings can be thought of as another way of defining a `GString`, but with different escaping rules. As such, they support interpolation:

```groovy
def color = 'blue'
def interpolatedSlashy = /a ${color} car/

assert interpolatedSlashy == 'a blue car'
```

#### 4.6.1 Special Cases

An empty slashy string cannot be represented with a double slash, because the Groovy parser understands it as a line comment.

That is why the following assertion will in fact not compile, because it looks like an unfinished statement:

```
assert '' == //
```

Since the main purpose of slashy strings is to make regular expressions easier to use, things like `$()` or `$5` that would be a problem in a GString are fine to use in a slashy string.

Keep in mind that backslashes don't need to be escaped. Or you can take it as: escaping is in fact not supported. The slashy string `/\t/` will not contain a tab character, but rather a backslash followed by the character "t".

Escaping is only allowed for the slash character, that is, `/\/folder/` will be a slashy string containing `'/folder'`.

A very important point about slash escaping is that a slashy string cannot end with a backslash. Otherwise it would escape the slashy string terminator.

You can use a special trick instead: `/ends with slash ${'\'}/`. But it is best to avoid slashy strings in that situation.

### 4.7 Dollar Slashy Strings

Dollar slashy strings are multiline GStrings that start with `$/` and end with `/$`.

The escape character is the dollar sign, which can escape another dollar or a forward slash.

Neither the dollar nor the forward slash need to be escaped, except for `/$` and `$/`.

Example:

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

It was created to overcome certain limitations of the slashy escaping rules.

Use it when its escaping rules suit the content of your string (usually when there are some slashes you don't want to escape).

### 4.8 Summary Table of the String Types

| String type | String syntax | Interpolatable | Multiline | Escape character |
| -------- | --------- | ----- | ----- | ------- |
| single-quoted    | `'...'`   | ❌    | ❌    | `\`     |
| triple single-quoted | `'''...'''` | ❌ | ✅    | `\`     |
| double-quoted    | `"..."`   | ✅   | ❌    | `\`     |
| triple double-quoted |   `""""..."""` | ✅  | ✅  | `\`   |
| slashy      | `/.../`  | ✅   | ✅     | `\`     |
| dollar slashy | `$/.../$`  | ✅  | ✅      | `$`    |

### 4.9 Characters

Unlike Java, Groovy has no explicit character literal.

However, you can explicitly turn a Groovy string into an actual character in three different ways:

```groovy
char c1 = 'A' // first way
assert c1 instanceof Character

def c2 = 'B' as char // second way
assert c2 instanceof Character

def c3 = (char)'C' // third way
assert c3 instanceof Character
```

- First way: declare the variable by explicitly specifying the `char` type
- Second way: coerce with the `as` operator
- Third way: cast to char

Use the first method when a character is to be kept in a variable; use the other two when a char-typed value has to be passed as an argument to a method call.
