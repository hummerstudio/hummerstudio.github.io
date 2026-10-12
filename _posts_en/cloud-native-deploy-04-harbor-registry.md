---
title: 'Cloud-Native Deployment (Part 4): Container Image Registry — Docker Hub and a Self-Hosted Harbor Registry'
date: 2024-06-09
author: Tang Moying
categories: [deploy]
tags: [Docker, Harbor, Image Registry, Registry, Private Registry, Container Images]
lang: en
alt_url: /post/cloud-native-deploy-04-harbor-registry
---

The image has been built — now where do you put it? Push it straight to Docker Hub? If you do DevOps at a company, the answer is almost certainly no. Company code, and especially images containing business logic, can't simply be put on the public internet. You need a private image registry. And that's exactly where Harbor comes in.

<!--以上为摘要内容-->

## 1. Why Can't You Just Use Docker Hub?

Docker Hub is Docker's official public image registry, similar to GitHub. You can find almost every official image there, along with countless community images, and free users can upload their own images too.

But in an enterprise environment, using Docker Hub directly has several hard drawbacks:

- **Security**: internal company images contain business code and configuration; pushing them to the public internet is unacceptable.
- **Network**: Docker Hub's servers are overseas, so pulling images from within the country is painfully slow. When dozens of nodes all pull a several-hundred-megabyte image at the same time, ops will be waiting until they cry.
- **Management**: once there are many teams, anyone can push images, versions proliferate, and there's no unified scanning or policy — an incident is only a matter of time.
- **Compliance**: many industries (finance, government) require that data never leave the intranet, and image registries are no exception.

So any team doing DevOps in earnest needs a **private image registry**.

## 2. Docker Registry — the Most Basic Self-Hosted Option

Docker officially provides the most lightweight image registry implementation, called simply Registry. Deploying it is extremely simple:

```bash
docker run -d -p 5000:5000 --name registry registry:2
```

And then it's ready to use:

```bash
docker tag myapp:latest localhost:5000/myapp:latest
docker push localhost:5000/myapp:latest
docker pull localhost:5000/myapp:latest
```

But frankly, Registry's features are too rudimentary:

- There's no web interface — want to see which images you have? You can't.
- There's no access control — anyone can push and anyone can pull.
- There's no image scanning — you have no idea whether your images have vulnerabilities.
- There's no garbage collection — deleted images may still be taking up disk space.
- There's no image replication — syncing images between multiple data centers is up to you.

So Registry is suitable for local development and testing; it's essentially not used in production.

## 3. Harbor — an Enterprise-Grade Image Registry

Harbor is VMware's open-source enterprise-grade image registry, later donated to the CNCF. It extends Docker Registry, filling in everything enterprises were missing around security, management, and high availability.

### Harbor's Core Capabilities

| Capability | Description |
|------|------|
| **Web management UI** | Graphically manage projects, images, and member permissions |
| **Project-based RBAC** | Assign different read/write permissions to different projects |
| **Image vulnerability scanning** | Integrates Trivy/Clair to automatically scan images for CVE vulnerabilities |
| **Image signing** | Integrates Notary to digitally sign images and prevent tampering |
| **Image replication** | Sync images across data centers, supporting both push and pull modes |
| **Garbage collection** | Actually deletes layers that are no longer referenced, freeing disk space |
| **Image policies** | Automatically clean up old images by rule, for example "keep the 10 most recent versions" |
| **Helm Chart hosting** | Harbor can store not only images but also Helm Charts |
| **OIDC/LDAP integration** | Connects to the authentication system the enterprise already has |

### Harbor's Architecture

Harbor isn't a simple monolithic application; it's made up of several components:

```
Browser/CLI → Nginx (reverse proxy) → Harbor Core (main service)
                                    ├── Registry (image storage)
                                    ├── Database（PostgreSQL）
                                    ├── Redis (cache)
                                    ├── Trivy (vulnerability scanning)
                                    └── Job Service (background jobs)
```

- **Nginx**: a reverse proxy in front, handling HTTPS and request routing.
- **Harbor Core**: the main business logic, handling API requests, permission checks, and so on.
- **Registry**: underneath it's still Docker's official Registry component, responsible for the actual image storage.
- **PostgreSQL**: stores Harbor's own metadata (projects, users, policies, and so on).
- **Trivy**: the vulnerability scanning engine; Harbor has used Trivy by default since version 2.x.
- **Job Service**: an asynchronous job queue that handles time-consuming background tasks such as image scanning and replication.

### Deploying Harbor

Harbor offers two deployment methods: an online installer package and an offline installer package. In China, the offline installer package is recommended.

```bash
# 1. Download the offline installer package
wget https://github.com/goharbor/harbor/releases/download/v2.11.0/harbor-offline-installer-v2.11.0.tgz
tar xzf harbor-offline-installer-v2.11.0.tgz
cd harbor

# 2. Configure harbor.yml
cp harbor.yml.tmpl harbor.yml
vim harbor.yml
```

