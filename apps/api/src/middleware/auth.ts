import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '@internos/shared';
import { JwtPayload, UserStatus } from '@internos/types';
import { env } from '../config/env.js';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
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
