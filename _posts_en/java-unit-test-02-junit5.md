---
title: 'Java Unit Testing (Part 2): Getting Hands-On with JUnit 5'
date: 2018-08-26
author: Tang Moying
categories: [test]
tags: [Java, Unit Testing, JUnit 5, JUnit Jupiter]
lang: en
alt_url: /post/java-unit-test-02-junit5
---

Now that the concepts are done, it's time to get hands-on. Since its release in 2017, JUnit 5 has become the de facto standard for Java testing. This may be the first time you've seen a test framework that was "officially rewritten and thoroughly overhauled" — from architecture to API, everything is new. This article takes you from zero to actually using JUnit 5.

<!--以上为摘要内容-->

## JUnit 5's Architecture

JUnit 5 is not the kind of framework you imagine where "one jar does everything." It consists of three modules:

```
┌─────────────────────────────────────────┐
│              JUnit 5 platform           │
│        (junit-platform-engine)           │
│        Discovers and runs tests         │
│                                          │
│  ┌──────────────┐  ┌──────────────┐     │
│  │   Jupiter     │  │   Vintage     │     │
│  │ (new API)     │  │ (JUnit 3/4)   │     │
│  │ junit-jupiter │  │ junit-vintage │     │
│  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────┘
```

- **JUnit Platform**: the underlying platform. IDEs, Maven, and Gradle use it to discover and execute tests
- **JUnit Jupiter**: the new API we write tests with (`@Test`, `@BeforeEach`, and so on)
- **JUnit Vintage**: the compatibility layer. It lets old JUnit 3/4 tests and new JUnit 5 tests coexist

A project can run old JUnit 4 tests and new JUnit 5 tests at the same time, migrating smoothly — that's the meaning of Vintage.

## Quick Start

### Maven Configuration

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

Note: `maven-surefire-plugin` must be **2.22.0 or above**, otherwise it won't recognize JUnit 5 tests.

### Gradle Configuration

```groovy
dependencies {
    testImplementation 'org.junit.jupiter:junit-jupiter-api:5.3.1'
    testRuntimeOnly 'org.junit.jupiter:junit-jupiter-engine:5.3.1'
}

test {
    useJUnitPlatform()
}
```

### Run Your First Test

```bash
mvn test
```

Output:

```
-------------------------------------------------------
 T E S T S
-------------------------------------------------------
Running com.example.CalculatorTest
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
```

All green — you've written the first JUnit 5 tests of your life.

## Core Annotations

JUnit 5's annotation names are more intuitive; you can see the life cycle at a glance:

| Annotation | JUnit 4 equivalent | Purpose |
|------|-------------|------|
| `@Test` | `@Test` | Marks a test method |
| `@BeforeEach` | `@Before` | Runs before **each** test method |
| `@AfterEach` | `@After` | Runs after **each** test method |
| `@BeforeAll` | `@BeforeClass` | Runs once before **all** test methods (must be `static`) |
| `@AfterAll` | `@AfterClass` | Runs once after **all** test methods (must be `static`) |
| `@Disabled` | `@Ignore` | Skips that test |

The difference is in the naming: `BeforeEach` vs `Before` — "Each" tells you it runs before every test method, "All" tells you it runs once for all of them.

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

Output:

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

**Each test method is isolated from the others** — this point matters. JUnit creates a new instance of the test class for each `@Test` method, so there's no state pollution between tests.

## Assertions

Assertions are the soul of testing — what you expect, what actually happened, and failure if they don't match.

### Basic Assertions

```java
import static org.junit.jupiter.api.Assertions.*;

@Test
void basicAssertions() {
    assertEquals(5, calculator.add(2, 3));
    assertTrue(list.isEmpty());
    assertFalse(condition);
    assertNull(result);
    assertNotNull(user);
    assertSame(expected, actual);   // the same reference
    assertNotSame(a, b);
}
```

### Grouped Assertions

