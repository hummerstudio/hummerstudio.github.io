---
title: 'Cloud-Native Deployment (Part 6): K8s Core Concepts — Pod, Deployment, Service, ConfigMap and Secret'
date: 2024-06-16
author: Tang Moying
categories: [deploy]
tags: [Kubernetes, Pod, Deployment, Service, ConfigMap, Secret, K8s Core Concepts, YAML]
lang: en
alt_url: /post/cloud-native-deploy-06-k8s-core-concepts
---

Now that you understand K8s's architecture, it's time to get to know the most core API objects in K8s: Pod, Deployment and Service, plus ConfigMap and Secret, which manage configuration and secrets. These five are the concepts you'll use most often in your day-to-day dealings with K8s; once you've got them clear, you've officially got your foot in the K8s door.

<!--以上为摘要内容-->

## 1. Pod — the Smallest Scheduling Unit in K8s

If you ask someone who has just learned Docker, "what's the basic unit of a container in K8s?", their most likely answer is "a container". But that answer is wrong.

**A Pod is the smallest unit of creation and management in K8s; a Pod can contain one or more containers.**

### Why Do Pods Exist? Why Not Just Schedule Containers Directly?

This is the key question for understanding K8s's design. Docker can already run containers — why does K8s wrap another layer, the Pod, on top of containers?

The answer lies in this: **some containers are born as "conjoined twins" that need to share resources and work in close coordination.**

For example: a web application container needs a log collection agent to push logs to Elasticsearch. The two containers need to share a filesystem (the web container writes logs, the agent reads them) and share the network namespace (communicating over localhost). If they were independent containers, that sharing would be very hard to achieve.

The Pod solves this problem: all containers within the same Pod share:

- **Network namespace**: they share IP and port space, and containers talk to each other over `localhost`.
- **Storage volume (Volume)**: files can be shared between containers.
- **Lifecycle**: they live and die together, scheduled onto the same Node.

This pattern is called the **Sidecar pattern**, and the log collection agent is the web container's sidecar — they share the Pod's "body" and collaborate to accomplish one task.

### The YAML Definition of a Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
  labels:
    app: myapp
    version: v1
spec:
  containers:
  - name: myapp
    image: harbor.yourcompany.com/backend/myapp:v1.0
    ports:
    - containerPort: 8080
    resources:
      requests:
        memory: "256Mi"
        cpu: "250m"
      limits:
        memory: "512Mi"
        cpu: "500m"
```

Let me explain line by line:

- `apiVersion`: the API version. K8s APIs are grouped, and Pod belongs to the `v1` core group.
- `kind`: the resource type, here `Pod`.
- `metadata.name`: the Pod's name, which must be unique within the same Namespace.
- `metadata.labels`: labels — one of K8s's most powerful organisational mechanisms (covered later).
- `spec.containers`: the list of containers. A Pod can have multiple containers.
- `resources.requests`: the baseline resources the container requests; the Scheduler uses this to pick a Node.
- `resources.limits`: the resource ceiling for the container. Exceeding the limit gets CPU throttled and memory OOM Killed.

Key point: **`requests` determines scheduling, `limits` determines the runtime cap.** If memory `requests` is 256Mi but `limits` is 512Mi, K8s finds an adequate Node based on 256Mi, but at runtime the container is allowed to use up to 512Mi.

### Common Pod States

| State | Meaning |
|------|------|
| `Pending` | The Pod has been created but the containers haven't started yet (it may be pulling images or waiting to be scheduled) |
| `Running` | The Pod is bound to a Node and at least one container is running |
| `Succeeded` | All containers exited normally (`exit code 0`) |
| `Failed` | At least one container exited abnormally |
| `CrashLoopBackOff` | The container repeatedly crashes and restarts |

`CrashLoopBackOff` is the state beginners run into most — the container starts, then crashes, K8s restarts it, it crashes again, restarts again, and the interval between restarts keeps growing. When you see this state, it means the container's start command has a problem or the image itself won't run at all.

## 2. Deployment — the Pod's Housekeeper

Creating Pods directly is rarely used in production — a Pod has no self-healing ability of its own, and if the Node goes down the Pod is gone.

**A Deployment is the Pod's manager**: it ensures that a specified number of Pod replicas are always running. You tell it "I want 3 replicas" and it maintains those 3 for you — create more when there are too few, delete them when there are too many, and rebuild on another Node if one goes down.

### The YAML Definition of a Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-deployment
  labels:
    app: myapp
spec:
  replicas: 3                          # desired number of replicas
  selector:
    matchLabels:
      app: myapp                       # selector: manage Pods with the app=myapp label
  template:                            # Pod template
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: harbor.yourcompany.com/backend/myapp:v1.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

Note that `selector.matchLabels` and `template.metadata.labels` must match. The Deployment uses labels to find "which Pods are mine". If the labels don't match, the Deployment will keep creating new Pods (thinking the old ones don't exist), causing a resource leak.

### Everyday Deployment Operations

```bash
# Create
kubectl apply -f deployment.yaml

