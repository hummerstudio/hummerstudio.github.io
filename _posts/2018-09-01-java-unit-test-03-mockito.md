---
title: Java 单元测试（三）：用 Mockito 隔离外部依赖
author: 唐明
categories: [test]
tags: [Java, 单元测试, Mockito, Mock, 测试]
---

上一篇文章我们学会了用 JUnit 5 写单元测试。但现实很快会给你一记重拳——你写的 Service 依赖了 DAO，DAO 依赖了数据库；你写的 Controller 依赖了 HTTP 请求对象；你写的业务逻辑依赖了第三方 API。难道每次跑测试都要启动数据库、连外网、搭微服务？Mockito 告诉你：不用。模拟这些依赖，让你的测试快如闪电。

<!--以上为摘要内容-->

## 问题：为什么不能直接测试

看一个典型场景：

```java
public class OrderService {
    private PaymentGateway paymentGateway;  // 依赖第三方支付 API
    private OrderRepository repository;      // 依赖数据库
    private EmailService emailService;       // 依赖邮件服务

    public OrderResult placeOrder(Order order) {
        // 1. 检查库存（查数据库）
        if (!repository.hasStock(order)) {
            throw new OutOfStockException();
        }
        // 2. 扣款（调第三方支付）
        PaymentResult payment = paymentGateway.charge(order.getAmount());
        // 3. 保存订单（写数据库）
        repository.save(order);
        // 4. 发邮件通知（调邮件服务）
        emailService.sendConfirmation(order.getEmail());
        return OrderResult.success(order.getId());
    }
}
```

直接测试 `placeOrder` 的问题：

- 需要一个**真实的数据库**
- 需要一个**真实的支付网关**（每次测试都扣钱？）
- 需要一个**真实的邮件服务器**
- 测试**慢**（秒级变成分钟级）
- 测试**不稳定**（网络挂了测试也挂了，但代码没问题）
- 难以模拟**异常场景**（支付超时、库存不足怎么测？）

## Mockito 是什么

Mockito 是 Java 生态最流行的 mock 框架。它的核心不是“帮你写测试”，而是**帮你伪造依赖**。

用 Mockito 改造上面的测试：

```java
@Test
void shouldPlaceOrderSuccessfully() {
    // 1. 创建 mock 对象（假的依赖）
    PaymentGateway mockPayment = mock(PaymentGateway.class);
    OrderRepository mockRepo = mock(OrderRepository.class);
    EmailService mockEmail = mock(EmailService.class);

    // 2. 设定 mock 的行为
    when(mockRepo.hasStock(any())).thenReturn(true);                 // 总是有货
    when(mockPayment.charge(any())).thenReturn(PaymentResult.ok());  // 支付总是成功

    // 3. 注入 mock，执行测试
    OrderService service = new OrderService(mockPayment, mockRepo, mockEmail);
    OrderResult result = service.placeOrder(new Order());

    // 4. 断言结果
    assertEquals(OrderStatus.SUCCESS, result.getStatus());

    // 5. 验证：确认 save 和 sendConfirmation 被调用了
    verify(mockRepo).save(any(Order.class));
    verify(mockEmail).sendConfirmation(anyString());
}
```

整个过程**没有连接任何数据库、支付网关或邮件服务**。全部在内存中，毫秒级完成。

Mockito 的三个核心能力：

| 能力 | 含义 |
|------|------|
| **Stubbing**（打桩） | 设定 mock 对象返回什么值 |
| **Verification**（验证） | 检查某个方法是否被调用、调了几次 |
| **Mock**（模拟） | 创建假的对象替代真实依赖 |

## 快速上手

### Maven 依赖

```xml
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>2.23.0</version>
    <scope>test</scope>
</dependency>
<!-- JUnit 5 需要额外做集成 -->
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <version>2.23.0</version>
    <scope>test</scope>
</dependency>
```

### 创建 Mock 对象

Mockito 提供了三种方式：

```java
// 方式 1：手动创建
OrderRepository mockRepo = mock(OrderRepository.class);

// 方式 2：注解创建（推荐）
@Mock
OrderRepository mockRepo;

// 方式 3：JUnit 5 集成（最推荐）
@ExtendWith(MockitoExtension.class)  // 在类上加这个
class OrderServiceTest {
    @Mock
    OrderRepository mockRepo;

    @Test
    void test() {
        // mockRepo 已经自动初始化好了
    }
}
```

