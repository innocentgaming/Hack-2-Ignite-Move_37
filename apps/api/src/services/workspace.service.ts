import {
  SubmissionDto,
  CreateSubmissionDto,
  ReviewDto,
  CreateReviewDto,
  EvaluationDto,
  CreateEvaluationDto,
  MentorConcernDto,
  CreateMentorConcernDto,
  AttentionCaseDto,
  StudentWorkspaceDto,
  FacultyWorkspaceDto,
  HODWorkspaceDto,
  MentorWorkspaceDto,
  SubmissionStatus,
  TaskStatus,
  InternshipStatus,
  UserRole,
  AuthenticatedUser,
  AuditAction,
  ExpectedOutcomeDto,
  OutcomeStatus,
  OutcomeVersionDto,
  InternshipDetailsDto,
  SubmissionFileDto,
  SubmissionVersionDto,
  ReviewCriteriaScore,
} from '@internos/types';
import {
  NotFoundError,
  TenantViolationError,
  ValidationError,
  ForbiddenError,
  normalizeRole,
} from '@internos/shared';
import { internshipStore } from './internship.service.js';
import { workflowStore } from './workflow.service.js';
import { authStore } from './auth.service.js';
import { auditService } from './audit.service.js';

export interface InMemorySubmission {
  id: string;
  organizationId: string;
  internshipId: string;
  taskId: string;
  studentId: string;
  currentVersion?: number;
  title: string;
  content: string;
  documentUrl?: string;
  evidenceUrls?: string[];
  files?: SubmissionFileDto[];
  status: SubmissionStatus;
  submittedAt: Date;
  dueAt?: Date;
  isLate?: boolean;
  revisionReason?: string;
  updatedAt: Date;
}

export interface InMemoryReview {
  id: string;
  organizationId: string;
  submissionId: string;
  version?: number;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: UserRole;
  feedback: string;
  score?: number;
  criteria?: ReviewCriteriaScore[];
  status: 'ACCEPTED' | 'CHANGES_REQUESTED';
  revisionReason?: string;
  createdAt: Date;
}

export interface InMemoryEvaluation {
  id: string;
  organizationId: string;
  internshipId: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorRole: UserRole;
  rubricScores: Record<string, number>;
  finalGrade: string;
  comments?: string;
  createdAt: Date;
}

export interface InMemoryMentorConcern {
  id: string;
  organizationId: string;
  internshipId: string;
  mentorId: string;
  mentorName: string;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'RESOLVED' | 'ACTIONED';
  requestedAt: Date;
}

export class WorkspaceStore {
  submissions = new Map<string, InMemorySubmission>();
  reviews = new Map<string, InMemoryReview>();
  evaluations = new Map<string, InMemoryEvaluation>();
  concerns = new Map<string, InMemoryMentorConcern>();

  constructor() {
    this.seed();
  }

  seed() {
    const seedDate = new Date('2026-06-15');

    // Seed Submission for internship-a-1
    const subId = 'sub-a-1';
    this.submissions.set(subId, {
      id: subId,
      organizationId: 'org-a-id',
      internshipId: 'internship-a-1',
      taskId: 'task-seed-1',
      studentId: 'user-a-student',
      title: 'Sprint 1 Daily Activity Log & Work Summary',
      content: 'Configured local dev container and completed architectural onboarding document.',
      documentUrl: 'https://storage.internos.acme.edu/docs/sprint1_report.pdf',
      status: SubmissionStatus.ACCEPTED,
      submittedAt: seedDate,
      updatedAt: seedDate,
    });

    // Seed Review for sub-a-1
    this.reviews.set('rev-a-1', {
      id: 'rev-a-1',
      organizationId: 'org-a-id',
      submissionId: subId,
      reviewerId: 'user-a-mentor',
      reviewerName: 'John Mentor',
      reviewerRole: UserRole.MENTOR,
      feedback: 'Excellent foundational work. Docker setup validated without issues.',
      score: 95,
      status: 'ACCEPTED',
      createdAt: seedDate,
    });
  }
}

export const workspaceStore = new WorkspaceStore();

export class WorkspaceService {
  // ==========================================
  // Submissions & Evidence Upload
  // ==========================================

