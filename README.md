# InternOS

## Internship Governance & Outcome Monitoring Platform

InternOS is a multi-tenant internship governance platform for educational institutions.

It manages the complete internship lifecycle in one system:

**Institution Setup → Internship Registration → Mentor Assignment → Milestones → Tasks → Evidence → Mentor Review → Learning Outcomes → Final Evaluation → Completion**

InternOS is designed to replace fragmented internship coordination across spreadsheets, emails, documents, and manual follow-ups with a structured, traceable digital workflow.

---

## Table of Contents

- [Overview](#overview)
- [Why InternOS](#why-internos)
- [Core Workflow](#core-workflow)
- [User Roles](#user-roles)
- [Key Features](#key-features)
- [Evidence & Outcome Model](#evidence--outcome-model)
- [AI-Assisted Evidence Analysis](#ai-assisted-evidence-analysis)
- [Multi-Tenant Architecture](#multi-tenant-architecture)
- [Security](#security)
- [Product Areas](#product-areas)
- [Demo Environment](#demo-environment)
- [Technology Stack](#technology-stack)
- [Application Structure](#application-structure)
- [Authentication & Authorization](#authentication--authorization)
- [Internship Lifecycle](#internship-lifecycle)
- [CSV Imports](#csv-imports)
- [Documents & Evidence](#documents--evidence)
- [Analytics](#analytics)
- [Audit Trail](#audit-trail)
- [Institution Registration](#institution-registration)
- [Invitation Workflow](#invitation-workflow)
- [Responsive UI](#responsive-ui)
- [Validation & Reliability](#validation--reliability)
- [Development Setup](#development-setup)
- [Environment Configuration](#environment-configuration)
- [Testing](#testing)
- [Production Considerations](#production-considerations)
- [Roadmap](#roadmap)
- [Project Positioning](#project-positioning)

---

# Overview

Internship management is often distributed across different tools:

- Student spreadsheets
- Email communication
- Messaging applications
- Shared folders
- Manual attendance/progress tracking
- Separate evaluation forms
- Paper-based documentation

This makes it difficult for institutions to answer simple operational questions:

- Which students are currently interning?
- Which students are falling behind?
- Which tasks are overdue?
- Which submissions are waiting for mentor review?
- What evidence has a student actually submitted?
- Does the evidence demonstrate the expected learning outcome?
- Which internships are ready for completion?
- Where is the complete history of an internship?

InternOS provides a single institutional system for these workflows.

---

# Why InternOS

InternOS focuses on **traceability**, not just record keeping.

Every stage of the internship can be connected:

```text
Internship
    ↓
Milestone
    ↓
Task
    ↓
Expected Evidence
    ↓
Actual Student Evidence
    ↓
Mentor Review
    ↓
Feedback
    ↓
Learning Outcome
    ↓
Final Evaluation
    ↓
Completion
```

By connecting these stages into a unified lifecycle, InternOS ensures that academic credit and completion certificates are backed by auditable evidence and clear supervisory reviews rather than subjective, last-minute approvals.

---

# Core Workflow

The end-to-end lifecycle within InternOS follows a deterministic 10-step sequence:

1. **Institution Setup & Registry**: The institution registers its profile, defines academic departments, programs, and accreditation parameters.
2. **Student & Mentor Onboarding**: Users are provisioned via self-service activation tokens or bulk CSV ingestion.
3. **Internship Registration**: The student or administrator registers the internship engagement with company metadata, role specifications, work mode (Remote/On-site/Hybrid), and timelines.
4. **Mentor & Faculty Assignment**: An industry supervisor and faculty coordinator are linked to the internship record.
5. **Milestone Definition**: The internship duration is structured into discrete milestones representing key developmental phases.
6. **Task Assignment**: Tasks are mapped to specific milestones with clear expected evidence criteria (e.g., repository commits, technical writeups, deploy links).
7. **Evidence Submission**: The student submits work deliverables with verifiable evidence links, execution summaries, and PDF attachments.
8. **Mentor Review Loop**: The industry mentor reviews submissions, providing actionable feedback or requesting revisions before approving.
9. **Outcome Mapping**: Approved evidence is tied to institutional Program Outcomes (POs) and Course Outcomes (COs) for accreditation compliance (NBA, NAAC, ABET).
10. **Final Evaluation & Completion**: The supervisor conducts a comprehensive final rubric evaluation, confirming credit readiness and issuing completion verification.

---

# User Roles

InternOS enforces strict Role-Based Access Control (RBAC) across distinct operational perspectives:

| Role | Core Responsibilities | Primary Workspace |
| :--- | :--- | :--- |
| **Institutional Admin** | Institutional governance, department registry, student & mentor roster CSV imports, workflow configuration, system-wide audit logging, and accreditation analytics. | `/app/admin` |
| **Industry Mentor** | Intern supervision, milestone and task design, submission review queues, qualitative feedback, outcome verification, and final evaluations. | `/app/mentor` |
| **Student (Intern)** | Daily task tracking, evidence deliverable submission, feedback review, document uploads, and learning outcome attainment tracking. | `/app/student` |
| **Faculty Coordinator** | Academic supervision, departmental internship monitoring, syllabus outcome alignment, and academic credit sign-offs. | Specialized Academic Views |
| **Head of Department (HOD)** | Departmental overview, supervisor workload balancing, curriculum outcome aggregation, and completion sign-offs. | Departmental Views |

---

# Key Features

- **Multi-Tenant Data Isolation**: Cryptographic tenant binding via JWT guarantees zero cross-institutional data leakage.
- **Outcome-Based Education (OBE) Integration**: Direct mapping between task evidence and accredited Program Outcomes (PO1–PO12).
- **Evidence-Backed Review Loop**: Students cannot complete milestones without submitting verifiable evidence; mentors review deliverables with audit-tracked feedback.
- **AI-Assisted Evidence Assessment**: Automated advisory intelligence analyzing submitted artifacts against expected competency criteria.
- **Bulk CSV Ingestion**: High-throughput student and mentor roster imports with strict validation, conflict detection, and transactional creation.
- **Immutable Audit Trail**: Append-only event ledger capturing all state transitions, role changes, and evaluation submissions.
- **Real-Time Institutional Telemetry**: Live metric aggregation across department enrollment, partner company distribution, and credit completion rates.
- **PDF Document Engine**: Secure streaming and inline preview of offer letters, weekly reports, and institutional policies.
- **Mobile-First Responsive Interface**: Full usability on mobile phones, tablets, and desktop workstations with slide-over drawer navigation.

---

# Evidence & Outcome Model

Traditional internship platforms track whether a student "attended" work. InternOS verifies **what the student learned and demonstrated**.

### The Evidence Hierarchy

```
Program Outcome (e.g., PO-3: Design/Development of Solutions)
       ▲
       │ validates
Learning Outcome Mapping
       ▲
       │ demonstrates
Approved Deliverable Submission
       ▲
       │ satisfies
Task Criteria (e.g., "Implement JWT authentication with refresh rotation")
       ▲
       │ part of
Internship Milestone (e.g., "Phase 2: Backend Architecture")
```

### Supported Evidence Types
- **GitHub Pull Requests & Commits**: Validated repository and code review links.
- **Live Deployment URLs**: Working staging and production demo endpoints.
- **Technical Documentation & Reports**: Architecture diagrams, API specs, and PDF deliverables.
- **Test Execution Logs**: Automated test suites, coverage reports, and QA sign-offs.

---

# AI-Assisted Evidence Analysis

InternOS integrates an AI advisory intelligence layer powered by Groq LLaMA models to assist mentors and academic supervisors during submission reviews:

- **Deliverable Velocity Scoring**: Evaluates completion speed and submission cadence against planned milestone schedules.
- **Evidence-to-Outcome Alignment**: Analyzes submission text and deliverables to assess semantic alignment with targeted Program Outcomes.
- **Risk & Bottleneck Detection**: Flags recurring revisions, vague progress notes, or extended stagnation before they become critical.
- **Strict Advisory Boundary**: AI analysis serves purely as advisory intelligence. **AI never approves, rejects, grades, or terminates an internship**. Final decisions rest strictly with authorized human supervisors.

---

# Multi-Tenant Architecture

InternOS is engineered from the ground up as a single-codebase, multi-tenant system:

```text
HTTP Request
    │
    ▼
[Token Extraction] → Verifies Signature & Extracts organizationId
    │
    ▼
[Tenant Scoping Middleware]
    ├── Inbound organizationId from URL/body/query is REJECTED
    └── DB Queries forced into: WHERE organizationId = req.user.organizationId
    │
    ▼
[Isolated Database Records]
```

- **Zero-Trust Multi-Tenancy**: The client cannot override tenant boundaries. The backend derives `organizationId` strictly from the cryptographically verified JWT.
- **Cross-Tenant Attack Rejection**: Any attempt by User A (Tenant A) to read, update, or delete data belonging to Tenant B yields an immediate `403 Forbidden` and creates a security audit log.

---

# Security

- **Server-Side RBAC**: Authorization middleware validates roles and permissions before any controller execution.
- **Password Security**: Passwords hashed using `bcrypt` with appropriate work factors; raw passwords are never logged or stored.
- **Token Invalidation**: Server-side token blacklisting on user sign-out prevents token reuse.
- **Input Sanitization & Schema Validation**: Robust validation layers (Zod / Joi) rejecting malformed inputs, SQL injections, and prototype tampering.
- **Protected File Streaming**: Document uploads and downloads enforce magic-byte verification (`%PDF-`) and strictly verify user ownership or supervisor assignment.

---

# Product Areas

### 1. Institutional Governance
- Institution branding, official domain, and accreditation registry.
- Department and academic unit lifecycle management.
- System-wide audit logs and configuration settings.

### 2. User Administration & Rosters
- Direct user creation and one-click activation invitation workflows.
- High-throughput CSV bulk ingestion for students and industry mentors.
- Role reassignment, department mapping, and account status toggles.

### 3. Student Workspace
- Interactive dashboard featuring active engagement status and today's upcoming deliverables.
- Milestone timelines, task checklists, and multi-file evidence submission modals.
- Real-time mentor feedback ledgers and Program Outcome verification meters.

### 4. Mentor Workspace
- Supervisor overview displaying assigned interns and pending review queues.
- Deliverable review station with one-click Accept, Request Revisions, and qualitative notes.
- Rubric-based final evaluations and outcome sign-offs.

### 5. Institutional Analytics & Reports
- Comprehensive telemetry tracking active placements, completion ratios, and departmental throughput.
- Host employer distribution matrices and supervisor workload balancing.
- One-click institutional CSV analytical export.

---

# Demo Environment

The default demo environment is pre-configured with realistic synthetic records inspired by:

**G H Raisoni International Skill Tech University, Pune**
- **Short Name**: `GHRISTU`
- **Tenant Code**: `GHRISTU_PUNE`
- **Location**: Pune, Maharashtra, India
- **Reference**: [https://ghristu.edu.in/](https://ghristu.edu.in/)

### Pre-Configured Demo Personas

| Role | Name | Email | Password | Context |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Dr. Anil Deshmukh | `admin@ghristu-demo.in` | `Demo@123` | Institutional Administrator |
| **Industry Mentor** | Rahul Mehta | `rahul.mehta@ghristu-demo.in` | `Demo@123` | Tata Consultancy Services (TCS) |
| **Industry Mentor** | Priya Nair | `priya.nair@ghristu-demo.in` | `Demo@123` | Infosys Limited |
| **Industry Mentor** | Amit Kulkarni | `amit.kulkarni@ghristu-demo.in` | `Demo@123` | Persistent Systems |
| **Industry Mentor** | Vikram Deshmukh | `vikram.deshmukh@ghristu-demo.in` | `Demo@123` | Tech Mahindra |
| **Student** | Aarav Sharma | `aarav.sharma@ghristu-demo.in` | `Demo@123` | Roll: `GHR-CSE-2026-041`, TCS Intern (~60% progress) |
| **Student** | Ananya Patil | `ananya.patil@ghristu-demo.in` | `Demo@123` | Roll: `GHR-IT-2026-057`, Infosys Intern (Active) |
| **Student** | Rohan Joshi | `rohan.joshi@ghristu-demo.in` | `Demo@123` | Roll: `GHR-BCA-2026-023`, Persistent Intern (Active) |
| **Student** | Sneha Kulkarni | `sneha.kulkarni@ghristu-demo.in` | `Demo@123` | Roll: `GHR-CSE-2026-089`, Tech Mahindra (Pending Approval) |

> *Note: All demo records are strictly synthetic and clearly marked for demonstration purposes.*

---

# Technology Stack

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3 (Vanilla CSS responsive design system)
- **Icons**: Lucide React
- **Routing**: React Router DOM 6

### Backend Architecture
- **Runtime**: Node.js (LTS v20+)
- **Framework**: Express.js with TypeScript
- **ORM & Database**: Prisma ORM with PostgreSQL 16
- **Authentication**: Stateless JSON Web Tokens (JWT) with bcrypt hashing
- **File Handling**: Multer with disk-buffer streaming and magic byte validation

### Monorepo Workspaces
- `apps/web`: React SPA frontend application
- `apps/api`: Express REST API backend service
- `packages/types`: Shared TypeScript DTOs, enums, and API interfaces
- `packages/shared`: Shared utilities, role normalization, and validation rules

---

# Application Structure

```text
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── controllers/      # Route request handlers
│   │   │   ├── middleware/       # JWT auth, RBAC, tenant isolation, rate limiting
│   │   │   ├── routes/           # Express router definitions
│   │   │   ├── services/         # Domain business logic & data access
│   │   │   ├── index.ts          # Server initialization & app bootstrap
│   │   │   └── prisma/           # Prisma schema & migrations
│   │   └── package.json
│   │
│   └── web/
│       ├── src/
│       │   ├── components/       # Reusable UI components (Modals, Tables, Navbar, Sidebar)
│       │   ├── context/          # React AuthContext & Global State
│       │   ├── layouts/          # AppLayout, AuthLayout, MarketingLayout
│       │   ├── pages/            # View pages (Admin, Student, Mentor, Analytics)
│       │   ├── services/         # Axios/Fetch API client bindings
│       │   ├── App.tsx           # Route registry & protection wrappers
│       │   └── main.tsx          # Application mount point
│       └── package.json
│
├── packages/
│   ├── types/                    # Shared DTO contracts & enums
│   └── shared/                   # Shared normalization & constants
│
├── docker-compose.yml            # Local PostgreSQL container orchestration
├── package.json                  # Monorepo root scripts & workspaces config
└── README.md                     # Platform documentation
```

---

# Authentication & Authorization

InternOS employs a secure, token-based authentication mechanism:

1. **Login Flow**: Users provide email, password, and optional organization code. The server verifies credentials against tenant records and issues a cryptographically signed JWT containing `userId`, `role`, and `organizationId`.
2. **Access Control Verification**: Every private endpoint passes through `authenticate` and `requireRole([UserRole.ADMIN, ...])`.
3. **Session Invalidation**: When a user logs out, the JWT jti/signature is recorded into the revocation store, preventing replay attacks.
4. **Token Refresh & Activation**: Invited users receive single-use cryptographic tokens to set up passwords securely.

---

# Internship Lifecycle

Internships transition through a finite state machine:

```text
[DRAFT]
   │
   ▼
[PENDING_APPROVAL] ──(Rejected)──► [REJECTED]
   │
   ▼ (Approved)
[ACTIVE] ◄─── (Work & Milestones In Progress)
   │
   ▼ (All deliverables & outcomes satisfied)
[PENDING_COMPLETION]
   │
   ▼ (Final evaluation signed)
[COMPLETED]
```

At each transition, the system verifies prerequisites (e.g., minimum required tasks approved, Program Outcomes covered, final evaluation score recorded).

---

# CSV Imports

Institutional administrators can onboard entire cohorts in seconds:

### Student CSV Ingestion
Supported headers: `roll_number`, `first_name`, `last_name`, `email`, `department_code`, `program`, `academic_year`.

### Mentor CSV Ingestion
Supported headers: `first_name`, `last_name`, `email`, `company_name`, `designation`, `phone`.

- **Atomic Validation**: Scans files for missing headers, duplicate emails, and invalid department codes before executing inserts.
- **Conflict Handling**: Clear error summaries highlighting specific line numbers and failure reasons.

---

# Documents & Evidence

- **PDF Magic Byte Enforcement**: All document uploads are checked for the `%PDF-` header signature to prevent malicious file uploads.
- **Secure File Streaming**: Documents are served with strict `Content-Disposition` headers (inline preview or attachment download).
- **Access Authorization**: Files can only be downloaded by the document owner, assigned academic coordinator, or linked mentor. Cross-tenant document access is strictly blocked (HTTP 403).

---

# Analytics

Institutional administrators have access to real-time aggregated metrics:
- **Enrollment vs. Active Placement**: Ratio of enrolled students to active interns.
- **Departmental Completion Throughput**: Bar breakdowns of milestone completion across engineering and management disciplines.
- **Partner Company Distribution**: Concentration of interns across corporate partners.
- **Outcome Attainment Rates**: Coverage metrics indicating which Program Outcomes have verified evidence across the cohort.
- **CSV Data Export**: Instant download of complete institutional analytics reports.

---

# Audit Trail

Every sensitive institutional event is written to an immutable audit ledger:
- User logins, password activations, and role changes.
- Milestone creations, task assignments, and evidence submissions.
- Mentor reviews, evaluation score entries, and completion confirmations.
- Cross-tenant intrusion attempts and authorization rejections.

Audit records include timestamp, actor ID, action type, target entity ID, IP address, and metadata diffs.

---

# Institution Registration

Any educational institution can onboard onto InternOS independently via `/register-institution`:
- Collects official university name, tenant code, accreditation status (NAAC/NBA/AICTE), campus address, and official domain.
- Automatically provisions the root administrator account and creates isolated database boundaries.
- **Zero Cross-Contamination**: New institutions remain completely isolated from the demo environment (`demo-ghristu-pune`) and other tenants.

---

# Invitation Workflow

Administrators can securely invite faculty, mentors, and students:
1. Admin triggers invite specifying user email, name, and target role.
2. The server generates a unique, time-limited activation token.
3. The invitee opens the activation URL, sets their secure password, and is automatically redirected to their dedicated workspace.

---

# Responsive UI

The InternOS interface is built for modern cross-device usability:
- **Mobile Off-Canvas Drawer**: The sidebar transitions seamlessly into an accessible slide-over drawer on mobile and tablet screens (< 768px).
- **Adaptive Top Navigation**: Long university titles truncate gracefully, and essential controls (notifications, profile, logout) remain accessible without clipping.
- **Touch-Friendly Modals & Tables**: Data tables feature smooth horizontal scrolling on phones; modal dialogs adapt dynamically to screen heights without clipping action buttons.
- **Responsive Workspace Dashboards**: KPI metric cards and action buttons dynamically rearrange from single-column mobile views to multi-column desktop layouts.

---

# Validation & Reliability

- **End-to-End Type Safety**: Shared TypeScript interfaces across frontend and backend prevent runtime contract mismatches.
- **Zod / Joi Request Validation**: Incoming payloads are validated against strict schemas before service execution.
- **Transactional State Operations**: Critical transitions (evaluations, task approvals, CSV batches) are wrapped in atomic database transactions.

---

# Development Setup

### Prerequisites
- Node.js (v20.x or higher)
- npm (v10.x or higher)
- PostgreSQL (v16.x) or Docker Desktop

### 1. Clone Repository
```bash
git clone https://github.com/innocentgaming/Hack-2-Ignite-team_37.git
cd Hack-2-Ignite-team_37
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build Packages
```bash
npm --workspace=@internos/types run build
npm --workspace=@internos/shared run build
```

### 4. Database Setup
Start the local PostgreSQL database using Docker:
```bash
docker compose up -d
```

Apply database migrations:
```bash
npm --workspace=@internos/api run prisma:migrate
```

### 5. Start Development Servers
Start both backend API and frontend Vite dev servers:
```bash
# Terminal 1 (API Server on port 4000)
npm --workspace=@internos/api run dev

# Terminal 2 (Web Client on port 5173)
npm --workspace=@internos/web run dev
```

---

# Environment Configuration

### Backend (`apps/api/.env`)
```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/internos?schema=public"
JWT_SECRET="internos-super-secret-jwt-development-key-32-chars"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
UPLOAD_DIR="./uploads"
```

### Frontend (`apps/web/.env`)
```env
VITE_API_URL="http://localhost:4000"
```

---

# Testing

InternOS maintains comprehensive automated test coverage spanning authentication, multi-tenancy, state machines, CSV ingestion, and RBAC security:

```bash
# Run the complete test suite
npm run test
```

### Verified Test Results
```text
ℹ tests 278
ℹ suites 68
ℹ pass 278
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ duration_ms ~80,000ms
```

---

# Production Considerations

- **Database Connection Pooling**: Deploy with PgBouncer or managed database connection pools (Supabase, Neon, AWS RDS).
- **Object Storage**: For high-volume production deployments, configure S3/Cloud Storage adapters for PDF evidence storage.
- **Reverse Proxy & SSL**: Terminate TLS using Nginx, Cloudflare, or platform reverse proxies with standard HSTS headers.
- **Horizontal Scaling**: Stateless JWT authentication allows seamless horizontal scaling of backend API instances behind load balancers.

---

# Roadmap

- [x] Multi-tenant zero-trust architectural isolation
- [x] End-to-end task evidence review loop with mentor feedback
- [x] Outcome-Based Education (OBE) Program Outcome mapping
- [x] AI-assisted evidence evaluation advisory intelligence
- [x] High-throughput CSV student and mentor ingestion
- [x] Responsive mobile off-canvas drawer navigation
- [ ] Automated Webhook notifications (Slack / Microsoft Teams / WhatsApp)
- [ ] Verifiable digital completion credentials with cryptographic QR verification
- [ ] Single Sign-On (SSO) integration with SAML 2.0 and Google Workspace

---

# Project Positioning

InternOS bridges the gap between higher education institutions and industry host employers. By substituting subjective attendance checklists with auditable evidence deliverables and clear learning outcome attainment, InternOS establishes a trustworthy, modern operating system for university internship governance.
