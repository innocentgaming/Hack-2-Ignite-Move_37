# 🚀 InternOS — Multi-Tenant Smart Internship Intelligence Operating System

> **Phase 0 Foundation Release**  
> Architected for higher-education academic institutions, faculty supervisors, industry corporate mentors, and students.

---

## 🏛️ Monorepo Architecture

```
internos/
├── apps/
│   ├── web/                 # React, TypeScript, Tailwind CSS, React Router SPA
│   └── api/                 # Node.js, Express, TypeScript, JWT & RBAC Engine
│
├── packages/
│   ├── shared/              # Shared error classes, standard responses & utilities
│   └── types/               # Authoritative TypeScript types, enums, DTOs & AI abstractions
│
├── prisma/                  # PostgreSQL schema, migrations & development seed
│   ├── migrations/          # Verifiable SQL schema migrations
│   ├── schema.prisma        # 20 Prisma domain models with multi-tenant scoping
│   └── seed.ts              # Deterministic development seed dataset
│
├── docs/                    # Technical & Architectural Documentation
│   ├── ARCHITECTURE.md      # Multi-tenancy, RBAC, API contracts & design patterns
│   ├── DATABASE.md          # 20 Data models, relational graph & audit specifications
│   └── DEVELOPMENT.md       # Local developer guide, Docker Compose & workflows
│
├── .env.example             # Environment variable template
├── .eslintrc.cjs            # Monorepo-wide ESLint configuration
├── .prettierrc              # Monorepo-wide code formatting rules
├── docker-compose.yml       # Production-parity PostgreSQL 16 container
├── README.md                # Root architectural guide
└── package.json             # Monorepo workspace configuration
```

---

## 📦 System Foundations (Phase 0)

1. **Modular Monorepo**: Decoupled `apps/` (web, api), `packages/` (shared, types), and `prisma/`.
2. **Multi-Tenant Isolation**: Hard isolation keyed on `organizationId` across all entities.
3. **Database Foundation**: 20 relational models in Prisma ORM targeting PostgreSQL.
4. **JWT & RBAC Architecture**: 5-tier role hierarchy (`SUPER_ADMIN`, `INSTITUTION_ADMIN`, `FACULTY_SUPERVISOR`, `INDUSTRY_MENTOR`, `STUDENT`).
5. **Storage Abstraction Layer**: Interface-driven file storage (`IStorageService`) with local filesystem driver and cloud-ready provider abstraction.
6. **AI Abstraction Layer**: Standardized `IAIService` interface with Phase 0 stubs strictly enforcing no premature speculative execution.
7. **Production Quality Standards**: Strict TypeScript (`strict: true`), ESLint, Prettier formatting, Zod schema validation, centralized error handling, and structured request logging.
8. **Comprehensive UI Suite**: 12 reusable components (`Button`, `Input`, `Select`, `Modal`, `Table`, `Badge`, `Card`, `Dialog`, `Toast`, `Loading`, `EmptyState`, `ErrorState`).

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, React Router v6, Lucide Icons, Vite |
| **Backend** | Node.js, Express, TypeScript, Zod, JWT, Helmet, CORS |
| **Database** | PostgreSQL, Prisma ORM, Prisma Client |
| **DevOps & QA**| Docker Compose, ESLint, Prettier, TypeScript Strict Mode |

---

## 🚦 Quick Start

### 1. Installation
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

### 4. Prisma Validation & Generation
```bash
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 5. Start Development Servers
```bash
# Start both API and Web concurrently:
npm run dev

# Or start individually:
npm run dev:api    # API on http://localhost:4000
npm run dev:web    # Web on http://localhost:5173
```

---

## 🩺 Health Check Endpoint

```http
GET /api/v1/health
```

**Response**:
```json
{
  "success": true,
  "service": "internos-api",
  "status": "healthy"
}
```

---

## 🔑 Demo Credentials (Phase 0)

| Role | Email | Password |
|---|---|---|
| Institution Admin | `admin@apex.edu` | `Password123!` |
| Faculty Supervisor | `dr.sharma@apex.edu` | `Password123!` |
| Industry Mentor | `raj.patel@acmecloud.com` | `Password123!` |
| Student | `alex.student@apex.edu` | `Password123!` |
| Super Admin | `superadmin@internos.local` | `Password123!` |

---

## 📄 Documentation Links

- [System Architecture](file:///docs/ARCHITECTURE.md)
- [Database Models & Schema](file:///docs/DATABASE.md)
- [Developer & Testing Guide](file:///docs/DEVELOPMENT.md)
