import { Request, Response, NextFunction } from 'express';
import { studentMentorService } from '../services/student-mentor.service.js';
import { formatSuccessResponse } from '@internos/shared';

export class StudentController {
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await studentMentorService.getStudentDashboard(req.user!.organizationId, req.user!);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getInternship(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await studentMentorService.getStudentInternship(req.user!.organizationId, req.user!);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async createInternship(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await studentMentorService.createStudentInternship(req.user!.organizationId, req.user!, req.body);
      res.status(201).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getMilestones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await studentMentorService.getStudentMilestones(req.user!.organizationId, req.user!);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getMilestoneById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await studentMentorService.getStudentMilestoneById(req.user!.organizationId, req.user!, id);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, milestoneId } = req.query as { status?: string; milestoneId?: string };
      const data = await studentMentorService.getStudentTasks(req.user!.organizationId, req.user!, { status, milestoneId });
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await studentMentorService.getStudentTaskById(req.user!.organizationId, req.user!, id);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async submitTaskEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await studentMentorService.submitTaskEvidence(req.user!.organizationId, req.user!, id, req.body);
      res.status(201).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await studentMentorService.getStudentSubmissions(req.user!.organizationId, req.user!);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getSubmissionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await studentMentorService.getStudentSubmissionById(req.user!.organizationId, req.user!, id);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getOutcomes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await studentMentorService.getStudentOutcomes(req.user!.organizationId, req.user!);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await studentMentorService.getStudentFeedback(req.user!.organizationId, req.user!);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await studentMentorService.getStudentDocuments(req.user!.organizationId, req.user!);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await studentMentorService.getStudentProfile(req.user!.organizationId, req.user!);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }
}

export const studentController = new StudentController();
