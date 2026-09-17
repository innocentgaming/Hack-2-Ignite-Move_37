import { Request, Response, NextFunction } from 'express';
import { monitoringService } from '../services/monitoring.service.js';
import { healthCalculationService } from '../services/health-calculation.service.js';
import { formatSuccessResponse } from '@internos/shared';

export class MonitoringController {
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const overview = await monitoringService.getMonitoringOverview(user.organizationId, user);
      res.json(formatSuccessResponse(overview));
    } catch (error) {
      next(error);
    }
  }

  async getInternships(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { departmentId, facultyId, mentorId, companyId, status, health, search } = req.query;

      const internships = await monitoringService.getMonitoredInternships(user.organizationId, user, {
        departmentId: departmentId as string,
        facultyId: facultyId as string,
        mentorId: mentorId as string,
        companyId: companyId as string,
        status: status as string,
        health: health as string,
        search: search as string,
      });

      res.json(formatSuccessResponse(internships));
    } catch (error) {
      next(error);
    }
  }

  async getAttentionQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const queue = await monitoringService.getAttentionQueue(user.organizationId, user);
      res.json(formatSuccessResponse(queue));
    } catch (error) {
      next(error);
    }
  }

  async getLifecycleTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const timeline = await monitoringService.getLifecycleTimeline(user.organizationId, user, id);
      res.json(formatSuccessResponse(timeline));
    } catch (error) {
      next(error);
    }
  }

  async getInternshipHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const health = healthCalculationService.calculateHealth(user.organizationId, id);
      res.json(formatSuccessResponse(health));
    } catch (error) {
      next(error);
    }
  }

  async getThresholds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const thresholds = healthCalculationService.getOrganizationThresholds(user.organizationId);
      res.json(formatSuccessResponse(thresholds));
    } catch (error) {
      next(error);
    }
  }

  async updateThresholds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const updated = healthCalculationService.setOrganizationThresholds(user.organizationId, req.body);
      res.json(formatSuccessResponse(updated));
    } catch (error) {
      next(error);
    }
  }
}

export const monitoringController = new MonitoringController();
