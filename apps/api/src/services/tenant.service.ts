import { prisma, isDatabaseOnline } from '../lib/prisma.js';
import { NotFoundError, TenantViolationError } from '@internos/shared';
import { InternshipStatus, CreateInternshipDto, InternshipDto, DocumentDto } from '@internos/types';
import { authStore } from './auth.service.js';

export interface InMemoryDepartment {
  id: string;
  organizationId: string;
  code: string;
  name: string;
}

export interface InMemoryInternship {
  id: string;
  organizationId: string;
  studentId: string;
  companyId: string;
  title: string;
  type: string;
  status: InternshipStatus;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryDocument {
  id: string;
  organizationId: string;
  uploaderId: string;
  internshipId?: string | null;
  name: string;
  mimeType: string;
  size: number;
  storageKey: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

class TenantStore {
  public departments: Map<string, InMemoryDepartment> = new Map();
  public internships: Map<string, InMemoryInternship> = new Map();
  public documents: Map<string, InMemoryDocument> = new Map();

  constructor() {
    this.seedDefaults();
  }

  public seedDefaults() {
    // Departments for ORG_A
    this.departments.set('dept-a-cs', {
      id: 'dept-a-cs',
      organizationId: 'org-a-id',
      code: 'CS',
      name: 'Computer Science Department',
    });
    this.departments.set('dept-a-ee', {
      id: 'dept-a-ee',
      organizationId: 'org-a-id',
      code: 'EE',
      name: 'Electrical Engineering Department',
    });

    // Departments for ORG_B
    this.departments.set('dept-b-me', {
      id: 'dept-b-me',
      organizationId: 'org-b-id',
      code: 'ME',
      name: 'Mechanical Engineering Department',
    });
    this.departments.set('dept-b-biotech', {
      id: 'dept-b-biotech',
      organizationId: 'org-b-id',
      code: 'BIO',
      name: 'Biotechnology Department',
    });

    // Legacy Apex Depts
    this.departments.set('dept-cse-uuid', {
      id: 'dept-cse-uuid',
      organizationId: 'apex-org-demo-uuid',
      code: 'CSE',
      name: 'Department of Computer Science & Engineering',
    });

    // Internships for ORG_A
    this.internships.set('internship-a-1', {
      id: 'internship-a-1',
      organizationId: 'org-a-id',
      studentId: 'user-a-student',
      companyId: 'company-a-tech',
      title: 'Full Stack Engineering Internship',
      type: 'FULL_TIME',
      status: InternshipStatus.ACTIVE,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-12-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.internships.set('internship-a-2', {
      id: 'internship-a-2',
      organizationId: 'org-a-id',
      studentId: 'user-a-student',
      companyId: 'company-a-cloud',
      title: 'Cloud Systems Internship',
      type: 'PART_TIME',
      status: InternshipStatus.PENDING_APPROVAL,
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-10-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Internships for ORG_B
    this.internships.set('internship-b-1', {
      id: 'internship-b-1',
      organizationId: 'org-b-id',
      studentId: 'user-b-student',
      companyId: 'company-b-robotics',
      title: 'Robotics Autonomous Systems Intern',
      type: 'FULL_TIME',
      status: InternshipStatus.ACTIVE,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-11-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Documents for ORG_A
    this.documents.set('doc-a-1', {
      id: 'doc-a-1',
      organizationId: 'org-a-id',
      uploaderId: 'user-a-student',
      internshipId: 'internship-a-1',
      name: 'Offer_Letter_OrgA.pdf',
      mimeType: 'application/pdf',
      size: 1048576,
      storageKey: 'org-a/docs/offer.pdf',
      url: '/uploads/org-a/offer.pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.documents.set('doc-a-2', {
      id: 'doc-a-2',
      organizationId: 'org-a-id',
      uploaderId: 'user-a-faculty',
      internshipId: 'internship-a-1',
      name: 'Midterm_Evaluation_OrgA.pdf',
      mimeType: 'application/pdf',
      size: 524288,
      storageKey: 'org-a/docs/midterm.pdf',
      url: '/uploads/org-a/midterm.pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Documents for ORG_B
    this.documents.set('doc-b-1', {
      id: 'doc-b-1',
      organizationId: 'org-b-id',
      uploaderId: 'user-b-student',
      internshipId: 'internship-b-1',
      name: 'Research_Agreement_OrgB.pdf',
      mimeType: 'application/pdf',
      size: 2097152,
      storageKey: 'org-b/docs/agreement.pdf',
      url: '/uploads/org-b/agreement.pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

export const tenantStore = new TenantStore();

export class TenantService {
  /**
   * Get Current Tenant Overview
   */
  async getCurrentTenant(organizationId: string) {
    const memOrg = authStore.organizations.get(organizationId);
    if (memOrg) {
      const depts = Array.from(tenantStore.departments.values()).filter((d) => d.organizationId === organizationId);
      const internships = Array.from(tenantStore.internships.values()).filter((i) => i.organizationId === organizationId);
      const users = Array.from(authStore.users.values()).filter((u) => u.organizationId === organizationId);

      return {
        id: memOrg.id,
        code: memOrg.code,
        name: memOrg.name,
        domain: memOrg.domain,
        departments: depts,
        _count: {
          users: users.length,
          internships: internships.length,
          departments: depts.length,
        },
      };
    }

    try {
      const dbOrg = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          departments: true,
          _count: {
            select: { users: true, internships: true, companies: true },
          },
        },
      });
      if (dbOrg) return dbOrg;
    } catch {
      // offline fallback
    }

    throw new NotFoundError('Organization', organizationId);
  }

  /**
   * Get Departments strictly scoped to caller's organization
   */
  async getDepartments(organizationId: string) {
    if (await isDatabaseOnline()) {
      try {
        const depts = await prisma.department.findMany({
          where: { organizationId },
          orderBy: { name: 'asc' },
        });
        if (depts && depts.length > 0) return depts;
      } catch {
        // fallback
      }
    }

    return Array.from(tenantStore.departments.values()).filter((d) => d.organizationId === organizationId);
  }

  /**
   * Get Internships strictly scoped to caller's organization
   */
  async getInternships(organizationId: string): Promise<InternshipDto[]> {
    if (await isDatabaseOnline()) {
      try {
        const dbInternships = await prisma.internship.findMany({
          where: { organizationId },
          orderBy: { createdAt: 'desc' },
        });
        if (dbInternships && dbInternships.length > 0) {
          return dbInternships.map((i) => ({
            id: i.id,
            organizationId: i.organizationId,
            title: i.title,
            type: i.type,
            status: i.status as InternshipStatus,
            startDate: i.startDate.toISOString(),
            endDate: i.endDate.toISOString(),
            studentId: i.studentId,
            createdAt: i.createdAt.toISOString(),
            updatedAt: i.updatedAt.toISOString(),
          }));
        }
      } catch {
        // fallback
      }
    }

    return Array.from(tenantStore.internships.values())
      .filter((i) => i.organizationId === organizationId)
      .map((i) => ({
        id: i.id,
        organizationId: i.organizationId,
        title: i.title,
        type: i.type,
        status: i.status,
        startDate: i.startDate.toISOString(),
        endDate: i.endDate.toISOString(),
        studentId: i.studentId,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      }));
  }

  /**
   * Get Internship by ID with Cross-Tenant Boundary Enforcement
   * Returns 403 Forbidden (TenantViolationError) if caller tenant != record tenant
   */
  async getInternshipById(organizationId: string, internshipId: string): Promise<InternshipDto> {
    const memItem = tenantStore.internships.get(internshipId);
    if (memItem) {
      if (memItem.organizationId !== organizationId) {
        throw new TenantViolationError('Cross-tenant access prohibited: Internship belongs to another organization');
      }
      return {
        id: memItem.id,
        organizationId: memItem.organizationId,
        title: memItem.title,
        type: memItem.type,
        status: memItem.status,
        startDate: memItem.startDate.toISOString(),
        endDate: memItem.endDate.toISOString(),
        studentId: memItem.studentId,
        createdAt: memItem.createdAt.toISOString(),
        updatedAt: memItem.updatedAt.toISOString(),
      };
    }

    try {
      const dbItem = await prisma.internship.findUnique({
        where: { id: internshipId },
      });
      if (dbItem) {
        if (dbItem.organizationId !== organizationId) {
          throw new TenantViolationError('Cross-tenant access prohibited: Internship belongs to another organization');
        }
        return {
          id: dbItem.id,
          organizationId: dbItem.organizationId,
          title: dbItem.title,
          type: dbItem.type,
          status: dbItem.status as InternshipStatus,
          startDate: dbItem.startDate.toISOString(),
          endDate: dbItem.endDate.toISOString(),
          studentId: dbItem.studentId,
          createdAt: dbItem.createdAt.toISOString(),
          updatedAt: dbItem.updatedAt.toISOString(),
        };
      }
    } catch (e) {
      if (e instanceof TenantViolationError) throw e;
    }

    throw new NotFoundError('Internship', internshipId);
  }

  /**
   * Create Internship strictly under caller's organizationId
   */
  async createInternship(organizationId: string, studentId: string, dto: CreateInternshipDto): Promise<InternshipDto> {
    const id = `internship-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const newInternship: InMemoryInternship = {
      id,
      organizationId,
      studentId: dto.studentId || studentId,
      companyId: 'company-default',
      title: dto.title,
      type: dto.type || 'FULL_TIME',
      status: InternshipStatus.DRAFT,
      startDate: dto.startDate ? new Date(dto.startDate) : now,
      endDate: dto.endDate ? new Date(dto.endDate) : new Date(now.getTime() + 180 * 24 * 3600 * 1000),
      createdAt: now,
      updatedAt: now,
    };

    tenantStore.internships.set(id, newInternship);

    return {
      id,
      organizationId,
      title: newInternship.title,
      type: newInternship.type,
      status: newInternship.status,
      startDate: newInternship.startDate.toISOString(),
      endDate: newInternship.endDate.toISOString(),
      studentId: newInternship.studentId,
      createdAt: newInternship.createdAt.toISOString(),
      updatedAt: newInternship.updatedAt.toISOString(),
    };
  }

  /**
   * Update Internship with Cross-Tenant Boundary Enforcement
   * Returns 403 Forbidden if caller organizationId != record organizationId
   */
  async updateInternship(organizationId: string, internshipId: string, dto: Partial<CreateInternshipDto>): Promise<InternshipDto> {
    const memItem = tenantStore.internships.get(internshipId);
    if (memItem) {
      if (memItem.organizationId !== organizationId) {
        throw new TenantViolationError('Cross-tenant UPDATE prohibited: Internship belongs to another organization');
      }
      if (dto.title) memItem.title = dto.title;
      if (dto.type) memItem.type = dto.type;
      memItem.updatedAt = new Date();

      return {
        id: memItem.id,
        organizationId: memItem.organizationId,
        title: memItem.title,
        type: memItem.type,
        status: memItem.status,
        startDate: memItem.startDate.toISOString(),
        endDate: memItem.endDate.toISOString(),
        studentId: memItem.studentId,
        createdAt: memItem.createdAt.toISOString(),
        updatedAt: memItem.updatedAt.toISOString(),
      };
    }

    throw new NotFoundError('Internship', internshipId);
  }

  /**
   * Delete Internship with Cross-Tenant Boundary Enforcement
   * Returns 403 Forbidden if caller organizationId != record organizationId
   */
  async deleteInternship(organizationId: string, internshipId: string): Promise<{ success: boolean; message: string }> {
    const memItem = tenantStore.internships.get(internshipId);
    if (memItem) {
      if (memItem.organizationId !== organizationId) {
        throw new TenantViolationError('Cross-tenant DELETE prohibited: Internship belongs to another organization');
      }
      tenantStore.internships.delete(internshipId);
      return { success: true, message: 'Internship deleted successfully' };
    }

    throw new NotFoundError('Internship', internshipId);
  }

  /**
   * Get Documents strictly scoped to caller's organization
   */
  async getDocuments(organizationId: string): Promise<DocumentDto[]> {
    return Array.from(tenantStore.documents.values())
      .filter((d) => d.organizationId === organizationId)
      .map((d) => ({
        id: d.id,
        organizationId: d.organizationId,
        name: d.name,
        mimeType: d.mimeType,
        size: d.size,
        storageKey: d.storageKey,
        url: d.url,
        uploaderId: d.uploaderId,
        createdAt: d.createdAt.toISOString(),
      }));
  }

  /**
   * Get Document by ID with Cross-Tenant Boundary Enforcement
   * Returns 403 Forbidden (TenantViolationError) if caller tenant != document tenant
   */
  async getDocumentById(organizationId: string, documentId: string): Promise<DocumentDto> {
    const memDoc = tenantStore.documents.get(documentId);
    if (memDoc) {
      if (memDoc.organizationId !== organizationId) {
        throw new TenantViolationError('Cross-tenant document access prohibited: Document belongs to another organization');
      }
      return {
        id: memDoc.id,
        organizationId: memDoc.organizationId,
        name: memDoc.name,
        mimeType: memDoc.mimeType,
        size: memDoc.size,
        storageKey: memDoc.storageKey,
        url: memDoc.url,
        uploaderId: memDoc.uploaderId,
        createdAt: memDoc.createdAt.toISOString(),
      };
    }

    throw new NotFoundError('Document', documentId);
  }

  /**
   * Delete Document with Cross-Tenant Boundary Enforcement
   * Returns 403 Forbidden if caller tenant != document tenant
   */
  async deleteDocument(organizationId: string, documentId: string): Promise<{ success: boolean; message: string }> {
    const memDoc = tenantStore.documents.get(documentId);
    if (memDoc) {
      if (memDoc.organizationId !== organizationId) {
        throw new TenantViolationError('Cross-tenant document DELETE prohibited: Document belongs to another organization');
      }
      tenantStore.documents.delete(documentId);
      return { success: true, message: 'Document deleted successfully' };
    }

    throw new NotFoundError('Document', documentId);
  }

  /**
   * Get Users for caller's organization
   */
  async getUsers(organizationId: string) {
    return Array.from(authStore.users.values())
      .filter((u) => u.organizationId === organizationId)
      .map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        status: u.status,
        departmentId: u.departmentId,
        createdAt: u.createdAt.toISOString(),
      }));
  }
}

export const tenantService = new TenantService();
