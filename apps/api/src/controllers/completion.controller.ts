import { Request, Response, NextFunction } from 'express';
import { completionService } from '../services/completion.service.js';
import { formatSuccessResponse } from '@internos/shared';

export class CompletionController {
  async checkPrerequisites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { internshipId } = req.params;
      const checklist = completionService.verifyPrerequisites(req.organizationId!, internshipId);
      res.json(formatSuccessResponse(checklist));
    } catch (error) {
      next(error);
    }
  }

  async submitFinalEvaluation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const evaluation = await completionService.submitFinalEvaluation(
        req.organizationId!,
        req.user!,
        req.body
      );
      res.status(201).json(formatSuccessResponse(evaluation));
    } catch (error) {
      next(error);
    }
  }

  async updateFinalEvaluation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await completionService.updateFinalEvaluation(
        req.organizationId!,
        req.user!,
        id,
        req.body
      );
      res.json(formatSuccessResponse(updated));
    } catch (error) {
      next(error);
    }
  }

  async getFinalEvaluation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { internshipId } = req.params;
      const evaluation = await completionService.getFinalEvaluation(req.organizationId!, internshipId);
      res.json(formatSuccessResponse(evaluation));
    } catch (error) {
      next(error);
    }
  }

  async confirmCompletion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await completionService.confirmCompletionByFaculty(
        req.organizationId!,
        req.user!,
        req.body
      );
      res.json(formatSuccessResponse({ status }));
    } catch (error) {
      next(error);
    }
  }

  async getCompletedDossier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { internshipId } = req.params;
      const dossier = await completionService.getCompletedDossier(
        req.organizationId!,
        req.user!,
        internshipId
      );
      res.json(formatSuccessResponse(dossier));
    } catch (error) {
      next(error);
    }
  }

  async requestTermination(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = await completionService.requestTerminationByMentor(
        req.organizationId!,
        req.user!,
        req.body
      );
      res.status(201).json(formatSuccessResponse(request));
    } catch (error) {
      next(error);
    }
  }

  async decideTermination(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await completionService.decideTermination(
        req.organizationId!,
        req.user!,
        req.body
      );
      res.json(formatSuccessResponse({ status }));
    } catch (error) {
      next(error);
    }
  }

  async cancelInternship(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { internshipId, reason } = req.body;
      const status = await completionService.cancelInternship(
        req.organizationId!,
        req.user!,
        internshipId,
        reason
      );
      res.json(formatSuccessResponse({ status }));
    } catch (error) {
      next(error);
    }
  }
}

export const completionController = new CompletionController();