Key configuration in `harbor.yml`:

```yaml
hostname: harbor.yourcompany.com   # the domain or IP you access it by
http:
  port: 80                         # HTTP port

# If you want to use HTTPS (mandatory in production):
# https:
#   port: 443
#   certificate: /your/cert/path
#   private_key: /your/key/path

harbor_admin_password: Harbor12345 # initial admin password (remember to change it)

database:
  password: root123
  max_idle_conns: 50
  max_open_conns: 1000

data_volume: /data                 # data storage path
```

Once configured, install it with a single command:

```bash
# install (including the Trivy scanner)
sudo ./install.sh --with-trivy
```

After installation, visit `http://harbor.yourcompany.com` and log in with the `admin` account, and you'll see Harbor's management UI.

### Day-to-Day Usage

**Create a project**: in the Harbor web UI, create a project (such as `backend`) and set it to "private".

**Push an image**:

```bash
# log in to Harbor
docker login harbor.yourcompany.com

# tag it
docker tag myapp:v1.0 harbor.yourcompany.com/backend/myapp:v1.0

# push it
docker push harbor.yourcompany.com/backend/myapp:v1.0
```

**Use it in a CI pipeline**:

```groovy
// Jenkins Pipeline
stage('Push Image') {
    steps {
        sh '''
            docker login harbor.yourcompany.com -u ${HARBOR_USER} -p ${HARBOR_PASS}
            docker build -t harbor.yourcompany.com/backend/myapp:${BUILD_NUMBER} .
            docker push harbor.yourcompany.com/backend/myapp:${BUILD_NUMBER}
        '''
    }
}
```

## 4. Image Naming and Tag Strategy

Once you have a registry, how images are named and tagged becomes something you need to standardize.

### Image Naming Convention

Recommended format: `<registry>/<project>/<service>:<tag>`

```
harbor.yourcompany.com/backend/user-service:v1.2.3
harbor.yourcompany.com/backend/order-service:v1.2.3
harbor.yourcompany.com/backend/gateway:v1.2.3
```

### Tag Strategy

Don't use only `latest`. `latest` is fine for local development, but in team collaboration and production it's a time bomb — you never know which version of the code `latest` actually corresponds to.

Recommended tag strategy:

| Tag | Meaning | Example |
|-----|------|------|
| Version number (core) | Maps exactly to a Git tag | `v1.2.3` |
| Build number | The number assigned to each CI trigger | `build-1287` |
| Branch name | Corresponds to the Git branch | `develop`, `feature-xxx` |
| Environment | Distinguishes deployment environments | `prod-20200627` |

A mature CI pipeline usually applies several tags in a single build:

```bash
docker build -t harbor.yourcompany.com/backend/myapp:${VERSION} .
docker tag harbor.yourcompany.com/backend/myapp:${VERSION} harbor.yourcompany.com/backend/myapp:build-${BUILD_NUMBER}
docker tag harbor.yourcompany.com/backend/myapp:${VERSION} harbor.yourcompany.com/backend/myapp:latest
```

### Image Cleanup Strategy

Images pile up. One image per build, and a large project might produce hundreds in a single day, so the disk is bound to fill up sooner or later. Harbor provides automatic cleanup policies:

- **Keep the most recent N tags**: for example, keep only the 10 most recent versions of each image.
- **Clean up by age**: delete images built N days ago that aren't in use.
- **Clean up by tag rule**: delete all old tags beginning with `build-*`.

Just configure "Tag Retention Rules" in the Harbor project settings.

## 5. A Few Things to Watch Out For with Harbor in Production

### Always Configure HTTPS

Making do with HTTP in development is tolerable, but production must use HTTPS. Docker requires registries to use HTTPS by default (except for `localhost`), otherwise every push and pull needs an extra `insecure-registries` configuration.

### Back Up the Database

Harbor's core metadata lives in PostgreSQL. If the database is lost, the image files may still be there, but all projects, users, permissions, and policies are gone, which basically means you can't recover. Be sure to back up PostgreSQL on a regular schedule.

### Monitor Disk Space

Image layers can be shared, but with many people and many projects, disk consumption adds up fast. Recommendations:

- Set up image cleanup policies.
- Run garbage collection regularly: Harbor's "delete" operation only marks images; actually removing them requires manually triggering GC.
- Monitor disk usage and expand capacity ahead of time.

## Summary

A private image registry is DevOps infrastructure: just as code has a Git repository, images should have a home of their own. Harbor is currently the most mature open-source choice, and its vulnerability scanning, permission management, and image replication cover the core needs of enterprise scenarios.

In the next post, we move into the heart of cloud-native deployment — the architecture of Kubernetes — and see how this "king of container orchestration" actually works.

A small step forward every day is a new height!
