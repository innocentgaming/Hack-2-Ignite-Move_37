import {
  MonitoringOverviewDto,
  MonitoredInternshipDto,
  AttentionQueueItemDto,
  LifecycleTimelineEventDto,
  InternshipHealthResultDto,
  InternshipStatus,
  UserRole,
  AuthenticatedUser,
} from '@internos/types';
import {
  NotFoundError,
  TenantViolationError,
  ForbiddenError,
  normalizeRole,
} from '@internos/shared';
import { internshipStore, InMemoryInternshipDetail } from './internship.service.js';
import { workflowStore } from './workflow.service.js';
import { authStore } from './auth.service.js';
import { tenantStore } from './tenant.service.js';
import { workspaceStore, workspaceService } from './workspace.service.js';
import { submissionStore } from './submission.service.js';
import { healthCalculationService } from './health-calculation.service.js';

export interface MonitoringFilterParams {
  departmentId?: string;
  facultyId?: string;
  mentorId?: string;
  companyId?: string;
  status?: string;
  health?: string;
  search?: string;
}

export class MonitoringService {
  /**
   * Filter accessible internships based on user role and organization boundary
   */
  private getAccessibleInternships(organizationId: string, user: AuthenticatedUser): InMemoryInternshipDetail[] {
    const role = normalizeRole(user.role);
    const allTenantInternships = Array.from(internshipStore.details.values()).filter(
      (d) => d.organizationId === organizationId
    );

    if (role === UserRole.ADMIN) {
      return allTenantInternships;
    }

    if (role === UserRole.MENTOR) {
      const mentorUser = authStore.users.get(user.id);
      return allTenantInternships.filter(
        (d) =>
          (d as any).industryMentorId === user.id ||
          (d as any).mentorId === user.id ||
          d.mentor?.email === user.email ||
          (mentorUser && d.mentor?.email === mentorUser.email)
      );
    }

    if (role === UserRole.STUDENT) {
      return allTenantInternships.filter((d) => d.studentId === user.id);
    }

    return [];
  }

  /**
   * Get high-level institution, department, or faculty monitoring counters
   */
  async getMonitoringOverview(organizationId: string, user: AuthenticatedUser): Promise<MonitoringOverviewDto> {
    const internships = this.getAccessibleInternships(organizationId, user);
    let onTrackCount = 0;
    let attentionCount = 0;
    let criticalCount = 0;
    let overdueCount = 0;
    let pendingReviewsCount = 0;

    for (const intern of internships) {
      const health = healthCalculationService.calculateHealth(organizationId, intern.id);
      if (health.status === 'ON_TRACK') onTrackCount++;
      if (health.status === 'ATTENTION') attentionCount++;
      if (health.status === 'CRITICAL') criticalCount++;

      if (health.metrics.overdueTasks > 0) overdueCount++;
      if (health.metrics.pendingReviews > 0) pendingReviewsCount++;
    }

    const activeCount = internships.filter((d) => d.status === InternshipStatus.ACTIVE).length;
    const completedCount = internships.filter((d) => d.status === InternshipStatus.COMPLETED).length;

    return {
      totalInternships: internships.length,
      active: activeCount,
      completed: completedCount,
      onTrack: onTrackCount,
      attention: attentionCount,
      critical: criticalCount,
      overdue: overdueCount,
      pendingReviews: pendingReviewsCount,
    };
  }

