import { Request, Response, NextFunction } from 'express';
import { workspaceService } from '../services/workspace.service.js';
import { formatSuccessResponse } from '@internos/shared';
import {
  CreateSubmissionDto,
  CreateReviewDto,
  CreateEvaluationDto,
  CreateMentorConcernDto,
  ExpectedOutcomeDto,
  SubmissionStatus,
} from '@internos/types';

export class WorkspaceController {
  // ==========================================
  // Role Dashboards
  // ==========================================

  async getStudentDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const studentId = req.user!.id;
      const data = await workspaceService.getStudentWorkspace(orgId, studentId);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getFacultyDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const facultyId = req.user!.id;
      const data = await workspaceService.getFacultyWorkspace(orgId, facultyId);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getHODDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const hodId = req.user!.id;
      const data = await workspaceService.getHODWorkspace(orgId, hodId);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getMentorDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const mentorId = req.user!.id;
      const data = await workspaceService.getMentorWorkspace(orgId, mentorId);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Submissions
  // ==========================================

  async createSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const dto: CreateSubmissionDto = req.body;
      const submission = await workspaceService.createSubmission(orgId, req.user!, dto);
      res.status(201).json(formatSuccessResponse(submission));
    } catch (err) {
      next(err);
    }
  }

  async getSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const internshipId = req.query.internshipId as string | undefined;
      const status = req.query.status as SubmissionStatus | undefined;
      const submissions = await workspaceService.getSubmissions(orgId, req.user!, {
        internshipId,
        status,
      });
      res.status(200).json(formatSuccessResponse(submissions));
    } catch (err) {
      next(err);
    }
  }

  async getSubmissionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const { id } = req.params;
      const submission = await workspaceService.getSubmissionById(orgId, id);
      res.status(200).json(formatSuccessResponse(submission));
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Reviews & Ratings
  // ==========================================

  async createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const dto: CreateReviewDto = req.body;
      const review = await workspaceService.createReview(orgId, req.user!, dto);
      res.status(201).json(formatSuccessResponse(review));
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Mentor Actions
  // ==========================================

  async modifyOutcomes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const { internshipId } = req.params;
      const outcomes: ExpectedOutcomeDto[] = req.body.outcomes || req.body;
      const updated = await workspaceService.modifyOutcomesByMentor(orgId, req.user!, internshipId, outcomes);
      res.status(200).json(formatSuccessResponse(updated));
    } catch (err) {
      next(err);
    }
  }

  async getOutcomeHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const { internshipId } = req.params;
      const history = await workspaceService.getOutcomeHistory(orgId, internshipId);
      res.status(200).json(formatSuccessResponse(history));
    } catch (err) {
      next(err);
    }
  }

  async raiseConcern(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const internshipId = req.params.internshipId || req.body.internshipId;
      const dto: CreateMentorConcernDto = {
        ...req.body,
        internshipId,
        reason: req.body.reason || req.body.description || 'Mentor Concern',
      };
      const concern = await workspaceService.raiseMentorConcern(orgId, req.user!, dto);
      res.status(201).json(formatSuccessResponse(concern));
    } catch (err) {
      next(err);
    }
  }

  async getConcerns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const { internshipId } = req.params;
      const all = await workspaceService.getConcerns(orgId, internshipId);
      res.status(200).json(formatSuccessResponse(all));
    } catch (err) {
      next(err);
    }
  }

  async requestTermination(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const { internshipId } = req.params;
      const { reason } = req.body;
      const concern = await workspaceService.requestTermination(orgId, req.user!, internshipId, reason || 'Termination requested by mentor');
      res.status(200).json(formatSuccessResponse(concern));
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Evaluations
  // ==========================================

  async createEvaluation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const internshipId = req.params.internshipId || req.body.internshipId;
      const dto: CreateEvaluationDto = {
        ...req.body,
        internshipId,
      };
      const evaluation = await workspaceService.createEvaluation(orgId, req.user!, dto);
      res.status(201).json(formatSuccessResponse(evaluation));
    } catch (err) {
      next(err);
    }
  }

  async getEvaluations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const { internshipId } = req.params;
      const evaluations = await workspaceService.getEvaluationsByInternship(orgId, internshipId);
      res.status(200).json(formatSuccessResponse(evaluations));
    } catch (err) {
      next(err);
    }
  }
}

export const workspaceController = new WorkspaceController();
