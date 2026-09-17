import {
  InternshipHealthStatus,
  InternshipHealthResultDto,
  HealthMetricsDto,
  HealthThresholdConfigDto,
  InternshipStatus,
  TaskStatus,
  SubmissionStatus,
  OutcomeStatus,
} from '@internos/types';
import { NotFoundError, TenantViolationError } from '@internos/shared';
import { internshipStore, InMemoryInternshipDetail } from './internship.service.js';
import { workflowStore, InMemoryWorkflowTask } from './workflow.service.js';
import { workspaceStore, InMemorySubmission, InMemoryMentorConcern } from './workspace.service.js';

export const DEFAULT_HEALTH_THRESHOLDS: HealthThresholdConfigDto = {
  maxOverdueDaysAttention: 1,
  maxOverdueDaysCritical: 7,
  maxPendingReviewDaysAttention: 3,
  maxPendingReviewDaysCritical: 7,
  maxInactiveDaysAttention: 14,
  maxInactiveDaysCritical: 30,
  multipleOverdueThreshold: 2,
};

export class HealthCalculationService {
  private thresholdsByOrg: Map<string, HealthThresholdConfigDto> = new Map();

  /**
   * Set custom health evaluation thresholds for an institution
   */
  setOrganizationThresholds(organizationId: string, thresholds: Partial<HealthThresholdConfigDto>): HealthThresholdConfigDto {
    const current = this.getOrganizationThresholds(organizationId);
    const updated = { ...current, ...thresholds };
    this.thresholdsByOrg.set(organizationId, updated);
    return updated;
  }

  /**
   * Get active thresholds for an institution
   */
  getOrganizationThresholds(organizationId: string): HealthThresholdConfigDto {
    return this.thresholdsByOrg.get(organizationId) || { ...DEFAULT_HEALTH_THRESHOLDS };
  }

  /**
   * Compute deterministic health for an internship by ID
   */
  calculateHealth(
    organizationId: string,
    internshipId: string,
    options?: { asOfDate?: Date; config?: Partial<HealthThresholdConfigDto> }
  ): InternshipHealthResultDto {
    const detail = internshipStore.details.get(internshipId);
    if (!detail) {
      throw new NotFoundError('Internship', internshipId);
    }
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant health inspection prohibited');
    }

    // Collect related records
    const tasks = Array.from(workflowStore.tasks.values()).filter(
      (t) => t.organizationId === organizationId && (t.instanceId === detail.workflowInstanceId || t.instanceId === detail.id)
    );

    const submissions = Array.from(workspaceStore.submissions.values()).filter(
      (s) => s.organizationId === organizationId && s.internshipId === detail.id
    );

    const concerns = Array.from(workspaceStore.concerns.values()).filter(
      (c) => c.organizationId === organizationId && c.internshipId === detail.id && c.status === 'OPEN'
    );

    const config: HealthThresholdConfigDto = {
      ...this.getOrganizationThresholds(organizationId),
      ...(options?.config || {}),
    };

