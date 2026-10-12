---
title: 'Cloud-Native Deployment (Part 8): K8s Storage — Volume, PV, PVC and StorageClass'
date: 2024-06-23
author: Tang Moying
categories: [deploy]
tags: [Kubernetes, K8s Storage, PV, PVC, StorageClass, Volume, Persistent Storage]
lang: en
alt_url: /post/cloud-native-deploy-08-k8s-storage
---

Containers are disposable — use them and throw them away — but data is not. If you run MySQL directly inside a container, the data is gone the moment the container is deleted, which obviously won't do. How does K8s manage storage? What's the relationship between PV, PVC and StorageClass? This article explains all of these concepts at once.

<!--以上为摘要内容-->

## 1. The Fundamental Problem with Container Storage

A container's filesystem is ephemeral. Remember the layering principle from Part 2? A container has a read/write layer, but that read/write layer is bound to the container's lifecycle — delete the container and the read/write layer is gone.

```
┌──────────────────┐
│ Container R/W    │  ← delete the container and this content is gone!
├──────────────────┤
│ App Layer        │
├──────────────────┤
│ Base Layer       │
└──────────────────┘
```

So where do you put the data? The answer is to **detach the data from the container's lifecycle and let it exist independently.** That's the job of the Volume.

## 2. Volume — "Mounting" Data into the Container

A K8s Volume mounts external storage into a Pod's containers, so that the containers can access external data as if they were accessing a local directory.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
spec:
  containers:
  - name: myapp
    image: myapp:v1
    volumeMounts:
    - name: app-data       # Which volume to mount
      mountPath: /data     # Which path inside the container to mount it at
  volumes:
  - name: app-data
    hostPath:              # The type of volume
      path: /mnt/data      # The path on the host machine
```

This example uses `hostPath` to mount the host machine's `/mnt/data` directory at `/data` inside the container. If the Pod is deleted, the data is still there on the host machine.

### Common Volume Types

K8s supports many kinds of Volume; here are the most commonly used ones:

| Volume Type | Purpose | Data Lifecycle |
|-------------|------|-------------|
| `emptyDir` | Temporary data within a Pod, shared between containers | Cleared when the Pod is deleted |
| `hostPath` | Mounts a host machine directory | Persistent, but bound to the Node |
| `configMap` | Mounts a configuration file | Follows the ConfigMap |
| `secret` | Mounts sensitive data (passwords, certificates) | Follows the Secret |
| `nfs` | Mounts NFS shared storage | Independent of Pods and Nodes |
| `persistentVolumeClaim` | Dynamically or statically requests a persistent volume | Independent of the Pod |

`hostPath` is fine for single-node development and testing, but not for production — your Pod may be scheduled onto any Node, and you can't assume a given Node has the data you need.

## 3. PersistentVolume (PV) — Cluster-Level Storage

A Volume is Pod-level; it's defined in each Pod's YAML. If every developer had to spell out the storage details (NFS address, cloud disk ID and so on) in YAML, that would couple the application to the infrastructure.

K8s's solution is to **separate the provisioning of storage from the consumption of storage**.

**A PersistentVolume (PV) is a piece of storage that an administrator prepares in advance**, as if the administrator had plugged a "storage USB stick" into the cluster:

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-nfs-10g
spec:
  capacity:
    storage: 10Gi            # Storage capacity
  accessModes:
    - ReadWriteOnce          # Access mode
  persistentVolumeReclaimPolicy: Retain
  nfs:                       # Storage backend
    server: 192.168.1.100
    path: /nfs/data
```

Explanation of the key fields:

- **capacity.storage**: the size of this PV.
- **accessModes**: the access mode (see the table below).
- **persistentVolumeReclaimPolicy**: what happens to the PV after the PVC is deleted (Retain keeps it, Delete removes it, Recycle wipes it and reuses it).
- **Storage backend**: can be NFS, AWS EBS, GCE PD, Ceph, GlusterFS, a local disk and so on.

### Access Modes

| Mode | Abbreviation | Meaning |
|------|------|------|
| ReadWriteOnce | RWO | Read/write on a single node (most common) |
| ReadOnlyMany | ROX | Read-only on multiple nodes |
| ReadWriteMany | RWX | Read/write on multiple nodes (requires a distributed filesystem) |

Most applications only need RWO. You need RWX only when, for example, several Pods have to write to the same shared filesystem at the same time.

## 4. PersistentVolumeClaim (PVC) — The Consumer Side

