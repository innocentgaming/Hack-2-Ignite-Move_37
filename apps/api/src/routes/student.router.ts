import { Router } from 'express';
import { studentController } from '../controllers/student.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { UserRole } from '@internos/types';

export const studentRouter = Router();

// All student routes require authentication
studentRouter.use(authenticate);

// Student role or Admin
studentRouter.use(requireRoles(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN));

// Routes matching user specification:
studentRouter.get('/dashboard', studentController.getDashboard.bind(studentController));
studentRouter.get('/internship', studentController.getInternship.bind(studentController));
studentRouter.post('/internships', studentController.createInternship.bind(studentController));

studentRouter.get('/milestones', studentController.getMilestones.bind(studentController));
studentRouter.get('/milestones/:id', studentController.getMilestoneById.bind(studentController));

studentRouter.get('/tasks', studentController.getTasks.bind(studentController));
studentRouter.get('/tasks/:id', studentController.getTaskById.bind(studentController));
studentRouter.post('/tasks/:id/submissions', studentController.submitTaskEvidence.bind(studentController));

studentRouter.get('/submissions', studentController.getSubmissions.bind(studentController));
studentRouter.get('/submissions/:id', studentController.getSubmissionById.bind(studentController));
studentRouter.patch('/submissions/:id', studentController.updateSubmission.bind(studentController));
studentRouter.post('/submissions/:id/resubmit', studentController.updateSubmission.bind(studentController));

studentRouter.get('/outcomes', studentController.getOutcomes.bind(studentController));
studentRouter.get('/feedback', studentController.getFeedback.bind(studentController));

studentRouter.get('/documents', studentController.getDocuments.bind(studentController));
studentRouter.get('/documents/:id', studentController.getDocumentById.bind(studentController));
studentRouter.get('/documents/:id/view', studentController.viewDocument.bind(studentController));
studentRouter.get('/documents/:id/download', studentController.downloadDocument.bind(studentController));
studentRouter.post('/documents', studentController.uploadDocument.bind(studentController));

studentRouter.get('/profile', studentController.getProfile.bind(studentController));
