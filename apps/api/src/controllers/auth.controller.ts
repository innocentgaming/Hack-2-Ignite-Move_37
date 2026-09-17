import { Request, Response, NextFunction } from 'express';
import { formatSuccessResponse, UnauthorizedError } from '@internos/shared';
import { authService } from '../services/auth.service.js';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(formatSuccessResponse(result));
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    const result = authService.logout(token);
    res.status(200).json(formatSuccessResponse(result));
  } catch (error) {
    next(error);
  }
}

export async function invite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required to invite users');
    }
    const result = await authService.inviteUser(req.user.organizationId, req.body);
    res.status(201).json(formatSuccessResponse(result));
  } catch (error) {
    next(error);
  }
}

export async function activate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.activateAccount(req.body);
    res.status(200).json(formatSuccessResponse(result));
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const result = await authService.getMe(req.user.id, req.user.organizationId);
    res.status(200).json(formatSuccessResponse(result));
  } catch (error) {
    next(error);
  }
}
