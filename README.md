# 🚀 InternOS — Multi-Tenant Smart Internship Intelligence Operating System

> **Phase 8 — Production Complete**  
> A full-stack, multi-tenant internship management platform built for higher-education institutions, faculty supervisors, industry mentors, and students.

---

## 🏛️ Monorepo Architecture

```
internos/
├── apps/
│   ├── web/                 # React 18 · TypeScript · Tailwind CSS · React Router v6
│   └── api/                 # Node.js · Express · TypeScript · JWT & RBAC Engine
│
├── packages/
│   ├── shared/              # Error classes, standard API responses & role utilities
│   └── types/               # Authoritative TypeScript types, enums, DTOs (Phase 0–8)
│
├── prisma/                  # PostgreSQL schema, migrations & development seed
│   ├── migrations/          # Verifiable SQL schema migrations
│   ├── schema.prisma        # 20 Prisma domain models with strict multi-tenant scoping
│   └── seed.ts              # Deterministic development seed dataset
│
├── docs/                    # Technical & Architectural Documentation
├── .env.example             # Environment variable template
├── docker-compose.yml       # Production-parity PostgreSQL 16 container
└── package.json             # Monorepo workspace configuration
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, React Router v6, Lucide Icons, Vite |
| **Backend** | Node.js, Express, TypeScript, Zod, JWT, Helmet, CORS |
| **Database** | PostgreSQL, Prisma ORM (20 models) |
| **Testing** | Node.js built-in test runner (`node:test`), 105+ integration tests |
| **DevOps & QA** | Docker Compose, ESLint, Prettier, TypeScript Strict Mode |

---

## ✅ Implementation Phases

### Phase 0 — System Foundation
- Modular monorepo: `apps/` (web, api), `packages/` (shared, types), `prisma/`
- 20 relational Prisma models with hard multi-tenant `organizationId` scoping
- JWT authentication architecture + 5-role RBAC hierarchy
- Storage abstraction layer (`IStorageService`) — local & cloud-ready
- AI abstraction layer (`IAIService`) — interface-driven stubs
- 12 reusable UI components (Button, Modal, Table, Badge, Card, Toast, etc.)

### Phase 1 — Authentication & Multi-Tenant RBAC
- JWT login / logout / token refresh with bcrypt password hashing
- Multi-tenant isolation: every request scoped to `organizationId`
- Role-based access control: ADMIN, HOD, FACULTY, MENTOR, STUDENT
- Account activation via secure token invite system
- Full audit trail for auth events

### Phase 2 — Institution Administration & User Management
- Department registry CRUD with HOD assignment
- User management: create, invite, update role/status, deactivate
- CSV bulk student import with preview, validation & confirm pipeline
- Dynamic role-specific dashboards (Admin, HOD, Faculty metrics)
- Audit log viewer with filtering

### Phase 3 — Configurable Workflow Engine
- Workflow template builder with configurable steps (SUBMISSION, REVIEW, EVALUATION, APPROVAL)
- Step configuration: frequency, actor role, deadline offset, marks, late policy
- Auto-assignment rules by department and internship type
- Workflow instance creation and progress tracking
- Task extension grants with documented justification

### Phase 4 — Internship Lifecycle & State Machine
- Internship registration with expected outcomes
- Deterministic state machine: DRAFT → PENDING_APPROVAL → APPROVED → ACTIVE → READY_FOR_COMPLETION → COMPLETED
- Approval/rejection workflow (HOD, Admin, Faculty)
- Faculty & mentor assignment
- Outcome versioning with full history

### Phase 5 — Role-Specific Workspaces
- **Student workspace**: current tasks, upcoming deadlines, submission history, outcome progress
- **Faculty workspace**: supervised interns, pending reviews, attention cases, recent activity
- **HOD workspace**: department monitoring, faculty load, attention queue
- **Mentor workspace**: assigned students, pending reviews, active concerns
- Mentor concern flagging (LOW / MEDIUM / HIGH / CRITICAL severity)

### Phase 6 — Versioned Submissions, Files & Reviews
- Multi-version submission system (resubmit on revision request)
- Private file upload per submission (PDF, images, archives)
- Mentor review system: feedback, score, criteria scoring, revision requests
- Submission status lifecycle: DRAFT → SUBMITTED → UNDER_REVIEW → ACCEPTED / REVISION_NEEDED
- Document vault per internship

### Phase 7 — Deterministic Monitoring & Health Engine
- Health scoring engine: ON_TRACK / ATTENTION / CRITICAL per internship
- Configurable threshold rules (overdue days, inactivity, pending reviews)
- Attention queue with prioritized case list
- Full lifecycle timeline reconstruction per internship
- Institution-wide monitoring overview (Admin/HOD/Faculty)

### Phase 8 — Final Evaluation & Completion Engine ✅ *(Latest)*
- **Final Evaluation**: Mentor submits structured rubric scoring out of 100
  - Configurable criteria (name, max marks, awarded marks, per-criterion comments)
  - Auto-computed: total marks, percentage, letter grade (A+ / A / B / C / F)
  - Editing supported (original evaluator or Admin only)
- **Completion Engine**: 4-prerequisite gating before `COMPLETED`
  1. Required milestone submissions completed
  2. Required mentor reviews completed
  3. Final mentor evaluation submitted
  4. Faculty academic confirmation signed off
  - Returns exact missing conditions — never silently completes
- **Faculty Confirmation**: Academic sign-off with notes, recommendation & credits
- **Completed Dossier**: Full record — company, role, dates, evaluation, outcomes, evidence files, milestone feedback, lifecycle timeline
- **Termination**: Mentor requests → HOD/Admin decides → full history kept
- **Cancellation**: Role-authorized with documented justification
- **Full Audit**: All evaluation, completion, termination, and cancellation events logged

---

## 🧪 Test Suite

```bash
cd apps/api
npm test
```

| Suite | Tests | Status |
|---|---|---|
| Phase 1 — Auth & RBAC | 11 | ✅ Pass |
| Phase 2 — Admin & CSV Import | 14 | ✅ Pass |
| Phase 3 — Workflow Engine | 14 | ✅ Pass |
| Phase 4 — Internship Lifecycle | 16 | ✅ Pass |
| Phase 5 — Role Workspaces | 19 | ✅ Pass |
| Phase 6 — Submissions & Reviews | 17 | ✅ Pass |
| Phase 7 — Monitoring & Health | 12 | ✅ Pass |
| Phase 8 — Final Evaluation & Completion | **12** | ✅ Pass |
| Tenant Isolation & RBAC | 5 | ✅ Pass |
| **Total** | **120+** | **✅ All Pass** |

---

## 🚦 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

### 3. Database (Docker Compose)
```bash
docker compose up -d
```

### 4. Prisma Validation & Seed
```bash
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 5. Start Development Servers
```bash
npm run dev          # Both API + Web concurrently

npm run dev:api      # API only → http://localhost:4000
npm run dev:web      # Web only → http://localhost:5173
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Org |
|---|---|---|---|
| Admin | `admin@org-a.com` | `Password123!` | ORG_A |
| HOD | `hod@org-a.com` | `Password123!` | ORG_A |
| Faculty | `faculty@org-a.com` | `Password123!` | ORG_A |
| Student | `student@org-a.com` | `Password123!` | ORG_A |
| Mentor | `mentor@org-a.com` | `Password123!` | ORG_A |
| Admin (Org B) | `admin@org-b.com` | `Password123!` | ORG_B |

---

## 🩺 Health Check

```http
GET /api/v1/health
```

```json
{
  "success": true,
  "service": "internos-api",
  "status": "healthy"
}
```

---

## 📡 API Reference

| Prefix | Description |
|---|---|
| `POST /api/v1/auth/login` | Login & token issuance |
| `GET  /api/v1/auth/me` | Current authenticated user |
| `GET  /api/v1/admin/*` | Institution administration |
| `GET  /api/v1/workflows/*` | Workflow templates & tasks |
| `GET  /api/v1/internships/*` | Internship lifecycle |
| `GET  /api/v1/workspaces/*` | Role-specific workspaces |
| `POST /api/v1/submissions/*` | Versioned submissions & files |
| `GET  /api/v1/monitoring/*` | Health engine & monitoring |
| `GET  /api/v1/completion/*` | Final evaluation & completion |

---

## 📄 Documentation

- [System Architecture](docs/ARCHITECTURE.md)
- [Database Models & Schema](docs/DATABASE.md)
- [Developer & Testing Guide](docs/DEVELOPMENT.md)
