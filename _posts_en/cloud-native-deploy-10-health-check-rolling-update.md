---
title: 'Cloud-Native Deployment (Part 10): Health Checks and Zero-Downtime Deployment'
date: 2024-06-30
author: Tang Moying
categories: [deploy]
tags: [Kubernetes, Health Checks, Rolling Updates, Zero Downtime, Liveness, Readiness, Probe]
lang: en
alt_url: /post/cloud-native-deploy-10-health-check-rolling-update
---

An application is up and running in a container, but "the process is running" and "the service is available" are two different things. The process may be stuck in an infinite loop, it may be unable to reach the database, or it may have been starting up for a long time without ever finishing loading. The health check mechanism in K8s exists precisely to tell these states apart. Combined with a rolling update strategy, it lets us do zero-downtime releases that users never notice — and this article, the finale of the cloud native deployment series, ties together everything we have learned and brings it down to production practice.

<!--以上为摘要内容-->

## 1. A Live Process ≠ a Healthy Service

By default, K8s decides whether a container is healthy by checking whether the container’s main process is alive — if the process is running, K8s assumes the container is fine.

But that judgment is too coarse. Look at a few common scenarios:

**Scenario one: a deadlock.** The process is still running, but all its threads are waiting on one another and it answers no requests from the outside. K8s cannot tell; the process is still there.

**Scenario two: a slow start.** A Java application needs 60 seconds to load its context. Before startup has finished, the Service has already routed traffic to it, and requests come back 502.

**Scenario three: an unavailable dependency.** The application is up, but it cannot connect to the database. The process is running, but the business function is not available.

All of these scenarios call for a health check more precise than "is the process running" — which is where the **Probe** comes in.

## 2. Three Kinds of Probes: Liveness, Readiness, Startup

K8s provides three kinds of probes, each with a different purpose:

| Probe | Question | When the check fails | Typical use |
|------|------|-----------|---------|
| **Liveness** | Is the container "dead"? | Restart the container | Detecting deadlocks and out-of-memory |
| **Readiness** | Is the container ready to receive traffic? | Remove it from the Service’s backends | Checking whether dependencies are ready and startup is complete |
| **Startup** | Has startup finished? | Restart the container | Protecting slow-starting applications |

### Liveness Probe — "Is the Heart Still Beating?"

Liveness checks whether the container is **alive**. If the check fails, K8s kills the container and starts it again.

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30    # wait 30 seconds after the container starts before checking
  periodSeconds: 10           # check every 10 seconds
  timeoutSeconds: 5           # timeout of 5 seconds
  failureThreshold: 3         # 3 consecutive failures before it is judged unhealthy
```

What this configuration means: 30 seconds after the container starts, an HTTP GET request is sent to `/health` every 10 seconds. If three requests in a row return a non-200 status or time out, K8s considers the container "dead" and kills it for a restart.

**Note**: do not configure Liveness too aggressively. If your application is occasionally slow (a GC pause, say), a small `initialDelaySeconds` and a small `failureThreshold` can get the container killed by mistake.

### Readiness Probe — "Ready to Take Customers?"

Readiness checks whether the container **can receive traffic**. If the check fails, K8s removes the Pod from the Service’s backend list and stops sending traffic to it. Once it succeeds again, the Pod is added back.

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 3
```

The core difference between Readiness and Liveness:

| | Liveness | Readiness |
|---|----------|-----------|
| Consequence of failure | The container is killed and restarted | The Pod is removed from the Service |
| How it recovers | Only by restarting the container | Recovers automatically once the probe succeeds again |
| Scope of impact | Only the current Pod | The distribution of traffic from the Service |
| What it is for | Solving a "process that only looks alive" | Solving "taking traffic before it is ready" |

**The key insight**: if an application takes 60 seconds to start and the Readiness probe first passes at second 30, then for the first 30 seconds this Pod receives no external requests — the Service does not send traffic to it. This solves the "slow startup causes 502" problem perfectly.

### Startup Probe — Protecting Applications That Hate Waking Up

