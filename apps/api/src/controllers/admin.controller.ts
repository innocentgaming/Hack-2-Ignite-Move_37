import { Request, Response, NextFunction } from 'express';
import { tenantService } from '../services/tenant.service.js';
import { authService } from '../services/auth.service.js';
import { auditService } from '../services/audit.service.js';
import { csvImportService } from '../services/csvImport.service.js';
import { mentorImportService } from '../services/mentorImport.service.js';
import { ValidationError, formatSuccessResponse } from '@internos/shared';
import { UserRole, UserStatus } from '@internos/types';

export class AdminController {
  // ==========================================
  // Institution & Settings
  // ==========================================

  async getInstitutionProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const profile = await tenantService.getInstitutionProfile(orgId);
      return res.json(formatSuccessResponse(profile));
    } catch (err) {
      next(err);
    }
  }

  async updateInstitutionProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const profile = await tenantService.updateInstitutionProfile(orgId, req.body, req.user?.id);
      return res.json(formatSuccessResponse(profile));
    } catch (err) {
      next(err);
    }
  }

  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const settings = await tenantService.getSettings(orgId);
      return res.json(formatSuccessResponse(settings));
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const settings = await tenantService.updateSettings(orgId, req.body, req.user?.id);
      return res.json(formatSuccessResponse(settings));
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Department Management
  // ==========================================

  async getDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const depts = await tenantService.getDepartments(orgId);
      return res.json(formatSuccessResponse(depts));
    } catch (err) {
      next(err);
    }
  }

  async getDepartmentById(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const dept = await tenantService.getDepartmentById(orgId, req.params.departmentId);
      return res.json(formatSuccessResponse(dept));
    } catch (err) {
      next(err);
    }
  }

  async createDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const dept = await tenantService.createDepartment(orgId, req.body, req.user?.id);
      return res.status(201).json(formatSuccessResponse(dept));
    } catch (err) {
      next(err);
    }
  }

  async updateDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const dept = await tenantService.updateDepartment(orgId, req.params.departmentId, req.body, req.user?.id);
      return res.json(formatSuccessResponse(dept));
    } catch (err) {
      next(err);
    }
  }

  async toggleDepartmentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        throw new ValidationError('isActive boolean field is required');
      }
      const dept = await tenantService.toggleDepartmentActive(orgId, req.params.departmentId, isActive, req.user?.id);
      return res.json(formatSuccessResponse(dept));
    } catch (err) {
      next(err);
    }
  }



  async getDepartmentStats(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const stats = await tenantService.getDepartmentStats(orgId, req.params.departmentId);
      return res.json(formatSuccessResponse(stats));
    } catch (err) {
      next(err);
    }
  }

  async getDepartmentUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const users = await tenantService.getDepartmentUsers(orgId, req.params.departmentId);
      return res.json(formatSuccessResponse(users));
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // User Management
  // ==========================================

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const filter = {
        role: req.query.role ? (req.query.role as UserRole) : undefined,
        departmentId: req.query.departmentId as string,
        status: req.query.status ? (req.query.status as UserStatus) : undefined,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };
      const result = await tenantService.getUsersWithFilter(orgId, filter);
      return res.json(formatSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const user = await tenantService.createUser(orgId, req.body, req.user?.id);
      return res.status(201).json(formatSuccessResponse(user));
    } catch (err) {
      next(err);
    }
  }

  async inviteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const inviteResult = await authService.inviteUser(orgId, req.body);
      await auditService.log({
        organizationId: orgId,
        userId: req.user?.id,
        action: 'USER_INVITATION_SENT',
        entity: 'User',
        entityId: inviteResult.userId,
        details: { email: inviteResult.email, role: inviteResult.role },
      });
      return res.status(201).json(formatSuccessResponse(inviteResult));
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const user = await tenantService.updateUser(orgId, req.params.userId, req.body, req.user?.id);
      return res.json(formatSuccessResponse(user));
    } catch (err) {
      next(err);
    }
  }

  async toggleUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        throw new ValidationError('isActive boolean is required');
      }
      const user = await tenantService.toggleUserActive(orgId, req.params.userId, isActive, req.user?.id);
      return res.json(formatSuccessResponse(user));
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // CSV Student Import Pipeline
  // ==========================================

  async parseAndPreviewCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const { csvContent } = req.body;
      if (!csvContent) {
        throw new ValidationError('csvContent text string is required in the body');
      }
      const preview = await csvImportService.processCSVPreview(orgId, csvContent);
      return res.json(formatSuccessResponse(preview));
    } catch (err) {
      next(err);
    }
  }

  async cancelImportPreview(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const { previewToken } = req.body;
      if (!previewToken) {
        throw new ValidationError('previewToken is required');
      }
      const result = await csvImportService.cancelPreview(orgId, previewToken);
      return res.json(formatSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  async confirmCSVImport(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const { previewToken, defaultPassword } = req.body;
      if (!previewToken) {
        throw new ValidationError('previewToken is required for confirmation');
      }
      const result = await csvImportService.confirmImport(orgId, previewToken, defaultPassword, req.user?.id);
      return res.status(201).json(formatSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // CSV Mentor Bulk Import Pipeline
  // ==========================================

  async getMentorImportTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = mentorImportService.getCSVTemplate();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="mentors_import_template.csv"');
      return res.send(csv);
    } catch (err) {
      next(err);
    }
  }

  async parseAndPreviewMentorCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const { csvContent } = req.body;
      if (!csvContent || typeof csvContent !== 'string') {
        throw new ValidationError('csvContent string is required in the body');
      }
      const preview = await mentorImportService.processMentorCSVPreview(orgId, csvContent);
      return res.json(formatSuccessResponse(preview));
    } catch (err) {
      next(err);
    }
  }

  async confirmMentorCSVImport(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const { previewToken } = req.body;
      if (!previewToken) {
        throw new ValidationError('previewToken is required for mentor confirmation');
      }
      const result = await mentorImportService.confirmMentorCSVImport(orgId, previewToken, req.user?.id);
      return res.status(201).json(formatSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Audit Logs
  // ==========================================

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const query = {
        action: req.query.action as string,
        entity: req.query.entity as string,
        userId: req.query.userId as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };
      const result = await auditService.getLogs(orgId, query);
      return res.json(formatSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Dynamic Dashboards
  // ==========================================

  async getAdminDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const metrics = await tenantService.getAdminDashboardMetrics(orgId);
      return res.json(formatSuccessResponse(metrics));
    } catch (err) {
      next(err);
    }
  }

  async getHODDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const metrics = await tenantService.getAdminDashboardMetrics(orgId);
      return res.json(formatSuccessResponse(metrics));
    } catch (err) {
      next(err);
    }
  }

  async getFacultyDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const metrics = await tenantService.getAdminDashboardMetrics(orgId);
      return res.json(formatSuccessResponse(metrics));
    } catch (err) {
      next(err);
    }
  }

  async getMentorDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const metrics = await tenantService.getMentorDashboardMetrics(orgId, req.user!.id);
      return res.json(formatSuccessResponse(metrics));
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
