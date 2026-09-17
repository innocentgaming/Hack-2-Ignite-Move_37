import { Request, Response, NextFunction } from 'express';
import { workflowService } from '../services/workflow.service.js';
import { formatSuccessResponse } from '@internos/shared';
import { UserRole } from '@internos/types';

export class WorkflowController {
  // ==========================================
  // Template Management
  // ==========================================

  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const templates = await workflowService.getTemplates(orgId);
      return res.json(formatSuccessResponse(templates));
    } catch (err) {
      next(err);
    }
  }

  async getTemplateById(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const template = await workflowService.getTemplateById(orgId, req.params.templateId);
      return res.json(formatSuccessResponse(template));
    } catch (err) {
      next(err);
    }
  }

  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const template = await workflowService.createTemplate(orgId, req.body, req.user?.id);
      return res.status(201).json(formatSuccessResponse(template));
    } catch (err) {
      next(err);
    }
  }

  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const template = await workflowService.updateTemplate(orgId, req.params.templateId, req.body, req.user?.id);
      return res.json(formatSuccessResponse(template));
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Automatic Assignment & Instances
  // ==========================================

  async assignWorkflow(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const instance = await workflowService.assignWorkflowToInternship(orgId, req.params.internshipId, req.user?.id);
      return res.status(201).json(formatSuccessResponse(instance));
    } catch (err) {
      next(err);
    }
  }

  async getInstanceByInternshipId(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const instance = await workflowService.getInstanceByInternshipId(orgId, req.params.internshipId);
      return res.json(formatSuccessResponse(instance));
    } catch (err) {
      next(err);
    }
  }

  async getInstanceById(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const instance = await workflowService.getInstanceById(orgId, req.params.instanceId);
      return res.json(formatSuccessResponse(instance));
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Workflow Tasks & Submissions
  // ==========================================

  async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const role = req.query.role ? (req.query.role as UserRole) : undefined;
      const tasks = await workflowService.getTasks(orgId, role);
      return res.json(formatSuccessResponse(tasks));
    } catch (err) {
      next(err);
    }
  }

  async submitTask(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const task = await workflowService.submitTask(orgId, req.params.taskId, req.user?.id);
      return res.json(formatSuccessResponse(task));
    } catch (err) {
      next(err);
    }
  }

  async grantExtension(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const task = await workflowService.grantExtension(orgId, req.params.taskId, req.body, req.user!.id);
      return res.json(formatSuccessResponse(task));
    } catch (err) {
      next(err);
    }
  }
}

export const workflowController = new WorkflowController();
