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
  | 'tenants:manage'
  | 'users:read'
  | 'users:manage'
  | 'departments:manage'
  | 'internships:create'
  | 'internships:read_all'
  | 'internships:read_assigned'
  | 'internships:approve'
  | 'submissions:create'
  | 'submissions:review'
  | 'evaluations:manage'
  | 'outcomes:manage'
  | 'documents:upload'
  | 'documents:read';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    'tenants:manage',
    'users:read',
    'users:manage',
    'departments:manage',
    'internships:read_all',
    'internships:approve',
    'submissions:review',
    'evaluations:manage',
    'outcomes:manage',
    'documents:upload',
    'documents:read',
  ],
  [UserRole.INSTITUTION_ADMIN]: [
    'users:read',
    'users:manage',
    'departments:manage',
    'internships:read_all',
    'internships:approve',
    'evaluations:manage',
    'outcomes:manage',
    'documents:upload',
    'documents:read',
  ],
  [UserRole.FACULTY_SUPERVISOR]: [
    'users:read',
    'internships:read_assigned',
    'internships:approve',
    'submissions:review',
    'evaluations:manage',
    'documents:upload',
    'documents:read',
  ],
  [UserRole.INDUSTRY_MENTOR]: [
    'internships:read_assigned',
    'submissions:review',
    'evaluations:manage',
    'documents:upload',
    'documents:read',
  ],
  [UserRole.STUDENT]: [
    'internships:create',
    'internships:read_assigned',
    'submissions:create',
    'documents:upload',
    'documents:read',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export * from '@internos/types';
