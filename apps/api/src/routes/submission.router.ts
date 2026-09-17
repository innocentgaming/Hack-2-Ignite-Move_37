import { Router } from 'express';
import {
  uploadSubmissionFile,
  downloadSubmissionFile,
  createSubmission,
  getSubmissions,
  getSubmissionById,
  getSubmissionTimeline,
  createReview,
} from '../controllers/submission.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

export const submissionRouter = Router();

// All submission routes require tenant authentication
submissionRouter.use(authenticate);

// File management & Private downloads
submissionRouter.post('/upload', requirePermission('submissions:create'), uploadSubmissionFile);
submissionRouter.get('/files/:fileId', requirePermission('submissions:read'), downloadSubmissionFile);

// Submission management (Versioned)
submissionRouter.get('/', requirePermission('submissions:read'), getSubmissions);
submissionRouter.post('/', requirePermission('submissions:create'), createSubmission);
submissionRouter.get('/:id', requirePermission('submissions:read'), getSubmissionById);
submissionRouter.get('/:id/timeline', requirePermission('submissions:read'), getSubmissionTimeline);

// Mentor Reviews (Structured Criteria & Revision Requests)
submissionRouter.post('/:id/reviews', requirePermission('reviews:create'), createReview);
submissionRouter.post('/reviews', requirePermission('reviews:create'), createReview);
