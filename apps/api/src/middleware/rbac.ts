import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError, Permission, hasPermission } from '@internos/shared';
import { UserRole } from '@internos/types';

/**
 * Require specific user role(s) to access the endpoint.
 */
export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.user.role === UserRole.SUPER_ADMIN) {
      return next(); // Super admin has global bypass
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Role '${req.user.role}' is not authorized to access this resource. Allowed: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
}

/**
 * Require specific granular permission(s).
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.user.role === UserRole.SUPER_ADMIN) {
      return next();
    }

    if (!hasPermission(req.user.role, permission)) {
      throw new ForbiddenError(
        `User role '${req.user.role}' lacks required permission '${permission}'`
      );
    }

    next();
  };
}
