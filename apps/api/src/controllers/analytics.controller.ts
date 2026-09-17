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
}

export const analyticsController = new AnalyticsController();
