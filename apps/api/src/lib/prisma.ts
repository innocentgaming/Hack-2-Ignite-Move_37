import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var isDbAvailable: boolean | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export async function isDatabaseOnline(): Promise<boolean> {
  if (global.isDbAvailable !== undefined) {
    return global.isDbAvailable;
  }

  // Fast connection probe with 300ms timeout
  try {
    const probe = prisma.$queryRaw`SELECT 1`;
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('DB_PROBE_TIMEOUT')), 300));
    await Promise.race([probe, timeout]);
    global.isDbAvailable = true;
  } catch {
    global.isDbAvailable = false;
  }

  return global.isDbAvailable;
}

export * from '@prisma/client';
