# InternOS Database Architecture (Phase 0)

## 1. Overview

The InternOS persistence layer utilizes **PostgreSQL** managed through **Prisma ORM**. The data model enforces multi-tenant tenancy isolation, referential integrity with cascade and restrict policies, and comprehensive auditability.

Phase 0 defines exactly **20 relational models** to support the full lifecycle of internships, workflow execution, outcome-based education (OBE) evaluation, notifications, and auditing.

---

## 2. Relational Entity Inventory (20 Models)

| # | Model Name | Primary Purpose | Key Indexes / Constraints |
|---|---|---|---|
| 1 | **Organization** | Multi-tenant root partition | Unique `code`, index on `code` |
| 2 | **Department** | Academic branch within an institution | Composite unique `[organizationId, code]` |
| 3 | **User** | Central identity entity for all roles | Composite unique `[organizationId, email]`, index `[organizationId, role]` |
| 4 | **StudentProfile** | Academic details for student users | Unique `userId`, index `rollNumber` |
| 5 | **FacultyProfile** | Departmental faculty designations | Unique `userId`, index `employeeId` |
| 6 | **MentorProfile** | Industry partner mentors | Unique `userId`, index `companyId` |
| 7 | **Company** | Corporate internship host partner | Composite index `[organizationId, name]` |
| 8 | **Internship** | Primary internship engagement record | Composite index `[organizationId, status]`, index `studentId` |
| 9 | **WorkflowTemplate** | Configurable lifecycle milestone blueprint | Index `[organizationId]` |
| 10 | **WorkflowInstance** | Active workflow execution for an internship | Unique `internshipId`, index `[organizationId, status]` |
| 11 | **WorkflowTask** | Concrete milestone task within a workflow | Composite index `[organizationId, status]`, index `instanceId` |
| 12 | **Outcome** | Program Outcome (PO) / Course Outcome (CO) | Composite unique `[organizationId, code]` |
| 13 | **OutcomeVersion** | Rubric and versioning for an Outcome | Composite unique `[outcomeId, versionNumber]` |
| 14 | **Submission** | Student work deliverable for a task | Composite index `[organizationId, status]`, index `taskId` |
| 15 | **Review** | Qualitative feedback from mentor or faculty | Composite index `[organizationId]`, index `submissionId` |
| 16 | **Evaluation** | Rubric-based scoring against an Outcome | Composite index `[organizationId]`, index `submissionId` |
| 17 | **AIAnalysis** | Persistence structure for future automated review | Composite index `[organizationId]`, index `submissionId` |
| 18 | **Notification** | User-directed alerts and lifecycle updates | Composite index `[organizationId, userId, isRead]` |
| 19 | **AuditLog** | Immutable security and compliance event log | Composite index `[organizationId, action]`, index `[entity, entityId]` |
| 20 | **Document** | Metadata for uploaded files and artifacts | Composite index `[organizationId]`, index `uploaderId` |

---

## 3. Core Enums

```prisma
enum UserRole {
  SUPER_ADMIN
  INSTITUTION_ADMIN
  FACULTY_SUPERVISOR
  INDUSTRY_MENTOR
  STUDENT
}

enum UserStatus {
  ACTIVE
  INACTIVE
  PENDING_VERIFICATION
  SUSPENDED
}

enum InternshipStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  ACTIVE
  UNDER_REVIEW
  COMPLETED
  TERMINATED
}

enum WorkflowStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  BLOCKED
}

enum TaskStatus {
  PENDING
  SUBMITTED
  CHANGES_REQUESTED
  APPROVED
  REJECTED
}

enum SubmissionStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  ACCEPTED
  REVISION_NEEDED
}

enum NotificationType {
  SYSTEM
  TASK_ASSIGNED
  SUBMISSION_RECEIVED
  REVIEW_SUBMITTED
  EVALUATION_POSTED
  DEADLINE_WARNING
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  ACCESS_DENIED
  EXPORT
}
```

---

## 4. Multi-Tenant Scoping Rules

1. **Foreign Key Cascade**: Deleting an `Organization` cascades down to delete all child entities (Users, Departments, Internships, etc.).
2. **Identity Boundaries**: Emails are unique per organization (`@@unique([organizationId, email])`). This permits the same external mentor or auditor to belong to multiple independent institutional tenants.
3. **Audit Immutability**: `AuditLog` records have `onDelete: SetNull` on `actorId` to ensure the action record remains immutable even if the user account is purged.

---

## 5. Migrations & Seeding

- **Migrations Path**: `prisma/migrations/20260916000000_init/migration.sql`
- **Seed Script**: `prisma/seed.ts`
- **Demo Accounts Seeded**:
  - `admin@apex.edu` (Institution Admin)
  - `dr.sharma@apex.edu` (Faculty Supervisor)
  - `raj.patel@acmecloud.com` (Industry Mentor)
  - `alex.student@apex.edu` (Student)
  - `superadmin@internos.local` (Super Admin)
  - Default Password: `Password123!`