注解方式不需要在 `@BeforeEach` 里调 `initMocks(this)`，`MockitoExtension` 自动处理。

## 打桩（Stubbing）

打桩就是告诉 mock 对象：“当有人调这个方法时，返回这个值”。

### 基本打桩

```java
// 返回一个固定值
when(mockRepo.findById(1L)).thenReturn(Optional.of(new Order()));

// 返回多个值，轮流使用
when(mockRepo.count()).thenReturn(1L, 2L, 3L);
// 第 1 次调用返回 1，第 2 次返回 2，第 3 次返回 3

// 抛异常
when(mockPayment.charge(any())).thenThrow(new PaymentTimeoutException());

// 用真实逻辑
when(mockRepo.save(any())).thenAnswer(invocation -> {
    Order order = invocation.getArgument(0);
    order.setId(System.currentTimeMillis());  // 模拟自增 ID
    return order;
});
```

### 参数匹配器（Argument Matcher）

不是每次调用都返回同一个值——你需要根据参数不同返回不同的东西：

```java
// any() 匹配任意参数
when(mockRepo.findById(anyLong())).thenReturn(Optional.empty());

// 精确匹配
when(mockRepo.findById(1L)).thenReturn(Optional.of(order1));
when(mockRepo.findById(2L)).thenReturn(Optional.of(order2));

// eq() 需要和其他 matcher 混用时指定精确值
when(mockService.process(eq("VIP"), anyInt())).thenReturn(true);

// 自定义匹配器
when(mockRepo.find(argThat(order -> order.getAmount() > 100)))
    .thenReturn(Collections.singletonList(bigOrder));
```

**重要**：一旦用了 `any()` 之类的 matcher，所有参数都必须用 matcher。不能混用：

```java
// 错误！会抛异常
when(mockService.process("VIP", anyInt()));

// 正确
when(mockService.process(eq("VIP"), anyInt()));
```

## 验证（Verification）

打桩是设定“它该返回什么”，验证是确认“它确实被调用了”。

### 基本验证

```java
// 确认某个方法被调了一次
verify(mockRepo).save(any(Order.class));

// 确认被调了 N 次
verify(mockRepo, times(3)).findById(anyLong());

// 确认从未被调用
verify(mockEmail, never()).sendConfirmation(anyString());

// 确认至少 / 至多
verify(mockRepo, atLeast(1)).save(any());
verify(mockRepo, atMost(5)).save(any());
```

### 验证调用顺序

```java
InOrder inOrder = inOrder(mockRepo, mockEmail);

inOrder.verify(mockRepo).save(any());          // 先 save
inOrder.verify(mockEmail).sendConfirmation();  // 再发邮件
```

如果实际调用顺序是反的，测试会失败。

### 验证无其他交互

```java
verify(mockRepo).save(any());
verifyNoMoreInteractions(mockRepo);  // 确认 save 是唯一被调用的方法
```

这个很严格——如果还有别的无意义调用，测试就会失败。适合对关键路径做严格验证。

## Spy（部分模拟）

有时候你不想伪造整个对象，只是想“跟踪真实对象的调用，同时覆盖个别方法”：

```java
// 一个真实的 List
List<String> list = new ArrayList<>();

// 包装成 spy
List<String> spyList = spy(list);

// 大部分方法走真实逻辑，只覆盖个别方法
when(spyList.size()).thenReturn(100);  // size() 返回 100（假的）
spyList.add("hello");                   // add() 走真实逻辑（真的加进去了）

assertEquals(100, spyList.size());
assertEquals("hello", spyList.get(0));  // get() 也是真实逻辑
```

**Spy 比 Mock 要谨慎使用**。如果大量用 Spy 而非 Mock，说明你的被测对象设计可能需要重构——依赖太深，mock 不了。

## 实战模式

### 模式 1：验证异常路径

```java
@Test
@DisplayName("库存不足时，应抛出 OutOfStockException 且不扣款不发邮件")
void shouldThrowWhenOutOfStock() {
    when(mockRepo.hasStock(any())).thenReturn(false);

    assertThrows(OutOfStockException.class,
        () -> service.placeOrder(new Order()));

    verify(mockPayment, never()).charge(any());   // 没扣款
    verify(mockEmail, never()).sendConfirmation(); // 没发邮件
}
```

### 模式 2：验证返回值是否正确

