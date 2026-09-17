# InternOS — Smart Internship Management & Monitoring System

> **Enterprise Multi-Tenant Internship Governance, Workflow Automation & Outcome-Based Education (OBE) Monitoring Platform**  
> Engineered for academic institutions, industry mentors, and students with strict tenant isolation, deterministic progress tracking, verifiable evidence review loops, and accredited learning outcome attainment.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.18.0-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4.2-646CFF?logo=vite)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.19.2-black?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-278%20Passed%20(100%25)-brightgreen)](https://nodejs.org/api/test.html)
[![Frontend](https://img.shields.io/badge/Vercel-Live%20SPA-black?logo=vercel)](https://internos-web-tau.vercel.app)
[![Backend](https://img.shields.io/badge/Render-Live%20API-46E3B7?logo=render)](https://internos-api-gntk.onrender.com)

---

## 🚀 Overview

**InternOS** is a production-grade, multi-tenant internship governance and academic monitoring operating system built to govern the university-to-industry internship lifecycle. Academic institutions and corporate hosts routinely struggle with fragmented communication, unverified student progress, subjective grading, and the absence of alignment with Outcome-Based Education (OBE) standards (such as ABET, NBA, and NAAC Program Outcomes).

InternOS addresses this structural deficit through a domain-driven architecture organized around three distinct workspaces:

1. **Student Workspace**: Centered on personal internship execution — moving sequentially from **Milestones** (developmental phases) to **Tasks** (actionable assignments), **Submissions** (delivered work), **Evidence** (GitHub pull requests, live deployments, test reports, and PDF documentation), **Feedback** (mentor review loops), and **Learning Outcomes** (demonstrated competencies).
2. **Mentor Workspace**: Built for industry supervisors to supervise active interns, approve internship registrations, organize milestone phases, assign tasks with expected evidence criteria, review student deliverables through structured accept/revision feedback loops, and evaluate learning outcome attainment.
3. **Admin Workspace**: Built for institutional governance, tenant onboarding, department configuration, user invitations with secure activation tokens, CSV bulk student import, workflow blueprint design, immutable audit logging, and organization-wide analytics with CSV export.

InternOS is engineered as a TypeScript monorepo with strict server-side multi-tenant isolation (`organizationId` scoping on every model and query), a deterministic 16-transition finite state machine, a zero-hallucination code-based monitoring engine, and a 4-prerequisite completion barrier.

---

## 🎯 Problem Statement

Higher-education institutions, engineering colleges, vocational academies, and corporate host employers face systemic hurdles when coordinating student off-campus internships:

* **Fragmented Communication & Data Chaos**: Tracking is scattered across unversioned spreadsheets, disjointed email threads, unorganized chat groups, and lost physical paperwork.
* **Absence of Real-Time Monitoring**: Academic advisors and company managers frequently discover student stagnation, absenteeism, or mentor disconnects weeks after they occur, putting academic credits and company projects at risk.
* **Lack of Outcome-Based Education (OBE) Alignment**: Accreditation bodies require measurable proof that internships satisfy specific Program Outcomes (POs) and Course Outcomes (COs). Conventional tools treat internships merely as attendance checklists rather than competency-building curricula.
* **Subjective Evaluation & Missing Review Loops**: Work deliverables are rarely evaluated against concrete rubrics, and students lack a standardized mechanism to revise deliverables based on mentor feedback.
* **Multi-Institution Governance Gaps**: University consortiums and multi-campus systems require centralized software deployment without leaking student records, company agreements, or evaluation dossiers across institutional boundaries.
* **Premature & Unverified Completions**: Students often obtain completion sign-offs without formal employer verification, missing mandatory milestone deliverables, or lacking verifiable evidence.

---

## 💡 Proposed Solution

InternOS structures internship management into a deterministic, verifiable, and student-centric operating workflow:

```
Institution / Tenant (Isolated)
  ├── Departments & Mentors
  └── Student
        ↓
      Internship (Registered & Approved)
        ↓
      Milestones (Structural Phases)
        ↓
      Tasks (Actionable Assignments)
        ↓
      Submissions (Student Deliverables)
        ↓
      Actual Evidence (GitHub PR, Live URL, PDF, Test Suite)
        ↓
      Mentor Review (Approved or Revision Required)
        ↓
      Learning Outcomes (Competencies Satisfied)
        ↓
      Final Evaluation & Academic Completion
```

### Core Solution Highlights
* **Strict Multi-Tenant Foundation**: Every transaction, database record, and file upload is strictly bounded by the tenant's `Organization` ID derived from authenticated JWT claims.
* **Clear Role Separation**: Workspace navigation dynamically adapts to the authenticated role (`STUDENT`, `MENTOR`, `ADMIN`). No arbitrary perspective switchers in production.
* **Context-Preserving Evidence Submission**: Clicking "Submit Evidence" on a task opens the submission form directly for that specific task (`/app/student/tasks/:taskId/submit`), preserving task, milestone, and internship context.
* **Iterative Evidence & Revision Loop**: Mentors can accept evidence (automatically completing the task and recalculating progress) or request revisions with required feedback. Students can resubmit evidence under the same task without losing review history.
* **Real PDF Streaming & Vault**: Uploaded offer letters and documents are validated via MIME and magic-byte checks (`%PDF-`) and streamed with inline or attachment headers.
* **Deterministic Health & Attention Engine**: A 100% code-based scoring engine calculates `ON_TRACK`, `ATTENTION`, or `CRITICAL` statuses from overdue tasks, inactive days, and open concerns — avoiding unpredictable AI hallucinations.
* **4-Prerequisite Completion Gate**: Guarantees an internship cannot reach `COMPLETED` unless:
  1. All required milestone tasks are completed.
  2. All required submissions have accepted mentor reviews.
  3. Program outcomes / learning outcomes are satisfied.
  4. The mentor has submitted a structured final evaluation.
* **Advisory AI Architecture**: A decoupled interface abstraction ready to plug into language models for evidence analysis without allowing AI to autonomously alter student status or block workflows.

---

## 👥 Target Users

| User Type | Role Identifier | Primary Purpose | Main Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `ADMIN` / `SUPER_ADMIN` / `INSTITUTION_ADMIN` | Institutional governance & tenant configuration | Register institutions, configure departments, invite students and mentors with secure activation tokens, CSV bulk student import, workflow blueprint design, audit log inspection, institutional analytics with CSV export. |
| **Student** | `STUDENT` | Academic internship execution & evidence submission | Register academic internships, upload PDF offer letters, inspect assigned milestones and tasks, submit multi-type evidence (GitHub PRs, URLs, PDFs), view mentor feedback, resubmit revised evidence, track OBE learning outcomes. |
| **Industry Mentor** | `MENTOR` / `INDUSTRY_MENTOR` | Technical supervision & competency evaluation | Review pending internship registrations (`Approve` / `Request Changes`), supervise assigned interns, define milestone phases, assign tasks with expected evidence criteria, evaluate student submissions (Accept / Request Revision), submit final evaluations. |
| **Faculty Supervisor** *(Architectural Support)* | `FACULTY` / `FACULTY_SUPERVISOR` | Academic cohort oversight | Cohort timeline monitoring, academic advisory check-ins, and institutional compliance reviews. |
| **Head of Department** *(Architectural Support)* | `HOD` | Departmental leadership | Departmental performance review and faculty allocation oversight. |

> **Note on Role Simplification**: The active core platform has been streamlined around the primary trio: **Admin**, **Student**, and **Mentor**. Extended roles (`FACULTY`, `HOD`) remain supported in the relational schema and permission engine for institutions requiring traditional multi-tier faculty sign-offs.

---

## ✨ Key Features

### 1. Authentication & Tenant Isolation
* **Stateless JWT Security**: HMAC-SHA256 tokens carrying user identity, active role, and organization scope.
* **Tenant Isolation Middleware**: Automatically validates organization context and query parameters, guaranteeing zero cross-tenant leakage.
* **Secure Account Activation**: Invitation tokens hashed with bcrypt; user sets credentials upon activation.
* **Role-Based Routing**: Authenticated role strictly determines whether the user accesses the Student, Mentor, or Admin workspace.

### 2. Student Workspace
* **Academic Internship Registration**: Multi-field registration flow capturing title, company details, dates, track, industry mentor info, and PDF offer letter upload.
* **Interactive PDF Offer Letter Viewer**: Dedicated streaming endpoint with inline rendering and attachment downloads.
* **Milestone & Task Exploration**: Hierarchical breakdown of developmental stages with progress indicators and actionable tasks.
* **Context-Preserving Evidence Submission**: Dedicated `/app/student/tasks/:taskId/submit` route with support for GitHub PRs, repositories, live URLs, file uploads, and explanatory notes.
* **Feedback & Resubmission Ledger**: View mentor comments, scores, and revision requests with direct resubmission capability.
* **Outcome-Based Education (OBE) Tracking**: Real-time alignment of actual student evidence against mentor-defined expected criteria for Program Outcomes (e.g., `PO-1`, `PO-2`).

### 3. Mentor Workspace
* **Operational Overview**: Daily attention feed highlighting pending submissions, active interns, and tasks requiring review.
* **Scoped Intern Management**: "My Interns" view strictly filtered to interns assigned to the authenticated mentor.
* **Registration Intake**: Review incoming student registrations with full inspection of company data, dates, and uploaded offer letter PDFs (`Approve` or `Request Changes`).
* **Milestone & Task Authoring**: Structure internships into developmental phases and assign actionable tasks with explicit expected evidence requirements.
* **Submission Review Queue**: Review student actual evidence against expected criteria, assign 1–5 star scores, provide feedback, and select `APPROVED` or `REVISION_REQUIRED`.
* **Final Evaluation & Completion**: Structured rubric evaluation tied to specific student-internship pairs.

### 4. Institutional Administration & Governance
* **Real Institution Onboarding**: Self-service institution registration at `/register-institution` creating isolated tenant roots and primary admin accounts.
* **Department Registry**: Manage departments with live operational metrics (students, mentors, active internships, completion rates) without legacy HOD bottlenecks.
* **User Provisioning & Invitations**: Issue invitations for `STUDENT` and `MENTOR` roles with cryptographically secure activation tokens.
* **CSV Bulk Student Import**: Parse, validate, and batch-create student accounts with department mapping and rollback safeguards.
* **Configurable Workflow Blueprints**: Visual state machine builder modeling stages, prerequisites, and transitions.
* **Institutional Analytics & CSV Export**: Dynamic filtering across departments, companies, mentors, and date ranges with streaming CSV export of filtered datasets.
* **Immutable Audit Trail**: Chronological event ledger capturing actor, role, action, entity, tenant, and metadata.

### 5. Document Management Pipeline
* **Multi-Driver Storage Architecture**: Pluggable storage abstraction supporting local file systems and S3-compatible object storage (AWS S3, Cloudflare R2, MinIO).
* **MIME & Magic-Byte Validation**: Binary inspection ensuring uploaded documents contain authentic `%PDF-` signatures.
* **Authenticated Streaming Endpoints**: Content-Disposition headers for secure inline browser viewing (`GET /api/v1/documents/:id/view`) and forced downloads (`GET /api/v1/documents/:id/download`).

### 6. Deterministic Monitoring & Health Engine
* **Pure-Code Health Evaluation**: Transparent scoring engine evaluating task completion pace, submission cadence, days since last activity, and mentor concerns.
* **Status Categorization**: Deterministically categorizes internships as `ON_TRACK`, `ATTENTION_NEEDED`, or `CRITICAL`.
* **Configurable Thresholds**: Administrators can tune inactivity thresholds, overdue task allowances, and review SLA targets.

---

## 🏗️ System Architecture

InternOS utilizes a modern decoupled full-stack monorepo architecture:

```mermaid
flowchart TD
    subgraph Clients ["Presentation Layer (Client Browsers)"]
        A1[Student Workspace]
        A2[Mentor Workspace]
        A3[Admin Governance]
        A4[Institution Onboarding]
    end

    subgraph CDN ["Edge & Routing (Vercel)"]
        B1[Vercel Edge Network]
        B2[React 18 + Vite SPA]
        B3[React Router DOM v6]
    end

    subgraph API ["Application Gateway (Render / Node.js)"]
        C1[Express 4 Application]
        C2[Helmet & CORS Policy]
        C3[JWT Authentication Guard]
        C4[Multi-Tenant Isolation Middleware]
        C5[Zod Request Validation]
    end

    subgraph Services ["Domain & Business Services"]
        D1[Internship State Machine]
        D2[Submission & Review Engine]
        D3[Health & Monitoring Engine]
        D4[Analytics & CSV Exporter]
        D5[Document Storage Service]
        D6[Audit Logger]
        D7[Advisory AI Subsystem]
    end

    subgraph Persistence ["Persistence & Storage Layer"]
        E1[(PostgreSQL 16 Database)]
        E2[Prisma 5 ORM Client]
        E3[Document Storage / Local & S3]
    end

    subgraph External ["External Intelligence (Advisory)"]
        F1[OpenAI / Gemini / Anthropic API]
    end

    Clients --> CDN
    CDN -->|HTTPS / REST API / JWT| API
    API --> Services
    Services --> E2
    E2 --> E1
    Services --> E3
    D7 -.->|Async Non-Blocking| F1
```

### Architectural Layer Breakdown
1. **Presentation Layer (React + Vite)**: Single Page Application built with Tailwind CSS, Lucide icons, and React Router v6. Implements client-side state management with uncoupled views for Student, Mentor, and Admin workflows.
2. **Gateway & Security Middleware**: Express.js server enforcing Helmet headers, strict CORS origin matching (`FRONTEND_URL`), JWT Bearer token authentication, and tenant isolation verifying that all operations match the authenticated user's `organizationId`.
3. **Domain Business Services**: Pure TypeScript service layer encapsulating state machine transitions, submission versioning, health scoring, CSV generation, and audit logging.
4. **Data Access Layer (Prisma ORM)**: PostgreSQL schema with composite tenant indexes (`organizationId`), UUID primary keys, relational cascade policies, and typed query generation.
5. **Storage Abstraction**: Storage driver interface supporting local filesystem storage with path traversal protection and S3-compatible object storage.
6. **Advisory AI Intelligence**: Zero-hallucination asynchronous pipeline providing evidence analysis without modifying workflow states.

---

## 🔄 System Workflow

### 1. Student-to-Mentor Task & Evidence Workflow

```mermaid
sequenceDiagram
    autonumber
    actor S as Student
    actor M as Industry Mentor
    participant API as InternOS API
    participant DB as PostgreSQL Database

    M->>API: Define Milestone & Create Task (Expected Evidence: PR, URL, PDF)
    API->>DB: Persist Task (Status: PENDING)
    S->>API: Inspect Task & Open Submission Route (/tasks/:id/submit)
    S->>API: Submit Actual Evidence (GitHub PR URL, Description, PDF attachment)
    API->>DB: Create Submission Record & Update Task (Status: SUBMITTED)
    API-->>M: Display in Mentor Review Queue
    M->>API: Open Review Modal (Inspect Expected vs Actual Evidence)
    alt Review: Revision Required
        M->>API: Request Changes (Submit Feedback & Specific Instructions)
        API->>DB: Update Task (Status: CHANGES_REQUESTED)
        API-->>S: Notify Student & Display Feedback
        S->>API: Resubmit Revised Evidence (Preserving History)
        API->>DB: Update Submission & Set Task (Status: SUBMITTED)
    else Review: Approved
        M->>API: Approve Submission (Score 1-5, Qualitative Feedback)
        API->>DB: Set Task (Status: APPROVED) & Update Milestone Progress
        API-->>S: Display Approved State & Outcome Satisfaction
    end
```

### 2. Internship Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Student Registers Internship
    DRAFT --> PENDING_APPROVAL : Student Submits Registration
    DRAFT --> CANCELLED : Student Cancels Registration
    PENDING_APPROVAL --> DRAFT : Mentor Requests Changes
    PENDING_APPROVAL --> APPROVED : Mentor Approves Registration
    APPROVED --> ACTIVE : Start Date Arrives / Work Commences
    ACTIVE --> READY_FOR_COMPLETION : All Milestones & Tasks Approved
    ACTIVE --> TERMINATED : Employer / Institution Terminates
    READY_FOR_COMPLETION --> COMPLETED : Final Evaluation & Admin Sign-off
    COMPLETED --> [*]
    TERMINATED --> [*]
    CANCELLED --> [*]
```

### 3. Institution Onboarding & User Activation Workflow

```mermaid
flowchart TD
    A[New College Admin] -->|Fill Registration Form| B[POST /api/v1/tenants/register]
    B --> C[Create Organization Root]
    C --> D[Create Admin User & Tenant Profile]
    D --> E[Admin Accesses Onboarding Dashboard]
    E --> F[Create Academic Departments]
    F --> G[Issue Invitations for Mentors & Students]
    G --> H[Generate Secure Activation Token]
    H --> I[Recipient Opens Activation URL]
    I --> J[Set Password & Personal Details]
    J --> K[Account Activated & Ready for Login]
```

---

## 🧠 AI / ML Architecture

InternOS incorporates an **Advisory Evidence Analysis Subsystem** designed to assist mentors in evaluating submitted student deliverables. 

> [!IMPORTANT]
> **Advisory-Only Principle**: The AI system is strictly advisory. It **never** autonomously approves submissions, fails students, alters state machines, or bypasses human mentor reviews. If the external LLM provider times out or fails, the core internship workflow continues uninterrupted.

```mermaid
flowchart LR
    A[Student Submission] -->|Deliverable Metadata & Text| B[AI Analysis Controller]
    B --> C{API Key Configured?}
    C -->|No / Dev Mode| D[Deterministic Fallback Analyzer]
    C -->|Yes| E[LLM Provider Gateway]
    E -->|OpenAI / Anthropic / Gemini| F[Structured Prompting Template]
    F --> G[JSON Schema Validation]
    G --> H[Extracted Skills & Tech Stack]
    G --> I[OBE Outcome Alignment Advisory]
    G --> J[Suggested Evaluation Rubric]
    D --> K[Persist AIAnalysis Record]
    H --> K
    I --> K
    J --> K
    K --> L[Render Advisory Card in Mentor Review Modal]
```

### Advisory Components
* **Provider Abstraction**: Decoupled interface supporting `openai`, `anthropic`, and `gemini` via configuration in `LLM_PROVIDER`.
* **Input Extraction**: Parses student descriptions, GitHub repository URLs, and submitted technical keywords.
* **Structured Output Schema**: Enforces JSON formatting containing:
  - Detected technologies and frameworks.
  - Demonstrated core competencies.
  - Alignment score against target Program Outcomes (`PO-1`, `PO-2`).
  - Suggested mentor feedback points.

---

## 🛠️ Technology Stack

| Layer / Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `18.3.1` | Declarative user interface library |
| **Frontend Tooling** | Vite | `5.4.21` | High-speed frontend build tool and development server |
| **Routing** | React Router DOM | `6.23.1` | Client-side routing with role-based route guards |
| **Styling** | Tailwind CSS | `3.4.3` | Utility-first responsive design system |
| **Icons** | Lucide React | `0.378.0` | Production icon library |
| **Backend Runtime** | Node.js | `>=20.18.0` | Server-side JavaScript runtime (ES Modules) |
| **API Framework** | Express.js | `4.19.2` | HTTP REST API server |
| **Database** | PostgreSQL | `16` | Relational multi-tenant database |
| **ORM Client** | Prisma ORM | `5.22.0` | Type-safe database queries and migration engine |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) | `9.0.2` | Stateless HMAC-SHA256 bearer tokens |
| **Password Hashing** | `bcryptjs` | `2.4.3` | Salted password hashing (10 rounds) |
| **Validation** | Zod | `3.23.8` | Runtime schema validation for requests and environment |
| **Security Headers** | Helmet | `7.1.0` | HTTP security headers (CSP, HSTS, frameguard) |
| **Language** | TypeScript | `5.4.5` | End-to-end static type safety across monorepo |
| **Test Runner** | Node.js Test Runner (`node:test`) | `Built-in` | Zero-dependency native automated test execution |
| **Frontend Hosting** | Vercel | `Cloud` | Edge network SPA hosting with routing rewrites |
| **Backend Hosting** | Render | `Cloud` | Managed web service and PostgreSQL database |
| **Containerization** | Docker & Compose | `3.8` | Multi-stage production container deployment |

---

## 📁 Project Structure

```text
internos-monorepo/
├── .github/
│   └── workflows/
│       └── ci-cd.yml                # Automated CI/CD pipeline (typecheck, tests, build)
├── apps/
│   ├── api/                         # Node.js + Express REST API
│   │   ├── src/
│   │   │   ├── config/              # Environment configuration & Zod schema validation
│   │   │   ├── controllers/         # HTTP request handlers (auth, student, mentor, admin)
│   │   │   ├── middleware/          # JWT auth, tenant isolation, error handling, logging
│   │   │   ├── routes/              # Express API routers (v1Router, studentRouter, etc.)
│   │   │   ├── services/            # Domain services (state machine, monitoring, analytics)
│   │   │   ├── app.ts               # Express application configuration
│   │   │   └── index.ts             # HTTP server entry point
│   │   ├── test/                    # 68 test suites covering phases 1–14 (278 tests)
│   │   ├── package.json             # @internos/api dependencies & scripts
│   │   └── tsconfig.json            # TypeScript configuration
│   └── web/                         # React 18 + Vite Frontend SPA
│       ├── src/
│       │   ├── components/          # Reusable UI components (Sidebar, Navbar, Modals)
│       │   ├── context/             # React contexts (AuthContext, ThemeContext)
│       │   ├── pages/               # Application views
│       │   │   ├── student/         # Student workspace (Overview, Milestones, Tasks, Submit)
│       │   │   ├── mentor/          # Mentor workspace (Overview, Interns, Review, Outcomes)
│       │   │   └── ...              # Admin, Login, Landing, and Registration pages
│       │   ├── services/            # API client and HTTP request helpers
│       │   ├── App.tsx              # Application routing root
│       │   └── main.tsx             # React DOM entry point
│       ├── package.json             # @internos/web dependencies & scripts
│       ├── vite.config.ts           # Vite bundler & alias configuration
│       └── vercel.json              # Subdirectory Vercel SPA rewrite configuration
├── packages/
│   ├── shared/                      # Shared business constants, errors, and utilities
│   │   ├── src/
│   │   └── package.json             # @internos/shared package definition
│   └── types/                       # Shared TypeScript interfaces, DTOs, and enums
│       ├── src/
│       └── package.json             # @internos/types package definition
├── prisma/
│   ├── migrations/                  # Versioned SQL migration history
│   ├── schema.prisma                # Complete relational schema definition (19 models)
│   └── seed.ts                      # Multi-tenant development seed script
├── docs/                            # Deep-dive architecture and technical specifications
│   ├── ARCHITECTURE.md              # System design & component interaction
│   ├── DATABASE.md                  # Schema dictionary, relations, and indexing
│   └── DEVELOPMENT.md               # Local developer onboarding guide
├── .env.example                     # Environment template with documented defaults
├── .node-version                    # Node.js version pin (20.18.0)
├── DEPLOYMENT.md                    # Cloud deployment guide (Vercel, Render, Railway)
├── Dockerfile                       # Multi-stage production container build
├── docker-compose.yml               # Local PostgreSQL container definition
├── docker-compose.prod.yml          # Production container orchestrator
├── package.json                     # Monorepo root workspace configuration
├── Procfile                         # PaaS process file (Render / Railway / Heroku)
├── railway.json                     # Railway deployment schema
├── render.yaml                      # Render Blueprint (Infrastructure-as-Code)
├── TEST_REPORT.md                   # Formal QA verification report
├── tsconfig.base.json               # Shared TypeScript compiler options
└── vercel.json                      # Root Vercel SPA build & routing configuration
```

---

## 🗄️ Database Architecture

InternOS uses PostgreSQL 16 managed through Prisma ORM. Every operational table includes an `organizationId` foreign key with composite indexes to enforce multi-tenant boundaries.

```mermaid
erDiagram
    Organization ||--o{ Department : contains
    Organization ||--o{ User : registers
    Organization ||--o{ Internship : governs
    Organization ||--o{ Milestone : defines
    Organization ||--o{ Document : stores
    Organization ||--o{ AuditLog : records

    Department ||--o{ User : employs
    Department ||--o{ StudentProfile : enrolls

    User ||--o| StudentProfile : has
    User ||--o{ Internship : assigned_as_student
    User ||--o{ Internship : supervises_as_mentor
    User ||--o{ Submission : authors
    User ||--o{ Review : writes

    Internship ||--o{ Milestone : structured_into
    Milestone ||--o{ Task : contains
    Task ||--o{ Submission : receives
    Submission ||--o{ Review : evaluated_by

    Internship ||--o{ Outcome : measures
    Internship ||--o{ Evaluation : finalized_by
```

### Key Relational Entities
* **`Organization`**: Multi-tenant root. Holds tenant configuration, domain restrictions, and academic year settings.
* **`Department`**: Academic unit (e.g., Computer Science, Electrical Engineering) scoping students and faculty.
* **`User`**: Base identity record with bcrypt password hash, status (`ACTIVE`, `SUSPENDED`), and role enum (`ADMIN`, `STUDENT`, `MENTOR`).
* **`Internship`**: Central governance model tracking student, mentor, company, start/end dates, progress percentage, and lifecycle status (`DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `ACTIVE`, `READY_FOR_COMPLETION`, `COMPLETED`).
* **`Milestone`**: Structural developmental phase defined by mentors/institutions.
* **`Task` / `WorkflowTask`**: Actionable work item containing title, due date, assigned mentor, expected evidence requirements, and status (`PENDING`, `SUBMITTED`, `CHANGES_REQUESTED`, `APPROVED`).
* **`Submission`**: Student deliverable record tracking evidence type, URLs, file attachments, version numbers, and submission history.
* **`Review`**: Mentor evaluation record capturing numeric scores, qualitative feedback, and decision (`APPROVED` vs `REVISION_REQUIRED`).
* **`Outcome`**: Learning outcome / Program Outcome (OBE) entity mapping competencies to expected and actual student proof.
* **`Document`**: Stored file metadata (offer letters, certificates, evaluation reports) with MIME type and byte size.
* **`AuditLog`**: Immutable security ledger capturing actor ID, action, entity, IP address, and tenant context.

---

## 🔐 Authentication & Authorization

### Token Architecture
* **Access Tokens**: Short-lived JSON Web Tokens signed with HMAC-SHA256 (`HS256`) containing `userId`, `email`, `role`, and `organizationId`.
* **Header Format**: Requests supply authentication via the standard HTTP header:
  ```text
  Authorization: Bearer <token>
  ```

### Role-Based Access Control (RBAC) Matrix

| Capability / API Scope | `ADMIN` | `STUDENT` | `MENTOR` |
| :--- | :---: | :---: | :---: |
| Self-Registration of Institution | ✅ | ❌ | ❌ |
| Manage Departments & Invites | ✅ | ❌ | ❌ |
| View Institutional Analytics & CSV Export | ✅ | ❌ | ❌ |
| Inspect Audit Trail | ✅ | ❌ | ❌ |
| Register Academic Internship | ❌ | ✅ | ❌ |
| Upload PDF Offer Letter | ❌ | ✅ | ❌ |
| Submit Task Evidence (PR, URL, PDF) | ❌ | ✅ | ❌ |
| Resubmit Evidence upon Revision Request | ❌ | ✅ | ❌ |
| View Personal Learning Outcomes | ❌ | ✅ | ❌ |
| Approve / Request Changes on Registrations | ❌ | ❌ | ✅ |
| Create Milestones & Assign Tasks | ❌ | ❌ | ✅ |
| Review Evidence (Accept / Request Revision) | ❌ | ❌ | ✅ |
| Submit Final Internship Evaluation | ❌ | ❌ | ✅ |
| Execute Academic Completion Sign-off | ✅ | ❌ | ❌ |

---

## 🛡️ Security

The following security controls are implemented server-side:

* **Server-Side Tenant Isolation**: The `tenantIsolation` middleware intercepts all requests to `/api/v1/*`. It derives tenant identity strictly from the authenticated JWT claims. Any `?organizationId=...` in request queries, bodies, or custom headers is rejected or overridden.
* **Cross-Tenant Boundary Enforcement**: Verified by automated test suites — users from Organization A receive HTTP `403 Forbidden` or `404 Not Found` if attempting to inspect or modify Organization B entities.
* **Password Hashing**: Passwords hashed with `bcryptjs` using 10 salt rounds; plaintext passwords are never logged or stored.
* **Input Validation**: All incoming requests validated against strict Zod schemas with unknown properties stripped.
* **HTTP Security Headers**: Powered by `helmet` configuring Content Security Policy (CSP), Strict-Transport-Security (HSTS), and `X-Frame-Options: DENY`.
* **Production CORS Policy**: In production, the backend rejects wildcard origins (`*`). Only the explicitly defined `FRONTEND_URL` is permitted.
* **Binary File Inspection**: Uploaded documents are verified by checking magic bytes (`%PDF-` / `0x25 0x50 0x44 0x46 0x2D`) to prevent executable file masking.

---

## 🔌 API Documentation

All API endpoints are prefixed with `/api/v1` (with public health checks available at `/api/health`).

### Authentication & Tenant Onboarding

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user with email and password; returns JWT token. |
| `POST` | `/api/v1/auth/activate` | Public | Activate an invited account using an activation token. |
| `POST` | `/api/v1/auth/logout` | Required | Invalidate user session and log out. |
| `GET` | `/api/v1/auth/me` | Required | Fetch authenticated user profile, role, and tenant context. |
| `POST` | `/api/v1/auth/invite` | Admin | Issue an invitation token for a new student or mentor. |
| `POST` | `/api/v1/tenants/register` | Public | Self-service institution registration creating a new tenant and admin. |
| `GET` | `/api/v1/tenants/current` | Required | Retrieve current organization settings and profile. |

### Student Workspace

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/student/overview` | Student | Retrieve student dashboard metrics, active internship, and progress. |
| `POST` | `/api/v1/student/register-internship` | Student | Register new academic internship with company details and offer letter. |
| `GET` | `/api/v1/student/milestones` | Student | List assigned milestones and completed task ratios. |
| `GET` | `/api/v1/student/milestones/:id` | Student | Inspect milestone details and actionable task list. |
| `GET` | `/api/v1/student/tasks` | Student | List all assigned tasks across milestones with statuses. |
| `GET` | `/api/v1/student/tasks/:id` | Student | Fetch specific task details, expected evidence, and review history. |
| `POST` | `/api/v1/student/tasks/:id/submissions` | Student | Submit actual evidence (PR URL, description, file attachment) for a task. |
| `GET` | `/api/v1/student/submissions` | Student | List all submissions and mentor review statuses. |
| `GET` | `/api/v1/student/feedback` | Student | List mentor feedback, scores, and revision notes. |
| `GET` | `/api/v1/student/outcomes` | Student | Track OBE Program Outcomes and evidence satisfaction. |
| `GET` | `/api/v1/student/documents` | Student | List stored documents (offer letters, certificates). |
| `GET` | `/api/v1/student/documents/:id/view` | Student | Stream PDF inline for interactive browser viewing. |
| `GET` | `/api/v1/student/documents/:id/download` | Student | Download authentic PDF document. |

### Mentor Workspace

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/mentor/overview` | Mentor | Operational feed of assigned interns, active tasks, and review queue. |
| `GET` | `/api/v1/mentor/interns` | Mentor | List assigned interns with progress percentages and company details. |
| `GET` | `/api/v1/mentor/registrations` | Mentor | List pending internship registrations awaiting mentor action. |
| `POST` | `/api/v1/mentor/registrations/:id/approve` | Mentor | Approve student internship registration (`PENDING_APPROVAL` → `APPROVED`). |
| `POST` | `/api/v1/mentor/registrations/:id/request-changes` | Mentor | Request changes on registration with feedback notes. |
| `POST` | `/api/v1/mentor/milestones` | Mentor | Author a new developmental milestone phase. |
| `POST` | `/api/v1/mentor/tasks` | Mentor | Assign an actionable task with explicit expected evidence requirements. |
| `GET` | `/api/v1/mentor/submissions` | Mentor | Review queue of student deliverables awaiting evaluation. |
| `POST` | `/api/v1/mentor/submissions/:id/review` | Mentor | Evaluate evidence: assign 1–5 score, feedback, and Approve or Request Revision. |
| `GET` | `/api/v1/mentor/outcomes` | Mentor | Inspect and verify learning outcome evidence by student. |
| `POST` | `/api/v1/mentor/evaluation` | Mentor | Submit final rubric evaluation for an intern. |

### Administration & Governance

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/admin/overview` | Admin | Institutional health metrics, active engagements, and risk alerts. |
| `GET` | `/api/v1/admin/departments` | Admin | List academic departments with student and mentor counts. |
| `POST` | `/api/v1/admin/departments` | Admin | Create a new academic department. |
| `GET` | `/api/v1/admin/users` | Admin | List institution users with filtering by role and status. |
| `POST` | `/api/v1/admin/users/invite` | Admin | Issue organization invite with activation token. |
| `POST` | `/api/v1/admin/users/import-csv` | Admin | Bulk import students from CSV file. |
| `GET` | `/api/v1/admin/audit-logs` | Admin | Retrieve chronological immutable security and operational audit trail. |
| `GET` | `/api/v1/admin/analytics` | Admin | Retrieve institutional analytics with multi-variable filtering. |
| `GET` | `/api/v1/admin/analytics/export` | Admin | Stream CSV export of filtered institutional dataset. |
| `POST` | `/api/v1/completion/complete` | Admin | Execute final academic completion sign-off once prerequisites pass. |

---

## 🔑 Environment Variables

### Backend Configuration (`apps/api`)

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | `development` | Target environment (`development`, `test`, `production`). |
| `PORT` | Yes | `4000` | HTTP listening port for Express server. |
| `API_URL` | Yes | `http://localhost:4000` | Canonical public backend URL. |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | Allowed origin for production CORS policy. |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string with SSL mode where applicable. |
| `JWT_SECRET` | Yes | — | Cryptographically secure random secret (min 32 characters). |
| `JWT_EXPIRES_IN` | No | `7d` | Access token lifespan. |
| `DEFAULT_ORGANIZATION_CODE` | No | `apex-inst` | Fallback tenant organization code for seed and local tests. |
| `STORAGE_DRIVER` | No | `local` | File storage backend (`local`, `s3`, `gcs`). |
| `STORAGE_LOCAL_UPLOAD_DIR` | No | `./uploads` | Storage directory when using local storage driver. |
| `STORAGE_MAX_FILE_SIZE_MB` | No | `25` | Maximum file upload limit in megabytes. |
| `STORAGE_ENDPOINT` | Conditional | — | S3 service endpoint (required if `STORAGE_DRIVER=s3`). |
| `STORAGE_BUCKET` | Conditional | — | Object storage bucket name. |
| `STORAGE_ACCESS_KEY` | Conditional | — | S3 IAM Access Key ID. |
| `STORAGE_SECRET_KEY` | Conditional | — | S3 IAM Secret Access Key. |
| `LLM_PROVIDER` | No | `openai` | AI advisory provider (`openai`, `anthropic`, `gemini`). |
| `LLM_API_KEY` | No | — | API key for advisory evidence analysis. |
| `LLM_MODEL` | No | `gpt-4o` | Language model identifier. |

### Frontend Configuration (`apps/web`)

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Yes | `http://localhost:4000` | Target backend REST API URL. |

---

## ⚙️ Installation

### Prerequisites
* **Node.js**: `v20.18.0` or higher (LTS recommended)
* **npm**: `v10.x` or higher
* **PostgreSQL**: `v16.x` (or Docker for local containerized DB)
* **Git**: `v2.x`

### 1. Clone the Repository
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

### 1. Environment Setup
Create the root `.env` file from the provided template:
```bash
cp .env.example .env
```
Update `.env` with your PostgreSQL connection string and a secure `JWT_SECRET`:
```bash
# Generate a secure 64-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Database Initialization
```bash
# Generate Prisma Client
npm run prisma:generate

# Apply migrations
npm run prisma:migrate:dev

# Seed multi-tenant demo data
npm run prisma:seed
```

---

## ▶️ Running Locally

### Start Full Stack (Concurrent)
```bash
npm run dev
```

### Start Services Individually
```bash
# Terminal 1: Backend API (port 4000)
npm run dev:api

# Terminal 2: Frontend Web SPA (port 5173)
npm run dev:web
```

### Pre-Configured Demo Accounts (Password: `Password123!`)

| Persona | Email | Tenant Code | Workspace Access |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@apex.edu` | `apex-inst` | Institutional Overview, Departments, Invites, Analytics |
| **Student** | `student@apex.edu` | `apex-inst` | Internship Execution, Tasks, Evidence Submission, Outcomes |
| **Industry Mentor** | `mentor@apex.edu` | `apex-inst` | Intern Supervision, Task Authoring, Review Queue |

---

## 🧪 Testing

InternOS features an automated test suite executed via the native Node.js test runner:

### Run Automated Backend Test Suite
```bash
npm run test
```
* **Coverage**: 278 tests across 68 test suites testing authentication, RBAC boundaries, state machine transitions, milestone workflows, evidence submissions, reviews, health scoring, CSV export, and PDF streaming.
* **Result**: `278 pass, 0 fail (100% passing)` in ~101 seconds.

### Run Workspace Typechecks
```bash
npm run typecheck
```

### Run Production Build Verification
```bash
npm run build
```

---

## 📸 Screenshots

> Screenshots will be added as the UI stabilizes.

---

## 🎥 Demo

* **Live Production Application**: [https://internos-web-tau.vercel.app](https://internos-web-tau.vercel.app)
* **Live Backend API**: [https://internos-api-gntk.onrender.com](https://internos-api-gntk.onrender.com)
* **API Health Check**: [https://internos-api-gntk.onrender.com/api/v1/health](https://internos-api-gntk.onrender.com/api/v1/health)
* **Self-Service Institution Onboarding**: [https://internos-web-tau.vercel.app/register-institution](https://internos-web-tau.vercel.app/register-institution)

---

## 🚀 Deployment

### A. Deploy Backend & PostgreSQL on Render (1-Click Blueprint)
The repository includes a ready-to-deploy [`render.yaml`](render.yaml) Infrastructure-as-Code blueprint:

1. Push your code to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Blueprint**.
3. Select your repository. Render automatically provisions:
   - `internos-db`: Managed PostgreSQL 16 database.
   - `internos-api`: Node.js web service running the Express API.
4. Click **Apply**.

### B. Deploy Frontend on Vercel
The repository includes [`vercel.json`](vercel.json) configured for single-page application routing:

1. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New...** → **Project**.
2. Import your GitHub repository.
3. Configure settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `apps/web` (or `./`)
   - **Environment Variable**: `VITE_API_URL` = `https://your-api-url.onrender.com`
4. Click **Deploy**.
5. Once deployed, set your Vercel URL as `FRONTEND_URL` on Render for CORS compliance.

---

## 🐳 Docker

InternOS includes a multi-stage production Dockerfile and Docker Compose orchestration:

### Build and Run with Docker Compose
```bash
# Build and run API and PostgreSQL in background
docker compose -f docker-compose.prod.yml up -d --build

# Inspect logs
docker compose -f docker-compose.prod.yml logs -f api

# Verify health
curl http://localhost:4000/api/v1/health
```

### Standalone Docker Build
```bash
docker build -t internos-api .
docker run -p 4000:4000 --env-file .env internos-api
```

---

## 📊 Current Project Status

| Module / Subsystem | Status | Details |
| :--- | :---: | :--- |
| **Authentication & Multi-Tenant RBAC** | ✅ Complete | JWT authentication, bcrypt passwords, tenant isolation. |
| **Student Workspace** | ✅ Complete | Internship registration, task evidence submission, PDF viewing, outcomes. |
| **Mentor Workspace** | ✅ Complete | Intern supervision, registration approval, task assignment, review queue. |
| **Admin Governance** | ✅ Complete | Department management, invites, CSV student import, audit logging. |
| **Institutional Analytics & CSV Export** | ✅ Complete | Real-time multi-variable filtering and structured CSV export. |
| **State Machine Engine** | ✅ Complete | 16 valid transitions with strict prerequisite guards. |
| **Document Pipeline & PDF Streaming** | ✅ Complete | MIME and magic-byte checks (`%PDF-`) with inline streaming. |
| **Deterministic Health Engine** | ✅ Complete | Pure-code scoring for `ON_TRACK`, `ATTENTION`, and `CRITICAL`. |
| **Advisory AI Intelligence** | 🟡 In Progress | Non-blocking advisory pipeline; LLM integration ready. |
| **Cloud Deployment** | ✅ Complete | Live on Vercel (Frontend SPA) and Render (API + PostgreSQL). |
| **Automated Testing Suite** | ✅ Complete | 278/278 tests passed across 68 suites. |

---

## 🗺️ Roadmap

### Completed
- [x] Multi-tenant relational schema with PostgreSQL and Prisma ORM.
- [x] Context-preserving task evidence submission route (`/tasks/:taskId/submit`).
- [x] Streamlined role model: Student, Mentor, and Admin (removed legacy HOD/Faculty bottlenecks).
- [x] Interactive PDF offer letter upload, validation, and streaming.
- [x] Outcome-Based Education (OBE) Program Outcome mapping.
- [x] Dynamic institutional analytics with live multi-variable filters and CSV export.
- [x] Self-service institution onboarding and secure organization invite workflow.
- [x] Production cloud deployment on Vercel and Render with automated CI/CD.

### In Progress
- [ ] Direct LLM provider integration testing for live automated evidence summarization.
- [ ] Webhook notifications for Slack and Microsoft Teams.

### Planned
- [ ] Biometric/geolocation check-ins for on-premise internship attendance.
- [ ] LTI 1.3 standard compliance for direct integration with Canvas and Blackboard LMS.
- [ ] Automated plagiarism scanning for submitted technical reports.

### Future Scope
- [ ] Cross-institutional student credential passport with verifiable digital credentials.
- [ ] Native mobile application (React Native / Expo) for iOS and Android.

---

## ⚠️ Limitations

* **Advisory-Only AI**: The AI subsystem is strictly advisory and does not replace human mentor evaluation or grade submissions.
* **Storage Driver Default**: Default installation uses local storage. Production deployments with ephemeral container instances should configure S3/R2 storage via `STORAGE_DRIVER=s3`.
* **Single Active Institution per Session**: Users belonging to multiple institutions must sign in with distinct credentials per organization tenant.
* **Non-Interactive PDF Annotation**: The current PDF viewer supports authenticated streaming and downloads; in-browser document markup/annotation is not yet implemented.

---

## 🔮 Future Scope

* **LMS Interoperability**: Direct gradebook synchronization with Canvas, Blackboard, and Moodle via LTI 1.3 Advantage.
* **Mobile-First App**: Dedicated offline-capable mobile companion for students logging daily activities from field sites.
* **Advanced OBE Rubric Engine**: Multi-dimensional rubrics with custom institutional outcome weightings.
* **Company Partner Portal**: Dedicated corporate interface for company HR coordinators to manage internship requisitions across multiple universities.

---

## 🤝 Contributing

Contributions are welcome from the community. Follow this workflow:

1. **Fork** the repository on GitHub.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit Your Changes**:
   ```bash
   git commit -m "feat: implement concise feature description"
   ```
4. **Execute Verification Tests**:
   ```bash
   npm run typecheck
   npm run test
   ```
5. **Push to GitHub**:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request** against the `main` branch with a description of changes.

---

## 🐛 Issue Reporting

If you encounter a bug, security vulnerability, or feature request:
1. Check existing [GitHub Issues](https://github.com/innocentgaming/Hack-2-Ignite-team_37/issues) to prevent duplicates.
2. Open a new issue providing:
   - Clear description of the unexpected behavior.
   - Step-by-step reproduction steps.
   - Expected outcome vs actual outcome.
   - Relevant browser console or server log snippets.

---

## 📜 License

No open-source license has currently been specified. All rights reserved.

---

## 👨‍💻 Contributors

Developed by the **Hack-2-Ignite-team_37** engineering team.

---

## 🙏 Acknowledgements

InternOS is built using open-source libraries and platforms:
* [React](https://react.dev/) & [Vite](https://vitejs.dev/)
* [Express](https://expressjs.com/) & [Node.js](https://nodejs.org/)
* [Prisma](https://www.prisma.io/) & [PostgreSQL](https://www.postgresql.org/)
* [Tailwind CSS](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
* [Zod](https://zod.dev/) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
* [Vercel](https://vercel.com/) & [Render](https://render.com/)

---

## 📚 Additional Documentation

* [Architecture & Design Guide](docs/ARCHITECTURE.md)
* [Database Schema & ERD Dictionary](docs/DATABASE.md)
* [Local Development Guide](docs/DEVELOPMENT.md)
* [Cloud Deployment Guide](DEPLOYMENT.md)
* [Quality Assurance & Test Report](TEST_REPORT.md)

---

## 📞 Contact

For inquiries, issue tracking, and contributions, visit the repository:  
**[https://github.com/innocentgaming/Hack-2-Ignite-team_37](https://github.com/innocentgaming/Hack-2-Ignite-team_37)**
