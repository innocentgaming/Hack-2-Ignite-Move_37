# InternOS Local Development Guide (Phase 0)

## 1. Prerequisites

- **Node.js**: `v20.x` or higher (tested on Node v24)
- **npm**: `v10.x` or higher (tested on npm 11)
- **Docker & Docker Compose** (optional for containerized PostgreSQL) or local PostgreSQL instance

---

## 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Verify the key configurations in `.env`:
```ini
PORT=4000
API_URL=http://localhost:4000
FRONTEND_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/internos?schema=public"
JWT_SECRET="internos_super_secret_jwt_key_phase0_development_only_min_32_chars"
```

---

## 3. Database Setup with Docker

If you have Docker installed, spin up the local PostgreSQL database:

```bash
docker compose up -d
```

Verify PostgreSQL is running:
```bash
docker compose ps
```

---

## 4. Prisma Commands

Run Prisma commands directly from the monorepo root:

```bash
# Validate Prisma schema
npm run prisma:validate

# Generate Prisma Client
npm run prisma:generate

# Deploy database migrations
npm run prisma:migrate

# Seed demo dataset
npm run prisma:seed

# Open Prisma Studio web dashboard
npm run prisma:studio
```

---

## 5. Development Workflows

### Run Both Services Concurrently
```bash
npm run dev
```

### Run Services Individually
```bash
# Start API server (port 4000)
npm run dev:api

# Start Web frontend (port 5173)
npm run dev:web
```

---

## 6. Testing & Quality Verification

```bash
# Run TypeScript compilation check across monorepo
npm run typecheck

# Run ESLint across monorepo
npm run lint

# Build all packages and applications for production
npm run build
```

---

## 7. Health Check Verification

Test the API health endpoint:

```bash
curl -i http://localhost:4000/api/v1/health
```

Expected output:
```json
{
  "success": true,
  "service": "internos-api",
  "status": "healthy"
}
```

---

## 8. Demo Credentials

| Role | Email | Password |
|---|---|---|
| Institution Admin | `admin@apex.edu` | `Password123!` |
| Faculty Supervisor | `dr.sharma@apex.edu` | `Password123!` |
| Industry Mentor | `raj.patel@acmecloud.com` | `Password123!` |
| Student | `alex.student@apex.edu` | `Password123!` |
| Super Admin | `superadmin@internos.local` | `Password123!` |
