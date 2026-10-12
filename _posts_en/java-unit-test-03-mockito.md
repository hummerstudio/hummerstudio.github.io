---
title: 'Java Unit Testing (Part 3): Isolating External Dependencies with Mockito'
date: 2018-09-01
author: Tang Moying
categories: [test]
tags: [Java, Unit Testing, Mockito, Mock, Testing]
lang: en
alt_url: /post/java-unit-test-03-mockito
---

In the previous article we learned how to write unit tests with JUnit 5. But reality is about to hit you hard — the Service you wrote depends on a DAO, and the DAO depends on a database; the Controller you wrote depends on an HTTP request object; the business logic you wrote depends on a third-party API. Do you really have to start a database, reach out to the internet and stand up microservices every time you run a test? Mockito tells you: no. Mock these dependencies and your tests will run like lightning.

<!--以上为摘要内容-->

## The Problem: Why You Can't Test It Directly

Take a typical scenario:

```java
public class OrderService {
    private PaymentGateway paymentGateway;  // depends on a third-party payment API
    private OrderRepository repository;      // depends on the database
    private EmailService emailService;       // depends on the mail service

    public OrderResult placeOrder(Order order) {
        // 1. Check stock (query the database)
        if (!repository.hasStock(order)) {
            throw new OutOfStockException();
        }
        // 2. Charge the payment (call the third-party payment service)
        PaymentResult payment = paymentGateway.charge(order.getAmount());
        // 3. Save the order (write to the database)
        repository.save(order);
        // 4. Send the email notification (call the mail service)
        emailService.sendConfirmation(order.getEmail());
        return OrderResult.success(order.getId());
    }
}
```

The problems with testing `placeOrder` directly:

- It needs a **real database**
- It needs a **real payment gateway** (charging money on every test run?)
- It needs a **real mail server**
- The test is **slow** (seconds turn into minutes)
- The test is **unstable** (the network goes down and the test goes down with it, even though the code is fine)
- **Exceptional scenarios** are hard to simulate (how do you test a payment timeout or insufficient stock?)

## What Mockito Is

Mockito is the most popular mocking framework in the Java ecosystem. Its core is not “writing tests for you” but **faking dependencies for you**.

Rewriting the test above with Mockito:

```java
@Test
void shouldPlaceOrderSuccessfully() {
    // 1. Create mock objects (fake dependencies)
    PaymentGateway mockPayment = mock(PaymentGateway.class);
    OrderRepository mockRepo = mock(OrderRepository.class);
    EmailService mockEmail = mock(EmailService.class);

    // 2. Set up the mock behavior
    when(mockRepo.hasStock(any())).thenReturn(true);                 // always in stock
    when(mockPayment.charge(any())).thenReturn(PaymentResult.ok());  // payment always succeeds

    // 3. Inject the mocks and run the test
    OrderService service = new OrderService(mockPayment, mockRepo, mockEmail);
    OrderResult result = service.placeOrder(new Order());

    // 4. Assert the result
    assertEquals(OrderStatus.SUCCESS, result.getStatus());

    // 5. Verify: confirm that save and sendConfirmation were called
    verify(mockRepo).save(any(Order.class));
    verify(mockEmail).sendConfirmation(anyString());
}
```

Nowhere in that whole process do we **connect to any database, payment gateway or mail service**. Everything runs in memory and finishes in milliseconds.

Mockito's three core capabilities:

| Capability | Meaning |
|------|------|
| **Stubbing** | Sets what value a mock object returns |
| **Verification** | Checks whether a method was called, and how many times |
| **Mock** | Creates a fake object to stand in for a real dependency |

## Quick Start

### Maven Dependency

```xml
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>2.23.0</version>
    <scope>test</scope>
</dependency>
<!-- JUnit 5 needs an extra integration module -->
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <version>2.23.0</version>
    <scope>test</scope>
</dependency>
```

### Creating Mock Objects

Mockito gives you three ways:

