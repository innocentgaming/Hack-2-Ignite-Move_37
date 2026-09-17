import { Request, Response, NextFunction } from 'express';
import { aiAnalysisService } from '../services/ai/ai-analysis.service.js';
import { formatSuccessResponse, NotFoundError } from '@internos/shared';

export class AIController {
  /**
   * GET /api/v1/ai/submissions/:submissionId/analysis
   * Retrieve latest AI analysis record for a submission.
   */
  async getSubmissionAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.organizationId!;
      const submissionId = req.params.submissionId;

      const analysis = aiAnalysisService.getSubmissionAnalysis(organizationId, submissionId);
      if (!analysis) {
        throw new NotFoundError('AIAnalysis', submissionId);
      }

      res.status(200).json(formatSuccessResponse(analysis));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/ai/submissions/:submissionId/analyze
   * Trigger or retry AI analysis for a submission.
   */
  async retrySubmissionAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.organizationId!;
      const submissionId = req.params.submissionId;

      const analysis = await aiAnalysisService.retryAnalysis(organizationId, submissionId);

      res.status(200).json(formatSuccessResponse(analysis));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/ai/internships/:internshipId/insights
   * Retrieve aggregated AI insights for an internship across all analyzed milestones.
   * Strictly advisory for faculty/mentors beside deterministic monitoring.
   */
  async getInternshipAIInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.organizationId!;
      const internshipId = req.params.internshipId;

      const insights = aiAnalysisService.getInternshipAIInsights(organizationId, internshipId);

      res.status(200).json(formatSuccessResponse(insights));
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();
