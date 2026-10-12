---
title: 'Cloud-Native Deployment (Part 9): K8s Package Management — Helm from Getting Started to Real-World Practice'
date: 2024-06-29
author: Tang Moying
categories: [deploy]
tags: [Kubernetes, Helm, Package Management, Chart, Template-Based Deployment, K8s Deployment]
lang: en
alt_url: /post/cloud-native-deploy-09-helm
---

If you deploy even a slightly complex application (say a microservice + MySQL + Redis + Nginx), you'll end up with so many YAML files you start doubting the meaning of life. And the configuration differs from environment to environment (development, testing, production) — surely you're not going to maintain three sets of YAML? Helm exists precisely to solve this pain — it's called "the apt/yum of K8s".

<!--以上为摘要内容-->

## 1. What Problem Does Helm Solve?

Let's start with an everyday scenario, one without Helm.

You want to deploy an application, and you need to write:
- A Deployment YAML (the application itself)
- A Service YAML (to expose ports)
- A ConfigMap YAML (configuration)
- A PVC YAML (storage)
- Possibly Ingress, Secret, HPA as well……

One set for development, one for testing, one for production. Across three environments that's a dozen-plus YAML files alone. And the difference between environments may come down to just a few values (image tag, replica count, database address) — yet because YAML is static, you have no choice but to maintain several near-identical sets of files.

**Helm does one thing: it turns YAML into templates.** You write a single template (a Chart), inject different parameters through different `values.yaml` files, and generate the final YAML that fits each environment.

To understand it, draw an analogy with Linux:

| Linux | Kubernetes |
|-------|-----------|
| Software package (deb/rpm) | Helm Chart |
| apt/yum | Helm CLI |
| Software source (/etc/apt/sources.list) | Helm Repository |
| Configuration file (/etc/nginx/nginx.conf) | values.yaml |

## 2. Helm 2 vs Helm 3 — A Massive Architectural Change

If you search the web for material on Helm, be careful to distinguish the versions — the architecture changed a great deal between Helm 2 and Helm 3.

### The Helm 2 Architecture (Now Obsolete)

In Helm 2 there was a component called **Tiller**, which lived permanently inside the K8s cluster:

```
helm CLI → Tiller（在 K8s 集群内）→ API Server
```

Tiller was responsible for receiving `helm` commands and managing the installation, upgrade and rollback of Releases. But it had one fatal problem: **Tiller held cluster-administrator-level privileges**. That meant anyone able to call Tiller was able to do anything at all to the cluster. The security problem was extremely serious.

### The Helm 3 Architecture (Now Recommended)

Helm 3 removed Tiller entirely:

```
helm CLI → API Server
```

The `helm` command line communicates with the API Server directly, and its privileges depend entirely on the kubeconfig configured locally by whoever runs it. However much `kubectl` privilege you have, that's exactly how much `helm` has. Secure and simple.

In addition, Helm 3 deprecated Helm 2's `requirements.yaml`, switching to declaring dependencies directly inside the Chart. For more detail you can consult the official migration guide.

## 3. Charts — Helm's Application Packages

Helm's package is called a **Chart**; it is a group of files with a fixed directory structure.

### Chart Directory Structure

```
myapp/
├── Chart.yaml            # Chart metadata
├── values.yaml           # default configuration values
├── charts/               # dependent sub-Charts
├── templates/            # template files (the very core)
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── _helpers.tpl      # template helper functions
│   └── NOTES.txt         # message shown after installation
└── .helmignore
```

**`Chart.yaml`** — the Chart's "identity card":

```yaml
apiVersion: v2                  # Helm 3 uses v2
name: myapp                     # Chart name
version: 1.0.0                  # Chart version
appVersion: "2.1.0"             # application version
description: My Application Chart
type: application
```

**`values.yaml`** — the default configuration values, supplying the defaults for the template variables:

```yaml
replicaCount: 3

image:
  repository: harbor.yourcompany.com/backend/myapp
  tag: "2.1.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80
  targetPort: 8080

resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"

env:
  DB_HOST: mysql-service
  DB_PORT: "3306"
```

**`templates/`** — the template files, which use Go template syntax (`{{ }}`) to reference values from `values.yaml`.

### How Does a Chart Work?

The Helm workflow reduces to:

```
Chart (template)+ values.yaml (data) → render → standard K8s YAML → submit to API Server
```

You don't write the YAML for Pod/Service/Deployment directly; you write their **templates**. When you run `helm install`, Helm combines the templates with the values, renders the final YAML, and submits it to K8s.

## 4. Building a Chart from Scratch