  /**
   * Multi-dimensional filtering for internships
   */
  async getMonitoredInternships(
    organizationId: string,
    user: AuthenticatedUser,
    filters: MonitoringFilterParams = {}
  ): Promise<MonitoredInternshipDto[]> {
    let internships = this.getAccessibleInternships(organizationId, user);

    // Filter by department
    if (filters.departmentId && filters.departmentId !== 'ALL') {
      internships = internships.filter((d) => {
        const student = authStore.users.get(d.studentId);
        return student?.departmentId === filters.departmentId;
      });
    }

    // Filter by faculty
    if (filters.facultyId && filters.facultyId !== 'ALL') {
      internships = internships.filter((d) => d.facultyId === filters.facultyId);
    }

    // Filter by mentor
    if (filters.mentorId && filters.mentorId !== 'ALL') {
      internships = internships.filter((d) => d.mentorId === filters.mentorId);
    }

    // Filter by company
    if (filters.companyId && filters.companyId !== 'ALL') {
      internships = internships.filter((d) => d.companyId === filters.companyId);
    }

    // Filter by internship status
    if (filters.status && filters.status !== 'ALL') {
      internships = internships.filter((d) => d.status === filters.status);
    }

    // Filter by search query
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      internships = internships.filter((d) => {
        const student = authStore.users.get(d.studentId);
        const studentName = `${student?.firstName || ''} ${student?.lastName || ''}`.toLowerCase();
        const company = internshipStore.companies.get(d.companyId);
        return (
          d.title.toLowerCase().includes(q) ||
          studentName.includes(q) ||
          (student?.email.toLowerCase().includes(q) ?? false) ||
          (company?.name.toLowerCase().includes(q) ?? false)
        );
      });
    }

    // Build monitored dtos with health evaluation
    const results: MonitoredInternshipDto[] = [];
    for (const intern of internships) {
      const student = authStore.users.get(intern.studentId);
      const studentName = student ? `${student.firstName} ${student.lastName}`.trim() : 'Unknown Student';
      const studentEmail = student?.email || '';

      let departmentName: string | undefined;
      let departmentId: string | undefined;
      if (student?.departmentId) {
        departmentId = student.departmentId;
        const dept = tenantStore.departments.get(student.departmentId);
        departmentName = dept?.name;
      }

      const company = internshipStore.companies.get(intern.companyId);
      const companyName = company?.name || intern.companyId;

      let facultyName: string | undefined;
      if (intern.facultyId) {
        const fac = authStore.users.get(intern.facultyId);
        facultyName = fac ? `${fac.firstName} ${fac.lastName}`.trim() : intern.facultyName || undefined;
      }

      const mentorName = intern.mentor?.name;

      const health = healthCalculationService.calculateHealth(organizationId, intern.id);

      // Filter by health if specified
      if (filters.health && filters.health !== 'ALL' && health.status !== filters.health) {
        continue;
      }

      results.push({
        internship: workspaceService.mapInternshipDetailToDto(intern),
        studentName,
        studentEmail,
        departmentId,
        departmentName,
        companyName,
        facultyName,
        mentorName,
        health,
      });
    }

