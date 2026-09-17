# InternOS — Multi-Tenant Smart Internship Intelligence Operating System

> **Enterprise Multi-Tenant Internship Management, Workflow Automation & Outcome-Based Education (OBE) Monitoring Platform**  
> Engineered for higher-education academic institutions, faculty supervisors, industry corporate mentors, and students.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.x-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb?logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.19.2-black?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-147%20Passed-brightgreen)](https://nodejs.org/api/test.html)

---

## 🚀 Overview

**InternOS** is a production-grade, multi-tenant internship intelligence and monitoring operating system built to streamline and govern the complete university-industry internship lifecycle. Academic institutions frequently struggle to oversee student industrial training, track milestone deliverables across hundreds of companies, verify rubric-based educational outcomes (such as ABET / NBA Program Outcomes), and maintain strict compliance.

InternOS bridges this communication and governance gap by providing a unified, secure platform where:
* **Academic Institutions & HODs** oversee department-wide internship performance, manage faculty workloads, configure custom multi-stage approval workflows, and resolve operational bottlenecks via a deterministic health engine.
* **Faculty Supervisors** monitor student progress, review deliverable submissions, approve extensions, and perform academic completion sign-offs.
* **Industry Corporate Mentors** review student technical deliverables through multi-version feedback loops, raise concerns, and submit structured final evaluations based on customizable 100-point rubrics.
* **Students** discover assigned workflow tasks, upload multi-file project deliverables, track review statuses, resolve revision requests, and access their immutable completed internship dossier.

InternOS is architectured as a clean TypeScript monorepo with strict multi-tenant data isolation (`organizationId` scoping), a deterministic 16-transition finite state machine, a pure-code (zero-hallucination) health calculation engine, and a 4-prerequisite completion gate.

---

## 🎯 Problem Statement

Higher-education institutions and vocational colleges face structural challenges when coordinating student off-campus internships:

* **Manual & Fragmented Workflows**: Universities rely on scattered email chains, physical paperwork, unversioned PDF uploads, and ad-hoc chat groups to track off-campus students.
* **Zero Real-Time Monitoring & Inactivity Risk**: Faculty coordinators discover student issues, host-company dropouts, or absent mentors weeks or months after they occur, jeopardizing semester credits.
* **Lack of Outcome-Based Education (OBE) Alignment**: Accreditation bodies (ABET, NBA, NAAC) require measurable Program Outcomes (POs) and Course Outcomes (COs). Traditional tools fail to link daily student deliverables to academic rubrics.
* **Subjective & Unstandardized Evaluation**: Mentor grading often lacks structured rubrics, resulting in inconsistent scoring across different companies and academic departments.
* **Missing Multi-Tenancy for Consortiums**: Academic groups operating multiple autonomous campuses require centralized platform governance without leaking student or employer data across institutional boundaries.
* **Silent & Incomplete Completions**: Students often get cleared for graduation without formal industry verification, missing required milestone reports, or lacking explicit faculty approval.

---

## 💡 Proposed Solution

InternOS solves these systemic inefficiencies through a modular, deterministic, and verifiable architectural design:

* **Multi-Tenant Architecture**: Every database model and HTTP transaction is strictly anchored to an `Organization` tenant root, preventing cross-institutional data leakage.
* **Deterministic Internship State Machine**: A 16-rule state engine (`DRAFT` → `PENDING_APPROVAL` → `APPROVED` → `ACTIVE` → `READY_FOR_COMPLETION` → `COMPLETED`) with role-authorized transitions and mandatory audit logging.
* **Configurable Workflow Engine**: Dynamic milestone templates with configurable steps (`SUBMISSION`, `REVIEW`, `EVALUATION`, `APPROVAL`), frequency, deadlines, mark allocations, and late submission policies.
* **Versioned Submissions & Document Vault**: Multi-version deliverable history (`DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `ACCEPTED` / `REVISION_NEEDED`) with isolated file storage and structured mentor criteria scoring.
* **Deterministic Health & Attention Engine**: A 100% code-driven monitoring engine that computes `ON_TRACK`, `ATTENTION`, or `CRITICAL` statuses from overdue tasks, inactive days, and open mentor concerns—without unpredictable AI hallucinations.
* **4-Prerequisite Completion Engine**: A strict completion barrier ensuring that an internship cannot reach `COMPLETED` unless:
  1. All required milestone submissions are uploaded.
  2. All milestone deliverables have accepted mentor reviews.
  3. The mentor has submitted a structured final rubric evaluation (/100).
  4. The faculty supervisor has digitally signed off on academic confirmation.
* **Comprehensive Audit Trail**: Security-critical actions, status changes, deadline extensions, and account activations are recorded in an append-only audit log.

---

## 👥 Target Users

| Role | System Identifier | Primary Purpose | Key Platform Capabilities |
|---|---|---|---|
| **Super Admin** | `SUPER_ADMIN` / `ADMIN` | Platform-wide governance | Multi-tenant administration, cross-institution analytics, global system health monitoring. |
| **Institution Admin** | `INSTITUTION_ADMIN` / `ADMIN` | Institutional operations | Department creation, HOD assignment, bulk student CSV onboarding, custom workflow templating, audit logging. |
| **Head of Department (HOD)** | `HOD` | Departmental leadership | Internship registration approval/rejection, faculty supervisor allocation, department attention queue monitoring, termination decisions. |
| **Faculty Supervisor** | `FACULTY_SUPERVISOR` / `FACULTY` | Academic guidance & sign-off | Supervised cohort dashboard, deliverable verification, deadline extension grants, final academic completion confirmation. |
| **Industry Mentor** | `INDUSTRY_MENTOR` / `MENTOR` | Corporate guidance & review | Technical milestone reviews, criteria-based deliverable scoring, revision requests, mentor concern flagging, 100-point final evaluation. |
| **Student** | `STUDENT` | Training execution & evidence submission | Internship registration, task submission uploads (PDF, code, archives), version resubmission, progress tracking, completed dossier access. |

---

## ✨ Key Features

### 1. Authentication & Multi-Tenant RBAC
* **Stateless JWT Security**: HMAC-SHA256 signed JSON Web Tokens carrying user identity, active role, and organization scope.
* **Multi-Tenant Isolation**: Middleware verifies tenant alignment against database queries, preventing cross-tenant leakage.
* **5-Role Hierarchy**: Granular permission mapping (`ROLE_PERMISSIONS`) covering 33 distinct system actions.
* **Token Invite System**: Admin/HOD invites users via time-limited cryptographically secure tokens; users self-activate and set bcrypt-hashed passwords.
* **Token Revocation**: Dedicated logout mechanism revokes active tokens.

### 2. Institution Administration & User Management
* **Department Registry**: CRUD operations for academic departments with dynamic HOD assignment.
* **User Management**: Filtered user rosters, role reassignment, and account status toggling (`ACTIVE`, `INACTIVE`, `SUSPENDED`).
* **CSV Bulk Student Onboarding**: 3-stage transactional import pipeline (`Preview` → `Validate` → `Confirm`) with automatic roll number collision checks.
* **Institution Settings**: Configurable academic year, domain restrictions, and evaluation rules.
* **Immutable Audit Trail**: Filterable event log capturing actor ID, IP address, timestamp, entity affected, and change details.

### 3. Configurable Workflow Engine
* **Workflow Template Builder**: Define custom academic tracks with sequential or stage-based milestones (`ONBOARDING`, `MID_TERM`, `FINAL`).
* **Granular Step Configurations**: Step types (`SUBMISSION`, `REVIEW`, `EVALUATION`, `APPROVAL`), assigned actor role, deadline offsets (days from start), marks, and late submission policies.
* **Workflow Instantiation**: Automatically binds an active template to an approved internship engagement.
* **Authorized Deadline Extensions**: Faculty or HOD can grant task extensions with documented justifications recorded in the audit log.

### 4. Internship Lifecycle & State Machine
* **Internship Registration**: Students submit detailed training profiles including company details, faculty advisor, dates, and expected learning outcomes.
* **Strict State Transition Rules**: Formally validated 16-rule state engine prohibiting invalid or unauthorized state jumps.
* **Faculty & Mentor Allocation**: Explicit assignment of academic supervisors and verified corporate mentors.
* **Outcome Versioning**: Track updates and revisions to educational Program Outcomes throughout the engagement.

### 5. Role-Specific Workspaces
* **Student Workspace**: Overview of active milestones, upcoming deadlines, pending revision notices, and overall completion percentage.
* **Faculty Workspace**: Supervised student roster, pending review backlog, department alerts, and direct review shortcuts.
* **HOD Workspace**: Departmental health analytics, faculty supervisory distribution, pending internship approval queue.
* **Mentor Workspace**: Assigned corporate interns, pending milestone reviews, quick-scoring interfaces, and concern raising tools.
* **Mentor Concern System**: Structured flagging mechanism (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL` severity) to immediately alert faculty and HODs.

### 6. Versioned Submissions, Files & Mentor Reviews
* **Multi-Version Deliverables**: If a mentor requests changes, the student uploads a new version while preserving complete version history.
* **Private Multi-File Uploads**: Isolated file management supporting project reports, source archives, and evaluation evidence.
* **Criteria-Based Rubric Reviews**: Mentors evaluate submissions against itemized criteria with individual marks and qualitative feedback.
* **Submission Lifecycle**: `DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `ACCEPTED` / `REVISION_NEEDED`.
* **Chronological Deliverable Timeline**: Visual timeline reconstructing submission revisions, feedback entries, and mentor actions.

### 7. Deterministic Monitoring & Health Engine
* **Zero-Hallucination Health Scoring**: Health statuses (`ON_TRACK`, `ATTENTION`, `CRITICAL`) computed purely from concrete operational metrics.
* **Configurable Evaluation Rules**: Customizable thresholds for overdue task days, pending review days, inactivity periods, and open mentor concerns.
* **Prioritized Attention Queue**: Institution-wide triage dashboard highlighting internships requiring urgent academic or administrative intervention.
* **Full Lifecycle Timeline Reconstruction**: Comprehensive event stream aggregating state transitions, submissions, reviews, and extensions.

### 8. Final Evaluation & Completion Engine
* **100-Point Mentor Rubric Evaluation**: Structured final rubric scoring with configurable criteria (max marks, awarded marks, comments), automated total calculation, percentage, and letter grade (`A+`, `A`, `B`, `C`, `F`).
* **4-Prerequisite Completion Verification**: Non-bypassable prerequisite engine returning exact missing requirements:
  * Milestone submissions verified.
  * Milestone reviews accepted.
  * Final mentor evaluation recorded.
  * Faculty academic sign-off confirmed.
* **Faculty Academic Confirmation**: Final institutional sign-off capturing credits awarded, supervisor recommendations, and academic notes.
* **Comprehensive Student Dossier**: Consolidated permanent record containing company details, supervisor notes, evidence documents, rubric scores, letter grades, and audit history.
* **Governed Termination & Cancellation**: Structured termination requests by mentors with HOD approval, and documented student cancellations.

### 9. Evidence-Based AI Intelligence Layer (Advisory)
* **Advisory AI Philosophy**: AI acts strictly as an advisory intelligence layer. AI never autonomously approves, rejects, marks competencies, determines health, or blocks academic workflows.
* **Selective Deliverable Ingestion**: Analyzes major milestone submissions and monthly reports; purposefully ignores micro-diary entries to prevent noise.
* **Structured Extraction**: Extracts activities, technologies, verified skills, and concrete evidence snippets mapped against expected educational Program Outcomes.
* **Objective Evidence Language Rules**: Strict institutional policy enforcement—uses *"No evidence found in submitted work."* and expressly prohibits biased assumptions like *"Student does not know"*.
* **Fault-Tolerant Resilience**: Upstream timeouts or JSON format errors gracefully mark analysis as `FAILED` without failing the underlying student submission or workflow.

### 10. In-App Notifications, Institutional Audit Logging & Secure Document Management
* **Interactive In-App Notification Center**: Real-time notification center in the navigation header featuring unread count badge, time-ago formatting, category icons, and single/bulk mark-as-read.
* **Lifecycle Event Triggers**: Dispatches structured in-app notifications on key institutional events:
  * Internship submitted, approved, and rejected
  * Industry mentor and faculty coordinator assignments
  * Milestone tasks due and overdue
  * Mentor revision requested and review completed
  * Final rubric evaluation completed and academic completion confirmed
  * Termination requested and approved
* **Institutional Action Audit Trail**: Append-only tamper-evident audit log recording actor, organization, action, entity, entity ID, timestamp, and metadata for institutional compliance.
* **Sensitive Information Redaction**: Automated sanitization pipeline that redacts passwords, tokens, API keys, credentials, and authorization headers from audit logs.
* **Private-by-Default Secure Document Management**: Document metadata stored in PostgreSQL/in-memory store with binary assets stored in isolated object storage. Files are private by default, requiring backend RBAC authorization and tenant checks for streaming access.

---

## 🏗️ System Architecture

InternOS is architectured as a multi-tier modular monorepo. Presentation, business logic, persistence, shared contracts, and domain types are strictly decoupled.

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Presentation Layer (React 18 + Vite)"]
        UI["Web SPA (Tailwind CSS + Lucide Icons)"]
        Router["React Router v6 (Role-Guarded Routes)"]
        Context["Auth & Toast Providers"]
        APIClient["Axios/Fetch HTTP Client (JWT Interceptor)"]
        UI --> Router
        Router --> Context
        Context --> APIClient
    end

    subgraph APILayer["Backend Application Layer (Express + TypeScript)"]
        MW_RateLimit["Rate Limiter Middleware"]
        MW_Auth["JWT Authentication Middleware"]
        MW_Tenant["Tenant Isolation Engine"]
        MW_RBAC["RBAC Permission Guard (33 Permissions)"]
        Router_V1["API v1 Router (/api/v1/*)"]
        
        APIClient --> MW_RateLimit
        MW_RateLimit --> MW_Auth
        MW_Auth --> MW_Tenant
        MW_Tenant --> MW_RBAC
        MW_RBAC --> Router_V1
    end

    subgraph ServiceLayer["Core Domain & Service Engines"]
        S_Auth["Auth & User Service"]
        S_Admin["Admin & CSV Import Service"]
        S_Workflow["Workflow Engine"]
        S_State["Internship State Machine"]
        S_Sub["Submission & Review Service"]
        S_Health["Deterministic Health Engine"]
        S_Comp["Completion & Evaluation Engine"]
        S_Audit["Audit Logging Service"]
        S_Storage["IStorageService (Local / Cloud Ready)"]
        S_AIStub["IAIService (Phase 0-8 Interface Abstraction)"]
        
        Router_V1 --> S_Auth
        Router_V1 --> S_Admin
        Router_V1 --> S_Workflow
        Router_V1 --> S_State
        Router_V1 --> S_Sub
        Router_V1 --> S_Health
        Router_V1 --> S_Comp
        Router_V1 --> S_Audit
        Router_V1 --> S_Storage
        Router_V1 --> S_AIStub
    end

    subgraph DataLayer["Persistence & Storage Layer"]
        PrismaORM["Prisma ORM (20 Relational Models)"]
        PostgresDB[("PostgreSQL 16 Database")]
        FileStorage[("File Storage (uploads/{organizationId}/*)")]
        
        S_Auth --> PrismaORM
        S_Admin --> PrismaORM
        S_Workflow --> PrismaORM
        S_State --> PrismaORM
        S_Sub --> PrismaORM
        S_Health --> PrismaORM
        S_Comp --> PrismaORM
        S_Audit --> PrismaORM
        S_Storage --> FileStorage
        PrismaORM --> PostgresDB
    end
```

### Architectural Layers Explained

1. **Client Presentation Layer (`apps/web`)**: Single Page Application built on React 18 and Vite. Uses Tailwind CSS for a custom dark-mode design system. Incorporates role-filtered navigation, modal workflows, dynamic data tables, and client-side form validation.
2. **API & Security Gateway (`apps/api`)**: Node.js/Express server mounted under `/api/v1/*`. Requests flow through a security pipeline: Rate Limiting → JWT Authentication → Cross-Tenant Boundary Verification → RBAC Permission Checking → Zod Schema Validation.
3. **Core Domain Service Engines (`apps/api/src/services`)**: Business logic is separated into independent services. State transitions and health evaluations run deterministically through pure-code algorithms.
4. **Shared Types & Contracts (`packages/types`, `packages/shared`)**: Single source of truth for TypeScript interfaces, Enums, DTOs, standard API response envelopes, and error hierarchies (`AppError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `TenantViolationError`).
5. **Persistence & Multi-Tenant Storage Layer (`prisma`)**: PostgreSQL 16 managed via Prisma ORM. Strict multi-tenant indexing ensures all queries filter on `organizationId`. Files are organized on disk or cloud object storage scoped by tenant ID.

---

## 🔄 System Workflow

### 1. Student Registration to Internship Commencement

```mermaid
flowchart TD
    A["Student creates Draft Registration"] --> B["Submit Registration for Approval"]
    B --> C{"HOD / Admin Review"}
    C -- "Rejected (Feedback Provided)" --> D["Status: REJECTED (Student Re-opens Draft)"]
    D --> A
    C -- "Approved" --> E["Status: APPROVED"]
    E --> F["HOD Assigns Faculty Supervisor & Mentor"]
    F --> G["Admin/HOD Binds Workflow Template"]
    G --> H["Status: ACTIVE (Internship Commenced)"]
    H --> I["Workflow Tasks Generated with Deadlines"]
```

### 2. Milestone Deliverable & Multi-Version Review Workflow

```mermaid
flowchart TD
    A["Student Views Active Workflow Task"] --> B["Student Uploads Report/Files (Version 1)"]
    B --> C["Task Status: SUBMITTED"]
    C --> D["Mentor Inspects Deliverable & Files"]
    D --> E{"Mentor Review Decision"}
    E -- "Changes Requested" --> F["Status: REVISION_NEEDED (Feedback Logged)"]
    F --> G["Student Uploads New Version (Version 2)"]
    G --> D
    E -- "Accepted & Scored" --> H["Status: ACCEPTED"]
    H --> I["Task Status: APPROVED"]
    I --> J["Deterministic Health Engine Updates: ON_TRACK"]
```

### 3. Final Evaluation & 4-Prerequisite Completion Gate

```mermaid
flowchart TD
    A["All Milestone Tasks Completed"] --> B["Internship Status: READY_FOR_COMPLETION"]
    B --> C["Mentor Submits Final 100-Point Evaluation Rubric"]
    C --> D["Automated Grade Computed: Total, %, Letter Grade (A+, A, B, C, F)"]
    D --> E["Faculty Initiates Completion Sign-Off"]
    E --> F{"Completion Engine Prerequisite Verification"}
    F -- "Missing Prerequisites (Incomplete tasks, pending reviews, no evaluation)" --> G["HTTP 400 Rejected (Exact Missing Reasons Listed)"]
    F -- "All 4 Prerequisites Verified" --> H["Faculty Confirms Academic Credits & Sign-Off"]
    H --> I["Status: COMPLETED"]
    I --> J["Final Dossier Generated (Permanent Academic Record)"]
```

---

## 🧠 AI / ML Architecture

InternOS enforces a clear distinction between deterministic business rules and generative intelligence:

* **Current Implementation (Phase 0–8)**: Core health calculation, state progression, and evaluation grading are **100% deterministic code**. This guarantees predictable, reproducible, and verifiable institutional grading without LLM hallucination risks.
* **AI Service Abstraction (`IAIService`)**: Located in [`apps/api/src/services/ai.service.ts`](apps/api/src/services/ai.service.ts), the codebase defines an extensible, provider-agnostic interface ready for future LLM integration without altering route handlers or business logic:

```typescript
export interface IAIService {
  analyzeSubmission(request: AISubmissionAnalysisRequest): Promise<AISubmissionAnalysisResponse>;
  mapInternshipOutcomes(request: AIOutcomeMappingRequest): Promise<AIOutcomeMappingResponse>;
  recommendRubric(request: AIRubricRecommendationRequest): Promise<AIRubricRecommendationResponse>;
}
```

```mermaid
flowchart LR
    subgraph CurrentRuntime["Current Production Runtime (Phases 0-8)"]
        Req["Student Submission"] --> DetEngine["Deterministic Health & Rules Engine"]
        DetEngine --> Out["Verifiable Metrics & Rubric Scores"]
    end

    subgraph PlannedAILayer["Future AI Capability Layer (Interface Defined)"]
        AI_Req["Deliverable Text & Code"] --> AI_Adapter["IAIService Adapter (OpenAI / Gemini / Claude / Ollama)"]
        AI_Adapter --> AI_Analysis["Automated Rubric Suggestion & Plagiarism Analysis"]
        AI_Analysis --> AI_Model[("AIAnalysis Prisma Model")]
    end
```

* **Planned LLM Capabilities (Future Scope)**:
  1. Automated semantic matching between student weekly reports and ABET/NBA Program Outcomes.
  2. Synthesizing draft rubric feedback for industry mentors based on technical submissions.
  3. Anomaly detection for copy-pasted or unoriginal student milestone deliverables.
* **Database Preparation**: The Prisma schema already includes the `model AIAnalysis` entity with composite indexing `[organizationId, submissionId]` to support future automated reviews seamlessly.

---

## 🛠️ Technology Stack

| Category | Technology | Version | Purpose & Implementation Details |
|---|---|---|---|
| **Monorepo Architecture** | npm Workspaces | v10+ | Orchestrates multi-package repository (`apps/*`, `packages/*`). |
| **Frontend Framework** | React | 18.3.1 | Component-driven Single Page Application (SPA). |
| **Frontend Language** | TypeScript | 5.4.5 | Type-safe user interfaces and API client integrations. |
| **Frontend Tooling** | Vite | 5.2.11 | Fast local development server, HMR, and optimized production bundling. |
| **Frontend Routing** | React Router DOM | 6.23.1 | Declarative, role-guarded client-side routing. |
| **Styling & Design System** | Tailwind CSS | 3.4.3 | Responsive dark-mode styling with custom typography and color tokens. |
| **Icons** | Lucide React | 0.378.0 | Consistent iconography across dashboards, badges, and modals. |
| **Backend Runtime** | Node.js | >=20.x | High-performance asynchronous server runtime. |
| **Backend Framework** | Express | 4.19.2 | RESTful routing, middleware orchestration, and HTTP lifecycle management. |
| **Backend Language** | TypeScript | 5.4.5 | Strict-mode backend compilation with ES Modules. |
| **Database** | PostgreSQL | 16-alpine | Production relational database with ACID compliance. |
| **ORM & Migrations** | Prisma ORM | 5.22.0 | Schema modeling, migration deployment, and type-safe database queries. |
| **Authentication** | JSON Web Tokens | 9.0.2 | Stateless HMAC-SHA256 authentication tokens. |
| **Password Security** | bcryptjs | 2.4.3 | Adaptive one-way password hashing (10 salt rounds). |
| **Validation** | Zod | 3.23.8 | Schema declaration and strict runtime request validation. |
| **Security Headers** | Helmet | 7.1.0 | Sets HTTP security response headers. |
| **CORS** | cors | 2.8.5 | Configurable Cross-Origin Resource Sharing middleware. |
| **File Storage** | Custom Local / Cloud | Abstracted | Multi-tenant filesystem storage (`uploads/{organizationId}/*`), S3/GCS ready. |
| **Testing Framework** | Node.js Test Runner | `node:test` via `tsx` | Native zero-dependency unit and integration test runner. |
| **Containerization** | Docker Compose | 3.8 | Containerized PostgreSQL 16 database with persistent volumes. |
| **Code Quality** | ESLint & Prettier | 8.57 / 3.2 | Code style enforcement, linting, and formatting. |

---

## 📁 Project Structure

```text
internos/
├── apps/
│   ├── api/                                # Backend REST API Application
│   │   ├── src/
│   │   │   ├── app.ts                      # Express application setup, middleware pipeline
│   │   │   ├── index.ts                    # HTTP server bootstrap & port listener
│   │   │   ├── config/                     # Environment configuration & Zod env validation
│   │   │   ├── controllers/                # 9 Express HTTP Controllers
│   │   │   │   ├── admin.controller.ts     # Institution, departments, users & CSV import
│   │   │   │   ├── auth.controller.ts      # Login, logout, invite & activation
│   │   │   │   ├── completion.controller.ts# 4-Prerequisite checks, evaluation & dossiers
│   │   │   │   ├── internship.controller.ts# Registration, approval & assignments
│   │   │   │   ├── monitoring.controller.ts# Health engine, overview & attention queue
│   │   │   │   ├── submission.controller.ts# File uploads, versioning & reviews
│   │   │   │   ├── tenant.controller.ts    # Tenant-scoped data retrieval
│   │   │   │   ├── workflow.controller.ts  # Templates, tasks & extensions
│   │   │   │   └── workspace.controller.ts # Role dashboards & mentor concerns
│   │   │   ├── middleware/                 # Express middleware suite
│   │   │   │   ├── auth.ts                 # JWT extraction & identity verification
│   │   │   │   ├── errorHandler.ts         # Centralized error mapping & formatting
│   │   │   │   ├── rateLimiter.ts          # Window-based IP request rate limiting
│   │   │   │   ├── rbac.ts                 # Role & permission authorization guards
│   │   │   │   ├── requestLogger.ts        # Request auditing & timing logger
│   │   │   │   ├── tenantIsolation.ts      # Multi-tenant boundary enforcement
│   │   │   │   └── validator.ts            # Zod request body validation
│   │   │   ├── routes/                     # Mounted REST route handlers (/api/v1/*)
│   │   │   │   ├── admin.router.ts         # Administration & CSV endpoints
│   │   │   │   ├── auth.router.ts          # Authentication endpoints
│   │   │   │   ├── completion.router.ts    # Evaluation & completion endpoints
│   │   │   │   ├── health.router.ts        # Health check router
│   │   │   │   ├── internship.router.ts    # Internship lifecycle endpoints
│   │   │   │   ├── monitoring.router.ts    # Monitoring & health endpoints
│   │   │   │   ├── submission.router.ts    # Deliverable submission & review endpoints
│   │   │   │   ├── tenant.router.ts        # Tenant overview endpoints
│   │   │   │   ├── v1.router.ts            # Root v1 aggregator
│   │   │   │   ├── workflow.router.ts      # Workflow template & task endpoints
│   │   │   │   └── workspace.router.ts     # Workspace & dashboard endpoints
│   │   │   ├── services/                   # Core business logic services
│   │   │   │   ├── ai.service.ts           # IAIService interface abstraction
│   │   │   │   ├── audit.service.ts        # Security audit log writer
│   │   │   │   ├── auth.service.ts         # Token issuance & user authentication
│   │   │   │   ├── completion.service.ts   # 4-Prerequisite verification & dossier builder
│   │   │   │   ├── csvImport.service.ts    # Multi-stage CSV parsing & validation
│   │   │   │   ├── health-calculation.service.ts # Deterministic health scoring engine
│   │   │   │   ├── internship-state-machine.service.ts # 16-rule state engine
│   │   │   │   ├── internship.service.ts   # Internship operations & storage
│   │   │   │   ├── monitoring.service.ts   # Timeline reconstruction & attention queue
│   │   │   │   ├── storage.service.ts      # IStorageService local filesystem provider
│   │   │   │   ├── submission.service.ts   # Deliverable versioning & criteria reviews
│   │   │   │   ├── tenant.service.ts       # Tenant configuration & department logic
│   │   │   │   ├── workflow.service.ts     # Workflow template builder & task engine
│   │   │   │   └── workspace.service.ts    # Workspace aggregates & mentor concerns
│   │   │   └── types/                      # Backend-internal type declarations
│   │   ├── test/                           # Comprehensive test suite (124 tests)
│   │   │   ├── phase1-auth-rbac.test.ts    # Auth, JWT, invite & activation tests
│   │   │   ├── phase2-admin-csv.test.ts    # Department, user & CSV import tests
│   │   │   ├── phase3-workflow-engine.test.ts # Workflow template & task extension tests
│   │   │   ├── phase4-internship-lifecycle.test.ts # State machine & lifecycle tests
│   │   │   ├── phase5-role-workspaces.test.ts # Workspace, role dashboards & concerns
│   │   │   ├── phase6-submissions-reviews.test.ts # Versioning, files & mentor reviews
│   │   │   ├── phase7-monitoring-health.test.ts # Deterministic health calculation tests
│   │   │   ├── phase8-completion-evaluation.test.ts # 4-Prerequisite gating & dossier tests
│   │   │   └── tenant-isolation-rbac.test.ts # Cross-tenant attack & isolation tests
│   │   └── package.json                    # API package dependencies & test scripts
│   │
│   └── web/                                # Frontend Single Page Application
│       ├── src/
│       │   ├── App.tsx                     # Top-level React routing & layout tree
│       │   ├── main.tsx                    # React DOM entrypoint
│       │   ├── index.css                   # Tailwind CSS imports & global styles
│       │   ├── components/                 # 12+ Reusable UI design system components
│       │   │   ├── Badge.tsx               # Status & role indicators
│       │   │   ├── Button.tsx              # Styled interactive buttons
│       │   │   ├── Card.tsx                # Content containers
│       │   │   ├── Dialog.tsx              # Accessible dialog prompts
│       │   │   ├── EmptyState.tsx          # Zero-data fallbacks
│       │   │   ├── ErrorState.tsx          # API error boundary displays
│       │   │   ├── Input.tsx               # Text, number, date inputs
│       │   │   ├── Loading.tsx             # Spinners & progress indicators
│       │   │   ├── Modal.tsx               # Overlay modal dialogs
│       │   │   ├── Select.tsx              # Dropdown selects
│       │   │   ├── Table.tsx               # Data tables with sorting & pagination
│       │   │   └── Toast.tsx               # Notification toast provider & alerts
│       │   ├── context/                    # React Context providers (AuthContext)
│       │   ├── layouts/                    # Layout shells (AppLayout, AuthLayout, MarketingLayout)
│       │   ├── pages/                      # 18 Application views
│       │   │   ├── ActivateAccountPage.tsx # Token activation & password setup
│       │   │   ├── AdminAuditLogsPage.tsx  # Audit log viewer with filters
│       │   │   ├── AdminDepartmentsPage.tsx# Department CRUD & HOD assignment
│       │   │   ├── AdminSettingsPage.tsx   # Institution configuration
│       │   │   ├── AdminStudentImportPage.tsx# 3-Step CSV student import pipeline
│       │   │   ├── AdminUsersPage.tsx      # User roster & invite dialogs
│       │   │   ├── AdminWorkflowsPage.tsx  # Workflow template builder
│       │   │   ├── CompletionPage.tsx      # Rubric evaluation & completion sign-off
│       │   │   ├── DashboardPage.tsx       # Dynamic role-specific dashboards
│       │   │   ├── ErrorPage.tsx           # Global error view
│       │   │   ├── InternshipRegistrationPage.tsx # Internship registration form
│       │   │   ├── InternshipsPage.tsx     # Internship directory & lifecycle tracker
│       │   │   ├── LandingPage.tsx         # Public marketing & hero page
│       │   │   ├── LoadingPage.tsx         # App loading screen
│       │   │   ├── LoginPage.tsx           # Institutional authentication screen
│       │   │   ├── MonitoringPage.tsx      # Attention queue & health monitoring
│       │   │   ├── NotFoundPage.tsx        # 404 Route handler
│       │   │   └── TasksPage.tsx           # Milestone deliverable submission & reviews
│       │   └── services/                   # Client-side API client & token storage
│       ├── index.html                      # HTML5 application shell
│       ├── tailwind.config.js              # Tailwind tokens & palette setup
│       ├── vite.config.ts                  # Vite development & build setup
│       └── package.json                    # Web package dependencies
│
├── packages/
│   ├── shared/                             # Shared business utilities & error classes
│   │   ├── src/index.ts                    # AppError, response formatters, RBAC helpers
│   │   └── package.json
│   └── types/                              # Authoritative TypeScript types & DTOs
│       ├── src/index.ts                    # Enums, API envelopes, DTOs for Phase 0-8
│       └── package.json
│
├── prisma/
│   ├── migrations/                         # Production SQL migrations
│   │   └── 20260916000000_init/migration.sql # Initial 20-model schema DDL
│   ├── schema.prisma                       # Authoritative Prisma schema (20 models)
│   └── seed.ts                             # Deterministic demo development seed script
│
├── docs/                                   # In-Depth Documentation
│   ├── ARCHITECTURE.md                     # System architecture & design contracts
│   ├── DATABASE.md                         # 20 Data models, relational graph & indexing
│   └── DEVELOPMENT.md                      # Local developer setup & commands
│
├── .env.example                            # Comprehensive environment variable template
├── .eslintrc.cjs                           # Monorepo ESLint configuration
├── .prettierrc                             # Code formatting configuration
├── docker-compose.yml                      # PostgreSQL 16 Alpine container configuration
├── package.json                            # Monorepo root workspace orchestration
├── tsconfig.base.json                      # Shared TypeScript base configuration
└── README.md                               # Project documentation
```

---

## 🗄️ Database Architecture

The persistence layer uses **PostgreSQL 16** managed through **Prisma ORM**. The data model enforces strict multi-tenancy, relational integrity, cascade deletions, and append-only auditability.

### Entity Inventory (20 Relational Models)

| # | Model Name | Primary Purpose | Key Indexes & Multi-Tenant Constraints |
|---|---|---|---|
| 1 | `Organization` | Multi-tenant root partition | Unique `code`, index on `[code]` |
| 2 | `Department` | Academic branch within an institution | Composite unique `[organizationId, code]`, index `[organizationId]` |
| 3 | `User` | Central identity entity for all roles | Composite unique `[organizationId, email]`, index `[organizationId, role]`, index `[email]` |
| 4 | `StudentProfile` | Academic details for student users | Unique `userId`, index on `[rollNumber]` |
| 5 | `FacultyProfile` | Faculty designation & credentials | Unique `userId`, index on `[employeeId]` |
| 6 | `MentorProfile` | Industry partner mentor credentials | Unique `userId`, index on `[companyId]` |
| 7 | `Company` | Corporate host partner organization | Composite index on `[organizationId, name]` |
| 8 | `Internship` | Primary internship engagement record | Composite index `[organizationId, status]`, index `[studentId]` |
| 9 | `WorkflowTemplate` | Configurable lifecycle milestone blueprint | Index on `[organizationId]` |
| 10 | `WorkflowInstance` | Active workflow execution for an internship | Unique `internshipId`, composite index `[organizationId, status]` |
| 11 | `WorkflowTask` | Concrete milestone deliverable in a workflow | Composite index `[organizationId, status]`, index `[instanceId]` |
| 12 | `Outcome` | Program Outcome (PO) / Course Outcome (CO) | Composite unique `[organizationId, code]`, index `[organizationId]` |
| 13 | `OutcomeVersion` | Rubric definition & versioning for an Outcome | Composite unique `[outcomeId, versionNumber]`, index `[outcomeId]` |
| 14 | `Submission` | Student deliverable deliverable for a task | Composite index `[organizationId, status]`, index `[taskId]`, index `[studentId]` |
| 15 | `Review` | Qualitative feedback from mentor or faculty | Composite index `[organizationId]`, index `[submissionId]` |
| 16 | `Evaluation` | Rubric scoring against an Outcome | Composite index `[organizationId]`, index `[submissionId]` |
| 17 | `AIAnalysis` | Schema foundation for automated deliverable review | Composite index `[organizationId]`, index `[submissionId]` |
| 18 | `Notification` | User alerts and lifecycle updates | Composite index `[organizationId, userId, isRead]` |
| 19 | `AuditLog` | Append-only security and event trail | Composite index `[organizationId, action]`, index `[entity, entityId]` |
| 20 | `Document` | File metadata and private storage keys | Composite index `[organizationId]`, index `[uploaderId]` |

### Relational Entity-Relationship Diagram

```mermaid
erDiagram
    ORGANIZATION ||--o{ DEPARTMENT : contains
    ORGANIZATION ||--o{ USER : employs
    ORGANIZATION ||--o{ COMPANY : partners_with
    ORGANIZATION ||--o{ INTERNSHIP : governs
    ORGANIZATION ||--o{ WORKFLOW_TEMPLATE : defines
    ORGANIZATION ||--o{ OUTCOME : configures
    ORGANIZATION ||--o{ AUDIT_LOG : records

    DEPARTMENT ||--o{ USER : assigns
    DEPARTMENT ||--o{ STUDENT_PROFILE : enrolls
    DEPARTMENT ||--o{ FACULTY_PROFILE : staffs

    USER ||--o| STUDENT_PROFILE : specializes
    USER ||--o| FACULTY_PROFILE : specializes
    USER ||--o| MENTOR_PROFILE : specializes
    COMPANY ||--o{ MENTOR_PROFILE : employs

    STUDENT_PROFILE ||--o{ INTERNSHIP : undertakes
    COMPANY ||--o{ INTERNSHIP : hosts
    FACULTY_PROFILE ||--o{ INTERNSHIP : supervises
    MENTOR_PROFILE ||--o{ INTERNSHIP : mentors

    INTERNSHIP ||--o| WORKFLOW_INSTANCE : executes
    WORKFLOW_TEMPLATE ||--o{ WORKFLOW_INSTANCE : instantiates
    WORKFLOW_INSTANCE ||--o{ WORKFLOW_TASK : contains

    WORKFLOW_TASK ||--o{ SUBMISSION : receives
    STUDENT_PROFILE ||--o{ SUBMISSION : uploads
    SUBMISSION ||--o{ REVIEW : evaluated_by
    SUBMISSION ||--o{ EVALUATION : scored_by
    SUBMISSION ||--o{ DOCUMENT : attaches
    SUBMISSION ||--o{ AI_ANALYSIS : analyzed_by

    OUTCOME ||--o{ OUTCOME_VERSION : versions
    OUTCOME ||--o{ EVALUATION : measures
```

### Multi-Tenant Scoping Principles

1. **Foreign Key Cascade Deletion**: Deleting an `Organization` cascades down to eliminate all linked departmental, user, internship, and document data.
2. **Tenant Email Uniqueness**: User emails are unique *per tenant* (`@@unique([organizationId, email])`). This allows corporate mentors to participate in multiple independent university tenants using a single corporate email without identity collisions.
3. **Audit Log Immutability**: The `AuditLog` entity maintains an `onDelete: SetNull` policy on `actorId`. If an account is deleted, the historical action log remains permanently preserved for accreditation audits.

---

## 🔐 Authentication & Authorization

### Authentication Architecture

* **Token Issuance**: Users authenticate via `POST /api/v1/auth/login`. The server returns an HMAC-SHA256 signed JWT containing `userId`, `email`, `role`, `organizationId`, and `organizationCode`.
* **Password Security**: Passwords are saved as one-way adaptive hashes using `bcryptjs` with 10 salt rounds. Plaintext passwords are never logged or stored.
* **Token Verification**: Protected routes pass through `authenticate` middleware, which parses the `Authorization: Bearer <token>` header, decodes the payload, and verifies user existence and active status.
* **Account Activation**: Admins create users via `POST /api/v1/auth/invite`. The invitee receives a secure 32-character hexadecimal token to activate their account and set their own password via `POST /api/v1/auth/activate`.

### Role-Based Access Control (RBAC) Matrix

Permissions are strictly enforced via the `requirePermission` or `requireRoles` middleware:

| Permission Area | Super Admin / Admin | HOD | Faculty | Mentor | Student |
|---|:---:|:---:|:---:|:---:|:---:|
| `institution:manage` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `department:manage` | ✅ | ✅ (Own Dept) | ❌ | ❌ | ❌ |
| `users:invite` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `workflows:manage` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `internships:create` | ✅ | ❌ | ❌ | ❌ | ✅ |
| `approvals:manage` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `submissions:create` | ✅ | ❌ | ❌ | ❌ | ✅ |
| `reviews:create` | ✅ | ❌ | ✅ | ✅ | ❌ |
| `evaluations:create` | ✅ | ❌ | ✅ | ✅ | ❌ |
| `completion:manage` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `monitoring:read` | ✅ | ✅ | ✅ | ✅ (Assigned) | ❌ |
| `students:import` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `audit:read` | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🛡️ Security

### Implemented Security Mechanisms

* **Multi-Tenant Isolation**: The `tenantIsolation` middleware verifies that the user's authenticated `organizationId` matches the target entity and request parameters. Any attempt to inspect or manipulate cross-tenant data produces an immediate `403 Forbidden` (`TENANT_ISOLATION_VIOLATION`).
* **Rate Limiting**: Custom window-based rate limiting on sensitive routes (`/api/v1/auth/login`, `/api/v1/auth/activate`) prevents brute-force credential stuffing.
* **HTTP Security Headers**: Integrated `Helmet` applies secure HTTP headers (including HSTS, X-Content-Type-Options, X-Frame-Options, and X-XSS-Protection).
* **Strict Input Validation**: Every request body is checked against strongly-typed `Zod` schemas. Malformed inputs are rejected with detailed `400 Validation Error` envelopes.
* **Sanitized File Uploads**: Uploaded filenames are sanitized, unique cryptographic hash keys are assigned, and file paths are prevented from directory traversal attacks (`path.normalize`).
* **Environment Variable Protection**: Configuration loaded through a strict validation layer that halts server boot if required secrets (e.g., `JWT_SECRET`) are missing.
* **Centralized Safe Error Handling**: Unhandled exceptions are intercepted by `errorHandler.ts`. Internal database connection strings and stack traces are suppressed in production mode.

### Recommended Security Improvements for Production Scale

* Implement refresh token rotation using HTTP-only secure cookies.
* Integrate virus scanning (e.g., ClamAV) on file upload streams.
* Configure AWS KMS or HashiCorp Vault for envelope encryption of student records.
* Enable OAuth2 / SAML single sign-on (SSO) for university Google Workspace or Microsoft Entra ID.

---

## 🔌 API Documentation

All production endpoints are prefixed under `/api/v1`. Responses follow the standard JSON envelope:

```typescript
// Success Envelope
{ "success": true, "data": T, "meta": { "timestamp": string } }

// Error Envelope
{ "success": false, "error": { "code": string, "message": string, "details": unknown, "timestamp": string, "path": string } }
```

### 1. System Health

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/api/v1/health` | Public | Returns API service operational status and health status. |

### 2. Authentication

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/api/v1/auth/login` | Rate Limited | Authenticate with email, password, and optional organization code. |
| `POST` | `/api/v1/auth/logout` | Required | Revoke active user session token. |
| `POST` | `/api/v1/auth/invite` | Admin / HOD | Send an onboarding invitation token to a new user. |
| `POST` | `/api/v1/auth/activate` | Rate Limited | Activate account using invitation token and establish password. |
| `GET` | `/api/v1/auth/me` | Required | Retrieve current authenticated user profile and permissions. |

### 3. Institution & Administration (`/api/v1/admin`)

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/api/v1/admin/dashboards/admin` | Admin | Retrieve institution-wide administrative dashboard metrics. |
| `GET` | `/api/v1/admin/departments` | Required | List all academic departments within the institution. |
| `POST` | `/api/v1/admin/departments` | Admin | Create a new academic department. |
| `PATCH` | `/api/v1/admin/departments/:id/hod` | Admin | Assign or replace the Head of Department (HOD). |
| `GET` | `/api/v1/admin/users` | Admin / HOD | List users with filtering by role and department. |
| `POST` | `/api/v1/admin/users` | Admin | Create an active user directly. |
| `PATCH` | `/api/v1/admin/users/:id/status` | Admin | Toggle user account status (`ACTIVE`, `SUSPENDED`). |
| `POST` | `/api/v1/admin/students/import/preview` | Admin | Upload and validate student CSV file for batch onboarding. |
| `POST` | `/api/v1/admin/students/import/confirm` | Admin | Commit validated student CSV records to database. |
| `GET` | `/api/v1/admin/audit-logs` | Admin | Query immutable system audit logs with filtering. |

### 4. Workflows & Tasks (`/api/v1/workflows`)

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/api/v1/workflows/templates` | Required | List active milestone workflow templates. |
| `POST` | `/api/v1/workflows/templates` | Admin / HOD | Create a custom workflow template with multi-stage steps. |
| `POST` | `/api/v1/workflows/assign/:internshipId` | Admin / HOD | Instantiate a workflow template for an approved internship. |
| `GET` | `/api/v1/workflows/tasks` | Required | Retrieve workflow tasks scoped to user role and institution. |
| `POST` | `/api/v1/workflows/tasks/:taskId/submit` | Student | Submit task deliverable content and metadata. |
| `POST` | `/api/v1/workflows/tasks/:taskId/extend` | Faculty / HOD | Grant an authorized deadline extension with audit reason. |

### 5. Internship Lifecycle (`/api/v1/internships`)

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/api/v1/internships` | Required | List internships with multi-dimensional filtering. |
| `GET` | `/api/v1/internships/:id` | Required | Get detailed profile of a specific internship. |
| `POST` | `/api/v1/internships` | Student / Admin | Register a new internship engagement. |
| `POST` | `/api/v1/internships/:id/submit` | Student | Submit draft registration for departmental approval. |
| `POST` | `/api/v1/internships/:id/approve` | Faculty / HOD | Approve or reject registration with feedback. |
| `POST` | `/api/v1/internships/:id/assign-faculty` | HOD / Admin | Assign faculty supervisor to internship. |
| `POST` | `/api/v1/internships/:id/assign-mentor` | Required | Assign industry corporate mentor to internship. |
| `POST` | `/api/v1/internships/:id/transition` | Role Dependent | Trigger state machine transition. |

### 6. Submissions & Reviews (`/api/v1/submissions`)

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/api/v1/submissions/upload` | Student | Upload deliverable evidence file (PDF, code, archives). |
| `GET` | `/api/v1/submissions/files/:fileId` | Required | Securely download private submission evidence file. |
| `GET` | `/api/v1/submissions/:id` | Required | Get submission deliverable details with all versions. |
| `POST` | `/api/v1/submissions` | Student | Create or resubmit a versioned deliverable. |
| `POST` | `/api/v1/submissions/:id/reviews` | Mentor / Faculty | Submit criteria-based rubric review and decision. |
| `GET` | `/api/v1/submissions/:id/timeline` | Required | Reconstruct full submission version and review timeline. |

### 7. Monitoring & Health Engine (`/api/v1/monitoring`)

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/api/v1/monitoring/overview` | Staff Roles | Retrieve aggregate institution health metrics. |
| `GET` | `/api/v1/monitoring/internships` | Staff Roles | Query monitored internships with health indicators. |
| `GET` | `/api/v1/monitoring/attention-queue` | Admin / HOD / Faculty | Access prioritized list of internships in critical/attention states. |
| `GET` | `/api/v1/monitoring/internships/:id/health` | Required | Retrieve deterministic health evaluation for single internship. |
| `GET` | `/api/v1/monitoring/internships/:id/timeline` | Required | Retrieve unified lifecycle event timeline. |
| `GET` | `/api/v1/monitoring/thresholds` | Admin | Retrieve institution-configured health thresholds. |
| `PATCH` | `/api/v1/monitoring/thresholds` | Admin | Update institution health evaluation thresholds. |

### 8. Final Evaluation & Completion Engine (`/api/v1/completion`)

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/api/v1/completion/check/:internshipId` | Required | Verify all 4 completion prerequisites and return exact missing reasons. |
| `POST` | `/api/v1/completion/evaluation` | Mentor / Faculty | Submit structured 100-point rubric evaluation with grade calculation. |
| `PUT` | `/api/v1/completion/evaluation/:id` | Mentor / Admin | Update/edit an existing final evaluation. |
| `GET` | `/api/v1/completion/evaluation/:internshipId`| Required | Retrieve final evaluation record for an internship. |
| `POST` | `/api/v1/completion/confirm` | Faculty / HOD / Admin | Sign off on academic completion (requires all prerequisites met). |
| `GET` | `/api/v1/completion/dossier/:internshipId` | Required | Generate and retrieve permanent student internship dossier. |
| `POST` | `/api/v1/completion/termination-request` | Mentor | Request early internship termination with documented reason. |
| `POST` | `/api/v1/completion/terminate` | HOD / Admin | Formally decide and execute internship termination. |
| `POST` | `/api/v1/completion/cancel` | Student / HOD / Admin | Cancel draft or active internship with mandatory justification. |

---

## 🔑 Environment Variables

The application requires environment configuration in `.env`. Inspect `.env.example` for the authoritative template:

| Variable | Required | Default / Example Value | Description |
|---|:---:|---|---|
| `NODE_ENV` | Yes | `development` | Application runtime environment (`development` \| `production` \| `test`). |
| `PORT` | Yes | `4000` | Port number on which the Express API server listens. |
| `API_URL` | Yes | `http://localhost:4000` | Fully qualified base URL of the backend API. |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | Fully qualified base URL of the web client (used for CORS policy). |
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/internos?schema=public` | PostgreSQL connection string used by Prisma ORM. |
| `JWT_SECRET` | Yes | `internos_super_secret_jwt_key_min_32_chars` | Secret key used to sign and verify HMAC-SHA256 JWT tokens. |
| `JWT_EXPIRES_IN` | No | `7d` | Token validity duration. |
| `COOKIE_DOMAIN` | No | `localhost` | Domain scope for session cookies. |
| `DEFAULT_ORGANIZATION_CODE`| No | `apex-inst` | Default tenant code used during initialization and tests. |
| `STORAGE_DRIVER` | Yes | `local` | Active file storage driver (`local` \| `s3` \| `gcs`). |
| `STORAGE_LOCAL_UPLOAD_DIR` | Yes | `./uploads` | Local filesystem directory for storing tenant documents. |
| `STORAGE_MAX_FILE_SIZE_MB` | No | `25` | Maximum upload size permitted per evidence document. |
| `STORAGE_S3_BUCKET` | Optional | `""` | AWS S3 / Object Storage bucket name (cloud storage mode). |
| `STORAGE_S3_REGION` | Optional | `""` | AWS S3 region identifier. |
| `STORAGE_S3_ACCESS_KEY` | Optional | `""` | AWS IAM access key ID. |
| `STORAGE_S3_SECRET_KEY` | Optional | `""` | AWS IAM secret access key. |
| `LLM_PROVIDER` | Optional | `openai` | Target LLM provider placeholder (interface abstraction). |
| `LLM_API_KEY` | Optional | `placeholder_not_used_in_phase_0` | API key placeholder for future AI integration. |
| `LLM_MODEL` | Optional | `gpt-4o` | Model name placeholder. |
| `LLM_TEMPERATURE` | Optional | `0.2` | Model sampling temperature placeholder. |
| `LLM_MAX_TOKENS` | Optional | `1000` | Maximum token completion length placeholder. |

---

## ⚙️ Installation

### Prerequisites

* **Node.js**: `v20.x` or higher (verified on Node v20 & v24)
* **npm**: `v10.x` or higher
* **Docker & Docker Compose**: For containerized PostgreSQL 16 (or an existing PostgreSQL instance)
* **Git**: For version control

### 1. Clone the Repository

```bash
git clone https://github.com/innocentgaming/Hack-2-Ignite-team_37.git internos
cd internos
```

### 2. Install Monorepo Dependencies

```bash
npm install
```

---

## 🔧 Configuration

### 1. Set Up Environment File

```bash
cp .env.example .env
```

Review `.env` and verify database credentials, port configurations, and secret keys.

### 2. Launch PostgreSQL Container

If using Docker Compose, launch the containerized PostgreSQL 16 Alpine database:

```bash
docker compose up -d
```

Verify the database container is healthy:

```bash
docker compose ps
```

### 3. Initialize Prisma Database & Seed Data

Execute the Prisma automation commands from the repository root:

```bash
# Validate Prisma schema definitions
npm run prisma:validate

# Generate Prisma Client TypeScript bindings
npm run prisma:generate

# Deploy database migrations
npm run prisma:migrate

# Seed development tenant, departments, demo accounts, and sample workflow
npm run prisma:seed
```

---

## ▶️ Running Locally

### Start Both Services Concurrently

Run the Express API and Vite React frontend concurrently via npm workspaces:

```bash
npm run dev
```

* **Frontend SPA**: `http://localhost:5173`
* **Backend API**: `http://localhost:4000`
* **API Health Check**: `http://localhost:4000/api/v1/health`

### Start Services Individually

```bash
# Run API server only (with hot reloading via tsx watch)
npm run dev:api

# Run Vite frontend only
npm run dev:web
```

### Utility Commands

```bash
# Run monorepo-wide TypeScript type checking
npm run typecheck

# Run ESLint across packages and applications
npm run lint

# Compile production bundles for API and Web
npm run build

# Launch Prisma Studio web GUI (inspect database records)
npm run prisma:studio
```

---

## 🧪 Testing

InternOS features a comprehensive automated integration test suite written using the Node.js native test runner (`node:test`) executed via `tsx`.

### Run Test Suite

```bash
npm test
```

### Verified Test Suite Breakdown (124/124 Tests Passing)

| Test Suite File | Focus Area | Tests | Status |
|---|---|:---:|:---:|
| `phase1-auth-rbac.test.ts` | JWT login, logout revocation, invite token generation, user activation & RBAC guards | 11 | ✅ Pass |
| `phase2-admin-csv.test.ts` | Department CRUD, HOD assignment, user management & 3-stage CSV import pipeline | 14 | ✅ Pass |
| `phase3-workflow-engine.test.ts` | Workflow template builder, step configuration, task generation & deadline extensions | 14 | ✅ Pass |
| `phase4-internship-lifecycle.test.ts` | Deterministic 16-rule state machine, registration, approval & assignment | 16 | ✅ Pass |
| `phase5-role-workspaces.test.ts` | Role dashboards (Admin/HOD/Faculty/Mentor/Student) & mentor concern flagging | 19 | ✅ Pass |
| `phase6-submissions-reviews.test.ts` | Multi-version deliverables, isolated file storage & criteria-based reviews | 17 | ✅ Pass |
| `phase7-monitoring-health.test.ts` | Zero-AI health scoring, threshold configuration, attention queue & timeline | 16 | ✅ Pass |
| `phase8-completion-evaluation.test.ts` | 4-Prerequisite gating, 100-point rubric evaluation, academic sign-off & dossier | 12 | ✅ Pass |
| `tenant-isolation-rbac.test.ts` | Cross-tenant data isolation, security headers & forbidden tenant penetration | 5 | ✅ Pass |
| **Total Automated Tests** | **All 8 Phases & Core Security Boundaries** | **124** | **✅ 100% Pass** |

---

## 📸 Screenshots

> Screenshots will be added as the UI stabilizes.

---

## 🎥 Demo

### Demo Credentials (From Seed Dataset)

All demo accounts share the default development password: `Password123!`

| Role | Email | Password | Tenant Scope | Purpose |
|---|---|---|---|---|
| **Institution Admin** | `admin@apex.edu` | `Password123!` | Apex Institute (`apex-inst`) | Manage departments, users, workflows, CSV import |
| **Head of Department (CSE)** | `hod@org-a.com` | `Password123!` | Apex Institute (`apex-inst`) | Departmental approvals, supervisor assignments, monitoring |
| **Faculty Supervisor** | `dr.sharma@apex.edu` | `Password123!` | Apex Institute (`apex-inst`) | Supervise students, grant extensions, academic sign-off |
| **Industry Mentor** | `raj.patel@acmecloud.com` | `Password123!` | Acme Cloud Labs | Review deliverables, raise concerns, final rubric evaluation |
| **Student** | `alex.student@apex.edu` | `Password123!` | Apex Institute (`apex-inst`) | Register internship, upload deliverables, view dossier |
| **Super Admin** | `superadmin@internos.local` | `Password123!` | Global Governance | Cross-tenant administration and health inspection |

### Demo Links

* **Source Repository**: [https://github.com/innocentgaming/Hack-2-Ignite-team_37.git](https://github.com/innocentgaming/Hack-2-Ignite-team_37.git)
* **Local Web Interface**: `http://localhost:5173`
* **Local API Base**: `http://localhost:4000/api/v1`

---

## 🚀 Deployment

### Production Build

InternOS is engineered to be built and deployed as standalone Node.js and static web services:

```bash
# 1. Build shared packages and compile TypeScript for API and Web
npm run build

# 2. Run database migrations against production database
npm run prisma:migrate

# 3. Start production API server
cd apps/api
npm start
```

### Static Frontend Hosting
The output in `apps/web/dist` can be hosted on any static cloud edge provider (Cloudflare Pages, AWS S3 + CloudFront, Vercel, or Nginx).

### Containerization Status
> Production multi-stage Docker containerization and Kubernetes Helm charts are planned for upcoming releases. Currently, containerization is configured for the local PostgreSQL database via Docker Compose.

---

## 🐳 Docker

The repository includes a production-parity Docker Compose configuration for PostgreSQL 16:

* **File**: `docker-compose.yml`
* **Image**: `postgres:16-alpine`
* **Container Name**: `internos-postgres`
* **Host Port**: `5432`
* **Health Check**: Automated `pg_isready` probe checking database readiness every 5 seconds.
* **Volume**: Persistent volume `postgres_data` mapping to `/var/lib/postgresql/data`.

### Docker Commands

```bash
# Start PostgreSQL service in background
docker compose up -d

# View container logs
docker compose logs -f postgres

# Stop PostgreSQL service
docker compose down

# Stop service and wipe persistent database volume
docker compose down -v
```

---

## 📊 Current Project Status

| Module / Milestone | Implementation Status | Verification Details |
|---|:---:|---|
| **Phase 0 — Monorepo & Domain Architecture** | ✅ Complete | Monorepo structure, 20 Prisma models, shared types, UI component suite |
| **Phase 1 — Authentication & Multi-Tenant RBAC** | ✅ Complete | JWT auth, bcrypt hashing, invite tokens, tenant isolation middleware (11 tests) |
| **Phase 2 — Administration & User Management** | ✅ Complete | Department registry, user CRUD, 3-stage CSV bulk import pipeline (14 tests) |
| **Phase 3 — Configurable Workflow Engine** | ✅ Complete | Custom templates, multi-stage steps, task generator, deadline extensions (14 tests) |
| **Phase 4 — Internship Lifecycle & State Machine** | ✅ Complete | 16-transition state engine, approvals, faculty/mentor assignments (16 tests) |
| **Phase 5 — Role-Specific Workspaces** | ✅ Complete | Workspaces for Student, Faculty, HOD, Mentor + Mentor Concern flagging (19 tests) |
| **Phase 6 — Submissions, Files & Mentor Reviews** | ✅ Complete | Versioned submissions, private uploads, criteria scoring rubric (17 tests) |
| **Phase 7 — Deterministic Monitoring Engine** | ✅ Complete | Zero-AI health scoring, attention queue, configurable thresholds (16 tests) |
| **Phase 8 — Final Evaluation & Completion Engine** | ✅ Complete | 100-pt rubric evaluation, 4-prerequisite gate, completion sign-off, dossier (12 tests) |
| **Phase 9 — Evidence-Based AI Intelligence Layer** | ✅ Complete | Advisory-only LLM extraction, PO mapping, resilience, zero health mutation (11 tests) |
| **Cloud Production Deployment** | 🔴 Pending | Local Docker Compose configured; cloud container orchestration not yet automated |

---

## 🗺️ Roadmap

### Completed (Phases 0–9)
- [x] Multi-tenant monorepo architecture with PostgreSQL and Prisma ORM
- [x] 20 relational database models with strict `organizationId` foreign key scoping
- [x] Stateless JWT authentication, secure token invitation, and user self-activation
- [x] Role-Based Access Control (RBAC) supporting 5 primary roles and 33 permissions
- [x] Institution management: department hierarchy, HOD assignment, user management
- [x] Transactional 3-stage CSV bulk student onboarding with validation previews
- [x] Dynamic workflow template builder with configurable stages and deadline offsets
- [x] Authorized task deadline extensions with mandatory audit logging
- [x] Formally validated 16-transition finite state machine for internships
- [x] Dedicated workspaces for Students, Faculty, HODs, and Industry Mentors
- [x] Structured mentor concern flagging with 4 severity levels
- [x] Versioned milestone deliverable submissions with private file uploads
- [x] Structured mentor criteria reviews with revision request loops
- [x] Deterministic zero-AI health engine calculating `ON_TRACK`, `ATTENTION`, and `CRITICAL`
- [x] Real-time institutional attention queue prioritizing high-risk internships
- [x] 100-point mentor final evaluation rubric with automated grade calculation
- [x] 4-Prerequisite completion verification engine blocking silent completions
- [x] Faculty academic sign-off and permanent student internship dossier generation
- [x] Structured termination and cancellation protocols with audit trail preservation
- [x] Evidence-based advisory AI intelligence layer extracting activities, technologies, skills, and outcomes
- [x] Strict evidence language ("No evidence found in submitted work.", zero incompetence assertions)
- [x] Fault-tolerant AI pipeline with timeout handling, retry endpoints, and zero impact on submission survival
- [x] Advisory invariant guarantee: Zero AI mutation of deterministic monitoring health metrics
- [x] 135 passing automated integration tests across all modules (100% pass rate)

### In Progress
- [ ] Multi-file drag-and-drop file upload interface with upload progress feedback
- [ ] Exporting student completion dossiers as signed, tamper-proof PDF certificates
- [ ] Real-time web-socket notification alerts for pending reviews and deadlines

### Planned Future Scope
- [ ] **AI-Powered Learning Outcome Mapping**: Connect `IAIService` to LLM providers (Gemini / OpenAI) to match student deliverables with ABET / NBA Program Outcomes.
- [ ] **Automated Anomaly & Plagiarism Detection**: Semantic text analysis to flag reused or generic milestone reports.
- [ ] **Cloud Storage Drivers**: Native AWS S3 and Google Cloud Storage drivers implementing `IStorageService`.
- [ ] **Institutional Single Sign-On (SSO)**: SAML 2.0 / OAuth2 support for Google Workspace and Microsoft Entra ID.
- [ ] **Mobile Responsive Progressive Web App (PWA)**: Mobile-optimized views for industry mentors on the move.
- [ ] **Production Infrastructure as Code (IaC)**: Terraform and Helm templates for AWS ECS / EKS or Google Cloud Run.

---

## ⚠️ Limitations

* **AI Service is an Abstraction**: `aiService` is currently an interface stub (`Phase0DisabledAIService`) throwing `501 NotImplementedError`. All grading and health evaluations currently run on deterministic algorithms.
* **Storage Driver Default**: Currently uses `LocalStorageService`, storing uploaded documents on the local server filesystem (`./uploads`). S3/GCS adapters require cloud credentials.
* **Database Dependent**: Running full API integration tests requires a reachable PostgreSQL database instance (provided via `docker compose up -d`).
* **Session Persistence**: JWTs are managed statelessly on the client; centralized token blacklisting currently uses in-memory tracking in the test suite and requires a Redis adapter for distributed production clusters.

---

## 🔮 Future Scope

1. **AI-Assisted Evaluation Feedback**: Assist industry mentors by auto-summarizing student code and milestone submissions into draft evaluation comments.
2. **Accreditation Export Engine**: One-click generation of comprehensive ABET/NBA Program Outcome attainment reports with direct evidence links.
3. **Corporate Partner Portal**: Dedicated multi-university hiring and internship listing portal for employer partners.
4. **Offline-First Mobile Deliverable Logging**: Enable students in low-connectivity industrial field locations to draft logs offline and sync upon reconnecting.

---

## 🤝 Contributing

We welcome contributions from higher-education technologists, faculty coordinators, and open-source software engineers.

### Contribution Workflow

```text
Fork Repository
       ↓
Create Feature Branch (git checkout -b feature/amazing-feature)
       ↓
Make Changes & Add Tests
       ↓
Run Verification (npm run typecheck && npm test && npm run lint)
       ↓
Commit Changes (git commit -m "feat: add amazing feature")
       ↓
Push to Branch (git push origin feature/amazing-feature)
       ↓
Open Pull Request
```

### Pull Request Standards
* Ensure all 124 existing tests pass.
* Include corresponding unit or integration tests for new business logic.
* Adhere to strict TypeScript standards (`noImplicitAny`, type-safe DTOs).
* Do not bypass tenant scoping rules (`organizationId` must remain enforced).

---

## 🐛 Issue Reporting

If you discover a bug, security vulnerability, or functional defect:
1. Open a GitHub Issue on the repository: [Issues Page](https://github.com/innocentgaming/Hack-2-Ignite-team_37/issues).
2. Include the exact reproduction steps, role utilized, API endpoint or web URL, and expected vs actual behavior.
3. For security vulnerabilities, please avoid public disclosure and contact the project maintainers directly.

---

## 📜 License

> No open-source license has currently been specified.

---

## 👨‍💻 Contributors

* **Team 37 — Hack-2-Ignite**  
  * Repository: [`innocentgaming/Hack-2-Ignite-team_37`](https://github.com/innocentgaming/Hack-2-Ignite-team_37)

---

## 🙏 Acknowledgements

* [React](https://react.dev/) & [Vite](https://vitejs.dev/) for high-speed frontend development.
* [Express.js](https://expressjs.com/) for a robust RESTful routing engine.
* [Prisma ORM](https://www.prisma.io/) for type-safe database schemas and migrations.
* [Tailwind CSS](https://tailwindcss.com/) & [Lucide](https://lucide.dev/) for accessible, modern UI styling.
* [Zod](https://zod.dev/) for declarative schema validation.
* Higher-education internship coordinators and faculty advisors whose operational workflows inspired this platform architecture.

---

## 📚 Additional Documentation

For deeper architectural, database, and developer details, consult the specialized documentation in the [`docs/`](docs/) directory:

* 🏛️ [**System Architecture Specification**](docs/ARCHITECTURE.md) — Multi-tenancy, RBAC hierarchy, storage & AI abstraction specifications.
* 🗄️ [**Database Architecture & Schema Guide**](docs/DATABASE.md) — 20 relational models, index strategies, audit log immutability, and cascade rules.
* 💻 [**Local Development & Testing Guide**](docs/DEVELOPMENT.md) — Step-by-step developer setup, Docker instructions, and command reference.

---

## 📞 Contact

For inquiries regarding InternOS deployment, institutional pilots, or collaboration:
* **Repository**: [https://github.com/innocentgaming/Hack-2-Ignite-team_37](https://github.com/innocentgaming/Hack-2-Ignite-team_37)