# Inspect
kubectl get deployments
kubectl describe deployment myapp-deployment

# Scale up / scale down
kubectl scale deployment myapp-deployment --replicas=5

# Update the image
kubectl set image deployment/myapp-deployment myapp=harbor.yourcompany.com/backend/myapp:v2.0

# Check the rollout status
kubectl rollout status deployment/myapp-deployment

# Roll back
kubectl rollout undo deployment/myapp-deployment
```

### Labels — the Glue of K8s

Labels are an extremely important organisational mechanism in K8s. They're simply key-value pairs stuck onto any K8s object. Objects are then filtered and linked through a **Label Selector**.

For example, one Deployment managing two groups of Pods at different versions:

```yaml
# the Pod's labels
labels:
  app: myapp
  version: v1
  env: staging

# the Selector can pick
selector:
  matchLabels:
    app: myapp
  # or something more complex:
  matchExpressions:
    - {key: version, operator: In, values: [v1, v2]}
```

Labels take K8s's decoupling to the extreme — the Deployment doesn't care what the Pods are named or where they're created, only about "are there 3 Pods with the `app=myapp` label".

## 3. Service — a Stable Access Entry Point

With a Deployment managing the Pods, you'd think everything is taken care of. But a Pod's IP is temporary — the IP changes after the Pod is rebuilt. If other services access the Pod IP directly, they lose contact the moment the Pod is rebuilt.

**A Service is what solves this: it provides a stable access entry point for the group of Pods behind it.**

### Service Modes

A Service has several types; the most common is ClusterIP:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  type: ClusterIP          # only reachable inside the cluster
  selector:
    app: myapp             # select the backend Pods
  ports:
  - port: 80               # the Service's port
    targetPort: 8080       # the backend Pod's port
```

This Service gets a fixed virtual IP (ClusterIP) within the cluster, and any traffic from a Pod to `myapp-service:80` is forwarded by kube-proxy to port 8080 of one of the backend Pods labelled `app=myapp`.

### Comparing the Three Service Types

| Type | Access scope | Use case |
|------|---------|---------|
| **ClusterIP** | Inside the cluster | Service-to-service calls; the default type |
| **NodePort** | `NodeIP:NodePort` | Development and debugging; simple external exposure |
| **LoadBalancer** | External LB → Node | External exposure in production (requires cloud provider support) |

### DNS Service Discovery

K8s has a built-in DNS service (CoreDNS). When a Service is created, a DNS record is automatically registered for it:

```
<service-name>.<namespace>.svc.cluster.local
```

So from any container inside the cluster, you can access it directly by the Service name:

```bash
# without needing to know what the ClusterIP is
curl http://myapp-service:80/health
```

This solves the most central problem of service discovery: **you don't need to know where the other party is, only what it's called.**

## 4. ConfigMap and Secret — Configuration and Secret Management

By now you've got hold of K8s's "compute trio": Pod runs the containers, Deployment manages the replicas, Service manages access. But one problem remains unsolved: **how do we manage configuration and secrets?**

Hard-coding sensitive information like database addresses, API keys and certificates into the image? Absolutely not. Not only does it violate the 12-Factor principles (configuration should be separated from code), it also creates a risk of secret leakage.

K8s provides two dedicated API objects to solve this: **ConfigMap** (for ordinary configuration) and **Secret** (for sensitive information).

### 4.1 ConfigMap — Centralised Management of Non-Sensitive Configuration

A ConfigMap stores configuration data in the form of key-value pairs, such as environment variables and configuration file contents.

**Several ways to create a ConfigMap:**

```bash
# Way one: create directly from key-value pairs
kubectl create configmap app-config \
  --from-literal=app.env=production \
  --from-literal=app.log.level=INFO

# Way two: create from a file (the file contents become the value)
kubectl create configmap nginx-config \
  --from-file=nginx.conf=./nginx.conf

# Way three: create in bulk from a directory (each file name becomes a key)
kubectl create configmap app-config-dir \
  --from-file=./config-dir/
```

You can also define it in a YAML file:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  # simple key-value pairs
  app.env: "production"
  app.log.level: "INFO"
  # a multi-line config file (note that | is the YAML syntax that preserves newlines)
  nginx.conf: |
    server {
        listen 80;
        server_name localhost;
        location / {
            root /usr/share/nginx/html;
            index index.html;
        }
    }
```

**Using a ConfigMap in a Pod:**

A ConfigMap's data can be injected into a container in two ways: **environment variables** and **file volume mounts**.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: configmap-demo
spec:
  containers:
  - name: app
    image: myapp:v1
    # Way one: as environment variables
    env:
    - name: APP_ENV
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: app.env
    - name: LOG_LEVEL
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: app.log.level
    # inject all key-value pairs at once (the key names become the environment variable names)
    envFrom:
    - configMapRef:
        name: app-config
    # Way two: mounted as files
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
  volumes:
  - name: config-volume
    configMap:
      name: app-config
```

