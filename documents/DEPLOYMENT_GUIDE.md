# 🚀 VePhim Deployment & Infrastructure Guide

## Overview

VePhim is a monorepo containing multiple applications (API, main frontend, admin dashboard, mobile, and supporting infrastructure) that are all containerized for easy deployment. This guide covers deploying the entire stack using Docker Compose, Vercel, and Expo, and explains the deployment diagram conventions used for modern, containerized, and cloud-native systems.

---

## 1. Prerequisites

- **Docker** and **Docker Compose** installed on your server or local machine.
- Clone the repository and ensure you have access to the `.env` files for each service.

---

## 2. Environment Configuration

1. Copy example environment files and edit as needed:
   ```powershell
   cp .env.example .env
   cp apps/api/.env.example apps/api/.env
   cp apps/fe/.env.example apps/fe/.env
   cp apps/mnt/.env.example apps/mnt/.env
   # Edit each .env file with your production values
   ```

---

## 3. Infrastructure Services

Start core infrastructure (MongoDB, Redis, Elasticsearch):

```powershell
docker compose -f docker-compose.infra.yml up -d
```

- **MongoDB**: NoSQL database
- **Redis**: Caching and session store
- **Elasticsearch**: Search engine

---

## 4. Application Services

### API (NestJS)
- **CI/CD:** Every commit to `main` triggers GitHub Actions to build and push a new Docker image.
- **Deployment:** Pull the new image and restart the container to deploy the latest API.
- **Run:**
  ```powershell
  docker compose up -d
  # or for backend bundle
  docker compose -f docker-compose.bundle.yml up -d
  ```
- **Custom build:**
  ```powershell
  docker build -f apps/api/Dockerfile -t vephim-api .
  docker run -p 8000:8000 vephim-api
  ```

### Frontend (fe) & Admin (mnt)
- **Framework:** Next.js
- **Deployment:** Deployed to Vercel (cloud platform for Next.js apps).
- **CI/CD:** Vercel automatically builds and deploys on push to the main branch.

### Mobile
- **Build:** APK is built via GitHub Actions and Expo cloud.
- **Deployment:** Distributed via Expo or as APK download.

### Supporting Services
- **MongoDB, Redis, Elasticsearch:** Deployed as Docker containers, typically managed via Docker Compose.
- **Load Balancer, SSL Gateway:** Also as Docker containers (Nginx, SWAG).

---

## 5. Stopping and Removing Containers

```powershell
docker compose down
# Or for a specific file:
docker compose -f docker-compose.infra.yml down
```

---

## 6. Updating Services

To update images and restart:

```powershell
docker compose pull
docker compose up -d --force-recreate
```

---

## 7. Troubleshooting

- Check logs: `docker compose logs <service>`
- Check container status: `docker ps -a`
- Remove unused images: `docker system prune`

---

# 🗂️ Deployment Diagram: Best Practices & Application

## What is a Deployment Diagram?
A deployment diagram is a UML diagram that models the physical deployment of artifacts (executables, containers, databases, etc.) on nodes (servers, VMs, containers, cloud services). It visualizes the infrastructure, showing where and how software components are deployed and how they communicate.

**Key elements:**
- **Nodes:** Physical or virtual resources (servers, VMs, Docker containers, cloud services, mobile devices).
- **Execution Environments:** Specialized nodes (e.g., Docker, JVM, OS, cloud platform).
- **Artifacts:** Deployable units (Docker images, binaries, config files, databases).
- **Deployment Specifications:** Configuration files or parameters (e.g., Dockerfile, YAML, .env).
- **Communication Paths:** Network connections (HTTP, HTTPS, database protocols).

**Best practices:**
- Use `<<device>>` for physical machines, `<<executionEnvironment>>` for Docker containers/cloud platforms, and `artifact` for images/binaries.
- Show CI/CD automation if relevant (e.g., GitHub Actions building/pushing Docker images).
- For cloud-native apps, show cloud services (Vercel, Expo) as nodes or execution environments.
- Keep the diagram focused on deployment/infrastructure, not on data flow or business logic.
- Use standard UML notation for clarity and maintainability.
- Update the diagram as the deployment architecture evolves.

**References:**
- [Microsoft Engineering Playbook: Deployment Diagrams](https://microsoft.github.io/code-with-engineering-playbook/design/diagram-types/deployment-diagrams/)
- [Lucidchart: UML Deployment Diagram Tutorial](https://www.lucidchart.com/pages/uml-deployment-diagram)
- [Medium: UML Deployment Diagram in Modern World](https://medium.com/@kachmarani/uml-deployment-diagram-in-modern-word-caee0a2ecaa3)
- [Stack Overflow: UML DeploymentDiagram for Docker](https://stackoverflow.com/questions/74543991/uml-deploymentdiagram-for-docker)

---

# 📊 VePhim Deployment Diagram

See `vephim_infrastructure.puml` in the `/documents` folder for a PlantUML diagram of the deployment architecture, following these conventions.

---

**This guide ensures you can deploy the entire VePhim stack using Docker Compose, Vercel, and Expo, with a clear, standards-based deployment diagram for reference.**

---

## 📚 References

- See the `README.md` for more details on project structure and technology stack.
- For advanced deployment (e.g., with PM2, Elasticsearch, or custom bundles), review the `docker-compose.*.yml` files and Dockerfiles in the `containers/` directory.
