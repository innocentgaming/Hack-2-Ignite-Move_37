import { Router } from 'express';
import { getCurrentTenant, getDepartments } from '../controllers/tenant.controller.js';
import { authenticate } from '../middleware/auth.js';
import { tenantIsolation } from '../middleware/tenantIsolation.js';

const router = Router();

// Enforce authentication AND server-side tenant isolation
router.use(authenticate, tenantIsolation);

router.get('/current', getCurrentTenant);
router.get('/departments', getDepartments);

export const tenantRouter = router;
