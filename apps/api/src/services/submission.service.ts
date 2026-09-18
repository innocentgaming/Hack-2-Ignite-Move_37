import {
  SubmissionDto,
  CreateSubmissionDto,
  ReviewDto,
  CreateReviewDto,
  SubmissionFileDto,
  ReviewCriteriaScore,
  SubmissionVersionDto,
  SubmissionTimelineEventDto,
  SubmissionStatus,
  TaskStatus,
  UserRole,
  AuthenticatedUser,
  AuditAction,
  WorkflowStepType,
  AISubmissionAnalysisResponse,
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
import { storageService } from './storage.service.js';
import { aiService } from './ai.service.js';
import { aiAnalysisService } from './ai/ai-analysis.service.js';
import { notificationService } from './notification.service.js';
import { workspaceStore, InMemorySubmission, InMemoryReview } from './workspace.service.js';

export interface InMemorySubmissionFile {
  id: string;
  organizationId: string;
  studentId: string;
  internshipId?: string;
  taskId?: string;
  submissionId?: string;
  version?: number;
  originalName: string;
  size: number;
  mimeType: string;
  storageKey: string;
  isPublic: boolean;
  uploadedAt: Date;
}

export interface InMemorySubmissionVersion {
  id: string;
  organizationId: string;
  submissionId: string;
  version: number;
  studentId: string;
  internshipId: string;
  taskId: string;
  title: string;
  content: string;
  documentUrl?: string;
  evidenceUrls: string[];
  files: SubmissionFileDto[];
  submittedAt: Date;
  dueAt?: Date;
  isLate: boolean;
  revisionReason?: string;
  status: SubmissionStatus;
  aiAnalysis?: AISubmissionAnalysisResponse | null;
  aiAnalysisStatus?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
}

export class SubmissionStore {
  public files: Map<string, InMemorySubmissionFile> = new Map();
  public versions: Map<string, InMemorySubmissionVersion[]> = new Map(); // submissionId -> versions array
}

export const submissionStore = new SubmissionStore();

export class SubmissionService {
  // ==========================================
  // File Upload & Private File Security
  // ==========================================

  async uploadFile(
    organizationId: string,
    uploader: AuthenticatedUser,
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    options?: {
      internshipId?: string;
      taskId?: string;
      submissionId?: string;
      isPublic?: boolean;
    }
  ): Promise<SubmissionFileDto> {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new ValidationError('File content cannot be empty');
    }
    if (!filename || !filename.trim()) {
      throw new ValidationError('Filename is required');
    }

    // Securely upload through storage abstraction
    const uploadResult = await storageService.uploadFile(
      fileBuffer,
      filename.trim(),
      mimeType || 'application/octet-stream',
      organizationId
    );

    const fileId = `file-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const memFile: InMemorySubmissionFile = {
      id: fileId,
      organizationId,
      studentId: uploader.id,
      internshipId: options?.internshipId,
      taskId: options?.taskId,
      submissionId: options?.submissionId,
      originalName: filename.trim(),
      size: uploadResult.size,
      mimeType: uploadResult.mimeType,
      storageKey: uploadResult.key,
      isPublic: !!options?.isPublic, // Private by default
      uploadedAt: now,
    };

    submissionStore.files.set(fileId, memFile);

    auditService.log({
      organizationId,
      userId: uploader.id,
      action: AuditAction.SUBMISSION_FILE_UPLOAD,
      entity: 'SubmissionFile',
      entityId: fileId,
      details: {
        filename: memFile.originalName,
        size: memFile.size,
        mimeType: memFile.mimeType,
        isPublic: memFile.isPublic,
      },
    });

    return this.mapFileToDto(memFile);
  }

  async getFileForDownload(
    organizationId: string,
    caller: AuthenticatedUser,
    fileId: string
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const memFile = submissionStore.files.get(fileId);
    if (!memFile) {
      throw new NotFoundError('SubmissionFile', fileId);
    }

    // Strict Tenant Isolation
    if (memFile.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant file access prohibited');
    }

    // File Authorization Check (Private by default)
    if (!memFile.isPublic) {
      const role = normalizeRole(caller.role);

      // Admin has tenant-wide access
      if (role !== UserRole.ADMIN) {
        // If caller is the uploader, allow
        const isOwner = memFile.studentId === caller.id;

        // If file is linked to an internship, check faculty or mentor assignment
        let isAuthorizedSupervisor = false;
        if (memFile.internshipId) {
          const internship = internshipStore.details.get(memFile.internshipId);
          if (internship) {
            if (role === UserRole.MENTOR && (internship.mentorId === caller.id || internship.mentor?.email === caller.email || (internship as any).industryMentorId === caller.id)) {
              isAuthorizedSupervisor = true;
            }
          }
        }

        // If not owner and not authorized supervisor/HOD, strictly forbid access
        if (!isOwner && !isAuthorizedSupervisor) {
          throw new ForbiddenError('Unauthorized to access private submission file');
        }
      }
    }

    const buffer = await storageService.getFile(memFile.storageKey);
    return {
      buffer,
      mimeType: memFile.mimeType,
      filename: memFile.originalName,
    };
  }

  // ==========================================
  // Versioned Submissions Engine
  // ==========================================

  async createOrReviseSubmission(
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
      throw new ValidationError('Submission content / report body is required');
    }

    const now = new Date();

    // Check if task exists and compute deadline / late status
    let dueAt: Date | undefined = undefined;
    let isLate = false;
    let taskTitle = dto.title.trim();
    let taskType: WorkflowStepType = WorkflowStepType.SUBMISSION;

    if (dto.taskId) {
      const task = workflowStore.tasks.get(dto.taskId);
      if (task) {
        dueAt = new Date(task.currentDueDate);
        isLate = now.getTime() > dueAt.getTime();
        taskTitle = task.title;
        taskType = task.type;
      }
    }

    // Resolve attached files
    const attachedFiles: SubmissionFileDto[] = [];
    if (Array.isArray(dto.files) && dto.files.length > 0) {
      attachedFiles.push(...dto.files);
    }
    if (Array.isArray(dto.fileIds) && dto.fileIds.length > 0) {
      for (const fid of dto.fileIds) {
        const f = submissionStore.files.get(fid);
        if (f && f.organizationId === organizationId) {
          attachedFiles.push(this.mapFileToDto(f));
        }
      }
    }

    const documentUrl = (dto.documentUrl || ((dto as any).evidenceUrls && (dto as any).evidenceUrls[0]) || (dto as any).evidenceUrl || '').toString().trim() || undefined;
    const evidenceUrls: string[] = [];
    if (documentUrl) {
      evidenceUrls.push(documentUrl);
    }
    if (Array.isArray(dto.evidenceUrls)) {
      for (const u of dto.evidenceUrls) {
        if (u && !evidenceUrls.includes(u)) {
          evidenceUrls.push(u);
        }
      }
    }

    // Check if there is an existing submission for this task
    let existingSubmission: InMemorySubmission | undefined = undefined;
    for (const sub of workspaceStore.submissions.values()) {
      if (
        sub.organizationId === organizationId &&
        sub.internshipId === dto.internshipId &&
        Boolean(dto.taskId) &&
        sub.taskId === dto.taskId
      ) {
        existingSubmission = sub;
        break;
      }
    }

    let submissionId: string;
    let versionNumber = 1;
    let isRevision = false;
    let revisionReason: string | undefined = undefined;

    if (existingSubmission) {
      // If submission exists, check status
      if (
        existingSubmission.status !== SubmissionStatus.REVISION_NEEDED &&
        (existingSubmission as any).status !== 'CHANGES_REQUESTED' &&
        !dto.isRevision
      ) {
        throw new ValidationError(
          'A submission already exists for this task and is awaiting review or has been approved'
        );
      }

      // This is a Revision (New Version)!
      isRevision = true;
      submissionId = existingSubmission.id;
      const currentVer = (existingSubmission as any).currentVersion || 1;
      versionNumber = currentVer + 1;
      revisionReason = existingSubmission.revisionReason || dto.revisionReason;

      // Update the active submission record
      (existingSubmission as any).currentVersion = versionNumber;
      existingSubmission.title = dto.title.trim();
      existingSubmission.content = content;
      existingSubmission.documentUrl = documentUrl;
      (existingSubmission as any).evidenceUrls = evidenceUrls;
      (existingSubmission as any).files = attachedFiles;
      (existingSubmission as any).isLate = isLate;
      (existingSubmission as any).dueAt = dueAt;
      existingSubmission.status = SubmissionStatus.SUBMITTED;
      existingSubmission.submittedAt = now;
      existingSubmission.updatedAt = now;
    } else {
      // Version 1 Creation
      submissionId = `sub-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      versionNumber = 1;

      const newSubmission: InMemorySubmission = {
        id: submissionId,
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

      (newSubmission as any).currentVersion = 1;
      (newSubmission as any).files = attachedFiles;
      (newSubmission as any).evidenceUrls = evidenceUrls;
      (newSubmission as any).isLate = isLate;
      (newSubmission as any).dueAt = dueAt;

      workspaceStore.submissions.set(submissionId, newSubmission);
      existingSubmission = newSubmission;
    }

    // Create IMMUTABLE Version Record (Never overwrite previous versions!)
    const versionRecord: InMemorySubmissionVersion = {
      id: `ver-${submissionId}-v${versionNumber}`,
      organizationId,
      submissionId,
      version: versionNumber,
      studentId: studentUser.id,
      internshipId: dto.internshipId,
      taskId: dto.taskId,
      title: dto.title.trim(),
      content,
      documentUrl,
      evidenceUrls,
      files: [...attachedFiles],
      submittedAt: now,
      dueAt,
      isLate,
      revisionReason,
      status: SubmissionStatus.SUBMITTED,
      aiAnalysisStatus: 'PENDING',
    };

    const existingVersions = submissionStore.versions.get(submissionId) || [];
    existingVersions.push(versionRecord);
    submissionStore.versions.set(submissionId, existingVersions);

    // Update workflow task state
    if (dto.taskId) {
      const task = workflowStore.tasks.get(dto.taskId);
      if (task) {
        task.status = TaskStatus.SUBMITTED;
        task.completedAt = now;
        task.isLate = isLate;
        task.updatedAt = now;
      }
    }

    // Audit Log
    auditService.log({
      organizationId,
      userId: studentUser.id,
      action: isRevision ? AuditAction.SUBMISSION_REVISION : AuditAction.SUBMISSION_CREATE,
      entity: 'Submission',
      entityId: submissionId,
      details: {
        internshipId: dto.internshipId,
        taskId: dto.taskId,
        version: versionNumber,
        isRevision,
        isLate,
      },
    });

    // ==========================================
    // AI Resilience: Asynchronous & Non-blocking
    // AI must never fail or block the submission transaction!
    // ==========================================
    this.runResilientAIAnalysis(versionRecord);

    return this.mapSubmissionToDto(existingSubmission);
  }

  // Resilient non-blocking AI submission analysis
  private async runResilientAIAnalysis(versionRecord: InMemorySubmissionVersion): Promise<void> {
    try {
      await aiAnalysisService.analyzeSubmission(versionRecord.organizationId, versionRecord);
    } catch {
      // Resilient: ignore error, mark as FAILED without throwing or failing submission
      versionRecord.aiAnalysisStatus = 'FAILED';
    }
  }

  // ==========================================
  // Mentor Review & Structured Criteria
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
    if (![UserRole.ADMIN, UserRole.MENTOR].includes(reviewerRole)) {
      throw new ForbiddenError('Only assigned mentors and administrators can submit reviews');
    }

    const feedback = (dto.feedback || (dto as any).overallFeedback || '').trim();
    if (!feedback) {
      throw new ValidationError('Review feedback / comments are required');
    }

    const isRevision = !!(dto.requestRevision || (dto as any).isRevisionRequested);
    const revisionReason = (dto.revisionReason || feedback).trim();

    if (isRevision && !revisionReason) {
      throw new ValidationError('A clear revision reason is required when requesting changes');
    }

    const revId = `rev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const currentVer = (sub as any).currentVersion || 1;

    const review: InMemoryReview = {
      id: revId,
      organizationId,
      submissionId: dto.submissionId,
      reviewerId: reviewerUser.id,
      reviewerName: `${reviewerUser.firstName} ${reviewerUser.lastName}`.trim() || 'Supervisor',
      reviewerRole,
      feedback,
      score: dto.score,
      status: isRevision ? 'CHANGES_REQUESTED' : 'ACCEPTED',
      createdAt: now,
    };

    (review as any).version = currentVer;
    (review as any).criteria = dto.criteria || [];
    (review as any).revisionReason = isRevision ? revisionReason : undefined;

    workspaceStore.reviews.set(revId, review);

    // Update Submission Status & record revision reason
    sub.status = isRevision ? SubmissionStatus.REVISION_NEEDED : SubmissionStatus.ACCEPTED;
    (sub as any).revisionReason = isRevision ? revisionReason : undefined;
    sub.updatedAt = now;

    // Link review with the corresponding immutable version record
    const versions = submissionStore.versions.get(dto.submissionId) || [];
    const targetVersion = versions.find((v) => v.version === currentVer);
    if (targetVersion) {
      targetVersion.status = sub.status;
      targetVersion.revisionReason = isRevision ? revisionReason : undefined;
    }

    // Update Task Status if linked
    if (sub.taskId) {
      const task = workflowStore.tasks.get(sub.taskId);
      if (task) {
        task.status = isRevision ? TaskStatus.CHANGES_REQUESTED : TaskStatus.APPROVED;
        if (!isRevision) {
          task.completedAt = now;
        }
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
        version: currentVer,
        score: dto.score,
        status: review.status,
        isRevision,
        revisionReason: isRevision ? revisionReason : undefined,
      },
    });

    if (isRevision) {
      notificationService.notifyRevisionRequested({
        organizationId,
        submissionId: dto.submissionId,
        studentId: sub.studentId,
        taskTitle: sub.title,
        notes: revisionReason,
      }).catch(() => {});
    } else {
      notificationService.notifyReviewCompleted({
        organizationId,
        submissionId: dto.submissionId,
        studentId: sub.studentId,
        taskTitle: sub.title,
        status: review.status,
      }).catch(() => {});
    }

    return this.mapReviewToDto(review);
  }

  // ==========================================
  // Submission Queries & Timelines
  // ==========================================

  async getSubmissions(
    organizationId: string,
    user: AuthenticatedUser,
    filters?: { internshipId?: string; taskId?: string; status?: SubmissionStatus }
  ): Promise<SubmissionDto[]> {
    let list = Array.from(workspaceStore.submissions.values()).filter(
      (s) => s.organizationId === organizationId
    );

    const role = normalizeRole(user.role);
    if (role === UserRole.STUDENT) {
      list = list.filter((s) => s.studentId === user.id);
    } else if (role === UserRole.MENTOR) {
      const menteeInternshipIds = new Set(
        Array.from(internshipStore.details.values())
          .filter((d) => (d as any).industryMentorId === user.id || (d as any).mentorId === user.id || d.mentor?.email === user.email)
          .map((d) => d.id)
      );
      if (menteeInternshipIds.size > 0) {
        list = list.filter((s) => menteeInternshipIds.has(s.internshipId));
      }
    }

    if (filters?.internshipId) {
      list = list.filter((s) => s.internshipId === filters.internshipId);
    }
    if (filters?.taskId) {
      list = list.filter((s) => s.taskId === filters.taskId);
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

  async getSubmissionTimeline(
    organizationId: string,
    submissionId: string
  ): Promise<SubmissionTimelineEventDto[]> {
    const sub = await this.getSubmissionById(organizationId, submissionId);
    const events: SubmissionTimelineEventDto[] = [];

    // Add version submissions
    for (const v of sub.versions) {
      events.push({
        id: `event-${v.id}`,
        timestamp: v.submittedAt,
        type: v.version === 1 ? 'SUBMITTED' : 'REVISED',
        version: v.version,
        actorId: sub.studentId,
        actorName: sub.studentName || 'Student',
        actorRole: UserRole.STUDENT,
        title: v.version === 1 ? 'Initial Deliverable Submitted' : `Version ${v.version} Resubmitted`,
        description: v.title,
        data: {
          filesCount: v.files.length,
          isLate: v.isLate,
          revisionReason: v.revisionReason,
        },
      });
    }

    // Add reviews
    for (const r of sub.reviews) {
      const isReq = r.status === 'CHANGES_REQUESTED';
      events.push({
        id: `event-${r.id}`,
        timestamp: r.createdAt,
        type: isReq ? 'REVISION_REQUESTED' : 'APPROVED',
        version: r.version || 1,
        actorId: r.reviewerId,
        actorName: r.reviewerName,
        actorRole: r.reviewerRole,
        title: isReq ? 'Revision Requested by Mentor' : 'Deliverable Approved by Mentor',
        description: r.feedback,
        data: {
          score: r.score,
          criteria: r.criteria,
          revisionReason: r.revisionReason,
        },
      });
    }

    // Sort chronologically ascending
    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // ==========================================
  // Helper Mappers
  // ==========================================

  private mapFileToDto(f: InMemorySubmissionFile): SubmissionFileDto {
    return {
      id: f.id,
      name: f.originalName,
      originalName: f.originalName,
      size: f.size,
      mimeType: f.mimeType,
      storageKey: f.storageKey,
      url: `/api/v1/submissions/files/${f.id}`,
      uploadedAt: f.uploadedAt.toISOString(),
    };
  }

  public mapSubmissionToDto(s: InMemorySubmission): SubmissionDto {
    const reviews = Array.from(workspaceStore.reviews.values())
      .filter((r) => r.submissionId === s.id)
      .map((r) => this.mapReviewToDto(r));

    const student = authStore.users.get(s.studentId);
    const currentVer = (s as any).currentVersion || 1;

    // Load versions
    const rawVersions = submissionStore.versions.get(s.id) || [];
    let mappedVersions: SubmissionVersionDto[] = rawVersions.map((v) => {
      const vReview = reviews.find((r) => r.version === v.version);
      return {
        id: v.id,
        version: v.version,
        submissionId: v.submissionId,
        studentId: v.studentId,
        internshipId: v.internshipId,
        taskId: v.taskId,
        title: v.title,
        content: v.content,
        documentUrl: v.documentUrl,
        evidenceUrls: v.evidenceUrls,
        files: v.files || [],
        submittedAt: v.submittedAt.toISOString(),
        dueAt: v.dueAt?.toISOString(),
        isLate: v.isLate,
        revisionReason: v.revisionReason,
        status: v.status,
        review: vReview,
        aiAnalysis: v.aiAnalysis,
        aiAnalysisStatus: v.aiAnalysisStatus,
      };
    });

    // If no explicit versions in submissionStore, fallback to single version
    if (mappedVersions.length === 0) {
      mappedVersions = [
        {
          id: `ver-${s.id}-v1`,
          version: 1,
          submissionId: s.id,
          studentId: s.studentId,
          internshipId: s.internshipId,
          taskId: s.taskId,
          title: s.title,
          content: s.content,
          documentUrl: s.documentUrl,
          evidenceUrls: s.documentUrl ? [s.documentUrl] : [],
          files: (s as any).files || [],
          submittedAt: s.submittedAt.toISOString(),
          isLate: !!(s as any).isLate,
          status: s.status,
          review: reviews[0],
        },
      ];
    }

    let taskTitle: string | undefined = undefined;
    let taskType: WorkflowStepType | undefined = undefined;
    if (s.taskId) {
      const task = workflowStore.tasks.get(s.taskId);
      if (task) {
        taskTitle = task.title;
        taskType = task.type;
      }
    }

    return {
      id: s.id,
      organizationId: s.organizationId,
      internshipId: s.internshipId,
      taskId: s.taskId,
      taskTitle,
      taskType,
      studentId: s.studentId,
      studentName: student ? `${student.firstName} ${student.lastName}`.trim() : 'Student',
      currentVersion: currentVer,
      title: s.title,
      content: s.content,
      documentUrl: s.documentUrl,
      evidenceUrls: (s as any).evidenceUrls || (s.documentUrl ? [s.documentUrl] : []),
      files: (s as any).files || [],
      status: s.status,
      submittedAt: s.submittedAt.toISOString(),
      dueAt: (s as any).dueAt?.toISOString(),
      isLate: !!(s as any).isLate,
      revisionReason: (s as any).revisionReason,
      updatedAt: s.updatedAt.toISOString(),
      reviews,
      versions: mappedVersions,
    };
  }

  public mapReviewToDto(r: InMemoryReview): ReviewDto {
    return {
      id: r.id,
      organizationId: r.organizationId,
      submissionId: r.submissionId,
      version: (r as any).version || 1,
      reviewerId: r.reviewerId,
      reviewerName: r.reviewerName,
      reviewerRole: r.reviewerRole,
      feedback: r.feedback,
      score: r.score,
      criteria: (r as any).criteria || [],
      status: r.status,
      revisionReason: (r as any).revisionReason,
      createdAt: r.createdAt.toISOString(),
    };
  }
}

export const submissionService = new SubmissionService();