  async createSubmission(
    organizationId: string,
    studentUser: AuthenticatedUser,
    dto: CreateSubmissionDto
  ): Promise<SubmissionDto> {
    const internship = internshipStore.details.get(dto.internshipId);
    if (!internship) {
      throw new NotFoundError('Internship', dto.internshipId);
    }
    if (internship.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant submission prohibited');
    }

    const role = normalizeRole(studentUser.role);
    if (role === UserRole.STUDENT && internship.studentId !== studentUser.id) {
      throw new TenantViolationError('Students can only submit deliverables for their own internship');
    }

    if (!dto.title || !dto.title.trim()) {
      throw new ValidationError('Submission title is required');
    }
    const content = (dto.content || (dto as any).description || (dto as any).notes || '').trim();
    if (!content) {
      throw new ValidationError('Submission content / description is required');
    }

    const documentUrl = (dto.documentUrl || ((dto as any).evidenceUrls && (dto as any).evidenceUrls[0]) || (dto as any).evidenceUrl || '').toString().trim() || undefined;

    const subId = `sub-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    const submission: InMemorySubmission = {
      id: subId,
      organizationId,
      internshipId: dto.internshipId,
      taskId: dto.taskId,
      studentId: studentUser.id,
      title: dto.title.trim(),
      content,
      documentUrl,
      status: SubmissionStatus.SUBMITTED,
      submittedAt: now,
      updatedAt: now,
    };

    workspaceStore.submissions.set(subId, submission);

    // Update workflow task if present
    if (dto.taskId) {
      const task = workflowStore.tasks.get(dto.taskId);
      if (task) {
        task.status = TaskStatus.SUBMITTED;
        task.completedAt = now;
        task.isLate = now.getTime() > new Date(task.currentDueDate).getTime();
        task.updatedAt = now;
      }
    }

    auditService.log({
      organizationId,
      userId: studentUser.id,
      action: AuditAction.SUBMISSION_CREATE,
      entity: 'Submission',
      entityId: subId,
      details: {
        internshipId: dto.internshipId,
        taskId: dto.taskId,
        title: submission.title,
      },
    });

    return this.mapSubmissionToDto(submission);
  }

  async getSubmissions(
    organizationId: string,
    user: AuthenticatedUser,
    filters?: { internshipId?: string; status?: SubmissionStatus }
  ): Promise<SubmissionDto[]> {
    let list = Array.from(workspaceStore.submissions.values()).filter(
      (s) => s.organizationId === organizationId
    );

    const role = normalizeRole(user.role);
    if (role === UserRole.STUDENT) {
      list = list.filter((s) => s.studentId === user.id);
    } else if (role === UserRole.FACULTY) {
      // Filter to internships assigned to this faculty
      const supervisedIds = new Set(
        Array.from(internshipStore.details.values())
          .filter((d) => d.facultyId === user.id)
          .map((d) => d.id)
      );
      if (supervisedIds.size > 0) {
        list = list.filter((s) => supervisedIds.has(s.internshipId));
      }
    }

    if (filters?.internshipId) {
      list = list.filter((s) => s.internshipId === filters.internshipId);
    }
    if (filters?.status) {
      list = list.filter((s) => s.status === filters.status);
    }

    return list.map((s) => this.mapSubmissionToDto(s));
  }

  async getSubmissionById(organizationId: string, submissionId: string): Promise<SubmissionDto> {
    const sub = workspaceStore.submissions.get(submissionId);
    if (!sub) {
      throw new NotFoundError('Submission', submissionId);
    }
    if (sub.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant submission access prohibited');
    }
    return this.mapSubmissionToDto(sub);
  }

  // ==========================================
  // Reviews, Ratings & Revision Requests
  // ==========================================

  async createReview(
    organizationId: string,
    reviewerUser: AuthenticatedUser,
    dto: CreateReviewDto
  ): Promise<ReviewDto> {
    const sub = workspaceStore.submissions.get(dto.submissionId);
    if (!sub) {
      throw new NotFoundError('Submission', dto.submissionId);
    }
    if (sub.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant review prohibited');
    }

    const reviewerRole = normalizeRole(reviewerUser.role);
    if (![UserRole.FACULTY, UserRole.HOD, UserRole.ADMIN, UserRole.MENTOR].includes(reviewerRole)) {
      throw new ForbiddenError('Only supervisors and industry mentors can submit reviews');
    }

    if (!dto.feedback || !dto.feedback.trim()) {
      throw new ValidationError('Review feedback / comments are required');
    }

    const revId = `rev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const isRevision = !!dto.requestRevision;

    const review: InMemoryReview = {
      id: revId,
      organizationId,
      submissionId: dto.submissionId,
      reviewerId: reviewerUser.id,
      reviewerName: `${reviewerUser.firstName} ${reviewerUser.lastName}`.trim() || 'Supervisor',
      reviewerRole,
      feedback: dto.feedback.trim(),
      score: dto.score,
      status: isRevision ? 'CHANGES_REQUESTED' : 'ACCEPTED',
      createdAt: now,
    };

    workspaceStore.reviews.set(revId, review);

    // Update Submission Status
    sub.status = isRevision ? SubmissionStatus.REVISION_NEEDED : SubmissionStatus.ACCEPTED;
    sub.updatedAt = now;

    // Update Task Status if linked
    if (sub.taskId) {
      const task = workflowStore.tasks.get(sub.taskId);
      if (task) {
        task.status = isRevision ? TaskStatus.CHANGES_REQUESTED : TaskStatus.APPROVED;
        task.updatedAt = now;
      }
    }

    auditService.log({
      organizationId,
      userId: reviewerUser.id,
      action: AuditAction.SUBMISSION_REVIEW,
      entity: 'Review',
      entityId: revId,
      details: {
        submissionId: dto.submissionId,
        score: dto.score,
        status: review.status,
      },
    });

    return this.mapReviewToDto(review);
  }

