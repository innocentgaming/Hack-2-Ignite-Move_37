import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { UserRole } from '@internos/types';

const router = Router();

// Protect all analytics routes with authentication
router.use(authenticate);

// Institutional & Department Analytics (Admin, Mentor)
router.get(
  '/',
  requireRoles(UserRole.ADMIN, UserRole.MENTOR),
  (req, res, next) => analyticsController.getAnalytics(req, res, next)
);

// Dedicated CSV Export Endpoint
router.get(
  '/export',
  requireRoles(UserRole.ADMIN, UserRole.MENTOR),
  (req, res, next) => analyticsController.exportCsv(req, res, next)
);

// Department-Specific Analytics
router.get(
  '/departments/:departmentId',
  requireRoles(UserRole.ADMIN, UserRole.MENTOR),
  (req, res, next) => analyticsController.getDepartmentAnalytics(req, res, next)
);

// Student Roster for Analytics & AI Assessment
router.get(
  '/students-roster',
  requireRoles(UserRole.ADMIN, UserRole.MENTOR),
  (req, res, next) => analyticsController.getStudentsRoster(req, res, next)
);

// AI-Powered Student Progress Assessment
router.post(
  '/ai-assess',
  requireRoles(UserRole.ADMIN, UserRole.MENTOR),
  (req, res, next) => analyticsController.assessStudentProgress(req, res, next)
);

export const analyticsRouter = router;
