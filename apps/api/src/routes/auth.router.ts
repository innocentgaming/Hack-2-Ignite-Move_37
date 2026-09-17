import { Router } from 'express';
import { z } from 'zod';
import { login, registerInstitution, logout, invite, activate, getMe } from '../controllers/auth.controller.js';
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

const registerInstitutionSchema = z.object({
  institutionName: z.string().min(2, 'Institution name is required'),
  institutionCode: z.string().min(2, 'Institution code is required'),
  officialEmail: z.string().email('Valid official email is required'),
  website: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  adminFirstName: z.string().min(1, 'Admin first name is required'),
  adminLastName: z.string().min(1, 'Admin last name is required'),
  adminEmail: z.string().email('Valid admin email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
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
router.post('/register-institution', authLimiter, validateBody(registerInstitutionSchema), registerInstitution);
router.post('/logout', authenticate, logout);
router.post('/invite', authenticate, requirePermission('users:invite'), validateBody(inviteSchema), invite);
router.post('/activate', authLimiter, validateBody(activateSchema), activate);
router.get('/me', authenticate, getMe);

export const authRouter = router;
