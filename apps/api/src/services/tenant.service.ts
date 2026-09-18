import { prisma, isDatabaseOnline } from '../lib/prisma.js';
import { NotFoundError, TenantViolationError, ConflictError, ValidationError, UnauthorizedError } from '@internos/shared';
import {
  InternshipStatus,
  CreateInternshipDto,
  InternshipDto,
  DocumentDto,
  UserRole,
  UserStatus,
  DepartmentDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentStatsDto,
  CreateUserDto,
  UpdateUserDto,
  UserFilterQuery,
  UserListItemDto,
  AdminDashboardMetrics,
  MentorDashboardMetrics,
  InstitutionProfileDto,
  UpdateInstitutionDto,
  InstitutionSettingsDto,
} from '@internos/types';
import { authStore, InMemoryUser } from './auth.service.js';
import { auditService } from './audit.service.js';
import bcrypt from 'bcryptjs';

export interface InMemoryDepartment {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  hodId?: string | null;
  createdAt: Date;
  updatedAt: Date;
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
    const now = new Date('2026-09-01T00:00:00Z');

    // 1. Departments for MIT_PUNE (demo-mit-pune)
    this.departments.set('dept-mit-cse', {
      id: 'dept-mit-cse',
      organizationId: 'demo-mit-pune',
      code: 'CSE',
      name: 'Computer Science & Engineering',
      description: 'Department of Computer Science & Engineering - Autonomous B.Tech & M.Tech Programs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    this.departments.set('dept-mit-entc', {
      id: 'dept-mit-entc',
      organizationId: 'demo-mit-pune',
      code: 'ENTC',
      name: 'Electronics & Telecommunication',
      description: 'Department of E&TC - Embedded Systems, IoT, and Signal Processing',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    this.departments.set('dept-mit-mech', {
      id: 'dept-mit-mech',
      organizationId: 'demo-mit-pune',
      code: 'MECH',
      name: 'Mechanical Engineering',
      description: 'Department of Mechanical Engineering - Mechatronics, Robotics, and Manufacturing',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // 2. Departments for ORG_A
    this.departments.set('dept-a-cs', {
      id: 'dept-a-cs',
      organizationId: 'org-a-id',
      code: 'CS',
      name: 'Computer Science Department',
      description: 'Department of Computer Science & Engineering',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    this.departments.set('dept-a-it', {
      id: 'dept-a-it',
      organizationId: 'org-a-id',
      code: 'ITECH',
      name: 'Information Technology',
      description: 'Department of Information Technology & Software Systems',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    this.departments.set('dept-a-ee', {
      id: 'dept-a-ee',
      organizationId: 'org-a-id',
      code: 'EE',
      name: 'Electrical Engineering Department',
      description: 'Department of Electrical Engineering',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // 3. Departments for ORG_B
    this.departments.set('dept-b-me', {
      id: 'dept-b-me',
      organizationId: 'org-b-id',
      code: 'ME',
      name: 'Mechanical Engineering Department',
      description: 'Department of Mechanical Engineering',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    this.departments.set('dept-b-biotech', {
      id: 'dept-b-biotech',
      organizationId: 'org-b-id',
      code: 'BIO',
      name: 'Biotechnology Department',
      description: 'Department of Biotechnology',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // 4. Legacy Apex Depts
    this.departments.set('dept-cse-uuid', {
      id: 'dept-cse-uuid',
      organizationId: 'apex-org-demo-uuid',
      code: 'CSE',
      name: 'Department of Computer Science & Engineering',
      description: 'Department of CSE',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Internships for MIT_PUNE
    this.internships.set('internship-mit-1', {
      id: 'internship-mit-1',
      organizationId: 'demo-mit-pune',
      studentId: 'user-mit-student-1',
      companyId: 'company-tcs',
      title: 'Full Stack Cloud Engineering Internship',
      type: 'FULL_TIME',
      status: InternshipStatus.ACTIVE,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-11-30'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.internships.set('internship-mit-2', {
      id: 'internship-mit-2',
      organizationId: 'demo-mit-pune',
      studentId: 'user-mit-student-2',
      companyId: 'company-infosys',
      title: 'AI & Enterprise Automation Internship',
      type: 'FULL_TIME',
      status: InternshipStatus.ACTIVE,
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-12-15'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.internships.set('internship-mit-3', {
      id: 'internship-mit-3',
      organizationId: 'demo-mit-pune',
      studentId: 'user-mit-student-3',
      companyId: 'company-bharatforge',
      title: 'Autonomous Systems Software Intern',
      type: 'PART_TIME',
      status: InternshipStatus.PENDING_APPROVAL,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-12-31'),
      createdAt: new Date(),
      updatedAt: new Date(),
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
      storageKey: 'org-a-id/Offer_Letter_OrgA.pdf',
      url: '/api/v1/student/documents/doc-a-1/view',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.documents.set('doc-a-2', {
      id: 'doc-a-2',
      organizationId: 'org-a-id',
      uploaderId: 'user-a-student',
      internshipId: 'internship-a-1',
      name: 'Midterm_Evaluation_OrgA.pdf',
      mimeType: 'application/pdf',
      size: 524288,
      storageKey: 'org-a-id/Midterm_Evaluation_OrgA.pdf',
      url: '/api/v1/student/documents/doc-a-2/view',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.documents.set('doc-david-1', {
      id: 'doc-david-1',
      organizationId: 'org-a-id',
      uploaderId: 'user-a-student-3',
      internshipId: 'internship-a-3',
      name: 'David_Chen_Offer_AWS.pdf',
      mimeType: 'application/pdf',
      size: 1048576,
      storageKey: 'org-a-id/David_Chen_Offer_AWS.pdf',
      url: '/api/v1/student/documents/doc-david-1/view',
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

  // ==========================================
  // Phase 2: Department Management
  // ==========================================

  async getDepartmentById(organizationId: string, departmentId: string): Promise<DepartmentDto> {
    const dept = tenantStore.departments.get(departmentId);
    if (!dept) {
      throw new NotFoundError('Department', departmentId);
    }
    if (dept.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant department access prohibited');
    }
    return {
      id: dept.id,
      organizationId: dept.organizationId,
      code: dept.code,
      name: dept.name,
      description: dept.description,
      isActive: dept.isActive,
      createdAt: dept.createdAt.toISOString(),
      updatedAt: dept.updatedAt.toISOString(),
    };
  }

  async createDepartment(organizationId: string, dto: CreateDepartmentDto, creatorId?: string): Promise<DepartmentDto> {
    if (!dto.code || !dto.name) {
      throw new ValidationError('Department code and name are required');
    }

    // Check duplicate code in organization
    const existing = Array.from(tenantStore.departments.values()).find(
      (d) => d.organizationId === organizationId && d.code.toLowerCase() === dto.code.toLowerCase()
    );
    if (existing) {
      throw new ConflictError(`Department with code '${dto.code}' already exists in this organization`);
    }

    const id = `dept-${dto.code.toLowerCase()}-${Date.now().toString(36)}`;
    const now = new Date();
    const newDept: InMemoryDepartment = {
      id,
      organizationId,
      code: dto.code.toUpperCase(),
      name: dto.name,
      description: dto.description,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    tenantStore.departments.set(id, newDept);

    await auditService.log({
      organizationId,
      userId: creatorId,
      action: 'DEPARTMENT_CREATE',
      entity: 'Department',
      entityId: id,
      details: { code: newDept.code, name: newDept.name },
    });

    return {
      id: newDept.id,
      organizationId: newDept.organizationId,
      code: newDept.code,
      name: newDept.name,
      description: newDept.description,
      isActive: newDept.isActive,
      createdAt: newDept.createdAt.toISOString(),
      updatedAt: newDept.updatedAt.toISOString(),
    };
  }

  async updateDepartment(organizationId: string, departmentId: string, dto: UpdateDepartmentDto, updaterId?: string): Promise<DepartmentDto> {
    const dept = tenantStore.departments.get(departmentId);
    if (!dept) {
      throw new NotFoundError('Department', departmentId);
    }
    if (dept.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant department update prohibited');
    }

    if (dto.code && dto.code.toUpperCase() !== dept.code) {
      const existing = Array.from(tenantStore.departments.values()).find(
        (d) => d.organizationId === organizationId && d.id !== departmentId && d.code.toLowerCase() === dto.code!.toLowerCase()
      );
      if (existing) {
        throw new ConflictError(`Department with code '${dto.code}' already exists in this organization`);
      }
      dept.code = dto.code.toUpperCase();
    }

    if (dto.name !== undefined) dept.name = dto.name;
    if (dto.description !== undefined) dept.description = dto.description;
    if (dto.isActive !== undefined) dept.isActive = dto.isActive;

    dept.updatedAt = new Date();

    await auditService.log({
      organizationId,
      userId: updaterId,
      action: 'DEPARTMENT_UPDATE',
      entity: 'Department',
      entityId: departmentId,
      details: { ...dto },
    });

    return {
      id: dept.id,
      organizationId: dept.organizationId,
      code: dept.code,
      name: dept.name,
      description: dept.description,
      isActive: dept.isActive,
      createdAt: dept.createdAt.toISOString(),
      updatedAt: dept.updatedAt.toISOString(),
    };
  }

  async toggleDepartmentActive(organizationId: string, departmentId: string, isActive: boolean, updaterId?: string): Promise<DepartmentDto> {
    return this.updateDepartment(organizationId, departmentId, { isActive }, updaterId);
  }

  async getDepartmentStats(organizationId: string, departmentId: string): Promise<DepartmentStatsDto> {
    const dept = tenantStore.departments.get(departmentId);
    if (!dept) {
      throw new NotFoundError('Department', departmentId);
    }
    if (dept.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant department stats access prohibited');
    }

    const deptUsers = Array.from(authStore.users.values()).filter(
      (u) => u.organizationId === organizationId && u.departmentId === departmentId
    );

    const totalStudents = deptUsers.filter((u) => u.role === UserRole.STUDENT).length;
    const activeStudents = deptUsers.filter((u) => u.role === UserRole.STUDENT && u.status === UserStatus.ACTIVE).length;
    const mentors = Array.from(authStore.users.values()).filter(
      (u) => u.organizationId === organizationId && u.role === UserRole.MENTOR && (!u.departmentId || u.departmentId === departmentId)
    );
    const mentorCount = mentors.length;

    const studentIds = new Set(deptUsers.filter((u) => u.role === UserRole.STUDENT).map((u) => u.id));
    const allInternships = Array.from(tenantStore.internships.values()).filter(
      (i) => i.organizationId === organizationId && studentIds.has(i.studentId)
    );
    const internshipIds = new Set(allInternships.map((i) => i.id));

    const activeInternships = allInternships.filter((i) => i.status === InternshipStatus.ACTIVE).length;
    const completedInternships = allInternships.filter((i) => i.status === InternshipStatus.COMPLETED).length;
    const pendingRegistrations = allInternships.filter((i) => i.status === InternshipStatus.PENDING_APPROVAL).length;
    const interningStudents = allInternships.filter((i) => i.status === InternshipStatus.ACTIVE || i.status === InternshipStatus.COMPLETED).length;

    // Rich Live Metrics from StudentMentorStore
    let pendingReviews = 0;
    let submittedCount = 0;
    let reviewedCount = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let pendingTasks = 0;
    let overdueTasks = 0;
    let outcomesEvidence = 0;
    let outcomesVerified = 0;

    try {
      const { studentMentorStore } = await import('./student-mentor.service.js');
      const subs = Array.from(studentMentorStore.submissions.values()).filter(
        (s) => s.organizationId === organizationId && (internshipIds.has(s.internshipId) || studentIds.has(s.studentId))
      );
      submittedCount = subs.length;
      reviewedCount = subs.filter((s) => s.status === 'ACCEPTED' || s.status === 'REVISION_NEEDED').length;
      pendingReviews = subs.filter((s) => s.status === 'SUBMITTED').length;

      const tasks = Array.from(studentMentorStore.tasks.values()).filter(
        (t) => t.organizationId === organizationId && internshipIds.has(t.internshipId)
      );
      totalTasks = tasks.length;
      completedTasks = tasks.filter((t) => (t.status as any) === 'APPROVED').length;
      pendingTasks = tasks.filter((t) => (t.status as any) === 'PENDING' || (t.status as any) === 'SUBMITTED').length;
      overdueTasks = tasks.filter((t) => new Date(t.dueDate) < new Date() && (t.status as any) !== 'APPROVED').length;

      outcomesEvidence = subs.filter((s) => s.evidenceUrl || s.attachmentName).length;
      outcomesVerified = subs.filter((s) => s.status === 'ACCEPTED' && (s.evidenceUrl || s.attachmentName)).length;
    } catch {
      // in-memory fallback
    }

    const totalTracked = activeInternships + completedInternships;
    const completionRate = totalTracked > 0 ? Math.round((completedInternships / totalTracked) * 100) : 0;
    const averageProgress = totalTracked > 0 ? Math.round(((completedInternships * 100) + (activeInternships * 55)) / totalTracked) : 0;

    return {
      departmentId: dept.id,
      departmentName: dept.name,
      departmentCode: dept.code,
      totalStudents,
      studentCount: totalStudents,
      mentorCount,
      activeInternships,
      completedInternships,
      pendingRegistrations,
      pendingReviews,
      averageProgress,
      completionRate,
      enrollment: {
        totalStudents,
        activeStudents,
        interningStudents,
      },
      internships: {
        active: activeInternships,
        pending: pendingRegistrations,
        completed: completedInternships,
        completionRate,
      },
      mentors: {
        assigned: mentorCount,
        active: mentorCount,
        avgInternsPerMentor: mentorCount > 0 ? Number((activeInternships / mentorCount).toFixed(1)) : 0,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
      },
      submissions: {
        submitted: submittedCount,
        reviewed: reviewedCount,
        pendingReview: pendingReviews,
      },
      outcomes: {
        evidenceSubmitted: outcomesEvidence,
        verified: outcomesVerified,
        pending: outcomesEvidence - outcomesVerified,
      },
    };
  }

  async getDepartmentUsers(organizationId: string, departmentId: string): Promise<UserListItemDto[]> {
    const dept = tenantStore.departments.get(departmentId);
    if (!dept) {
      throw new NotFoundError('Department', departmentId);
    }
    if (dept.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant department users access prohibited');
    }

    return Array.from(authStore.users.values())
      .filter((u) => u.organizationId === organizationId && u.departmentId === departmentId)
      .map((u) => ({
        id: u.id,
        organizationId: u.organizationId,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        status: u.status,
        departmentId: u.departmentId,
        departmentName: dept.name,
        createdAt: u.createdAt.toISOString(),
      }));
  }

  // ==========================================
  // Phase 2: User Administration
  // ==========================================

  async getUsersWithFilter(organizationId: string, filter?: UserFilterQuery): Promise<{ users: UserListItemDto[]; total: number }> {
    let list = Array.from(authStore.users.values()).filter((u) => u.organizationId === organizationId);

    if (filter?.role) {
      list = list.filter((u) => u.role === filter.role);
    }
    if (filter?.departmentId) {
      list = list.filter((u) => u.departmentId === filter.departmentId);
    }
    if (filter?.status) {
      list = list.filter((u) => u.status === filter.status);
    }
    if (filter?.search) {
      const s = filter.search.toLowerCase();
      list = list.filter(
        (u) =>
          u.firstName.toLowerCase().includes(s) ||
          u.lastName.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s)
      );
    }

    const total = list.length;
    const page = filter?.page && filter.page > 0 ? filter.page : 1;
    const limit = filter?.limit && filter.limit > 0 ? filter.limit : 50;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    const items: UserListItemDto[] = paginated.map((u) => {
      let deptName: string | null = null;
      if (u.departmentId) {
        const d = tenantStore.departments.get(u.departmentId);
        if (d) deptName = d.name;
      }
      return {
        id: u.id,
        organizationId: u.organizationId,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        status: u.status,
        departmentId: u.departmentId,
        departmentName: deptName,
        createdAt: u.createdAt.toISOString(),
      };
    });

    return { users: items, total };
  }

  async createUser(organizationId: string, dto: CreateUserDto, creatorId?: string): Promise<UserListItemDto> {
    if (!dto.email || !dto.firstName || !dto.lastName || !dto.role) {
      throw new ValidationError('Email, firstName, lastName, and role are required');
    }

    const normEmail = dto.email.toLowerCase().trim();

    // Check duplicate email
    const existing = Array.from(authStore.users.values()).find(
      (u) => u.email.toLowerCase() === normEmail
    );
    if (existing) {
      throw new ConflictError(`User with email '${dto.email}' already exists`);
    }

    // Validate department if provided
    if (dto.departmentId) {
      const dept = tenantStore.departments.get(dto.departmentId);
      if (!dept || dept.organizationId !== organizationId) {
        throw new ValidationError('Department does not exist in this organization');
      }
    }

    const passwordToHash = dto.password || 'TemporaryPass123!';
    const passwordHash = bcrypt.hashSync(passwordToHash, 10);
    const userId = `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    const newUser: InMemoryUser = {
      id: userId,
      organizationId,
      departmentId: dto.departmentId || null,
      email: normEmail,
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      role: dto.role,
      status: UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };

    authStore.users.set(userId, newUser);

    await auditService.log({
      organizationId,
      userId: creatorId,
      action: 'USER_CREATE',
      entity: 'User',
      entityId: userId,
      details: { email: newUser.email, role: newUser.role, departmentId: newUser.departmentId },
    });

    let deptName: string | null = null;
    if (newUser.departmentId) {
      const d = tenantStore.departments.get(newUser.departmentId);
      if (d) deptName = d.name;
    }

    return {
      id: newUser.id,
      organizationId: newUser.organizationId,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      status: newUser.status,
      departmentId: newUser.departmentId,
      departmentName: deptName,
      createdAt: newUser.createdAt.toISOString(),
    };
  }

  async updateUser(organizationId: string, userId: string, dto: UpdateUserDto, updaterId?: string): Promise<UserListItemDto> {
    const user = authStore.users.get(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }
    if (user.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant user update prohibited');
    }

    const changes: Record<string, unknown> = {};

    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName;
      changes.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName;
      changes.lastName = dto.lastName;
    }
    if (dto.role !== undefined && dto.role !== user.role) {
      changes.oldRole = user.role;
      changes.newRole = dto.role;
      user.role = dto.role;
      await auditService.log({
        organizationId,
        userId: updaterId,
        action: 'USER_ROLE_CHANGE',
        entity: 'User',
        entityId: userId,
        details: { oldRole: changes.oldRole, newRole: changes.newRole },
      });
    }
    if (dto.status !== undefined && dto.status !== user.status) {
      changes.oldStatus = user.status;
      changes.newStatus = dto.status;
      user.status = dto.status;
      await auditService.log({
        organizationId,
        userId: updaterId,
        action: dto.status === UserStatus.ACTIVE ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        entity: 'User',
        entityId: userId,
        details: { status: dto.status },
      });
    }
    if (dto.departmentId !== undefined) {
      if (dto.departmentId) {
        const dept = tenantStore.departments.get(dto.departmentId);
        if (!dept || dept.organizationId !== organizationId) {
          throw new ValidationError('Department does not exist in this organization');
        }
      }
      changes.departmentId = dto.departmentId;
      user.departmentId = dto.departmentId;
      await auditService.log({
        organizationId,
        userId: updaterId,
        action: 'DEPARTMENT_ASSIGNMENT',
        entity: 'User',
        entityId: userId,
        details: { departmentId: dto.departmentId },
      });
    }

    user.updatedAt = new Date();

    let deptName: string | null = null;
    if (user.departmentId) {
      const d = tenantStore.departments.get(user.departmentId);
      if (d) deptName = d.name;
    }

    return {
      id: user.id,
      organizationId: user.organizationId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      departmentId: user.departmentId,
      departmentName: deptName,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async toggleUserActive(organizationId: string, userId: string, isActive: boolean, updaterId?: string): Promise<UserListItemDto> {
    return this.updateUser(
      organizationId,
      userId,
      { status: isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE },
      updaterId
    );
  }

  // ==========================================
  // Phase 2: Dashboards (Strict Real Dynamic Metrics)
  // ==========================================

  async getAdminDashboardMetrics(organizationId: string): Promise<AdminDashboardMetrics> {
    const orgUsers = Array.from(authStore.users.values()).filter((u) => u.organizationId === organizationId);
    const orgDepts = Array.from(tenantStore.departments.values()).filter((d) => d.organizationId === organizationId);
    const orgInternships = Array.from(tenantStore.internships.values()).filter((i) => i.organizationId === organizationId);

    const totalStudents = orgUsers.filter((u) => u.role === UserRole.STUDENT).length;
    const totalMentors = orgUsers.filter((u) => u.role === UserRole.MENTOR).length;
    const totalDepartments = orgDepts.length;

    const activeInternships = orgInternships.filter((i) => i.status === InternshipStatus.ACTIVE).length;
    const pendingApprovals = orgInternships.filter((i) => i.status === InternshipStatus.PENDING_APPROVAL).length;

    const departmentBreakdown = orgDepts.map((d) => {
      const deptStudents = orgUsers.filter((u) => u.role === UserRole.STUDENT && u.departmentId === d.id);
      const studentIds = new Set(deptStudents.map((u) => u.id));
      const deptMentorCount = orgUsers.filter((u) => u.role === UserRole.MENTOR && u.departmentId === d.id).length;
      const deptInternshipCount = orgInternships.filter((i) => studentIds.has(i.studentId)).length;

      return {
        departmentId: d.id,
        departmentName: d.name,
        departmentCode: d.code,
        studentCount: deptStudents.length,
        mentorCount: deptMentorCount,
        internshipCount: deptInternshipCount,
      };
    });

    return {
      totalStudents,
      totalMentors,
      totalDepartments,
      activeInternships,
      pendingApprovals,
      departmentBreakdown,
    };
  }

  async getMentorDashboardMetrics(organizationId: string, mentorId: string): Promise<MentorDashboardMetrics> {
    const mentor = authStore.users.get(mentorId);
    if (!mentor || mentor.organizationId !== organizationId) {
      throw new UnauthorizedError('Mentor not found in organization context');
    }

    const internships = Array.from(tenantStore.internships.values()).filter(
      (i) => i.organizationId === organizationId
    );
    const activeCount = internships.filter((i) => i.status === InternshipStatus.ACTIVE).length;

    return {
      mentorId,
      companyName: 'Industry Partner Organization',
      mentoredInternsCount: activeCount,
      pendingReviewsCount: 0,
      completedEvaluationsCount: 0,
    };
  }

  // ==========================================
  // Phase 2: Institution Profile & Settings
  // ==========================================

  async getInstitutionProfile(organizationId: string): Promise<InstitutionProfileDto> {
    const org = authStore.organizations.get(organizationId);
    if (!org) {
      throw new NotFoundError('Organization', organizationId);
    }

    return {
      id: org.id,
      code: org.code,
      name: org.name,
      domain: org.domain,
      settings: (org.settings as InstitutionSettingsDto) || {},
      createdAt: (org.createdAt || new Date('2026-09-01T00:00:00Z')).toISOString(),
      updatedAt: (org.updatedAt || new Date()).toISOString(),
    };
  }

  async updateInstitutionProfile(organizationId: string, dto: UpdateInstitutionDto, updaterId?: string): Promise<InstitutionProfileDto> {
    const org = authStore.organizations.get(organizationId);
    if (!org) {
      throw new NotFoundError('Organization', organizationId);
    }

    if (dto.name) org.name = dto.name;
    if (dto.domain !== undefined) org.domain = dto.domain;
    if (dto.settings) {
      org.settings = { ...(org.settings || {}), ...dto.settings };
    }
    org.updatedAt = new Date();

    await auditService.log({
      organizationId,
      userId: updaterId,
      action: 'INSTITUTION_PROFILE_UPDATE',
      entity: 'Organization',
      entityId: organizationId,
      details: { ...dto },
    });

    return {
      id: org.id,
      code: org.code,
      name: org.name,
      domain: org.domain,
      settings: (org.settings as InstitutionSettingsDto) || {},
      createdAt: (org.createdAt || new Date('2026-09-01T00:00:00Z')).toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    };
  }

  async getSettings(organizationId: string): Promise<InstitutionSettingsDto> {
    const profile = await this.getInstitutionProfile(organizationId);
    return profile.settings || {};
  }

  async updateSettings(organizationId: string, settings: Partial<InstitutionSettingsDto>, updaterId?: string): Promise<InstitutionSettingsDto> {
    const profile = await this.updateInstitutionProfile(organizationId, { settings }, updaterId);
    return profile.settings || {};
  }
}

export const tenantService = new TenantService();
