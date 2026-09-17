import { Router } from 'express';
import { authRouter } from './auth.router.js';
import { tenantRouter } from './tenant.router.js';
import { adminRouter } from './admin.router.js';
import { workflowRouter } from './workflow.router.js';
import { internshipRouter, companyRouter } from './internship.router.js';
import { workspaceRouter } from './workspace.router.js';
import { submissionRouter } from './submission.router.js';
import { monitoringRouter } from './monitoring.router.js';
import { completionRouter } from './completion.router.js';
import { aiRouter } from './ai.router.js';
import { notificationRouter } from './notification.router.js';
import { documentRouter } from './document.router.js';

const router = Router();

// GET /api/v1/health
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    service: 'internos-api',
    status: 'healthy',
  });
});

router.use('/auth', authRouter);
router.use('/tenants', tenantRouter);
router.use('/admin', adminRouter);
router.use('/workflows', workflowRouter);
router.use('/internships', internshipRouter);
router.use('/companies', companyRouter);
router.use('/workspaces', workspaceRouter);
router.use('/submissions', submissionRouter);
router.use('/monitoring', monitoringRouter);
router.use('/completion', completionRouter);
router.use('/ai', aiRouter);
router.use('/notifications', notificationRouter);
router.use('/documents', documentRouter);

export const v1Router = router;

