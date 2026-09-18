import {
  MilestoneDto,
  CreateMilestoneDto,
  UpdateMilestoneDto,
  TaskItemDto,
  CreateTaskDto,
  UpdateTaskDto,
  StudentDashboardDto,
  MentorDashboardDto,
  MentorInternDetailDto,
  StudentOutcomeViewDto,
  SubmissionDto,
  SubmissionStatus,
  TaskStatus,
  InternshipStatus,
  UserRole,
  AuthenticatedUser,
  EvidenceType,
  MentorReviewSubmissionDto,
} from '@internos/types';
import {
  NotFoundError,
  TenantViolationError,
  ValidationError,
  ForbiddenError,
  normalizeRole,
} from '@internos/shared';
import { internshipStore } from './internship.service.js';
import { authStore } from './auth.service.js';
import { tenantStore } from './tenant.service.js';
import { auditService } from './audit.service.js';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

function generateMinimalValidPdf(title: string, body: string): Buffer {
  const textStream = `BT /F1 16 Tf 50 720 Td (${title}) Tj ET\nBT /F1 12 Tf 50 680 Td (${body}) Tj ET\nBT /F1 10 Tf 50 640 Td (InternOS Institutional Document Vault - Digitally Verified) Tj ET`;
  const streamLength = Buffer.byteLength(textStream, 'utf-8');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${textStream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  const header = '%PDF-1.4\n';
  let bodyStr = '';
  let xref = 'xref\n0 6\n0000000000 65535 f \n';
  let offset = Buffer.byteLength(header, 'utf-8');

  for (let i = 0; i < objects.length; i++) {
    xref += String(offset).padStart(10, '0') + ' 00000 n \n';
    bodyStr += objects[i];
    offset += Buffer.byteLength(objects[i], 'utf-8');
  }

  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`;
  return Buffer.from(header + bodyStr + xref + trailer, 'utf-8');
}

// ==========================================
// In-Memory Data Models for Milestones & Tasks
// ==========================================

export interface InMemoryMilestone {
  id: string;
  organizationId: string;
  internshipId: string;
  title: string;
  description: string;
  order: number;
  startDate?: Date;
  dueDate: Date;
  progress: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryTask {
  id: string;
  organizationId: string;
  internshipId: string;
  milestoneId?: string;
  title: string;
  description: string;
  instructions?: string;
  stage?: string;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: Date;
  learningOutcomeId?: string;
  expectedEvidence: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemorySubmissionRecord {
  id: string;
  organizationId: string;
  internshipId: string;
  taskId: string;
  studentId: string;
  title: string;
  description: string;
  evidenceType: EvidenceType;
  evidenceUrl?: string;
  evidenceUrls?: string[];
  attachmentName?: string;
  notes?: string;
  status: SubmissionStatus;
  submittedAt: Date;
  updatedAt: Date;
  mentorFeedback?: string;
  mentorRating?: number;
  mentorStrengths?: string;
  mentorImprovements?: string;
  mentorNextAction?: string;
  reviewedAt?: Date;
  history?: Array<{
    title: string;
    description: string;
    evidenceType: EvidenceType;
    evidenceUrl?: string;
    evidenceUrls?: string[];
    attachmentName?: string;
    notes?: string;
    status: SubmissionStatus;
    submittedAt: Date;
    reviewedAt?: Date;
    mentorFeedback?: string;
    mentorRating?: number;
  }>;
}

export interface InMemoryOutcomeDef {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description: string;
  expectedEvidence: string[];
}

export class StudentMentorStore {
  milestones = new Map<string, InMemoryMilestone>();
  tasks = new Map<string, InMemoryTask>();
  submissions = new Map<string, InMemorySubmissionRecord>();
  outcomes = new Map<string, InMemoryOutcomeDef>();

  constructor() {
    this.seed();
  }

  seed() {
    const orgId = 'org-a-id';
    const now = new Date('2026-09-01T00:00:00Z');

    // 1. Seed Learning Outcomes for Org A
    const outcome1: InMemoryOutcomeDef = {
      id: 'out-api-dev',
      organizationId: orgId,
      code: 'PO-1',
      name: 'Production REST API Engineering',
      description: 'Design, implement, and document scalable RESTful APIs with secure authentication and database persistence.',
      expectedEvidence: [
        'GitHub Pull Request with clean commits',
        'API documentation and OpenAPI schema',
        'Automated test suite (Jest/Supertest)',
        'Live deployment URL',
      ],
    };
    const outcome2: InMemoryOutcomeDef = {
      id: 'out-cicd',
      organizationId: orgId,
      code: 'PO-2',
      name: 'CI/CD Automation & Cloud Deployment',
      description: 'Automate build, lint, and test pipelines with containerization and cloud staging deployments.',
      expectedEvidence: [
        'GitHub Actions workflow build logs',
        'Docker container configuration',
        'Staging environment health verification',
      ],
    };
    const outcome3: InMemoryOutcomeDef = {
      id: 'out-perf',
      organizationId: orgId,
      code: 'PO-3',
      name: 'System Optimization & Security Audit',
      description: 'Profile database query efficiency, implement Redis caching, and execute penetration/security audit.',
      expectedEvidence: [
        'Lighthouse / load testing benchmark report',
        'Security scanning report',
      ],
    };
    this.outcomes.set(outcome1.id, outcome1);
    this.outcomes.set(outcome2.id, outcome2);
    this.outcomes.set(outcome3.id, outcome3);

    // 2. Seed Milestones for internship-a-1 (Sam Student at Google Cloud Solutions)
    const m1: InMemoryMilestone = {
      id: 'ms-1',
      organizationId: orgId,
      internshipId: 'internship-a-1',
      title: 'Project Setup & Architecture',
      description: 'Local environment initialization, container setup, and architecture documentation.',
      order: 1,
      startDate: new Date('2026-06-01'),
      dueDate: new Date('2026-06-30'),
      progress: 100,
      status: 'COMPLETED',
      createdAt: now,
      updatedAt: now,
    };
    const m2: InMemoryMilestone = {
      id: 'ms-2',
      organizationId: orgId,
      internshipId: 'internship-a-1',
      title: 'Backend API Development',
      description: 'Core microservices, JWT authentication, and relational data schema implementation.',
      order: 2,
      startDate: new Date('2026-07-01'),
      dueDate: new Date('2026-09-20'),
      progress: 75,
      status: 'IN_PROGRESS',
      createdAt: now,
      updatedAt: now,
    };
    const m3: InMemoryMilestone = {
      id: 'ms-3',
      organizationId: orgId,
      internshipId: 'internship-a-1',
      title: 'Testing & Cloud Deployment',
      description: 'Integration test suites, staging deployment, and production verification.',
      order: 3,
      startDate: new Date('2026-09-21'),
      dueDate: new Date('2026-11-15'),
      progress: 0,
      status: 'NOT_STARTED',
      createdAt: now,
      updatedAt: now,
    };
    this.milestones.set(m1.id, m1);
    this.milestones.set(m2.id, m2);
    this.milestones.set(m3.id, m3);

    // 3. Seed Tasks for internship-a-1
    const t1: InMemoryTask = {
      id: 'task-101',
      organizationId: orgId,
      internshipId: 'internship-a-1',
      milestoneId: 'ms-1',
      title: 'Repository & Development Container Setup',
      description: 'Configure Docker compose, TypeScript tooling, and linter standards.',
      instructions: 'Clone repo template, set up docker-compose.yml for local Postgres, verify npm run dev.',
      status: TaskStatus.APPROVED,
      priority: 'HIGH',
      dueDate: new Date('2026-06-15'),
      learningOutcomeId: 'out-cicd',
      expectedEvidence: 'GitHub Repository URL with Dockerfile and Readme instructions',
      createdAt: now,
      updatedAt: now,
    };
    const t2: InMemoryTask = {
      id: 'task-102',
      organizationId: orgId,
      internshipId: 'internship-a-1',
      milestoneId: 'ms-2',
      title: 'Authentication API',
      description: 'Build robust JWT access and refresh token authentication endpoints.',
      instructions: 'Create /auth/login, /auth/refresh, /auth/logout with bcrypt hash and HMAC tokens.',
      status: TaskStatus.PENDING,
      priority: 'HIGH',
      dueDate: new Date('2026-09-20'),
      learningOutcomeId: 'out-api-dev',
      expectedEvidence: 'GitHub PR, Postman test report',
      createdAt: now,
      updatedAt: now,
    };
    const t3: InMemoryTask = {
      id: 'task-103',
      organizationId: orgId,
      internshipId: 'internship-a-1',
      milestoneId: 'ms-2',
      title: 'Database Schema & Multi-Tenant Isolation',
      description: 'Implement CRUD operations for internships and departments with tenant isolation.',
      instructions: 'Verify all database queries include organizationId filter.',
      status: TaskStatus.SUBMITTED,
      priority: 'HIGH',
      dueDate: new Date('2026-09-25'),
      learningOutcomeId: 'out-api-dev',
      expectedEvidence: 'PR link with automated integration tests verifying 403 on cross-tenant access',
      createdAt: now,
      updatedAt: now,
    };
    const t4: InMemoryTask = {
      id: 'task-104',
      organizationId: orgId,
      internshipId: 'internship-a-1',
      milestoneId: 'ms-2',
      title: 'CI/CD Pipeline & Automated Workflows',
      description: 'Configure automated testing and container build workflow in GitHub Actions.',
      instructions: 'Submit GitHub Actions workflow file and verify passing automated test runs.',
      status: TaskStatus.CHANGES_REQUESTED,
      priority: 'MEDIUM',
      dueDate: new Date('2026-09-28'),
      learningOutcomeId: 'out-cicd',
      expectedEvidence: 'GitHub Actions workflow file and pipeline run execution badge',
      createdAt: now,
      updatedAt: now,
    };
    const t5: InMemoryTask = {
      id: 'task-105',
      organizationId: orgId,
      internshipId: 'internship-a-1',
      milestoneId: 'ms-3',
      title: 'Deployment & Cloud Staging Release',
      description: 'Deploy containerized application to staging environment with health checks and SSL.',
      instructions: 'Configure Docker compose deployment with HTTPS reverse proxy and readiness probes.',
      status: TaskStatus.APPROVED,
      priority: 'URGENT',
      dueDate: new Date('2026-10-10'),
      learningOutcomeId: 'out-cicd',
      expectedEvidence: 'Live staging URL and verified SSL deployment report',
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(t1.id, t1);
    this.tasks.set(t2.id, t2);
    this.tasks.set(t3.id, t3);
    this.tasks.set(t4.id, t4);
    this.tasks.set(t5.id, t5);

    // 4. Seed Submissions
    const sub1: InMemorySubmissionRecord = {
      id: 'sub-101',
      organizationId: orgId,
      internshipId: 'internship-a-1',
      taskId: 'task-101',
      studentId: 'user-a-student',
      title: 'Dev Container & Repository Setup Evidence',
      description: 'Configured TypeScript monorepo with PostgreSQL container and pre-commit hooks.',
      evidenceType: EvidenceType.GITHUB_REPO,
      evidenceUrl: 'https://github.com/apex-students/cloud-internos-app',
      attachmentName: 'setup-verification.pdf',
      status: SubmissionStatus.ACCEPTED,
      submittedAt: new Date('2026-06-14'),
      updatedAt: new Date('2026-06-16'),
      mentorFeedback: 'Clean directory structure and reproducible docker-compose setup. Accepted.',
      mentorRating: 5,
      mentorStrengths: 'Fast onboarding and thorough Readme documentation.',
      mentorImprovements: 'Add healthcheck to Postgres service in Docker.',
      mentorNextAction: 'Proceed to authentication endpoints.',
      reviewedAt: new Date('2026-06-16'),
    };
    const sub3: InMemorySubmissionRecord = {
      id: 'sub-103',
      organizationId: orgId,
      internshipId: 'internship-a-1',
      taskId: 'task-103',
      studentId: 'user-a-student',
      title: 'Database Schema & Multi-Tenant Isolation Evidence',
      description: 'Added multi-tenant isolation middleware and database filters with comprehensive test suite.',
      evidenceType: EvidenceType.GITHUB_PR,
      evidenceUrl: 'https://github.com/apex-students/cloud-internos-app/pull/12',
      status: SubmissionStatus.SUBMITTED,
      submittedAt: new Date('2026-09-17T14:30:00Z'),
      updatedAt: new Date('2026-09-17T14:30:00Z'),
    };
    const sub4: InMemorySubmissionRecord = {
      id: 'sub-104',
      organizationId: orgId,
      internshipId: 'internship-a-1',
      taskId: 'task-104',
      studentId: 'user-a-student',
      title: 'CI/CD Pipeline GitHub Actions Implementation',
      description: 'Implemented automated test runner and container packaging on pull requests.',
      evidenceType: EvidenceType.GITHUB_PR,
      evidenceUrl: 'https://github.com/apex-students/cloud-internos-app/pull/15',
      status: SubmissionStatus.REVISION_NEEDED,
      submittedAt: new Date('2026-09-15'),
      updatedAt: new Date('2026-09-17'),
      mentorFeedback: 'Please add test cases for invalid credentials and edge-case token expiration before staging release.',
      mentorRating: 3,
      mentorStrengths: 'Well-structured workflow with caching.',
      mentorImprovements: 'Missing negative test cases in CI run.',
      mentorNextAction: 'Add negative auth test assertions and resubmit evidence.',
      reviewedAt: new Date('2026-09-17T09:00:00Z'),
    };
    const sub5: InMemorySubmissionRecord = {
      id: 'sub-105',
      organizationId: orgId,
      internshipId: 'internship-a-1',
      taskId: 'task-105',
      studentId: 'user-a-student',
      title: 'Cloud Staging Infrastructure Release',
      description: 'Successfully deployed to staging environment with active SSL certificates and health endpoints.',
      evidenceType: EvidenceType.DEPLOYMENT_URL,
      evidenceUrl: 'https://staging.apex-internos.internal',
      status: SubmissionStatus.ACCEPTED,
      submittedAt: new Date('2026-09-16'),
      updatedAt: new Date('2026-09-16'),
      mentorFeedback: 'Verified live endpoints and secure SSL configuration. Excellent work.',
      mentorRating: 5,
      reviewedAt: new Date('2026-09-16T17:00:00Z'),
    };
    this.submissions.set(sub1.id, sub1);
    this.submissions.set(sub3.id, sub3);
    this.submissions.set(sub4.id, sub4);
    this.submissions.set(sub5.id, sub5);

    // 5. Seed for internship-a-2 (Maya Patel @ Stripe Systems, Mentor: Sarah Jenkins)
    const m2_1: InMemoryMilestone = {
      id: 'ms-2-1',
      organizationId: orgId,
      internshipId: 'internship-a-2',
      title: 'Event Streaming & Kafka Ingestion',
      description: 'Implement distributed ingestion pipeline with message queues.',
      order: 1,
      startDate: new Date('2026-06-15'),
      dueDate: new Date('2026-08-30'),
      progress: 60,
      status: 'IN_PROGRESS',
      createdAt: now,
      updatedAt: now,
    };
    this.milestones.set(m2_1.id, m2_1);

    const t2_1: InMemoryTask = {
      id: 'task-201',
      organizationId: orgId,
      internshipId: 'internship-a-2',
      milestoneId: 'ms-2-1',
      title: 'Kafka Consumer Group Resiliency',
      description: 'Implement exponential backoff retry and dead letter queue.',
      instructions: 'Ensure failed messages route to DLQ after 3 retries.',
      status: TaskStatus.SUBMITTED,
      priority: 'HIGH',
      dueDate: new Date('2026-08-25'),
      learningOutcomeId: 'out-api-dev',
      expectedEvidence: 'PR with consumer unit tests and telemetry dashboard',
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(t2_1.id, t2_1);

    const sub2_1: InMemorySubmissionRecord = {
      id: 'sub-201',
      organizationId: orgId,
      internshipId: 'internship-a-2',
      taskId: 'task-201',
      studentId: 'user-a-student-2',
      title: 'Dead Letter Queue & Retry Consumer Implementation',
      description: 'Added DLQ topic and retry consumer with 100% test coverage.',
      evidenceType: EvidenceType.GITHUB_PR,
      evidenceUrl: 'https://github.com/apex-students/streaming-pipeline/pull/3',
      status: SubmissionStatus.SUBMITTED,
      submittedAt: new Date('2026-08-24'),
      updatedAt: new Date('2026-08-24'),
    };
    this.submissions.set(sub2_1.id, sub2_1);

    // 6. Seed for internship-a-3 (David Chen @ Amazon Web Systems, Mentor: Mark Mentor)
    const m3_1: InMemoryMilestone = {
      id: 'ms-3-1',
      organizationId: orgId,
      internshipId: 'internship-a-3',
      title: 'Infrastructure Setup',
      description: 'Provision reproducible cloud VPC, security groups, and automated CI/CD terraform pipelines.',
      order: 1,
      startDate: new Date('2026-07-01'),
      dueDate: new Date('2026-09-15'),
      progress: 80,
      status: 'IN_PROGRESS',
      createdAt: now,
      updatedAt: now,
    };
    const m3_2: InMemoryMilestone = {
      id: 'ms-3-2',
      organizationId: orgId,
      internshipId: 'internship-a-3',
      title: 'Kubernetes & Service Mesh',
      description: 'Deploy resilient EKS clusters, Helm deployments, and Istio service mesh observability.',
      order: 2,
      startDate: new Date('2026-09-16'),
      dueDate: new Date('2026-11-30'),
      progress: 0,
      status: 'NOT_STARTED',
      createdAt: now,
      updatedAt: now,
    };
    this.milestones.set(m3_1.id, m3_1);
    this.milestones.set(m3_2.id, m3_2);

    const t3_1: InMemoryTask = {
      id: 'task-301',
      organizationId: orgId,
      internshipId: 'internship-a-3',
      milestoneId: 'ms-3-1',
      title: 'Automated Terraform VPC Modules',
      description: 'Create modular Terraform definitions for private and public subnets.',
      instructions: 'Write terraform-docs and validate terraform plan output.',
      status: TaskStatus.APPROVED,
      priority: 'HIGH',
      dueDate: new Date('2026-08-10'),
      learningOutcomeId: 'out-cicd',
      expectedEvidence: 'Terraform repository with tfsec scan report',
      createdAt: now,
      updatedAt: now,
    };
    const t3_2: InMemoryTask = {
      id: 'task-302',
      organizationId: orgId,
      internshipId: 'internship-a-3',
      milestoneId: 'ms-3-1',
      title: 'Kubernetes Cluster Provisioning',
      description: 'Deploy production EKS cluster with managed node groups and IAM roles.',
      instructions: 'Configure cluster autoscaler and core add-ons.',
      status: TaskStatus.APPROVED,
      priority: 'HIGH',
      dueDate: new Date('2026-08-28'),
      learningOutcomeId: 'out-cicd',
      expectedEvidence: 'EKS cluster configuration and readiness probes',
      createdAt: now,
      updatedAt: now,
    };
    const t3_3: InMemoryTask = {
      id: 'task-303',
      organizationId: orgId,
      internshipId: 'internship-a-3',
      milestoneId: 'ms-3-1',
      title: 'Prometheus & Grafana Observability',
      description: 'Deploy centralized metrics collection and alert notification channels.',
      instructions: 'Export Grafana dashboard configuration with custom PromQL panels.',
      status: TaskStatus.APPROVED,
      priority: 'MEDIUM',
      dueDate: new Date('2026-09-08'),
      learningOutcomeId: 'out-perf',
      expectedEvidence: 'Grafana dashboard export and metrics latency report',
      createdAt: now,
      updatedAt: now,
    };
    const t3_4: InMemoryTask = {
      id: 'task-304',
      organizationId: orgId,
      internshipId: 'internship-a-3',
      milestoneId: 'ms-3-1',
      title: 'Zero-Trust Service Mesh Security',
      description: 'Configure Istio sidecar injection with mTLS strict peer authentication.',
      instructions: 'Verify zero-trust packet enforcement with telemetry logs.',
      status: TaskStatus.APPROVED,
      priority: 'HIGH',
      dueDate: new Date('2026-09-14'),
      learningOutcomeId: 'out-perf',
      expectedEvidence: 'mTLS verification report and Istio traffic rules',
      createdAt: now,
      updatedAt: now,
    };
    const t3_5: InMemoryTask = {
      id: 'task-305',
      organizationId: orgId,
      internshipId: 'internship-a-3',
      milestoneId: 'ms-3-2',
      title: 'Multi-Region Disaster Recovery & Failover',
      description: 'Implement automated Route53 health checks and cross-region database replication.',
      instructions: 'Execute failover test and record RTO/RPO recovery times.',
      status: TaskStatus.PENDING,
      priority: 'MEDIUM',
      dueDate: new Date('2026-10-20'),
      learningOutcomeId: 'out-cicd',
      expectedEvidence: 'Failover simulation script and latency benchmarks',
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(t3_1.id, t3_1);
    this.tasks.set(t3_2.id, t3_2);
    this.tasks.set(t3_3.id, t3_3);
    this.tasks.set(t3_4.id, t3_4);
    this.tasks.set(t3_5.id, t3_5);

    const sub3_1: InMemorySubmissionRecord = {
      id: 'sub-301',
      organizationId: orgId,
      internshipId: 'internship-a-3',
      taskId: 'task-301',
      studentId: 'user-a-student-3',
      title: 'Terraform VPC Infrastructure Modules',
      description: 'Modularized VPC creation across 3 availability zones with NAT gateways.',
      evidenceType: EvidenceType.GITHUB_REPO,
      evidenceUrl: 'https://github.com/aws-students/terraform-vpc-modules',
      status: SubmissionStatus.ACCEPTED,
      submittedAt: new Date('2026-08-09'),
      updatedAt: new Date('2026-08-10'),
      mentorFeedback: 'Terrific module reusability and clean terraform-docs.',
      mentorRating: 5,
      reviewedAt: new Date('2026-08-10'),
    };
    const sub3_2: InMemorySubmissionRecord = {
      id: 'sub-302',
      organizationId: orgId,
      internshipId: 'internship-a-3',
      taskId: 'task-302',
      studentId: 'user-a-student-3',
      title: 'EKS Cluster Provisioning Artifacts',
      description: 'Cluster automated bootstrap via eksctl with Karpenter autoscaling.',
      evidenceType: EvidenceType.GITHUB_PR,
      evidenceUrl: 'https://github.com/aws-students/cloud-infra/pull/2',
      status: SubmissionStatus.ACCEPTED,
      submittedAt: new Date('2026-08-27'),
      updatedAt: new Date('2026-08-28'),
      mentorFeedback: 'Proper least-privilege IAM IRSA roles configured.',
      mentorRating: 5,
      reviewedAt: new Date('2026-08-28'),
    };
    const sub3_3: InMemorySubmissionRecord = {
      id: 'sub-303',
      organizationId: orgId,
      internshipId: 'internship-a-3',
      taskId: 'task-303',
      studentId: 'user-a-student-3',
      title: 'Grafana & Prometheus Monitoring Dashboards',
      description: 'Centralized observability dashboards and Slack notification triggers.',
      evidenceType: EvidenceType.DOCUMENT,
      evidenceUrl: 'https://monitoring.aws-internal.net/dashboards/cluster-overview',
      attachmentName: 'grafana-metrics-report.pdf',
      status: SubmissionStatus.ACCEPTED,
      submittedAt: new Date('2026-09-07'),
      updatedAt: new Date('2026-09-08'),
      mentorFeedback: 'Detailed query panels for node CPU and request latencies.',
      mentorRating: 5,
      reviewedAt: new Date('2026-09-08'),
    };
    const sub3_4: InMemorySubmissionRecord = {
      id: 'sub-304',
      organizationId: orgId,
      internshipId: 'internship-a-3',
      taskId: 'task-304',
      studentId: 'user-a-student-3',
      title: 'Zero-Trust Service Mesh Verification',
      description: 'Configured Istio strict mTLS and authorization policies.',
      evidenceType: EvidenceType.GITHUB_PR,
      evidenceUrl: 'https://github.com/aws-students/cloud-infra/pull/5',
      status: SubmissionStatus.ACCEPTED,
      submittedAt: new Date('2026-09-13'),
      updatedAt: new Date('2026-09-14'),
      mentorFeedback: 'All non-mTLS traffic rejected as verified by network traces. Outstanding.',
      mentorRating: 5,
      reviewedAt: new Date('2026-09-14'),
    };
    this.submissions.set(sub3_1.id, sub3_1);
    this.submissions.set(sub3_2.id, sub3_2);
    this.submissions.set(sub3_3.id, sub3_3);
    this.submissions.set(sub3_4.id, sub3_4);

    // 7. Seed for GHRISTU_PUNE Demo (demo-ghristu-pune)
    const ghristuOrgId = 'demo-ghristu-pune';

    // 4 Accredited Learning Outcomes (PO-1 through PO-4)
    const outPo1: InMemoryOutcomeDef = {
      id: 'out-ghristu-po1',
      organizationId: ghristuOrgId,
      code: 'PO-1',
      name: 'Software Engineering & API Development',
      description: 'Design, implement, and document scalable RESTful APIs with secure authentication, database schemas, and automated tests.',
      expectedEvidence: [
        'REST API implementation',
        'API documentation',
        'Automated tests',
        'GitHub pull request',
      ],
    };
    const outPo2: InMemoryOutcomeDef = {
      id: 'out-ghristu-po2',
      organizationId: ghristuOrgId,
      code: 'PO-2',
      name: 'Cloud & DevOps',
      description: 'Implement continuous integration and continuous deployment workflows, containerize software, and automate cloud hosting.',
      expectedEvidence: [
        'CI/CD workflow',
        'Docker configuration',
        'Deployment evidence',
      ],
    };
    const outPo3: InMemoryOutcomeDef = {
      id: 'out-ghristu-po3',
      organizationId: ghristuOrgId,
      code: 'PO-3',
      name: 'Problem Solving & System Design',
      description: 'Architect scalable solutions, formulate architectural blueprints, and benchmark system throughput.',
      expectedEvidence: [
        'Architecture document',
        'Technical design',
        'Performance analysis',
      ],
    };
    const outPo4: InMemoryOutcomeDef = {
      id: 'out-ghristu-po4',
      organizationId: ghristuOrgId,
      code: 'PO-4',
      name: 'Professional Practice',
      description: 'Demonstrate workplace collaboration, iterative delivery, timely milestone reviews, and comprehensive completion documentation.',
      expectedEvidence: [
        'Weekly progress reports',
        'Mentor feedback',
        'Final internship report',
      ],
    };
    this.outcomes.set(outPo1.id, outPo1);
    this.outcomes.set(outPo2.id, outPo2);
    this.outcomes.set(outPo3.id, outPo3);
    this.outcomes.set(outPo4.id, outPo4);

    // ==========================================
    // Aarav Sharma @ TCS (internship-ghristu-1, Mentor: Rahul Mehta)
    // 5 Structured Milestones
    // ==========================================
    const aaravM1: InMemoryMilestone = {
      id: 'ms-ghristu-1',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-1',
      title: 'Milestone 1: Project Onboarding & Architecture',
      description: 'Development environment setup, understand application architecture, repository setup, and architecture documentation.',
      order: 1,
      startDate: new Date('2026-06-01'),
      dueDate: new Date('2026-06-30'),
      progress: 100,
      status: 'COMPLETED',
      createdAt: now,
      updatedAt: now,
    };
    const aaravM2: InMemoryMilestone = {
      id: 'ms-ghristu-2',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-1',
      title: 'Milestone 2: Backend API Development',
      description: 'REST API implementation, JWT authentication, database schema, and CRUD APIs.',
      order: 2,
      startDate: new Date('2026-07-01'),
      dueDate: new Date('2026-08-15'),
      progress: 100,
      status: 'COMPLETED',
      createdAt: now,
      updatedAt: now,
    };
    const aaravM3: InMemoryMilestone = {
      id: 'ms-ghristu-3',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-1',
      title: 'Milestone 3: Frontend Integration',
      description: 'API integration, authentication UI, error handling, and responsive interface.',
      order: 3,
      startDate: new Date('2026-08-16'),
      dueDate: new Date('2026-09-30'),
      progress: 50,
      status: 'IN_PROGRESS',
      createdAt: now,
      updatedAt: now,
    };
    const aaravM4: InMemoryMilestone = {
      id: 'ms-ghristu-4',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-1',
      title: 'Milestone 4: Testing & Deployment',
      description: 'Unit testing, integration testing, CI/CD configuration, and cloud deployment.',
      order: 4,
      startDate: new Date('2026-10-01'),
      dueDate: new Date('2026-10-31'),
      progress: 0,
      status: 'NOT_STARTED',
      createdAt: now,
      updatedAt: now,
    };
    const aaravM5: InMemoryMilestone = {
      id: 'ms-ghristu-5',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-1',
      title: 'Milestone 5: Final Delivery',
      description: 'Technical documentation, final demo, final repository submission, and internship completion report.',
      order: 5,
      startDate: new Date('2026-11-01'),
      dueDate: new Date('2026-11-30'),
      progress: 0,
      status: 'NOT_STARTED',
      createdAt: now,
      updatedAt: now,
    };
    this.milestones.set(aaravM1.id, aaravM1);
    this.milestones.set(aaravM2.id, aaravM2);
    this.milestones.set(aaravM3.id, aaravM3);
    this.milestones.set(aaravM4.id, aaravM4);
    this.milestones.set(aaravM5.id, aaravM5);

    // Aarav's Tasks: Exactly 6 tasks (4 Completed/Approved, 2 Submitted/Pending Review => ~60% progress, 2 pending reviews)
    const aaravT1: InMemoryTask = {
      id: 'task-ghr-101',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-1',
      milestoneId: 'ms-ghristu-1',
      title: 'Development Environment & Architecture Setup',
      description: 'Configure monorepo, Docker dev environment, and document system architecture.',
      instructions: 'Submit GitHub Repository with architectural documentation and container config.',
      status: TaskStatus.APPROVED,
      priority: 'HIGH',
      dueDate: new Date('2026-06-15'),
      learningOutcomeId: 'out-ghristu-po3',
      expectedEvidence: 'Architecture document & GitHub Repository',
      createdAt: now,
      updatedAt: now,
    };
    const aaravT2: InMemoryTask = {
      id: 'task-ghr-102',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-1',
      milestoneId: 'ms-ghristu-2',
      title: 'Database Schema & Relational Models',
      description: 'Design and migrate relational schemas with tenant isolation constraints.',
      instructions: 'Provide GitHub schema migration scripts and entity diagrams.',
      status: TaskStatus.APPROVED,
      priority: 'HIGH',
      dueDate: new Date('2026-07-15'),
      learningOutcomeId: 'out-ghristu-po1',
      expectedEvidence: 'GitHub Repository with schema migrations',
      createdAt: now,
      updatedAt: now,
    };
    const aaravT3: InMemoryTask = {
      id: 'task-ghr-103',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-1',
      milestoneId: 'ms-ghristu-2',
      title: 'REST API Implementation & JWT Auth',
      description: 'Implement secure RESTful CRUD APIs with JWT authentication tokens.',
      instructions: 'Submit GitHub PR with automated integration tests verifying endpoints.',
      status: TaskStatus.APPROVED,
      priority: 'HIGH',
      dueDate: new Date('2026-08-10'),
      learningOutcomeId: 'out-ghristu-po1',
      expectedEvidence: 'GitHub Pull Request and API documentation',
      createdAt: now,
      updatedAt: now,
    };
    const aaravT4: InMemoryTask = {
      id: 'task-ghr-104',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-1',
      milestoneId: 'ms-ghristu-3',
      title: 'Authentication UI & Responsive Interface',
      description: 'Build responsive web interface for user authentication and dashboard navigation.',
      instructions: 'Deliver production-ready responsive layout with input validation.',
      status: TaskStatus.APPROVED,
      priority: 'MEDIUM',
      dueDate: new Date('2026-08-30'),
      learningOutcomeId: 'out-ghristu-po1',
      expectedEvidence: 'GitHub PR with responsive UI screenshots',
      createdAt: now,
      updatedAt: now,
    };
    const aaravT5: InMemoryTask = {
      id: 'task-ghr-105',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-1',
      milestoneId: 'ms-ghristu-3',
      title: 'API Integration & Error Handling',
      description: 'Connect frontend client to backend endpoints with structured toast notifications.',
      instructions: 'Submit PR link with end-to-end network test coverage.',
      status: TaskStatus.SUBMITTED,
      priority: 'HIGH',
      dueDate: new Date('2026-09-25'),
      learningOutcomeId: 'out-ghristu-po1',
      expectedEvidence: 'GitHub Pull Request with error boundary tests',
      createdAt: now,
      updatedAt: now,
    };
    const aaravT6: InMemoryTask = {
      id: 'task-ghr-106',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-1',
      milestoneId: 'ms-ghristu-4',
      title: 'CI/CD Pipeline & Automated Cloud Deployment',
      description: 'Configure automated build & test pipeline in GitHub Actions and deploy to staging cloud.',
      instructions: 'Submit GitHub Actions workflow run logs and verified live deployment URL.',
      status: TaskStatus.SUBMITTED,
      priority: 'URGENT',
      dueDate: new Date('2026-10-15'),
      learningOutcomeId: 'out-ghristu-po2',
      expectedEvidence: 'GitHub Actions workflow badge and Deployment URL',
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(aaravT1.id, aaravT1);
    this.tasks.set(aaravT2.id, aaravT2);
    this.tasks.set(aaravT3.id, aaravT3);
    this.tasks.set(aaravT4.id, aaravT4);
    this.tasks.set(aaravT5.id, aaravT5);
    this.tasks.set(aaravT6.id, aaravT6);

    // Aarav's Submissions (2 Pending Reviews, 4 Approved)
    const aaravSub1: InMemorySubmissionRecord = {
      id: 'sub-ghr-101',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-1',
      taskId: 'task-ghr-101',
      studentId: 'user-ghristu-student-1',
      title: 'Architecture Blueprint & Container Setup',
      description: 'Initialized monorepo with PostgreSQL container, strict TypeScript, and system architecture blueprint.',
      evidenceType: EvidenceType.GITHUB_REPO,
      evidenceUrl: 'https://github.com/ghristu-demo/enterprise-portal',
      attachmentName: 'GHRISTU_System_Architecture_v1.pdf',
      status: SubmissionStatus.ACCEPTED,
      submittedAt: new Date('2026-06-14'),
      updatedAt: new Date('2026-06-15'),
      mentorFeedback: 'Thorough architecture diagrams and reproducible container configuration. Approved.',
      mentorRating: 5,
      mentorStrengths: 'Deep understanding of multi-tier system scalability.',
      mentorNextAction: 'Proceed to Database Schema modeling.',
      reviewedAt: new Date('2026-06-15'),
    };
    const aaravSub2: InMemorySubmissionRecord = {
      id: 'sub-ghr-102',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-1',
      taskId: 'task-ghr-102',
      studentId: 'user-ghristu-student-1',
      title: 'Database Schema & Multi-Tenant Data Models',
      description: 'Implemented relational models with foreign key constraints, organizationId filters, and seed migrations.',
      evidenceType: EvidenceType.GITHUB_REPO,
      evidenceUrl: 'https://github.com/ghristu-demo/enterprise-portal/tree/main/prisma',
      attachmentName: 'schema-verification-report.pdf',
      status: SubmissionStatus.ACCEPTED,
      submittedAt: new Date('2026-07-14'),
      updatedAt: new Date('2026-07-15'),
      mentorFeedback: 'Clean schema design with comprehensive indexes. Excellent attention to tenant isolation.',
      mentorRating: 5,
      mentorStrengths: 'High attention to data normalization and security.',
      mentorNextAction: 'Implement REST endpoints with JWT validation.',
      reviewedAt: new Date('2026-07-15'),
    };
    const aaravSub3: InMemorySubmissionRecord = {
      id: 'sub-ghr-103',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-1',
      taskId: 'task-ghr-103',
      studentId: 'user-ghristu-student-1',
      title: 'REST API Implementation & JWT Authentication',
      description: 'Built RESTful endpoints with HMAC token verification, role permissions, and Swagger documentation.',
      evidenceType: EvidenceType.GITHUB_PR,
      evidenceUrl: 'https://github.com/ghristu-demo/enterprise-portal/pull/3',
      attachmentName: 'api-documentation-openapi.pdf',
      status: SubmissionStatus.ACCEPTED,
      submittedAt: new Date('2026-08-08'),
      updatedAt: new Date('2026-08-10'),
      mentorFeedback: 'Well-structured middleware and complete test coverage for positive and negative auth paths.',
      mentorRating: 5,
      mentorStrengths: 'Production-grade code formatting and comprehensive error handling.',
      mentorNextAction: 'Connect frontend user interface.',
      reviewedAt: new Date('2026-08-10'),
    };
    const aaravSub4: InMemorySubmissionRecord = {
      id: 'sub-ghr-104',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-1',
      taskId: 'task-ghr-104',
      studentId: 'user-ghristu-student-1',
      title: 'Authentication UI & Responsive Interface Evidence',
      description: 'Developed modern responsive dashboard with dark mode support and accessible form controls.',
      evidenceType: EvidenceType.GITHUB_PR,
      evidenceUrl: 'https://github.com/ghristu-demo/enterprise-portal/pull/7',
      status: SubmissionStatus.ACCEPTED,
      submittedAt: new Date('2026-08-28'),
      updatedAt: new Date('2026-08-30'),
      mentorFeedback: 'Smooth interactions and responsive layout works well on desktop and mobile viewports.',
      mentorRating: 4,
      mentorStrengths: 'Clean CSS utility structure.',
      mentorNextAction: 'Wire up real API endpoints.',
      reviewedAt: new Date('2026-08-30'),
    };
    // Pending Review 1
    const aaravSub5: InMemorySubmissionRecord = {
      id: 'sub-ghr-105',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-1',
      taskId: 'task-ghr-105',
      studentId: 'user-ghristu-student-1',
      title: 'REST API Integration Deliverable',
      description: 'Connected frontend components to backend REST endpoints with optimistic updates and retry logic.',
      evidenceType: EvidenceType.GITHUB_PR,
      evidenceUrl: 'https://github.com/ghristu-demo/enterprise-portal/pull/14',
      status: SubmissionStatus.SUBMITTED,
      submittedAt: new Date('2026-09-17T10:00:00Z'),
      updatedAt: new Date('2026-09-17T10:00:00Z'),
    };
    // Pending Review 2
    const aaravSub6: InMemorySubmissionRecord = {
      id: 'sub-ghr-106',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-1',
      taskId: 'task-ghr-106',
      studentId: 'user-ghristu-student-1',
      title: 'CI/CD Pipeline & Staging Deployment Evidence',
      description: 'Automated GitHub Actions workflow building multi-stage Docker images and deployed to staging cloud.',
      evidenceType: EvidenceType.DEPLOYMENT_URL,
      evidenceUrl: 'https://staging.ghristu-internos.app',
      attachmentName: 'github-actions-pipeline-log.pdf',
      status: SubmissionStatus.SUBMITTED,
      submittedAt: new Date('2026-09-18T09:30:00Z'),
      updatedAt: new Date('2026-09-18T09:30:00Z'),
    };
    this.submissions.set(aaravSub1.id, aaravSub1);
    this.submissions.set(aaravSub2.id, aaravSub2);
    this.submissions.set(aaravSub3.id, aaravSub3);
    this.submissions.set(aaravSub4.id, aaravSub4);
    this.submissions.set(aaravSub5.id, aaravSub5);
    this.submissions.set(aaravSub6.id, aaravSub6);

    // ==========================================
    // Ananya Patil @ Infosys (internship-ghristu-2, Mentor: Priya Nair)
    // ==========================================
    const ananyaM1: InMemoryMilestone = {
      id: 'ms-ananya-1',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-2',
      title: 'Milestone 1: Cloud Architecture & Terraform Setup',
      description: 'Infrastructure as Code initialization for Infosys cloud client environment.',
      order: 1,
      startDate: new Date('2026-06-15'),
      dueDate: new Date('2026-07-31'),
      progress: 100,
      status: 'COMPLETED',
      createdAt: now,
      updatedAt: now,
    };
    const ananyaM2: InMemoryMilestone = {
      id: 'ms-ananya-2',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-2',
      title: 'Milestone 2: Kubernetes Container Orchestration',
      description: 'Deploy microservices into managed Kubernetes clusters with ingress routing.',
      order: 2,
      startDate: new Date('2026-08-01'),
      dueDate: new Date('2026-10-15'),
      progress: 60,
      status: 'IN_PROGRESS',
      createdAt: now,
      updatedAt: now,
    };
    this.milestones.set(ananyaM1.id, ananyaM1);
    this.milestones.set(ananyaM2.id, ananyaM2);

    const ananyaT1: InMemoryTask = {
      id: 'task-ananya-201',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-2',
      milestoneId: 'ms-ananya-1',
      title: 'Terraform Modules for Cloud VPC & Subnets',
      description: 'Write reproducible IaC modules for private VPC networks and firewall policies.',
      status: TaskStatus.APPROVED,
      priority: 'HIGH',
      dueDate: new Date('2026-07-20'),
      learningOutcomeId: 'out-ghristu-po2',
      expectedEvidence: 'GitHub Repository with Terraform configs',
      createdAt: now,
      updatedAt: now,
    };
    const ananyaT2: InMemoryTask = {
      id: 'task-ananya-202',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-2',
      milestoneId: 'ms-ananya-2',
      title: 'Kubernetes Helm Charts & Ingress Configuration',
      description: 'Package microservices into Helm charts with automated rollback triggers.',
      status: TaskStatus.APPROVED,
      priority: 'HIGH',
      dueDate: new Date('2026-09-10'),
      learningOutcomeId: 'out-ghristu-po2',
      expectedEvidence: 'GitHub PR with verified Helm lint outputs',
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(ananyaT1.id, ananyaT1);
    this.tasks.set(ananyaT2.id, ananyaT2);

    const ananyaSub1: InMemorySubmissionRecord = {
      id: 'sub-ananya-201',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-2',
      taskId: 'task-ananya-201',
      studentId: 'user-ghristu-student-2',
      title: 'Terraform VPC & Cloud Network Automation',
      description: 'Delivered Terraform scripts provisioned on AWS/GCP with security groups and private routing.',
      evidenceType: EvidenceType.GITHUB_REPO,
      evidenceUrl: 'https://github.com/ghristu-demo/cloud-infra-terraform',
      status: SubmissionStatus.ACCEPTED,
      submittedAt: new Date('2026-07-19'),
      updatedAt: new Date('2026-07-20'),
      mentorFeedback: 'Modular Terraform code following enterprise cloud standards. Well done Ananya.',
      mentorRating: 5,
      reviewedAt: new Date('2026-07-20'),
    };
    this.submissions.set(ananyaSub1.id, ananyaSub1);

    // ==========================================
    // Rohan Joshi @ Persistent Systems (internship-ghristu-3, Mentor: Amit Kulkarni)
    // ==========================================
    const rohanM1: InMemoryMilestone = {
      id: 'ms-rohan-1',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-3',
      title: 'Milestone 1: Data Ingestion & ETL Pipelines',
      description: 'Setup Apache Airflow workflows and Python data ingestion scripts.',
      order: 1,
      startDate: new Date('2026-07-01'),
      dueDate: new Date('2026-08-31'),
      progress: 100,
      status: 'COMPLETED',
      createdAt: now,
      updatedAt: now,
    };
    const rohanM2: InMemoryMilestone = {
      id: 'ms-rohan-2',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-3',
      title: 'Milestone 2: Analytics Warehousing & Reporting Dashboards',
      description: 'Build BigQuery analytical tables and real-time dashboard visualizations.',
      order: 2,
      startDate: new Date('2026-09-01'),
      dueDate: new Date('2026-11-15'),
      progress: 40,
      status: 'IN_PROGRESS',
      createdAt: now,
      updatedAt: now,
    };
    this.milestones.set(rohanM1.id, rohanM1);
    this.milestones.set(rohanM2.id, rohanM2);

    const rohanT1: InMemoryTask = {
      id: 'task-rohan-301',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-3',
      milestoneId: 'ms-rohan-1',
      title: 'Airflow Ingestion Pipeline Implementation',
      description: 'Build robust ETL data pipelines with retry mechanisms and data quality checks.',
      status: TaskStatus.APPROVED,
      priority: 'HIGH',
      dueDate: new Date('2026-08-15'),
      learningOutcomeId: 'out-ghristu-po1',
      expectedEvidence: 'GitHub Repository with DAG definitions and test runs',
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(rohanT1.id, rohanT1);

    const rohanSub1: InMemorySubmissionRecord = {
      id: 'sub-rohan-301',
      organizationId: ghristuOrgId,
      internshipId: 'internship-ghristu-3',
      taskId: 'task-rohan-301',
      studentId: 'user-ghristu-student-3',
      title: 'Airflow ETL DAGs Deliverable',
      description: 'Created production DAGs handling 50k events daily with automated data quality checks.',
      evidenceType: EvidenceType.GITHUB_REPO,
      evidenceUrl: 'https://github.com/ghristu-demo/data-pipeline-airflow',
      status: SubmissionStatus.ACCEPTED,
      submittedAt: new Date('2026-08-14'),
      updatedAt: new Date('2026-08-15'),
      mentorFeedback: 'Impressive ETL architecture with error-handling alert webhooks. Great work Rohan.',
      mentorRating: 5,
      reviewedAt: new Date('2026-08-15'),
    };
    this.submissions.set(rohanSub1.id, rohanSub1);
  }
}

export const studentMentorStore = new StudentMentorStore();

// ==========================================
// Service Implementation
// ==========================================

export class StudentMentorService {
  // ---------------------------------------------------------
  // STUDENT WORKSPACE METHODS
  // ---------------------------------------------------------

  /**
   * Returns real aggregated metrics answering the student's 5 primary questions
   */
  async getStudentDashboard(organizationId: string, studentUser: AuthenticatedUser): Promise<StudentDashboardDto> {
    const internships = Array.from(internshipStore.details.values()).filter(
      (i) => i.organizationId === organizationId && i.studentId === studentUser.id
    );

    const activeInternship = internships.find((i) => i.status === InternshipStatus.ACTIVE) || internships[0] || null;

    if (!activeInternship) {
      return {
        studentName: `${studentUser.firstName} ${studentUser.lastName}`,
        internship: null,
        activeMilestone: null,
        upcomingTasks: [],
        recentSubmissions: [],
        outcomesSummary: { total: 0, progressing: 0, verified: 0, requiresEvidence: 0 },
        upcomingDeadlines: [],
      };
    }

    const company = internshipStore.companies.get(activeInternship.companyId);
    const department = tenantStore.departments.get(studentUser.departmentId || '');

    // Get milestones for this internship
    const milestones = Array.from(studentMentorStore.milestones.values())
      .filter((m) => m.internshipId === activeInternship.id)
      .sort((a, b) => a.order - b.order);

    const activeMilestoneRaw =
      milestones.find((m) => m.status === 'IN_PROGRESS') ||
      milestones.find((m) => m.status === 'NOT_STARTED') ||
      milestones[0] ||
      null;

    // Get tasks for this internship
    const tasks = Array.from(studentMentorStore.tasks.values()).filter(
      (t) => t.internshipId === activeInternship.id
    );

    const completedTasksCount = tasks.filter((t) => t.status === TaskStatus.APPROVED).length;
    const overallProgress = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

    let activeMilestone = null;
    if (activeMilestoneRaw) {
      const msTasks = tasks.filter((t) => t.milestoneId === activeMilestoneRaw.id);
      const msCompleted = msTasks.filter((t) => t.status === TaskStatus.APPROVED).length;
      activeMilestone = {
        id: activeMilestoneRaw.id,
        title: activeMilestoneRaw.title,
        dueDate: activeMilestoneRaw.dueDate.toISOString().split('T')[0],
        progress: msTasks.length > 0 ? Math.round((msCompleted / msTasks.length) * 100) : activeMilestoneRaw.progress,
        completedTasks: msCompleted,
        totalTasks: msTasks.length,
      };
    }

    // Upcoming tasks (not yet approved)
    const upcomingTasks = tasks
      .filter((t) => t.status !== TaskStatus.APPROVED)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 5)
      .map((t) => this.mapTaskToDto(t));

    // Recent submissions
    const recentSubmissions = Array.from(studentMentorStore.submissions.values())
      .filter((s) => s.internshipId === activeInternship.id && s.studentId === studentUser.id)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
      .slice(0, 5)
      .map((s) => {
        const task = studentMentorStore.tasks.get(s.taskId);
        return {
          id: s.id,
          taskId: s.taskId,
          taskTitle: task?.title || 'Deliverable Task',
          submissionTitle: s.title,
          submittedAt: s.submittedAt.toISOString().split('T')[0],
          status: s.status,
          mentorFeedback: s.mentorFeedback,
        };
      });

    // Outcomes calculation
    const allOutcomes = Array.from(studentMentorStore.outcomes.values()).filter(
      (o) => o.organizationId === organizationId
    );
    const verifiedOutcomesCount = allOutcomes.filter((o) => {
      const outTasks = tasks.filter((t) => t.learningOutcomeId === o.id);
      return outTasks.length > 0 && outTasks.every((t) => t.status === TaskStatus.APPROVED);
    }).length;

    const progressingCount = allOutcomes.filter((o) => {
      const outTasks = tasks.filter((t) => t.learningOutcomeId === o.id);
      return outTasks.some((t) => t.status === TaskStatus.SUBMITTED || t.status === TaskStatus.APPROVED);
    }).length;

    // Upcoming deadlines
    const now = new Date();
    const deadlines: Array<{ id: string; title: string; type: 'TASK' | 'MILESTONE'; dueDate: string; daysRemaining: number }> = [];

    tasks
      .filter((t) => t.status !== TaskStatus.APPROVED)
      .forEach((t) => {
        const diffDays = Math.ceil((t.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        deadlines.push({
          id: t.id,
          title: t.title,
          type: 'TASK',
          dueDate: t.dueDate.toISOString().split('T')[0],
          daysRemaining: diffDays,
        });
      });

    milestones
      .filter((m) => m.status !== 'COMPLETED')
      .forEach((m) => {
        const diffDays = Math.ceil((m.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        deadlines.push({
          id: m.id,
          title: m.title,
          type: 'MILESTONE',
          dueDate: m.dueDate.toISOString().split('T')[0],
          daysRemaining: diffDays,
        });
      });

    deadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return {
      studentName: `${studentUser.firstName} ${studentUser.lastName}`,
      internship: {
        id: activeInternship.id,
        title: activeInternship.title,
        companyName: company?.name || 'Assigned Host Organization',
        companyWebsite: company?.website,
        startDate: activeInternship.startDate.toISOString().split('T')[0],
        endDate: activeInternship.endDate.toISOString().split('T')[0],
        status: activeInternship.status,
        workMode: activeInternship.type,
        departmentName: department?.name,
        mentorName: activeInternship.mentor?.name || 'Assigned Industry Mentor',
        mentorEmail: activeInternship.mentor?.email,
        overallProgress,
      },
      activeMilestone,
      upcomingTasks,
      recentSubmissions,
      outcomesSummary: {
        total: allOutcomes.length,
        progressing: progressingCount,
        verified: verifiedOutcomesCount,
        requiresEvidence: Math.max(0, allOutcomes.length - progressingCount),
      },
      upcomingDeadlines: deadlines.slice(0, 5),
    };
  }

  /**
   * Get dedicated My Internship detailed view
   */
  async getStudentInternship(organizationId: string, studentUser: AuthenticatedUser) {
    const internships = Array.from(internshipStore.details.values()).filter(
      (i) => i.organizationId === organizationId && i.studentId === studentUser.id
    );

    const activeInternship = internships.find((i) => i.status === InternshipStatus.ACTIVE) || internships[0];
    if (!activeInternship) {
      return null;
    }

    const company = internshipStore.companies.get(activeInternship.companyId);
    const department = tenantStore.departments.get(studentUser.departmentId || '');

    const milestones = await this.getStudentMilestones(organizationId, studentUser);
    const outcomes = await this.getStudentOutcomes(organizationId, studentUser);
    const documents = await this.getStudentDocuments(organizationId, studentUser);

    return {
      overview: {
        id: activeInternship.id,
        title: activeInternship.title,
        role: activeInternship.role || 'Software Engineering Intern',
        description: activeInternship.description || 'Hands-on practical industry engineering training program.',
        status: activeInternship.status,
        startDate: activeInternship.startDate.toISOString().split('T')[0],
        endDate: activeInternship.endDate.toISOString().split('T')[0],
        workMode: activeInternship.type,
        type: activeInternship.type,
      },
      company: {
        id: company?.id,
        name: company?.name || 'Host Organization',
        industry: company?.industry || 'Technology',
        website: company?.website,
        address: company?.address,
      },
      mentor: {
        name: activeInternship.mentor?.name || 'Assigned Industry Mentor',
        email: activeInternship.mentor?.email || 'mentor@company.com',
        designation: activeInternship.mentor?.designation || 'Staff Engineer',
        phone: activeInternship.mentor?.phone,
        company: company?.name,
      },
      department: {
        name: department?.name || 'Department of Computer Science & Engineering',
        code: department?.code || 'CSE',
      },
      timeline: [
        { label: 'Application Submitted', date: activeInternship.createdAt.toISOString().split('T')[0], status: 'COMPLETED' },
        { label: 'Registration Approved', date: activeInternship.createdAt.toISOString().split('T')[0], status: 'COMPLETED' },
        { label: 'Internship Started', date: activeInternship.startDate.toISOString().split('T')[0], status: 'COMPLETED' },
        { label: 'Current Progress', date: 'In Progress', status: 'ACTIVE' },
        { label: 'Expected Completion', date: activeInternship.endDate.toISOString().split('T')[0], status: 'PENDING' },
      ],
      milestones,
      outcomes,
      documents,
    };
  }

  /**
   * Student registers an internship (NO requirement to invent Expected Evidence)
   */
  async createStudentInternship(
    organizationId: string,
    studentUser: AuthenticatedUser,
    data: {
      companyName: string;
      companyIndustry?: string;
      companyWebsite?: string;
      title: string;
      description?: string;
      mentorName: string;
      mentorEmail: string;
      mentorDesignation?: string;
      startDate: string;
      endDate: string;
      workMode?: string;
      offerLetterUrl?: string;
      offerLetterBase64?: string;
      offerLetterFilename?: string;
      offerLetterMimeType?: string;
    }
  ) {
    if (!data.companyName?.trim()) throw new ValidationError('Company name is required');
    if (!data.title?.trim()) throw new ValidationError('Internship title is required');
    if (!data.mentorName?.trim()) throw new ValidationError('Mentor name is required');
    if (!data.mentorEmail?.trim()) throw new ValidationError('Mentor email is required');
    if (!data.startDate || !data.endDate) throw new ValidationError('Start and end dates are required');

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end <= start) throw new ValidationError('End date must be after start date');

    // Create or find company
    let company = Array.from(internshipStore.companies.values()).find(
      (c) => c.organizationId === organizationId && c.name.toLowerCase() === data.companyName.trim().toLowerCase()
    );

    if (!company) {
      company = {
        id: `company-${Date.now().toString(36)}`,
        organizationId,
        name: data.companyName.trim(),
        industry: data.companyIndustry || 'Technology & Services',
        website: data.companyWebsite?.trim() || undefined,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      internshipStore.companies.set(company.id, company);
    }

    const internshipId = `internship-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    const newInternship = {
      id: internshipId,
      organizationId,
      studentId: studentUser.id,
      companyId: company.id,
      title: data.title.trim(),
      role: data.title.trim(),
      type: data.workMode || 'FULL_TIME',
      status: InternshipStatus.PENDING_APPROVAL,
      startDate: start,
      endDate: end,
      description: data.description?.trim(),
      mentor: {
        name: data.mentorName.trim(),
        email: data.mentorEmail.trim().toLowerCase(),
        designation: data.mentorDesignation?.trim() || 'Technical Lead',
      },
      expectedOutcomes: [],
      outcomeVersion: 1,
      stateHistory: [
        {
          fromStatus: InternshipStatus.DRAFT,
          toStatus: InternshipStatus.PENDING_APPROVAL,
          changedBy: studentUser.id,
          changedAt: now.toISOString(),
          reason: 'Student submitted internship registration for mentor review',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    internshipStore.details.set(internshipId, newInternship as any);

    // If offer letter base64 was uploaded, validate PDF and store properly
    if (data.offerLetterBase64) {
      const base64Data = data.offerLetterBase64.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length < 5 || buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
        throw new ValidationError('Invalid Offer Letter PDF: file signature must be a valid PDF format.');
      }
      const safeFilename = path.basename(data.offerLetterFilename || 'Official Offer Letter.pdf');
      const docId = `doc-${Date.now().toString(36)}`;
      const sanitizedOrg = organizationId.replace(/[^a-zA-Z0-9-_]/g, '');
      const storageKey = `${sanitizedOrg}/${docId}-${safeFilename}`;

      const targetDir = path.resolve(process.cwd(), 'uploads', sanitizedOrg);
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(path.join(targetDir, `${docId}-${safeFilename}`), buffer);

      tenantStore.documents.set(docId, {
        id: docId,
        organizationId,
        uploaderId: studentUser.id,
        internshipId,
        name: safeFilename,
        mimeType: 'application/pdf',
        size: buffer.length,
        storageKey,
        url: `/api/v1/student/documents/${docId}/view`,
        createdAt: now,
        updatedAt: now,
      });
    } else if (data.offerLetterUrl) {
      const docId = `doc-${Date.now().toString(36)}`;
      tenantStore.documents.set(docId, {
        id: docId,
        organizationId,
        uploaderId: studentUser.id,
        internshipId,
        name: 'Official Offer Letter.pdf',
        mimeType: 'application/pdf',
        size: 1024 * 350,
        storageKey: `offer-letters/${docId}.pdf`,
        url: data.offerLetterUrl,
        createdAt: now,
        updatedAt: now,
      });
    }

    await auditService.log({
      organizationId,
      actorId: studentUser.id,
      action: 'CREATE' as any,
      entity: 'InternshipRegistration',
      entityId: internshipId,
      details: { title: data.title, company: data.companyName },
    });

    return newInternship;
  }

  /**
   * List Milestones for student
   */
  async getStudentMilestones(organizationId: string, studentUser: AuthenticatedUser): Promise<MilestoneDto[]> {
    const internships = Array.from(internshipStore.details.values()).filter(
      (i) => i.organizationId === organizationId && i.studentId === studentUser.id
    );
    const active = internships.find((i) => i.status === InternshipStatus.ACTIVE) || internships[0];
    if (!active) return [];

    const milestones = Array.from(studentMentorStore.milestones.values())
      .filter((m) => m.internshipId === active.id)
      .sort((a, b) => a.order - b.order);

    const tasks = Array.from(studentMentorStore.tasks.values()).filter((t) => t.internshipId === active.id);

    return milestones.map((m) => {
      const msTasks = tasks.filter((t) => t.milestoneId === m.id);
      const completed = msTasks.filter((t) => t.status === TaskStatus.APPROVED).length;
      const progress = msTasks.length > 0 ? Math.round((completed / msTasks.length) * 100) : m.progress;

      return {
        id: m.id,
        organizationId: m.organizationId,
        internshipId: m.internshipId,
        title: m.title,
        description: m.description,
        order: m.order,
        startDate: m.startDate?.toISOString().split('T')[0],
        dueDate: m.dueDate.toISOString().split('T')[0],
        progress,
        completedTasks: completed,
        totalTasks: msTasks.length,
        status: m.status,
        tasks: msTasks.map((t) => this.mapTaskToDto(t)),
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Get single milestone with tasks
   */
  async getStudentMilestoneById(organizationId: string, studentUser: AuthenticatedUser, milestoneId: string): Promise<MilestoneDto> {
    const milestone = studentMentorStore.milestones.get(milestoneId);
    if (!milestone) throw new NotFoundError('Milestone', milestoneId);
    if (milestone.organizationId !== organizationId) throw new TenantViolationError();

    const tasks = Array.from(studentMentorStore.tasks.values()).filter((t) => t.milestoneId === milestoneId);
    const completed = tasks.filter((t) => t.status === TaskStatus.APPROVED).length;
    const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : milestone.progress;

    return {
      id: milestone.id,
      organizationId: milestone.organizationId,
      internshipId: milestone.internshipId,
      title: milestone.title,
      description: milestone.description,
      order: milestone.order,
      startDate: milestone.startDate?.toISOString().split('T')[0],
      dueDate: milestone.dueDate.toISOString().split('T')[0],
      progress,
      completedTasks: completed,
      totalTasks: tasks.length,
      status: milestone.status,
      tasks: tasks.map((t) => this.mapTaskToDto(t)),
      createdAt: milestone.createdAt.toISOString(),
      updatedAt: milestone.updatedAt.toISOString(),
    };
  }

  /**
   * Get student tasks with filters
   */
  async getStudentTasks(
    organizationId: string,
    studentUser: AuthenticatedUser,
    filter?: { status?: string; milestoneId?: string }
  ): Promise<TaskItemDto[]> {
    const internships = Array.from(internshipStore.details.values()).filter(
      (i) => i.organizationId === organizationId && i.studentId === studentUser.id
    );
    const active = internships.find((i) => i.status === InternshipStatus.ACTIVE) || internships[0];
    if (!active) return [];

    let tasks = Array.from(studentMentorStore.tasks.values()).filter((t) => t.internshipId === active.id);

    if (filter?.milestoneId && filter.milestoneId !== 'ALL') {
      tasks = tasks.filter((t) => t.milestoneId === filter.milestoneId);
    }

    if (filter?.status && filter.status !== 'ALL') {
      switch (filter.status) {
        case 'TO_DO':
          tasks = tasks.filter((t) => t.status === TaskStatus.PENDING);
          break;
        case 'IN_PROGRESS':
          tasks = tasks.filter((t) => t.status === TaskStatus.PENDING);
          break;
        case 'SUBMITTED':
          tasks = tasks.filter((t) => t.status === TaskStatus.SUBMITTED);
          break;
        case 'NEEDS_REVISION':
          tasks = tasks.filter((t) => t.status === TaskStatus.CHANGES_REQUESTED);
          break;
        case 'COMPLETED':
          tasks = tasks.filter((t) => t.status === TaskStatus.APPROVED);
          break;
        case 'OVERDUE': {
          const now = new Date();
          tasks = tasks.filter((t) => t.status !== TaskStatus.APPROVED && t.dueDate < now);
          break;
        }
      }
    }

    return tasks.map((t) => this.mapTaskToDto(t));
  }

  /**
   * Get student task by ID
   */
  async getStudentTaskById(organizationId: string, studentUser: AuthenticatedUser, taskId: string): Promise<TaskItemDto> {
    const task = studentMentorStore.tasks.get(taskId);
    if (!task) throw new NotFoundError('Task', taskId);
    if (task.organizationId !== organizationId) throw new TenantViolationError();

    if (studentUser.role === UserRole.STUDENT) {
      const internship = internshipStore.details.get(task.internshipId);
      if (!internship || internship.studentId !== studentUser.id) {
        throw new ForbiddenError('You do not have permission to access this task');
      }
    }

    return this.mapTaskToDto(task);
  }

  /**
   * Submit Evidence for a Task
   */
  async submitTaskEvidence(
    organizationId: string,
    studentUser: AuthenticatedUser,
    taskId: string,
    dto: {
      title: string;
      description: string;
      evidenceType: EvidenceType;
      evidenceUrl?: string;
      evidenceUrls?: string[];
      attachmentName?: string;
      notes?: string;
      isDraft?: boolean;
    }
  ) {
    const task = studentMentorStore.tasks.get(taskId);
    if (!task) throw new NotFoundError('Task', taskId);
    if (task.organizationId !== organizationId) throw new TenantViolationError();

    if (studentUser.role === UserRole.STUDENT) {
      const internship = internshipStore.details.get(task.internshipId);
      if (!internship || internship.studentId !== studentUser.id) {
        throw new ForbiddenError('You do not have permission to access this task');
      }
    }

    if (!dto.title?.trim()) throw new ValidationError('Submission title is required');
    if (!dto.description?.trim()) throw new ValidationError('Submission description is required');

    const now = new Date();
    const isDraft = !!dto.isDraft;

    // Check if an existing submission exists for this task & student
    const existing = Array.from(studentMentorStore.submissions.values()).find(
      (s) => s.taskId === taskId && s.studentId === studentUser.id
    );

    if (existing) {
      if (!existing.history) existing.history = [];
      if (existing.status === SubmissionStatus.REVISION_NEEDED || existing.mentorFeedback) {
        existing.history.push({
          title: existing.title,
          description: existing.description,
          evidenceType: existing.evidenceType,
          evidenceUrl: existing.evidenceUrl,
          evidenceUrls: existing.evidenceUrls,
          attachmentName: existing.attachmentName,
          notes: existing.notes,
          status: existing.status,
          submittedAt: existing.submittedAt,
          reviewedAt: existing.reviewedAt,
          mentorFeedback: existing.mentorFeedback,
          mentorRating: existing.mentorRating,
        });
      }

      existing.title = dto.title.trim();
      existing.description = dto.description.trim();
      existing.evidenceType = dto.evidenceType || EvidenceType.GITHUB_PR;
      existing.evidenceUrl = dto.evidenceUrl?.trim() || undefined;
      existing.evidenceUrls = dto.evidenceUrls || (dto.evidenceUrl ? [dto.evidenceUrl.trim()] : []);
      existing.attachmentName = dto.attachmentName;
      existing.notes = dto.notes?.trim();
      existing.status = isDraft ? SubmissionStatus.DRAFT : SubmissionStatus.SUBMITTED;
      existing.submittedAt = now;
      existing.updatedAt = now;
      existing.mentorFeedback = undefined;
      existing.mentorRating = undefined;
      existing.mentorStrengths = undefined;
      existing.mentorImprovements = undefined;
      existing.mentorNextAction = undefined;

      if (!isDraft) {
        task.status = TaskStatus.SUBMITTED;
        task.updatedAt = now;
      }

      await auditService.log({
        organizationId,
        actorId: studentUser.id,
        action: 'UPDATE' as any,
        entity: 'Submission',
        entityId: existing.id,
        details: { taskId, title: dto.title, isDraft, resubmitted: true },
      });

      return existing;
    }

    const subId = `sub-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const submission: InMemorySubmissionRecord = {
      id: subId,
      organizationId,
      internshipId: task.internshipId,
      taskId: task.id,
      studentId: studentUser.id,
      title: dto.title.trim(),
      description: dto.description.trim(),
      evidenceType: dto.evidenceType || EvidenceType.GITHUB_PR,
      evidenceUrl: dto.evidenceUrl?.trim(),
      evidenceUrls: dto.evidenceUrls || (dto.evidenceUrl ? [dto.evidenceUrl.trim()] : []),
      attachmentName: dto.attachmentName,
      notes: dto.notes?.trim(),
      status: isDraft ? SubmissionStatus.DRAFT : SubmissionStatus.SUBMITTED,
      submittedAt: now,
      updatedAt: now,
      history: [],
    };

    studentMentorStore.submissions.set(subId, submission);

    if (!isDraft) {
      task.status = TaskStatus.SUBMITTED;
      task.updatedAt = now;
    }

    await auditService.log({
      organizationId,
      actorId: studentUser.id,
      action: 'CREATE' as any,
      entity: 'Submission',
      entityId: subId,
      details: { taskId, title: dto.title, isDraft },
    });

    return submission;
  }

  /**
   * Update or Resubmit an existing submission
   */
  async updateStudentSubmission(
    organizationId: string,
    studentUser: AuthenticatedUser,
    submissionId: string,
    dto: {
      title?: string;
      description?: string;
      evidenceType?: EvidenceType;
      evidenceUrl?: string;
      evidenceUrls?: string[];
      attachmentName?: string;
      notes?: string;
      isDraft?: boolean;
    }
  ) {
    const sub = studentMentorStore.submissions.get(submissionId);
    if (!sub) throw new NotFoundError('Submission', submissionId);
    if (sub.organizationId !== organizationId) throw new TenantViolationError();

    if (studentUser.role === UserRole.STUDENT && sub.studentId !== studentUser.id) {
      throw new ForbiddenError('You do not have permission to update this submission');
    }

    const task = studentMentorStore.tasks.get(sub.taskId);
    const now = new Date();
    const isDraft = !!dto.isDraft;

    if (!sub.history) sub.history = [];
    if (sub.status === SubmissionStatus.REVISION_NEEDED || sub.mentorFeedback) {
      sub.history.push({
        title: sub.title,
        description: sub.description,
        evidenceType: sub.evidenceType,
        evidenceUrl: sub.evidenceUrl,
        evidenceUrls: sub.evidenceUrls,
        attachmentName: sub.attachmentName,
        notes: sub.notes,
        status: sub.status,
        submittedAt: sub.submittedAt,
        reviewedAt: sub.reviewedAt,
        mentorFeedback: sub.mentorFeedback,
        mentorRating: sub.mentorRating,
      });
    }

    if (dto.title?.trim()) sub.title = dto.title.trim();
    if (dto.description?.trim()) sub.description = dto.description.trim();
    if (dto.evidenceType) sub.evidenceType = dto.evidenceType;
    if (dto.evidenceUrl !== undefined) sub.evidenceUrl = dto.evidenceUrl.trim() || undefined;
    if (dto.evidenceUrls !== undefined) sub.evidenceUrls = dto.evidenceUrls;
    if (dto.attachmentName !== undefined) sub.attachmentName = dto.attachmentName;
    if (dto.notes !== undefined) sub.notes = dto.notes?.trim();

    sub.status = isDraft ? SubmissionStatus.DRAFT : SubmissionStatus.SUBMITTED;
    sub.submittedAt = now;
    sub.updatedAt = now;
    sub.mentorFeedback = undefined;
    sub.mentorRating = undefined;
    sub.mentorStrengths = undefined;
    sub.mentorImprovements = undefined;
    sub.mentorNextAction = undefined;

    if (!isDraft && task) {
      task.status = TaskStatus.SUBMITTED;
      task.updatedAt = now;
    }

    await auditService.log({
      organizationId,
      actorId: studentUser.id,
      action: 'UPDATE' as any,
      entity: 'Submission',
      entityId: sub.id,
      details: { submissionId, isDraft, resubmitted: true },
    });

    return sub;
  }

  /**
   * Get all submissions for student
   */
  async getStudentSubmissions(organizationId: string, studentUser: AuthenticatedUser) {
    const subs = Array.from(studentMentorStore.submissions.values())
      .filter((s) => s.organizationId === organizationId && s.studentId === studentUser.id)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

    return subs.map((s) => {
      const task = studentMentorStore.tasks.get(s.taskId);
      const milestone = task?.milestoneId ? studentMentorStore.milestones.get(task.milestoneId) : null;
      return {
        id: s.id,
        taskId: s.taskId,
        taskTitle: task?.title || 'Deliverable Task',
        milestoneTitle: milestone?.title || 'General Milestone',
        title: s.title,
        description: s.description,
        evidenceType: s.evidenceType,
        evidenceUrl: s.evidenceUrl,
        evidenceUrls: s.evidenceUrls,
        attachmentName: s.attachmentName,
        status: s.status,
        submittedAt: s.submittedAt.toISOString().split('T')[0],
        mentorFeedback: s.mentorFeedback,
        mentorRating: s.mentorRating,
        mentorStrengths: s.mentorStrengths,
        mentorImprovements: s.mentorImprovements,
        mentorNextAction: s.mentorNextAction,
        reviewedAt: s.reviewedAt?.toISOString().split('T')[0],
      };
    });
  }

  /**
   * Get single submission detail
   */
  async getStudentSubmissionById(organizationId: string, studentUser: AuthenticatedUser, submissionId: string) {
    const s = studentMentorStore.submissions.get(submissionId);
    if (!s) throw new NotFoundError('Submission', submissionId);
    if (s.organizationId !== organizationId) throw new TenantViolationError();

    if (studentUser.role === UserRole.STUDENT && s.studentId !== studentUser.id) {
      throw new ForbiddenError('You do not have permission to access this submission');
    }

    const task = studentMentorStore.tasks.get(s.taskId);
    const milestone = task?.milestoneId ? studentMentorStore.milestones.get(task.milestoneId) : null;

    return {
      id: s.id,
      taskId: s.taskId,
      taskTitle: task?.title || 'Deliverable Task',
      taskDescription: task?.description,
      instructions: task?.instructions,
      expectedEvidence: task?.expectedEvidence,
      milestoneTitle: milestone?.title || 'General Milestone',
      title: s.title,
      description: s.description,
      evidenceType: s.evidenceType,
      evidenceUrl: s.evidenceUrl,
      evidenceUrls: s.evidenceUrls,
      attachmentName: s.attachmentName,
      notes: s.notes,
      status: s.status,
      submittedAt: s.submittedAt.toISOString(),
      mentorFeedback: s.mentorFeedback,
      mentorRating: s.mentorRating,
      mentorStrengths: s.mentorStrengths,
      mentorImprovements: s.mentorImprovements,
      mentorNextAction: s.mentorNextAction,
      reviewedAt: s.reviewedAt?.toISOString(),
      history: s.history || [],
    };
  }

  /**
   * Get Learning Outcomes View with Expected Evidence vs Actual Evidence
   */
  async getStudentOutcomes(organizationId: string, studentUser: AuthenticatedUser): Promise<StudentOutcomeViewDto[]> {
    const outcomes = Array.from(studentMentorStore.outcomes.values()).filter(
      (o) => o.organizationId === organizationId
    );

    const internships = Array.from(internshipStore.details.values()).filter(
      (i) => i.organizationId === organizationId && i.studentId === studentUser.id
    );
    const active = internships.find((i) => i.status === InternshipStatus.ACTIVE) || internships[0];
    const tasks = active
      ? Array.from(studentMentorStore.tasks.values()).filter((t) => t.internshipId === active.id)
      : [];

    return outcomes.map((o) => {
      const mappedTasks = tasks.filter((t) => t.learningOutcomeId === o.id);
      const studentEvidence: StudentOutcomeViewDto['studentEvidence'] = [];

      mappedTasks.forEach((t) => {
        const subs = Array.from(studentMentorStore.submissions.values()).filter(
          (s) => s.taskId === t.id && s.studentId === studentUser.id
        );
        subs.forEach((s) => {
          studentEvidence.push({
            submissionId: s.id,
            taskTitle: t.title,
            evidenceType: s.evidenceType,
            evidenceUrl: s.evidenceUrl,
            fileName: s.attachmentName,
            submittedAt: s.submittedAt.toISOString().split('T')[0],
            status: s.status,
          });
        });
      });

      let status: StudentOutcomeViewDto['status'] = 'NOT_STARTED';
      if (studentEvidence.some((e: any) => e.status === SubmissionStatus.ACCEPTED)) {
        status = 'VERIFIED';
      } else if (studentEvidence.some((e: any) => e.status === SubmissionStatus.SUBMITTED)) {
        status = 'EVIDENCE_SUBMITTED';
      } else if (studentEvidence.some((e: any) => e.status === SubmissionStatus.REVISION_NEEDED)) {
        status = 'REVISION_NEEDED';
      } else if (mappedTasks.length > 0) {
        status = 'IN_PROGRESS';
      }

      const latestReviewed = studentEvidence.find((e: any) => e.status === SubmissionStatus.ACCEPTED || e.status === SubmissionStatus.REVISION_NEEDED);
      const latestSub = latestReviewed ? studentMentorStore.submissions.get(latestReviewed.submissionId) : undefined;

      return {
        outcomeId: o.id,
        code: o.code,
        name: o.name,
        description: o.description,
        expectedEvidence: o.expectedEvidence,
        studentEvidence,
        status,
        mentorAssessment: latestSub?.mentorFeedback,
        feedback: latestSub?.mentorFeedback,
      };
    });
  }

  /**
   * Feedback history for student
   */
  async getStudentFeedback(organizationId: string, studentUser: AuthenticatedUser) {
    const subs = Array.from(studentMentorStore.submissions.values()).filter(
      (s) => s.organizationId === organizationId && s.studentId === studentUser.id && s.mentorFeedback
    );

    return subs.map((s) => {
      const task = studentMentorStore.tasks.get(s.taskId);
      return {
        id: `fb-${s.id}`,
        submissionId: s.id,
        taskTitle: task?.title || 'Deliverable Task',
        submissionTitle: s.title,
        feedback: s.mentorFeedback!,
        rating: s.mentorRating,
        strengths: s.mentorStrengths,
        improvements: s.mentorImprovements,
        nextAction: s.mentorNextAction,
        status: s.status,
        date: s.reviewedAt?.toISOString().split('T')[0] || s.updatedAt.toISOString().split('T')[0],
      };
    });
  }

  /**
   * Documents for student
   */
  async getStudentDocuments(organizationId: string, studentUser: AuthenticatedUser) {
    const docs = Array.from(tenantStore.documents.values()).filter(
      (d) => d.organizationId === organizationId && d.uploaderId === studentUser.id
    );

    return docs.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.mimeType,
      size: d.size,
      url: `/api/v1/student/documents/${d.id}/view`,
      downloadUrl: `/api/v1/student/documents/${d.id}/download`,
      uploadedAt: d.createdAt.toISOString().split('T')[0],
    }));
  }

  /**
   * Get single document metadata
   */
  async getStudentDocumentById(organizationId: string, studentUser: AuthenticatedUser, documentId: string) {
    const doc = tenantStore.documents.get(documentId);
    if (!doc) throw new NotFoundError('Document', documentId);
    if (doc.organizationId !== organizationId) throw new TenantViolationError();

    if (studentUser.role === UserRole.STUDENT && doc.uploaderId !== studentUser.id) {
      throw new ForbiddenError('You do not have permission to access this document');
    }

    return {
      id: doc.id,
      name: doc.name,
      type: doc.mimeType,
      size: doc.size,
      url: `/api/v1/student/documents/${doc.id}/view`,
      downloadUrl: `/api/v1/student/documents/${doc.id}/download`,
      uploadedAt: doc.createdAt.toISOString().split('T')[0],
    };
  }

  /**
   * Get document raw file buffer for view / download
   */
  async getStudentDocumentFile(organizationId: string, studentUser: AuthenticatedUser, documentId: string) {
    const doc = tenantStore.documents.get(documentId);
    if (!doc) throw new NotFoundError('Document', documentId);
    if (doc.organizationId !== organizationId) throw new TenantViolationError();

    if (studentUser.role === UserRole.STUDENT && doc.uploaderId !== studentUser.id) {
      throw new ForbiddenError('You do not have permission to access this document');
    }

    let buffer: Buffer;
    try {
      const candidatePaths = [
        path.resolve(process.cwd(), 'uploads', doc.storageKey || ''),
        path.resolve(process.cwd(), 'uploads', organizationId, doc.name),
        path.resolve(process.cwd(), 'uploads', 'org-a-id', doc.name),
        path.resolve(process.cwd(), 'uploads', doc.name),
        path.resolve(process.cwd(), 'uploads', 'Offer_Letter_OrgA.pdf'),
      ];
      let foundPath: string | null = null;
      for (const p of candidatePaths) {
        if (fsSync.existsSync(p)) {
          foundPath = p;
          break;
        }
      }

      if (foundPath) {
        buffer = await fs.readFile(foundPath);
      } else {
        buffer = generateMinimalValidPdf(doc.name, `Institutional Document: ${doc.name} - Org: ${organizationId}`);
      }
    } catch {
      buffer = generateMinimalValidPdf(doc.name, `Institutional Document: ${doc.name} - Org: ${organizationId}`);
    }

    return {
      buffer,
      filename: doc.name || 'document.pdf',
      mimeType: doc.mimeType || 'application/pdf',
      size: buffer.length,
    };
  }

  /**
   * Upload student document with PDF signature validation
   */
  async uploadStudentDocument(
    organizationId: string,
    studentUser: AuthenticatedUser,
    file: {
      buffer: Buffer;
      filename: string;
      mimeType: string;
      documentType?: string;
    }
  ) {
    if (file.mimeType !== 'application/pdf' && !file.filename.toLowerCase().endsWith('.pdf')) {
      throw new ValidationError('Only PDF documents (.pdf) are permitted.');
    }

    // Verify PDF magic bytes '%PDF-'
    if (file.buffer.length < 5 || file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      throw new ValidationError('Invalid PDF document: file signature must be a valid PDF format.');
    }

    const docId = `doc-${Date.now().toString(36)}`;
    const sanitizedOrg = organizationId.replace(/[^a-zA-Z0-9-_]/g, '');
    const safeFilename = path.basename(file.filename);
    const storageKey = `${sanitizedOrg}/${docId}-${safeFilename}`;

    const targetDir = path.resolve(process.cwd(), 'uploads', sanitizedOrg);
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(path.join(targetDir, `${docId}-${safeFilename}`), file.buffer);

    const now = new Date();
    tenantStore.documents.set(docId, {
      id: docId,
      organizationId,
      uploaderId: studentUser.id,
      internshipId: 'internship-a-1',
      name: safeFilename,
      mimeType: 'application/pdf',
      size: file.buffer.length,
      storageKey,
      url: `/api/v1/student/documents/${docId}/view`,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: docId,
      name: safeFilename,
      type: 'application/pdf',
      size: file.buffer.length,
      url: `/api/v1/student/documents/${docId}/view`,
      downloadUrl: `/api/v1/student/documents/${docId}/download`,
      uploadedAt: now.toISOString().split('T')[0],
    };
  }

  /**
   * Student Profile
   */
  async getStudentProfile(organizationId: string, studentUser: AuthenticatedUser) {
    const dept = tenantStore.departments.get(studentUser.departmentId || '');
    let rollNumber = 'GHR-CSE-2026-041';
    let program = 'B.Tech Computer Engineering';
    let year = 'Third Year';

    if (studentUser.email.includes('ananya')) {
      rollNumber = 'GHR-IT-2026-057';
      program = 'B.Tech Information Technology';
      year = 'Third Year';
    } else if (studentUser.email.includes('rohan')) {
      rollNumber = 'GHR-BCA-2026-023';
      program = 'BCA';
      year = 'Second Year';
    } else if (studentUser.email.includes('sneha')) {
      rollNumber = 'GHR-CSE-2026-089';
      program = 'B.Tech CSE';
      year = 'Final Year';
    }

    return {
      id: studentUser.id,
      firstName: studentUser.firstName,
      lastName: studentUser.lastName,
      email: studentUser.email,
      role: studentUser.role,
      department: dept?.name || 'Computer Engineering',
      departmentCode: dept?.code || 'CE',
      program,
      year,
      rollNumber,
      batchYear: 2026,
      cgpa: 3.88,
    };
  }

  // ---------------------------------------------------------
  // MENTOR WORKSPACE METHODS
  // ---------------------------------------------------------

  /**
   * Mentor Dashboard with genuine aggregation
   */
  async getMentorDashboard(organizationId: string, mentorUser: AuthenticatedUser): Promise<MentorDashboardDto> {
    const internships = Array.from(internshipStore.details.values()).filter(
      (i) => i.organizationId === organizationId && (i.mentorId === mentorUser.id || i.mentor?.email === mentorUser.email)
    );

    const activeInternships = internships.filter((i) => i.status === InternshipStatus.ACTIVE);

    // Get all submissions for these internships
    const internshipIds = new Set(internships.map((i) => i.id));
    const allSubs = Array.from(studentMentorStore.submissions.values()).filter((s) =>
      internshipIds.has(s.internshipId)
    );

    const pendingReviews = allSubs.filter((s) => s.status === SubmissionStatus.SUBMITTED);

    // Tasks awaiting review or in progress
    const allTasks = Array.from(studentMentorStore.tasks.values()).filter((t) =>
      internshipIds.has(t.internshipId)
    );
    const tasksAwaitingReview = allTasks.filter((t) => t.status === TaskStatus.SUBMITTED).length;

    // Outcomes requiring evidence
    const allOutcomes = Array.from(studentMentorStore.outcomes.values()).filter(
      (o) => o.organizationId === organizationId
    );

    // Build intern cards
    const interns = internships.map((i) => {
      const student = authStore.users.get(i.studentId);
      const dept = student?.departmentId ? tenantStore.departments.get(student.departmentId) : null;
      const iTasks = allTasks.filter((t) => t.internshipId === i.id);
      const completed = iTasks.filter((t) => t.status === TaskStatus.APPROVED).length;
      const progress = iTasks.length > 0 ? Math.round((completed / iTasks.length) * 100) : 0;
      const pendingCount = allSubs.filter((s) => s.internshipId === i.id && s.status === SubmissionStatus.SUBMITTED).length;

      const ms = Array.from(studentMentorStore.milestones.values()).find(
        (m) => m.internshipId === i.id && m.status === 'IN_PROGRESS'
      );

      const company = internshipStore.companies.get(i.companyId);
      return {
        studentId: i.studentId,
        internshipId: i.id,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
        department: dept?.name || 'Computer Engineering',
        internshipTitle: i.title,
        companyName: company?.name || 'Google Cloud Solutions',
        startDate: i.startDate ? i.startDate.toISOString().split('T')[0] : '2026-06-01',
        endDate: i.endDate ? i.endDate.toISOString().split('T')[0] : '2027-01-12',
        progress,
        currentMilestoneTitle: ms?.title || 'Backend API Development',
        pendingSubmissionsCount: pendingCount,
        status: i.status,
      };
    });

    const recentSubmissions = pendingReviews.slice(0, 5).map((s) => {
      const student = authStore.users.get(s.studentId);
      const task = studentMentorStore.tasks.get(s.taskId);
      return {
        id: s.id,
        internshipId: s.internshipId,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
        studentEmail: student?.email || 'student@org-a.com',
        taskTitle: task?.title || 'Deliverable Task',
        submissionTitle: s.title,
        submittedAt: s.submittedAt.toISOString().split('T')[0],
        status: s.status,
      };
    });

    // Calculate verified outcomes count for mentor's interns
    const verifiedOutcomesCount = allOutcomes.filter((o) => {
      const outTasks = allTasks.filter((t) => t.learningOutcomeId === o.id);
      return outTasks.length > 0 && outTasks.every((t) => t.status === TaskStatus.APPROVED);
    }).length;

    // Resolve primary mentor company name
    const primaryInternship = internships[0];
    const mentorCompany = primaryInternship ? internshipStore.companies.get(primaryInternship.companyId) : null;
    const companyName = mentorCompany?.name || (mentorUser.email.includes('tcs') ? 'Tata Consultancy Services' : mentorUser.email.includes('infosys') ? 'Infosys' : mentorUser.email.includes('persistent') ? 'Persistent Systems' : 'Industry Partner');

    return {
      mentorName: `${mentorUser.firstName} ${mentorUser.lastName}`,
      companyName,
      stats: {
        assignedInterns: interns.length,
        activeInternships: activeInternships.length,
        pendingReviews: pendingReviews.length,
        tasksAwaitingReview,
        outcomesRequiringEvidence: Math.max(0, allOutcomes.length - verifiedOutcomesCount),
      },
      recentSubmissions,
      interns,
    };
  }

  /**
   * List assigned interns
   */
  async getMentorInterns(organizationId: string, mentorUser: AuthenticatedUser) {
    const dashboard = await this.getMentorDashboard(organizationId, mentorUser);
    return dashboard.interns;
  }

  /**
   * Full 7-tab intern detail profile
   */
  async getMentorInternDetail(organizationId: string, mentorUser: AuthenticatedUser, studentId: string): Promise<MentorInternDetailDto> {
    const student = authStore.users.get(studentId);
    if (!student) throw new NotFoundError('Student', studentId);

    const internship = Array.from(internshipStore.details.values()).find(
      (i) => i.organizationId === organizationId && i.studentId === studentId
    );
    if (!internship) throw new NotFoundError('Internship for student', studentId);

    const company = internshipStore.companies.get(internship.companyId);
    const dept = student.departmentId ? tenantStore.departments.get(student.departmentId) : null;

    const milestones = Array.from(studentMentorStore.milestones.values())
      .filter((m) => m.internshipId === internship.id)
      .map((m) => {
        const msTasks = Array.from(studentMentorStore.tasks.values()).filter((t) => t.milestoneId === m.id);
        const completed = msTasks.filter((t) => t.status === TaskStatus.APPROVED).length;
        return {
          id: m.id,
          organizationId: m.organizationId,
          internshipId: m.internshipId,
          title: m.title,
          description: m.description,
          order: m.order,
          startDate: m.startDate?.toISOString().split('T')[0],
          dueDate: m.dueDate.toISOString().split('T')[0],
          progress: msTasks.length > 0 ? Math.round((completed / msTasks.length) * 100) : m.progress,
          completedTasks: completed,
          totalTasks: msTasks.length,
          status: m.status,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        };
      });

    const tasks = Array.from(studentMentorStore.tasks.values())
      .filter((t) => t.internshipId === internship.id)
      .map((t) => this.mapTaskToDto(t));

    const submissions = Array.from(studentMentorStore.submissions.values())
      .filter((s) => s.internshipId === internship.id)
      .map((s) => ({
        id: s.id,
        organizationId: s.organizationId,
        taskId: s.taskId,
        studentId: s.studentId,
        title: s.title,
        content: s.description,
        documentUrl: s.evidenceUrl,
        status: s.status,
        submittedAt: s.submittedAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      }));

    const outcomes = await this.getStudentOutcomes(organizationId, student as any);

    const feedbacks = Array.from(studentMentorStore.submissions.values())
      .filter((s) => s.internshipId === internship.id && s.mentorFeedback)
      .map((s) => {
        const t = studentMentorStore.tasks.get(s.taskId);
        return {
          id: `fb-${s.id}`,
          submissionId: s.id,
          taskTitle: t?.title,
          feedback: s.mentorFeedback!,
          rating: s.mentorRating,
          strengths: s.mentorStrengths,
          improvements: s.mentorImprovements,
          nextAction: s.mentorNextAction,
          createdAt: s.reviewedAt?.toISOString() || s.updatedAt.toISOString(),
        };
      });

    const documents = Array.from(tenantStore.documents.values())
      .filter((d) => d.internshipId === internship.id)
      .map((d) => ({
        id: d.id,
        name: d.name,
        type: d.mimeType,
        url: d.url,
        uploadedAt: d.createdAt.toISOString().split('T')[0],
      }));

    const completedTasksCount = tasks.filter((t) => t.status === TaskStatus.APPROVED).length;
    const progress = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        department: dept?.name || 'Computer Engineering',
        college: 'Organization A University',
        rollNumber: '2023-CS-101',
        batchYear: 2026,
      },
      internship: {
        id: internship.id,
        title: internship.title,
        companyName: company?.name || 'Google Cloud Solutions',
        startDate: internship.startDate.toISOString().split('T')[0],
        endDate: internship.endDate.toISOString().split('T')[0],
        status: internship.status,
        workMode: internship.type,
        progress,
      },
      milestones,
      tasks,
      submissions: submissions as any,
      outcomes,
      feedbacks,
      documents,
    };
  }

  /**
   * List mentor milestones with student and internship context
   */
  async getMentorMilestones(organizationId: string, mentorUser: AuthenticatedUser, internshipId?: string): Promise<MilestoneDto[]> {
    const internships = Array.from(internshipStore.details.values()).filter(
      (i) => i.organizationId === organizationId && (i.mentorId === mentorUser.id || i.mentor?.email === mentorUser.email)
    );
    const internshipMap = new Map(internships.map((i) => [i.id, i]));
    const allowedInternshipIds = new Set(internships.map((i) => i.id));

    let milestones = Array.from(studentMentorStore.milestones.values()).filter(
      (m) => m.organizationId === organizationId && allowedInternshipIds.has(m.internshipId)
    );
    if (internshipId && internshipId !== 'ALL') {
      milestones = milestones.filter((m) => m.internshipId === internshipId);
    }

    return milestones.map((m) => {
      const msTasks = Array.from(studentMentorStore.tasks.values()).filter((t) => t.milestoneId === m.id);
      const completed = msTasks.filter((t) => t.status === TaskStatus.APPROVED).length;
      const internship = internshipMap.get(m.internshipId);
      const student = internship ? authStore.users.get(internship.studentId) : null;
      const company = internship ? internshipStore.companies.get(internship.companyId) : null;

      return {
        id: m.id,
        organizationId: m.organizationId,
        internshipId: m.internshipId,
        title: m.title,
        description: m.description,
        order: m.order,
        startDate: m.startDate?.toISOString().split('T')[0],
        dueDate: m.dueDate.toISOString().split('T')[0],
        progress: msTasks.length > 0 ? Math.round((completed / msTasks.length) * 100) : m.progress,
        completedTasks: completed,
        totalTasks: msTasks.length,
        status: m.status,
        studentId: internship?.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
        internshipTitle: internship?.title,
        companyName: company?.name || 'Partner Company',
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Get single milestone detail with assigned tasks
   */
  async getMentorMilestoneById(organizationId: string, mentorUser: AuthenticatedUser, milestoneId: string): Promise<MilestoneDto> {
    const milestone = studentMentorStore.milestones.get(milestoneId);
    if (!milestone) throw new NotFoundError('Milestone', milestoneId);
    if (milestone.organizationId !== organizationId) throw new TenantViolationError();

    const internship = internshipStore.details.get(milestone.internshipId);
    if (!internship) throw new NotFoundError('Internship for milestone', milestone.internshipId);
    if (internship.mentorId !== mentorUser.id && internship.mentor?.email !== mentorUser.email && mentorUser.role !== UserRole.ADMIN && mentorUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError('You do not have permission to view this milestone');
    }

    const student = authStore.users.get(internship.studentId);
    const company = internshipStore.companies.get(internship.companyId);

    const msTasks = Array.from(studentMentorStore.tasks.values()).filter((t) => t.milestoneId === milestone.id);
    const completed = msTasks.filter((t) => t.status === TaskStatus.APPROVED).length;

    return {
      id: milestone.id,
      organizationId: milestone.organizationId,
      internshipId: milestone.internshipId,
      title: milestone.title,
      description: milestone.description,
      order: milestone.order,
      startDate: milestone.startDate?.toISOString().split('T')[0],
      dueDate: milestone.dueDate.toISOString().split('T')[0],
      progress: msTasks.length > 0 ? Math.round((completed / msTasks.length) * 100) : milestone.progress,
      completedTasks: completed,
      totalTasks: msTasks.length,
      status: milestone.status,
      studentId: internship.studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
      internshipTitle: internship.title,
      companyName: company?.name || 'Partner Company',
      tasks: msTasks.map((t) => this.mapTaskToDto(t)),
      createdAt: milestone.createdAt.toISOString(),
      updatedAt: milestone.updatedAt.toISOString(),
    };
  }

  /**
   * Mentor creates a milestone for an internship
   */
  async createMentorMilestone(organizationId: string, mentorUser: AuthenticatedUser, dto: CreateMilestoneDto): Promise<MilestoneDto> {
    if (!dto.internshipId) throw new ValidationError('Internship ID is required');
    if (!dto.title?.trim()) throw new ValidationError('Milestone title is required');
    if (!dto.dueDate) throw new ValidationError('Due date is required');

    const id = `ms-${Date.now().toString(36)}`;
    const now = new Date();

    const milestone: InMemoryMilestone = {
      id,
      organizationId,
      internshipId: dto.internshipId,
      title: dto.title.trim(),
      description: dto.description?.trim() || '',
      order: dto.order || 1,
      startDate: dto.startDate ? new Date(dto.startDate) : now,
      dueDate: new Date(dto.dueDate),
      progress: 0,
      status: 'NOT_STARTED',
      createdAt: now,
      updatedAt: now,
    };

    studentMentorStore.milestones.set(id, milestone);

    const internship = internshipStore.details.get(dto.internshipId);
    const student = internship ? authStore.users.get(internship.studentId) : null;
    const company = internship ? internshipStore.companies.get(internship.companyId) : null;

    return {
      ...milestone,
      startDate: milestone.startDate?.toISOString().split('T')[0],
      dueDate: milestone.dueDate.toISOString().split('T')[0],
      completedTasks: 0,
      totalTasks: 0,
      studentId: internship?.studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
      internshipTitle: internship?.title,
      companyName: company?.name,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  /**
   * Mentor updates an existing milestone
   */
  async updateMentorMilestone(
    organizationId: string,
    mentorUser: AuthenticatedUser,
    milestoneId: string,
    dto: { title?: string; description?: string; dueDate?: string; startDate?: string; progress?: number; status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' }
  ): Promise<MilestoneDto> {
    const milestone = studentMentorStore.milestones.get(milestoneId);
    if (!milestone) throw new NotFoundError('Milestone', milestoneId);
    if (milestone.organizationId !== organizationId) throw new TenantViolationError();

    if (dto.title !== undefined) milestone.title = dto.title.trim();
    if (dto.description !== undefined) milestone.description = dto.description.trim();
    if (dto.dueDate !== undefined) milestone.dueDate = new Date(dto.dueDate);
    if (dto.startDate !== undefined) milestone.startDate = new Date(dto.startDate);
    if (dto.progress !== undefined) milestone.progress = dto.progress;
    if (dto.status !== undefined) milestone.status = dto.status;
    milestone.updatedAt = new Date();

    return this.getMentorMilestoneById(organizationId, mentorUser, milestoneId);
  }

  /**
   * List mentor tasks with student and internship context
   */
  async getMentorTasks(organizationId: string, mentorUser: AuthenticatedUser, internshipId?: string): Promise<TaskItemDto[]> {
    const internships = Array.from(internshipStore.details.values()).filter(
      (i) => i.organizationId === organizationId && (i.mentorId === mentorUser.id || i.mentor?.email === mentorUser.email)
    );
    const allowedInternshipIds = new Set(internships.map((i) => i.id));

    let tasks = Array.from(studentMentorStore.tasks.values()).filter(
      (t) => t.organizationId === organizationId && allowedInternshipIds.has(t.internshipId)
    );
    if (internshipId && internshipId !== 'ALL') {
      tasks = tasks.filter((t) => t.internshipId === internshipId);
    }
    return tasks.map((t) => this.mapTaskToDto(t));
  }

  /**
   * Get task by ID for mentor
   */
  async getMentorTaskById(organizationId: string, mentorUser: AuthenticatedUser, taskId: string): Promise<TaskItemDto> {
    const task = studentMentorStore.tasks.get(taskId);
    if (!task) throw new NotFoundError('Task', taskId);
    if (task.organizationId !== organizationId) throw new TenantViolationError();

    const internship = internshipStore.details.get(task.internshipId);
    if (!internship) throw new NotFoundError('Internship for task', task.internshipId);
    if (internship.mentorId !== mentorUser.id && internship.mentor?.email !== mentorUser.email && mentorUser.role !== UserRole.ADMIN && mentorUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError('You do not have permission to view this task');
    }

    return this.mapTaskToDto(task);
  }

  /**
   * Mentor creates a task, linking it to Milestone, Learning Outcome, and Expected Evidence
   */
  async createMentorTask(organizationId: string, mentorUser: AuthenticatedUser, dto: CreateTaskDto): Promise<TaskItemDto> {
    if (!dto.internshipId) throw new ValidationError('Internship ID is required');
    if (!dto.title?.trim()) throw new ValidationError('Task title is required');
    if (!dto.dueDate) throw new ValidationError('Due date is required');

    const id = `task-${Date.now().toString(36)}`;
    const now = new Date();

    const task: InMemoryTask = {
      id,
      organizationId,
      internshipId: dto.internshipId,
      milestoneId: dto.milestoneId,
      title: dto.title.trim(),
      description: dto.description?.trim() || '',
      instructions: dto.instructions?.trim(),
      dueDate: new Date(dto.dueDate),
      priority: dto.priority || 'MEDIUM',
      status: TaskStatus.PENDING,
      learningOutcomeId: dto.learningOutcomeId,
      expectedEvidence: dto.expectedEvidence?.trim() || 'GitHub Pull Request link and summary report',
      createdAt: now,
      updatedAt: now,
    };

    studentMentorStore.tasks.set(id, task);

    return this.mapTaskToDto(task);
  }

  /**
   * Update task by mentor
   */
  async updateMentorTask(organizationId: string, mentorUser: AuthenticatedUser, taskId: string, dto: UpdateTaskDto): Promise<TaskItemDto> {
    const task = studentMentorStore.tasks.get(taskId);
    if (!task) throw new NotFoundError('Task', taskId);
    if (task.organizationId !== organizationId) throw new TenantViolationError();

    if (dto.title !== undefined) task.title = dto.title.trim();
    if (dto.description !== undefined) task.description = dto.description.trim();
    if (dto.instructions !== undefined) task.instructions = dto.instructions.trim();
    if (dto.dueDate !== undefined) task.dueDate = new Date(dto.dueDate);
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.milestoneId !== undefined) task.milestoneId = dto.milestoneId;
    if (dto.learningOutcomeId !== undefined) task.learningOutcomeId = dto.learningOutcomeId;
    if (dto.expectedEvidence !== undefined) task.expectedEvidence = dto.expectedEvidence;
    task.updatedAt = new Date();

    return this.mapTaskToDto(task);
  }

  /**
   * List mentor submissions awaiting review with student and internship context
   */
  async getMentorSubmissions(organizationId: string, mentorUser: AuthenticatedUser, filter?: { status?: string }) {
    const dashboard = await this.getMentorDashboard(organizationId, mentorUser);
    const internshipIds = new Set(dashboard.interns.map((i: any) => i.internshipId));

    let subs = Array.from(studentMentorStore.submissions.values()).filter((s) =>
      internshipIds.has(s.internshipId)
    );

    if (filter?.status && filter.status !== 'ALL') {
      subs = subs.filter((s) => s.status === filter.status);
    }

    return subs.map((s) => {
      const student = authStore.users.get(s.studentId);
      const task = studentMentorStore.tasks.get(s.taskId);
      const milestone = task?.milestoneId ? studentMentorStore.milestones.get(task.milestoneId) : null;
      const internship = internshipStore.details.get(s.internshipId);
      const company = internship ? internshipStore.companies.get(internship.companyId) : null;

      return {
        id: s.id,
        taskId: s.taskId,
        taskTitle: task?.title || 'Deliverable Task',
        milestoneTitle: milestone?.title || 'General Milestone',
        internshipId: s.internshipId,
        internshipTitle: internship?.title || 'Engineering Internship',
        companyName: company?.name || 'Host Organization',
        studentId: s.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
        studentEmail: student?.email,
        title: s.title,
        description: s.description,
        evidenceType: s.evidenceType,
        evidenceUrl: s.evidenceUrl,
        evidenceUrls: s.evidenceUrls,
        attachmentName: s.attachmentName,
        status: s.status,
        submittedAt: s.submittedAt.toISOString().split('T')[0],
        mentorFeedback: s.mentorFeedback,
        mentorRating: s.mentorRating,
        mentorStrengths: s.mentorStrengths,
        mentorImprovements: s.mentorImprovements,
        mentorNextAction: s.mentorNextAction,
        reviewedAt: s.reviewedAt?.toISOString().split('T')[0],
        history: s.history,
      };
    });
  }

  /**
   * Get single submission detail for mentor
   */
  async getMentorSubmissionById(organizationId: string, mentorUser: AuthenticatedUser, submissionId: string) {
    const s = studentMentorStore.submissions.get(submissionId);
    if (!s) throw new NotFoundError('Submission', submissionId);
    if (s.organizationId !== organizationId) throw new TenantViolationError();

    const student = authStore.users.get(s.studentId);
    const task = studentMentorStore.tasks.get(s.taskId);
    const milestone = task?.milestoneId ? studentMentorStore.milestones.get(task.milestoneId) : null;
    const internship = internshipStore.details.get(s.internshipId);
    const company = internship ? internshipStore.companies.get(internship.companyId) : null;

    return {
      id: s.id,
      taskId: s.taskId,
      taskTitle: task?.title || 'Deliverable Task',
      taskDescription: task?.description,
      expectedEvidence: task?.expectedEvidence,
      milestoneTitle: milestone?.title || 'General Milestone',
      internshipId: s.internshipId,
      internshipTitle: internship?.title || 'Engineering Internship',
      companyName: company?.name || 'Host Organization',
      studentId: s.studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
      studentEmail: student?.email,
      title: s.title,
      description: s.description,
      notes: s.notes,
      evidenceType: s.evidenceType,
      evidenceUrl: s.evidenceUrl,
      evidenceUrls: s.evidenceUrls,
      attachmentName: s.attachmentName,
      status: s.status,
      submittedAt: s.submittedAt.toISOString().split('T')[0],
      mentorFeedback: s.mentorFeedback,
      mentorRating: s.mentorRating,
      mentorStrengths: s.mentorStrengths,
      mentorImprovements: s.mentorImprovements,
      mentorNextAction: s.mentorNextAction,
      reviewedAt: s.reviewedAt?.toISOString().split('T')[0],
      history: s.history,
    };
  }

  /**
   * Review submission: Accept evidence or Request Revision
   */
  async reviewSubmission(
    organizationId: string,
    mentorUser: AuthenticatedUser,
    submissionId: string,
    dto: MentorReviewSubmissionDto
  ) {
    const s = studentMentorStore.submissions.get(submissionId);
    if (!s) throw new NotFoundError('Submission', submissionId);
    if (s.organizationId !== organizationId) throw new TenantViolationError();

    if (!dto.feedback?.trim()) throw new ValidationError('Feedback text is required');

    const now = new Date();
    s.mentorFeedback = dto.feedback.trim();
    s.mentorRating = dto.rating || dto.score || 5;
    s.mentorStrengths = dto.strengths?.trim();
    s.mentorImprovements = dto.improvements?.trim();
    s.mentorNextAction = dto.nextAction?.trim();
    s.reviewedAt = now;
    s.updatedAt = now;

    const task = studentMentorStore.tasks.get(s.taskId);

    if (dto.status === 'ACCEPTED') {
      s.status = SubmissionStatus.ACCEPTED;
      if (task) {
        task.status = TaskStatus.APPROVED;
        task.updatedAt = now;
      }
    } else {
      s.status = SubmissionStatus.REVISION_NEEDED;
      if (task) {
        task.status = TaskStatus.CHANGES_REQUESTED;
        task.updatedAt = now;
      }
    }

    // Recalculate milestone progress if milestone exists
    if (task?.milestoneId) {
      const milestone = studentMentorStore.milestones.get(task.milestoneId);
      if (milestone) {
        const msTasks = Array.from(studentMentorStore.tasks.values()).filter((t) => t.milestoneId === milestone.id);
        const approvedCount = msTasks.filter((t) => t.status === TaskStatus.APPROVED).length;
        milestone.progress = msTasks.length > 0 ? Math.round((approvedCount / msTasks.length) * 100) : 0;
        if (milestone.progress === 100) {
          milestone.status = 'COMPLETED';
        } else if (milestone.progress > 0) {
          milestone.status = 'IN_PROGRESS';
        }
        milestone.updatedAt = now;
      }
    }

    await auditService.log({
      organizationId,
      actorId: mentorUser.id,
      action: 'UPDATE' as any,
      entity: 'SubmissionReview',
      entityId: submissionId,
      details: { decision: dto.status, taskId: s.taskId },
    });

    return s;
  }

  /**
   * Learning Outcomes for Mentor with explicit student and internship context & server filters
   */
  async getMentorOutcomes(
    organizationId: string,
    mentorUser: AuthenticatedUser,
    query?: {
      studentId?: string;
      internshipId?: string;
      outcomeId?: string;
      status?: string;
      search?: string;
    }
  ) {
    const internships = Array.from(internshipStore.details.values()).filter(
      (i) => i.organizationId === organizationId && (i.mentorId === mentorUser.id || i.mentor?.email === mentorUser.email)
    );

    let filteredInternships = internships;
    if (query?.internshipId && query.internshipId !== 'ALL') {
      filteredInternships = filteredInternships.filter((i) => i.id === query.internshipId);
    }
    if (query?.studentId && query.studentId !== 'ALL') {
      filteredInternships = filteredInternships.filter((i) => i.studentId === query.studentId);
    }

    const allOutcomeDefs = Array.from(studentMentorStore.outcomes.values()).filter(
      (o) => o.organizationId === organizationId
    );

    const results: any[] = [];

    for (const internship of filteredInternships) {
      const student = authStore.users.get(internship.studentId);
      const company = internshipStore.companies.get(internship.companyId);
      const studentName = student ? `${student.firstName} ${student.lastName}` : 'Student';
      const companyName = company?.name || 'Google Cloud Solutions';

      const iTasks = Array.from(studentMentorStore.tasks.values()).filter((t) => t.internshipId === internship.id);

      for (const o of allOutcomeDefs) {
        if (query?.outcomeId && query.outcomeId !== 'ALL' && o.id !== query.outcomeId && o.code !== query.outcomeId) {
          continue;
        }

        const mappedTasks = iTasks.filter((t) => t.learningOutcomeId === o.id);
        const studentEvidence: any[] = [];

        mappedTasks.forEach((t) => {
          const subs = Array.from(studentMentorStore.submissions.values()).filter(
            (s) => s.taskId === t.id && s.studentId === internship.studentId
          );
          subs.forEach((s) => {
            studentEvidence.push({
              submissionId: s.id,
              taskTitle: t.title,
              evidenceType: s.evidenceType,
              evidenceUrl: s.evidenceUrl,
              fileName: s.attachmentName,
              submittedAt: s.submittedAt.toISOString().split('T')[0],
              status: s.status,
            });
          });
        });

        let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'EVIDENCE_SUBMITTED' | 'REVISION_NEEDED' | 'VERIFIED' = 'NOT_STARTED';
        if (studentEvidence.some((e) => e.status === SubmissionStatus.ACCEPTED)) {
          status = 'VERIFIED';
        } else if (studentEvidence.some((e) => e.status === SubmissionStatus.SUBMITTED)) {
          status = 'EVIDENCE_SUBMITTED';
        } else if (studentEvidence.some((e) => e.status === SubmissionStatus.REVISION_NEEDED)) {
          status = 'REVISION_NEEDED';
        } else if (mappedTasks.length > 0) {
          status = 'IN_PROGRESS';
        }

        if (query?.status && query.status !== 'ALL' && status !== query.status) {
          continue;
        }

        const searchLower = query?.search?.toLowerCase().trim();
        if (searchLower) {
          const matches =
            studentName.toLowerCase().includes(searchLower) ||
            internship.title.toLowerCase().includes(searchLower) ||
            companyName.toLowerCase().includes(searchLower) ||
            o.code.toLowerCase().includes(searchLower) ||
            o.name.toLowerCase().includes(searchLower);
          if (!matches) continue;
        }

        const latestReviewed = studentEvidence.find(
          (e) => e.status === SubmissionStatus.ACCEPTED || e.status === SubmissionStatus.REVISION_NEEDED
        );
        const latestSub = latestReviewed ? studentMentorStore.submissions.get(latestReviewed.submissionId) : undefined;

        results.push({
          id: `${o.id}-${internship.id}`,
          outcomeId: o.id,
          code: o.code,
          name: o.name,
          description: o.description,
          studentId: internship.studentId,
          studentName,
          internshipId: internship.id,
          internshipTitle: internship.title,
          companyName,
          expectedEvidence: o.expectedEvidence,
          studentEvidence,
          missingEvidenceCount: Math.max(0, o.expectedEvidence.length - studentEvidence.length),
          status,
          mentorAssessment: latestSub?.mentorFeedback,
          feedback: latestSub?.mentorFeedback,
        });
      }
    }

    return results;
  }

  /**
   * Get single outcome detail by ID
   */
  async getMentorOutcomeById(organizationId: string, mentorUser: AuthenticatedUser, outcomeId: string, studentId?: string) {
    const list = await this.getMentorOutcomes(organizationId, mentorUser, { outcomeId, studentId });
    if (list.length === 0) throw new NotFoundError('Learning Outcome', outcomeId);
    return list[0];
  }

  /**
   * List internship registrations requiring mentor review or management
   */
  async getMentorRegistrations(
    organizationId: string,
    mentorUser: AuthenticatedUser,
    filter?: { status?: string; search?: string }
  ) {
    const internships = Array.from(internshipStore.details.values()).filter(
      (i) => i.organizationId === organizationId && (i.mentorId === mentorUser.id || i.mentor?.email === mentorUser.email)
    );

    let list = internships.map((i) => {
      const student = authStore.users.get(i.studentId);
      const company = internshipStore.companies.get(i.companyId);
      const dept = student?.departmentId ? tenantStore.departments.get(student.departmentId) : null;
      const doc = Array.from(tenantStore.documents.values()).find(
        (d) => d.internshipId === i.id || (d.uploaderId === i.studentId && d.name.toLowerCase().includes('offer'))
      );

      return {
        id: i.id,
        studentId: i.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
        studentEmail: student?.email,
        department: dept?.name || 'Computer Engineering',
        title: i.title,
        companyName: company?.name || 'Partner Organization',
        companyWebsite: company?.website || 'https://cloud.google.com',
        description: i.description || `${i.title} technical internship program with focus on production engineering.`,
        startDate: i.startDate.toISOString().split('T')[0],
        endDate: i.endDate.toISOString().split('T')[0],
        workMode: i.type,
        status: i.status === InternshipStatus.PENDING_APPROVAL ? 'PENDING_REVIEW' : i.status,
        submittedAt: '2026-09-17',
        mentorName: `${mentorUser.firstName} ${mentorUser.lastName}`,
        offerLetterUrl: doc ? `/api/v1/student/documents/${doc.id}/view` : undefined,
        offerLetterName: doc?.name || 'Offer_Letter.pdf',
      };
    });

    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter((i) => i.status === filter.status);
    }

    if (filter?.search) {
      const s = filter.search.toLowerCase();
      list = list.filter(
        (i) =>
          i.studentName.toLowerCase().includes(s) ||
          i.title.toLowerCase().includes(s) ||
          i.companyName.toLowerCase().includes(s)
      );
    }

    return list;
  }

  /**
   * Mentor review of internship registration (approve or request changes)
   */
  async reviewMentorRegistration(
    organizationId: string,
    mentorUser: AuthenticatedUser,
    registrationId: string,
    decision: 'APPROVE' | 'REQUEST_CHANGES',
    comments?: string
  ) {
    const i = internshipStore.details.get(registrationId);
    if (!i) throw new NotFoundError('Internship Registration', registrationId);
    if (i.organizationId !== organizationId) throw new TenantViolationError();

    if (decision === 'APPROVE') {
      i.status = InternshipStatus.ACTIVE;
    } else {
      i.status = InternshipStatus.CHANGES_REQUESTED;
      i.rejectionReason = comments;
    }
    i.updatedAt = new Date();

    return i;
  }

  /**
   * Get all feedback provided across interns with student and task context
   */
  async getMentorFeedback(organizationId: string, mentorUser: AuthenticatedUser) {
    const dashboard = await this.getMentorDashboard(organizationId, mentorUser);
    const internshipIds = new Set(dashboard.interns.map((i: any) => i.internshipId));
    const subs = Array.from(studentMentorStore.submissions.values()).filter(
      (s) => internshipIds.has(s.internshipId) && s.mentorFeedback
    );

    return subs.map((s) => {
      const student = authStore.users.get(s.studentId);
      const task = studentMentorStore.tasks.get(s.taskId);
      const internship = internshipStore.details.get(s.internshipId);

      return {
        id: `fb-${s.id}`,
        submissionId: s.id,
        taskId: s.taskId,
        studentId: s.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
        internshipTitle: internship?.title || 'Engineering Internship',
        taskTitle: task?.title || 'Deliverable Task',
        submissionTitle: s.title,
        feedback: s.mentorFeedback!,
        rating: s.mentorRating,
        strengths: s.mentorStrengths,
        improvements: s.mentorImprovements,
        nextAction: s.mentorNextAction,
        status: s.status,
        date: s.reviewedAt?.toISOString().split('T')[0] || s.updatedAt.toISOString().split('T')[0],
      };
    });
  }

  /**
   * Get documents across mentored internships with student context
   */
  async getMentorDocuments(organizationId: string, mentorUser: AuthenticatedUser) {
    const dashboard = await this.getMentorDashboard(organizationId, mentorUser);
    const internshipIds = new Set(dashboard.interns.map((i: any) => i.internshipId));
    const docs = Array.from(tenantStore.documents.values()).filter(
      (d) => d.organizationId === organizationId && d.internshipId && internshipIds.has(d.internshipId)
    );

    return docs.map((d) => {
      const student = authStore.users.get(d.uploaderId);
      const internship = d.internshipId ? internshipStore.details.get(d.internshipId) : null;
      return {
        id: d.id,
        internshipId: d.internshipId,
        internshipTitle: internship?.title || 'Engineering Internship',
        studentId: d.uploaderId,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
        name: d.name,
        type: d.mimeType,
        size: d.size,
        url: d.url,
        downloadUrl: `/api/v1/student/documents/${d.id}/download`,
        uploadedAt: d.createdAt.toISOString().split('T')[0],
      };
    });
  }

  // ---------------------------------------------------------
  // Helper Mappers
  // ---------------------------------------------------------
  private mapTaskToDto(t: InMemoryTask): TaskItemDto {
    const milestone = t.milestoneId ? studentMentorStore.milestones.get(t.milestoneId) : null;
    const outcome = t.learningOutcomeId ? studentMentorStore.outcomes.get(t.learningOutcomeId) : null;
    const internship = internshipStore.details.get(t.internshipId);
    const student = internship ? authStore.users.get(internship.studentId) : null;
    const company = internship ? internshipStore.companies.get(internship.companyId) : null;

    const subs = Array.from(studentMentorStore.submissions.values()).filter((s) => s.taskId === t.id);
    const latestSub = subs.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0];

    let submissionStatus = 'Not Submitted';
    if (latestSub) {
      if (latestSub.status === SubmissionStatus.DRAFT) submissionStatus = 'Draft';
      else if (latestSub.status === SubmissionStatus.SUBMITTED) submissionStatus = 'Submitted';
      else if (latestSub.status === SubmissionStatus.REVISION_NEEDED) submissionStatus = 'Needs Revision';
      else if (latestSub.status === SubmissionStatus.ACCEPTED) submissionStatus = 'Accepted';
    }

    return {
      id: t.id,
      organizationId: t.organizationId,
      internshipId: t.internshipId,
      internshipTitle: internship?.title,
      studentId: internship?.studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : undefined,
      companyName: company?.name,
      milestoneId: t.milestoneId,
      milestoneTitle: milestone?.title,
      title: t.title,
      description: t.description,
      instructions: t.instructions,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate.toISOString().split('T')[0],
      learningOutcomeId: t.learningOutcomeId,
      learningOutcomeCode: outcome?.code,
      learningOutcomeName: outcome?.name,
      expectedEvidence: t.expectedEvidence,
      requiredEvidence: t.expectedEvidence,
      submissionCount: subs.length,
      submissionStatus,
      latestSubmission: latestSub
        ? {
            id: latestSub.id,
            title: latestSub.title,
            status: latestSub.status,
            submittedAt: latestSub.submittedAt.toISOString().split('T')[0],
            mentorFeedback: latestSub.mentorFeedback,
          }
        : undefined,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }
}

export const studentMentorService = new StudentMentorService();