With PVs (the provisioning side) in place, application developers don't need to care about the low-level details of storage; they just declare the storage they want — "how big, and what access mode." That's the **PersistentVolumeClaim (PVC)**:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: myapp-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
```

After a PVC is created, K8s automatically finds a PV that satisfies the conditions and binds to it. The binding logic is:

- The PV's capacity ≥ the PVC's request.
- The PV's access modes include the modes the PVC asks for.
- The PV's storage class (StorageClass) matches the PVC (if one was specified).

Once bound, the PV belongs exclusively to that PVC; no other PVC can bind to it.

### Using a PVC in a Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mysql-pod
spec:
  containers:
  - name: mysql
    image: mysql:5.7
    env:
    - name: MYSQL_ROOT_PASSWORD
      value: "root123"
    volumeMounts:
    - name: mysql-data
      mountPath: /var/lib/mysql      # MySQL data directory
  volumes:
  - name: mysql-data
    persistentVolumeClaim:
      claimName: myapp-pvc           # Reference the PVC
```

No matter which Node the Pod is scheduled onto, MySQL's data is persisted in the PV. Rebuild the Pod and remount the same PVC, and the data is intact.

### The Lifecycle of a PV and a PVC

```
Admin creates PV → developer creates PVC → K8s binds automatically
                                      ↓
                                  Pod 使用 PVC
                                      ↓
                                  Pod 删除（数据还在）
                                      ↓
                                  PVC 删除
                                      ↓
                        根据 ReclaimPolicy 处理 PV
                     （Retain: PV 保留 / Delete: PV 删除）
```

## 5. StorageClass — Dynamic Storage Provisioning

Creating PVs by hand is a real pain. Every application would need the administrator to pre-create a PV — size it too big and you waste space, too small and there isn't enough. **StorageClass gives you dynamic PV creation** — when a developer creates a PVC, K8s automatically creates a PV on demand.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs    # Storage provisioner
parameters:
  type: gp3                           # SSD type
  fsType: ext4
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer  # Delayed binding
```

With a StorageClass, the PVC only needs to specify `storageClassName`:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: dynamic-pvc
spec:
  storageClassName: fast-ssd     # Reference the StorageClass
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
```

When K8s sees this PVC:
1. It finds the StorageClass that `storageClassName` refers to.
2. It calls the `provisioner` (AWS EBS, for example) to create a 20Gi SSD cloud disk.
3. It automatically creates a PV and binds it to this PVC.
4. When the Pod mounts this PVC, the cloud disk is automatically attached to the corresponding Node.

**All of it is fully automatic, with no manual intervention from an administrator.**

### Choosing `volumeBindingMode`

| Mode | Meaning |
|------|------|
| `Immediate` (default) | As soon as the PVC is created, the PV is created and bound immediately |
| `WaitForFirstConsumer` | The PV is created only when a Pod actually needs to use the PVC |

`WaitForFirstConsumer` is the more recommended option — because it creates the PV only after the Scheduler has chosen a Node, it avoids cases where the storage the Pod needs isn't supported by the target Node. For example, AWS EBS is AZ-scoped: if you create the PV in `us-east-1a` ahead of time but the Pod gets scheduled to `us-east-1b`, it can't mount.

## 6. A Real Example: Deploying a Persistent MySQL in K8s

Here's a production-ready MySQL Deployment + PVC example:

```yaml
# pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
spec:
  storageClassName: fast-ssd
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
---
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
spec:
  replicas: 1                    # Note: MySQL is usually a single replica; don't scale it with a Deployment
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:5.7
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:        # Don't hard-code the password; read it from a Secret
              name: mysql-secret
              key: root-password
        ports:
        - containerPort: 3306
        volumeMounts:
        - name: mysql-data
          mountPath: /var/lib/mysql
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
      volumes:
      - name: mysql-data
        persistentVolumeClaim:
          claimName: mysql-pvc
---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  selector:
    app: mysql
  ports:
  - port: 3306
    targetPort: 3306
```

Key points:
- MySQL usually uses `replicas: 1`; multiple replicas require an extra clustering solution (such as Galera Cluster).
- The password is injected via a Secret instead of being written into the YAML.
- The data directory mounts a PVC, so rebuilding the Pod doesn't lose data.

## Summary

The core logic of K8s storage is the **decoupling of provisioning and consumption**: administrators provision storage through PV/StorageClass, and developers consume storage through PVC. StorageClass's dynamic provisioning makes this process fully automatic, achieving truly declarative management.

The data won't be lost anymore, but a running application still has to stay healthy. In the next article, we move on to the last piece of production deployment — health checks and zero-downtime deployment.

A small step forward every day is a new height!
