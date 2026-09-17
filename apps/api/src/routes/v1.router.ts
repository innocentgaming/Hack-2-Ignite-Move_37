import { Router } from 'express';
import { authRouter } from './auth.router.js';
import { tenantRouter } from './tenant.router.js';
import { adminRouter } from './admin.router.js';
import { workflowRouter } from './workflow.router.js';

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

export const v1Router = router;
