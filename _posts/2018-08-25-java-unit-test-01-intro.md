---
title: Java 单元测试（一）：什么是单元测试，为什么要写
author: 唐明
categories: [test]
tags: [Java, 单元测试, JUnit, 测试左移]
---

“这段代码我测过了，能跑。”——能跑不等于正确，手动测试不等于测试覆盖。你改了一行代码，怎么确保没弄坏别的地方？删掉了一个字段，所有引用的地方都更新了吗？单元测试的存在，就是为了回答这些“万一”。

<!--以上为摘要内容-->

## 什么是单元测试

**单元测试**（Unit Test）是指对软件中最小可测试单元（通常是一个方法或函数）进行隔离测试，验证其行为是否符合预期。

它不是手动跑一遍看结果对不对，而是**用代码写测试用例，让机器自动跑、自动断言**。

一个最简的单元测试长这样：

```java
// 被测试的代码
public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }
}

// 测试代码
@Test
public void testAdd() {
    Calculator calc = new Calculator();
    int result = calc.add(2, 3);
    assertEquals(5, result);  // 断言：期望结果是 5
}
```

关注几个关键字：**`@Test`** 标记这是一个测试方法，**`assertEquals`** 是断言——如果实际结果不是 5，测试就失败。

## 为什么要写单元测试

### 1. 你是第一个用户

写单元测试的时候，你就是被测试代码的**第一个使用者**。这逼着你思考：

- 这个方法怎么调用？参数合理吗？
- 异常情况怎么办？传 null 会崩吗？
- 返回值类型方便使用吗？

代码如果难测试，通常意味着它设计得不好。**可测试性就是可维护性。**

### 2. 改代码的底气

```java
// 三个月前你写的工具类，现在要重构
public class StringUtils {
    // ... 300 行代码
}
```

没有单元测试，你改完不敢上线——谁知道改坏了哪个角落的调用方？

有单元测试，你只需要跑一下：`mvn test`。全绿，放心合入；有红的，定位修复。

### 3. 活的文档

注释会过时，文档会落伍。但测试代码**必须和业务代码一起编译、运行**——否则就失败。这意味着测试代码是**永不过期的行为文档**。

```java
@Test
public void should_return_trimmed_string_when_input_has_spaces() {
    assertEquals("hello", StringUtils.trim("  hello  "));
}
```

一看测试方法名，就知道这个工具类对空格怎么处理。比任何 Javadoc 都可信。

### 4. 防回归

你今天写了一行代码，改了某个逻辑，所有相关的测试都会跑一遍。如果改坏了，立刻就知道。

这就是**回归测试**（Regression Testing）——确保新代码不破坏旧功能。

## 测试左移

传统软件开发中，测试是 QA 的事，在代码写完很久以后才进行：

```
需求 → 设计 → 编码 → [很久以后] → QA 测试 → 提 Bug → 开发修复 → QA 再测 → ...
```

**测试左移**（Shift-Left Testing）说的是：把测试活动**向左移动**到开发阶段，开发者在编码时就写测试，甚至**先写测试再写代码**（TDD）。

```
需求 → 设计 → 写测试 → 编码 → 测试通过 → 提交
         ↑__________|
         测试左移到这里
```

本质不是取消 QA，而是：**开发做能做好的验证，QA 做更深层的测试。** 两者互补。

## JUnit 的历史发展

Java 单元测试框架的演进，就是一部“从凑合用到专业工具”的历史。

### JUnit 3（2001 ~ 2006）

这是 JUnit 的雏形时代。一切都很原始：

```java
// JUnit 3 的写法
public class CalculatorTest extends TestCase {  // 必须继承 TestCase
    public CalculatorTest(String name) {
        super(name);
    }

    public void testAdd() {  // 方法名必须以 test 开头
        Calculator calc = new Calculator();
        assertEquals(5, calc.add(2, 3));
    }

    public static Test suite() {  // 手工注册测试套件
        return new TestSuite(CalculatorTest.class);
    }
}
```

痛点很明显：必须继承 `TestCase`、方法名必须 `test` 开头、必须手工注册测试套件。每次新增测试方法都要改 `suite()`，非常啰嗦。

### JUnit 4（2006 ~ 2017）

Java 5 引入了注解，JUnit 4 彻底拥抱了它，告别了继承和命名约定：

