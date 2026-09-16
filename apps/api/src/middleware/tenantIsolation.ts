import { Request, Response, NextFunction } from 'express';
import { TenantViolationError, ForbiddenError, UnauthorizedError } from '@internos/shared';
import { UserRole } from '@internos/types';

/**
 * Server-side Multi-Tenant Isolation Middleware
 *
 * Rules:
 * 1. An authenticated session determines the tenant context (req.user.organizationId).
 * 2. Never trust client-supplied organizationId headers or body fields.
 * 3. Any attempt by non-SUPER_ADMIN users to supply a differing organizationId is blocked.
 * 4. Ensures req.organizationId is strictly bound for downstream controllers and Prisma queries.
 */
export function tenantIsolation(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    throw new UnauthorizedError('Tenant isolation requires an authenticated user');
  }

  const authenticatedOrgId = req.user.organizationId;

  if (!authenticatedOrgId) {
    throw new ForbiddenError('User is not assigned to any active organization/institution');
  }

  // Check if client attempted to pass an untrusted organizationId in query or body
  const untrustedOrgId =
    req.body?.organizationId ||
    req.query?.organizationId ||
    req.headers['x-organization-override'];

  if (untrustedOrgId && untrustedOrgId !== authenticatedOrgId) {
    // Only SUPER_ADMIN can cross-cut or switch tenant views
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new TenantViolationError(
        `Cross-tenant access prohibited. You cannot access or modify records for organization '${untrustedOrgId}'.`
      );
    }
  }

  // Force authoritative organizationId on the request
  req.organizationId = authenticatedOrgId;
  next();
}

/**
 * Tenant scoping helper for Prisma queries.
 * Guarantees every query filter has { organizationId } attached.
 */
export function withTenantScope<T extends Record<string, unknown>>(
  req: Request,
  where: T = {} as T
): T & { organizationId: string } {
  if (!req.organizationId) {
    throw new TenantViolationError('No authoritative tenant context found on request');
  }
  return {
    ...where,
    organizationId: req.organizationId,
  };
}
