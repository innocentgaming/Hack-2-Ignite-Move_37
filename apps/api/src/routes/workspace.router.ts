import { Router } from 'express';
import { workspaceController } from '../controllers/workspace.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

export const workspaceRouter = Router();

// All routes require verified authentication and tenant context
workspaceRouter.use(authenticate);

// ==========================================
// Role Dashboards
// ==========================================
workspaceRouter.get(
  '/student/dashboard',
  requirePermission('internships:read'),
  workspaceController.getStudentDashboard.bind(workspaceController)
);

workspaceRouter.get(
  '/faculty/dashboard',
  requirePermission('internships:read'),
  workspaceController.getFacultyDashboard.bind(workspaceController)
);

workspaceRouter.get(
  '/hod/dashboard',
  requirePermission('department:read'),
  workspaceController.getHODDashboard.bind(workspaceController)
);

workspaceRouter.get(
  '/mentor/dashboard',
  requirePermission('internships:read'),
  workspaceController.getMentorDashboard.bind(workspaceController)
);

// ==========================================
// Submissions
// ==========================================
workspaceRouter.get(
  '/submissions',
  requirePermission('submissions:read'),
  workspaceController.getSubmissions.bind(workspaceController)
);

workspaceRouter.get(
  '/submissions/:id',
  requirePermission('submissions:read'),
  workspaceController.getSubmissionById.bind(workspaceController)
);

workspaceRouter.post(
  '/submissions',
  requirePermission('submissions:create'),
  workspaceController.createSubmission.bind(workspaceController)
);

// ==========================================
// Reviews & Ratings
// ==========================================
workspaceRouter.post(
  '/reviews',
  requirePermission('reviews:create'),
  workspaceController.createReview.bind(workspaceController)
);

// ==========================================
// Evaluations
// ==========================================
workspaceRouter.post(
  '/evaluations',
  requirePermission('evaluations:create'),
  workspaceController.createEvaluation.bind(workspaceController)
);

workspaceRouter.post(
  '/internships/:internshipId/evaluations',
  requirePermission('evaluations:create'),
  workspaceController.createEvaluation.bind(workspaceController)
);

workspaceRouter.get(
  '/internships/:internshipId/evaluations',
  requirePermission('evaluations:read'),
  workspaceController.getEvaluations.bind(workspaceController)
);

// ==========================================
// Outcomes Management & History
// ==========================================
workspaceRouter.put(
  '/internships/:internshipId/outcomes',
  requirePermission('reviews:manage'),
  workspaceController.modifyOutcomes.bind(workspaceController)
);

workspaceRouter.put(
  '/mentor/internships/:internshipId/outcomes',
  requirePermission('reviews:manage'),
  workspaceController.modifyOutcomes.bind(workspaceController)
);

workspaceRouter.get(
  '/internships/:internshipId/outcomes/history',
  requirePermission('internships:read'),
  workspaceController.getOutcomeHistory.bind(workspaceController)
);

workspaceRouter.get(
  '/mentor/internships/:internshipId/outcomes/history',
  requirePermission('internships:read'),
  workspaceController.getOutcomeHistory.bind(workspaceController)
);

// ==========================================
// Concerns & Attention Flags
// ==========================================
workspaceRouter.post(
  '/internships/:internshipId/concerns',
  requirePermission('reviews:manage'),
  workspaceController.raiseConcern.bind(workspaceController)
);

workspaceRouter.post(
  '/mentor/concern',
  requirePermission('reviews:manage'),
  workspaceController.raiseConcern.bind(workspaceController)
);

workspaceRouter.get(
  '/internships/:internshipId/concerns',
  requirePermission('internships:read'),
  workspaceController.getConcerns.bind(workspaceController)
);

// ==========================================
// Termination Requests
// ==========================================
workspaceRouter.post(
  '/internships/:internshipId/termination-request',
  requirePermission('reviews:manage'),
  workspaceController.requestTermination.bind(workspaceController)
);

workspaceRouter.post(
  '/mentor/internships/:internshipId/request-termination',
  requirePermission('reviews:manage'),
  workspaceController.requestTermination.bind(workspaceController)
);
