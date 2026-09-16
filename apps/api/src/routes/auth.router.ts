import { Router } from 'express';
import { z } from 'zod';
import { login, getMe } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validator.js';
import { authenticate } from '../middleware/auth.js';

const loginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organizationCode: z.string().optional(),
});

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticate, getMe);

export const authRouter = router;
