import { Router } from 'express';
import { workflowController } from '../controllers/workflow.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

export const workflowRouter = Router();

// All workflow routes require verified authentication and tenant context
workflowRouter.use(authenticate);

// ==========================================
// Template Management (ADMIN / HOD)
// ==========================================
workflowRouter.get(
  '/templates',
  requirePermission('workflows:read'),
  workflowController.getTemplates.bind(workflowController)
);

workflowRouter.get(
  '/templates/:templateId',
  requirePermission('workflows:read'),
  workflowController.getTemplateById.bind(workflowController)
);

workflowRouter.post(
  '/templates',
  requirePermission('workflows:manage'),
  workflowController.createTemplate.bind(workflowController)
);

workflowRouter.put(
  '/templates/:templateId',
  requirePermission('workflows:manage'),
  workflowController.updateTemplate.bind(workflowController)
);

// ==========================================
// Workflow Assignment & Instances
// ==========================================
workflowRouter.post(
  '/assign/:internshipId',
  requirePermission('workflows:manage'),
  workflowController.assignWorkflow.bind(workflowController)
);

workflowRouter.get(
  '/instances/:internshipId',
  requirePermission('workflows:read'),
  workflowController.getInstanceByInternshipId.bind(workflowController)
);

workflowRouter.get(
  '/instance-details/:instanceId',
  requirePermission('workflows:read'),
  workflowController.getInstanceById.bind(workflowController)
);

// ==========================================
// Tasks, Submissions & Extensions
// ==========================================
workflowRouter.get(
  '/tasks',
  requirePermission('workflows:read'),
  workflowController.getTasks.bind(workflowController)
);

workflowRouter.post(
  '/tasks/:taskId/submit',
  requirePermission('submissions:create'),
  workflowController.submitTask.bind(workflowController)
);

workflowRouter.post(
  '/tasks/:taskId/extend',
  requirePermission('approvals:manage'),
  workflowController.grantExtension.bind(workflowController)
);
