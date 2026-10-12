---
title: 'Git Branching Models (Part 4): Trunk-Based Development'
date: 2023-06-18
author: Tang Moying
categories: [code]
tags: [Git, TBD, Branching Models, Trunk-Based Development]
lang: en
alt_url: /post/trunk-based-development
---

## 1. A More Radical Philosophy

The three models introduced earlier all allow feature branches to exist for some length of time. But one camp argues: the longer a branch exists, the greater the risk of merge conflicts and the slower the integration feedback.

This is the core claim of **Trunk-Based Development (TBD)**: **all developers commit directly to a single trunk branch (the trunk, i.e. `main`), or use extremely short-lived branches (no longer than a day).**

TBD is nothing new; large tech companies such as Google and Facebook use this model. Google has tens of thousands of engineers working on the same code repository, and it uses trunk-based development.

## 2. Core Principles

### Small Commits, Frequent Integration

TBD requires developers to split their work into sufficiently small changes and merge to the trunk at least once a day. If a change is too large, use a **Feature Flag** to control the visibility of unfinished functionality.

```
main: ●─●─●─●─●─●─●─●─●─●─●─●─●  (everyone commits directly or merges short branches)
      │  │  │  │
      └──┘  └──┘  (short branches, merged within hours to a day)
```

### Short-Lived Branches

If you really do need a branch, its lifecycle should be very short — usually no more than a day:

```bash
# Branch off from main
git checkout -b small-change main

# Make a few changes, commit within a few hours
git add .
git commit -m "Small incremental change"

# Sync the latest code from main
git pull --rebase origin main

# Merge back into main as soon as possible
git checkout main
git merge small-change
git push origin main
```

The key difference: in traditional models a feature branch may live for days or even weeks. In TBD, a branch should be merged back into the trunk before the day is out.

## 3. Feature Flag

What if the feature isn't finished yet and can't be exposed to users directly? The answer is a **Feature Flag**:

```javascript
// Control whether the new feature is visible via configuration
if (featureFlags.newDashboard) {
  renderNewDashboard()
} else {
  renderOldDashboard()
}
```

A Feature Flag lets you:
- **Merge unfinished feature code into the trunk** without affecting users
- **Canary release**: open it to 1% of users first, then ramp up gradually
- **Fast rollback**: when something goes wrong, just turn the switch off — no need to roll back code
- **A/B testing**: run the old and the new logic side by side and compare the results

Common ways to manage feature flags:

- Configuration files (good for simple cases)
- A database or Redis (good for dynamic control)
- A dedicated feature flag service (such as LaunchDarkly, Unleash)

## 4. Keeping the Trunk Healthy

If everyone commits to the trunk, how do you make sure the trunk doesn't break?

### Automated Tests Are the Baseline

Every commit must pass the full automated test suite. TBD without tests is a disaster.

```yaml
# CI configuration example
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run lint
      - run: npm run test -- --coverage
      - run: npm run build
```

### Verification Before Committing

Before merging to the trunk, you usually need:

- **To run the full test suite locally**, making sure you don't introduce a regression
- **Code review**: even a small change should be reviewed by someone
- **CI checks**: the automated pipeline must be all green

### Emergency Fix Procedure

What if the trunk breaks?

1. **Stop new merges immediately** and prioritize fixing the trunk
2. Find the commit that introduced the problem, and roll back or fix it
3. Once the trunk is fixed, other developers rebase onto the latest code and continue

Google's approach is: whoever breaks the trunk is responsible for fixing it. If it can't be fixed quickly, roll it back outright.

## 5. Relationship to Continuous Integration / Continuous Deployment

TBD and CI/CD are mutually reinforcing:

- **CI (continuous integration)**: TBD demands frequent integration, and CI ensures every integration passes automated verification.
- **CD (continuous deployment)**: the trunk is always deployable, and every commit can trigger an automated deployment.

```
Commit code → CI check → code review → merge to main → auto-deploy to production
   ↑_______________________________________________|
                    整个过程自动化
```

In fact, TBD is a precondition for achieving true continuous integration. If a feature branch exists for weeks before it merges, that can only be called "periodic integration," not continuous integration.

## 6. Where It Fits

TBD suits the following situations:

- **Large teams, a single code repository**: fewer merge conflicts, code keeps flowing
- **Mature CI/CD infrastructure**: well-built automated test and deployment pipelines
- **Microservice architecture**: each service deploys independently, which makes branch management simpler
- **A relentless pursuit of delivery speed**: high-frequency releases and fast user feedback

TBD is less suitable for:

- Teams without automated tests (the trunk breaks very easily)
- Client software that needs strict version control (such as SDKs and apps)
- Open-source projects (outside contributors can't commit directly to the trunk)

## 7. The Four Models Side by Side

| Dimension | Git Flow | GitHub Flow | GitLab Flow | TBD |
|------|----------|-------------|-------------|-----|
| Number of branches | Many | Few | Medium (as needed) | Very few |
| Branch lifetime | Days to weeks | Hours to days | Hours to days | Hours |
| Release cadence | Fixed cycle | Continuous deployment | Either | Continuous deployment |
| Multi-version support | ✅ | ❌ | ✅ | ❌ (via flags) |
| Learning cost | High | Low | Medium | Medium |
| CI/CD requirements | Medium | High | High | Extremely high |
| Typical users | Client software | Web apps, open source | GitLab users | Google, Facebook |

## 8. Summary

Each of the four branching models has its own emphasis; none is absolutely better than another:

- **Git Flow**: suits traditional software delivery; the rules are clear but the process is heavy.
- **GitHub Flow**: suits web apps and continuous deployment; simple and direct.
- **GitLab Flow**: strikes a balance between simplicity and flexibility, extending as needed.
- **Trunk-Based Development**: the most radical continuous integration, demanding the strongest engineering discipline.

When you choose a branching model, the key is to look at your project's characteristics and your team's capabilities: what's the release cadence? Do you need to maintain multiple versions? Is the CI/CD infrastructure mature? How large is the team?

There is no silver bullet, only the best fit.

A small step forward every day is a new height!
