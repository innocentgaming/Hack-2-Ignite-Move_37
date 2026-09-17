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
      title: 'Authentication & Session API',
      description: 'Build robust JWT access and refresh token authentication endpoints.',
      instructions: 'Create /auth/login, /auth/refresh, /auth/logout with bcrypt hash and HMAC tokens.',
      status: TaskStatus.APPROVED,
      priority: 'HIGH',
      dueDate: new Date('2026-07-20'),
      learningOutcomeId: 'out-api-dev',
      expectedEvidence: 'GitHub PR link and Postman collection verifying auth flows',
      createdAt: now,
      updatedAt: now,
    };
    const t3: InMemoryTask = {
      id: 'task-103',
      organizationId: orgId,
      internshipId: 'internship-a-1',
      milestoneId: 'ms-2',
      title: 'Internship Data Management API',
      description: 'Implement CRUD operations for internships and departments with tenant isolation.',
      instructions: 'Verify all database queries include organizationId filter.',
      status: TaskStatus.SUBMITTED,
      priority: 'HIGH',
      dueDate: new Date('2026-09-18'),
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
      title: 'Weekly Progress Report & Architecture Review',
      description: 'Document Sprint 3 achievements and technical obstacles.',
      instructions: 'Submit PDF report summarizing schema decisions and mentor feedback actions.',
      status: TaskStatus.PENDING,
      priority: 'MEDIUM',
      dueDate: new Date('2026-09-22'),
      learningOutcomeId: 'out-api-dev',
      expectedEvidence: 'Weekly progress PDF report and sprint log',
      createdAt: now,
      updatedAt: now,
    };
    const t5: InMemoryTask = {
      id: 'task-105',
      organizationId: orgId,
      internshipId: 'internship-a-1',
      milestoneId: 'ms-3',
      title: 'Automated CI/CD Pipeline & Staging Release',
      description: 'Configure GitHub Actions workflow for automated test execution and cloud container deploy.',
      instructions: 'Push .github/workflows/deploy.yml and verify green build status on main branch.',
      status: TaskStatus.PENDING,
      priority: 'URGENT',
      dueDate: new Date('2026-10-10'),
      learningOutcomeId: 'out-cicd',
      expectedEvidence: 'Live staging URL and GitHub Action run log',
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
    const sub2: InMemorySubmissionRecord = {
      id: 'sub-102',
      organizationId: orgId,
      internshipId: 'internship-a-1',
      taskId: 'task-102',
      studentId: 'user-a-student',
      title: 'JWT Authentication API Implementation',
      description: 'Implemented /login, /refresh, and middleware protection with comprehensive tests.',
      evidenceType: EvidenceType.GITHUB_PR,
      evidenceUrl: 'https://github.com/apex-students/cloud-internos-app/pull/4',
      status: SubmissionStatus.ACCEPTED,
      submittedAt: new Date('2026-07-18'),
      updatedAt: new Date('2026-07-19'),
      mentorFeedback: 'Solid token rotation strategy. All unit tests passed.',
      mentorRating: 5,
      mentorStrengths: 'Secure token handling and clear test cases.',
      mentorNextAction: 'Begin tenant scoped endpoints.',
      reviewedAt: new Date('2026-07-19'),
    };
    const sub3: InMemorySubmissionRecord = {
      id: 'sub-103',
      organizationId: orgId,
      internshipId: 'internship-a-1',
      taskId: 'task-103',
      studentId: 'user-a-student',
      title: 'Tenant-Scoped Data Management API',
      description: 'Added multi-tenant isolation middleware and database filters.',
      evidenceType: EvidenceType.GITHUB_PR,
      evidenceUrl: 'https://github.com/apex-students/cloud-internos-app/pull/12',
      status: SubmissionStatus.SUBMITTED,
      submittedAt: new Date('2026-09-17T14:30:00Z'),
      updatedAt: new Date('2026-09-17T14:30:00Z'),
    };
    this.submissions.set(sub1.id, sub1);
    this.submissions.set(sub2.id, sub2);
    this.submissions.set(sub3.id, sub3);

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

    // 6. Seed for internship-a-3 (David Chen @ Google Cloud, Mentor: Mark Mentor)
    const m3_1: InMemoryMilestone = {
      id: 'ms-3-1',
      organizationId: orgId,
      internshipId: 'internship-a-3',
      title: 'Terraform & Infrastructure as Code',
      description: 'Provision reproducible cloud VPC, clusters, and load balancers.',
      order: 1,
      startDate: new Date('2026-07-01'),
      dueDate: new Date('2026-09-15'),
      progress: 50,
      status: 'IN_PROGRESS',
      createdAt: now,
      updatedAt: now,
    };
    this.milestones.set(m3_1.id, m3_1);

    const t3_1: InMemoryTask = {
      id: 'task-301',
      organizationId: orgId,
      internshipId: 'internship-a-3',
      milestoneId: 'ms-3-1',
      title: 'Automated Terraform VPC Modules',
      description: 'Create modular Terraform definitions for private and public subnets.',
      instructions: 'Write terraform-docs and validate terraform plan output.',
      status: TaskStatus.PENDING,
      priority: 'MEDIUM',
      dueDate: new Date('2026-09-25'),
      learningOutcomeId: 'out-cicd',
      expectedEvidence: 'Terraform repository with tfsec scan report',
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(t3_1.id, t3_1);
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

    // If offer letter was uploaded, attach document
    if (data.offerLetterUrl) {
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
    }
  ) {
    const task = studentMentorStore.tasks.get(taskId);
    if (!task) throw new NotFoundError('Task', taskId);
    if (task.organizationId !== organizationId) throw new TenantViolationError();

    if (!dto.title?.trim()) throw new ValidationError('Submission title is required');
    if (!dto.description?.trim()) throw new ValidationError('Submission description is required');

    const subId = `sub-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

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
      status: SubmissionStatus.SUBMITTED,
      submittedAt: now,
      updatedAt: now,
    };

    studentMentorStore.submissions.set(subId, submission);

    // Update task status to SUBMITTED
    task.status = TaskStatus.SUBMITTED;
    task.updatedAt = now;

    await auditService.log({
      organizationId,
      actorId: studentUser.id,
      action: 'CREATE' as any,
      entity: 'Submission',
      entityId: subId,
      details: { taskId, title: dto.title },
    });

    return submission;
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

    const task = studentMentorStore.tasks.get(s.taskId);
    const milestone = task?.milestoneId ? studentMentorStore.milestones.get(task.milestoneId) : null;

    return {
      id: s.id,
      taskId: s.taskId,
      taskTitle: task?.title || 'Deliverable Task',
      taskDescription: task?.description,
      milestoneTitle: milestone?.title || 'General Milestone',
      title: s.title,
      description: s.description,
      evidenceType: s.evidenceType,
      evidenceUrl: s.evidenceUrl,
      evidenceUrls: s.evidenceUrls,
      attachmentName: s.attachmentName,
      status: s.status,
      submittedAt: s.submittedAt.toISOString(),
      mentorFeedback: s.mentorFeedback,
      mentorRating: s.mentorRating,
      mentorStrengths: s.mentorStrengths,
      mentorImprovements: s.mentorImprovements,
      mentorNextAction: s.mentorNextAction,
      reviewedAt: s.reviewedAt?.toISOString(),
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
      url: d.url,
      uploadedAt: d.createdAt.toISOString().split('T')[0],
    }));
  }

  /**
   * Student Profile
   */
  async getStudentProfile(organizationId: string, studentUser: AuthenticatedUser) {
    const dept = tenantStore.departments.get(studentUser.departmentId || '');
    return {
      id: studentUser.id,
      firstName: studentUser.firstName,
      lastName: studentUser.lastName,
      email: studentUser.email,
      role: studentUser.role,
      department: dept?.name || 'Computer Engineering',
      departmentCode: dept?.code || 'CS',
      rollNumber: '2023-CS-101',
      batchYear: 2026,
      cgpa: 3.85,
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

      return {
        studentId: i.studentId,
        internshipId: i.id,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
        department: dept?.name || 'Computer Engineering',
        internshipTitle: i.title,
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

    return {
      mentorName: `${mentorUser.firstName} ${mentorUser.lastName}`,
      companyName: 'Google Cloud Solutions',
      stats: {
        assignedInterns: interns.length,
        activeInternships: activeInternships.length,
        pendingReviews: pendingReviews.length,
        tasksAwaitingReview,
        outcomesRequiringEvidence: Math.max(0, allOutcomes.length - 2),
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
   * List mentor milestones
   */
  async getMentorMilestones(organizationId: string, mentorUser: AuthenticatedUser, internshipId?: string) {
    let milestones = Array.from(studentMentorStore.milestones.values()).filter(
      (m) => m.organizationId === organizationId
    );
    if (internshipId) {
      milestones = milestones.filter((m) => m.internshipId === internshipId);
    }
    return milestones.map((m) => {
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

    return {
      ...milestone,
      startDate: milestone.startDate?.toISOString().split('T')[0],
      dueDate: milestone.dueDate.toISOString().split('T')[0],
      completedTasks: 0,
      totalTasks: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  /**
   * List mentor tasks
   */
  async getMentorTasks(organizationId: string, mentorUser: AuthenticatedUser, internshipId?: string): Promise<TaskItemDto[]> {
    let tasks = Array.from(studentMentorStore.tasks.values()).filter((t) => t.organizationId === organizationId);
    if (internshipId) {
      tasks = tasks.filter((t) => t.internshipId === internshipId);
    }
    return tasks.map((t) => this.mapTaskToDto(t));
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
   * List mentor submissions awaiting review
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

      return {
        id: s.id,
        taskId: s.taskId,
        taskTitle: task?.title || 'Deliverable Task',
        milestoneTitle: milestone?.title || 'General Milestone',
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
      };
    });
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
   * Get all feedback provided across interns
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
      return {
        id: `fb-${s.id}`,
        submissionId: s.id,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
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
   * Get documents across mentored internships
   */
  async getMentorDocuments(organizationId: string, mentorUser: AuthenticatedUser) {
    const dashboard = await this.getMentorDashboard(organizationId, mentorUser);
    const internshipIds = new Set(dashboard.interns.map((i: any) => i.internshipId));
    const docs = Array.from(tenantStore.documents.values()).filter(
      (d) => d.organizationId === organizationId && d.internshipId && internshipIds.has(d.internshipId)
    );

    return docs.map((d) => {
      const student = authStore.users.get(d.uploaderId);
      return {
        id: d.id,
        internshipId: d.internshipId,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
        name: d.name,
        type: d.mimeType,
        size: d.size,
        url: d.url,
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

    const subs = Array.from(studentMentorStore.submissions.values()).filter((s) => s.taskId === t.id);
    const latestSub = subs.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0];

    return {
      id: t.id,
      organizationId: t.organizationId,
      internshipId: t.internshipId,
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