Suppose we have a Java application, `myapp`, that needs a Deployment + Service + ConfigMap.

### Step 1: Create the Chart Skeleton

```bash
helm create myapp
```

This generates a set of default files; we delete the ones we don't need (the defaults are Nginx templates) and keep the core structure.

### Step 2: Write the Deployment Template

`templates/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    app: {{ include "myapp.name" . }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ include "myapp.name" . }}
  template:
    metadata:
      labels:
        app: {{ include "myapp.name" . }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - containerPort: {{ .Values.service.targetPort }}
        env:
        {{- range .Values.env }}
        - name: {{ .name }}
          value: {{ .value | quote }}
        {{- end }}
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
```

### Step 3: Write the Service Template

`templates/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "myapp.fullname" . }}
spec:
  type: {{ .Values.service.type }}
  selector:
    app: {{ include "myapp.name" . }}
  ports:
  - port: {{ .Values.service.port }}
    targetPort: {{ .Values.service.targetPort }}
```

### Step 4: Write the ConfigMap Template

`templates/configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "myapp.fullname" . }}-config
data:
  application.properties: |
    server.port={{ .Values.service.targetPort }}
    spring.datasource.url=jdbc:mysql://{{ .Values.env.DB_HOST }}:{{ .Values.env.DB_PORT }}/mydb
```

### Step 5: Validate and Install

```bash
# validate the rendered result (without actually installing)
helm install --dry-run --debug myapp ./myapp

# actually install
helm install myapp ./myapp

# see what got installed
helm list
kubectl get all -l app=myapp
```

### Multi-Environment Deployment

The same Chart adapts to different environments through different `values` files:

```bash
# development environment
helm install myapp-dev ./myapp -f values-dev.yaml

# production environment
helm install myapp-prod ./myapp -f values-prod.yaml
```

`values-dev.yaml` and `values-prod.yaml` only need to override the parts that differ from the defaults:

```yaml
# values-prod.yaml
replicaCount: 10
image:
  tag: "2.1.0"
resources:
  requests:
    memory: "1Gi"
    cpu: "1000m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

## 5. Common Helm Operations

```bash
# list installed Releases
helm list

# view Release details
helm status myapp
helm get values myapp       # view the values used at install time
helm get manifest myapp     # view the full rendered YAML

# upgrade
helm upgrade myapp ./myapp -f values-prod.yaml

# rollback
helm rollback myapp 1       # roll back to revision 1

# view history
helm history myapp

# delete
helm uninstall myapp

# add a remote repository (Bitnami is currently the most widely used public Helm repository)
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# search for Charts in a repository
helm search repo nginx

# you can also search for and discover more Charts on Artifact Hub (artifacthub.io)
```

### Template Syntax Quick Reference

Go template syntax is a little counter-intuitive; here are the most commonly used pieces:

| Syntax | Purpose | Example |
|------|------|------|
| `{{ .Values.xxx }}` | Reference a value from values | `{{ .Values.image.tag }}` |
| `{{ .Release.Name }}` | Reference the Release name | `{{ .Release.Name }}` |
| `{{ include "tpl" . }}` | Call a template defined in `_helpers.tpl` | `{{ include "myapp.fullname" . }}` |
| `{{ .Values.xxx \| quote }}` | Pipe + add quotes | `version: {{ .Values.tag \| quote }}` |
| `{{- toYaml .Values.xxx \| nindent 8 }}` | Convert to YAML + indent | Used for complex objects |
| `{{ default "8080" .Values.port }}` | Default value | Use 8080 if the port isn't configured |
| `{{ if .Values.enabled }}...{{ end }}` | Conditional rendering | Decide by a switch whether to generate a section |

## 6. Combining Helm with CI/CD

In a Jenkins Pipeline, Helm makes deployment extremely concise:

```groovy
stage('Deploy to K8s') {
    steps {
        sh '''
            helm upgrade --install myapp ./helm/myapp \
                --namespace production \
                --set image.tag=${BUILD_NUMBER} \
                --wait \
                --timeout 5m
        '''
    }
}
```

`--wait` waits until every Pod is ready before returning. `--timeout` stops it hanging forever.

## Summary

Helm's core value is turning K8s's YAML from "static files" into "templatable packages". It makes deployment as simple as `apt install`, and frees multi-environment management from maintaining a pile of duplicated YAML.

Write the Chart, configure the values, type one Helm command — deployment done. Next time, in the final article of this series, we'll talk about the two most critical concepts in production deployment: health checks and rolling updates, so that deployment achieves genuinely zero downtime.

A small step forward every day is a new height!