If your application starts very slowly (two minutes, say), `initialDelaySeconds` can only set a fixed delay, and it is hard to get the number right. Set it too small and Liveness declares failure and restarts the container before startup has finished; set it too large and failure detection gets slower.

**The Startup Probe was introduced precisely to solve this pain point**. Stable since K8s 1.18, it has become standard in production environments, and it is strongly recommended for applications with slow startup (Java/Spring Boot, for example).

```yaml
startupProbe:
  httpGet:
    path: /health
    port: 8080
  failureThreshold: 30        # up to 30 failures allowed
  periodSeconds: 10           # check every 10 seconds
```

What this configuration means: **the container has as long as 300 seconds (30 × 10 seconds) to finish starting up**. During that period:

- If the Startup Probe has not yet succeeded, Liveness and Readiness checks are not triggered.
- Once the Startup Probe has succeeded a single time, it no longer runs. Liveness and Readiness take over after that.

```yaml
# A complete example: the three probes used together
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  periodSeconds: 5
  failureThreshold: 3

startupProbe:
  httpGet:
    path: /health
    port: 8080
  failureThreshold: 30
  periodSeconds: 10
```

### How Probes Are Implemented

All three kinds of probes support the following check methods:

| Method | Usage | Where it fits |
|------|------|---------|
| `httpGet` | An HTTP GET request | Web services, REST APIs |
| `tcpSocket` | A TCP port probe | Databases, caches |
| `exec` | Run a command in the container | Custom check logic |

An example of `exec`:

```yaml
livenessProbe:
  exec:
    command:
    - cat
    - /tmp/healthy
  initialDelaySeconds: 5
  periodSeconds: 5
```

The application signals that it is healthy by writing a marker file, `/tmp/healthy`. If the file does not exist, something is wrong and K8s restarts the container.

### Common Pitfalls

**Pitfall 1: Liveness configured too aggressively.** `initialDelaySeconds: 5` plus `failureThreshold: 1` — if the application has a single GC pause longer than 5 seconds, it gets killed. In production, set `failureThreshold` to at least 3.

**Pitfall 2: the Readiness probe checks an external dependency.** Say the Readiness probe goes and checks the database connection — when the database goes down, every Pod’s Readiness turns unhealthy and all of them are removed. But once they are removed there is nothing left, and the service is completely unavailable. Readiness should only check the state of its own container; problems with external dependencies belong to circuit breaking and degradation mechanisms, not to pulling Pods out of the rotation.

**Pitfall 3: no Startup Probe configured.** For a slow-starting application, Liveness times out during startup, the container is restarted over and over, and it never comes up. If you see `CrashLoopBackOff`, check whether this is the cause.

## 3. Rolling Updates — the Key to Zero Downtime

Health checks solve the question of whether a single Pod is available; rolling updates solve the question of how to update without interrupting the service.

### How Rolling Updates Work

When you update the image version of a Deployment, K8s does not wipe out all the old Pods at once and then create new ones (that would interrupt the service). It **replaces them gradually**:

```
Step 0: [Old] [Old] [Old]         3 个旧 Pod 在运行
Step 1: [Old] [Old] [Old] [New]   创建一个新 Pod
Step 2: [Old] [Old]         [New] 新 Pod Ready 后，删一个旧 Pod
Step 3: [Old]         [New] [New] 再创建一个新 Pod
Step 4: [Old] [New]    [New] [New] 新 Pod Ready 后，再删一个旧 Pod
Step 5: [New] [New]    [New]       全部替换完成
```

Traffic never stops during the process — the old Pod still finishes the requests it is handling before it is deleted, and the new Pod only starts receiving requests after it is Ready.

### Controlling the Speed of a Rolling Update

`Deployment.spec.strategy` has two key parameters:

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1       # how many Pods may be unavailable at most
      maxSurge: 1             # how many Pods beyond the desired replica count are allowed
