---
title: Java 单元测试（二）：JUnit 5 实战上手
author: 唐明
categories: [test]
tags: [Java, 单元测试, JUnit 5, JUnit Jupiter]
---

学完概念该动手了。JUnit 5 从 2017 年发布至今，已经成为 Java 测试的事实标准。这可能是你第一次见到一套“官方重写、彻底改造”的测试框架——从架构到 API，都是全新的。这篇文章带你从零开始，把 JUnit 5 用起来。

<!--以上为摘要内容-->

## JUnit 5 的架构

JUnit 5 不是你想象中“一个 jar 包搞定一切”的框架。它由三个模块组成：

```
┌─────────────────────────────────────────┐
│              JUnit 5 平台                │
│        (junit-platform-engine)           │
│        负责发现和运行测试                 │
│                                          │
│  ┌──────────────┐  ┌──────────────┐     │
│  │   Jupiter     │  │   Vintage     │     │
│  │ (新 API)      │  │ (兼容 JUnit 3/4)│   │
│  │ junit-jupiter │  │ junit-vintage │     │
│  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────┘
```

- **JUnit Platform**：底层平台。IDE、Maven、Gradle 通过它来发现和执行测试
- **JUnit Jupiter**：我们写测试用的新 API（`@Test`、`@BeforeEach`等）
- **JUnit Vintage**：兼容层。让你在老旧的 JUnit 3/4 测试和新的 JUnit 5 测试共存

一个项目可以同时跑 JUnit 4 旧测试和 JUnit 5 新测试，平滑迁移——这就是 Vintage 的意义。

## 快速上手

### Maven 配置

```xml
<dependencies>
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter-api</artifactId>
        <version>5.3.1</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter-engine</artifactId>
        <version>5.3.1</version>
        <scope>test</scope>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-surefire-plugin</artifactId>
            <version>2.22.0</version>
        </plugin>
    </plugins>
</build>
```

注意：`maven-surefire-plugin` 必须 **2.22.0 或以上**，否则不识别 JUnit 5 的测试。

### Gradle 配置

```groovy
dependencies {
    testImplementation 'org.junit.jupiter:junit-jupiter-api:5.3.1'
    testRuntimeOnly 'org.junit.jupiter:junit-jupiter-engine:5.3.1'
}

test {
    useJUnitPlatform()
}
```

### 跑第一个测试

```bash
mvn test
```

输出：

```
-------------------------------------------------------
 T E S T S
-------------------------------------------------------
Running com.example.CalculatorTest
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
```

全绿，你写下了人生第一组 JUnit 5 测试。

## 核心注解

JUnit 5 的注解名称更直观了，一眼看出生命周期：

| 注解 | JUnit 4 对应 | 作用 |
|------|-------------|------|
| `@Test` | `@Test` | 标记一个测试方法 |
| `@BeforeEach` | `@Before` | **每个**测试方法执行前运行 |
| `@AfterEach` | `@After` | **每个**测试方法执行后运行 |
| `@BeforeAll` | `@BeforeClass` | **所有**测试方法执行前运行一次（必须是 `static`） |
| `@AfterAll` | `@AfterClass` | **所有**测试方法执行后运行一次（必须是 `static`） |
| `@Disabled` | `@Ignore` | 跳过该测试 |

区别在命名：`BeforeEach` vs `Before`——“Each”告诉你它是每个测试方法前都跑，“All”告诉你是全部跑一次。

```java
class LifecycleDemoTest {

    @BeforeAll
    static void initAll() {
        System.out.println("全局初始化——只跑一次");
    }

    @BeforeEach
    void init() {
        System.out.println("每个测试前");
    }

    @Test
    void test1() {
        System.out.println("测试 1");
    }

    @Test
    void test2() {
        System.out.println("测试 2");
    }

    @AfterEach
    void tearDown() {
        System.out.println("每个测试后");
    }

    @AfterAll
    static void tearDownAll() {
        System.out.println("全局清理——只跑一次");
    }
}
```

