import { Router } from 'express';
import { mentorController } from '../controllers/mentor.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { UserRole } from '@internos/types';

export const mentorRouter = Router();

// All mentor routes require authentication
mentorRouter.use(authenticate);

// Mentor role or Admin
mentorRouter.use(requireRoles(UserRole.MENTOR, UserRole.INDUSTRY_MENTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN));

// Routes matching user specification:
mentorRouter.get('/dashboard', mentorController.getDashboard.bind(mentorController));
mentorRouter.get('/interns', mentorController.getInterns.bind(mentorController));
mentorRouter.get('/interns/:studentId', mentorController.getInternDetail.bind(mentorController));
mentorRouter.get('/internships', mentorController.getInternships.bind(mentorController));

mentorRouter.get('/milestones', mentorController.getMilestones.bind(mentorController));
mentorRouter.get('/milestones/:id', mentorController.getMilestoneById.bind(mentorController));
mentorRouter.post('/milestones', mentorController.createMilestone.bind(mentorController));
mentorRouter.patch('/milestones/:id', mentorController.updateMilestone.bind(mentorController));

mentorRouter.get('/tasks', mentorController.getTasks.bind(mentorController));
mentorRouter.get('/tasks/:id', mentorController.getTaskById.bind(mentorController));
mentorRouter.post('/tasks', mentorController.createTask.bind(mentorController));
mentorRouter.patch('/tasks/:id', mentorController.updateTask.bind(mentorController));

mentorRouter.get('/submissions', mentorController.getSubmissions.bind(mentorController));
mentorRouter.get('/submissions/:id', mentorController.getSubmissionById.bind(mentorController));
mentorRouter.post('/submissions/:id/feedback', mentorController.reviewSubmission.bind(mentorController));
mentorRouter.post('/submissions/:id/review', mentorController.reviewSubmission.bind(mentorController));
mentorRouter.post('/submissions/:id/accept', mentorController.acceptSubmission.bind(mentorController));
mentorRouter.post('/submissions/:id/request-revision', mentorController.requestRevision.bind(mentorController));

mentorRouter.get('/outcomes', mentorController.getOutcomes.bind(mentorController));
mentorRouter.get('/outcomes/:id', mentorController.getOutcomeById.bind(mentorController));
mentorRouter.get('/registrations', mentorController.getRegistrations.bind(mentorController));
mentorRouter.post('/registrations/:id/review', mentorController.reviewRegistration.bind(mentorController));
mentorRouter.get('/feedback', mentorController.getFeedback.bind(mentorController));
mentorRouter.get('/documents', mentorController.getDocuments.bind(mentorController));
mentorRouter.get('/profile', mentorController.getProfile.bind(mentorController));
