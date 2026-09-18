import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import { AnalyticsFilterQuery } from '@internos/types';
import { ValidationError } from '@internos/shared';

export class AnalyticsController {
  /**
   * GET /api/v1/analytics
   * Retrieve comprehensive institutional analytics with optional department & date filters.
   * Supports ?format=csv for direct file download.
   */
  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.organizationId || req.user?.organizationId;
      if (!organizationId) {
        throw new ValidationError('Organization ID is required');
      }

      const query: AnalyticsFilterQuery = {
        departmentId: req.query.departmentId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        internshipId: req.query.internshipId as string | undefined,
        studentId: req.query.studentId as string | undefined,
        mentorId: req.query.mentorId as string | undefined,
        companyId: req.query.companyId as string | undefined,
        status: req.query.status as any,
        type: req.query.type as string | undefined,
        search: req.query.search as string | undefined,
        format: req.query.format as string | undefined,
      };

      const analytics = await analyticsService.getInstitutionalAnalytics(
        organizationId,
        req.user!,
        query
      );

      if (query.format === 'csv') {
        const csvContent = analyticsService.generateAnalyticsCsv(analytics);
        const filename = `internos-analytics-${organizationId.slice(0, 8)}-${Date.now()}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(csvContent);
        return;
      }

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/analytics/export
   * Dedicated CSV export endpoint with automatic file streaming
   */
  async exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.organizationId || req.user?.organizationId;
      if (!organizationId) {
        throw new ValidationError('Organization ID is required');
      }

      const query: AnalyticsFilterQuery = {
        departmentId: req.query.departmentId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        internshipId: req.query.internshipId as string | undefined,
        studentId: req.query.studentId as string | undefined,
        mentorId: req.query.mentorId as string | undefined,
        companyId: req.query.companyId as string | undefined,
        status: req.query.status as any,
        type: req.query.type as string | undefined,
        search: req.query.search as string | undefined,
        format: 'csv',
      };

      const analytics = await analyticsService.getInstitutionalAnalytics(
        organizationId,
        req.user!,
        query
      );

      const csvContent = analyticsService.generateAnalyticsCsv(analytics);
      const filename = `internos-institutional-analytics-${Date.now()}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/analytics/departments/:departmentId
   * Scoped department analytics endpoint
   */
  async getDepartmentAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.organizationId || req.user?.organizationId;
      if (!organizationId) {
        throw new ValidationError('Organization ID is required');
      }

      const departmentId = req.params.departmentId;

      const query: AnalyticsFilterQuery = {
        departmentId,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };

      const analytics = await analyticsService.getInstitutionalAnalytics(
        organizationId,
        req.user!,
        query
      );

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/analytics/students-roster
   */
  async getStudentsRoster(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.organizationId || req.user?.organizationId;
      if (!organizationId) {
        throw new ValidationError('Organization ID is required');
      }

      const departmentId = req.query.departmentId as string | undefined;
      const roster = await analyticsService.getStudentsRoster(organizationId, departmentId);

      res.status(200).json({
        success: true,
        data: roster,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/analytics/ai-assess
   * Assess student internship progress using Groq AI
   */
  async assessStudentProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.organizationId || req.user?.organizationId;
      if (!organizationId) {
        throw new ValidationError('Organization ID is required');
      }

      const { studentId, internshipId } = req.body;
      if (!studentId) {
        throw new ValidationError('studentId is required in request body');
      }

      const assessment = await analyticsService.assessStudentProgressWithAI(
        organizationId,
        studentId,
        internshipId
      );

      res.status(200).json({
        success: true,
        data: assessment,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