```java
@Test
@DisplayName("VIP 用户享受 9 折优惠")
void shouldApplyDiscountForVIP() {
    User vipUser = new User("vip001", UserType.VIP);
    when(mockUserService.getCurrentUser()).thenReturn(vipUser);

    Price finalPrice = pricingService.calculate(order);

    assertEquals(new BigDecimal("90.0"), finalPrice.getAmount());
}
```

### 模式 3：验证副作用是否发生

```java
@Test
@DisplayName("注册成功后应发送欢迎邮件")
void shouldSendWelcomeEmailAfterRegistration() {
    when(mockUserRepo.save(any())).thenReturn(newUser);

    registrationService.register("newuser", "password");

    ArgumentCaptor<Email> captor = ArgumentCaptor.forClass(Email.class);
    verify(mockEmailService).send(captor.capture());

    Email sent = captor.getValue();
    assertEquals("newuser@example.com", sent.getTo());
    assertTrue(sent.getBody().contains("欢迎"));
}
```

`ArgumentCaptor` 捕获传给 mock 方法的实际参数——你可以对它做更细致的断言。

## 常见陷阱

### 1. 不要 mock 值对象

```java
// 错误：mock 一个 POJO
User mockUser = mock(User.class);
when(mockUser.getName()).thenReturn("张三");

// 正确：直接用 new
User user = new User("张三", 25);
```

值对象（POJO、DTO）没有外部依赖，不需要 mock。Mock 应该用于有副作用的外部依赖（数据库、网络、文件系统）。

### 2. 不要 mock 你无法控制的东西

不要 mock `System.currentTimeMillis()`、`new Date()` 这类 JDK 内置方法。如果需要控制时间，注入一个 `Clock` 对象：

```java
public class OrderService {
    private Clock clock;  // 可注入，可 mock
}

// 测试中
when(mockClock.instant()).thenReturn(Instant.parse("2018-09-01T10:00:00Z"));
```

### 3. 不要忘了验证

只打桩不验证，等于只检查了“正常路径”，不知道异常路径是否被触发：

```java
// 不够好
when(mockRepo.hasStock(any())).thenReturn(false);
assertThrows(OutOfStockException.class, () -> service.placeOrder(order));

// 更好——加上验证
verify(mockPayment, never()).charge(any());  // 确认没被扣款
```

### 4. 不要 mock 类型

Mockito 不能 mock final 类、final 方法、static 方法（至少 2.x 版本不能）。如果遇到了这样的依赖，说明设计上耦合太紧，应该考虑引入接口解耦。

## Mockito 和 JUnit 5 的关系

Mockito 不替 JUnit，JUnit 也不替 Mockito——它们是搭档：

```
JUnit 5 负责：跑测试、断言结果、管理生命周期
Mockito 负责：创建 mock、打桩、验证交互
```

一个典型的测试类结构：

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock OrderRepository mockRepo;
    @Mock PaymentGateway mockPayment;
    @Mock EmailService mockEmail;

    @InjectMocks  // 自动将 mock 注入到 service 的构造函数
    OrderService service;

    @Test
    void test() {
        // 1. 打桩
        when(mockRepo.hasStock(any())).thenReturn(true);
        when(mockPayment.charge(any())).thenReturn(PaymentResult.ok());

        // 2. 执行
        OrderResult result = service.placeOrder(new Order());

        // 3. 断言
        assertEquals(OrderStatus.SUCCESS, result.getStatus());

        // 4. 验证
        verify(mockRepo).save(any());
    }
}
```

`@InjectMocks` 会自动把 `@Mock` 标注的 mock 注入到 `@InjectMocks` 标注的对象中——通过构造器、setter、或字段注入。

## 小结

Mockito 解决的核心问题是：**把单元测试从外部依赖中解放出来**。

| 没有 Mockito | 有 Mockito |
|-------------|-----------|
| 测试要连数据库，慢 | 内存中运行，毫秒级 |
| 测试要连外网，不稳定 | 完全不依赖网络 |
| 异常场景难构造 | `thenThrow()` 一行搞定 |
| 测试结果不可预知 | 打桩控制一切 |

但它不是万能的——Mockito 适合单元测试层的隔离，集成测试该连数据库还是要连。认清它的边界，才能用得其所。

下一篇开始，我们会转向另一个话题：你写了这么多测试，到底覆盖了多少代码？JaCoCo 来告诉你答案。

每天前进一小步，就是一个新的高度！
