import { Request, Response, NextFunction } from 'express';
import { formatSuccessResponse } from '@internos/shared';
import { authService } from '../services/auth.service.js';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(formatSuccessResponse(result));
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      return;
    }
    const result = await authService.getMe(req.user.id, req.user.organizationId);
    res.status(200).json(formatSuccessResponse(result));
  } catch (error) {
    next(error);
  }
}
