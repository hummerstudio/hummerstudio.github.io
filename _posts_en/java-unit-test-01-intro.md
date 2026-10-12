---
title: 'Java Unit Testing (Part 1): What Is a Unit Test and Why Write One'
date: 2018-08-25
author: Tang Moying
categories: [test]
tags: [Java, Unit Testing, JUnit, Shift-Left Testing]
lang: en
alt_url: /post/java-unit-test-01-intro
---

“I've tested this code, it runs.” — running doesn't mean correct, and manual testing doesn't mean test coverage. When you change a line of code, how do you make sure you haven't broken something else? When you delete a field, has every place that references it been updated? Unit tests exist precisely to answer those “what ifs”.

<!--以上为摘要内容-->

## What Is a Unit Test

A **unit test** is an isolated test of the smallest testable unit in software (usually a method or a function), verifying that its behavior matches expectations.

It isn't running the code by hand to eyeball whether the result looks right, but **writing test cases in code and letting a machine run them and assert automatically**.

A minimal unit test looks like this:

```java
// the code under test
public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }
}

// the test code
@Test
public void testAdd() {
    Calculator calc = new Calculator();
    int result = calc.add(2, 3);
    assertEquals(5, result);  // assertion: the expected result is 5
}
```

Note a few keywords: **`@Test`** marks this as a test method, and **`assertEquals`** is the assertion — if the actual result isn't 5, the test fails.

## Why Write Unit Tests

### 1. You Are the First User

When you write a unit test, you are the **first user** of the code under test. That forces you to think about:

- How is this method called? Do the parameters make sense?
- What happens in exceptional cases? Will passing null crash it?
- Is the return type convenient to use?

If code is hard to test, that usually means it's poorly designed. **Testability is maintainability.**

### 2. Confidence When You Change Code

```java
// a utility class you wrote three months ago, now up for refactoring
public class StringUtils {
    // ... 300 lines of code
}
```

Without unit tests, you don't dare ship after making a change — who knows which caller in which corner you broke?

With unit tests, you just run `mvn test`. All green, merge with confidence; any red, track it down and fix it.

### 3. Living Documentation

Comments go stale and documentation falls behind. Test code, on the other hand, **must compile and run together with the production code** — otherwise it fails. That makes test code **behavioral documentation that never expires**.

```java
@Test
public void should_return_trimmed_string_when_input_has_spaces() {
    assertEquals("hello", StringUtils.trim("  hello  "));
}
```

One glance at the test method name tells you how this utility class handles spaces. It's more trustworthy than any Javadoc.

### 4. Regression Protection

You write a line of code today and change some piece of logic, and all the related tests run. If you broke something, you know immediately.

That's **regression testing** — making sure new code doesn't break old functionality.

## Shift-Left Testing

In traditional software development, testing is QA's job and happens long after the code is written:

```
Requirements → design → coding → [much later] → QA testing → file a bug → dev fixes → QA retests → ...
```

**Shift-left testing** means moving testing activity **to the left**, into the development phase: developers write tests while they're coding, or even **write the test before the code** (TDD).

```
Requirements → design → write tests → coding → tests pass → commit
         ↑__________|
         测试左移到这里
```

In essence it isn't about abolishing QA, but this: **developers do the verification they can do well; QA does the deeper testing.** The two are complementary.

## The History of JUnit

The evolution of Java unit testing frameworks is a history of going from “making do” to professional tooling.

### JUnit 3 (2001 ~ 2006)

This was JUnit's embryonic era. Everything was primitive:

```java
// the JUnit 3 way
public class CalculatorTest extends TestCase {  // must extend TestCase
    public CalculatorTest(String name) {
        super(name);
    }

    public void testAdd() {  // the method name must start with test
        Calculator calc = new Calculator();
        assertEquals(5, calc.add(2, 3));
    }

    public static Test suite() {  // register the test suite by hand
        return new TestSuite(CalculatorTest.class);
    }
}
```

The pain points are obvious: you had to extend `TestCase`, method names had to start with `test`, and you had to register test suites by hand. Every new test method meant editing `suite()`, which was extremely verbose.

### JUnit 4 (2006 ~ 2017)

Java 5 introduced annotations, and JUnit 4 embraced them completely, saying goodbye to inheritance and naming conventions:

