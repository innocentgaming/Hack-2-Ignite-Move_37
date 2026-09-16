import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { healthRouter } from './routes/health.router.js';
import { v1Router } from './routes/v1.router.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from '@internos/shared';
import { env } from './config/env.js';

export const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check endpoint (explicitly required: GET /api/health)
app.use('/api/health', healthRouter);

// Versioned API endpoints
app.use('/api/v1', v1Router);

// Catch-all 404 handler
app.use((req, res, next) => {
  next(new NotFoundError('Route', `${req.method} ${req.originalUrl}`));
});

// Centralized error handling
app.use(errorHandler);
