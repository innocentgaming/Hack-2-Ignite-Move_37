import { Router } from 'express';
import { aiController } from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { UserRole } from '@internos/types';

export const aiRouter = Router();

// Protect all AI routes with tenant authentication
aiRouter.use(authenticate);

// 1. Get AI analysis for a specific submission deliverable
aiRouter.get(
  '/submissions/:submissionId/analysis',
  requireRoles(UserRole.STUDENT, UserRole.MENTOR, UserRole.ADMIN),
  aiController.getSubmissionAnalysis.bind(aiController)
);

// 2. Trigger / Retry AI analysis for a submission
aiRouter.post(
  '/submissions/:submissionId/analyze',
  requireRoles(UserRole.STUDENT, UserRole.MENTOR, UserRole.ADMIN),
  aiController.retrySubmissionAnalysis.bind(aiController)
);

// 3. Get aggregated AI insights for an internship
aiRouter.get(
  '/internships/:internshipId/insights',
  requireRoles(UserRole.MENTOR, UserRole.ADMIN, UserRole.STUDENT),
  aiController.getInternshipAIInsights.bind(aiController)
);