输出：

```
全局初始化——只跑一次
每个测试前
测试 1
每个测试后
每个测试前
测试 2
每个测试后
全局清理——只跑一次
```

**每个测试方法之间是隔离的**——这点很重要。JUnit 会为每个 `@Test` 方法创建一个新的测试类实例，所以测试之间不会有状态污染。

## 断言

断言是测试的灵魂——期望什么，实际是什么，对不上就失败。

### 基础断言

```java
import static org.junit.jupiter.api.Assertions.*;

@Test
void basicAssertions() {
    assertEquals(5, calculator.add(2, 3));
    assertTrue(list.isEmpty());
    assertFalse(condition);
    assertNull(result);
    assertNotNull(user);
    assertSame(expected, actual);   // 同一个引用
    assertNotSame(a, b);
}
```

### 分组断言

当你有多个断言要跑，希望它们**全部失败时也能看到所有失败原因**（而不止第一个）：

```java
@Test
void groupedAssertions() {
    assertAll("user",
        () -> assertEquals("张三", user.getName()),
        () -> assertEquals(25, user.getAge()),
        () -> assertTrue(user.isActive())
    );
}
```

`assertAll` 会执行所有断言，即使第一个失败了也不会阻止后面的。你会看到完整的失败信息，而不是修完一个才发现下一个又错了。

### 异常断言

JUnit 4 用 `@Test(expected=...)` 的问题是：你只能“期望某方法抛异常”，但无法断言异常消息、异常发生在哪一行。JUnit 5 的 `assertThrows` 解决了这个问题：

```java
@Test
void exceptionTesting() {
    Exception exception = assertThrows(
        IllegalArgumentException.class,
        () -> calculator.divide(10, 0)
    );
    assertEquals("除数不能为零", exception.getMessage());
}
```

`assertThrows` 返回捕获的异常对象，你可以接着断言它的 message、cause 等。

### 超时断言

```java
@Test
void timeoutNotExceeded() {
    String result = assertTimeout(
        Duration.ofSeconds(1),
        () -> service.heavyComputation()
    );
    assertEquals("done", result);
}
```

超过 1 秒就失败。防止测试被死循环或网络阻塞卡住。

## 参数化测试

一个测试方法，多组输入数据——这就是参数化测试的价值：**用一张数据表驱动多次测试执行**。

```java
@ParameterizedTest
@CsvSource({
    "1, 1, 2",
    "2, 3, 5",
    "0, 0, 0",
    "-1, 1, 0",
    "100, 200, 300"
})
void add(int a, int b, int expected) {
    assertEquals(expected, calculator.add(a, b));
}
```

每组 `CsvSource` 数据会生成一次测试执行。输出报告：

```
[1] 1,1 → 2   √
[2] 2,3 → 5   √
[3] 0,0 → 0   √
[4] -1,1 → 0  √
[5] 100,200 → 300 √
```

如果第 3 组挂了，IDE 里可以直接知道是哪组数据的问题，不用一行行排查。

### 其他数据源

```java
// 单值测试
@ParameterizedTest
@ValueSource(strings = {"", "  ", "\t", "\n"})
void shouldBeBlank(String input) {
    assertTrue(StringUtils.isBlank(input));
}

// 方法提供数据
@ParameterizedTest
@MethodSource("provideNumbers")
void testWithMethodSource(int input, boolean expected) {
    assertEquals(expected, NumberUtils.isEven(input));
}

static Stream<Arguments> provideNumbers() {
    return Stream.of(
        Arguments.of(2, true),
        Arguments.of(3, false),
        Arguments.of(0, true)
    );
}

// 枚举所有枚举值
@ParameterizedTest
@EnumSource(DayOfWeek.class)
void testIsWorkday(DayOfWeek day) {
    // ...
}
```

## 嵌套测试

