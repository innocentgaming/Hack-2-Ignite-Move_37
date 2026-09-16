import { Request, Response } from 'express';
import { formatSuccessResponse } from '@internos/shared';
import { SystemHealthData } from '@internos/types';
import { prisma } from '@internos/prisma';
import { env } from '../config/env.js';

const startTime = Date.now();

export async function getHealth(req: Request, res: Response): Promise<void> {
  let dbStatus: 'connected' | 'disconnected' | 'mocked' = 'disconnected';

  try {
    // Ping database with lightweight query
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'mocked';
  }

  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  const healthData: SystemHealthData = {
    status: 'healthy',
    uptimeSeconds,
    version: '0.1.0-phase0',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    services: {
      database: dbStatus,
      storage: 'operational',
      memoryUsageMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    },
  };

  res.status(200).json(formatSuccessResponse(healthData));
}