    return this.evaluateDeterministicHealth(detail, tasks, submissions, concerns, config, options?.asOfDate);
  }

  /**
   * Pure deterministic evaluator function.
   * GUARANTEE: Never invokes AI. Computes strictly from database inputs.
   */
  evaluateDeterministicHealth(
    internship: InMemoryInternshipDetail,
    tasks: InMemoryWorkflowTask[],
    submissions: InMemorySubmission[],
    concerns: InMemoryMentorConcern[],
    config: HealthThresholdConfigDto = DEFAULT_HEALTH_THRESHOLDS,
    asOfDate?: Date
  ): InternshipHealthResultDto {
    const now = asOfDate ? asOfDate.getTime() : Date.now();
    const reasons: string[] = [];
    let isCritical = false;
    let isAttention = false;

    // 1. Task Overdue Analysis
    const pendingTasks = tasks.filter((t) => t.status === TaskStatus.PENDING || t.status === TaskStatus.CHANGES_REQUESTED);
    const completedTasks = tasks.filter((t) => t.status === TaskStatus.APPROVED || t.status === TaskStatus.SUBMITTED);
    
    let overdueCount = 0;
    for (const task of pendingTasks) {
      const dueTime = new Date(task.currentDueDate).getTime();
      if (now > dueTime) {
        overdueCount++;
        const daysOverdue = Math.max(1, Math.floor((now - dueTime) / (24 * 60 * 60 * 1000)));

        if (daysOverdue >= config.maxOverdueDaysCritical) {
          isCritical = true;
          reasons.push(`Milestone '${task.title}' is critically overdue by ${daysOverdue} days`);
        } else if (daysOverdue >= config.maxOverdueDaysAttention) {
          isAttention = true;
          reasons.push(`Milestone '${task.title}' is overdue by ${daysOverdue} days`);
        }
      }
    }

    if (overdueCount >= config.multipleOverdueThreshold) {
      isCritical = true;
      reasons.push(`Multiple overdue workflow milestones (${overdueCount} tasks past due)`);
    }

    // 2. Mentor Review Timeliness Analysis
    const pendingReviewSubmissions = submissions.filter((s) => s.status === SubmissionStatus.SUBMITTED);
    for (const sub of pendingReviewSubmissions) {
      const subTime = new Date(sub.submittedAt).getTime();
      const daysPending = Math.max(0, Math.floor((now - subTime) / (24 * 60 * 60 * 1000)));

      if (daysPending >= config.maxPendingReviewDaysCritical) {
        isCritical = true;
        reasons.push(`Mentor review critically delayed for '${sub.title}' (${daysPending} days pending)`);
      } else if (daysPending >= config.maxPendingReviewDaysAttention) {
        isAttention = true;
        reasons.push(`Mentor review pending for '${sub.title}' (${daysPending} days)`);
      }
    }

    // 3. Mentor Concerns Flagged
    for (const concern of concerns) {
      if (concern.severity === 'CRITICAL') {
        isCritical = true;
        reasons.push(`Mentor raised critical concern: ${concern.reason}`);
      } else if (concern.severity === 'HIGH' || concern.severity === 'MEDIUM') {
        isAttention = true;
        reasons.push(`Mentor flagged concern: ${concern.reason}`);
      }
    }

    // 4. Inactivity & Lapsed Progress (for ACTIVE internships)
    let daysSinceLastActivity = 0;
    if (internship.status === InternshipStatus.ACTIVE) {
      const activityTimestamps: number[] = [
        new Date(internship.startDate).getTime(),
        new Date(internship.updatedAt || internship.createdAt).getTime(),
      ];

      for (const s of submissions) {
        activityTimestamps.push(new Date(s.updatedAt || s.submittedAt).getTime());
      }
      for (const t of tasks) {
        if (t.status === TaskStatus.APPROVED || t.status === TaskStatus.SUBMITTED) {
          activityTimestamps.push(new Date(t.updatedAt || t.createdAt).getTime());
        }
      }

      const latestActivity = Math.max(...activityTimestamps);
      daysSinceLastActivity = Math.max(0, Math.floor((now - latestActivity) / (24 * 60 * 60 * 1000)));

      const internshipStarted = now >= new Date(internship.startDate).getTime();
      if (internshipStarted) {
        if (daysSinceLastActivity >= config.maxInactiveDaysCritical) {
          isCritical = true;
          reasons.push(`Inactive internship: No student submissions or activity for ${daysSinceLastActivity} days`);
        } else if (daysSinceLastActivity >= config.maxInactiveDaysAttention) {
          isAttention = true;
          reasons.push(`No submission activity in the past ${daysSinceLastActivity} days`);
        }
      }
    }

    // 5. Outcome Evidence Coverage
    const outcomes = internship.expectedOutcomes || [];
    const totalOutcomes = outcomes.length;
    const metOutcomes = outcomes.filter((o) => o.status === OutcomeStatus.MET).length;
    const outcomeCoveragePercentage = totalOutcomes > 0 ? Math.round((metOutcomes / totalOutcomes) * 100) : 0;

    if (internship.status === InternshipStatus.ACTIVE && totalOutcomes > 0) {
      const startTime = new Date(internship.startDate).getTime();
      const endTime = new Date(internship.endDate).getTime();
      const totalDuration = endTime - startTime;
      const elapsed = now - startTime;

      if (totalDuration > 0 && elapsed > totalDuration * 0.5) {
        if (metOutcomes === 0) {
          isAttention = true;
          reasons.push(`Low outcome evidence progress (0 of ${totalOutcomes} expected outcomes verified)`);
        }
      }
    }

    // Determine Final Status
    let finalStatus: InternshipHealthStatus = 'ON_TRACK';
    if (isCritical) {
      finalStatus = 'CRITICAL';
    } else if (isAttention) {
      finalStatus = 'ATTENTION';
    }

    if (reasons.length === 0) {
      reasons.push('All milestones, reviews, and activities on track');
    }

    const metrics: HealthMetricsDto = {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueCount,
      pendingReviews: pendingReviewSubmissions.length,
      daysSinceLastActivity,
      outcomeCoveragePercentage,
      openConcernsCount: concerns.length,
    };

    return {
      status: finalStatus,
      reasons,
      calculatedAt: asOfDate ? asOfDate.toISOString() : new Date().toISOString(),
      metrics,
    };
  }
}

export const healthCalculationService = new HealthCalculationService();