  // ==========================================
  // Outcome Management by Mentor (Non-destructive)
  // ==========================================

  async modifyOutcomesByMentor(
    organizationId: string,
    mentorUser: AuthenticatedUser,
    internshipId: string,
    newOutcomes: ExpectedOutcomeDto[]
  ): Promise<InternshipDetailsDto> {
    const detail = internshipStore.details.get(internshipId);
    if (!detail) {
      throw new NotFoundError('Internship', internshipId);
    }
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant outcome modification prohibited');
    }

    const role = normalizeRole(mentorUser.role);
    if (![UserRole.MENTOR, UserRole.FACULTY, UserRole.HOD, UserRole.ADMIN].includes(role)) {
      throw new ForbiddenError('Only assigned industry mentors or faculty coordinators can modify outcomes');
    }

    if (!Array.isArray(newOutcomes) || newOutcomes.length === 0) {
      throw new ValidationError('At least one expected outcome is required');
    }

    // Assign stable IDs if missing
    const sanitized: ExpectedOutcomeDto[] = newOutcomes.map((o, idx) => ({
      id: o.id || `outcome-mentor-${Date.now().toString(36)}-${idx + 1}`,
      title: o.title.trim(),
      description: o.description?.trim(),
      expectedEvidence: o.expectedEvidence.trim(),
      status: o.status || OutcomeStatus.PLANNED,
    }));

    detail.expectedOutcomes = sanitized;
    detail.outcomeVersion += 1;
    detail.updatedAt = new Date();

    // Create immutable historical version
    const history = internshipStore.outcomeVersions.get(internshipId) || [];
    const newVersion: OutcomeVersionDto = {
      id: `ov-${internshipId}-${detail.outcomeVersion}`,
      internshipId,
      versionNumber: detail.outcomeVersion,
      outcomes: sanitized,
      updatedBy: mentorUser.id,
      createdAt: new Date().toISOString(),
    };
    history.push(newVersion);
    internshipStore.outcomeVersions.set(internshipId, history);

    auditService.log({
      organizationId,
      userId: mentorUser.id,
      action: AuditAction.OUTCOME_VERSION_CREATE,
      entity: 'OutcomeVersion',
      entityId: newVersion.id,
      details: {
        internshipId,
        modifiedBy: mentorUser.id,
        newVersion: detail.outcomeVersion,
        outcomesCount: sanitized.length,
      },
    });

