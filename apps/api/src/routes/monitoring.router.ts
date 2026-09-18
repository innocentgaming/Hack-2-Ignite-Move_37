import { Router } from 'express';
import { monitoringController } from '../controllers/monitoring.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { UserRole } from '@internos/types';

const router = Router();

// Protect all monitoring routes with authentication
router.use(authenticate);

// Metrics Overview
router.get(
  '/overview',
  requireRoles(UserRole.ADMIN, UserRole.MENTOR),
  (req, res, next) => monitoringController.getOverview(req, res, next)
);

// Monitored Internships with Multi-Dimensional Filtering
router.get(
  '/internships',
  requireRoles(UserRole.ADMIN, UserRole.MENTOR),
  (req, res, next) => monitoringController.getInternships(req, res, next)
);

// Dedicated Attention Queue
router.get(
  '/attention-queue',
  requireRoles(UserRole.ADMIN, UserRole.MENTOR),
  (req, res, next) => monitoringController.getAttentionQueue(req, res, next)
);

// Unified Lifecycle Timeline
router.get(
  '/internships/:id/timeline',
  requireRoles(UserRole.ADMIN, UserRole.MENTOR, UserRole.STUDENT),
  (req, res, next) => monitoringController.getLifecycleTimeline(req, res, next)
);

// Direct Health Evaluation for a Single Internship
router.get(
  '/internships/:id/health',
  requireRoles(UserRole.ADMIN, UserRole.MENTOR, UserRole.STUDENT),
  (req, res, next) => monitoringController.getInternshipHealth(req, res, next)
);

// Institution-Configured Health Thresholds
router.get(
  '/thresholds',
  requireRoles(UserRole.ADMIN),
  (req, res, next) => monitoringController.getThresholds(req, res, next)
);

router.patch(
  '/thresholds',
  requireRoles(UserRole.ADMIN),
  (req, res, next) => monitoringController.updateThresholds(req, res, next)
);

export const monitoringRouter = router;
