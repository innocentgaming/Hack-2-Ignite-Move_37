# InternOS — Smart Internship Management System

> **InternOS** is a multi-tenant Smart Internship Management and Monitoring System designed specifically for educational institutions (universities, colleges, polytechnics) to standardize industrial training governance, mentor feedback, outcome-based education (OBE) rubrics, and internship monitoring.

---

## 🏗️ Architecture

InternOS is built as a clean modular monorepo using npm workspaces:

```
internos/
├── apps/
│   ├── api/                 # Express.js REST API with TypeScript, JWT, RBAC & Tenant Isolation
│   └── web/                 # React 18 + Vite + Tailwind CSS with Role-Aware Application Shell
├── packages/
│   ├── prisma/              # PostgreSQL schema (20 models), migrations & seed scripts
│   ├── shared/              # Centralized error classes, response formatters, RBAC matrices
│   └── types/               # Domain models, enums, DTOs, API contracts
└── docs/                    # Architecture and security documentation
```

### Core Architecture Principles:
1. **TypeScript Strict Mode**: Zero implicit `any` across all apps and packages.
2. **Multi-Tenant Server-Side Isolation**: Every tenant-owned record is scoped using `organizationId`. Untrusted client IDs are rejected. Frontend visibility is never treated as a security boundary.
3. **Database Foundation**: 20 relational models in Prisma ORM targeting PostgreSQL.
4. **Standard Envelope**: All API endpoints return `{ success, data, error, meta }`.
5. **Storage Abstraction**: Pluggable storage driver (`LocalStorageService` / S3 / GCS).

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: >= 18.x (tested on v24.19.0)
- **npm**: >= 9.x
- **PostgreSQL**: (or compatible PostgreSQL instance)

### 2. Install Monorepo Dependencies
From the repository root:
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key environment configuration:
| Variable | Description | Default |
|---|---|---|
| `PORT` | API Server Port | `4000` |
| `API_URL` | Base API URL | `http://localhost:4000` |
| `FRONTEND_URL` | Web Frontend URL | `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/internos` |
| `JWT_SECRET` | Secret key for JWT signing | Minimum 32 characters |
| `JWT_EXPIRES_IN` | Token lifespan | `7d` |
| `STORAGE_DRIVER` | Document storage driver | `local` |

---

## 🗄️ Database & Prisma Commands

Navigate to `packages/prisma` or use root shortcuts:

```bash
# Validate Prisma schema
npm run prisma:validate

# Generate Prisma Client
npm run prisma:generate

# Apply migrations
npm run prisma:migrate

# Seed demo dataset
npm run prisma:seed

# Launch Prisma Studio GUI
npm run prisma:studio
```

---

## 🖥️ Development Commands

Run both the API and Web applications concurrently, or individually:

```bash
# Start both API and Web concurrently
npm run dev

# Start backend API only (http://localhost:4000)
npm run dev:api

# Start frontend web app only (http://localhost:5173)
npm run dev:web

# Run TypeScript typechecks across all packages
npm run typecheck

# Build all packages for production
npm run build
```

---

## 📡 API Endpoints (Foundation)

| Method | Path | Description | Access |
|---|---|---|---|
| `GET` | `/api/health` | System health, uptime, memory, version | Public |
| `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT | Public |
| `GET` | `/api/v1/auth/me` | Current authenticated user profile | Authenticated |
| `GET` | `/api/v1/tenants/current` | Current organization details | Authenticated + Isolated |
| `GET` | `/api/v1/tenants/departments` | Active departments in tenant | Authenticated + Isolated |

---

## 👥 Seeded Demo Accounts

All demo accounts use password: `Password123!` with organization code `apex-inst`:

| Role | Demo Email | Purpose |
|---|---|---|
| **Super Admin** | `superadmin@internos.local` | Cross-tenant platform administration |
| **Institution Admin** | `admin@apex.edu` | Academic departments & user registry |
| **Faculty Supervisor** | `dr.sharma@apex.edu` | Student monitoring & rubric evaluation |
| **Industry Mentor** | `raj.patel@acmecloud.com` | Milestone reviews & industry feedback |
| **Student Intern** | `alex.student@apex.edu` | Report submissions & outcome tracking |

The web interface also includes an instant **Quick Switcher** bar at the top of the screen to toggle between roles without manual re-typing.

---

## 📦 Database Models Foundation (20 Models)

1. `Organization` (Tenant root)
2. `User` (RBAC accounts)
3. `Department` (Academic units)
4. `StudentProfile`
5. `FacultyProfile`
6. `MentorProfile`
7. `Company` (Industry partners)
8. `Internship` (Lifecycle record)
9. `WorkflowTemplate`
10. `WorkflowInstance`
11. `WorkflowTask`
12. `Outcome` (Academic objectives)
13. `OutcomeVersion` (Rubrics)
14. `Submission` (Student deliverables)
15. `Review` (Qualitative feedback)
16. `Evaluation` (Scored rubrics)
17. `AIAnalysis` (Automated insights foundation)
18. `Notification` (Alerts)
19. `AuditLog` (Tamper-evident logs)
20. `Document` (Uploaded artifacts)
