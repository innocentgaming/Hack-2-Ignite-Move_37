import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// GET /api/v1/notifications
router.get('/', notificationController.getNotifications.bind(notificationController));

// GET /api/v1/notifications/unread-count
router.get('/unread-count', notificationController.getUnreadCount.bind(notificationController));

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', notificationController.markAsRead.bind(notificationController));

// POST /api/v1/notifications/mark-all-read
router.post('/mark-all-read', notificationController.markAllAsRead.bind(notificationController));

// POST /api/v1/notifications
router.post('/', notificationController.createNotification.bind(notificationController));

export const notificationRouter = router;
