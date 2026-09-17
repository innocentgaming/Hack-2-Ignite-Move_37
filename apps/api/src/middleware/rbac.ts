import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError, Permission, hasPermission, normalizeRole } from '@internos/shared';
import { UserRole } from '@internos/types';

/**
 * Require specific user role(s) to access the endpoint.
 * Returns 403 Forbidden on role mismatch.
 */
export function requireRoles(...allowedRoles: (UserRole | string)[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const currentRole = normalizeRole(req.user.role);
    const normalizedAllowed = allowedRoles.map(normalizeRole);

    if (!normalizedAllowed.includes(currentRole)) {
      throw new ForbiddenError(
        `Role '${req.user.role}' is not authorized to access this resource. Required one of: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
}

/**
 * Require specific granular permission(s).
 * Centralized authorization check returning 403 on permission lack.
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!hasPermission(req.user.role, permission)) {
      throw new ForbiddenError(
        `User role '${req.user.role}' lacks required permission '${permission}'`
      );
    }

    next();
  };
}

// Explicit naming requirements: role middleware, permission middleware
export const roleMiddleware = requireRoles;
export const permissionMiddleware = requirePermission;