```

Take a replica count of 3 as an example:

| maxUnavailable | maxSurge | Minimum available | Maximum running | Effect |
|----------------|----------|----------|----------|------|
| 1 | 1 | 2 | 4 | Shut down one old Pod and start one new one at each step (**recommended**) |
| 0 | 1 | 3 | 4 | Start the new one first, then shut down the old one. More conservative, zero risk |
| 1 | 0 | 2 | 3 | Shut down the old one first, then start the new one. Slightly more aggressive |

If your application must never be one Pod short (because the load is running right at capacity, say), choose `maxUnavailable: 0`. When you have resources and time to spare, this is usually the safest choice.

### Rolling Updates Working Together with Readiness

Rolling updates depend on the Readiness probe. The flow is:

1. A new Pod is created, in state `Running` (the process has started).
2. The Readiness probe checks the `/ready` endpoint.
3. Once the Readiness probe succeeds, the Pod is added to the Service’s backends.
4. The old Pod begins a graceful shutdown (it receives SIGTERM).
5. The old Pod exits after finishing the requests already in flight.
6. Repeat until every Pod has been updated.

**If Readiness is not configured**, K8s considers the container Ready the moment it starts and routes traffic over at once, while the application may still be loading configuration or connecting to the database — and the requests that arrive then produce errors such as 502s and connection refused.

### Verifying Zero Downtime

You can watch and control a rolling update with the `kubectl rollout` commands:

```bash
# Trigger the update
kubectl set image deployment/myapp myapp=harbor.yourcompany.com/backend/myapp:v2.0

# Watch the update process
kubectl rollout status deployment/myapp

# Watch the Pods change
kubectl get pods -w

# Pause the update (when you spot a problem)
kubectl rollout pause deployment/myapp

# Resume the update
kubectl rollout resume deployment/myapp

# Roll back
kubectl rollout undo deployment/myapp
```

At the same time you can keep requesting the service from another terminal with `while true; do curl -s http://service/health; sleep 1; done` to verify whether any requests are dropped during the whole update.

## 4. A Complete Production-Grade Deployment Example

Pulling together everything we have learned in this series, here is a complete Deployment configuration that is ready for production:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0       # never allow a shortage of replicas
      maxSurge: 1
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      terminationGracePeriodSeconds: 30   # time allowed for a graceful exit
      containers:
      - name: myapp
        image: harbor.yourcompany.com/backend/myapp:v2.0
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "production"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        startupProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          failureThreshold: 30
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          periodSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          periodSeconds: 5
          failureThreshold: 3
```

## 5. Series Recap

With this, all 10 posts of the cloud native deployment series are complete. Let us look back at the road we have travelled:

| Post | Topic | Key takeaway |
|----|------|---------|
| 1 | The history of deployment evolution | Knowing where cloud native came from and what problem it solved |
| 2 | Docker fundamentals | Understanding how images are layered and how containers run |
| 3 | Dockerfile best practices | Writing images that are both small and secure |
| 4 | The Harbor image registry | Building an enterprise-grade private registry, managing the image life cycle |
| 5 | K8s architecture core | Understanding what each Master/Node/etcd component is responsible for |
| 6 | Pod/Deployment/Service/ConfigMap/Secret | Mastering the core API objects you use every day in K8s |
| 7 | K8s networking | Getting CNI, kube-proxy and DNS service discovery straight |
| 8 | K8s storage | Persisting data with PV/PVC/StorageClass |
| 9 | Helm package management | Templated deployment, one Chart for many environments |
| 10 | Health checks and zero downtime | Configuring Probes and rolling updates, shipping safely |

From one application on a single physical machine to zero-downtime rolling updates on a K8s cluster — we have walked that road step by step. Cloud native deployment is not something you get right in one go; these 10 posts cover the core path, and I hope they are of help to you.

## Summary

Health checks are K8s’s "immune system" and rolling updates are its "painless scalpel". Liveness detects deadlocks, Readiness controls traffic, Startup protects slow starts — use the three probes together with `maxUnavailable` and `maxSurge` and your deployments will truly be invisible to users.

A small step forward every day is a new height!
