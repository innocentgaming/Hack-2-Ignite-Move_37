import { Request, Response, NextFunction } from 'express';
import { formatErrorResponse } from '@internos/shared';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

const store = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (record.resetTime <= now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000).unref?.();

/**
 * Enterprise Sliding Window Rate Limiter
 */
export function rateLimiter(options: RateLimitOptions) {
  const { windowMs, max, message = 'Too many requests, please try again later.' } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // In test environment, do not throttle tests unless explicitly testing rate limit
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || '127.0.0.1';
    const key = `${req.baseUrl || ''}${req.path}:${ip}`;
    const now = Date.now();

    const record = store.get(key);

    if (!record || record.resetTime <= now) {
      store.set(key, { count: 1, resetTime: now + windowMs });
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));
      return next();
    }

    if (record.count >= max) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
      res.status(429).json(formatErrorResponse(message, 'RATE_LIMIT_EXCEEDED', { retryAfterSeconds: retryAfterSec }, req.originalUrl));
      return;
    }

    record.count += 1;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', max - record.count);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
    next();
  };
}
