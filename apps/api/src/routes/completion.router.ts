import { Router } from 'express';
import { completionController } from '../controllers/completion.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { UserRole } from '@internos/types';

const router = Router();

// Protect all completion routes with tenant authentication
router.use(authenticate);

// 1. Completion Checklist & Prerequisites Verification
router.get(
  '/check/:internshipId',
  requireRoles(UserRole.STUDENT, UserRole.ADMIN, UserRole.MENTOR, UserRole.FACULTY, UserRole.HOD),
  (req, res, next) => completionController.checkPrerequisites(req, res, next)
);

// 2. Mentor Final Evaluation (/100) & Editing
router.post(
  '/evaluation',
  requireRoles(UserRole.MENTOR, UserRole.ADMIN, UserRole.FACULTY),
  (req, res, next) => completionController.submitFinalEvaluation(req, res, next)
);

router.put(
  '/evaluation/:id',
  requireRoles(UserRole.MENTOR, UserRole.ADMIN, UserRole.FACULTY),
  (req, res, next) => completionController.updateFinalEvaluation(req, res, next)
);

router.get(
  '/evaluation/:internshipId',
  requireRoles(UserRole.STUDENT, UserRole.MENTOR, UserRole.ADMIN, UserRole.FACULTY, UserRole.HOD),
  (req, res, next) => completionController.getFinalEvaluation(req, res, next)
);

// 3. Institutional / Mentor Completion Confirmation
router.post(
  '/confirm',
  requireRoles(UserRole.MENTOR, UserRole.ADMIN, UserRole.FACULTY, UserRole.HOD),
  (req, res, next) => completionController.confirmCompletion(req, res, next)
);

// 4. Completed Internship Student Dossier
router.get(
  '/dossier/:internshipId',
  requireRoles(UserRole.STUDENT, UserRole.ADMIN, UserRole.MENTOR, UserRole.FACULTY, UserRole.HOD),
  (req, res, next) => completionController.getCompletedDossier(req, res, next)
);

// 5. Termination Request by Mentor & Approval by Admin
router.post(
  '/termination-request',
  requireRoles(UserRole.MENTOR, UserRole.ADMIN, UserRole.FACULTY),
  (req, res, next) => completionController.requestTermination(req, res, next)
);

router.post(
  '/terminate',
  requireRoles(UserRole.MENTOR, UserRole.ADMIN, UserRole.HOD),
  (req, res, next) => completionController.decideTermination(req, res, next)
);

// 6. Authorized Internship Cancellation
router.post(
  '/cancel',
  requireRoles(UserRole.STUDENT, UserRole.MENTOR, UserRole.ADMIN, UserRole.HOD),
  (req, res, next) => completionController.cancelInternship(req, res, next)
);

export const completionRouter = router;

