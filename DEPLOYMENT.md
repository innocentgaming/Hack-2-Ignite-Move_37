# InternOS Production Deployment Guide (Phase 14)

This guide documents the production deployment architecture, environment configurations, and validation steps for **InternOS**. The architecture is decoupled and provider-independent.

---

## 1. Architecture Topology

```
                 USERS
                   │
                   ▼
          ┌─────────────────┐
          │   FRONTEND      │
          │ React + Vite    │ (Vercel / Cloudflare Pages / Netlify)
          └────────┬────────┘
                   │ HTTPS / REST API / JWT
                   ▼
          ┌─────────────────┐
          │    BACKEND      │
          │ Node + Express  │ (Render / Railway / Fly.io / AWS ECS)
          └────────┬────────┘
                   │
          ┌────────┴─────────┐
          │                  │
          ▼                  ▼
   PostgreSQL            Object Storage
   Managed DB            Documents/PPTs/Files
 (Neon/Supabase/AWS RDS) (AWS S3 / Cloudflare R2 / MinIO)
          │
          │
          ▼
       AI API
  (OpenAI / Anthropic / Gemini)
```

---

## 2. Component Provisioning

| Component | Recommended Providers | Role in InternOS |
| :--- | :--- | :--- |
| **Frontend** | Vercel, Netlify, Cloudflare Pages | Hosts React 18 + Vite SPA bundle |
| **Backend** | Render, Railway, Fly.io, AWS App Runner | Hosts Node.js + Express API container |
| **Database** | Neon, Supabase, Railway PostgreSQL, AWS RDS | Managed PostgreSQL 16 relational database |
| **Object Storage** | AWS S3, Cloudflare R2, MinIO, Wasabi | S3-compatible private document & evidence storage |
| **AI Layer** | OpenAI, Anthropic, Google Gemini | Asynchronous advisory evidence-matching pipeline |

---

## 3. Environment Variables Specification (Phase 14A)

### Backend Environment Variables (`apps/api`)

| Variable | Description | Example / Production Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Target environment runtime | `production` |
| `PORT` | HTTP port for Express | `4000` (or injected by hosting platform) |
| `API_URL` | Public canonical backend URL | `https://api.yourdomain.com` |
| `FRONTEND_URL` | Trusted frontend domain for CORS | `https://app.yourdomain.com` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://db_user:password@ep-host.neon.tech:5432/internos?sslmode=require` |
| `JWT_SECRET` | Cryptographically secure secret (min 32 chars) | `openssl rand -base64 48` generated secret |
| `JWT_EXPIRES_IN` | Token validity period | `7d` |
| `DEFAULT_ORGANIZATION_CODE` | Default tenant organization code | `apex-inst` |
| `STORAGE_DRIVER` | File storage driver (`local`, `s3`, `gcs`) | `s3` |
| `STORAGE_ENDPOINT` | S3-compatible service endpoint | `https://s3.us-east-1.amazonaws.com` |
| `STORAGE_BUCKET` | Dedicated object storage bucket name | `internos-production-documents` |
| `STORAGE_REGION` | Storage bucket region | `us-east-1` |
| `STORAGE_ACCESS_KEY` | Storage IAM Access Key ID | Set in hosting dashboard |
| `STORAGE_SECRET_KEY` | Storage IAM Secret Access Key | Set in hosting dashboard |
| `STORAGE_MAX_FILE_SIZE_MB` | Maximum single file upload limit | `25` |
| `LLM_PROVIDER` | AI service provider | `openai` |
| `LLM_API_KEY` | Secret API key for AI provider | Set in hosting dashboard |
| `LLM_MODEL` | Target language model | `gpt-4o` |

> [!CAUTION]
> **Zero Secrets in Git**: Never commit real database passwords, `JWT_SECRET`, `LLM_API_KEY`, or S3 keys into Git. Use your cloud platform's secret manager.

### Frontend Environment Variables (`apps/web`)

| Variable | Description | Example / Production Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Canonical backend API URL | `https://api.yourdomain.com` |

---

## 4. Database Deployment & Migration (Phase 14B)

1. Provision a PostgreSQL 16 database on your chosen provider (Neon, Supabase, Railway, etc.).
2. Acquire the connection string with SSL enabled:
   ```bash
   DATABASE_URL="postgresql://user:password@host:5432/internos?sslmode=require"
   ```
3. Run Prisma validation and deploy migrations:
   ```bash
   # Validate schema
   npm run prisma:validate

   # Generate Prisma Client
   npm run prisma:generate

   # Apply production migrations (never uses development seed data)
   npm run prisma:migrate
   ```

---

## 5. Backend Deployment (Phase 14C)

Configure your hosting provider (Render, Railway, Fly.io) with the following build and start commands:

- **Build Command**:
  ```bash
  npm install && npm run prisma:generate && npm run build:api
  ```
- **Pre-deploy / Release Command**:
  ```bash
  npm run prisma:migrate
  ```
- **Start Command**:
  ```bash
  npm run start
  ```

### Health Check Endpoint
Verify that the service is running and healthy:
- **Request**: `GET https://api.yourdomain.com/api/v1/health`
- **Expected Response**:
  ```json
  {
    "success": true,
    "service": "internos-api",
    "status": "healthy"
  }
  ```

---

## 6. Frontend Deployment (Phase 14D)

Deploy the Single Page Application to Vercel, Netlify, or Cloudflare Pages:

- **Root Directory**: `.` (or set package to `apps/web`)
- **Build Command**:
  ```bash
  npm run build:web
  ```
- **Output Directory**: `apps/web/dist`
- **Environment Variables**:
  - `VITE_API_URL`: `https://api.yourdomain.com`

---

## 7. Strict CORS Hardening (Phase 14E)

In production (`NODE_ENV=production`), the backend rejects wildcards (`*`) and unknown origins. Only the explicitly defined `FRONTEND_URL` is allowed:

```typescript
const allowedOrigins =
  env.NODE_ENV === 'production'
    ? [env.FRONTEND_URL]
    : [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];
```

Requests from unauthorized origins fail immediately with:
```
CORS policy violation: Origin <origin> not permitted.
```

---

## 8. Production Smoke Test Sequence (Phase 14F)

Once deployed, perform this smoke test sequence across the user roles:

1. **Access SPA**: Navigate to `https://app.yourdomain.com`.
2. **Admin Authentication**: Sign in with administrative credentials.
3. **Configure Workflow**: Define a new multi-milestone workflow template.
4. **Onboard Student**: Invite or import student and verify activation link.
5. **Student Authentication**: Student sets password and logs in.
6. **Internship Registration**: Student submits company details and expected outcomes (`DRAFT` → `PENDING_APPROVAL`).
7. **HOD Approval & Assignment**: HOD approves registration and assigns faculty coordinator and industry mentor (`ACTIVE`).
8. **Deliverable Submission**: Student uploads Milestone 1 progress deliverable with evidence documents.
9. **Mentor Review**: Mentor reviews deliverable, provides feedback, and scores rubric.
10. **AI Analysis**: Asynchronous AI pipeline parses activities, technologies, and outcomes advisory.
11. **Faculty Monitoring**: Faculty checks cohort health timeline (`ON_TRACK`).
12. **Final Evaluation**: Mentor submits 100-point rubric evaluation.
13. **Completion**: Faculty verifies prerequisites and confirms academic completion.
14. **Cross-Tenant Test**: Verify that cross-tenant access returns HTTP 403 Forbidden.
