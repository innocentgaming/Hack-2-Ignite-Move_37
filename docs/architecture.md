# InternOS Architecture Specification (Phase 0)

## 1. Executive System Overview

InternOS is an enterprise multi-tenant internship intelligence and monitoring operating system engineered for higher-education academic institutions, faculty supervisors, corporate industry mentors, and students.

Phase 0 establishes the foundational architectural framework, strictly decoupling persistence, domain types, shared contracts, presentation, and service boundaries without implementing premature speculative business logic.

---

## 2. Monorepo Structure

```
internos/
├── apps/
│   ├── web/                     # React 18, TypeScript, Tailwind CSS, React Router SPA
│   └── api/                     # Node.js, Express, TypeScript REST API
│
├── packages/
│   ├── shared/                  # Shared error classes, standard response helpers, formatters
│   └── types/                   # Shared TypeScript interfaces, Enums, DTOs, API envelopes
│
├── prisma/                      # PostgreSQL schema (20 models), migrations & seed scripts
│   ├── migrations/              # Verifiable SQL schema migrations
│   ├── schema.prisma            # Authoritative database model definition
│   └── seed.ts                  # Deterministic development seed dataset
│
├── docs/                        # Architectural, Database, and Developer documentation
│   ├── ARCHITECTURE.md          # System architecture, RBAC, tenant isolation & contracts
│   ├── DATABASE.md              # 20 Data models, relational graph, indexes & audit rules
│   └── DEVELOPMENT.md           # Local setup, Docker Compose, commands & workflows
│
├── .env.example                 # Comprehensive environment variable template
├── .eslintrc.cjs                # Monorepo-wide ESLint linting configuration
├── .prettierrc                  # Monorepo-wide code formatting rules
├── docker-compose.yml           # Production-parity PostgreSQL 16 local container
├── README.md                    # Root project documentation
└── package.json                 # Monorepo workspace orchestration
```

---

## 3. Core Architectural Principles

### 3.1 Multi-Tenancy & Tenant Scoping
- **Tenant Root**: Every tenant is anchored by an `Organization` entity with a unique immutable `code` (e.g., `apex-inst`).
- **Scoping Rule**: All database models (User, Department, Company, Internship, WorkflowInstance, Task, Outcome, Submission, Review, Evaluation, Notification, AuditLog, Document) contain a mandatory foreign key `organizationId`.
- **Tenant Isolation Middleware**: Express middleware intercepts all inbound requests, verifies organization context from the verified JWT or header `X-Organization-Code`, and enforces cross-tenant boundary isolation.

### 3.2 Authentication & Role-Based Access Control (RBAC)
- **Token Mechanism**: Stateless JSON Web Tokens (JWT) signed with HMAC-SHA256 containing `userId`, `email`, `role`, `organizationId`, and `organizationCode`.
- **Role Hierarchy**:
  1. `SUPER_ADMIN`: Cross-tenant platform administration and governance.
  2. `INSTITUTION_ADMIN`: Institutional tenant management, department setup, user provisioning.
  3. `FACULTY_SUPERVISOR`: Student internship tracking, progress verification, rubric evaluation.
  4. `INDUSTRY_MENTOR`: Corporate milestone review, technical log verification, feedback scoring.
  5. `STUDENT`: Task submission, document upload, internship status view, evaluation review.

### 3.3 Unified API Contract & Centralized Error Handling
- **API Versioning**: All production API endpoints are mounted under `/api/v1/*`.
- **Envelope Standard**:
  ```typescript
  // Success Envelope
  {
    "success": true,
    "data": T,
    "meta": { "timestamp": string, "requestId": string }
  }

  // Error Envelope
  {
    "success": false,
    "error": {
      "code": string,
      "message": string,
      "details": unknown,
      "timestamp": string,
      "path": string
    }
  }
  ```
- **Explicit Health Endpoint**:
  ```
  GET /api/v1/health
  Response:
  {
    "success": true,
    "service": "internos-api",
    "status": "healthy"
  }
  ```

### 3.4 Storage Abstraction
File storage operations are abstracted behind the `IStorageService` interface (`apps/api/src/services/storage.service.ts`), allowing plug-and-play transitions between local disk storage, AWS S3, Google Cloud Storage, or Azure Blob Storage without modifying route handlers.

```typescript
export interface IStorageService {
  uploadFile(buffer: Buffer, filename: string, mimeType: string, organizationId: string): Promise<StorageUploadResult>;
  getFile(key: string): Promise<Buffer>;
  deleteFile(key: string): Promise<void>;
  getUrl(key: string): Promise<string>;
}
```

### 3.5 AI Abstraction Layer
As mandated by Phase 0 requirements, no AI/LLM functionality is executed. Instead, an explicit interface abstraction (`IAIService`) defines future capabilities (submission analysis, outcome mapping, rubric suggestion). Calling these stubs in Phase 0 throws an explicit `501 NOT_IMPLEMENTED_PHASE_0` error.

---

## 4. Frontend Application Shell Architecture

- **React 18 + TypeScript + Vite**: Fast HMR, type-safe development.
- **Tailwind CSS Design System**: Cohesive color tokens, accessible contrast, smooth transitions.
- **Application Shell**:
  - `Navbar` / `Header`: Multi-tenant organization badge, quick role-switcher, notification triggers, user profile menu.
  - `Sidebar`: Dynamic role-filtered navigation items with active indicators.
  - `AppLayout`: Shell wrapper providing authentication guards and layout constraints.
- **Reusable Component Suite**:
  `Button`, `Input`, `Select`, `Modal`, `Table`, `Badge`, `Card`, `Dialog`, `Toast`, `Loading`, `EmptyState`, `ErrorState`.
