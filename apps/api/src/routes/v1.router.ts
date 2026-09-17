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
import { analyticsRouter } from './analytics.router.js';

import { authenticate } from '../middleware/auth.js';
import { tenantIsolation } from '../middleware/tenantIsolation.js';

const router = Router();

// GET /api/v1/health (Public health check)
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    service: 'internos-api',
    status: 'healthy',
  });
});

// Authentication endpoints (login & activate are public; logout, me, invite handle auth/RBAC)
router.use('/auth', authRouter);

// Strict Multi-Tenant Protected Domain Routers
// Guarantees authenticate and tenantIsolation run before any controller logic
const protectedRouter = Router();
protectedRouter.use(authenticate, tenantIsolation);

protectedRouter.use('/tenants', tenantRouter);
protectedRouter.use('/admin', adminRouter);
protectedRouter.use('/workflows', workflowRouter);
protectedRouter.use('/internships', internshipRouter);
protectedRouter.use('/companies', companyRouter);
protectedRouter.use('/workspaces', workspaceRouter);
protectedRouter.use('/submissions', submissionRouter);
protectedRouter.use('/monitoring', monitoringRouter);
protectedRouter.use('/completion', completionRouter);
protectedRouter.use('/ai', aiRouter);
protectedRouter.use('/notifications', notificationRouter);
protectedRouter.use('/documents', documentRouter);
protectedRouter.use('/analytics', analyticsRouter);

router.use(protectedRouter);

export const v1Router = router;