After mounting, files named after the ConfigMap's keys are created in the `/etc/config/` directory, with the file contents being the corresponding values.

### 4.2 Secret — Secure Management of Sensitive Information

The design purpose of a Secret is similar to a ConfigMap, but it's dedicated to storing sensitive data such as passwords, tokens and certificates. K8s gives Secrets special treatment:

- Secret data is **base64-encoded** when stored in etcd (note: encoded, not encrypted! K8s 1.7+ supports etcd encryption at rest, but it isn't enabled by default)
- Only Pods that need to access the Secret are mounted onto the node by the kubelet
- Inside the container's memory, the Secret exists as tmpfs (an in-memory filesystem) and is never written to the node's disk

**Creating a Secret:**

```bash
# Way one: create from key-value pairs (the value is automatically base64-encoded)
kubectl create secret generic db-secret \
  --from-literal=username=admin \
  --from-literal=password='S3cur3P@ss!'

# Way two: create from files (for example a TLS certificate)
kubectl create secret tls tls-secret \
  --cert=./tls.crt \
  --key=./tls.key

# Way three: create in bulk from files
kubectl create secret generic app-secret \
  --from-file=./secrets/
```

Defining it in YAML (note that the value has to be base64-encoded by hand):

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque          # generic type; could also be kubernetes.io/tls, etc.
data:
  # note: the values here must be base64-encoded
  username: YWRtaW4=          # admin
  password: UDNzc3cwcmQ=      # don't use a weak password in real production :)
stringData:                   # the stringData field is automatically base64-encoded, which is more convenient
  database: myapp-db
```

> **Security note**: `stringData` is a convenience field introduced in K8s 1.14+; you write plaintext and K8s automatically encodes it to base64 before storing it in the `data` field. But either way, what's stored in etcd is base64 encoding (reversible!). In production, be sure to enable etcd encryption at rest and consider using an external secret management system (such as HashiCorp Vault or AWS Secrets Manager).

**Using a Secret in a Pod:**

The way you use it is almost identical to a ConfigMap:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-demo
spec:
  containers:
  - name: app
    image: myapp:v1
    env:
    - name: DB_USERNAME
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: username
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: password
    volumeMounts:
    - name: secret-volume
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: secret-volume
    secret:
      secretName: db-secret
```

### 4.3 Usage Advice and Best Practices

| Scenario | Recommended approach | Reason |
|------|---------|------|
| Small configuration, environment variables | ConfigMap → environment variables | Simple and direct; the application needs no code changes |
| Configuration files (such as nginx.conf) | ConfigMap → file mount | Supports hot reload (requires application support) |
| Database passwords, API keys | Secret → environment variables or file mount | Avoids storing sensitive information in plaintext |
| TLS certificates | Secret (type: kubernetes.io/tls) → file mount | The standard approach for Ingress Controllers |
| Large configuration files (>1MB) | Consider an external configuration centre (such as Consul or Apollo) | ConfigMaps/Secrets have a size limit (1MB) |

### 4.4 Echoing the 12-Factor Principles

Recall the 12-Factor principles mentioned in the first article; Factor III is **Config**:

> Configuration should be stored in environment variables, strictly separated from code.

ConfigMap and Secret are precisely this principle's concrete implementation in K8s. With them you can:

- Use the same image across development, testing and production, injecting different configuration only through different ConfigMaps/Secrets
- Keep sensitive information out of the image and out of the code repository
- Change configuration without rebuilding the image

```yaml
# same image, different environments, different configuration
# development
kubectl apply -f configmap-dev.yaml -f deployment.yaml

# production
kubectl apply -f configmap-prod.yaml -f deployment.yaml
```

---

## 5. Putting the Core Concepts Together: a Complete Example

Below is a complete Nginx deployment example, including a Deployment and a Service:

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.19-alpine
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "200m"
---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
```

Deploy and verify:

```bash
# Create
kubectl apply -f deployment.yaml

# Check the Pod distribution
kubectl get pods -o wide

# Create the Service
kubectl apply -f service.yaml

# Test: access the Service with a temporary Pod
kubectl run test --rm -it --image=busybox -- wget -qO- http://nginx-service
```

You'll see the requests distributed randomly across the 3 Nginx Pods.

## Summary

Pod, Deployment, Service, ConfigMap and Secret are the most core concepts in everyday K8s use: Pod is the wrapper in which containers run, Deployment manages the Pod lifecycle and replica count, Service provides a stable service entry point, and ConfigMap and Secret manage configuration and secrets. Once you understand how these objects relate to and work with one another, the door to K8s is fully open.

With Pods and Services in hand, the question of how they communicate naturally arises. Next time we'll go deep into K8s's network model — CNI, how kube-proxy works, and how communication between Pods is implemented.

A small step forward every day is a new height!
