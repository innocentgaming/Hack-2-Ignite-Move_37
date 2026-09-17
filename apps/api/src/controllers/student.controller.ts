import { Request, Response, NextFunction } from 'express';
import { studentMentorService } from '../services/student-mentor.service.js';
import { formatSuccessResponse, ValidationError } from '@internos/shared';

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

  async updateSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await studentMentorService.updateStudentSubmission(req.user!.organizationId, req.user!, id, req.body);
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

  async getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await studentMentorService.getStudentDocumentById(req.user!.organizationId, req.user!, id);
      res.status(200).json(formatSuccessResponse(data));
    } catch (err) {
      next(err);
    }
  }

  async viewDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const fileData = await studentMentorService.getStudentDocumentFile(req.user!.organizationId, req.user!, id);
      res.setHeader('Content-Type', fileData.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileData.filename)}"`);
      res.send(fileData.buffer);
    } catch (err) {
      next(err);
    }
  }

  async downloadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const fileData = await studentMentorService.getStudentDocumentFile(req.user!.organizationId, req.user!, id);
      res.setHeader('Content-Type', fileData.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileData.filename)}"`);
      res.send(fileData.buffer);
    } catch (err) {
      next(err);
    }
  }

  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filename, mimeType, contentBase64, documentType } = req.body;
      if (!filename || !contentBase64) {
        throw new ValidationError('Filename and base64 encoded document content are required');
      }
      const buffer = Buffer.from(contentBase64, 'base64');
      const data = await studentMentorService.uploadStudentDocument(req.user!.organizationId, req.user!, {
        filename,
        mimeType: mimeType || 'application/pdf',
        buffer,
        documentType,
      });
      res.status(201).json(formatSuccessResponse(data));
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
