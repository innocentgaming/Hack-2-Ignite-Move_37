import { Request, Response, NextFunction } from 'express';
import { AppError, formatErrorResponse } from '@internos/shared';

function sanitizeDetails(details: unknown): unknown {
  if (!details || typeof details !== 'object') return details;
  if (Array.isArray(details)) return details.map(sanitizeDetails);
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
    if (/password|secret|token|hash|authorization/i.test(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeDetails(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

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
      formatErrorResponse(err.message, err.code, sanitizeDetails(err.details), path)
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
