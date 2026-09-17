import { Router } from 'express';
import {
  getCurrentTenant,
  getDepartments,
  getInternships,
  getInternshipById,
  createInternship,
  updateInternship,
  deleteInternship,
  getDocuments,
  getDocumentById,
  deleteDocument,
  getUsers,
} from '../controllers/tenant.controller.js';
import { authenticate } from '../middleware/auth.js';
import { tenantIsolation } from '../middleware/tenantIsolation.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

// Enforce authentication AND server-side tenant isolation across all tenant routes
router.use(authenticate, tenantIsolation);

// Tenant overview
router.get('/current', getCurrentTenant);

// Department operations
router.get('/departments', requirePermission('department:read'), getDepartments);

// User roster
router.get('/users', requirePermission('users:read'), getUsers);

// Internship operations (with granular RBAC and tenant isolation)
router.get('/internships', requirePermission('internships:read'), getInternships);
router.post('/internships', requirePermission('internships:create'), createInternship);
router.get('/internships/:id', requirePermission('internships:read'), getInternshipById);
router.put('/internships/:id', requirePermission('internships:manage'), updateInternship);
router.delete('/internships/:id', requirePermission('internships:manage'), deleteInternship);

// Document operations (with cross-tenant isolation enforcement)
router.get('/documents', requirePermission('documents:read'), getDocuments);
router.get('/documents/:id', requirePermission('documents:read'), getDocumentById);
router.delete('/documents/:id', requirePermission('documents:manage'), deleteDocument);

export const tenantRouter = router;