    return results;
  }

  /**
   * Dedicated attention queue returning only cases needing attention or critical intervention
   */
  async getAttentionQueue(organizationId: string, user: AuthenticatedUser): Promise<AttentionQueueItemDto[]> {
    const monitored = await this.getMonitoredInternships(organizationId, user, { health: 'ALL' });
    const attentionCases: AttentionQueueItemDto[] = [];

    for (const item of monitored) {
      if (item.health.status === 'ATTENTION' || item.health.status === 'CRITICAL') {
        attentionCases.push({
          id: `queue-${item.internship.id}`,
          internshipId: item.internship.id,
          studentId: item.internship.studentId,
          studentName: item.studentName,
          studentEmail: item.studentEmail,
          departmentName: item.departmentName,
          companyName: item.companyName,
          facultyName: item.facultyName,
          mentorName: item.mentorName,
          status: item.health.status,
          reasons: item.health.reasons,
          metrics: item.health.metrics,
          calculatedAt: item.health.calculatedAt,
        });
      }
    }

    // Sort CRITICAL first, then by overdue tasks descending
    attentionCases.sort((a, b) => {
      if (a.status === 'CRITICAL' && b.status !== 'CRITICAL') return -1;
      if (b.status === 'CRITICAL' && a.status !== 'CRITICAL') return 1;
      return b.metrics.overdueTasks - a.metrics.overdueTasks;
    });

    return attentionCases;
  }

  /**
   * Full unified lifecycle timeline for an internship
   */
  async getLifecycleTimeline(
    organizationId: string,
    user: AuthenticatedUser,
    internshipId: string
  ): Promise<LifecycleTimelineEventDto[]> {
    const detail = internshipStore.details.get(internshipId);
    if (!detail) {
      throw new NotFoundError('Internship', internshipId);
    }
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant timeline inspection prohibited');
    }

    const events: LifecycleTimelineEventDto[] = [];
    const student = authStore.users.get(detail.studentId);
    const studentName = student ? `${student.firstName} ${student.lastName}`.trim() : 'Student';

    // 1. Registration
    events.push({
      id: `ev-reg-${detail.id}`,
      type: 'REGISTRATION',
      title: 'Internship Registration Submitted',
      description: `Student registered '${detail.title}' at ${detail.companyId}`,
      actorName: studentName,
      actorRole: 'STUDENT',
      timestamp: detail.createdAt.toISOString(),
      severity: 'info',
    });

    // 2. State history transitions
    if (Array.isArray(detail.stateHistory)) {
      detail.stateHistory.forEach((sh, idx) => {
        const actor = authStore.users.get(sh.changedBy);
        const actorName = actor ? `${actor.firstName} ${actor.lastName}`.trim() : 'Supervisor';
        events.push({
          id: `ev-state-${idx}-${sh.changedAt}`,
          type: 'STATE_TRANSITION',
          title: `Status Changed: ${sh.fromStatus} → ${sh.toStatus}`,
          description: sh.reason ? `Reason: ${sh.reason}` : `Internship moved to ${sh.toStatus}`,
          actorName,
          actorRole: actor?.role || 'SYSTEM',
          timestamp: sh.changedAt,
          severity: sh.toStatus === InternshipStatus.APPROVED ? 'success' : sh.toStatus === InternshipStatus.REJECTED ? 'critical' : 'info',
        });
      });
    }

    // 3. Faculty / Mentor Assignment
    if (detail.facultyId) {
      const fac = authStore.users.get(detail.facultyId);
      events.push({
        id: `ev-fac-assign-${detail.facultyId}`,
        type: 'ASSIGNMENT',
        title: 'Faculty Supervisor Assigned',
        description: `Assigned faculty coordinator: ${fac ? `${fac.firstName} ${fac.lastName}` : detail.facultyName || detail.facultyId}`,
        actorName: 'Department Coordinator',
        actorRole: 'HOD',
        timestamp: detail.updatedAt.toISOString(),
        severity: 'info',
      });
    }

    if (detail.mentor) {
      events.push({
        id: `ev-mentor-assign-${detail.id}`,
        type: 'ASSIGNMENT',
        title: 'Industry Mentor Connected',
        description: `Connected mentor: ${detail.mentor.name} (${detail.mentor.email})`,
        actorName: detail.mentor.name,
        actorRole: 'MENTOR',
        timestamp: detail.createdAt.toISOString(),
        severity: 'info',
      });
    }

    // 4. Workflow Tasks generated
    const tasks = Array.from(workflowStore.tasks.values()).filter(
      (t) => t.organizationId === organizationId && (t.instanceId === detail.workflowInstanceId || t.instanceId === detail.id)
    );
    for (const task of tasks) {
      events.push({
        id: `ev-task-${task.id}`,
        type: 'WORKFLOW_TASK',
        title: `Milestone Configured: ${task.title}`,
        description: `Type: ${task.type} | Due: ${new Date(task.currentDueDate).toLocaleDateString()} | Status: ${task.status}`,
        actorName: 'Workflow Engine',
        actorRole: 'SYSTEM',
        timestamp: task.createdAt.toISOString(),
        severity: 'info',
        metadata: { taskId: task.id, status: task.status, dueDate: task.currentDueDate.toISOString() },
      });
    }

    // 5. Submissions and Versions
    const submissions = Array.from(workspaceStore.submissions.values()).filter(
      (s) => s.organizationId === organizationId && s.internshipId === detail.id
    );

    for (const sub of submissions) {
      // Historical versions
      const versions = submissionStore.versions.get(sub.id) || [];
      if (versions.length > 0) {
        for (const v of versions) {
          events.push({
            id: `ev-sub-v-${v.id}`,
            type: v.version > 1 ? 'REVISION' : 'SUBMISSION',
            title: v.version > 1 ? `Submission Version ${v.version} Uploaded` : `Submission Version 1 Created`,
            description: `'${v.title}' - ${v.files?.length || 0} file(s) attached${v.isLate ? ' (Late)' : ''}`,
            actorName: studentName,
            actorRole: 'STUDENT',
            timestamp: v.submittedAt.toISOString(),
            severity: v.isLate ? 'warning' : 'info',
            metadata: { version: v.version, filesCount: v.files?.length },
          });
        }
      } else {
        events.push({
          id: `ev-sub-${sub.id}`,
          type: 'SUBMISSION',
          title: `Submission Received: ${sub.title}`,
          description: `Deliverable submitted for milestone evaluation`,
          actorName: studentName,
          actorRole: 'STUDENT',
          timestamp: sub.submittedAt.toISOString(),
          severity: 'info',
        });
      }

      // Reviews on this submission
      const reviews = Array.from(workspaceStore.reviews.values()).filter(
        (r) => r.organizationId === organizationId && r.submissionId === sub.id
      );

      for (const rev of reviews) {
        events.push({
          id: `ev-rev-${rev.id}`,
          type: rev.status === 'CHANGES_REQUESTED' ? 'REVISION' : 'REVIEW',
          title: rev.status === 'CHANGES_REQUESTED' ? `Mentor Requested Revisions` : `Mentor Review Approved`,
          description: rev.feedback ? `Feedback: "${rev.feedback}"` : `Review recorded with score: ${rev.score ?? 'N/A'}/100`,
          actorName: rev.reviewerName || 'Industry Mentor',
          actorRole: rev.reviewerRole || 'MENTOR',
          timestamp: rev.createdAt.toISOString(),
          severity: rev.status === 'CHANGES_REQUESTED' ? 'warning' : 'success',
          metadata: { score: rev.score, revisionReason: rev.revisionReason },
        });
      }
    }

    // 6. Outcome modifications
    const outcomeHistory = internshipStore.outcomeVersions.get(detail.id) || [];
    for (const ov of outcomeHistory) {
      const modifier = authStore.users.get(ov.updatedBy);
      events.push({
        id: `ev-ov-${ov.id}`,
        type: 'OUTCOME_CHANGE',
        title: `Expected Outcomes Updated (v${ov.versionNumber})`,
        description: `${ov.outcomes.length} learning outcome(s) structured for this internship`,
        actorName: modifier ? `${modifier.firstName} ${modifier.lastName}` : 'Supervisor',
        actorRole: modifier?.role || 'MENTOR',
        timestamp: ov.createdAt,
        severity: 'info',
      });
    }

    // 7. Mentor Concerns
    const concerns = Array.from(workspaceStore.concerns.values()).filter(
      (c) => c.organizationId === organizationId && c.internshipId === detail.id
    );
    for (const con of concerns) {
      events.push({
        id: `ev-concern-${con.id}`,
        type: 'CONCERN',
        title: `Mentor Concern Raised (${con.severity})`,
        description: con.reason,
        actorName: con.mentorName,
        actorRole: 'MENTOR',
        timestamp: con.requestedAt.toISOString(),
        severity: con.severity === 'CRITICAL' ? 'critical' : 'warning',
      });
    }

    // 8. Evaluations
    const evals = Array.from(workspaceStore.evaluations.values()).filter(
      (e) => e.organizationId === organizationId && e.internshipId === detail.id
    );
    for (const ev of evals) {
      events.push({
        id: `ev-eval-${ev.id}`,
        type: 'EVALUATION',
        title: `Formal Evaluation Completed: Grade ${ev.finalGrade}`,
        description: ev.comments ? `Comments: "${ev.comments}"` : `Evaluated by supervisor`,
        actorName: ev.evaluatorName,
        actorRole: ev.evaluatorRole,
        timestamp: ev.createdAt.toISOString(),
        severity: 'success',
      });
    }

    // Sort chronologically ascending
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return events;
  }
}

export const monitoringService = new MonitoringService();
