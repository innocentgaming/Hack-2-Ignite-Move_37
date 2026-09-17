import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

export const adminRouter = Router();

// All routes require valid JWT and tenant context
adminRouter.use(authenticate);

// ==========================================
// Dashboards (Role-based endpoints)
// ==========================================
adminRouter.get(
  '/dashboards/admin',
  requirePermission('monitoring:read'),
  adminController.getAdminDashboard.bind(adminController)
);

adminRouter.get(
  '/dashboards/hod',
  requirePermission('monitoring:read'),
  adminController.getHODDashboard.bind(adminController)
);

adminRouter.get(
  '/dashboards/faculty',
  requirePermission('monitoring:read'),
  adminController.getFacultyDashboard.bind(adminController)
);

adminRouter.get(
  '/dashboards/mentor',
  requirePermission('monitoring:read'),
  adminController.getMentorDashboard.bind(adminController)
);

// ==========================================
// Institution Profile & Settings
// ==========================================
adminRouter.get(
  '/institution',
  requirePermission('institution:read'),
  adminController.getInstitutionProfile.bind(adminController)
);

adminRouter.put(
  '/institution',
  requirePermission('institution:manage'),
  adminController.updateInstitutionProfile.bind(adminController)
);

adminRouter.get(
  '/settings',
  requirePermission('settings:manage'),
  adminController.getSettings.bind(adminController)
);

adminRouter.put(
  '/settings',
  requirePermission('settings:manage'),
  adminController.updateSettings.bind(adminController)
);

// ==========================================
// Department Management
// ==========================================
adminRouter.get(
  '/departments',
  requirePermission('department:read'),
  adminController.getDepartments.bind(adminController)
);

adminRouter.post(
  '/departments',
  requirePermission('department:manage'),
  adminController.createDepartment.bind(adminController)
);

adminRouter.get(
  '/departments/:departmentId',
  requirePermission('department:read'),
  adminController.getDepartmentById.bind(adminController)
);

adminRouter.put(
  '/departments/:departmentId',
  requirePermission('department:manage'),
  adminController.updateDepartment.bind(adminController)
);

adminRouter.patch(
  '/departments/:departmentId/status',
  requirePermission('department:manage'),
  adminController.toggleDepartmentStatus.bind(adminController)
);

adminRouter.patch(
  '/departments/:departmentId/hod',
  requirePermission('department:manage'),
  adminController.assignDepartmentHOD.bind(adminController)
);

adminRouter.get(
  '/departments/:departmentId/stats',
  requirePermission('department:read'),
  adminController.getDepartmentStats.bind(adminController)
);

adminRouter.get(
  '/departments/:departmentId/users',
  requirePermission('department:read'),
  adminController.getDepartmentUsers.bind(adminController)
);

// ==========================================
// User Management
// ==========================================
adminRouter.get(
  '/users',
  requirePermission('users:read'),
  adminController.getUsers.bind(adminController)
);

adminRouter.post(
  '/users',
  requirePermission('users:manage'),
  adminController.createUser.bind(adminController)
);

adminRouter.post(
  '/users/invite',
  requirePermission('users:invite'),
  adminController.inviteUser.bind(adminController)
);

adminRouter.put(
  '/users/:userId',
  requirePermission('users:manage'),
  adminController.updateUser.bind(adminController)
);

adminRouter.patch(
  '/users/:userId/status',
  requirePermission('users:manage'),
  adminController.toggleUserStatus.bind(adminController)
);

// ==========================================
// CSV Student Import Pipeline
// ==========================================
adminRouter.post(
  '/students/import/preview',
  requirePermission('students:import'),
  adminController.parseAndPreviewCSV.bind(adminController)
);

adminRouter.post(
  '/students/import/cancel',
  requirePermission('students:import'),
  adminController.cancelImportPreview.bind(adminController)
);

adminRouter.post(
  '/students/import/confirm',
  requirePermission('students:import'),
  adminController.confirmCSVImport.bind(adminController)
);

// ==========================================
// Audit Logs
// ==========================================
adminRouter.get(
  '/audit-logs',
  requirePermission('audit:read'),
  adminController.getAuditLogs.bind(adminController)
);
