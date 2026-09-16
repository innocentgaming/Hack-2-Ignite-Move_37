import { Request, Response, NextFunction } from 'express';
import { AppError, formatErrorResponse } from '@internos/shared';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const path = `${req.method} ${req.originalUrl}`;

  if (err instanceof AppError) {
    res.status(err.statusCode).json(
      formatErrorResponse(err.message, err.code, err.details, path)
    );
    return;
  }

  // Fallback for unhandled unexpected exceptions
  console.error(`💥 [UNHANDLED_EXCEPTION] ${path}:`, err);

  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json(
    formatErrorResponse(
      isDev ? err.message : 'An internal server error occurred',
      'INTERNAL_SERVER_ERROR',
      isDev ? { stack: err.stack } : undefined,
      path
    )
  );
}
