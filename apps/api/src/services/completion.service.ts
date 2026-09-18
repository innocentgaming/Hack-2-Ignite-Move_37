import {
  FinalEvaluationDto,
  CreateFinalEvaluationDto,
  UpdateFinalEvaluationDto,
  CompletionChecklistDto,
  CompletedInternshipDossierDto,
  TerminationDecisionDto,
  SubmissionFileDto,
  InternshipStatus,
  TaskStatus,
  SubmissionStatus,
  UserRole,
  WorkflowStepType,
  AuthenticatedUser,
  AuditAction,
} from '@internos/types';
import {
  NotFoundError,
  TenantViolationError,
  BadRequestError,
  ForbiddenError,
  normalizeRole,
} from '@internos/shared';
import { internshipStore } from './internship.service.js';
import { workflowStore } from './workflow.service.js';
import { workspaceStore, workspaceService, InMemoryMentorConcern } from './workspace.service.js';
import { submissionStore } from './submission.service.js';
import { authStore } from './auth.service.js';
import { auditService } from './audit.service.js';
import { internshipStateMachine } from './internship-state-machine.service.js';
import { monitoringService } from './monitoring.service.js';
import { notificationService } from './notification.service.js';

export interface InMemoryTerminationRequest {
  id: string;
  organizationId: string;
  internshipId: string;
  mentorId: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: Date;
  decidedAt?: Date;
  decidedBy?: string;
  decisionReason?: string;
}

export interface CompletionConfirmationDto {
  id: string;
  organizationId: string;
  internshipId: string;
  confirmedById: string;
  confirmedByName: string;
  notes: string;
  academicRecommendation?: string;
  creditsAwarded?: number;
  confirmedAt: string;
}

export interface CreateCompletionConfirmationDto {
  internshipId: string;
  notes?: string;
  facultyNotes?: string;
  academicRecommendation?: string;
  creditsAwarded?: number;
}

export class CompletionStore {
  public finalEvaluations: Map<string, FinalEvaluationDto> = new Map(); // internshipId -> FinalEvaluationDto
  public evaluationsById: Map<string, FinalEvaluationDto> = new Map(); // id -> FinalEvaluationDto
  public confirmations: Map<string, CompletionConfirmationDto> = new Map(); // internshipId -> CompletionConfirmationDto
  public terminationRequests: Map<string, InMemoryTerminationRequest> = new Map(); // id -> InMemoryTerminationRequest
}

export const completionStore = new CompletionStore();

