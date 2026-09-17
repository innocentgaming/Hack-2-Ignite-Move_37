import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, normalizeRole } from '@internos/shared';
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

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  const token = authHeader.split(' ')[1];

  if (!token || isTokenRevoked(token)) {
    throw new UnauthorizedError('Token has been revoked or is invalid');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const normalizedRole = normalizeRole(decoded.role);

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: normalizedRole,
      status: UserStatus.ACTIVE,
      organizationId: decoded.organizationId,
      organizationCode: decoded.organizationCode,
      firstName: '',
      lastName: '',
    };

    req.organizationId = decoded.organizationId;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token has expired');
    }
    throw new UnauthorizedError('Invalid authorization token');
  }
}

// Explicit naming requirement: auth middleware
export const authMiddleware = authenticate;