```java
// JUnit 4 的写法
public class CalculatorTest {  // 不再需要继承
    @Before
    public void setUp() { /* 初始化 */ }

    @Test  // 注解标记，方法名随意
    public void should_add_two_numbers() {
        assertEquals(5, new Calculator().add(2, 3));
    }

    @Test(expected = IllegalArgumentException.class)  // 期望抛异常
    public void should_throw_when_divisor_is_zero() {
        new Calculator().divide(10, 0);
    }

    @Ignore("暂时跳过")
    @Test
    public void futureFeature() { /* ... */ }
}
```

JUnit 4 统治了 Java 测试世界十多年，直到现在大量项目仍在使用。但它也有局限：

- 架构单一，所有东西塞在一个 jar 里，无法扩展
- 没有原生参数化测试支持（靠 `@RunWith` + 自定义 Runner，很别扭）
- 没有分组/嵌套测试
- `@Before` / `@After` 只有一个，不灵活

### JUnit 5（2017 ~ 至今）

JUnit 5 是对 JUnit 4 的**彻底重写**，不是升级补丁——它从架构层面解决 JUnit 4 的积弊：

```java
// JUnit 5 的写法
class CalculatorTest {  // 类和方法可以不用 public 了
    @BeforeEach
    void setUp() { /* 每个测试前执行 */ }

    @Test
    @DisplayName("两个正数相加，返回和")  // 中文描述
    void addTwoPositiveNumbers() {
        assertEquals(5, new Calculator().add(2, 3));
    }

    @ParameterizedTest  // 原生参数化测试
    @CsvSource({"1,2,3", "0,0,0", "-1,1,0"})
    void add(int a, int b, int expected) {
        assertEquals(expected, new Calculator().add(a, b));
    }

    @Nested  // 嵌套测试，按场景组织
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

JUnit 5 的核心改进：

| 特性 | JUnit 4 | JUnit 5 |
|------|---------|---------|
| 架构 | 单体 jar | 模块化（Platform + Jupiter + Vintage） |
| 访问修饰符 | 方法必须 `public` | 包级别即可（更简洁） |
| 初始化/清理 | `@Before` / `@After` | `@BeforeEach` / `@AfterEach` + `@BeforeAll` / `@AfterAll` |
| 参数化测试 | 需额外 Runner，折腾 | `@ParameterizedTest` 原生支持 |
| 异常测试 | `@Test(expected=...)` | `assertThrows()`，更灵活 |
| 分组测试 | 无 | `@Nested` 按场景组织 |
| 显示名称 | 靠方法名 | `@DisplayName` 支持中文/空格 |
| Java 版本 | 需要 Java 5+ | 需要 Java 8+ |
| 扩展机制 | `@RunWith` Runner | `@ExtendWith` Extension API，更强大 |

下一篇我们会深入 JUnit 5 的实战用法。

## JUnit 之外的选择

### TestNG

TestNG 是另一款流行的 Java 测试框架，比 JUnit 更早支持了参数化测试、分组执行、依赖测试等高级特性。

| | JUnit | TestNG |
|---|-------|--------|
| 参数化测试 | JUnit 4 靠 Runner；JUnit 5 原生 | 原生 `@DataProvider` |
| 测试分组 | JUnit 4 无；JUnit 5 `@Tag` | `@Test(groups="xxx")` |
| 测试依赖 | 不支持 | `@Test(dependsOnMethods=...)` |
| 并行执行 | 需额外配置 | 原生支持 |
| 生态 | 极其丰富 | 相对较少 |

如果你的团队在做数据驱动测试、需要复杂的测试编排，TestNG 值得关注。但对绝大多数项目，JUnit 5 已经足够且生态最完善。

## 在 DevOps 回环中的位置

单元测试处于 `develop` 回环的**测试阶段**：

```
代码提交 → 静态检查 → 编译 → 单元测试 → 集成测试 → 打包 → 部署
                              ↑
                         这里就是单元测试的战场
```

它和静态检查是互补的：静态检查**不运行代码**，找写法问题；单元测试**运行代码**，证行为正确。

## 系列预告

本系列计划覆盖以下内容：

| 序号 | 内容 |
|------|------|
| 一（本篇） | 单元测试概念、历史、为什么写 |
| 二 | JUnit 5 实战：注解、断言、参数化测试、嵌套测试 |
| 三 | Mockito：隔离依赖、模拟对象、行为验证 |

测试不会帮你找出所有 Bug——但这不叫它的缺陷，而叫它的适用边界。它证明代码“按你想象的样子工作”，而代码审查和集成测试会保障“按真实世界的样子工作”。

每天前进一小步，就是一个新的高度！
