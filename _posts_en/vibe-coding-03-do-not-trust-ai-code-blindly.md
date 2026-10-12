---
title: 'Vibe Coding (Part 3): AI-Generated Code — Doubt First, Trust Later'
date: 2026-01-17
author: Tang Moying
categories: [ai]
tags: [AI, Vibe Coding, AI Programming, Code Review]
lang: en
alt_url: /post/vibe-coding-03-AI写的代码不能盲信
---


## 1. A Driver Who Gets You There Smoothly Is Not a Driver You Can Rely On

Imagine you're sitting in a taxi. The driver is fast and steady, and you spend the whole ride looking at your phone, paying no attention to the road. You reach your destination, you get out, the driver drives off.

Then you realize: where is this? This isn't where I wanted to go.

When you got in, you said "take me to People's Park," but you didn't make clear which district's People's Park. The driver's navigation headed for the nearest one — but not the one you had in mind. However well the car was driven, the direction was wrong.

**AI-written code is like that driver.** The syntax is perfect, the formatting is neat, the logic looks smooth. But it may have quietly drifted off course somewhere you weren't watching.

## 2. AI's Three Big "Bad Habits"

Based on the real-world experience of a great many developers, AI-written code has three high-frequency problems. Know them, and your reviews will aim straight at the target.

### Bad Habit One: Hallucination — Using APIs That Don't Exist

This is the most common problem. AI will "invent" a function or library that looks perfectly plausible but doesn't exist in reality.

```python
# Code written by AI
from datetime import parse_date_string  # This function doesn't exist at all!

result = parse_date_string("2026-01-15")
```

Why doesn't it write the correct `datetime.strptime("2026-01-15", "%Y-%m-%d")`? Because in AI's training data, the phrase "parse_date_string" appeared in similar contexts, so it figures "this combination ought to work."

**Remember**: AI is making probabilistic predictions, not looking things up in the documentation. That it "thinks" an API ought to exist doesn't mean it does.

### Bad Habit Two: It Only Walks Half the Path

AI can write good code for the "happy path," but it often drops the ball on the exception paths.

```javascript
// Code written by AI — the happy path is fine
async function fetchUserData(userId) {
  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();
  return data;
}
```

Looks clean, right? But think carefully:

- What if the network is down? (`fetch` throws, and that isn't handled)
- What if it returns a 404? (`response.json()` will try to parse the error page, and it's guaranteed to fail)
- What if what comes back isn't JSON?
- What if `userId` is `undefined`?

When AI wrote this code, its "attention" was focused on the main path of "how to fetch the data and return it." As for the forks off that main path, it didn't think them through.

**You have to do that thinking for it.**

### Bad Habit Three: Security Blind Spots — Trusting Everyone by Default

When AI writes security-related code, it easily assumes "all input is valid."

```python
# A query written by AI
def get_user_by_name(name):
    query = f"SELECT * FROM users WHERE name = '{name}'"
    return database.execute(query)
```

The textbook case of SQL injection. Of course AI "knows" parameterized queries are better, but when it's generating code quickly, it may "forget."

This isn't a lapse on AI's part — it's that in its training data, simple example code vastly outnumbers production-grade secure code. Its probabilistic model tends toward producing the "most common" way of writing something, and the most common way often isn't secure enough.

## 3. You Don't Need to Be a Security Expert, But You Need a "Radar"

You don't need to memorize the OWASP Top 10, and you don't need a security certification. You just need to build a few simple review habits:

**Every time you look at AI-written code, ask yourself three questions**:

1. **Has every external input been validated?** — User input, API parameters, file contents… all of these should be checked before they're used.
2. **Are the error cases all handled?** — The network is down, the file doesn't exist, the data format is wrong… for each possible failure, is there corresponding handling?
3. **Is the external library being called the right way?** — For an API call you're not familiar with, spending 10 seconds checking the docs is far more worthwhile than spending 10 minutes debugging.

These three questions look simple, but if you insist on asking yourself each one every time, they will catch the vast majority of the problems AI produces.

## 4. Writing Tests: Vibe Coding's Airbag

If you've written 100 lines of code with Vibe Coding, spend 5 minutes writing a few tests — the peace of mind you get back far exceeds the cost of those 5 minutes.

The good news is: **you can have AI write the tests for you, too.** And testing is a field AI is especially good at — clear inputs and outputs, simple logic, fixed patterns.

```text
"帮我为刚才写的 fetchUserData 函数写测试，覆盖几种情况：
1. Returns user data normally
2. API returns 404
3. Network request fails
用 jest，放在 __tests__/user.test.js 里。"
```

A few minutes later you have a set of tests. Run them: fix the red ones, keep the green ones. This workflow is an order of magnitude faster than manual testing, and the quality is better too.

**The golden rule of Vibe Coding**: AI writes the code, AI writes the tests, you read the code, you run the tests. Humans and AI each play their part.

## 5. "It Looks Like It Runs" ≠ The Code Is Fine

Finally, a mindset issue.

AI-generated code often looks beautiful at first glance — tidy indentation, well-behaved variable naming, clear comments. This creates the **illusion of "it looks professional, so it should be fine."**

That illusion is dangerous.

A real example: someone used AI to write a file upload feature. The code was beautiful, and the feature ran. A month after launch they discovered: anyone could upload a file of any size, and the server was nearly bursting at the seams. AI hadn't automatically added a file size limit — because in simple example code, nobody writes one.

**The prettier the code, the easier it is to let your guard down.** Remember: AI-generated code, like your own first draft, needs to be reviewed, tested, and questioned.

---

The next article is the last in the series. We'll talk about **how to make AI truly understand your project — the art of context management**.

A small step forward every day is a new height!