```java
// Way 1: create it manually
OrderRepository mockRepo = mock(OrderRepository.class);

// Way 2: create it with an annotation (recommended)
@Mock
OrderRepository mockRepo;

// Way 3: JUnit 5 integration (most recommended)
@ExtendWith(MockitoExtension.class)  // add this to the class
class OrderServiceTest {
    @Mock
    OrderRepository mockRepo;

    @Test
    void test() {
        // mockRepo has already been initialized for you
    }
}
```

With the annotation approach you don't need to call `initMocks(this)` inside `@BeforeEach` — `MockitoExtension` handles it for you.

## Stubbing

Stubbing means telling a mock object: “when someone calls this method, return this value”.

### Basic Stubbing

```java
// return a fixed value
when(mockRepo.findById(1L)).thenReturn(Optional.of(new Order()));

// return several values, used in turn
when(mockRepo.count()).thenReturn(1L, 2L, 3L);
// the 1st call returns 1, the 2nd returns 2, the 3rd returns 3

// throw an exception
when(mockPayment.charge(any())).thenThrow(new PaymentTimeoutException());

// use real logic
when(mockRepo.save(any())).thenAnswer(invocation -> {
    Order order = invocation.getArgument(0);
    order.setId(System.currentTimeMillis());  // simulate an auto-increment ID
    return order;
});
```

### Argument Matchers

You don't always return the same value on every call — you need to return different things depending on the arguments:

```java
// any() matches any argument
when(mockRepo.findById(anyLong())).thenReturn(Optional.empty());

// exact matching
when(mockRepo.findById(1L)).thenReturn(Optional.of(order1));
when(mockRepo.findById(2L)).thenReturn(Optional.of(order2));

// eq() pins an exact value when you mix it with other matchers
when(mockService.process(eq("VIP"), anyInt())).thenReturn(true);

// custom matcher
when(mockRepo.find(argThat(order -> order.getAmount() > 100)))
    .thenReturn(Collections.singletonList(bigOrder));
```

**Important**: once you use a matcher like `any()`, every argument must use a matcher. You can't mix them:

```java
// wrong! this throws an exception
when(mockService.process("VIP", anyInt()));

// correct
when(mockService.process(eq("VIP"), anyInt()));
```

## Verification

Stubbing sets “what it should return”; verification confirms “that it really was called”.

### Basic Verification

```java
// confirm that a method was called once
verify(mockRepo).save(any(Order.class));

// confirm that it was called N times
verify(mockRepo, times(3)).findById(anyLong());

// confirm that it was never called
verify(mockEmail, never()).sendConfirmation(anyString());

// confirm at least / at most
verify(mockRepo, atLeast(1)).save(any());
verify(mockRepo, atMost(5)).save(any());
```

### Verifying the Call Order

```java
InOrder inOrder = inOrder(mockRepo, mockEmail);

inOrder.verify(mockRepo).save(any());          // save first
inOrder.verify(mockEmail).sendConfirmation();  // then send the email
```

If the actual call order is reversed, the test fails.

### Verifying There Are No Other Interactions

```java
verify(mockRepo).save(any());
verifyNoMoreInteractions(mockRepo);  // confirm that save is the only method that was called
```

This one is strict — if there is any other pointless call, the test fails. It suits strict verification of a critical path.

## Spy (Partial Mocking)

Sometimes you don't want to fake an entire object; you just want to “track calls on a real object while overriding a few individual methods”:

```java
// a real List
List<String> list = new ArrayList<>();

// wrap it as a spy
List<String> spyList = spy(list);

// most methods use the real logic; only a few are overridden
when(spyList.size()).thenReturn(100);  // size() returns 100 (fake)
spyList.add("hello");                   // add() uses the real logic (it really is added)

assertEquals(100, spyList.size());
assertEquals("hello", spyList.get(0));  // get() is real logic too
```

**Use Spy more cautiously than Mock.** If you use Spy rather than Mock in large amounts, that's a sign the object under test may need refactoring — its dependencies run too deep to mock.

## Patterns in Practice