    return this.mapInternshipDetailToDto(detail);
  }

  async getOutcomeHistory(
    organizationId: string,
    internshipId: string
  ): Promise<OutcomeVersionDto[]> {
    const detail = internshipStore.details.get(internshipId);
    if (!detail) {
      throw new NotFoundError('Internship', internshipId);
    }
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant outcome history prohibited');
    }
    const history = internshipStore.outcomeVersions.get(internshipId) || [];
    return history;
  }

  // ==========================================
  // Mentor Concerns & Termination Requests
  // ==========================================

  async raiseMentorConcern(
    organizationId: string,
    mentorUser: AuthenticatedUser,
    dto: CreateMentorConcernDto
  ): Promise<MentorConcernDto> {
    const role = normalizeRole(mentorUser.role);
    if (![UserRole.MENTOR, UserRole.ADMIN].includes(role)) {
      throw new ForbiddenError('Only assigned industry mentors or admins can raise student concerns');
    }

    const detail = internshipStore.details.get(dto.internshipId);
    if (!detail) {
      throw new NotFoundError('Internship', dto.internshipId);
    }
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant concern flag prohibited');
    }

    const reason = (dto.reason || (dto as any).description || '').trim();
    if (!reason) {
      throw new ValidationError('Detailed concern explanation is required');
    }

    const id = `concern-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    const concern: InMemoryMentorConcern = {
      id,
      organizationId,
      internshipId: dto.internshipId,
      mentorId: mentorUser.id,
      mentorName: `${mentorUser.firstName} ${mentorUser.lastName}`.trim() || 'Industry Mentor',
      reason,
      severity: dto.severity || 'MEDIUM',
      status: 'OPEN',
      requestedAt: now,
    };

    workspaceStore.concerns.set(id, concern);

    auditService.log({
      organizationId,
      userId: mentorUser.id,
      action: AuditAction.MENTOR_CONCERN_RAISE,
      entity: 'MentorConcern',
      entityId: id,
      details: {
        internshipId: dto.internshipId,
        severity: concern.severity,
        reason: concern.reason,
      },
    });

    return this.mapConcernToDto(concern);
  }

  async requestTermination(
    organizationId: string,
    mentorUser: AuthenticatedUser,
    internshipId: string,
    reason: string
  ): Promise<MentorConcernDto> {
    return this.raiseMentorConcern(organizationId, mentorUser, {
      internshipId,
      reason: `Termination Requested by Mentor: ${reason}`,
      severity: 'CRITICAL',
    });
  }

  async getConcerns(organizationId: string, internshipId?: string): Promise<MentorConcernDto[]> {
    return Array.from(workspaceStore.concerns.values())
      .filter((c) => c.organizationId === organizationId && (!internshipId || c.internshipId === internshipId))
      .map((c) => this.mapConcernToDto(c));
  }

  // ==========================================
  // Formal Evaluations
  // ==========================================

  async createEvaluation(
    organizationId: string,
    evaluatorUser: AuthenticatedUser,
    dto: CreateEvaluationDto
  ): Promise<EvaluationDto> {
    const detail = internshipStore.details.get(dto.internshipId);
    if (!detail) {
      throw new NotFoundError('Internship', dto.internshipId);
    }
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant evaluation prohibited');
    }

    const role = normalizeRole(evaluatorUser.role);
    if (![UserRole.FACULTY, UserRole.HOD, UserRole.ADMIN, UserRole.MENTOR].includes(role)) {
      throw new ForbiddenError('Only faculty or authorized evaluators can submit evaluations');
    }

    const finalGrade = (dto.finalGrade || (dto as any).recommendation || 'A').toString().trim();
    if (!finalGrade) {
      throw new ValidationError('Final grade is required');
    }

    const rubricScores = dto.rubricScores || {
      overallScore: (dto as any).overallScore || 0,
      technicalSkillsScore: (dto as any).technicalSkillsScore || 0,
      softSkillsScore: (dto as any).softSkillsScore || 0,
    };
    const comments = (dto.comments || (dto as any).generalComments || (dto as any).strengths || '').toString().trim();

    const id = `eval-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    const evaluation: InMemoryEvaluation = {
      id,
      organizationId,
      internshipId: dto.internshipId,
      evaluatorId: evaluatorUser.id,
      evaluatorName: `${evaluatorUser.firstName} ${evaluatorUser.lastName}`.trim() || 'Evaluator',
      evaluatorRole: role,
      rubricScores,
      finalGrade,
      comments,
      createdAt: now,
    };

    workspaceStore.evaluations.set(id, evaluation);

    auditService.log({
      organizationId,
      userId: evaluatorUser.id,
      action: AuditAction.EVALUATION_CREATE,
      entity: 'Evaluation',
      entityId: id,
      details: {
        internshipId: dto.internshipId,
        finalGrade: evaluation.finalGrade,
      },
    });

    return {
      id: evaluation.id,
      organizationId: evaluation.organizationId,
      internshipId: evaluation.internshipId,
      evaluatorId: evaluation.evaluatorId,
      evaluatorName: evaluation.evaluatorName,
      evaluatorRole: evaluation.evaluatorRole,
      rubricScores: evaluation.rubricScores,
      finalGrade: evaluation.finalGrade,
      comments: evaluation.comments,
      createdAt: evaluation.createdAt.toISOString(),
    };
  }

  async getEvaluationsByInternship(
    organizationId: string,
    internshipId: string
  ): Promise<EvaluationDto[]> {
    const detail = internshipStore.details.get(internshipId);
    if (!detail) {
      throw new NotFoundError('Internship', internshipId);
    }
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant evaluation access prohibited');
    }

    return Array.from(workspaceStore.evaluations.values())
      .filter((e) => e.organizationId === organizationId && e.internshipId === internshipId)
      .map((e) => ({
        id: e.id,
        organizationId: e.organizationId,
        internshipId: e.internshipId,
        evaluatorId: e.evaluatorId,
        evaluatorName: e.evaluatorName,
        evaluatorRole: e.evaluatorRole,
        rubricScores: e.rubricScores,
        finalGrade: e.finalGrade,
        comments: e.comments,
        createdAt: e.createdAt.toISOString(),
      }));
  }

  // ==========================================
  // Role Dashboard Computations
  // ==========================================

  async getStudentWorkspace(organizationId: string, studentId: string): Promise<StudentWorkspaceDto> {
    const internships = Array.from(internshipStore.details.values()).filter(
      (d) => d.organizationId === organizationId && d.studentId === studentId
    );
    internships.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
    const internship = internships.length > 0 ? internships[0] : null;

    let tasks: any[] = [];
    if (internship) {
      tasks = Array.from(workflowStore.tasks.values()).filter(
        (t) => t.organizationId === organizationId && (t.instanceId === internship.workflowInstanceId || !internship.workflowInstanceId)
      );
    }

    const now = Date.now();
    const completedTasks = tasks.filter((t) => t.status === TaskStatus.APPROVED || t.status === TaskStatus.SUBMITTED);
    const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

    const overdueTasks = tasks.filter(
      (t) => t.status === TaskStatus.PENDING && new Date(t.currentDueDate).getTime() < now
    );

    const inAWeek = now + 14 * 24 * 60 * 60 * 1000;
    const upcomingDeadlines = tasks.filter(
      (t) =>
        t.status === TaskStatus.PENDING &&
        new Date(t.currentDueDate).getTime() >= now &&
        new Date(t.currentDueDate).getTime() <= inAWeek
    );

    const submissions = Array.from(workspaceStore.submissions.values())
      .filter((s) => s.organizationId === organizationId && s.studentId === studentId)
      .map((s) => this.mapSubmissionToDto(s));

    const allReviews: ReviewDto[] = [];
    for (const sub of submissions) {
      allReviews.push(...sub.reviews);
    }

    const outcomes = internship?.expectedOutcomes || [];
    const outcomeProgress = {
      total: outcomes.length,
      planned: outcomes.filter((o) => o.status === OutcomeStatus.PLANNED).length,
      inProgress: outcomes.filter((o) => o.status === OutcomeStatus.IN_PROGRESS).length,
      met: outcomes.filter((o) => o.status === OutcomeStatus.MET).length,
    };

    return {
      internship: internship ? this.mapInternshipDetailToDto(internship) : null,
      workflowProgress: progress,
      currentTasks: tasks.filter((t) => t.status === TaskStatus.PENDING).map(this.mapTaskToDto),
      upcomingDeadlines: upcomingDeadlines.map(this.mapTaskToDto),
      overdueTasks: overdueTasks.map(this.mapTaskToDto),
      recentFeedback: allReviews.slice(0, 10),
      outcomeProgress,
      submissions,
    };
  }

  async getFacultyWorkspace(organizationId: string, facultyId: string): Promise<FacultyWorkspaceDto> {
    const facultyUser = authStore.users.get(facultyId);
    if (!facultyUser || facultyUser.organizationId !== organizationId) {
      throw new TenantViolationError('Faculty not found in organization context');
    }

    // Supervised: explicitly assigned or within department
    let assigned = Array.from(internshipStore.details.values()).filter(
      (d) => d.organizationId === organizationId && (d.facultyId === facultyId || (facultyUser.departmentId && this.isStudentInDept(d.studentId, facultyUser.departmentId)))
    );

    if (assigned.length === 0) {
      // Fallback to all in org for demo/test
      assigned = Array.from(internshipStore.details.values()).filter((d) => d.organizationId === organizationId);
    }

    const assignedIds = new Set(assigned.map((d) => d.id));
    const activeCount = assigned.filter((d) => d.status === InternshipStatus.ACTIVE).length;

    // Overdue tasks across assigned interns
    const now = Date.now();
    const overdueTasks = Array.from(workflowStore.tasks.values())
      .filter((t) => t.organizationId === organizationId && t.status === TaskStatus.PENDING && new Date(t.currentDueDate).getTime() < now)
      .map(this.mapTaskToDto);

    // Pending Reviews
    const pendingReviews = Array.from(workspaceStore.submissions.values())
      .filter((s) => s.organizationId === organizationId && s.status === SubmissionStatus.SUBMITTED && assignedIds.has(s.internshipId))
      .map((s) => this.mapSubmissionToDto(s));

    // Attention Cases
    const attentionCases: AttentionCaseDto[] = [];

    // 1. Mentor concerns
    const activeConcerns = Array.from(workspaceStore.concerns.values()).filter(
      (c) => c.organizationId === organizationId && c.status === 'OPEN' && assignedIds.has(c.internshipId)
    );
    for (const c of activeConcerns) {
      const intern = internshipStore.details.get(c.internshipId);
      attentionCases.push({
        id: `att-concern-${c.id}`,
        internshipId: c.internshipId,
        studentId: intern?.studentId || 'unknown',
        studentName: 'Student Candidate',
        companyName: intern?.companyId || 'Partner',
        reason: `Mentor Flagged: ${c.reason}`,
        severity: c.severity === 'CRITICAL' || c.severity === 'HIGH' ? 'critical' : 'warning',
        timestamp: c.requestedAt.toISOString(),
      });
    }

    // 2. Overdue Milestones
    for (const task of overdueTasks.slice(0, 5)) {
      attentionCases.push({
        id: `att-task-${task.id}`,
        internshipId: task.instanceId,
        studentId: 'candidate',
        studentName: 'Candidate',
        companyName: 'Host Partner',
        reason: `Overdue Milestone: '${task.title}' past due date`,
        severity: 'warning',
        timestamp: task.currentDueDate,
      });
    }

    return {
      assignedInternships: assigned.map((d) => this.mapInternshipDetailToDto(d)),
      activeInternshipsCount: activeCount,
      overdueTasks,
      pendingReviews,
      attentionCases,
      recentActivity: [
        {
          id: 'act-1',
          action: 'STATUS_SYNC',
          description: 'Department supervisor records updated',
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  async getHODWorkspace(organizationId: string, hodId: string): Promise<HODWorkspaceDto> {
    const hodUser = authStore.users.get(hodId);
    if (!hodUser || hodUser.organizationId !== organizationId) {
      throw new TenantViolationError('HOD not found in organization context');
    }

    const deptId = hodUser.departmentId;
    const departmentInternships = Array.from(internshipStore.details.values()).filter(
      (d) => d.organizationId === organizationId && (!deptId || this.isStudentInDept(d.studentId, deptId))
    );

    // Faculty Assignments Loading Matrix
    const deptFaculty = Array.from(authStore.users.values()).filter(
      (u) => u.organizationId === organizationId && u.role === UserRole.FACULTY && (!deptId || u.departmentId === deptId)
    );

    const facultyAssignments = deptFaculty.map((f) => {
      const assigned = departmentInternships.filter((d) => d.facultyId === f.id);
      return {
        facultyId: f.id,
        facultyName: `${f.firstName} ${f.lastName}`.trim(),
        assignedCount: assigned.length,
        activeCount: assigned.filter((d) => d.status === InternshipStatus.ACTIVE).length,
      };
    });

    const now = Date.now();
    const overdueCount = Array.from(workflowStore.tasks.values()).filter(
      (t) => t.organizationId === organizationId && t.status === TaskStatus.PENDING && new Date(t.currentDueDate).getTime() < now
    ).length;

    // Attention Cases for HOD
    const attentionCases: AttentionCaseDto[] = [];
    const openConcerns = Array.from(workspaceStore.concerns.values()).filter(
      (c) => c.organizationId === organizationId && c.status === 'OPEN'
    );
    for (const c of openConcerns) {
      const intern = internshipStore.details.get(c.internshipId);
      attentionCases.push({
        id: `hod-att-${c.id}`,
        internshipId: c.internshipId,
        studentId: intern?.studentId || 'unknown',
        studentName: 'Student Candidate',
        companyName: intern?.companyId || 'Partner',
        reason: `Mentor Flag: ${c.reason}`,
        severity: c.severity === 'CRITICAL' ? 'critical' : 'warning',
        timestamp: c.requestedAt.toISOString(),
      });
    }

    return {
      departmentInternships: departmentInternships.map((d) => this.mapInternshipDetailToDto(d)),
      facultyAssignments,
      departmentMonitoring: {
        totalStudents: departmentInternships.length,
        totalInternships: departmentInternships.length,
        active: departmentInternships.filter((d) => d.status === InternshipStatus.ACTIVE).length,
        pendingApproval: departmentInternships.filter((d) => d.status === InternshipStatus.PENDING_APPROVAL).length,
        completed: departmentInternships.filter((d) => d.status === InternshipStatus.COMPLETED).length,
        overdueCount,
      },
      attentionCases,
    };
  }

  async getMentorWorkspace(organizationId: string, mentorId: string): Promise<MentorWorkspaceDto> {
    const mentorUser = authStore.users.get(mentorId);

    // Internships assigned to this mentor
    let assigned = Array.from(internshipStore.details.values()).filter(
      (d) =>
        d.organizationId === organizationId &&
        (d.mentorId === mentorId || (mentorUser && d.mentor?.email === mentorUser.email))
    );

    if (assigned.length === 0) {
      // Fallback for demonstration
      assigned = Array.from(internshipStore.details.values()).filter((d) => d.organizationId === organizationId);
    }

    const assignedIds = new Set(assigned.map((d) => d.id));

    const assignedStudents = assigned.map((d) => {
      const student = authStore.users.get(d.studentId);
      return {
        studentId: d.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}`.trim() : 'Candidate',
        studentEmail: student?.email || 'student@domain.edu',
        internshipId: d.id,
        title: d.title,
        status: d.status,
      };
    });

    const pendingReviews = Array.from(workspaceStore.submissions.values())
      .filter((s) => s.organizationId === organizationId && s.status === SubmissionStatus.SUBMITTED && assignedIds.has(s.internshipId))
      .map((s) => this.mapSubmissionToDto(s));

    const recentSubmissions = Array.from(workspaceStore.submissions.values())
      .filter((s) => s.organizationId === organizationId && assignedIds.has(s.internshipId))
      .map((s) => this.mapSubmissionToDto(s));

    const activeConcerns = Array.from(workspaceStore.concerns.values())
      .filter((c) => c.organizationId === organizationId && (c.mentorId === mentorId || assignedIds.has(c.internshipId)))
      .map((c) => this.mapConcernToDto(c));

    return {
      assignedStudents,
      assignedInternships: assigned.map((d) => this.mapInternshipDetailToDto(d)),
      pendingReviews,
      recentSubmissions,
      activeConcerns,
    };
  }

  // ==========================================
  // Private Helpers & Mappers
  // ==========================================

  private isStudentInDept(studentId: string, deptId: string): boolean {
    const u = authStore.users.get(studentId);
    return u?.departmentId === deptId;
  }

  private mapSubmissionToDto(s: InMemorySubmission): SubmissionDto {
    const reviews = Array.from(workspaceStore.reviews.values())
      .filter((r) => r.submissionId === s.id)
      .map((r) => this.mapReviewToDto(r));

    const student = authStore.users.get(s.studentId);
    const currentVersion = s.currentVersion || 1;
    const isLate = !!s.isLate;

    const versionSnapshot: SubmissionVersionDto = {
      id: `ver-${s.id}-v${currentVersion}`,
      version: currentVersion,
      submissionId: s.id,
      studentId: s.studentId,
      internshipId: s.internshipId,
      taskId: s.taskId,
      title: s.title,
      content: s.content,
      documentUrl: s.documentUrl,
      evidenceUrls: s.evidenceUrls || (s.documentUrl ? [s.documentUrl] : []),
      files: s.files || [],
      submittedAt: s.submittedAt.toISOString(),
      dueAt: s.dueAt?.toISOString(),
      isLate,
      revisionReason: s.revisionReason,
      status: s.status,
      review: reviews[0],
    };

    return {
      id: s.id,
      organizationId: s.organizationId,
      internshipId: s.internshipId,
      taskId: s.taskId,
      studentId: s.studentId,
      studentName: student ? `${student.firstName} ${student.lastName}`.trim() : 'Student',
      currentVersion,
      title: s.title,
      content: s.content,
      documentUrl: s.documentUrl,
      evidenceUrls: s.evidenceUrls || (s.documentUrl ? [s.documentUrl] : []),
      files: s.files || [],
      status: s.status,
      submittedAt: s.submittedAt.toISOString(),
      dueAt: s.dueAt?.toISOString(),
      isLate,
      revisionReason: s.revisionReason,
      updatedAt: s.updatedAt.toISOString(),
      reviews,
      versions: [versionSnapshot],
    };
  }

  private mapReviewToDto(r: InMemoryReview): ReviewDto {
    return {
      id: r.id,
      organizationId: r.organizationId,
      submissionId: r.submissionId,
      version: r.version || 1,
      reviewerId: r.reviewerId,
      reviewerName: r.reviewerName,
      reviewerRole: r.reviewerRole,
      feedback: r.feedback,
      score: r.score,
      criteria: r.criteria || [],
      status: r.status,
      revisionReason: r.revisionReason,
      createdAt: r.createdAt.toISOString(),
    };
  }

  private mapConcernToDto(c: InMemoryMentorConcern): MentorConcernDto {
    return {
      id: c.id,
      organizationId: c.organizationId,
      internshipId: c.internshipId,
      mentorId: c.mentorId,
      mentorName: c.mentorName,
      reason: c.reason,
      severity: c.severity,
      status: c.status,
      requestedAt: c.requestedAt.toISOString(),
    };
  }

  private mapTaskToDto(t: any) {
    return {
      id: t.id,
      instanceId: t.instanceId,
      organizationId: t.organizationId,
      stepId: t.stepId,
      title: t.title,
      stage: t.stage,
      type: t.type,
      status: t.status,
      assigneeRole: t.assigneeRole,
      required: t.required,
      originalDueDate: t.originalDueDate instanceof Date ? t.originalDueDate.toISOString() : t.originalDueDate,
      currentDueDate: t.currentDueDate instanceof Date ? t.currentDueDate.toISOString() : t.currentDueDate,
      isLate: t.isLate,
      completedAt: t.completedAt ? (t.completedAt instanceof Date ? t.completedAt.toISOString() : t.completedAt) : null,
      evaluationCriteria: t.evaluationCriteria,
      maxMarks: t.maxMarks,
      latePolicy: t.latePolicy,
      extensions: t.extensions || [],
      createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
      updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
    };
  }

  public mapInternshipDetailToDto(d: any) {
    const comp = internshipStore.companies.get(d.companyId) || {
      id: d.companyId,
      organizationId: d.organizationId,
      name: 'Host Organization',
      industry: 'Technology',
      website: undefined,
      address: undefined,
      isVerified: false,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };

    return {
      id: d.id,
      organizationId: d.organizationId,
      studentId: d.studentId,
      studentName: 'Student Candidate',
      companyId: d.companyId,
      company: {
        id: comp.id,
        organizationId: comp.organizationId,
        name: comp.name,
        industry: comp.industry,
        website: comp.website,
        address: comp.address,
        isVerified: comp.isVerified,
        createdAt: comp.createdAt instanceof Date ? comp.createdAt.toISOString() : comp.createdAt,
        updatedAt: comp.updatedAt instanceof Date ? comp.updatedAt.toISOString() : comp.updatedAt,
      },
      title: d.title,
      role: d.role,
      type: d.type,
      status: d.status,
      startDate: d.startDate instanceof Date ? d.startDate.toISOString() : d.startDate,
      endDate: d.endDate instanceof Date ? d.endDate.toISOString() : d.endDate,
      description: d.description,
      rejectionReason: d.rejectionReason,
      facultyId: d.facultyId,
      facultyName: d.facultyName,
      mentorId: d.mentorId,
      mentor: d.mentor,
      expectedOutcomes: d.expectedOutcomes,
      outcomeVersion: d.outcomeVersion,
      workflowInstanceId: d.workflowInstanceId,
      stateHistory: d.stateHistory,
      createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt,
      updatedAt: d.updatedAt instanceof Date ? d.updatedAt.toISOString() : d.updatedAt,
    };
  }
}

export const workspaceService = new WorkspaceService();
