import { prisma, isDatabaseOnline } from '../lib/prisma.js';
import {
  NotificationDto,
  NotificationType,
  NotificationQuery,
  UnreadCountDto,
} from '@internos/types';

export interface InMemoryNotification {
  id: string;
  organizationId: string;
  recipientId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: Date;
}

class NotificationStore {
  public notifications: Map<string, InMemoryNotification> = new Map();

  constructor() {
    this.seedDefaults();
  }

  public seedDefaults() {
    // Seed default sample notifications for demonstration and initial state
    const now = new Date('2026-09-17T10:00:00Z');

    const seedEntries: InMemoryNotification[] = [
      {
        id: 'notif-a-1',
        organizationId: 'org-a-id',
        recipientId: 'user-a-student',
        type: NotificationType.TASK_DUE,
        title: 'Monthly report due tomorrow',
        message: 'Your Technical Progress Deliverable for Milestone 1 is due tomorrow at 11:59 PM.',
        entityType: 'Task',
        entityId: 'task-a-1',
        isRead: false,
        createdAt: new Date(now.getTime() - 2 * 3600 * 1000),
      },
      {
        id: 'notif-a-2',
        organizationId: 'org-a-id',
        recipientId: 'user-a-student',
        type: NotificationType.REVISION_REQUESTED,
        title: 'Mentor requested revision',
        message: 'Industry Mentor requested updates on Section 3: Architecture Diagram.',
        entityType: 'Submission',
        entityId: 'sub-a-1',
        isRead: false,
        createdAt: new Date(now.getTime() - 5 * 3600 * 1000),
      },
      {
        id: 'notif-a-3',
        organizationId: 'org-a-id',
        recipientId: 'user-a-student',
        type: NotificationType.INTERNSHIP_APPROVED,
        title: 'Internship approved',
        message: 'Your Cloud Engineering internship at Acme Corp has been approved by Faculty.',
        entityType: 'Internship',
        entityId: 'internship-a-1',
        isRead: true,
        createdAt: new Date(now.getTime() - 24 * 3600 * 1000),
      },
      {
        id: 'notif-a-4',
        organizationId: 'org-a-id',
        recipientId: 'user-a-student',
        type: NotificationType.MENTOR_ASSIGNED,
        title: 'New mentor assignment',
        message: 'Dr. Alan Vance has been assigned as your institutional industry mentor.',
        entityType: 'Internship',
        entityId: 'internship-a-1',
        isRead: true,
        createdAt: new Date(now.getTime() - 48 * 3600 * 1000),
      },
      {
        id: 'notif-a-5',
        organizationId: 'org-a-id',
        recipientId: 'user-a-student',
        type: NotificationType.EVALUATION_COMPLETED,
        title: 'Final evaluation completed',
        message: 'Your final internship evaluation has been scored: 94/100 (Grade A).',
        entityType: 'Evaluation',
        entityId: 'eval-a-1',
        isRead: false,
        createdAt: new Date(now.getTime() - 1 * 3600 * 1000),
      },
      {
        id: 'notif-a-6',
        organizationId: 'org-a-id',
        recipientId: 'user-a-student',
        type: NotificationType.COMPLETION_CONFIRMED,
        title: 'Completion confirmed',
        message: 'Institutional academic sign-off complete. Your verified internship dossier is ready.',
        entityType: 'Internship',
        entityId: 'internship-a-1',
        isRead: false,
        createdAt: new Date(now.getTime() - 30 * 60 * 1000),
      },
      // Tenant B isolation sample
      {
        id: 'notif-b-1',
        organizationId: 'org-b-id',
        recipientId: 'user-b-student',
        type: NotificationType.INTERNSHIP_APPROVED,
        title: 'Internship approved',
        message: 'Your Mechanical Design internship at Beta Motors has been approved.',
        entityType: 'Internship',
        entityId: 'internship-b-1',
        isRead: false,
        createdAt: now,
      },
    ];

    for (const notif of seedEntries) {
      this.notifications.set(notif.id, notif);
    }
  }
}

export const notificationStore = new NotificationStore();

