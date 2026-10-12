---
title: 'Groovy Syntax Tutorial Series: Collections (6) [Final]'
date: 2020-02-29
author: Tang Moying
categories: [build]
tags: [Groovy]
lang: en
alt_url: /post/groovy-syntax-lists-arrays-and-maps
---

## Groovy Syntax Overview

This tutorial series introduces the syntax of the Groovy programming language. Groovy's syntax derives from Java's syntax, but it is enhanced by specific types and allows certain simplifications.

<!--以上为摘要内容-->

Groovy collections include three types: lists, arrays and maps.

## 7. Lists

Groovy represents a list as a comma-separated list of values (enclosed in square brackets).

Groovy lists are the JDK's native `java.util.List`; Groovy does not define its own collection classes.

The concrete list implementation used when defining a list literal is `java.util.ArrayList` by default, unless you decide to specify otherwise, which we will also introduce later.

```groovy
def numbers = [1, 2, 3]    

assert numbers instanceof List
assert numbers.size() == 3
```

- We define a list of numbers, comma-separated and enclosed in square brackets, and then assign that list to a variable
- The list is an instance of Java's `java.util.List` interface
- The size of the list can be queried with the `size()` method; our list contains 3 elements

In the example above we used a list of a single type, but you can also create a list containing values of different types:

```groovy
def heterogeneous = [1, "a", true]
```

This list contains a number, a string and a boolean.

We mentioned that, by default, a list literal is actually an instance of `java.util.ArrayList`.

But you can also use type coercion with the `as` operator, or an explicit type declaration on the variable, to use a different backing type for the list:

```groovy
def arrayList = [1, 2, 3]
assert arrayList instanceof java.util.ArrayList

def linkedList = [2, 3, 4] as LinkedList    
assert linkedList instanceof java.util.LinkedList

LinkedList otherLinked = [3, 4, 5]          
assert otherLinked instanceof java.util.LinkedList
```

- Use type coercion with the `as` operator to make the list of type `java.util.LinkedList`

- Use an explicit type declaration on the variable, declaring it as type `java.util.LinkedList`

You can access the elements of a list using the `[]` subscript operator with positive or negative indices (for reading and setting values), accessing elements in forward or reverse order, and you can also use the `<<` operator to append elements to the list:

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

1. Access the first element of the list (zero-based counting)
1. Use a negative index to access the last element of the list: -1 is the first element from the end of the list
1. Set a new value for the third element of the list
1. Use the `<<` operator to add an element to the end of the list
1. Access two elements at once, returning a new list containing those two elements
1. Use a range to access the values of the list elements from the start to the end of the range

Since lists can hold values of different types, a list can also contain other lists, creating multidimensional lists:

```groovy
def multi = [[0, 1], [2, 3]]    // 1
assert multi[1][0] == 2         // 2
```

1. Define a list whose elements are lists
1. Access the first element of the second list element

## 8. Arrays

Groovy arrays reuse the list notation; to make an array of a specific type, you need to define the array's type explicitly, through a cast or a type declaration.

```groovy
String[] arrStr = ['Ananas', 'Banana', 'Kiwi']  // 1

assert arrStr instanceof String[]   // 2
assert !(arrStr instanceof List)

def numArr = [1, 2, 3] as int[]     // 3

assert numArr instanceof int[]      // 4
assert numArr.size() == 3
```

1. Define a string array using an explicit variable type declaration
1. Assert that we created a string array
1. Use the `as` operator to create an integer array
1. Assert that we created a primitive integer array

You can also create multidimensional arrays:

```groovy
def matrix3 = new Integer[3][3]         // 1
assert matrix3.size() == 3

Integer[][] matrix2                     // 2
matrix2 = [[1, 2], [3, 4]]
assert matrix2 instanceof Integer[][]
```

1. You can define the range of a new array
1. Or declare an array without specifying its size

Accessing array elements works the same way as for lists:

```groovy
String[] names = ['Cédric', 'Guillaume', 'Jochen', 'Paul']
assert names[0] == 'Cédric'     // 1

names[2] = 'Blackdrag'          // 2
assert names[2] == 'Blackdrag'
```

1. Get the first element of the array
1. Set the value of the third element of the array to a new value

Groovy does not support the Java array initialisation notation, because braces conflict with Groovy's closure notation.

Here is an example of a Java array initialisation statement:

```
int a[] = {2, 0, 1, 9, 2020};
```

## 9. Maps

Sometimes called dictionaries or associative arrays in other languages, Groovy supports the map feature.

A map associates keys with values, with a colon separating the key and the value, a comma separating each key/value pair, and the whole set of keys and values enclosed in square brackets.

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

1. We define a map of string colour names, associated with their hex-encoded html colours
1. We use subscript notation to check what is associated with the `red` key
1. We can also use property notation to state the hex representation of green
1. Likewise, we can use subscript notation to add a new key/value pair
1. Or use property notation to add yellow

When we use names as keys, we are actually defining string-type keys in the map.

The map Groovy creates is actually an instance of `java.util.LinkedHashMap`.

If you try to access a key that does not exist in the map, a `null` value is returned:

```groovy
ssert colors.unknown == null
```

In the example above we used string-type keys, but you can also use values of other types as keys:

```groovy
def numbers = [1: 'one', 2: 'two']

assert numbers[1] == 'one'
```

Here we use numbers as keys; because numbers can be unambiguously identified as numbers, Groovy does not create string-type keys as in the previous examples.

But consider the following case: you want to pass a variable in place of the key, so that the value of that variable becomes the key:

```groovy
def key = 'name'
def person = [key: 'Guillaume']      // 1

assert !person.containsKey('name')   // 2
assert person.containsKey('key')     // 3
```

1. The `key` associated with the "Guillaume" name is actually the `“key”` string, not the value associated with the `key` variable
1. The map does not contain a `'name'` key
1. Instead, the map contains a `'key'` key

You can also pass a quoted string as a key: `["name"："Guillaume"]`.

If your key string is not a valid identifier, this is mandatory: you must declare it as a string using quotes.

For example, if you want to use a string key like this: `["street-name"："Main street"]`.


When you need to pass a variable value as a key in a map definition, you must enclose the variable or expression in parentheses:

```groovy
person = [(key): 'Guillaume']        // 1

assert person.containsKey('name')    // 2
assert !person.containsKey('key')    // 3
```

1. This time we enclose the `key` variable in parentheses to tell the parser to pass the variable rather than define a string key
1. The map does contain the `name` key
1. The map does not contain the `key` key as before
