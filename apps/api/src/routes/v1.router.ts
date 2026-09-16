import { Router } from 'express';
import { authRouter } from './auth.router.js';
import { tenantRouter } from './tenant.router.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/tenants', tenantRouter);

export const v1Router = router;