```java
// the JUnit 4 way
public class CalculatorTest {  // no inheritance needed any more
    @Before
    public void setUp() { /* initialization */ }

    @Test  // marked by annotation, method name as you like
    public void should_add_two_numbers() {
        assertEquals(5, new Calculator().add(2, 3));
    }

    @Test(expected = IllegalArgumentException.class)  // expect an exception
    public void should_throw_when_divisor_is_zero() {
        new Calculator().divide(10, 0);
    }

    @Ignore("暂时跳过")
    @Test
    public void futureFeature() { /* ... */ }
}
```

JUnit 4 ruled the Java testing world for more than a decade, and plenty of projects still use it today. But it has its limitations:

- Its architecture is monolithic — everything is crammed into a single jar, with no way to extend it
- No native support for parameterized tests (you had to fall back on `@RunWith` plus a custom Runner, which was awkward)
- No grouping or nested tests
- There is only one `@Before` / `@After`, which isn't flexible

### JUnit 5 (2017 ~ present)

JUnit 5 is a **complete rewrite** of JUnit 4, not an upgrade patch — it solves JUnit 4's accumulated problems at the architectural level:

```java
// the JUnit 5 way
class CalculatorTest {  // classes and methods no longer need public
    @BeforeEach
    void setUp() { /* runs before every test */ }

    @Test
    @DisplayName("两个正数相加，返回和")  // a Chinese description
    void addTwoPositiveNumbers() {
        assertEquals(5, new Calculator().add(2, 3));
    }

    @ParameterizedTest  // native parameterized test
    @CsvSource({"1,2,3", "0,0,0", "-1,1,0"})
    void add(int a, int b, int expected) {
        assertEquals(expected, new Calculator().add(a, b));
    }

    @Nested  // nested tests, organized by scenario
    @DisplayName("除法运算")
    class DivideTests {
        @Test
        void shouldDivideEvenly() {
            assertEquals(2, new Calculator().divide(10, 5));
        }

        @Test
        void shouldThrowWhenDivisorIsZero() {
            assertThrows(ArithmeticException.class,
                () -> new Calculator().divide(10, 0));
        }
    }
}
```

JUnit 5's core improvements:

| Feature | JUnit 4 | JUnit 5 |
|------|---------|---------|
| Architecture | monolithic jar | modular (Platform + Jupiter + Vintage) |
| Access modifiers | methods must be `public` | package-level is enough (simpler) |
| Setup/teardown | `@Before` / `@After` | `@BeforeEach` / `@AfterEach` + `@BeforeAll` / `@AfterAll` |
| Parameterized tests | needs an extra Runner, a hassle | native support via `@ParameterizedTest` |
| Exception tests | `@Test(expected=...)` | `assertThrows()`, more flexible |
| Grouped tests | none | `@Nested`, organized by scenario |
| Display names | rely on the method name | `@DisplayName` supports Chinese/spaces |
| Java version | requires Java 5+ | requires Java 8+ |
| Extension mechanism | `@RunWith` Runner | the `@ExtendWith` Extension API, more powerful |

Next time we'll dig into practical JUnit 5 usage.

## Alternatives to JUnit

### TestNG

TestNG is another popular Java testing framework, one that supported advanced features like parameterized tests, grouped execution and dependent tests earlier than JUnit did.

| | JUnit | TestNG |
|---|-------|--------|
| Parameterized tests | JUnit 4 via a Runner; native in JUnit 5 | native `@DataProvider` |
| Test grouping | none in JUnit 4; `@Tag` in JUnit 5 | `@Test(groups="xxx")` |
| Test dependencies | not supported | `@Test(dependsOnMethods=...)` |
| Parallel execution | needs extra configuration | natively supported |
| Ecosystem | extremely rich | comparatively small |

If your team is doing data-driven testing and needs complex test orchestration, TestNG is worth a look. But for the vast majority of projects, JUnit 5 is already enough and has the most complete ecosystem.

## Where It Sits in the DevOps Loop

Unit testing sits in the **test stage** of the `develop` loop:

```
Commit code → static check → compile → unit test → integration test → package → deploy
                              ↑
                         这里就是单元测试的战场
```

It complements static analysis: static analysis **doesn't run the code** and looks for problems in how it's written; unit tests **run the code** and prove the behavior is correct.

## Series Preview

This series is planned to cover the following:

| No. | Content |
|------|------|
| 1 (this article) | Unit testing concepts, history, why to write them |
| 2 | JUnit 5 in practice: annotations, assertions, parameterized tests, nested tests |
| 3 | Mockito: isolating dependencies, mock objects, behavior verification |

Testing won't find every bug for you — but that isn't a flaw in testing, it's the boundary of where it applies. It proves the code works “the way you imagine it does”; code review and integration tests are what guarantee it works “the way the real world does”.

A small step forward every day is a new height!