当你的被测类有多个场景时，用嵌套测试把相关测试组织在一起：

```java
@DisplayName("用户服务测试")
class UserServiceTest {

    UserService service = new UserService();

    @Nested
    @DisplayName("注册功能")
    class Register {

        @Test
        @DisplayName("合法的用户名和密码，注册成功")
        void shouldRegisterWithValidInput() {
            assertTrue(service.register("user1", "pass123"));
        }

        @Test
        @DisplayName("用户名为空，抛出异常")
        void shouldThrowWhenUsernameEmpty() {
            assertThrows(IllegalArgumentException.class,
                () -> service.register("", "pass123"));
        }
    }

    @Nested
    @DisplayName("登录功能")
    class Login {

        @Test
        @DisplayName("正确的凭证，登录成功")
        void shouldLoginWithCorrectCredentials() {
            assertTrue(service.login("user1", "pass123"));
        }

        @Test
        @DisplayName("错误的密码，登录失败")
        void shouldFailWithWrongPassword() {
            assertFalse(service.login("user1", "wrong"));
        }
    }
}
```

IDE 里会以树形结构展示：

```
用户服务测试
├── 注册功能
│   ├── ✓ 合法的用户名和密码，注册成功
│   └── ✓ 用户名为空，抛出异常
└── 登录功能
    ├── ✓ 正确的凭证，登录成功
    └── ✓ 错误的密码，登录失败
```

`@Nested` 里的类还可以有自己的 `@BeforeEach` / `@AfterEach`，外层的生命周期先执行，内层的后执行。

## 显示名称

`@DisplayName` 让你用中文、空格、特殊符号描述测试意图：

```java
@Test
@DisplayName("当用户名为空时 → 抛出 IllegalArgumentException")
void test1() { /* ... */ }
```

报告中会显示这个描述，而不是 `test1` 这样的无意义方法名。对团队协作来说，这比被迫用驼峰写英文方法名友好得多。

## 条件执行

根据运行环境决定是否跳过一个测试：

```java
@Test
@EnabledOnOs(OS.MAC)
void onlyOnMac() { /* ... */ }

@Test
@EnabledOnOs(OS.WINDOWS)
void onlyOnWindows() { /* ... */ }

@Test
@EnabledOnJre(JRE.JAVA_9)
void onlyOnJava9() { /* ... */ }

@Test
@EnabledIfSystemProperty(named = "env", matches = "ci")
void onlyInCI() { /* ... */ }
```

## 从 JUnit 4 迁移

如果你有大量 JUnit 4 的测试代码，可以**渐进式迁移**：

1. 在 `pom.xml` 中同时引入 `junit-vintage-engine` 和 `junit-jupiter-engine`
2. 老的 JUnit 4 测试不改，继续跑
3. 新测试用 JUnit 5 API 写

```xml
<!-- 兼容 JUnit 4 旧测试 -->
<dependency>
    <groupId>org.junit.vintage</groupId>
    <artifactId>junit-vintage-engine</artifactId>
    <version>5.3.1</version>
    <scope>test</scope>
</dependency>
```

一个 `mvn test`，JUnit 4 和 JUnit 5 的测试一起跑，各自绿各自红，互不干扰。

## 小结

JUnit 5 不是 JUnit 4 的“升级版”，而是 Java 测试框架的重新思考：

- **模块化架构**：Platform + Jupiter + Vintage，各司其职
- **更人性化的 API**：`@BeforeEach`、`@DisplayName`、`assertThrows`
- **原生参数化测试**：`@CsvSource`、`@MethodSource` 开箱即用
- **嵌套测试**：按场景层层组织，树形报告
- **和平迁移**：Vintage 引擎让新旧测试共存

下一篇，我们会遇到一个现实问题：被测对象依赖了数据库、HTTP 服务、文件系统——这些外部依赖怎么处理？这时候 Mockito 就该上场了。

每天前进一小步，就是一个新的高度！
