import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError, normalizeRole } from '@internos/shared';
import { JwtPayload, UserStatus } from '@internos/types';
import { env } from '../config/env.js';

// Token blacklist for revoked tokens / logout
const revokedTokens = new Set<string>();

export function revokeToken(token: string): void {
  revokedTokens.add(token);
}

export function isTokenRevoked(token: string): boolean {
  return revokedTokens.has(token);
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.user && req.user.id) {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1];

    if (!token || isTokenRevoked(token)) {
      throw new UnauthorizedError('Token has been revoked or is invalid');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const normalizedRole = normalizeRole(decoded.role);

    // Verify user account status from auth store / database to prevent disabled users from accessing protected resources
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { authStore } = await import('../services/auth.service.js');
    const existingUser = authStore.users.get(decoded.userId);
    if (existingUser) {
      if (existingUser.status === UserStatus.INACTIVE || existingUser.status === UserStatus.SUSPENDED) {
        throw new ForbiddenError(`User account is ${existingUser.status.toLowerCase()}. Access denied.`);
      }
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: normalizedRole,
      status: existingUser?.status || UserStatus.ACTIVE,
      organizationId: decoded.organizationId,
      organizationCode: decoded.organizationCode,
      firstName: existingUser?.firstName || '',
      lastName: existingUser?.lastName || '',
    };

    req.organizationId = decoded.organizationId;
    next();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      next(error);
      return;
    }
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token has expired'));
      return;
    }
    next(new UnauthorizedError('Invalid authorization token'));
  }
}

// Explicit naming requirement: auth middleware
export const authMiddleware = authenticate;
