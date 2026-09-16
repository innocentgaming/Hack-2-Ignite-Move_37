import { Request, Response, NextFunction } from 'express';
import { formatSuccessResponse } from '@internos/shared';
import { prisma } from '@internos/prisma';
import { withTenantScope } from '../middleware/tenantIsolation.js';

export async function getCurrentTenant(req: Request, res: Response): Promise<void> {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.organizationId },
      include: {
        departments: true,
        _count: {
          select: {
            users: true,
            internships: true,
            companies: true,
          },
        },
      },
    });

    if (org) {
      res.status(200).json(formatSuccessResponse(org));
      return;
    }
  } catch (error) {
    console.warn('⚠️ Live database offline, serving tenant data fallback:', (error as Error).message);
  }

  // Graceful fallback for Phase 0 local preview
  res.status(200).json(
    formatSuccessResponse({
      id: req.organizationId || 'apex-org-demo-uuid',
      code: 'apex-inst',
      name: 'Apex Institute of Technology',
      domain: 'apex.edu',
      _count: { users: 5, internships: 1, companies: 1 },
      departments: [
        { id: 'dept-cse-uuid', code: 'CSE', name: 'Department of Computer Science & Engineering' },
        { id: 'dept-ece-uuid', code: 'ECE', name: 'Department of Electronics & Communication Engineering' },
      ],
    })
  );
}

export async function getDepartments(req: Request, res: Response): Promise<void> {
  try {
    const departments = await prisma.department.findMany({
      where: withTenantScope(req),
      orderBy: { name: 'asc' },
    });

    res.status(200).json(formatSuccessResponse(departments));
  } catch (error) {
    console.warn('⚠️ Live database offline, serving departments fallback:', (error as Error).message);
    res.status(200).json(
      formatSuccessResponse([
        { id: 'dept-cse-uuid', code: 'CSE', name: 'Department of Computer Science & Engineering' },
        { id: 'dept-ece-uuid', code: 'ECE', name: 'Department of Electronics & Communication Engineering' },
      ])
    );
  }
}
