# InternOS Architecture & Design Document (Phase 0)

## 1. Architectural Overview

InternOS is a multi-tenant Smart Internship Management and Monitoring System for educational institutions. The architecture follows a modular monorepo pattern using standard TypeScript across both backend and frontend.

```
internos/
├── apps/
│   ├── api/                 # Express.js REST API with strict server-side RBAC & tenant scoping
│   └── web/                 # React 18 + Vite + Tailwind CSS Single Page Application
├── packages/
│   ├── shared/              # Centralized error classes, response formatters, RBAC matrices
│   ├── types/               # Domain models, enums, DTOs, API contracts
│   └── prisma/              # PostgreSQL schema, migrations, seeders, Prisma client
└── docs/                    # Architectural and developer documentation
```

---

## 2. Multi-Tenant Isolation Model

### 2.1 The Core Rule
> **"Every tenant-owned record must be scoped using `organizationId`. Never trust `organizationId` supplied by the frontend. Tenant isolation must be enforced server-side. Frontend visibility is NOT a security boundary."**

### 2.2 Server-Side Enforcement Flow
1. **Authentication**: The user logs in via `POST /api/v1/auth/login`. Upon verifying credentials, a signed JWT is issued containing:
   - `userId`
   - `email`
   - `role`
   - `organizationId` (immutable tenant identity)
   - `organizationCode`
2. **Context Binding**: The `authenticate` middleware verifies the cryptographic JWT signature and sets `req.user` and `req.organizationId`.
3. **Tenant Isolation Guard**: The `tenantIsolation` middleware inspects the incoming request:
   - If the request includes an untrusted `organizationId` in the body, query parameters, or headers that differs from `req.user.organizationId`, the request is rejected with `403 FORBIDDEN (TENANT_ISOLATION_VIOLATION)` unless the actor is `SUPER_ADMIN`.
   - The authoritative `req.organizationId` is injected into downstream database queries using `withTenantScope(req, whereClause)`.

---

## 3. Role-Based Access Control (RBAC)

InternOS supports 5 distinct roles:

| Role | Domain Scope | Primary Responsibilities |
|---|---|---|
| `SUPER_ADMIN` | Global (Cross-tenant) | Platform infrastructure, provisioning new institutions |
| `INSTITUTION_ADMIN` | Tenant-wide | Department setup, user roster, workflow template management, audit logs |
| `FACULTY_SUPERVISOR` | Departmental / Assigned Students | Internship approval, milestone report reviews, outcome rubric scoring |
| `INDUSTRY_MENTOR` | Company / Assigned Interns | Corporate deliverable verification, workplace competency evaluations |
| `STUDENT` | Self | Deliverable submission, task completion, outcome progress tracking |

---

## 4. Database Schema Design (Prisma ORM)

The initial foundation specifies 20 relational models:

1. **`Organization`**: Multi-tenant root entity.
2. **`Department`**: Academic units (e.g., Computer Science, Electrical Engineering).
3. **`User`**: Account identity with salted bcrypt password and role.
4. **`StudentProfile`**: Student-specific attributes (roll number, batch year, CGPA).
5. **`FacultyProfile`**: Supervisor attributes (employee ID, designation).
6. **`MentorProfile`**: Industry mentor attributes (company affiliation, designation).
7. **`Company`**: Employer records and industry classifications.
8. **`Internship`**: Quad-party relational record linking Student, Company, Faculty, and Mentor.
9. **`WorkflowTemplate`**: Configurable stage and milestone task blueprints.
10. **`WorkflowInstance`**: Active lifecycle instance tied 1:1 with an Internship.
11. **`WorkflowTask`**: Individual stage tasks (due dates, assignee roles).
12. **`Outcome`**: Accreditation and academic goals (e.g. Program Outcomes - POs).
13. **`OutcomeVersion`**: Rubric scoring matrices for each outcome.
14. **`Submission`**: Student deliverables submitted against tasks.
15. **`Review`**: Qualitative and quantitative feedback by Faculty/Mentors.
16. **`Evaluation`**: Rubric assessments mapped to specific academic outcomes.
17. **`AIAnalysis`**: Database schema placeholder for future automated assessment phases.
18. **`Notification`**: System and workflow notification dispatch queue.
19. **`AuditLog`**: Tamper-evident logging of administrative and security events.
20. **`Document`**: Metadata and storage keys for uploaded files.

---

## 5. Storage Abstraction

The system encapsulates file operations behind `IStorageService`:
- `LocalStorageService`: Implements disk-based storage with organization folder sandboxing (`./uploads/{organizationId}/{hash}.{ext}`).
- Future S3 / GCS drivers conform to the same interface without requiring changes to business logic or database schemas.

---

## 6. Standard API Contract

All endpoints return a uniform envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-09-16T18:00:00.000Z"
  }
}
```

In the event of an error:

```json
{
  "success": false,
  "error": {
    "code": "TENANT_ISOLATION_VIOLATION",
    "message": "Cross-tenant access prohibited",
    "timestamp": "2026-09-16T18:00:00.000Z",
    "path": "GET /api/v1/tenants/current"
  }
}
```
