import { Router } from 'express';
import { internshipController } from '../controllers/internship.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

export const internshipRouter = Router();

// All routes require verified authentication and tenant context
internshipRouter.use(authenticate);

// ==========================================
// Companies Directory
// ==========================================
internshipRouter.get(
  '/companies',
  requirePermission('internships:read'),
  internshipController.getCompanies.bind(internshipController)
);

internshipRouter.post(
  '/companies',
  requirePermission('internships:create'),
  internshipController.createCompany.bind(internshipController)
);

export const companyRouter = Router();
companyRouter.use(authenticate);
companyRouter.get(
  '/',
  requirePermission('internships:read'),
  internshipController.getCompanies.bind(internshipController)
);
companyRouter.post(
  '/',
  requirePermission('internships:create'),
  internshipController.createCompany.bind(internshipController)
);

// ==========================================
// Internship Lifecycle & Registration
// ==========================================
internshipRouter.get(
  '/',
  requirePermission('internships:read'),
  internshipController.getInternships.bind(internshipController)
);

internshipRouter.get(
  '/:id',
  requirePermission('internships:read'),
  internshipController.getInternshipById.bind(internshipController)
);

internshipRouter.post(
  '/',
  requirePermission('internships:create'),
  internshipController.registerInternship.bind(internshipController)
);

internshipRouter.put(
  '/:id',
  requirePermission('internships:read'),
  internshipController.updateInternship.bind(internshipController)
);

internshipRouter.post(
  '/:id/submit',
  requirePermission('internships:read'),
  internshipController.submitForApproval.bind(internshipController)
);

internshipRouter.post(
  '/:id/approve',
  requirePermission('approvals:manage'),
  internshipController.decideApproval.bind(internshipController)
);

internshipRouter.post(
  '/:id/transition',
  requirePermission('internships:read'),
  internshipController.transitionState.bind(internshipController)
);

// ==========================================
// Assignments (Faculty & Mentor)
// ==========================================
internshipRouter.post(
  '/:id/assign-faculty',
  requirePermission('approvals:manage'),
  internshipController.assignFaculty.bind(internshipController)
);

internshipRouter.post(
  '/:id/assign-mentor',
  requirePermission('internships:read'),
  internshipController.assignMentor.bind(internshipController)
);

// ==========================================
// Outcome Versions History
// ==========================================
internshipRouter.get(
  '/:id/outcomes/versions',
  requirePermission('internships:read'),
  internshipController.getOutcomeVersions.bind(internshipController)
);
