import { Router } from 'express';
import { z } from 'zod';
import { login, logout, invite, activate, getMe } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validator.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { UserRole } from '@internos/types';

const loginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organizationCode: z.string().optional(),
});

const inviteSchema = z.object({
  email: z.string().email('Valid email address is required'),
  role: z.nativeEnum(UserRole),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  departmentId: z.string().optional(),
});

const activateSchema = z.object({
  token: z.string().min(10, 'Valid activation token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const router = Router();

// Rate limiting for auth sensitive routes (100 requests per 15 minutes in prod)
const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many authentication attempts, please try again later.',
});

router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/logout', authenticate, logout);
router.post('/invite', authenticate, requirePermission('users:invite'), validateBody(inviteSchema), invite);
router.post('/activate', authLimiter, validateBody(activateSchema), activate);
router.get('/me', authenticate, getMe);

export const authRouter = router;
