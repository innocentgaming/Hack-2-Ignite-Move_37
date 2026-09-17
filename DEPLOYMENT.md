# InternOS Production Deployment Guide

This guide documents the production deployment architecture, step-by-step instructions for **Vercel** (Frontend) and **Render / Railway** (Backend & Database), environment configurations, and CI/CD verification.

---

## 1. Architecture Overview

```
                 USERS
                   │
                   ▼
          ┌─────────────────┐
          │   FRONTEND      │
          │ React + Vite    │ (Vercel SPA)
          └────────┬────────┘
                   │ HTTPS / REST API / JWT
                   ▼
          ┌─────────────────┐
          │    BACKEND      │
          │ Node + Express  │ (Render / Railway / Docker)
          └────────┬────────┘
                   │
          ┌────────┴─────────┐
          │                  │
          ▼                  ▼
   PostgreSQL 16        Object Storage
   (Render / Neon)      (Local / S3 / R2)
```

---

## 2. Fast Track: Cloud Deployment (Vercel + Render)

### A. Deploy Backend & Database on Render (Infrastructure-as-Code)

InternOS includes a pre-configured `render.yaml` blueprint:

1. Push your repository to GitHub: `https://github.com/innocentgaming/Hack-2-Ignite-team_37`
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Blueprint**.
3. Connect your GitHub repository.
4. Render automatically parses `render.yaml` and provisions:
   - **`internos-db`**: Managed PostgreSQL 16 database.
   - **`internos-api`**: Node.js web service running `@internos/api`.
   - Automatic database connection string injection (`DATABASE_URL`).
   - Auto-generated `JWT_SECRET`.
5. Click **Apply**. Render will run:
   - `npm install && npm run prisma:generate && npm run build:api`
   - `npx prisma migrate deploy`
   - `node apps/api/dist/index.js`
6. Note your Render backend URL (e.g., `https://internos-api.onrender.com`).

---

### B. Deploy Frontend on Vercel

InternOS includes root and subfolder `vercel.json` configurations for Single Page Application (SPA) routing:

1. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New...** → **Project**.
2. Import the GitHub repository `Hack-2-Ignite-team_37`.
3. Configure Project Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (or `apps/web`)
   - **Build Command**: `npm run build:web`
   - **Output Directory**: `apps/web/dist`
4. Add Environment Variable:
   - `VITE_API_URL`: `https://internos-api.onrender.com` (Your Render backend URL from Step A)
5. Click **Deploy**. Vercel will build and deploy the React SPA.
6. Copy your Vercel URL (e.g., `https://internos.vercel.app`).
7. Update `FRONTEND_URL` in your Render service environment variables to your Vercel URL so that CORS allows authentication cookies and cross-origin requests.

---

## 3. Alternative: Deploy Backend on Railway

InternOS includes `railway.json` and `Procfile`:

1. Go to [Railway](https://railway.app/) and create a **New Project**.
2. Provision a **PostgreSQL** database service.
3. Add a service from your GitHub repository.
4. Set the following environment variables on the API service:
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
   - `NODE_ENV`: `production`
   - `PORT`: `4000`
   - `JWT_SECRET`: (Generate a random 32+ character string)
   - `FRONTEND_URL`: Your Vercel frontend URL
   - `STORAGE_DRIVER`: `local`
5. Railway uses Nixpacks to build and run the release migration and start commands defined in `railway.json`.

---

## 4. Container Deployment (Docker & Docker Compose)

For self-hosted Linux VPS, AWS ECS, or GCP Cloud Run:

```bash
# Build and run production containers in background
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f api

# Verify health check
curl http://localhost:4000/api/v1/health
```

---

## 5. Continuous Integration / Continuous Deployment (CI/CD)

The repository includes a GitHub Actions workflow at `.github/workflows/ci-cd.yml` which triggers on pushes and PRs to `main`:

- **Validate Job**: Runs `npm run prisma:generate` and `npm run typecheck` across all workspaces.
- **Test Job**: Executes 278 automated API tests covering authentication, tenant isolation, student/mentor workflows, state machines, and CSV export.
- **Build Job**: Builds both `@internos/api` and `@internos/web` production bundles.

---

## 6. Environment Variables Reference

### Backend (`apps/api`)

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | Target runtime environment | `production` |
| `PORT` | Yes | HTTP listening port | `4000` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/internos` |
| `JWT_SECRET` | Yes | Cryptographic secret for tokens | Min 32 random characters |
| `JWT_EXPIRES_IN` | No | JWT validity duration | `7d` |
| `FRONTEND_URL` | Yes | Allowed frontend origin for CORS | `https://internos.vercel.app` |
| `DEFAULT_ORGANIZATION_CODE` | No | Default tenant code | `apex-inst` |
| `STORAGE_DRIVER` | No | Document storage backend | `local` |

### Frontend (`apps/web`)

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Yes | Backend API origin | `https://internos-api.onrender.com` |

---

## 7. Verification Smoke Tests

After deployment, verify the following endpoints:

1. **API Health Check**:
   ```bash
   curl https://your-api-url.onrender.com/api/v1/health
   # Response: {"success":true,"service":"internos-api","status":"healthy"}
   ```
2. **Frontend SPA**:
   - Open your Vercel URL in a browser.
   - Click "Enter Demo Environment" or log in with administrator / student credentials.
   - Verify that all navigation routes and workflows load without errors.