When you have several assertions to run and want to **see every failure reason even when they all fail** (not just the first one):

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

`assertAll` executes all the assertions; even if the first one fails, it won't stop the rest. You see the complete failure information, instead of fixing one only to discover the next is wrong.

### Exception Assertions

The problem with JUnit 4's `@Test(expected=...)` is that you can only "expect some method to throw," but you can't assert on the exception message or which line the exception occurred on. JUnit 5's `assertThrows` solves this:

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

`assertThrows` returns the caught exception object, and you can then assert on its message, cause, and so on.

### Timeout Assertions

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

It fails if it takes more than 1 second. This keeps a test from hanging on an infinite loop or a blocked network call.

## Parameterized Tests

One test method, multiple sets of input data — that's the value of parameterized tests: **using one table of data to drive multiple test executions**.

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

Each set of `CsvSource` data generates one test execution. The output report:

```
[1] 1,1 → 2   √
[2] 2,3 → 5   √
[3] 0,0 → 0   √
[4] -1,1 → 0  √
[5] 100,200 → 300 √
```

If the third set fails, you can tell right in the IDE which set of data is the problem, without debugging line by line.

### Other Data Sources

```java
// Single-value test
@ParameterizedTest
@ValueSource(strings = {"", "  ", "\t", "\n"})
void shouldBeBlank(String input) {
    assertTrue(StringUtils.isBlank(input));
}

// A method provides the data
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

// Enumerate all enum values
@ParameterizedTest
@EnumSource(DayOfWeek.class)
void testIsWorkday(DayOfWeek day) {
    // ...
}
```

## Nested Tests

When the class under test has multiple scenarios, use nested tests to organize related tests together:

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

The IDE displays it as a tree structure:

```
用户服务测试
├── Registration
│   ├── ✓ A valid username and password, registration succeeds
│   └── ✓ Empty username, throws an exception
└── Login
    ├── ✓ Correct credentials, login succeeds
    └── ✓ Wrong password, login fails
```

Classes inside `@Nested` can also have their own `@BeforeEach` / `@AfterEach`; the outer life cycle runs first, the inner one after.

## Display Names

`@DisplayName` lets you describe a test's intent using Chinese, spaces, and special symbols:

```java
@Test
@DisplayName("When the username is empty → throws IllegalArgumentException")
void test1() { /* ... */ }
```

The report displays this description instead of a meaningless method name like `test1`. For team collaboration, that's far friendlier than being forced to write English method names in camelCase.

## Conditional Execution

Decide whether to skip a test based on the run environment:

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

## Migrating from JUnit 4

If you have a large amount of JUnit 4 test code, you can **migrate gradually**:

1. Bring in both `junit-vintage-engine` and `junit-jupiter-engine` in your `pom.xml`
2. Leave the old JUnit 4 tests alone and keep running them
3. Write new tests with the JUnit 5 API

```xml
<!-- Compatible with old JUnit 4 tests -->
<dependency>
    <groupId>org.junit.vintage</groupId>
    <artifactId>junit-vintage-engine</artifactId>
    <version>5.3.1</version>
    <scope>test</scope>
</dependency>
```

One `mvn test` runs the JUnit 4 and JUnit 5 tests together, each going green or red on its own, without interfering with each other.

## Summary

JUnit 5 isn't an "upgraded version" of JUnit 4, but a rethink of the Java testing framework:

- **Modular architecture**: Platform + Jupiter + Vintage, each with its own job
- **A more human-friendly API**: `@BeforeEach`, `@DisplayName`, `assertThrows`
- **Native parameterized tests**: `@CsvSource`, `@MethodSource` work out of the box
- **Nested tests**: organized layer by layer by scenario, with tree-shaped reports
- **Peaceful migration**: the Vintage engine lets old and new tests coexist

Next time, we'll run into a practical problem: the object under test depends on a database, an HTTP service, or the file system — how do you handle these external dependencies? That's when Mockito takes the stage.

A small step forward every day is a new height!
