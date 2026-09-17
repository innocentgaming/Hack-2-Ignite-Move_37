import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service.js';
import { ValidationError, NotFoundError } from '@internos/shared';

export class NotificationController {
  /**
   * GET /api/v1/notifications
   * List notifications for the authenticated user
   */
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const isReadQuery = req.query.isRead;
      let isRead: boolean | undefined = undefined;
      if (isReadQuery === 'true') isRead = true;
      if (isReadQuery === 'false') isRead = false;

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const type = req.query.type as string | undefined;

      const userId = user.id || (user as any).userId;
      const result = await notificationService.getUserNotifications(
        user.organizationId,
        userId,
        { isRead, page, limit, type }
      );

      res.status(200).json({
        success: true,
        data: result.notifications,
        meta: {
          total: result.total,
          unreadCount: result.unreadCount,
          page,
          limit,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/notifications/unread-count
   * Return unread notification count
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const userId = user.id || (user as any).userId;
      const result = await notificationService.getUnreadCount(user.organizationId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   * Mark a single notification as read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const userId = user.id || (user as any).userId;
      const { id } = req.params;

      const updated = await notificationService.markAsRead(user.organizationId, userId, id);
      if (!updated) {
        throw new NotFoundError('Notification', id);
      }

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/notifications/mark-all-read
   * Mark all notifications for the user as read
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const userId = user.id || (user as any).userId;
      const result = await notificationService.markAllAsRead(user.organizationId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/notifications
   * Create an in-app notification (for manual creation or testing)
   */
  async createNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { recipientId, type, title, message, entityType, entityId } = req.body;

      if (!recipientId || !title || !message) {
        throw new ValidationError('recipientId, title, and message are required');
      }

      const notif = await notificationService.createNotification({
        organizationId: user.organizationId,
        recipientId,
        type: type || 'SYSTEM',
        title,
        message,
        entityType,
        entityId,
      });

      res.status(201).json({
        success: true,
        data: notif,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
