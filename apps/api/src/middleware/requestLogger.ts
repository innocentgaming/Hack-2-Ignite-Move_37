import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(2, 9);
  req.headers['x-request-id'] = requestId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;
    const orgId = req.headers['x-organization-id'] || 'no-org';

    const color =
      statusCode >= 500
        ? '\x1b[31m' // Red
        : statusCode >= 400
        ? '\x1b[33m' // Yellow
        : '\x1b[32m'; // Green

    console.log(
      `[${requestId}] ${method} ${originalUrl} ${color}${statusCode}\x1b[0m ${duration}ms [org:${orgId}]`
    );
  });

  next();
}
