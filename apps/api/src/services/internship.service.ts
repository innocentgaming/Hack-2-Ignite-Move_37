import {
  InternshipStatus,
  CompanyDto,
  CreateCompanyDto,
  ExpectedOutcomeDto,
  OutcomeVersionDto,
  OutcomeStatus,
  InternshipRegistrationDto,
  UpdateInternshipRegistrationDto,
  InternshipDetailsDto,
  StateTransitionDto,
  ApprovalDecisionDto,
  AssignFacultyDto,
  AssignMentorDto,
  UserRole,
  AuthenticatedUser,
  AuditAction,
} from '@internos/types';
import {
  NotFoundError,
  TenantViolationError,
  ValidationError,
  BadRequestError,
  normalizeRole,
} from '@internos/shared';
import { tenantStore, InMemoryInternship } from './tenant.service.js';
import { internshipStateMachine } from './internship-state-machine.service.js';
import { workflowService } from './workflow.service.js';
import { auditService } from './audit.service.js';
import { notificationService } from './notification.service.js';

export interface InMemoryCompany {
  id: string;
  organizationId: string;
  name: string;
  industry: string;
  website?: string;
  address?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryInternshipDetail {
  id: string;
  organizationId: string;
  studentId: string;
  companyId: string;
  title: string;
  role?: string;
  type: string;
  status: InternshipStatus;
  startDate: Date;
  endDate: Date;
  description?: string;
  rejectionReason?: string;
  facultyId?: string | null;
  facultyName?: string | null;
  mentorId?: string | null;
  mentor?: {
    name: string;
    email: string;
    designation: string;
    phone?: string;
  } | null;
  expectedOutcomes: ExpectedOutcomeDto[];
  outcomeVersion: number;
  workflowInstanceId?: string | null;
  stateHistory: Array<{
    fromStatus: InternshipStatus;
    toStatus: InternshipStatus;
    changedBy: string;
    changedAt: string;
    reason?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export class InternshipStore {
  companies = new Map<string, InMemoryCompany>();
  details = new Map<string, InMemoryInternshipDetail>();
  outcomeVersions = new Map<string, OutcomeVersionDto[]>();

  constructor() {
    this.seed();
  }

  seed() {
    const seedDate = new Date('2026-01-01');

    // Seed Companies for ORG_A
    this.companies.set('company-a-tech', {
      id: 'company-a-tech',
      organizationId: 'org-a-id',
      name: 'Google Cloud Solutions',
      industry: 'Cloud & Artificial Intelligence',
      website: 'https://cloud.google.com',
      address: '1600 Amphitheatre Pkwy, Mountain View, CA',
      isVerified: true,
      createdAt: seedDate,
      updatedAt: seedDate,
    });
    this.companies.set('company-a-cloud', {
      id: 'company-a-cloud',
      organizationId: 'org-a-id',
      name: 'Amazon Web Systems',
      industry: 'Distributed Systems',
      website: 'https://aws.amazon.com',
      address: '410 Terry Ave N, Seattle, WA',
      isVerified: true,
      createdAt: seedDate,
      updatedAt: seedDate,
    });

    // Seed Companies for ORG_B
    this.companies.set('company-b-robotics', {
      id: 'company-b-robotics',
      organizationId: 'org-b-id',
      name: 'Boston Dynamics Labs',
      industry: 'Autonomous Robotics',
      website: 'https://bostondynamics.com',
      address: '78 4th Ave, Waltham, MA',
      isVerified: true,
      createdAt: seedDate,
      updatedAt: seedDate,
    });

    // Seed Initial Details for existing seed internships in tenantStore
    this.syncSeedInternship(
      'internship-a-1',
      'org-a-id',
      'user-a-student',
      'company-a-tech',
      'Full Stack Engineering Internship',
      'FULL_TIME',
      InternshipStatus.ACTIVE,
      new Date('2026-06-01'),
      new Date('2027-01-12'),
      'user-a-mentor',
      {
        name: 'Mark Mentor',
        email: 'mentor@org-a.com',
        designation: 'Staff Solutions Architect',
        phone: '+1 555-0199',
      }
    );

    this.syncSeedInternship(
      'internship-a-2',
      'org-a-id',
      'user-a-student-2',
      'company-a-cloud',
      'Distributed Systems & API Intern',
      'FULL_TIME',
      InternshipStatus.ACTIVE,
      new Date('2026-06-15'),
      new Date('2026-12-15'),
      'user-a-mentor-2',
      {
        name: 'Sarah Jenkins',
        email: 'sarah.mentor@org-a.com',
        designation: 'Principal Systems Engineer',
        phone: '+1 555-0244',
      }
    );

    this.syncSeedInternship(
      'internship-a-3',
      'org-a-id',
      'user-a-student-3',
      'company-a-cloud',
      'Cloud Infrastructure & DevOps Internship',
      'FULL_TIME',
      InternshipStatus.ACTIVE,
      new Date('2026-07-01'),
      new Date('2026-11-30'),
      'user-a-mentor',
      {
        name: 'Mark Mentor',
        email: 'mentor@org-a.com',
        designation: 'Staff Solutions Architect',
        phone: '+1 555-0199',
      }
    );

    this.syncSeedInternship(
      'internship-a-4',
      'org-a-id',
      'user-a-student',
      'company-a-cloud',
      'AI Platform & Data Systems Intern',
      'PART_TIME',
      InternshipStatus.PENDING_APPROVAL,
      new Date('2026-08-01'),
      new Date('2026-12-31'),
      'user-a-mentor-2',
      {
        name: 'Sarah Jenkins',
        email: 'sarah.mentor@org-a.com',
        designation: 'Principal Systems Engineer',
        phone: '+1 555-0244',
      }
    );

    this.syncSeedInternship(
      'internship-b-1',
      'org-b-id',
      'user-b-student',
      'company-b-robotics',
      'Robotics Autonomous Systems Intern',
      'FULL_TIME',
      InternshipStatus.ACTIVE,
      new Date('2026-05-01'),
      new Date('2026-11-01')
    );

    this.syncSeedInternship(
      'internship-reg-1',
      'org-a-id',
      'user-a-student',
      'company-a-tech',
      'Full Stack Engineering Internship',
      'FULL_TIME',
      InternshipStatus.PENDING_APPROVAL,
      new Date('2026-06-01'),
      new Date('2027-01-12'),
      'user-a-mentor',
      {
        name: 'Mark Mentor',
        email: 'mentor@org-a.com',
        designation: 'Staff Solutions Architect',
        phone: '+1 555-0199',
      }
    );
  }

  private syncSeedInternship(
    id: string,
    organizationId: string,
    studentId: string,
    companyId: string,
    title: string,
    type: string,
    status: InternshipStatus,
    startDate: Date,
    endDate: Date,
    mentorId?: string | null,
    mentor?: {
      name: string;
      email: string;
      designation: string;
      phone?: string;
    } | null
  ) {
    const outcomes: ExpectedOutcomeDto[] = [
      {
        id: `outcome-${id}-1`,
        title: 'Production API Development',
        description: 'Design and deploy robust REST/GraphQL endpoints',
        expectedEvidence: 'GitHub pull request and Postman test runs',
        status: OutcomeStatus.PLANNED,
      },
      {
        id: `outcome-${id}-2`,
        title: 'CI/CD Pipeline Integration',
        description: 'Configure automated verification and cloud deploy scripts',
        expectedEvidence: 'Workflow build badge and staging deployment URL',
        status: OutcomeStatus.PLANNED,
      },
    ];

    const detail: InMemoryInternshipDetail = {
      id,
      organizationId,
      studentId,
      companyId,
      title,
      role: title,
      type,
      status,
      startDate,
      endDate,
      description: `Structured academic internship in ${title}`,
      facultyId: 'user-a-faculty',
      facultyName: 'Dr. Alan Turing',
      mentorId: mentorId || null,
      mentor: mentor || {
        name: 'Mark Mentor',
        email: 'mentor@org-a.com',
        designation: 'Staff Software Engineer',
        phone: '+1 555-0199',
      },
      expectedOutcomes: outcomes,
      outcomeVersion: 1,
      workflowInstanceId: null,
      stateHistory: [
        {
          fromStatus: InternshipStatus.DRAFT,
          toStatus: status,
          changedBy: 'system',
          changedAt: new Date().toISOString(),
          reason: 'Initial setup',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.details.set(id, detail);
    this.outcomeVersions.set(id, [
      {
        id: `ov-${id}-1`,
        internshipId: id,
        versionNumber: 1,
        outcomes,
        updatedBy: studentId,
        createdAt: new Date().toISOString(),
      },
    ]);
  }
}

export const internshipStore = new InternshipStore();

export class InternshipService {
  // ==========================================
  // Company Directory Management
  // ==========================================

  async getCompanies(organizationId: string): Promise<CompanyDto[]> {
    return Array.from(internshipStore.companies.values())
      .filter((c) => c.organizationId === organizationId)
      .map(this.mapCompanyToDto);
  }

  async createCompany(organizationId: string, dto: CreateCompanyDto, creatorId?: string): Promise<CompanyDto> {
    if (!dto.name || !dto.name.trim()) {
      throw new ValidationError('Company name is required');
    }
    if (!dto.industry || !dto.industry.trim()) {
      throw new ValidationError('Company industry is required');
    }

    // Check if company with same name already exists in organization
    const existing = Array.from(internshipStore.companies.values()).find(
      (c) => c.organizationId === organizationId && c.name.toLowerCase() === dto.name.trim().toLowerCase()
    );
    if (existing) {
      return this.mapCompanyToDto(existing);
    }

    const id = `company-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const newCompany: InMemoryCompany = {
      id,
      organizationId,
      name: dto.name.trim(),
      industry: dto.industry.trim(),
      website: dto.website?.trim() || undefined,
      address: dto.address?.trim() || undefined,
      isVerified: false,
      createdAt: now,
      updatedAt: now,
    };

    internshipStore.companies.set(id, newCompany);

    auditService.log({
      organizationId,
      userId: creatorId || 'system',
      action: AuditAction.COMPANY_CREATE,
      entity: 'Company',
      entityId: id,
      details: { name: newCompany.name, industry: newCompany.industry },
    });

    return this.mapCompanyToDto(newCompany);
  }

  // ==========================================
  // Student Internship Registration
  // ==========================================

  async registerInternship(
    organizationId: string,
    studentId: string,
    dto: InternshipRegistrationDto
  ): Promise<InternshipDetailsDto> {
    if (!dto.title || !dto.title.trim()) {
      throw new ValidationError('Internship title/role is required');
    }
    if (!dto.startDate || !dto.endDate) {
      throw new ValidationError('Internship start and end dates are required');
    }

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ValidationError('Invalid start or end date format');
    }
    if (start >= end) {
      throw new ValidationError('Internship end date must be after start date');
    }

    // Determine Company: select existing or create new
    let companyId = dto.companyId;
    if (!companyId) {
      if (!dto.newCompany || !dto.newCompany.name) {
        throw new ValidationError('Either an existing company selection or new company details are required');
      }
      const company = await this.createCompany(organizationId, dto.newCompany, studentId);
      companyId = company.id;
    } else {
      const existingCompany = internshipStore.companies.get(companyId);
      if (!existingCompany) {
        throw new NotFoundError('Company', companyId);
      }
      if (existingCompany.organizationId !== organizationId) {
        throw new TenantViolationError('Cross-tenant company access prohibited');
      }
    }

    // Process Structured Expected Outcomes
    const outcomes: ExpectedOutcomeDto[] = (dto.expectedOutcomes || []).map((o, idx) => ({
      id: `outcome-${Date.now().toString(36)}-${idx + 1}`,
      title: o.title,
      description: o.description || undefined,
      expectedEvidence: o.expectedEvidence,
      status: OutcomeStatus.PLANNED,
    }));

    const id = `internship-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    // 1. Store in tenantStore for cross-compatibility
    const baseInternship: InMemoryInternship = {
      id,
      organizationId,
      studentId,
      companyId,
      title: dto.title.trim(),
      type: dto.internshipType || 'FULL_TIME',
      status: InternshipStatus.DRAFT,
      startDate: start,
      endDate: end,
      createdAt: now,
      updatedAt: now,
    };
    tenantStore.internships.set(id, baseInternship);

    // 2. Store rich details
    const detail: InMemoryInternshipDetail = {
      id,
      organizationId,
      studentId,
      companyId,
      title: dto.title.trim(),
      role: dto.role?.trim() || dto.title.trim(),
      type: dto.internshipType || 'FULL_TIME',
      status: InternshipStatus.DRAFT,
      startDate: start,
      endDate: end,
      description: dto.description?.trim() || undefined,
      facultyId: null,
      facultyName: null,
      mentorId: null,
      mentor: dto.mentor
        ? {
            name: dto.mentor.name.trim(),
            email: dto.mentor.email.trim(),
            designation: dto.mentor.designation.trim(),
            phone: dto.mentor.phone?.trim(),
          }
        : null,
      expectedOutcomes: outcomes,
      outcomeVersion: 1,
      workflowInstanceId: null,
      stateHistory: [
        {
          fromStatus: InternshipStatus.DRAFT,
          toStatus: InternshipStatus.DRAFT,
          changedBy: studentId,
          changedAt: now.toISOString(),
          reason: 'Initial student registration created in DRAFT',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    internshipStore.details.set(id, detail);

    // 3. Save initial outcome version
    internshipStore.outcomeVersions.set(id, [
      {
        id: `ov-${id}-1`,
        internshipId: id,
        versionNumber: 1,
        outcomes,
        updatedBy: studentId,
        createdAt: now.toISOString(),
      },
    ]);

    // 4. Audit Log
    auditService.log({
      organizationId,
      userId: studentId,
      action: AuditAction.INTERNSHIP_CREATE,
      entity: 'Internship',
      entityId: id,
      details: {
        title: detail.title,
        companyId: detail.companyId,
        outcomesCount: outcomes.length,
      },
    });

    return this.mapDetailToDto(detail);
  }

  // ==========================================
  // Update Internship (Date Editing Rule & Outcomes)
  // ==========================================

  async updateInternship(
    organizationId: string,
    internshipId: string,
    user: AuthenticatedUser,
    dto: UpdateInternshipRegistrationDto
  ): Promise<InternshipDetailsDto> {
    const detail = internshipStore.details.get(internshipId);
    if (!detail) {
      throw new NotFoundError('Internship', internshipId);
    }
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant internship access prohibited');
    }

    const normalizedRole = normalizeRole(user.role);

    // Student specific check: must own this internship unless Admin/Faculty
    if (normalizedRole === UserRole.STUDENT && detail.studentId !== user.id) {
      throw new TenantViolationError('Students may only edit their own internship registration');
    }

    // DATE EDITING RULE:
    // Before approval (DRAFT, PENDING_APPROVAL): student can edit.
    // After approval (APPROVED, ACTIVE, etc.): student cannot directly modify dates!
    if (dto.startDate || dto.endDate) {
      const isApprovedOrBeyond = [
        InternshipStatus.APPROVED,
        InternshipStatus.ACTIVE,
        InternshipStatus.READY_FOR_COMPLETION,
        InternshipStatus.COMPLETED,
        InternshipStatus.TERMINATED,
      ].includes(detail.status);

      if (normalizedRole === UserRole.STUDENT && isApprovedOrBeyond) {
        throw new BadRequestError(
          `Students cannot modify internship start or end dates after the internship has been APPROVED (current status: ${detail.status}). Contact your Faculty Coordinator or Department HOD for official amendments.`
        );
      }

      if (dto.startDate) {
        const start = new Date(dto.startDate);
        if (isNaN(start.getTime())) throw new ValidationError('Invalid start date format');
        detail.startDate = start;
      }
      if (dto.endDate) {
        const end = new Date(dto.endDate);
        if (isNaN(end.getTime())) throw new ValidationError('Invalid end date format');
        detail.endDate = end;
      }
      if (detail.startDate >= detail.endDate) {
        throw new ValidationError('End date must be after start date');
      }

      // Sync base internship
      const base = tenantStore.internships.get(internshipId);
      if (base) {
        base.startDate = detail.startDate;
        base.endDate = detail.endDate;
      }
    }

    if (dto.title) {
      detail.title = dto.title.trim();
      const base = tenantStore.internships.get(internshipId);
      if (base) base.title = detail.title;
    }
    if (dto.role) detail.role = dto.role.trim();
    if (dto.internshipType) {
      detail.type = dto.internshipType;
      const base = tenantStore.internships.get(internshipId);
      if (base) base.type = detail.type;
    }
    if (dto.description !== undefined) detail.description = dto.description.trim();
    if (dto.companyId) {
      const comp = internshipStore.companies.get(dto.companyId);
      if (!comp || comp.organizationId !== organizationId) {
        throw new NotFoundError('Company', dto.companyId);
      }
      detail.companyId = comp.id;
      const base = tenantStore.internships.get(internshipId);
      if (base) base.companyId = comp.id;
    }
    if (dto.mentor) {
      detail.mentor = {
        name: dto.mentor.name.trim(),
        email: dto.mentor.email.trim(),
        designation: dto.mentor.designation.trim(),
        phone: dto.mentor.phone?.trim(),
      };
    }

    // Outcome Versioning
    if (dto.expectedOutcomes && Array.isArray(dto.expectedOutcomes)) {
      detail.expectedOutcomes = dto.expectedOutcomes;
      detail.outcomeVersion += 1;

      const history = internshipStore.outcomeVersions.get(internshipId) || [];
      const newVersion: OutcomeVersionDto = {
        id: `ov-${internshipId}-${detail.outcomeVersion}`,
        internshipId,
        versionNumber: detail.outcomeVersion,
        outcomes: detail.expectedOutcomes,
        updatedBy: user.id,
        createdAt: new Date().toISOString(),
      };
      history.push(newVersion);
      internshipStore.outcomeVersions.set(internshipId, history);

      auditService.log({
        organizationId,
        userId: user.id,
        action: AuditAction.OUTCOME_VERSION_CREATE,
        entity: 'OutcomeVersion',
        entityId: newVersion.id,
        details: {
          internshipId,
          versionNumber: detail.outcomeVersion,
          outcomesCount: detail.expectedOutcomes.length,
        },
      });
    }

    detail.updatedAt = new Date();

    auditService.log({
      organizationId,
      userId: user.id,
      action: AuditAction.INTERNSHIP_UPDATE,
      entity: 'Internship',
      entityId: internshipId,
    });

    return this.mapDetailToDto(detail);
  }

  // ==========================================
  // Centralized State Machine Transitions
  // ==========================================

  async transitionState(
    organizationId: string,
    internshipId: string,
    user: AuthenticatedUser,
    dto: StateTransitionDto
  ): Promise<InternshipDetailsDto> {
    const detail = internshipStore.details.get(internshipId);
    if (!detail) {
      throw new NotFoundError('Internship', internshipId);
    }
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant state transition prohibited');
    }

    const fromStatus = detail.status;
    const toStatus = dto.targetStatus;

    // Validate using Centralized State Machine Engine
    internshipStateMachine.validateTransition(fromStatus, toStatus, user.role, dto.reason);

    // Apply Transition
    detail.status = toStatus;
    detail.updatedAt = new Date();

    // Record in State History
    detail.stateHistory.push({
      fromStatus,
      toStatus,
      changedBy: user.id,
      changedAt: new Date().toISOString(),
      reason: dto.reason,
    });

    // Sync base internship status
    const base = tenantStore.internships.get(internshipId);
    if (base) {
      base.status = toStatus;
      base.updatedAt = detail.updatedAt;
    }

    // Post-Approval Lifecycle Trigger:
    // When transitioning to APPROVED, automatically determine workflow blueprint,
    // generate WorkflowInstance and tasks!
    if (toStatus === InternshipStatus.APPROVED && !detail.workflowInstanceId) {
      try {
        const wfInstance = await workflowService.assignWorkflowToInternship(
          organizationId,
          internshipId,
          user.id
        );
        detail.workflowInstanceId = wfInstance.id;
      } catch (err) {
        // If workflow assignment fails (e.g. no active template), log warning but proceed
        console.warn(`[InternshipService] Auto-workflow assignment warning: ${err instanceof Error ? err.message : err}`);
      }
    }

    // Audit Log
    auditService.log({
      organizationId,
      userId: user.id,
      action: AuditAction.INTERNSHIP_STATE_TRANSITION,
      entity: 'Internship',
      entityId: internshipId,
      details: {
        fromStatus,
        toStatus,
        reason: dto.reason,
      },
    });

    return this.mapDetailToDto(detail);
  }

  // ==========================================
  // Submit for Approval (Student)
  // ==========================================

  async submitForApproval(
    organizationId: string,
    internshipId: string,
    user: AuthenticatedUser
  ): Promise<InternshipDetailsDto> {
    const res = await this.transitionState(organizationId, internshipId, user, {
      targetStatus: InternshipStatus.PENDING_APPROVAL,
      reason: 'Student submitted registration for institutional approval',
    });

    auditService.log({
      organizationId,
      userId: user.id,
      action: AuditAction.INTERNSHIP_SUBMIT,
      entity: 'Internship',
      entityId: internshipId,
    });

    notificationService.notifyInternshipSubmitted({
      organizationId,
      internshipId,
      recipientIds: ['user-a-admin', 'user-a-faculty', 'user-a-hod'],
      studentName: user.email || 'Student',
      internshipTitle: res.title,
    }).catch(() => {});

    return res;
  }

  // ==========================================
  // Approval Decision (Approver: HOD / Admin / Faculty)
  // ==========================================

  async decideApproval(
    organizationId: string,
    internshipId: string,
    user: AuthenticatedUser,
    dto: ApprovalDecisionDto
  ): Promise<InternshipDetailsDto> {
    const detail = internshipStore.details.get(internshipId);
    if (!detail) {
      throw new NotFoundError('Internship', internshipId);
    }
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant internship approval prohibited');
    }

    if (dto.approved) {
      const res = await this.transitionState(organizationId, internshipId, user, {
        targetStatus: InternshipStatus.APPROVED,
        reason: dto.reason || 'Approved by authorized institutional coordinator',
      });

      auditService.log({
        organizationId,
        userId: user.id,
        action: AuditAction.INTERNSHIP_APPROVE,
        entity: 'Internship',
        entityId: internshipId,
      });

      notificationService.notifyInternshipApproved({
        organizationId,
        internshipId,
        studentId: detail.studentId,
        internshipTitle: detail.title,
      }).catch(() => {});

      return res;
    } else {
      if (!dto.reason || !dto.reason.trim()) {
        throw new ValidationError('A detailed reason is required when rejecting an internship registration');
      }

      detail.rejectionReason = dto.reason.trim();
      const res = await this.transitionState(organizationId, internshipId, user, {
        targetStatus: InternshipStatus.REJECTED,
        reason: dto.reason.trim(),
      });

      auditService.log({
        organizationId,
        userId: user.id,
        action: AuditAction.INTERNSHIP_REJECT,
        entity: 'Internship',
        entityId: internshipId,
        details: { rejectionReason: dto.reason.trim() },
      });

      notificationService.notifyInternshipRejected({
        organizationId,
        internshipId,
        studentId: detail.studentId,
        internshipTitle: detail.title,
        reason: dto.reason.trim(),
      }).catch(() => {});

      return res;
    }
  }

  // ==========================================
  // Assignments (HOD / Admin)
  // ==========================================

  async assignFaculty(
    organizationId: string,
    internshipId: string,
    user: AuthenticatedUser,
    dto: AssignFacultyDto
  ): Promise<InternshipDetailsDto> {
    const detail = internshipStore.details.get(internshipId);
    if (!detail) {
      throw new NotFoundError('Internship', internshipId);
    }
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant faculty assignment prohibited');
    }

    const role = normalizeRole(user.role);
    if (![UserRole.HOD, UserRole.ADMIN].includes(role)) {
      throw new TenantViolationError('Only HOD or Admin can assign faculty coordinators');
    }

    if (!dto.facultyId) {
      throw new ValidationError('Faculty coordinator ID is required');
    }

    detail.facultyId = dto.facultyId;
    detail.facultyName = dto.facultyName || 'Assigned Faculty Coordinator';
    detail.updatedAt = new Date();

    auditService.log({
      organizationId,
      userId: user.id,
      action: AuditAction.INTERNSHIP_ASSIGN_FACULTY,
      entity: 'Internship',
      entityId: internshipId,
      details: { facultyId: dto.facultyId, facultyName: detail.facultyName },
    });

    return this.mapDetailToDto(detail);
  }

  async assignMentor(
    organizationId: string,
    internshipId: string,
    user: AuthenticatedUser,
    dto: AssignMentorDto
  ): Promise<InternshipDetailsDto> {
    const detail = internshipStore.details.get(internshipId);
    if (!detail) {
      throw new NotFoundError('Internship', internshipId);
    }
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant mentor assignment prohibited');
    }

    if (!dto.mentorName || !dto.mentorEmail) {
      throw new ValidationError('Mentor name and email are required');
    }

    detail.mentorId = dto.mentorId || `mentor-${Date.now().toString(36)}`;
    detail.mentor = {
      name: dto.mentorName.trim(),
      email: dto.mentorEmail.trim(),
      designation: dto.designation || 'Industry Mentor',
      phone: dto.phone,
    };
    detail.updatedAt = new Date();

    auditService.log({
      organizationId,
      userId: user.id,
      action: AuditAction.INTERNSHIP_ASSIGN_MENTOR,
      entity: 'Internship',
      entityId: internshipId,
      details: { mentorName: detail.mentor.name, mentorEmail: detail.mentor.email },
    });

    auditService.log({
      organizationId,
      userId: user.id,
      action: 'MENTOR_ASSIGNMENT',
      entity: 'Internship',
      entityId: internshipId,
      details: { mentorName: detail.mentor.name, mentorEmail: detail.mentor.email },
    });

    notificationService.notifyMentorAssigned({
      organizationId,
      internshipId,
      mentorId: detail.mentorId,
      studentId: detail.studentId,
      mentorName: detail.mentor.name,
      studentName: 'Student',
      internshipTitle: detail.title,
    }).catch(() => {});

    return this.mapDetailToDto(detail);
  }

  // ==========================================
  // Queries
  // ==========================================

  async getInternships(
    organizationId: string,
    user: AuthenticatedUser,
    filters?: { status?: InternshipStatus; search?: string }
  ): Promise<InternshipDetailsDto[]> {
    const role = normalizeRole(user.role);
    let list = Array.from(internshipStore.details.values()).filter(
      (d) => d.organizationId === organizationId
    );

    // Role-based visibility
    if (role === UserRole.STUDENT) {
      list = list.filter((d) => d.studentId === user.id);
    } else if (role === UserRole.FACULTY) {
      // Show internships assigned to this faculty, or all if none assigned yet
      const assigned = list.filter((d) => d.facultyId === user.id);
      if (assigned.length > 0) {
        list = assigned;
      }
    }

    if (filters?.status) {
      list = list.filter((d) => d.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.role && d.role.toLowerCase().includes(q)) ||
          d.companyId.toLowerCase().includes(q)
      );
    }

    return list.map(this.mapDetailToDto);
  }

  async getInternshipById(organizationId: string, internshipId: string): Promise<InternshipDetailsDto> {
    const detail = internshipStore.details.get(internshipId);
    if (!detail) {
      throw new NotFoundError('Internship', internshipId);
    }
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant internship access prohibited');
    }
    return this.mapDetailToDto(detail);
  }

  async getOutcomeVersions(organizationId: string, internshipId: string): Promise<OutcomeVersionDto[]> {
    const detail = internshipStore.details.get(internshipId);
    if (!detail) {
      throw new NotFoundError('Internship', internshipId);
    }
    if (detail.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant outcome version access prohibited');
    }
    return internshipStore.outcomeVersions.get(internshipId) || [];
  }

  // ==========================================
  // DTO Mappers
  // ==========================================

  private mapCompanyToDto(c: InMemoryCompany): CompanyDto {
    return {
      id: c.id,
      organizationId: c.organizationId,
      name: c.name,
      industry: c.industry,
      website: c.website,
      address: c.address,
      isVerified: c.isVerified,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  private mapDetailToDto(d: InMemoryInternshipDetail): InternshipDetailsDto {
    const comp = internshipStore.companies.get(d.companyId) || {
      id: d.companyId,
      organizationId: d.organizationId,
      name: 'Host Organization',
      industry: 'Technology',
      isVerified: false,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };

    return {
      id: d.id,
      organizationId: d.organizationId,
      studentId: d.studentId,
      studentName: 'Student Candidate',
      companyId: d.companyId,
      company: {
        id: comp.id,
        organizationId: comp.organizationId,
        name: comp.name,
        industry: comp.industry,
        website: comp.website,
        address: comp.address,
        isVerified: comp.isVerified,
        createdAt: comp.createdAt.toISOString(),
        updatedAt: comp.updatedAt.toISOString(),
      },
      title: d.title,
      role: d.role,
      type: d.type,
      status: d.status,
      startDate: d.startDate.toISOString(),
      endDate: d.endDate.toISOString(),
      description: d.description,
      rejectionReason: d.rejectionReason,
      facultyId: d.facultyId,
      facultyName: d.facultyName,
      mentorId: d.mentorId,
      mentor: d.mentor,
      expectedOutcomes: d.expectedOutcomes,
      outcomeVersion: d.outcomeVersion,
      workflowInstanceId: d.workflowInstanceId,
      stateHistory: d.stateHistory,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    };
  }
}

export const internshipService = new InternshipService();
