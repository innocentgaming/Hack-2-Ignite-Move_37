# InternOS — Smart Internship Management & Monitoring System

> **Enterprise Multi-Tenant Internship Management, Workflow Automation & Outcome-Based Education (OBE) Monitoring Platform**  
> Engineered for academic institutions, industry mentors, and students with strict tenant isolation, deterministic progress tracking, and verifiable learning outcomes.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.x-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4.2-646CFF?logo=vite)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.19.2-black?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-100%25%20Passed-brightgreen)](https://nodejs.org/api/test.html)

---

## 🚀 Overview

**InternOS** is a production-grade, multi-tenant internship intelligence and monitoring operating system built to govern the complete university-industry internship lifecycle. Academic institutions and partner organizations frequently struggle with fragmented communication, unverified student progress, subjective grading, and the absence of alignment with Outcome-Based Education (OBE) accreditation standards (such as ABET, NBA, and NAAC Program Outcomes).

InternOS addresses this challenge through a clean domain-driven architecture organized around three primary user experiences:
1. **Student Workspace**: Centered on personal internship execution — moving sequentially from **Milestones** (internship phases) to **Tasks** (assigned work), **Submissions** (delivered deliverables), **Evidence** (code repositories, live links, test results), **Feedback** (mentor guidance), and **Learning Outcomes** (demonstrated competencies).
2. **Mentor Workspace**: Tailored for industry supervisors to supervise active interns, review incoming internship registrations, organize milestone phases, assign tasks, review student evidence artifacts through structured accept/revision feedback loops, and track learning outcome attainment.
3. **Admin Workspace**: Designed for institutional governance, departmental configuration, user provisioning, CSV bulk student onboarding, configurable workflow blueprints, immutable audit logs, and organization-wide health and compliance analytics.

InternOS is engineered as a robust TypeScript monorepo with strict multi-tenant isolation (`organizationId` scoping on every model and query), a deterministic 16-transition finite state machine, a zero-hallucination code-based monitoring engine, and a 4-prerequisite completion barrier.

---

## 🎯 Problem Statement

Higher-education institutions, vocational academies, and corporate host employers face systemic hurdles when coordinating student off-campus internships:

* **Fragmented Communication & Data Chaos**: Tracking is scattered across unversioned spreadsheets, disjointed email threads, unorganized WhatsApp groups, and lost physical paperwork.
* **Absence of Real-Time Monitoring**: Academic advisors and company managers often discover student stagnation, absenteeism, or mentor disconnects weeks after they occur, putting academic credits and company projects at risk.
* **Lack of Outcome-Based Education (OBE) Alignment**: Accreditation bodies require measurable proof that internships satisfy specific Program Outcomes (POs) and Course Outcomes (COs). Conventional tools treat internships merely as attendance checklists rather than competency-building curricula.
* **Subjective Evaluation & Missing Review Loops**: Work deliverables are rarely evaluated against concrete rubrics, and students lack a standardized mechanism to revise deliverables based on mentor feedback.
* **Multi-Institution Governance Gaps**: University consortiums and multi-campus systems require centralized software deployment without leaking student records, company agreements, or evaluation dossiers across institutional boundaries.
* **Premature & Unverified Completions**: Students often obtain completion sign-offs without formal employer verification, missing mandatory milestone deliverables, or lacking verifiable evidence.

---

## 💡 Proposed Solution

InternOS structures internship management into a deterministic, verifiable, and student-centric operating workflow:

```
Student (Who)
   ↓
Internship (Which)
   ↓
Milestones (Phases)
   ↓
Tasks (Assigned Work)
   ↓
Submissions (Delivered Work)
   ↓
Evidence (GitHub PRs, Documentation, Tests, Deployments)
   ↓
Feedback (Acceptance or Revision Requests)
   ↓
Learning Outcomes (Program Outcomes & Competency Attainment)
```

### Core Solution Highlights
* **Multi-Tenant Foundation**: Every transaction, database record, and file upload is strictly bounded by the tenant's `Organization` ID.
* **People-Centric Mentorship**: The Mentor workspace separates active intern supervision from registration intake. Every milestone, task, submission, document, and outcome card explicitly identifies the student and their host company.
* **Iterative Evidence & Revision Loop**: Mentors can accept evidence (automatically completing the task and recalculating milestone/outcome progress) or request revisions with required feedback. Students can resubmit evidence under the same task without losing review history.
* **Deterministic Health & Attention Engine**: A 100% pure-code scoring engine calculates `ON_TRACK`, `ATTENTION`, or `CRITICAL` statuses from overdue tasks, inactive days, and open concerns — avoiding unpredictable AI hallucinations.
* **4-Prerequisite Completion Gate**: Guarantees an internship cannot reach `COMPLETED` unless:
  1. All required milestone submissions are uploaded.
  2. All deliverables have accepted mentor reviews.
  3. The mentor has submitted a structured final evaluation.
  4. Academic prerequisites are confirmed.
* **Private-by-Default Document Pipeline**: Secure document management with MIME validation, PDF magic-byte checks (`%PDF-`), and streaming endpoints for inline viewing and downloads.
* **Advisory AI Architecture**: A decoupled interface abstraction ready to plug into language models for evidence analysis without ever allowing AI to autonomously alter student status or block workflows.

---

## 👥 Target Users

| Role | System Identifier | Primary Purpose | Key Capabilities |
|---|---|---|---|
| **Administrator** | `ADMIN` / `SUPER_ADMIN` / `INSTITUTION_ADMIN` | Institutional governance & configuration | Department setup, user management, CSV bulk student import, workflow template authoring, immutable audit log inspection, organization-wide analytics. |
| **Student** | `STUDENT` | Training execution & evidence submission | View assigned milestones and tasks, upload deliverables (PDFs, repositories, test suites), review mentor feedback, resubmit revised evidence, monitor learning outcome progress, and download completed internship dossiers. |
| **Industry Mentor** | `MENTOR` / `INDUSTRY_MENTOR` | Corporate supervision & technical evaluation | Review incoming internship registrations (`Approve` / `Request Changes`), supervise assigned interns, structure milestone phases, assign tasks with expected evidence criteria, accept/request revision on student deliverables, and evaluate learning outcomes. |
| **Faculty Supervisor** *(Architectural Support)* | `FACULTY` / `FACULTY_SUPERVISOR` | Academic oversight & compliance | Cohort monitoring, deliverable verification, deadline extension approvals, and academic sign-offs. |
| **Head of Department (HOD)** *(Architectural Support)* | `HOD` | Departmental leadership | Departmental performance review, faculty allocation, and high-level approval oversight. |

> **Note on Workflow Simplification**: The active core platform has been streamlined around the primary trio: **Admin**, **Student**, and **Mentor**. Extended roles (Faculty, HOD) remain supported in the relational schema and permission engine for institutions requiring traditional multi-tier faculty sign-off.

---

## ✨ Key Features

### 1. Authentication & Multi-Tenant RBAC
* **Stateless JWT Security**: HMAC-SHA256 tokens carrying user identity, active role, and organization scope.
* **Tenant Isolation Middleware**: Automatically validates organization context and query parameters, guaranteeing zero cross-tenant leakage.
* **Granular Role-Based Permissions**: Role permission matrix covering 33 distinct operational capabilities.
* **Account Activation Flow**: Secure token-based invitation flow allowing new users to activate accounts and set bcrypt-hashed credentials.
* **Session Termination**: Dedicated token invalidation on logout.

### 2. Student Workspace
* **Command Center Overview**: Real-time progress bar, active milestone badge, pending submissions count, and upcoming deadlines.
* **Phased Milestones**: View internship phases with start/due dates and dynamic progress indicators.
* **Task Board & Details**: Task view showing instructions, priority, due dates, and required evidence types.
* **Evidence Submission Pipeline**: Submit deliverables with GitHub PR URLs, live deployment links, test artifacts, and file uploads.
* **Action-Required Revision Center**: Instant visibility into mentor change requests with clear revision feedback.
* **Learning Outcomes Tracker**: Visual breakdown of Program Outcomes (POs) and criteria satisfied by submitted evidence.
* **Document Vault**: View offer letters, internship agreements, and completion dossiers with inline PDF rendering.

### 3. Mentor Workspace
* **Action-Oriented Overview**: Real-time KPI summary (Assigned Interns, Active Internships, Pending Reviews, Tasks Needing Attention, Outcomes Requiring Review) with direct action shortcuts.
* **My Interns (People-Centric)**: Roster focused on the individual student (Name, Department, Batch, Roll Number, Company, Date Range, Progress, Active Milestone, Pending Reviews).
* **Internship Registrations Review**: Dedicated portal to inspect incoming internship applications (Offer letters, company websites, work mode, descriptions) with `[Approve Internship]` and `[Request Changes]` actions.
* **Contextual Milestones Management**: Plan internship phases. Every milestone card visibly identifies `Student · Internship · Company`.
* **Task Assignment**: Assign tasks linked directly to a student, internship, milestone, and target Learning Outcome with expected evidence criteria.
* **Submissions Queue & Review Engine**: Inspect student deliverables with links and notes. One-click `[Accept Evidence]` (triggers automatic progress recalculation) or `[Request Revision]` (requires mentor feedback).
* **Learning Outcomes Evaluation**: Discrete outcome cards per student and internship with live backend filters (`studentId`, `internshipId`, `outcomeId`, `status`, `search`).
* **Attributed Documents**: Document explorer showing file ownership, size, upload date, inline preview, and secure download.

### 4. Admin Workspace & Governance
* **Department Management**: Create and configure academic departments and program codes.
* **User Management**: Roster of all institutional users with status controls (`ACTIVE`, `INACTIVE`, `SUSPENDED`).
* **CSV Bulk Student Onboarding**: 3-stage transactional import (`Preview` → `Validate` → `Confirm`) with automatic roll number collision detection and validation.
* **Workflow Template Designer**: Define multi-stage milestone blueprints with deadline offsets, step types (`SUBMISSION`, `REVIEW`, `EVALUATION`, `APPROVAL`), and scoring rules.
* **Audit Trail**: Filterable event log recording actor, IP address, timestamp, affected entity, action type (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `ACCESS_DENIED`), and change details.
* **Institutional Analytics**: High-level KPIs, department completion rates, company distribution, mentor workload distribution, and CSV export.

### 5. Deterministic Health & Monitoring Engine
* **Zero-Hallucination Scoring**: Computes health status (`ON_TRACK`, `ATTENTION`, `CRITICAL`) using concrete metrics: overdue days, pending review days, inactivity periods, and open mentor concerns.
* **Prioritized Attention Queue**: Flags at-risk internships needing immediate intervention.
* **Unified Lifecycle Timeline**: Aggregates state transitions, submissions, reviews, and extensions into an audit-ready timeline.

### 6. Document & PDF Pipeline
* **Secure Storage Abstraction**: Pluggable storage architecture (`IStorageService`) supporting local disk storage and S3-compatible object storage (AWS S3, Cloudflare R2, MinIO).
* **Strict Validation**: Enforces MIME validation, file size limits (default 25 MB), and validates `%PDF-` magic bytes.
* **Inline Streaming & Download**: Serves PDFs inline with secure headers or as attachments preserving original filenames.

---

## 🏗️ System Architecture

InternOS is designed as a decoupled, multi-tier TypeScript monorepo where presentation, business logic, persistence, and domain types are strictly separated.

### High-Level Topology

```mermaid
flowchart TD
    subgraph Clients["👥 Client Layer"]
        A["Student Browser"]
        B["Mentor Browser"]
        C["Admin Browser"]
    end

    subgraph Web["💻 Web SPA (apps/web)"]
        SPA["React 18 + Vite SPA<br/>Tailwind CSS & Lucide Icons<br/>React Router v6"]
    end

    subgraph Gateway["🛡️ Security & API Gateway (apps/api)"]
        RateLimit["Rate Limiting"]
        AuthMiddleware["JWT Authentication"]
        TenantMiddleware["Tenant Isolation Engine (organizationId)"]
        RBACMiddleware["Role-Based Access Control Guard"]
    end

    subgraph CoreServices["⚙️ Domain Services"]
        AuthSvc["Auth & Tenant Service"]
        StudentMentorSvc["Student & Mentor Workspace Service"]
        WorkflowSvc["Workflow & Lifecycle Engine"]
        HealthSvc["Deterministic Health Engine"]
        StorageSvc["Storage Service (IStorageService)"]
        AISvc["AI Advisory Service (IAIService)"]
    end

    subgraph DataStore["🗄️ Persistence Layer"]
        Prisma["Prisma ORM Client"]
        Postgres[("PostgreSQL 16 Database<br/>20 Relational Models")]
        ObjectStorage[("Object / File Storage<br/>(Local Disk / S3 / Cloudflare R2)")]
    end

    Clients -->|"HTTPS / REST / JWT"| SPA
    SPA --> Gateway
    RateLimit --> AuthMiddleware --> TenantMiddleware --> RBACMiddleware
    RBACMiddleware --> CoreServices
    CoreServices --> Prisma --> Postgres
    StorageSvc --> ObjectStorage
    CoreServices -.->|"Advisory Prompts"| AISvc
```

### Layer Descriptions
1. **Frontend Presentation Layer (`apps/web`)**: Modern Single Page Application built with React 18, Vite, and Tailwind CSS. Employs role-guarded routing, contextual breadcrumbs, responsive SaaS styling, and modular state management.
2. **Security & Routing Layer (`apps/api/src/routes` & `middleware`)**: Express API with route versioning (`/api/v1/*`). All protected routes pass through `authenticate`, `tenantIsolation`, and role permission guards before invoking controllers.
3. **Domain Service Layer (`apps/api/src/services`)**: Encapsulates business logic, state machine validations, milestone calculations, evidence verification, and audit logging.
4. **Data Persistence Layer (`prisma/schema.prisma`)**: Managed PostgreSQL 16 database with 20 relational models enforcing foreign key constraints, unique composite keys, and indexing on `organizationId`.
5. **Storage Abstraction Layer**: Isolates binary files and student artifacts under organization-scoped storage keys.

---

## 🔄 System Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Student
    actor Mentor
    actor Admin
    participant API as InternOS API
    participant DB as PostgreSQL

    Note over Admin,DB: Phase 1: Onboarding & Configuration
    Admin->>API: Configure Workflow Template & Departments
    Admin->>API: Invite Student & Mentor Accounts
    Student->>API: Activate Account & Authenticate

    Note over Student,Mentor: Phase 2: Registration & Approval
    Student->>API: Submit Internship Registration (Company, Dates, Outcomes)
    API->>DB: Record Internship (Status: PENDING_APPROVAL)
    Mentor->>API: Open /app/mentor/internship-registrations
    Mentor->>API: Review Application & Click [Approve Internship]
    API->>DB: Instantiate Workflow & Generate Milestone Tasks (Status: ACTIVE)

    Note over Student,Mentor: Phase 3: Milestone & Task Execution
    Mentor->>API: Assign Task (JWT Authentication) with Expected Evidence Criteria
    Student->>API: View Task on /app/student/tasks
    Student->>API: Upload Deliverable & Submit Evidence (PR URL, Postman Tests)
    API->>DB: Record Submission (Status: SUBMITTED), Task (Status: SUBMITTED)

    Note over Mentor,Student: Phase 4: Review, Revision & Acceptance Loop
    Mentor->>API: Open /app/mentor/submissions/:id
    alt Mentor Requests Revision
        Mentor->>API: Click [Request Revision] with feedback comments
        API->>DB: Submission (Status: REVISION_NEEDED), Task (Status: CHANGES_REQUESTED)
        Student->>API: View Revision Notice & Resubmit Updated Evidence
    else Mentor Accepts Evidence
        Mentor->>API: Click [Accept Evidence] with rating
        API->>DB: Submission (Status: ACCEPTED), Task (Status: APPROVED)
        API->>DB: Auto-recalculate Milestone Progress & Outcome Coverage
    end

    Note over Student,Mentor: Phase 5: Evaluation & Completion
    Mentor->>API: Submit Final Rubric Evaluation (/100)
    API->>DB: Verify 4-Prerequisite Completion Gate
    API->>DB: Transition Internship to COMPLETED
    Student->>API: Access & Download Verified Final Dossier
```

---

## 🧠 AI / ML Architecture

InternOS incorporates a dedicated **Advisory AI Layer** designed to assist mentors and administrators without replacing human judgment.

### Architectural Philosophy
* **Strictly Advisory**: AI never autonomously approves, rejects, marks competencies, determines student health scores, or alters state machine workflows.
* **No Speculative Implementations**: The architecture defines a formal typed abstraction interface (`IAIService`) in `@internos/types` implemented by `apps/api/src/services/ai.service.ts`.
* **Current Status**: **Interface Contract Implemented (Phase 0-1)**. Active model integrations (OpenAI / Gemini / Anthropic adapters) are slated for Phase 2.

```mermaid
flowchart LR
    A["Student Deliverables<br/>(Reports, Code PRs, Artifacts)"] --> B["Preprocessing & Sanitization<br/>(PII & Secret Redaction)"]
    B --> C["Advisory AI Pipeline<br/>(OpenAI / Gemini Adapter)"]
    C --> D["Structured Extraction<br/>(Activities, Technologies, Outcomes)"]
    D --> E["Mentor Inspection Card<br/>(Advisory Suggestions Only)"]
    
    style E fill:#f3e8ff,stroke:#7e22ce,stroke-width:2px
```

### Abstraction Interface Contract
```typescript
export interface IAIService {
  analyzeSubmission(request: AISubmissionAnalysisRequest): Promise<AISubmissionAnalysisResponse>;
  mapInternshipOutcomes(request: AIOutcomeMappingRequest): Promise<AIOutcomeMappingResponse>;
  recommendRubric(request: AIRubricRecommendationRequest): Promise<AIRubricRecommendationResponse>;
}
```

* **Graceful Degradation**: If an AI provider experiences rate limits or network failures, the analysis is flagged as `FAILED` without failing the underlying student submission or blocking the review workflow.

---

## 🛠️ Technology Stack

| Category | Technology | Version | Purpose in InternOS |
|---|---|---|---|
| **Monorepo Management** | npm Workspaces | >= 10.x | Multi-package workspace orchestration (`apps/*`, `packages/*`) |
| **Language** | TypeScript | 5.4.5 | Strict static type-safety across all packages and services |
| **Frontend Framework** | React | 18.3.1 | Declarative component-driven Single Page Application |
| **Build Tool** | Vite | 5.4.2 | Sub-second hot module replacement and production bundling |
| **Styling** | Tailwind CSS | 3.4.3 | Modern, responsive SaaS design system and design tokens |
| **Icons** | Lucide React | ^0.378.0 | Consistent iconography for SaaS navigation and actions |
| **Backend Framework** | Express | 4.19.2 | RESTful API server with modular routers and middleware |
| **Runtime** | Node.js | >= 20.x | High-performance server-side JavaScript runtime |
| **Database** | PostgreSQL | 16 (Alpine) | Robust ACID-compliant relational persistence |
| **ORM** | Prisma | 5.22.0 | Type-safe query building, migrations, and schema modeling |
| **Authentication** | JSON Web Tokens (jsonwebtoken) | 9.0.2 | Stateless HMAC-SHA256 signed bearer tokens |
| **Password Hashing** | bcryptjs | 2.4.3 | Salted credential hashing with standard cost factor |
| **Input Validation** | Zod | ^3.23.8 | Runtime schema validation for requests and DTOs |
| **File Storage** | Custom `IStorageService` | - | Multi-driver storage abstraction (Local Disk / S3 / MinIO) |
| **Testing** | Node.js Native Test Runner + tsx | - | Native asynchronous unit, integration, and E2E test suites |
| **Code Quality** | ESLint + Prettier | 8.57.0 | Automated linting, import hygiene, and formatting |

---

## 📁 Project Structure

```text
internos-monorepo/
├── apps/
│   ├── api/                               # Node.js + Express Backend Service
│   │   ├── src/
│   │   │   ├── config/                    # Environment variables & constants
│   │   │   ├── controllers/               # HTTP request handlers (Admin, Student, Mentor, etc.)
│   │   │   ├── lib/                       # Prisma client instance and utility helpers
│   │   │   ├── middleware/                # Auth, TenantIsolation, RBAC guards, error handler
│   │   │   ├── routes/                    # Express routers (v1, student, mentor, admin, auth, etc.)
│   │   │   ├── services/                  # Domain business logic & data access services
│   │   │   ├── types/                     # Express request augmentation types
│   │   │   ├── app.ts                     # Express application configuration & middleware mount
│   │   │   └── index.ts                   # Server bootstrap & graceful shutdown listener
│   │   ├── test/                          # 16 Native test suites (100% passing)
│   │   │   ├── mentor-workspace-architecture.test.ts
│   │   │   ├── student-workflows-documents.test.ts
│   │   │   ├── tenant-isolation-rbac.test.ts
│   │   │   └── phase13-e2e-scenario.test.ts
│   │   └── package.json
│   │
│   └── web/                               # React 18 + Vite Frontend SPA
│       ├── src/
│       │   ├── components/                # UI kit (Button, Card, Badge, Table, Modal, Sidebar, Navbar)
│       │   ├── context/                   # AuthContext and state providers
│       │   ├── layouts/                   # AppLayout, MarketingLayout
│       │   ├── pages/
│       │   │   ├── mentor/                # Dedicated Mentor Workspace pages (12 pages)
│       │   │   │   ├── MentorOverviewPage.tsx
│       │   │   │   ├── MentorInternsPage.tsx
│       │   │   │   ├── MentorInternDetailPage.tsx
│       │   │   │   ├── MentorRegistrationsPage.tsx
│       │   │   │   ├── MentorMilestonesPage.tsx
│       │   │   │   ├── MentorMilestoneDetailPage.tsx
│       │   │   │   ├── MentorTasksPage.tsx
│       │   │   │   ├── MentorSubmissionsPage.tsx
│       │   │   │   └── MentorOutcomesPage.tsx
│       │   │   ├── student/               # Dedicated Student Workspace pages (14 pages)
│       │   │   │   ├── StudentOverviewPage.tsx
│       │   │   │   ├── StudentMilestonesPage.tsx
│       │   │   │   ├── StudentMilestoneDetailPage.tsx
│       │   │   │   ├── StudentTasksPage.tsx
│       │   │   │   ├── StudentTaskDetailPage.tsx
│       │   │   │   ├── StudentSubmissionsPage.tsx
│       │   │   │   ├── StudentSubmitEvidencePage.tsx
│       │   │   │   ├── StudentOutcomesPage.tsx
│       │   │   │   └── StudentDocumentsPage.tsx
│       │   │   ├── AdminUsersPage.tsx
│       │   │   ├── AdminDepartmentsPage.tsx
│       │   │   ├── AdminWorkflowsPage.tsx
│       │   │   ├── AdminStudentImportPage.tsx
│       │   │   ├── AdminAuditLogsPage.tsx
│       │   │   └── AnalyticsPage.tsx
│       │   ├── services/                  # Axios/Fetch API client with JWT interceptor
│       │   ├── App.tsx                    # Route definitions & guards
│       │   └── main.tsx                   # React DOM entry point
│       └── package.json
│
├── packages/
│   ├── shared/                            # Cross-package utilities, errors & response helpers
│   │   ├── src/index.ts
│   │   └── package.json
│   └── types/                             # Canonical shared DTOs, interfaces & domain Enums
│       ├── src/index.ts
│       └── package.json
│
├── prisma/
│   ├── migrations/                        # Versioned SQL migration history
│   ├── schema.prisma                      # Authoritative 20-model PostgreSQL schema
│   └── seed.ts                            # Deterministic demo dataset seeder
│
├── docs/                                  # Technical specifications
│   ├── ARCHITECTURE.md                    # Core architecture & security specifications
│   ├── DATABASE.md                        # Data model reference & entity relational inventory
│   └── DEVELOPMENT.md                     # Developer guide & Docker workflow
│
├── .env.example                           # Canonical environment configuration template
├── docker-compose.yml                     # Local PostgreSQL 16 container definition
├── DEPLOYMENT.md                          # Production deployment architecture guide
├── TEST_REPORT.md                         # Detailed multi-layer test verification report
└── package.json                           # Monorepo root workspace orchestrator
```

---

## 🗄️ Database Architecture

InternOS uses **PostgreSQL 16** managed through **Prisma ORM**. The database schema contains **20 relational models** with complete multi-tenant partitioning via `organizationId`.

### Entity Relationship Diagram

```mermaid
erDiagram
    Organization ||--o{ Department : "contains"
    Organization ||--o{ User : "scopes"
    Organization ||--o{ Company : "partners_with"
    Organization ||--o{ Internship : "governs"
    Organization ||--o{ Outcome : "defines"
    Organization ||--o{ AuditLog : "records"

    Department ||--o{ User : "employs / enrolls"
    
    User ||--o| StudentProfile : "has"
    User ||--o| FacultyProfile : "has"
    User ||--o| MentorProfile : "has"

    Company ||--o{ MentorProfile : "employs"
    Company ||--o{ Internship : "hosts"

    StudentProfile ||--o{ Internship : "undertakes"
    StudentProfile ||--o{ Submission : "delivers"

    Internship ||--o{ Milestone : "divided_into"
    Internship ||--o| WorkflowInstance : "executes"
    Internship ||--o{ Document : "stores"

    WorkflowTemplate ||--o{ WorkflowInstance : "instantiates"
    WorkflowInstance ||--o{ WorkflowTask : "schedules"
    
    Milestone ||--o{ WorkflowTask : "groups"
    Outcome ||--o{ WorkflowTask : "maps_to"
    Outcome ||--o{ OutcomeVersion : "versions"

    WorkflowTask ||--o{ Submission : "receives"
    Submission ||--o{ Review : "evaluated_by"
    Submission ||--o{ Evaluation : "scored_against"
    Submission ||--o{ Document : "attaches"

    User ||--o{ Review : "authors"
    User ||--o{ Notification : "receives"
```

### Relational Entity Inventory
1. **Organization**: Multi-tenant root partition (unique `code`).
2. **Department**: Academic division within an institution.
3. **User**: Central identity record with bcrypt password hash and role enum.
4. **StudentProfile**: Extended student details (roll number, batch year, CGPA).
5. **FacultyProfile**: Faculty designations and employee IDs.
6. **MentorProfile**: Corporate mentor records linked to companies.
7. **Company**: Host employer details and verification status.
8. **Internship**: Core engagement linking student, company, supervisor, mentor, and status.
9. **Milestone**: Phased timeframes with target due dates and calculated progress.
10. **WorkflowTemplate**: Configurable milestone and step blueprint.
11. **WorkflowInstance**: Instantiated workflow execution tied to an active internship.
12. **WorkflowTask**: Assigned tasks with priority, due dates, instructions, and expected evidence.
13. **Outcome**: Program Outcomes (POs) and Course Outcomes (COs) for accreditation.
14. **OutcomeVersion**: Snapshotted outcome rubrics and criteria versions.
15. **Submission**: Student work deliverable for an assigned task.
16. **Review**: Qualitative feedback, ratings, and revision directives from mentors.
17. **Evaluation**: Rubric-based criteria scoring against Program Outcomes.
18. **AIAnalysis**: Storage for asynchronous advisory evidence extraction.
19. **Notification**: User-targeted alerts and deadline reminders.
20. **AuditLog**: Tamper-evident, append-only log capturing critical platform actions.
21. **Document**: Secure binary metadata referencing uploads with MIME and byte verification.

---

## 🔐 Authentication & Authorization

### Authentication Mechanism
* **HMAC-SHA256 JWTs**: Stateless tokens carrying `{ id, email, role, organizationId }`.
* **Password Security**: Credential encryption via `bcryptjs` with 10 salt rounds. Passwords are never returned in responses.
* **Token Invalidation**: Dedicated `/api/v1/auth/logout` endpoint clears active sessions.

### Multi-Tenant Isolation
* Inbound requests are intercepted by `tenantIsolation.ts`.
* The organization context is resolved from the verified token or request header `X-Organization-Code`.
* Controller queries automatically scope reads and writes with `where: { organizationId }`.
* Cross-tenant requests immediately fail with **HTTP 403 Forbidden**.

### Role-Based Access Control (RBAC)
* Route guards utilize `requireRoles(UserRole.STUDENT, UserRole.MENTOR, ...)` to enforce least-privilege access.
* Specific operational capabilities (e.g. approving an internship, modifying outcomes, reviewing submissions) are strictly restricted to assigned actors.

---

## 🛡️ Security

InternOS is built with security and data protection as core requirements:

* **Strict Organization-Level Tenant Isolation**: Verified through automated security test suites to prevent cross-tenant queries across all HTTP verbs.
* **Student-to-Student Isolation**: Mentors can only view interns explicitly assigned to them; students cannot view peers' submissions or tasks.
* **Cryptographic Password Hashing**: Passwords stored as one-way bcrypt hashes.
* **Input Validation & Sanitization**: Request bodies validated using schema validators; dangerous input characters sanitized.
* **Binary File & PDF Magic-Byte Validation**: File uploads validated not only by file extension, but by checking the `%PDF-` magic bytes header to prevent malicious script uploads.
* **CORS Hardening**: In production (`NODE_ENV=production`), wildcard origins (`*`) are disallowed; only the verified `FRONTEND_URL` is accepted.
* **Sensitive Data Redaction**: Automatic sanitization pipeline redacts passwords, tokens, and authorization keys from audit logs and error messages.
* **Protected File Streaming**: Files stored privately without public URLs; downloads stream through authenticated endpoints verifying user access rights.

### Recommended Security Improvements for Enterprise Production
- [ ] Implement short-lived access tokens (15m) paired with rotating refresh tokens stored in HTTP-only cookies.
- [ ] Introduce IP-based rate limiting via Redis (`express-rate-limit` with Redis store).
- [ ] Add virus scanning integration (e.g., ClamAV) on file upload streams.
- [ ] Enable PostgreSQL Row-Level Security (RLS) policies as an extra defense-in-depth layer.

---

## 🔌 API Documentation

All endpoints are versioned under `/api/v1/*`. Responses use the standard envelope:
```json
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "2026-09-18T00:00:00.000Z" }
}
```

### 1. Health & Authentication
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | No | Public service health check |
| `POST` | `/api/v1/auth/login` | No | Authenticate user & return JWT token |
| `POST` | `/api/v1/auth/activate` | No | Activate user account using invitation token |
| `POST` | `/api/v1/auth/logout` | Yes | Invalidate user session |
| `GET` | `/api/v1/auth/me` | Yes | Get authenticated user profile & tenant info |

### 2. Student Workspace APIs
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/v1/student/dashboard` | Yes (`STUDENT`) | Student dashboard metrics, active milestone, & deadlines |
| `GET` | `/api/v1/student/milestones` | Yes (`STUDENT`) | Roster of internship milestones with progress percentages |
| `GET` | `/api/v1/student/tasks` | Yes (`STUDENT`) | Assigned tasks with due dates, priority, & submission status |
| `GET` | `/api/v1/student/tasks/:taskId` | Yes (`STUDENT`) | Full task details, expected evidence, & submission history |
| `POST` | `/api/v1/student/tasks/:taskId/submissions` | Yes (`STUDENT`) | Submit work deliverable with links, text, & evidence |
| `GET` | `/api/v1/student/submissions` | Yes (`STUDENT`) | History of deliverables and mentor review statuses |
| `GET` | `/api/v1/student/submissions/:submissionId`| Yes (`STUDENT`) | Submission details, notes, mentor ratings, & feedback |
| `PATCH`| `/api/v1/student/submissions/:submissionId`| Yes (`STUDENT`) | Resubmit deliverable after mentor requested changes |
| `GET` | `/api/v1/student/outcomes` | Yes (`STUDENT`) | Target Program Outcomes and evidence criteria coverage |
| `GET` | `/api/v1/student/feedback` | Yes (`STUDENT`) | Aggregated feedback received across all tasks |
| `GET` | `/api/v1/student/documents` | Yes (`STUDENT`) | Uploaded documents and official internship files |
| `POST` | `/api/v1/student/documents` | Yes (`STUDENT`) | Upload new PDF document with magic-byte check |
| `GET` | `/api/v1/student/documents/:id/view` | Yes (`STUDENT`) | Stream document inline with PDF headers |
| `GET` | `/api/v1/student/documents/:id/download` | Yes (`STUDENT`) | Download document with attachment disposition |

### 3. Mentor Workspace APIs
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/v1/mentor/dashboard` | Yes (`MENTOR`) | Mentor overview KPIs (interns, reviews, tasks, outcomes) |
| `GET` | `/api/v1/mentor/interns` | Yes (`MENTOR`) | Supervised interns roster with progress & milestone info |
| `GET` | `/api/v1/mentor/interns/:studentId` | Yes (`MENTOR`) | Full 7-tab student command center profile |
| `GET` | `/api/v1/mentor/registrations` | Yes (`MENTOR`) | Incoming internship applications requiring review |
| `POST` | `/api/v1/mentor/registrations/:id/review` | Yes (`MENTOR`) | Approve application or request changes |
| `GET` | `/api/v1/mentor/milestones` | Yes (`MENTOR`) | Milestones listing with student & company context |
| `GET` | `/api/v1/mentor/milestones/:id` | Yes (`MENTOR`) | Detailed milestone breakdown and tasks list |
| `POST` | `/api/v1/mentor/milestones` | Yes (`MENTOR`) | Create a new internship phase milestone |
| `PATCH`| `/api/v1/mentor/milestones/:id` | Yes (`MENTOR`) | Edit milestone details, dates, or progress |
| `GET` | `/api/v1/mentor/tasks` | Yes (`MENTOR`) | Assigned tasks with student ownership attribution |
| `POST` | `/api/v1/mentor/tasks` | Yes (`MENTOR`) | Assign a new task linked to student, milestone, & outcome |
| `GET` | `/api/v1/mentor/submissions` | Yes (`MENTOR`) | Student submissions queue awaiting review |
| `GET` | `/api/v1/mentor/submissions/:id` | Yes (`MENTOR`) | Submission details, student evidence, & notes |
| `POST` | `/api/v1/mentor/submissions/:id/accept` | Yes (`MENTOR`) | Accept evidence, complete task, & recalculate progress |
| `POST` | `/api/v1/mentor/submissions/:id/request-revision`| Yes (`MENTOR`)| Request revision with required mentor feedback |
| `GET` | `/api/v1/mentor/outcomes` | Yes (`MENTOR`) | Outcome cards per student with query filters |
| `GET` | `/api/v1/mentor/documents` | Yes (`MENTOR`) | Intern documents with student attribution |
| `GET` | `/api/v1/mentor/feedback` | Yes (`MENTOR`) | History of feedback provided by this mentor |

### 4. Admin & Governance APIs
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/users` | Yes (`ADMIN`) | Filterable roster of institutional users |
| `POST` | `/api/v1/admin/users/invite` | Yes (`ADMIN`) | Invite a user via activation token email |
| `PATCH`| `/api/v1/admin/users/:id/status` | Yes (`ADMIN`) | Update user account status (`ACTIVE`, `SUSPENDED`) |
| `GET` | `/api/v1/admin/departments` | Yes (`ADMIN`) | List academic departments |
| `POST` | `/api/v1/admin/departments` | Yes (`ADMIN`) | Create a new academic department |
| `POST` | `/api/v1/admin/students/import/preview` | Yes (`ADMIN`) | Parse and preview CSV student import |
| `POST` | `/api/v1/admin/students/import/confirm` | Yes (`ADMIN`) | Execute transactional bulk student creation |
| `GET` | `/api/v1/admin/audit-logs` | Yes (`ADMIN`) | Query immutable system audit logs |
| `GET` | `/api/v1/analytics/overview` | Yes (`ADMIN`) | Aggregate KPIs, completion rates, & distributions |
| `GET` | `/api/v1/analytics/export` | Yes (`ADMIN`) | Stream structured compliance report as CSV |

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` in the repository root:

```bash
cp .env.example .env
```

| Variable | Required | Default / Example | Purpose |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` / `production` | Runtime mode (affects CORS and error verbosity) |
| `PORT` | Yes | `4000` | Express backend HTTP port |
| `API_URL` | Yes | `http://localhost:4000` | Canonical backend API URL |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | Allowed frontend origin for CORS |
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/internos?schema=public` | PostgreSQL connection string |
| `JWT_SECRET` | Yes | `CHANGE_ME_MIN_32_CHARS` | Secret key for signing HMAC-SHA256 JWTs |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiration timeframe |
| `DEFAULT_ORGANIZATION_CODE` | Yes | `apex-inst` | Default tenant organization code |
| `STORAGE_DRIVER` | Yes | `local` (`local`, `s3`, `gcs`) | File storage driver implementation |
| `STORAGE_LOCAL_UPLOAD_DIR`| No | `./uploads` | Local directory for uploaded files |
| `STORAGE_MAX_FILE_SIZE_MB`| No | `25` | Maximum upload size in megabytes |
| `STORAGE_ENDPOINT` | If S3 | `https://s3.us-east-1.amazonaws.com` | S3-compatible object storage endpoint |
| `STORAGE_BUCKET` | If S3 | `internos-production-documents` | Dedicated bucket name |
| `STORAGE_REGION` | If S3 | `us-east-1` | Cloud storage region |
| `STORAGE_ACCESS_KEY` | If S3 | `YOUR_ACCESS_KEY` | IAM Access Key ID |
| `STORAGE_SECRET_KEY` | If S3 | `YOUR_SECRET_KEY` | IAM Secret Access Key |
| `LLM_PROVIDER` | No | `openai` | Advisory AI provider (`openai`, `gemini`) |
| `LLM_API_KEY` | No | `YOUR_API_KEY` | Advisory AI API key |
| `LLM_MODEL` | No | `gpt-4o` | Target language model name |
| `VITE_API_URL` | Yes | `http://localhost:4000` | Frontend backend API target (set in `apps/web/.env`) |

---

## ⚙️ Installation

### Prerequisites
* **Node.js**: `v20.x` or higher installed ([Download Node.js](https://nodejs.org/))
* **npm**: `v10.x` or higher
* **PostgreSQL**: `v16.x` (or Docker to run the included container)
* **Git**: `v2.x`+

### 1. Clone Repository
```bash
git clone https://github.com/innocentgaming/Hack-2-Ignite-team_37.git
cd Hack-2-Ignite-team_37
```

### 2. Install Monorepo Dependencies
```bash
npm install
```

---

## 🔧 Configuration

### 1. Configure Environment Files
```bash
cp .env.example .env
```
Edit `.env` to configure your PostgreSQL connection string and a secure `JWT_SECRET`.

### 2. Start PostgreSQL via Docker (Optional)
If you do not have a local PostgreSQL instance running:
```bash
docker-compose up -d
```
This spins up PostgreSQL 16 on port `5432` with username `postgres`, password `postgres`, and database `internos`.

### 3. Generate Prisma Client & Run Migrations
```bash
# Validate database schema
npm run prisma:validate

# Generate Prisma Client
npm run prisma:generate

# Deploy database migrations
npm run prisma:migrate
```

### 4. Seed Deterministic Demo Data
```bash
npm run prisma:seed
```
This seeds complete test organizations, admin accounts, and the following core actors:
* **Admin**: `admin@apex.edu` (Password: `Password123!`)
* **Mentor**: `mentor@techcorp.io` (Mark Mentor, supervising Sam Student & David Chen)
* **Student A**: `student@apex.edu` (Sam Student — Full Stack Engineering @ Google Cloud Solutions)
* **Student B**: `david@apex.edu` (David Chen — Cloud Infrastructure & DevOps @ Amazon Web Systems)

---

## ▶️ Running Locally

### Run Entire Platform Concurrently
```bash
npm run dev
```
* **Frontend**: `http://localhost:5173`
* **Backend API**: `http://localhost:4000`
* **Health Check**: `http://localhost:4000/api/v1/health`

### Run Workspaces Individually
```bash
# Backend API only
npm run dev:api

# Frontend Web SPA only
npm run dev:web
```

### Build Production Bundles
```bash
# Build all workspaces
npm run build

# Build individual workspaces
npm run build:api
npm run build:web
```

---

## 🧪 Testing

InternOS features a comprehensive automated testing suite across 16 test files verifying unit logic, integration endpoints, cross-tenant isolation, RBAC security, and full E2E lifecycles.

### Run All Integration & Architecture Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Mentor Workspace Architecture & Data Isolation Tests
node --import tsx --test apps/api/test/mentor-workspace-architecture.test.ts

# Student Workflow & Document Pipeline Tests
node --import tsx --test apps/api/test/student-workflows-documents.test.ts

# Multi-Tenant Isolation & RBAC Security Tests
node --import tsx --test apps/api/test/tenant-isolation-rbac.test.ts

# 24-Step End-to-End Lifecycle Scenario
node --import tsx --test apps/api/test/phase13-e2e-scenario.test.ts
```

### Code Quality & Static Analysis
```bash
# Run TypeScript typecheck across all workspaces
npm run typecheck

# Run ESLint across the codebase
npm run lint
```

---

## 📸 Screenshots

> Screenshots will be added as the UI stabilizes.

---

## 🎥 Demo

* **Repository**: [https://github.com/innocentgaming/Hack-2-Ignite-team_37](https://github.com/innocentgaming/Hack-2-Ignite-team_37)
* **Interactive Local Demo**: Follow the [Installation](#️-installation) steps and run `npm run dev` to access the full system locally.

---

## 🚀 Deployment

InternOS supports independent, decoupled deployment across modern cloud platforms. For comprehensive step-by-step instructions, see the [Production Deployment Guide](file:///d:/hacktoonskilltech/DEPLOYMENT.md).

### Deployment Overview
* **Frontend SPA**: Deploy `apps/web/dist` to **Vercel**, **Netlify**, or **Cloudflare Pages**.
  * Build Command: `npm run build:web`
  * Output Directory: `apps/web/dist`
  * Environment Variable: `VITE_API_URL=https://api.yourdomain.com`
* **Backend API**: Deploy `apps/api` to **Render**, **Railway**, **Fly.io**, or **AWS ECS**.
  * Build Command: `npm install && npm run prisma:generate && npm run build:api`
  * Pre-deploy Command: `npm run prisma:migrate`
  * Start Command: `npm run start`
* **Database**: Managed PostgreSQL 16 on **Neon**, **Supabase**, **Railway**, or **AWS RDS**.
* **Object Storage**: AWS S3, Cloudflare R2, or MinIO configured via `STORAGE_DRIVER=s3`.

---

## 🐳 Docker

A production-parity PostgreSQL container is included for rapid local development:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: internos-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: internos
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d internos"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local
```

### Docker Commands
```bash
# Start PostgreSQL in the background
docker-compose up -d

# Check container health status
docker-compose ps

# Stop PostgreSQL container
docker-compose down
```

---

## 📊 Current Project Status

| Module | Status | Verification & Notes |
|---|---|---|
| **Multi-Tenant Foundation** | ✅ Complete | Organization-level tenant isolation verified across all endpoints |
| **Authentication & RBAC** | ✅ Complete | JWT tokens, bcrypt hashing, role guards, token invalidation |
| **Student Workspace** | ✅ Complete | Full workflow: Milestones, Tasks, Evidence Submission, Feedback, Documents |
| **Mentor Workspace** | ✅ Complete | Information architecture rebuilt: My Interns, Registrations, Reviews, Outcomes |
| **Admin Workspace** | ✅ Complete | Departments, Users, CSV Import, Workflows, Audit Logs |
| **State Machine Engine** | ✅ Complete | 16-transition deterministic state engine with authorized transitions |
| **Deterministic Health Engine** | ✅ Complete | Zero-hallucination metric calculation (`ON_TRACK`, `ATTENTION`, `CRITICAL`) |
| **Document Pipeline** | ✅ Complete | Magic-byte check (`%PDF-`), secure upload, inline streaming & download |
| **Outcome-Based Education (OBE)** | ✅ Complete | Program Outcome tracking, evidence criteria coverage, rubric evaluation |
| **Institutional Analytics** | ✅ Complete | Real-time KPIs, department rosters, company share, CSV export |
| **AI Intelligence Layer** | 🟡 Interface Ready | Typed `IAIService` abstraction implemented; Phase 2 model integration pending |
| **Testing Suite** | ✅ Complete | 16 test suites, 100% passing across unit, integration, and E2E layers |
| **Production Deployment Config** | ✅ Complete | Hardened CORS, decoupled deployment specs, Docker Compose ready |

---

## 🗺️ Roadmap

### Completed
- [x] Multi-tenant relational schema (20 Prisma models) and PostgreSQL 16 migrations.
- [x] Stateless JWT authentication and organization-scoped authorization middleware.
- [x] Student Workspace with task boards, evidence submission, and document viewers.
- [x] Mentor Workspace information architecture rebuild (Supervision, Work Management, Evaluation).
- [x] Internship Registrations review portal with Approve / Request Changes workflows.
- [x] Deterministic zero-hallucination health and monitoring engine.
- [x] Tamper-evident audit logging and institutional event logging.
- [x] Full-text CSV student bulk import with transactional roll number validation.
- [x] Real-data institutional analytics with department breakdowns and CSV streaming export.
- [x] Comprehensive 16-suite test pipeline (100% passing).

### In Progress
- [ ] Active LLM integration adapter (OpenAI / Gemini) implementing `IAIService`.
- [ ] Email notification delivery service (SendGrid / AWS SES integration).

### Planned
- [ ] Dynamic custom rubric designer in the Admin workspace.
- [ ] Advanced biometric / geofenced attendance tracking for on-site industrial training.
- [ ] Bulk internship registration approvals for university cohort cycles.

### Future Scope
- [ ] Dedicated mobile application (React Native) for student daily logging and mentor push alerts.
- [ ] Digital verifiable credentials (W3C Verifiable Credentials) for completed internship dossiers.
- [ ] Direct university Student Information System (SIS) integration via LTI / Ed-Fi standards.

---

## ⚠️ Limitations

* **Advisory AI Status**: The AI service operates currently as an architectural interface contract (`IAIService`). Live AI prompts require configuring active API keys in Phase 2.
* **Single Tenant Session**: The frontend session is bound to one active organization at a time; cross-organization switching requires re-authentication.
* **Local Storage Default**: The default configuration stores files on the local filesystem (`./uploads`). Production deployments must set `STORAGE_DRIVER=s3` with cloud object storage credentials.
* **Synchronous CSV Import**: The CSV student import executes transactionally; files exceeding 5,000 rows should be split to prevent HTTP request timeouts.

---

## 🔮 Future Scope

* **Mobile Experience**: PWA or native mobile application for on-site student evidence uploads and immediate mentor notifications.
* **Verifiable Diplomas & Credentials**: Cryptographically signed PDF dossiers and verifiable credentials stored on public ledgers or institutional trust registries.
* **Multi-Campus Consortium Federation**: Cross-institutional benchmarking and anonymized employer rating insights across university consortiums.

---

## 🤝 Contributing

We welcome contributions from open-source developers and educational technology contributors.

```text
Fork Repository
      ↓
Create Feature Branch (`git checkout -b feature/amazing-feature`)
      ↓
Commit Changes (`git commit -m 'feat: add amazing feature'`)
      ↓
Verify Types & Tests (`npm run typecheck && npm test`)
      ↓
Push Branch (`git push origin feature/amazing-feature`)
      ↓
Open Pull Request
```

### Contribution Guidelines
1. Ensure all code conforms to the project's TypeScript configuration and ESLint rules (`npm run lint`).
2. Every new endpoint or service method must be accompanied by unit or integration tests in `apps/api/test`.
3. Do not bypass tenant scoping — ensure `organizationId` is enforced on all data queries.

---

## 🐛 Issue Reporting

If you encounter bugs, security vulnerabilities, or have feature suggestions:
* **Bug Reports & Features**: Open an issue on the [GitHub Issues](https://github.com/innocentgaming/Hack-2-Ignite-team_37/issues) page.
* **Security Disclosures**: Please report security vulnerabilities responsibly via private disclosure before publishing public issues.

---

## 📜 License

> No open-source license has currently been specified.

---

## 👨‍💻 Contributors

* **Aditya Yadav** ([@innocentgaming](https://github.com/innocentgaming)) — Lead Architect & Maintainer (`aadiyadav1706@gmail.com`)

---

## 🙏 Acknowledgements

* [Prisma ORM](https://www.prisma.io/) — Next-generation Node.js and TypeScript ORM
* [React](https://react.dev/) & [Vite](https://vitejs.dev/) — Fast, modern frontend framework and tooling
* [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
* [Lucide Icons](https://lucide.dev/) — Clean, customizable icons
* [Express.js](https://expressjs.com/) — Fast, unopinionated web framework for Node.js
* [PostgreSQL](https://www.postgresql.org/) — Powerful open-source relational database system

---

## 📚 Additional Documentation

* [System Architecture Specification](file:///d:/hacktoonskilltech/docs/ARCHITECTURE.md)
* [Database Schema & Models Reference](file:///d:/hacktoonskilltech/docs/DATABASE.md)
* [Developer Setup & Workflow Guide](file:///d:/hacktoonskilltech/docs/DEVELOPMENT.md)
* [Production Deployment Guide](file:///d:/hacktoonskilltech/DEPLOYMENT.md)
* [Multi-Layer Automated Test Report](file:///d:/hacktoonskilltech/TEST_REPORT.md)

---

## 📞 Contact

For inquiries regarding InternOS, implementation support, or institutional onboarding:
* **Maintainer**: Aditya Yadav (`aadiyadav1706@gmail.com`)
* **GitHub**: [https://github.com/innocentgaming/Hack-2-Ignite-team_37](https://github.com/innocentgaming/Hack-2-Ignite-team_37)