### Pattern 1: Verifying the Exception Path

```java
@Test
@DisplayName("库存不足时，应抛出 OutOfStockException 且不扣款不发邮件")
void shouldThrowWhenOutOfStock() {
    when(mockRepo.hasStock(any())).thenReturn(false);

    assertThrows(OutOfStockException.class,
        () -> service.placeOrder(new Order()));

    verify(mockPayment, never()).charge(any());   // no charge
    verify(mockEmail, never()).sendConfirmation(); // no email sent
}
```

### Pattern 2: Verifying the Return Value Is Correct

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

### Pattern 3: Verifying That a Side Effect Happened

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

`ArgumentCaptor` captures the actual arguments passed to a mock method — you can make finer-grained assertions against them.

## Common Pitfalls

### 1. Don't Mock Value Objects

```java
// wrong: mock a POJO
User mockUser = mock(User.class);
when(mockUser.getName()).thenReturn("张三");

// correct: just use new
User user = new User("张三", 25);
```

Value objects (POJOs, DTOs) have no external dependencies and don't need mocking. Mock should be used for external dependencies with side effects (databases, networks, file systems).

### 2. Don't Mock Things You Can't Control

Don't mock JDK built-ins like `System.currentTimeMillis()` or `new Date()`. If you need to control time, inject a `Clock` object:

```java
public class OrderService {
    private Clock clock;  // injectable, mockable
}

// in the test
when(mockClock.instant()).thenReturn(Instant.parse("2018-09-01T10:00:00Z"));
```

### 3. Don't Forget to Verify

Stubbing without verifying is only checking the “happy path”; you have no idea whether the exception path was ever triggered:

```java
// not good enough
when(mockRepo.hasStock(any())).thenReturn(false);
assertThrows(OutOfStockException.class, () -> service.placeOrder(order));

// better — add verification
verify(mockPayment, never()).charge(any());  // confirm that no charge was made
```

### 4. Don't Mock Types

Mockito can't mock final classes, final methods or static methods (at least not in 2.x). If you run into a dependency like that, the design is too tightly coupled and you should consider introducing an interface to decouple it.

## The Relationship Between Mockito and JUnit 5

Mockito doesn't replace JUnit, and JUnit doesn't replace Mockito — they're partners:

```
JUnit 5 负责：跑测试、断言结果、管理生命周期
Mockito 负责：创建 mock、打桩、验证交互
```

A typical test class structure:

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock OrderRepository mockRepo;
    @Mock PaymentGateway mockPayment;
    @Mock EmailService mockEmail;

    @InjectMocks  // automatically inject the mocks into the service's constructor
    OrderService service;

    @Test
    void test() {
        // 1. Stub
        when(mockRepo.hasStock(any())).thenReturn(true);
        when(mockPayment.charge(any())).thenReturn(PaymentResult.ok());

        // 2. Execute
        OrderResult result = service.placeOrder(new Order());

        // 3. Assert
        assertEquals(OrderStatus.SUCCESS, result.getStatus());

        // 4. Verify
        verify(mockRepo).save(any());
    }
}
```

`@InjectMocks` automatically injects the mocks annotated with `@Mock` into the object annotated with `@InjectMocks` — through the constructor, a setter, or field injection.

## Summary

The core problem Mockito solves is: **freeing unit tests from external dependencies**.

| Without Mockito | With Mockito |
|-------------|-----------|
| Tests must connect to a database, slow | Runs in memory, millisecond-level |
| Tests must reach the network, unstable | No network dependency at all |
| Exception scenarios are hard to construct | `thenThrow()` handles it in one line |
| Test results are unpredictable | Stubbing controls everything |

But it isn't a cure-all — Mockito is for isolation at the unit test layer; if an integration test needs a database, it should still connect to one. Only by recognizing its boundaries can you put it to good use.

Starting with the next post we'll turn to another topic: with all these tests written, how much code do you actually cover? JaCoCo will give you the answer.

A small step forward every day is a new height!