export class NotificationService {
  /**
   * Create an in-app notification for a specific recipient within an organization
   */
  async createNotification(params: {
    organizationId: string;
    recipientId: string;
    type: NotificationType | string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
  }): Promise<NotificationDto> {
    const id = `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date();

    const memNotif: InMemoryNotification = {
      id,
      organizationId: params.organizationId,
      recipientId: params.recipientId,
      type: params.type,
      title: params.title.trim(),
      message: params.message.trim(),
      entityType: params.entityType,
      entityId: params.entityId,
      isRead: false,
      createdAt,
    };

    notificationStore.notifications.set(id, memNotif);

    // Save to Prisma if online
    if (await isDatabaseOnline()) {
      try {
        await prisma.notification.create({
          data: {
            id: memNotif.id,
            organizationId: memNotif.organizationId,
            userId: memNotif.recipientId,
            title: memNotif.title,
            message: memNotif.message,
            type: (memNotif.type in NotificationType ? memNotif.type : 'SYSTEM') as any,
            isRead: false,
            createdAt: memNotif.createdAt,
          },
        });
      } catch (err) {
        console.warn('DB write for notification failed; memory store preserved:', err);
      }
    }

    return this.mapToDto(memNotif);
  }

  /**
   * Get notifications for a user, filtered by organization, read status, and pagination
   */
  async getUserNotifications(
    organizationId: string,
    recipientId: string,
    query?: NotificationQuery
  ): Promise<{ notifications: NotificationDto[]; total: number; unreadCount: number }> {
    let list = Array.from(notificationStore.notifications.values()).filter(
      (n) => n.organizationId === organizationId && n.recipientId === recipientId
    );

    // Sort newest first
    list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = list.length;
    const unreadCount = list.filter((n) => !n.isRead).length;

    if (query?.isRead !== undefined) {
      list = list.filter((n) => n.isRead === query.isRead);
    }
    if (query?.type) {
      list = list.filter((n) => n.type === query.type);
    }

    const page = Math.max(1, query?.page || 1);
    const limit = Math.max(1, Math.min(100, query?.limit || 50));
    const offset = (page - 1) * limit;

    const paged = list.slice(offset, offset + limit);

    return {
      notifications: paged.map((n) => this.mapToDto(n)),
      total,
      unreadCount,
    };
  }

  /**
   * Get unread notification count for caller
   */
  async getUnreadCount(organizationId: string, recipientId: string): Promise<UnreadCountDto> {
    const count = Array.from(notificationStore.notifications.values()).filter(
      (n) => n.organizationId === organizationId && n.recipientId === recipientId && !n.isRead
    ).length;

    return { unreadCount: count };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(
    organizationId: string,
    recipientId: string,
    notificationId: string
  ): Promise<NotificationDto | null> {
    const notif = notificationStore.notifications.get(notificationId);
    if (!notif) return null;

    if (notif.organizationId !== organizationId || notif.recipientId !== recipientId) {
      return null;
    }

    notif.isRead = true;

    if (await isDatabaseOnline()) {
      try {
        await prisma.notification.updateMany({
          where: { id: notificationId, organizationId, userId: recipientId },
          data: { isRead: true },
        });
      } catch (err) {
        console.warn('DB update for notification failed; memory store preserved:', err);
      }
    }

    return this.mapToDto(notif);
  }

  /**
   * Mark all unread notifications for a user as read
   */
  async markAllAsRead(organizationId: string, recipientId: string): Promise<{ count: number }> {
    let count = 0;
    for (const notif of notificationStore.notifications.values()) {
      if (notif.organizationId === organizationId && notif.recipientId === recipientId && !notif.isRead) {
        notif.isRead = true;
        count++;
      }
    }

    if (await isDatabaseOnline() && count > 0) {
      try {
        await prisma.notification.updateMany({
          where: { organizationId, userId: recipientId, isRead: false },
          data: { isRead: true },
        });
      } catch (err) {
        console.warn('DB bulk update for notifications failed; memory store preserved:', err);
      }
    }

    return { count };
  }

  // =========================================================================
  // High-Level Event Notification Triggers
  // =========================================================================

  async notifyInternshipSubmitted(params: {
    organizationId: string;
    internshipId: string;
    recipientIds: string[];
    studentName: string;
    internshipTitle: string;
  }): Promise<void> {
    for (const recipientId of params.recipientIds) {
      await this.createNotification({
        organizationId: params.organizationId,
        recipientId,
        type: NotificationType.INTERNSHIP_SUBMITTED,
        title: 'New internship submitted for approval',
        message: `${params.studentName} submitted an internship registration for "${params.internshipTitle}".`,
        entityType: 'Internship',
        entityId: params.internshipId,
      });
    }
  }

  async notifyInternshipApproved(params: {
    organizationId: string;
    internshipId: string;
    studentId: string;
    internshipTitle: string;
  }): Promise<void> {
    await this.createNotification({
      organizationId: params.organizationId,
      recipientId: params.studentId,
      type: NotificationType.INTERNSHIP_APPROVED,
      title: 'Internship approved',
      message: `Your internship registration for "${params.internshipTitle}" has been approved.`,
      entityType: 'Internship',
      entityId: params.internshipId,
    });
  }

  async notifyInternshipRejected(params: {
    organizationId: string;
    internshipId: string;
    studentId: string;
    internshipTitle: string;
    reason?: string;
  }): Promise<void> {
    await this.createNotification({
      organizationId: params.organizationId,
      recipientId: params.studentId,
      type: NotificationType.INTERNSHIP_REJECTED,
      title: 'Internship registration rejected',
      message: `Your registration for "${params.internshipTitle}" was rejected.${params.reason ? ` Reason: ${params.reason}` : ''}`,
      entityType: 'Internship',
      entityId: params.internshipId,
    });
  }

  async notifyMentorAssigned(params: {
    organizationId: string;
    internshipId: string;
    mentorId: string;
    studentId: string;
    mentorName: string;
    studentName: string;
    internshipTitle: string;
  }): Promise<void> {
    // Notify Student
    await this.createNotification({
      organizationId: params.organizationId,
      recipientId: params.studentId,
      type: NotificationType.MENTOR_ASSIGNED,
      title: 'New mentor assignment',
      message: `${params.mentorName} has been assigned as your industry/faculty mentor for "${params.internshipTitle}".`,
      entityType: 'Internship',
      entityId: params.internshipId,
    });

    // Notify Mentor
    await this.createNotification({
      organizationId: params.organizationId,
      recipientId: params.mentorId,
      type: NotificationType.MENTOR_ASSIGNED,
      title: 'New mentee assigned',
      message: `You have been assigned to mentor ${params.studentName} for internship "${params.internshipTitle}".`,
      entityType: 'Internship',
      entityId: params.internshipId,
    });
  }

  async notifyTaskDue(params: {
    organizationId: string;
    taskId: string;
    studentId: string;
    taskTitle: string;
    timeframeText?: string;
  }): Promise<void> {
    await this.createNotification({
      organizationId: params.organizationId,
      recipientId: params.studentId,
      type: NotificationType.TASK_DUE,
      title: `${params.taskTitle} due ${params.timeframeText || 'soon'}`,
      message: `Reminder: Your milestone submission for "${params.taskTitle}" is due ${params.timeframeText || 'soon'}.`,
      entityType: 'Task',
      entityId: params.taskId,
    });
  }

  async notifyTaskOverdue(params: {
    organizationId: string;
    taskId: string;
    studentId: string;
    taskTitle: string;
    mentorId?: string;
  }): Promise<void> {
    await this.createNotification({
      organizationId: params.organizationId,
      recipientId: params.studentId,
      type: NotificationType.TASK_OVERDUE,
      title: `Task overdue: ${params.taskTitle}`,
      message: `The deadline for "${params.taskTitle}" has passed. Please submit your deliverable as soon as possible.`,
      entityType: 'Task',
      entityId: params.taskId,
    });

    if (params.mentorId) {
      await this.createNotification({
        organizationId: params.organizationId,
        recipientId: params.mentorId,
        type: NotificationType.TASK_OVERDUE,
        title: `Mentee task overdue: ${params.taskTitle}`,
        message: `Task "${params.taskTitle}" is now overdue and pending deliverable submission.`,
        entityType: 'Task',
        entityId: params.taskId,
      });
    }
  }

  async notifyRevisionRequested(params: {
    organizationId: string;
    submissionId: string;
    studentId: string;
    taskTitle: string;
    notes?: string;
  }): Promise<void> {
    await this.createNotification({
      organizationId: params.organizationId,
      recipientId: params.studentId,
      type: NotificationType.REVISION_REQUESTED,
      title: 'Mentor requested revision',
      message: `Your mentor requested revisions on "${params.taskTitle}".${params.notes ? ` Feedback: ${params.notes}` : ''}`,
      entityType: 'Submission',
      entityId: params.submissionId,
    });
  }

  async notifyReviewCompleted(params: {
    organizationId: string;
    submissionId: string;
    studentId: string;
    taskTitle: string;
    status: string;
  }): Promise<void> {
    await this.createNotification({
      organizationId: params.organizationId,
      recipientId: params.studentId,
      type: NotificationType.REVIEW_COMPLETED,
      title: 'Deliverable review completed',
      message: `Your deliverable for "${params.taskTitle}" has been reviewed: ${params.status}.`,
      entityType: 'Submission',
      entityId: params.submissionId,
    });
  }

  async notifyEvaluationCompleted(params: {
    organizationId: string;
    internshipId: string;
    studentId: string;
    totalScore: number;
    grade: string;
    facultyIds?: string[];
  }): Promise<void> {
    await this.createNotification({
      organizationId: params.organizationId,
      recipientId: params.studentId,
      type: NotificationType.EVALUATION_COMPLETED,
      title: 'Final evaluation completed',
      message: `Your mentor has completed your final evaluation rubric: ${params.totalScore}/100 (${params.grade}).`,
      entityType: 'Evaluation',
      entityId: params.internshipId,
    });

    if (params.facultyIds && params.facultyIds.length > 0) {
      for (const fid of params.facultyIds) {
        await this.createNotification({
          organizationId: params.organizationId,
          recipientId: fid,
          type: NotificationType.EVALUATION_COMPLETED,
          title: 'Final evaluation submitted by mentor',
          message: `Final evaluation completed for student with score ${params.totalScore}/100 (${params.grade}).`,
          entityType: 'Evaluation',
          entityId: params.internshipId,
        });
      }
    }
  }

  async notifyCompletionConfirmed(params: {
    organizationId: string;
    internshipId: string;
    studentId: string;
    internshipTitle: string;
  }): Promise<void> {
    await this.createNotification({
      organizationId: params.organizationId,
      recipientId: params.studentId,
      type: NotificationType.COMPLETION_CONFIRMED,
      title: 'Completion confirmed',
      message: `Congratulations! Your internship "${params.internshipTitle}" has received final institutional sign-off and completion.`,
      entityType: 'Internship',
      entityId: params.internshipId,
    });
  }

  async notifyTerminationRequested(params: {
    organizationId: string;
    internshipId: string;
    recipientIds: string[];
    studentName: string;
    reason: string;
  }): Promise<void> {
    for (const rid of params.recipientIds) {
      await this.createNotification({
        organizationId: params.organizationId,
        recipientId: rid,
        type: NotificationType.TERMINATION_REQUESTED,
        title: 'Internship termination requested',
        message: `Premature termination requested for ${params.studentName}. Reason: ${params.reason}`,
        entityType: 'Internship',
        entityId: params.internshipId,
      });
    }
  }

  private mapToDto(mem: InMemoryNotification): NotificationDto {
    return {
      id: mem.id,
      organizationId: mem.organizationId,
      recipientId: mem.recipientId,
      userId: mem.recipientId,
      type: mem.type,
      title: mem.title,
      message: mem.message,
      relatedEntity: mem.entityType && mem.entityId ? {
        entityType: mem.entityType,
        entityId: mem.entityId,
      } : undefined,
      entityType: mem.entityType,
      entityId: mem.entityId,
      isRead: mem.isRead,
      createdAt: mem.createdAt.toISOString(),
    };
  }
}

export const notificationService = new NotificationService();
