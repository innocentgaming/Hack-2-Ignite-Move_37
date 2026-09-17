import { Request, Response, NextFunction } from 'express';
import { TenantViolationError, ForbiddenError, UnauthorizedError } from '@internos/shared';

/**
 * Server-side Multi-Tenant Isolation Middleware
 *
 * Rules:
 * 1. An authenticated session determines the tenant context (req.user.organizationId).
 * 2. Never trust client-supplied organizationId headers, query params, or body fields.
 * 3. Any attempt to supply a differing organizationId is strictly blocked with 403.
 * 4. Ensures req.organizationId is strictly bound for downstream controllers and database queries.
 */
export function tenantIsolation(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    throw new UnauthorizedError('Tenant isolation requires an authenticated user');
  }

  const authenticatedOrgId = req.user.organizationId;

  if (!authenticatedOrgId) {
    throw new ForbiddenError('User is not assigned to any active organization/institution');
  }

  // Check if client attempted to pass an untrusted organizationId in body, query, params, or headers
  const untrustedOrgId =
    req.body?.organizationId ||
    req.body?.tenantId ||
    req.body?.orgId ||
    req.query?.organizationId ||
    req.query?.tenantId ||
    req.query?.orgId ||
    req.params?.organizationId ||
    req.params?.tenantId ||
    req.headers['x-organization-id'] ||
    req.headers['x-organization-override'] ||
    req.headers['x-tenant-id'] ||
    req.headers['x-institution-id'] ||
    req.headers['x-org-id'];

  if (untrustedOrgId && untrustedOrgId !== authenticatedOrgId) {
    throw new TenantViolationError(
      `Cross-tenant access prohibited. You cannot access or modify records outside your organization.`
    );
  }

  // Force authoritative organizationId on the request
  req.organizationId = authenticatedOrgId;

  // Overwrite body organizationId if body exists
  if (req.body && typeof req.body === 'object') {
    req.body.organizationId = authenticatedOrgId;
  }

  next();
}

/**
 * Tenant scoping helper for database queries.
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

// Explicit naming requirement: tenant middleware
export const tenantMiddleware = tenantIsolation;
