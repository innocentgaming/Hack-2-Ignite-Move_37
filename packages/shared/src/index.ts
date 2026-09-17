import { ApiResponse, UserRole } from '@internos/types';

// ==========================================
// Centralized Error Hierarchy
// ==========================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id?: string) {
    super(id ? `${entity} with id '${id}' was not found` : `${entity} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions for this operation') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class TenantViolationError extends AppError {
  constructor(message = 'Cross-tenant access prohibited') {
    super(message, 403, 'TENANT_ISOLATION_VIOLATION');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class NotImplementedError extends AppError {
  constructor(message = 'Feature not implemented in Phase 0') {
    super(message, 501, 'NOT_IMPLEMENTED_PHASE_0');
  }
}

// ==========================================
// Response Formatters
// ==========================================

export function formatSuccessResponse<T>(data: T, meta?: ApiResponse<T>['meta']): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

export function formatErrorResponse(
  message: string,
  code = 'INTERNAL_ERROR',
  details?: unknown,
  path?: string
): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      path,
    },
  };
}

// ==========================================
// Role-Based Access Control (RBAC) Foundation
// ==========================================

export type Permission =
  // 1. Institution
  | 'institution:read'
  | 'institution:manage'
  // 2. Department
  | 'department:read'
  | 'department:manage'
  // 3. Users
  | 'users:read'
  | 'users:invite'
  | 'users:manage'
  // 4. Workflows
  | 'workflows:read'
  | 'workflows:manage'
  // 5. Internships
  | 'internships:read'
  | 'internships:create'
  | 'internships:manage'
  // 6. Approvals
  | 'approvals:read'
  | 'approvals:manage'
  // 7. Mentor Assignment
  | 'mentor_assignment:read'
  | 'mentor_assignment:manage'
  // 8. Submissions
  | 'submissions:read'
  | 'submissions:create'
  | 'submissions:manage'
  // 9. Reviews
  | 'reviews:read'
  | 'reviews:create'
  | 'reviews:manage'
  // 10. Evaluations
  | 'evaluations:read'
  | 'evaluations:create'
  | 'evaluations:manage'
  // 11. Completion
  | 'completion:read'
  | 'completion:manage'
  // 12. Monitoring
  | 'monitoring:read'
  | 'monitoring:manage'
  // Documents
  | 'documents:read'
  | 'documents:upload'
  | 'documents:manage';

export function normalizeRole(role: UserRole | string): UserRole {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'INSTITUTION_ADMIN':
    case 'ADMIN':
      return UserRole.ADMIN;
    case 'HOD':
      return UserRole.HOD;
    case 'FACULTY_SUPERVISOR':
    case 'FACULTY':
      return UserRole.FACULTY;
    case 'INDUSTRY_MENTOR':
    case 'MENTOR':
      return UserRole.MENTOR;
    case 'STUDENT':
    default:
      return UserRole.STUDENT;
  }
}

const ADMIN_PERMISSIONS: Permission[] = [
  'institution:read',
  'institution:manage',
  'department:read',
  'department:manage',
  'users:read',
  'users:invite',
  'users:manage',
  'workflows:read',
  'workflows:manage',
  'internships:read',
  'internships:create',
  'internships:manage',
  'approvals:read',
  'approvals:manage',
  'mentor_assignment:read',
  'mentor_assignment:manage',
  'submissions:read',
  'submissions:create',
  'submissions:manage',
  'reviews:read',
  'reviews:create',
  'reviews:manage',
  'evaluations:read',
  'evaluations:create',
  'evaluations:manage',
  'completion:read',
  'completion:manage',
  'monitoring:read',
  'monitoring:manage',
  'documents:read',
  'documents:upload',
  'documents:manage',
];

const HOD_PERMISSIONS: Permission[] = [
  'institution:read',
  'department:read',
  'department:manage',
  'users:read',
  'users:invite',
  'workflows:read',
  'workflows:manage',
  'internships:read',
  'internships:manage',
  'approvals:read',
  'approvals:manage',
  'mentor_assignment:read',
  'mentor_assignment:manage',
  'submissions:read',
  'reviews:read',
  'evaluations:read',
  'evaluations:manage',
  'completion:read',
  'completion:manage',
  'monitoring:read',
  'monitoring:manage',
  'documents:read',
  'documents:upload',
];

const FACULTY_PERMISSIONS: Permission[] = [
  'institution:read',
  'department:read',
  'users:read',
  'workflows:read',
  'internships:read',
  'approvals:read',
  'approvals:manage',
  'mentor_assignment:read',
  'submissions:read',
  'reviews:read',
  'reviews:create',
  'evaluations:read',
  'evaluations:create',
  'completion:read',
  'monitoring:read',
  'documents:read',
  'documents:upload',
];

const STUDENT_PERMISSIONS: Permission[] = [
  'institution:read',
  'department:read',
  'workflows:read',
  'internships:read',
  'internships:create',
  'submissions:read',
  'submissions:create',
  'reviews:read',
  'evaluations:read',
  'completion:read',
  'documents:read',
  'documents:upload',
];

const MENTOR_PERMISSIONS: Permission[] = [
  'internships:read',
  'mentor_assignment:read',
  'submissions:read',
  'reviews:read',
  'reviews:create',
  'reviews:manage',
  'evaluations:read',
  'evaluations:create',
  'completion:read',
  'monitoring:read',
  'documents:read',
  'documents:upload',
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: ADMIN_PERMISSIONS,
  [UserRole.HOD]: HOD_PERMISSIONS,
  [UserRole.FACULTY]: FACULTY_PERMISSIONS,
  [UserRole.STUDENT]: STUDENT_PERMISSIONS,
  [UserRole.MENTOR]: MENTOR_PERMISSIONS,
  // Legacy aliases
  [UserRole.SUPER_ADMIN]: ADMIN_PERMISSIONS,
  [UserRole.INSTITUTION_ADMIN]: ADMIN_PERMISSIONS,
  [UserRole.FACULTY_SUPERVISOR]: FACULTY_PERMISSIONS,
  [UserRole.INDUSTRY_MENTOR]: MENTOR_PERMISSIONS,
};

export function hasPermission(role: UserRole | string, permission: Permission): boolean {
  const norm = normalizeRole(role);
  return ROLE_PERMISSIONS[norm]?.includes(permission) ?? false;
}

export * from '@internos/types';
