import { Request, Response, NextFunction } from 'express';
import { studentMentorService } from '../services/student-mentor.service.js';
import { formatSuccessResponse } from '@internos/shared';

export class MentorController {
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await studentMentorService.getMentorDashboard(req.user!.organizationId, req.user!);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getInterns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await studentMentorService.getMentorInterns(req.user!.organizationId, req.user!);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getInternDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId } = req.params;
      const data = await studentMentorService.getMentorInternDetail(req.user!.organizationId, req.user!, studentId);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getInternships(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dashboard = await studentMentorService.getMentorDashboard(req.user!.organizationId, req.user!);
      res.status(200).json(formatSuccessResponse(dashboard.interns));
    } catch (err) {
      next(err);
    }
  }

  async getMilestones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { internshipId } = req.query as { internshipId?: string };
      const data = await studentMentorService.getMentorMilestones(req.user!.organizationId, req.user!, internshipId);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async createMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await studentMentorService.createMentorMilestone(req.user!.organizationId, req.user!, req.body);
      res.status(201).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { internshipId } = req.query as { internshipId?: string };
      const data = await studentMentorService.getMentorTasks(req.user!.organizationId, req.user!, internshipId);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await studentMentorService.createMentorTask(req.user!.organizationId, req.user!, req.body);
      res.status(201).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await studentMentorService.updateMentorTask(req.user!.organizationId, req.user!, id, req.body);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query as { status?: string };
      const data = await studentMentorService.getMentorSubmissions(req.user!.organizationId, req.user!, { status });
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getSubmissionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const subs = await studentMentorService.getMentorSubmissions(req.user!.organizationId, req.user!);
      const match = subs.find((s) => s.id === id);
      res.status(200).json(formatSuccessResponse(match || null));
    } catch (err) {
      next(err);
    }
  }

  async reviewSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await studentMentorService.reviewSubmission(req.user!.organizationId, req.user!, id, req.body);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async acceptSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await studentMentorService.reviewSubmission(req.user!.organizationId, req.user!, id, {
        status: 'ACCEPTED',
        feedback: req.body?.feedback || 'Submission approved and accepted.',
        score: req.body?.score,
        rating: req.body?.rating,
        strengths: req.body?.strengths,
        improvements: req.body?.improvements,
        nextAction: req.body?.nextAction,
      });
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async requestRevision(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await studentMentorService.reviewSubmission(req.user!.organizationId, req.user!, id, {
        status: 'NEEDS_REVISION',
        feedback: req.body?.feedback || req.body?.revisionReason || 'Revisions required.',
        strengths: req.body?.strengths,
        improvements: req.body?.improvements,
        nextAction: req.body?.nextAction,
        revisionReason: req.body?.revisionReason,
      });
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getOutcomes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dashboard = await studentMentorService.getMentorDashboard(req.user!.organizationId, req.user!);
      const firstIntern = dashboard.interns[0];
      if (firstIntern) {
        const student = { id: firstIntern.studentId, departmentId: 'dept-a-cs' };
        const data = await studentMentorService.getStudentOutcomes(req.user!.organizationId, student as any);
        res.status(200).json(formatSuccessResponse(data));
      } else {
        res.status(200).json(formatSuccessResponse([]));
      }
    } catch (err) {
      next(err);
    }
  }

  async getFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await studentMentorService.getMentorFeedback(req.user!.organizationId, req.user!);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await studentMentorService.getMentorDocuments(req.user!.organizationId, req.user!);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(
        formatSuccessResponse({
          id: req.user!.id,
          firstName: req.user!.firstName,
          lastName: req.user!.lastName,
          email: req.user!.email,
          role: req.user!.role,
          company: 'Google Cloud Solutions',
          designation: 'Staff Solutions Architect & Technical Mentor',
        })
      );
    } catch (err) {
      next(err);
    }
  }
}

export const mentorController = new MentorController();