export class CompletionService {
  /**
   * Helper to calculate letter grade from percentage
   */
  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    return 'F';
  }

  /**
   * Verify all 4 completion prerequisites and return exact missing reasons
   */
  verifyPrerequisites(organizationId: string, internshipId: string): CompletionChecklistDto {
    const detail = internshipStore.details.get(internshipId);
    if (!detail) {
      throw new NotFoundError('Internship', internshipId);
    }
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant completion inspection prohibited');
    }

    const missingConditions: string[] = [];

    // 1. Required Submissions Verification
    const tasks = Array.from(workflowStore.tasks.values()).filter(
      (t) => t.organizationId === organizationId && (t.instanceId === detail.workflowInstanceId || t.instanceId === detail.id)
    );

    const requiredTasks = tasks.filter(
      (t) => t.required && (t.type === WorkflowStepType.SUBMISSION || t.assigneeRole === UserRole.STUDENT)
    );
    let requiredTasksSubmittedCount = 0;

    for (const task of requiredTasks) {
      const submissions = Array.from(workspaceStore.submissions.values()).filter(
        (s) => s.organizationId === organizationId && s.taskId === task.id
      );

      const hasSubmission = submissions.length > 0 && submissions.some(
        (s) => s.status === SubmissionStatus.ACCEPTED || s.status === SubmissionStatus.SUBMITTED
      );

      if (hasSubmission) {
        requiredTasksSubmittedCount++;
      } else {
        missingConditions.push(`Required milestone submission missing: '${task.title}'`);
      }
    }

    const requiredSubmissionsCompleted =
      requiredTasks.length === 0 || requiredTasksSubmittedCount === requiredTasks.length;

    // 2. Required Reviews Verification
    let pendingReviewsCount = 0;
    for (const task of requiredTasks) {
      const submissions = Array.from(workspaceStore.submissions.values()).filter(
        (s) => s.organizationId === organizationId && s.taskId === task.id
      );

      for (const sub of submissions) {
        if (sub.status === SubmissionStatus.SUBMITTED) {
          pendingReviewsCount++;
          missingConditions.push(`Pending mentor review for milestone deliverable: '${sub.title}'`);
        } else if (sub.status === SubmissionStatus.REVISION_NEEDED) {
          pendingReviewsCount++;
          missingConditions.push(`Unresolved revision requested for deliverable: '${sub.title}'`);
        }
      }
    }

    const requiredReviewsCompleted = pendingReviewsCount === 0;

    // 3. Final Evaluation Verification
    const finalEvaluation = completionStore.finalEvaluations.get(internshipId);
    const finalEvaluationCompleted = !!finalEvaluation;
    if (!finalEvaluationCompleted) {
      missingConditions.push('Final mentor evaluation is not completed');
    }

    // 4. Admin Sign-off / Confirmation
    const adminApprovalCompleted = detail.status === InternshipStatus.COMPLETED;

    const eligible =
      requiredSubmissionsCompleted &&
      requiredReviewsCompleted &&
      finalEvaluationCompleted;

    return {
      eligible,
      missingConditions,
      checks: {
        requiredSubmissionsCompleted,
        requiredReviewsCompleted,
        finalEvaluationCompleted,
        adminApprovalCompleted,
      },
      details: {
        requiredTasksTotal: requiredTasks.length,
        requiredTasksSubmitted: requiredTasksSubmittedCount,
        pendingReviewsTotal: pendingReviewsCount,
        hasFinalEvaluation: finalEvaluationCompleted,
        hasAdminApproval: adminApprovalCompleted,
      },
    };
  }

  /**
   * Mentor submits final evaluation with structured criteria /100
   */
  async submitFinalEvaluation(
    organizationId: string,
    evaluator: AuthenticatedUser,
    dto: CreateFinalEvaluationDto
  ): Promise<FinalEvaluationDto> {
    const detail = internshipStore.details.get(dto.internshipId);
    if (!detail) {
      throw new NotFoundError('Internship', dto.internshipId);
    }
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant evaluation submission prohibited');
    }

    const role = normalizeRole(evaluator.role);
    if (![UserRole.MENTOR, UserRole.ADMIN].includes(role)) {
      throw new ForbiddenError('Only assigned mentor or institutional administrator can evaluate');
    }

    let criteria = dto.criteria;
    if ((!Array.isArray(criteria) || criteria.length === 0) && (dto as any).technicalSkillsScore !== undefined) {
      criteria = [
        { id: 'crit-tech', name: 'Technical Skills', maxMarks: 30, awardedMarks: Number((dto as any).technicalSkillsScore) || 25, comment: 'Good execution' },
        { id: 'crit-qual', name: 'Work Quality', maxMarks: 30, awardedMarks: Number((dto as any).workQualityScore) || 25, comment: 'Good quality' },
        { id: 'crit-init', name: 'Initiative', maxMarks: 20, awardedMarks: Number((dto as any).initiativeScore) || 18, comment: 'Proactive' },
        { id: 'crit-prof', name: 'Professionalism', maxMarks: 20, awardedMarks: Number((dto as any).professionalismScore) || 18, comment: 'Professional' },
      ];
    }

    if (!Array.isArray(criteria) || criteria.length === 0) {
      throw new BadRequestError('Evaluation must include criteria scoring');
    }

    // Calculate marks and percentage
    let totalMarks = 0;
    let maxMarks = 0;

    for (const c of criteria) {
      if (typeof c.awardedMarks !== 'number' || c.awardedMarks < 0) {
        throw new BadRequestError(`Invalid marks for criterion '${c.name}': must be non-negative`);
      }
      if (c.awardedMarks > c.maxMarks) {
        throw new BadRequestError(`Awarded marks (${c.awardedMarks}) cannot exceed max marks (${c.maxMarks}) for '${c.name}'`);
      }
      totalMarks += c.awardedMarks;
      maxMarks += c.maxMarks;
    }

    const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
    const finalGrade = this.calculateGrade(percentage);

    const id = `feval-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const evaluation: FinalEvaluationDto = {
      id,
      organizationId,
      internshipId: dto.internshipId,
      evaluatorId: evaluator.id,
      evaluatorName: `${evaluator.firstName} ${evaluator.lastName}`.trim() || 'Evaluator',
      evaluatorRole: role,
      criteria: criteria,
      totalMarks,
      maxMarks,
      percentage,
      finalGrade,
      comments: dto.comments || '',
      finalRemarks: dto.finalRemarks || '',
      submittedAt: now,
      updatedAt: now,
    };

    completionStore.finalEvaluations.set(dto.internshipId, evaluation);
    completionStore.evaluationsById.set(id, evaluation);

    // If internship is ACTIVE and tasks & reviews are complete, progress to READY_FOR_COMPLETION
    if (detail.status === InternshipStatus.ACTIVE) {
      const checklist = this.verifyPrerequisites(organizationId, dto.internshipId);
      if (checklist.checks.requiredSubmissionsCompleted && checklist.checks.requiredReviewsCompleted) {
        detail.status = InternshipStatus.READY_FOR_COMPLETION;
        detail.updatedAt = new Date();
        detail.stateHistory.push({
          fromStatus: InternshipStatus.ACTIVE,
          toStatus: InternshipStatus.READY_FOR_COMPLETION,
          changedBy: evaluator.id,
          changedAt: now,
          reason: 'Final mentor evaluation submitted with required milestones complete',
        });
      }
    }

    auditService.log({
      organizationId,
      userId: evaluator.id,
      action: AuditAction.FINAL_EVALUATION_CREATE,
      entity: 'FinalEvaluation',
      entityId: id,
      details: {
        internshipId: dto.internshipId,
        totalMarks,
        maxMarks,
        finalGrade,
        percentage,
      },
    });

    auditService.log({
      organizationId,
      userId: evaluator.id,
      action: 'EVALUATION',
      entity: 'FinalEvaluation',
      entityId: id,
      details: {
        internshipId: dto.internshipId,
        totalMarks,
        finalGrade,
      },
    });

    notificationService.notifyEvaluationCompleted({
      organizationId,
      internshipId: dto.internshipId,
      studentId: detail.studentId,
      totalScore: totalMarks,
      grade: finalGrade,
      facultyIds: detail.facultyId ? [detail.facultyId] : [],
    }).catch(() => {});

    return evaluation;
  }

  /**
   * Update / Edit existing final evaluation
   */
  async updateFinalEvaluation(
    organizationId: string,
    evaluator: AuthenticatedUser,
    evaluationId: string,
    dto: UpdateFinalEvaluationDto
  ): Promise<FinalEvaluationDto> {
    const evaluation = completionStore.evaluationsById.get(evaluationId);
    if (!evaluation) {
      throw new NotFoundError('FinalEvaluation', evaluationId);
    }
    if (evaluation.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant evaluation modification prohibited');
    }

    const role = normalizeRole(evaluator.role);
    if (evaluation.evaluatorId !== evaluator.id && role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only original evaluator or administrators can update this evaluation');
    }

    const detail = internshipStore.details.get(evaluation.internshipId);
    if (detail?.status === InternshipStatus.COMPLETED && role !== UserRole.ADMIN) {
      throw new BadRequestError('Cannot edit evaluation for an already COMPLETED internship');
    }

    if (dto.criteria && Array.isArray(dto.criteria) && dto.criteria.length > 0) {
      let totalMarks = 0;
      let maxMarks = 0;

      for (const c of dto.criteria) {
        if (typeof c.awardedMarks !== 'number' || c.awardedMarks < 0) {
          throw new BadRequestError(`Invalid marks for criterion '${c.name}'`);
        }
        if (c.awardedMarks > c.maxMarks) {
          throw new BadRequestError(`Awarded marks (${c.awardedMarks}) exceeds max marks (${c.maxMarks})`);
        }
        totalMarks += c.awardedMarks;
        maxMarks += c.maxMarks;
      }

      evaluation.criteria = dto.criteria;
      evaluation.totalMarks = totalMarks;
      evaluation.maxMarks = maxMarks;
      evaluation.percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
      evaluation.finalGrade = this.calculateGrade(evaluation.percentage);
    }

    if (dto.comments !== undefined) evaluation.comments = dto.comments;
    if (dto.finalRemarks !== undefined) evaluation.finalRemarks = dto.finalRemarks;

    evaluation.updatedAt = new Date().toISOString();

    auditService.log({
      organizationId,
      userId: evaluator.id,
      action: AuditAction.FINAL_EVALUATION_UPDATE,
      entity: 'FinalEvaluation',
      entityId: evaluationId,
      details: {
        internshipId: evaluation.internshipId,
        totalMarks: evaluation.totalMarks,
        finalGrade: evaluation.finalGrade,
      },
    });

    return evaluation;
  }

  /**
   * Get final evaluation for internship
   */
  async getFinalEvaluation(organizationId: string, internshipId: string): Promise<FinalEvaluationDto | null> {
    const detail = internshipStore.details.get(internshipId);
    if (!detail) throw new NotFoundError('Internship', internshipId);
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant evaluation query prohibited');
    }
    return completionStore.finalEvaluations.get(internshipId) || null;
  }

  /**
   * Institutional confirmation sign-off and transition to COMPLETED
   * BACKEND STRICT INVARIANT:
   * Required submissions + Required reviews + Final evaluation + Confirmation = COMPLETED
   */
  async confirmCompletionByFaculty(
    organizationId: string,
    approverUser: AuthenticatedUser,
    dto: CreateCompletionConfirmationDto
  ): Promise<InternshipStatus> {
    const detail = internshipStore.details.get(dto.internshipId);
    if (!detail) {
      throw new NotFoundError('Internship', dto.internshipId);
    }
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant completion confirmation prohibited');
    }

    const role = normalizeRole(approverUser.role);
    if (![UserRole.MENTOR, UserRole.ADMIN].includes(role)) {
      throw new ForbiddenError('Only assigned mentor or institutional Administrator can confirm completion');
    }

    const notes = (dto.notes || dto.facultyNotes || '').trim();
    if (!notes) {
      throw new BadRequestError('Completion confirmation notes are required');
    }

    // Verify conditions 1, 2, 3
    const checklist = this.verifyPrerequisites(organizationId, dto.internshipId);

    // Pre-requisites 1, 2, and 3 MUST pass
    const missingCore: string[] = [];
    if (!checklist.checks.requiredSubmissionsCompleted) {
      missingCore.push('Required milestone submissions incomplete');
    }
    if (!checklist.checks.requiredReviewsCompleted) {
      missingCore.push('Pending mentor reviews or unresolved revisions');
    }
    if (!checklist.checks.finalEvaluationCompleted) {
      missingCore.push('Final mentor evaluation has not been submitted');
    }

    if (missingCore.length > 0) {
      throw new BadRequestError(
        `Cannot complete internship. Missing prerequisite requirements: ${missingCore.join(', ')}`
      );
    }

    const now = new Date().toISOString();
    const confId = `conf-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const confirmation: CompletionConfirmationDto = {
      id: confId,
      organizationId,
      internshipId: dto.internshipId,
      confirmedById: approverUser.id,
      confirmedByName: `${approverUser.firstName} ${approverUser.lastName}`.trim() || 'Institutional Administrator',
      notes,
      academicRecommendation: dto.academicRecommendation || 'APPROVED_FOR_CREDITS',
      creditsAwarded: dto.creditsAwarded ?? 4,
      confirmedAt: now,
    };

    completionStore.confirmations.set(dto.internshipId, confirmation);

    // Transition state to COMPLETED
    const previousStatus = detail.status;
    detail.status = InternshipStatus.COMPLETED;
    detail.updatedAt = new Date();
    detail.stateHistory.push({
      fromStatus: previousStatus,
      toStatus: InternshipStatus.COMPLETED,
      changedBy: approverUser.id,
      changedAt: now,
      reason: `Institutional confirmation: ${notes}`,
    });

    auditService.log({
      organizationId,
      userId: approverUser.id,
      action: AuditAction.COMPLETION_CONFIRM,
      entity: 'Confirmation',
      entityId: confId,
      details: {
        internshipId: dto.internshipId,
        academicRecommendation: confirmation.academicRecommendation,
        creditsAwarded: confirmation.creditsAwarded,
      },
    });

    auditService.log({
      organizationId,
      userId: approverUser.id,
      action: AuditAction.INTERNSHIP_COMPLETE,
      entity: 'Internship',
      entityId: dto.internshipId,
      details: {
        completedBy: approverUser.id,
        status: InternshipStatus.COMPLETED,
      },
    });

    auditService.log({
      organizationId,
      userId: approverUser.id,
      action: 'COMPLETION',
      entity: 'Internship',
      entityId: dto.internshipId,
      details: {
        completedBy: approverUser.id,
        status: InternshipStatus.COMPLETED,
      },
    });

    notificationService.notifyCompletionConfirmed({
      organizationId,
      internshipId: dto.internshipId,
      studentId: detail.studentId,
      internshipTitle: detail.title,
    }).catch(() => {});

    return detail.status;
  }

  /**
   * Assemble complete student dossier for a completed internship
   */
  async getCompletedDossier(
    organizationId: string,
    user: AuthenticatedUser,
    internshipId: string
  ): Promise<CompletedInternshipDossierDto> {
    const detail = internshipStore.details.get(internshipId);
    if (!detail) {
      throw new NotFoundError('Internship', internshipId);
    }
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant dossier inspection prohibited');
    }

    const role = normalizeRole(user.role);
    if (role === UserRole.STUDENT && detail.studentId !== user.id) {
      throw new ForbiddenError('Students can only view their own completed dossier');
    }

    const finalEval = completionStore.finalEvaluations.get(internshipId);
    if (!finalEval) {
      throw new BadRequestError('Final evaluation record not found for this internship');
    }



    const student = authStore.users.get(detail.studentId);
    const company = internshipStore.companies.get(detail.companyId);

    // Collect all submission files
    const evidenceFiles: SubmissionFileDto[] = Array.from(submissionStore.files.values())
      .filter((f) => f.organizationId === organizationId && f.internshipId === internshipId)
      .map((f) => ({
        id: f.id,
        name: f.originalName,
        originalName: f.originalName,
        size: f.size,
        mimeType: f.mimeType,
        storageKey: f.storageKey,
        url: `/api/v1/submissions/files/${f.id}`,
        uploadedAt: f.uploadedAt.toISOString(),
      }));

    // Collect all milestone reviews
    const submissions = Array.from(workspaceStore.submissions.values()).filter(
      (s) => s.organizationId === organizationId && s.internshipId === internshipId
    );
    const milestoneFeedback = Array.from(workspaceStore.reviews.values())
      .filter((r) => r.organizationId === organizationId && submissions.some((s) => s.id === r.submissionId))
      .map((r) => ({
        id: r.id,
        organizationId: r.organizationId,
        submissionId: r.submissionId,
        version: r.version,
        reviewerId: r.reviewerId,
        reviewerName: r.reviewerName,
        reviewerRole: r.reviewerRole,
        feedback: r.feedback,
        score: r.score,
        criteria: r.criteria,
        status: r.status,
        revisionReason: r.revisionReason,
        createdAt: r.createdAt.toISOString(),
      }));

    // Collect timeline
    const timeline = await monitoringService.getLifecycleTimeline(organizationId, user, internshipId);

    return {
      internship: workspaceService.mapInternshipDetailToDto(detail),
      company: {
        name: company?.name || detail.companyId,
        industry: company?.industry || 'Technology',
        website: company?.website,
        address: company?.address,
      },
      student: {
        id: detail.studentId,
        name: student ? `${student.firstName} ${student.lastName}`.trim() : 'Candidate',
        email: student?.email || '',
        departmentName: student?.departmentId || undefined,
      },
      role: detail.role || detail.title,
      dates: {
        startDate: detail.startDate.toISOString(),
        endDate: detail.endDate.toISOString(),
        completedAt: detail.updatedAt.toISOString(),
      },
      finalEvaluation: finalEval,
      outcomes: detail.expectedOutcomes,
      evidenceFiles,
      milestoneFeedback,
      timeline,
    };
  }

  /**
   * Mentor requests early termination with justification
   */
  async requestTerminationByMentor(
    organizationId: string,
    mentorUser: AuthenticatedUser,
    dto: { internshipId: string; reason: string }
  ): Promise<InMemoryTerminationRequest> {
    const detail = internshipStore.details.get(dto.internshipId);
    if (!detail) throw new NotFoundError('Internship', dto.internshipId);
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant termination request prohibited');
    }

    const role = normalizeRole(mentorUser.role);
    if (![UserRole.MENTOR, UserRole.ADMIN].includes(role)) {
      throw new ForbiddenError('Only assigned industry mentor or admin can request termination');
    }

    if (!dto.reason || !dto.reason.trim()) {
      throw new BadRequestError('Detailed reason is required for requesting termination');
    }

    const id = `term-req-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const termRequest: InMemoryTerminationRequest = {
      id,
      organizationId,
      internshipId: dto.internshipId,
      mentorId: mentorUser.id,
      reason: dto.reason.trim(),
      status: 'PENDING',
      requestedAt: new Date(),
    };

    completionStore.terminationRequests.set(id, termRequest);

    // Also register an open CRITICAL mentor concern for immediate health engine visibility
    const concernId = `concern-term-${id}`;
    const concern: InMemoryMentorConcern = {
      id: concernId,
      organizationId,
      internshipId: dto.internshipId,
      mentorId: mentorUser.id,
      mentorName: `${mentorUser.firstName} ${mentorUser.lastName}`.trim() || 'Industry Mentor',
      reason: `Termination Requested: ${dto.reason.trim()}`,
      severity: 'CRITICAL',
      status: 'OPEN',
      requestedAt: new Date(),
    };
    workspaceStore.concerns.set(concernId, concern);

    auditService.log({
      organizationId,
      userId: mentorUser.id,
      action: AuditAction.TERMINATION_REQUEST,
      entity: 'TerminationRequest',
      entityId: id,
      details: {
        internshipId: dto.internshipId,
        reason: dto.reason.trim(),
      },
    });

    auditService.log({
      organizationId,
      userId: mentorUser.id,
      action: 'TERMINATION',
      entity: 'TerminationRequest',
      entityId: id,
      details: {
        internshipId: dto.internshipId,
        reason: dto.reason.trim(),
      },
    });

    // Notify HODs and Admins
    const hodsAndAdmins = ['user-a-admin', 'user-a-hod'];
    notificationService.notifyTerminationRequested({
      organizationId,
      internshipId: dto.internshipId,
      recipientIds: hodsAndAdmins,
      studentName: 'Student',
      reason: dto.reason.trim(),
    }).catch(() => {});

    return termRequest;
  }

  /**
   * Institutional role (HOD or ADMIN) approves or rejects termination
   */
  async decideTermination(
    organizationId: string,
    approverUser: AuthenticatedUser,
    dto: TerminationDecisionDto
  ): Promise<InternshipStatus> {
    const detail = internshipStore.details.get(dto.internshipId);
    if (!detail) throw new NotFoundError('Internship', dto.internshipId);
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant termination decision prohibited');
    }

    const role = normalizeRole(approverUser.role);
    if (role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only Admin can approve internship termination');
    }

    if (!dto.reason || !dto.reason.trim()) {
      throw new BadRequestError('Documented justification is required for termination decisions');
    }

    const now = new Date().toISOString();

    if (dto.approved) {
      // Validate transition through state machine
      internshipStateMachine.validateTransition(
        detail.status,
        InternshipStatus.TERMINATED,
        role,
        dto.reason
      );

      const previousStatus = detail.status;
      detail.status = InternshipStatus.TERMINATED;
      detail.updatedAt = new Date();
      detail.stateHistory.push({
        fromStatus: previousStatus,
        toStatus: InternshipStatus.TERMINATED,
        changedBy: approverUser.id,
        changedAt: now,
        reason: `Termination approved: ${dto.reason.trim()}`,
      });

      // Update pending termination requests
      for (const tr of completionStore.terminationRequests.values()) {
        if (tr.internshipId === dto.internshipId && tr.status === 'PENDING') {
          tr.status = 'APPROVED';
          tr.decidedAt = new Date();
          tr.decidedBy = approverUser.id;
          tr.decisionReason = dto.reason;
        }
      }

      auditService.log({
        organizationId,
        userId: approverUser.id,
        action: AuditAction.INTERNSHIP_TERMINATE,
        entity: 'Internship',
        entityId: dto.internshipId,
        details: {
          decidedBy: approverUser.id,
          reason: dto.reason.trim(),
          status: InternshipStatus.TERMINATED,
        },
      });
    } else {
      // Rejection: close related open concerns
      for (const tr of completionStore.terminationRequests.values()) {
        if (tr.internshipId === dto.internshipId && tr.status === 'PENDING') {
          tr.status = 'REJECTED';
          tr.decidedAt = new Date();
          tr.decidedBy = approverUser.id;
          tr.decisionReason = dto.reason;
        }
      }

      auditService.log({
        organizationId,
        userId: approverUser.id,
        action: AuditAction.TERMINATION_DECIDE,
        entity: 'TerminationRequest',
        entityId: dto.internshipId,
        details: {
          decision: 'REJECTED',
          reason: dto.reason.trim(),
        },
      });
    }

    return detail.status;
  }

  /**
   * Role-authorized cancellation of internship with justification
   */
  async cancelInternship(
    organizationId: string,
    user: AuthenticatedUser,
    internshipId: string,
    reason: string
  ): Promise<InternshipStatus> {
    const detail = internshipStore.details.get(internshipId);
    if (!detail) throw new NotFoundError('Internship', internshipId);
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant cancellation prohibited');
    }

    const role = normalizeRole(user.role);

    // Students can only cancel their own internships
    if (role === UserRole.STUDENT && detail.studentId !== user.id) {
      throw new ForbiddenError('Students can only cancel their own internship registration');
    }

    if (!reason || !reason.trim()) {
      throw new BadRequestError('Documented reason is required to cancel an internship');
    }

    // Validate state machine transition
    internshipStateMachine.validateTransition(
      detail.status,
      InternshipStatus.CANCELLED,
      role,
      reason.trim()
    );

    const previousStatus = detail.status;
    detail.status = InternshipStatus.CANCELLED;
    detail.updatedAt = new Date();
    const now = new Date().toISOString();

    detail.stateHistory.push({
      fromStatus: previousStatus,
      toStatus: InternshipStatus.CANCELLED,
      changedBy: user.id,
      changedAt: now,
      reason: `Cancelled by ${user.role}: ${reason.trim()}`,
    });

    auditService.log({
      organizationId,
      userId: user.id,
      action: AuditAction.INTERNSHIP_CANCEL,
      entity: 'Internship',
      entityId: internshipId,
      details: {
        cancelledBy: user.id,
        reason: reason.trim(),
        previousStatus,
      },
    });

    return detail.status;
  }
}

export const completionService = new CompletionService();
