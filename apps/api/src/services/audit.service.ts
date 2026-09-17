import { prisma, isDatabaseOnline } from '../lib/prisma.js';
import { AuditLogDto, AuditLogQuery } from '@internos/types';

export interface InMemoryAuditLog {
  id: string;
  organizationId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: Date;
}

class AuditStore {
  public logs: InMemoryAuditLog[] = [];

  constructor() {
    this.seedDefaults();
  }

  public seedDefaults() {
    this.logs.push(
      {
        id: 'audit-a-1',
        organizationId: 'org-a-id',
        userId: 'user-a-admin',
        action: 'DEPARTMENT_CREATE',
        entity: 'Department',
        entityId: 'dept-a-cs',
        details: { name: 'Computer Science Department', code: 'CS' },
        ipAddress: '127.0.0.1',
        createdAt: new Date('2026-09-15T08:00:00Z'),
      },
      {
        id: 'audit-a-2',
        organizationId: 'org-a-id',
        userId: 'user-a-admin',
        action: 'USER_CREATE',
        entity: 'User',
        entityId: 'user-a-student',
        details: { role: 'STUDENT', email: 'student@org-a.com' },
        ipAddress: '127.0.0.1',
        createdAt: new Date('2026-09-15T09:00:00Z'),
      },
      {
        id: 'audit-b-1',
        organizationId: 'org-b-id',
        userId: 'user-b-admin',
        action: 'DEPARTMENT_CREATE',
        entity: 'Department',
        entityId: 'dept-b-me',
        details: { name: 'Mechanical Engineering Department', code: 'ME' },
        ipAddress: '127.0.0.1',
        createdAt: new Date('2026-09-15T08:30:00Z'),
      },
    );
  }
}

export const auditStore = new AuditStore();

export class AuditService {
  /**
   * Log an operational event for an organization
   */
  async log(params: {
    organizationId: string;
    userId?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    details?: Record<string, unknown> | null;
    ipAddress?: string | null;
  }): Promise<AuditLogDto> {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date();

    const memEntry: InMemoryAuditLog = {
      id,
      organizationId: params.organizationId,
      userId: params.userId ?? null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      details: params.details ?? null,
      ipAddress: params.ipAddress ?? null,
      createdAt,
    };

    auditStore.logs.unshift(memEntry);

    if (await isDatabaseOnline()) {
      try {
        await prisma.auditLog.create({
          data: {
            organizationId: params.organizationId,
            actorId: params.userId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            action: params.action as any,
            entity: params.entity,
            entityId: params.entityId,
            details: params.details ? JSON.parse(JSON.stringify(params.details)) : undefined,
            ipAddress: params.ipAddress,
          },
        });
      } catch (err) {
        console.warn('DB write for audit log failed; memory store preserved:', err);
      }
    }

    return {
      id: memEntry.id,
      organizationId: memEntry.organizationId,
      userId: memEntry.userId,
      action: memEntry.action,
      entity: memEntry.entity,
      entityId: memEntry.entityId,
      details: memEntry.details,
      ipAddress: memEntry.ipAddress,
      createdAt: memEntry.createdAt.toISOString(),
    };
  }

  /**
   * Get audit logs for caller's organization with optional filtering
   */
  async getLogs(organizationId: string, query?: AuditLogQuery): Promise<{ logs: AuditLogDto[]; total: number }> {
    let list = auditStore.logs.filter((l) => l.organizationId === organizationId);

    if (query?.action) {
      list = list.filter((l) => l.action.toLowerCase().includes(query.action!.toLowerCase()));
    }
    if (query?.entity) {
      list = list.filter((l) => l.entity.toLowerCase() === query.entity!.toLowerCase());
    }
    if (query?.userId) {
      list = list.filter((l) => l.userId === query.userId);
    }

    const total = list.length;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 50;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      logs: paginated.map((l) => ({
        id: l.id,
        organizationId: l.organizationId,
        userId: l.userId,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        details: l.details,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
    };
  }
}

export const auditService = new AuditService();
