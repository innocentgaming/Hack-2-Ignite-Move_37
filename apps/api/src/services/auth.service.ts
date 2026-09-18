import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma, isDatabaseOnline } from '../lib/prisma.js';
import { UnauthorizedError, NotFoundError, ConflictError, ValidationError, normalizeRole } from '@internos/shared';
import {
  LoginRequestDto,
  LoginResponseData,
  UserRole,
  UserStatus,
  InviteUserDto,
  InviteResponseData,
  ActivateAccountDto,
  LogoutResponseData,
  AuthenticatedUser,
  RegisterInstitutionDto,
  RegisterInstitutionResponseData,
} from '@internos/types';
import { env } from '../config/env.js';
import { revokeToken } from '../middleware/auth.js';
import { auditService } from './audit.service.js';

export interface InMemoryUser {
  id: string;
  organizationId: string;
  departmentId?: string | null;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  activationToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryOrg {
  id: string;
  code: string;
  name: string;
  domain?: string;
  settings?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// In-Memory Multi-Tenant Store (Used for offline parity and CI/Testing)
class AuthStore {
  public organizations: Map<string, InMemoryOrg> = new Map();
  public users: Map<string, InMemoryUser> = new Map();

  constructor() {
    this.seedDefaults();
  }

  public seedDefaults() {
    // Standard BCrypt hash for "Password123!"
    // Generated with bcryptjs, rounds=10
    const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);
    const seedDate = new Date('2026-09-01T00:00:00Z');

    // 1. Isolated Demo Tenant: G H Raisoni International Skill Tech University, Pune
    const orgDemo: InMemoryOrg = {
      id: 'demo-ghristu-pune',
      code: 'GHRISTU_PUNE',
      name: 'G H Raisoni International Skill Tech University, Pune',
      domain: 'ghristu-demo.in',
      settings: {
        academicYear: '2026-2027',
        semester: 'Semester VII',
        institutionType: 'UNIVERSITY',
        officialEmailDomain: 'ghristu-demo.in',
        phoneNumber: '+91 20 6678 1234',
        pincode: '412207',
        accreditationDetails: 'State Private University / Skill Tech Center of Excellence',
        address: 'Wagholi, Pune-Ahmednagar Road',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        defaultInternshipDurationWeeks: 24,
        requireMentorEvaluation: true,
        allowStudentSelfRegistration: true,
        contactEmail: 'admin@ghristu-demo.in',
        isDemoAccount: true,
      },
      createdAt: seedDate,
      updatedAt: seedDate,
    };
    this.organizations.set(orgDemo.id, orgDemo);

    // 2. Organization A
    const orgA: InMemoryOrg = {
      id: 'org-a-id',
      code: 'ORG_A',
      name: 'Organization A University',
      domain: 'org-a.edu',
      settings: {
        academicYear: '2026-2027',
        semester: 'Fall',
        defaultInternshipDurationWeeks: 12,
        requireMentorEvaluation: true,
        allowStudentSelfRegistration: false,
        contactEmail: 'admin@org-a.edu',
      },
      createdAt: seedDate,
      updatedAt: seedDate,
    };
    this.organizations.set(orgA.id, orgA);

    // 3. Organization B
    const orgB: InMemoryOrg = {
      id: 'org-b-id',
      code: 'ORG_B',
      name: 'Organization B Institute',
      domain: 'org-b.edu',
      settings: {
        academicYear: '2026-2027',
        semester: 'Fall',
        defaultInternshipDurationWeeks: 16,
        requireMentorEvaluation: true,
        allowStudentSelfRegistration: false,
        contactEmail: 'admin@org-b.edu',
      },
      createdAt: seedDate,
      updatedAt: seedDate,
    };
    this.organizations.set(orgB.id, orgB);

    // 4. Apex Legacy Org
    const orgApex: InMemoryOrg = {
      id: 'apex-org-demo-uuid',
      code: 'apex-inst',
      name: 'Apex Institute of Technology',
      domain: 'apex.edu',
      settings: {
        academicYear: '2026-2027',
        semester: 'Fall',
        defaultInternshipDurationWeeks: 12,
        requireMentorEvaluation: true,
        allowStudentSelfRegistration: true,
        contactEmail: 'contact@apex.edu',
      },
      createdAt: seedDate,
      updatedAt: seedDate,
    };
    this.organizations.set(orgApex.id, orgApex);

    // Seed GHRISTU_PUNE Demo Users (ADMIN, MENTORS, STUDENTS - No Faculty/HOD)
    const ghristuUsers: Omit<InMemoryUser, 'createdAt' | 'updatedAt'>[] = [
      // Admin
      {
        id: 'user-ghristu-admin',
        organizationId: 'demo-ghristu-pune',
        departmentId: 'dept-ghristu-ce',
        email: 'admin@ghristu-demo.in',
        passwordHash: defaultPasswordHash,
        firstName: 'Dr. Anil',
        lastName: 'Deshmukh',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
      // Mentor 1 (TCS)
      {
        id: 'user-ghristu-mentor-1',
        organizationId: 'demo-ghristu-pune',
        departmentId: 'dept-ghristu-ce',
        email: 'rahul.mehta@ghristu-demo.in',
        passwordHash: defaultPasswordHash,
        firstName: 'Rahul',
        lastName: 'Mehta',
        role: UserRole.MENTOR,
        status: UserStatus.ACTIVE,
      },
      // Mentor 2 (Infosys)
      {
        id: 'user-ghristu-mentor-2',
        organizationId: 'demo-ghristu-pune',
        departmentId: 'dept-ghristu-it',
        email: 'priya.nair@ghristu-demo.in',
        passwordHash: defaultPasswordHash,
        firstName: 'Priya',
        lastName: 'Nair',
        role: UserRole.MENTOR,
        status: UserStatus.ACTIVE,
      },
      // Mentor 3 (Persistent Systems)
      {
        id: 'user-ghristu-mentor-3',
        organizationId: 'demo-ghristu-pune',
        departmentId: 'dept-ghristu-csa',
        email: 'amit.kulkarni@ghristu-demo.in',
        passwordHash: defaultPasswordHash,
        firstName: 'Amit',
        lastName: 'Kulkarni',
        role: UserRole.MENTOR,
        status: UserStatus.ACTIVE,
      },
      // Mentor 4 (Tech Mahindra)
      {
        id: 'user-ghristu-mentor-4',
        organizationId: 'demo-ghristu-pune',
        departmentId: 'dept-ghristu-ce',
        email: 'vikram.deshmukh@ghristu-demo.in',
        passwordHash: defaultPasswordHash,
        firstName: 'Vikram',
        lastName: 'Deshmukh',
        role: UserRole.MENTOR,
        status: UserStatus.ACTIVE,
      },
      // Student 1 (Aarav Sharma - B.Tech CE)
      {
        id: 'user-ghristu-student-1',
        organizationId: 'demo-ghristu-pune',
        departmentId: 'dept-ghristu-ce',
        email: 'aarav.sharma@ghristu-demo.in',
        passwordHash: defaultPasswordHash,
        firstName: 'Aarav',
        lastName: 'Sharma',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
      // Student 2 (Ananya Patil - B.Tech IT)
      {
        id: 'user-ghristu-student-2',
        organizationId: 'demo-ghristu-pune',
        departmentId: 'dept-ghristu-it',
        email: 'ananya.patil@ghristu-demo.in',
        passwordHash: defaultPasswordHash,
        firstName: 'Ananya',
        lastName: 'Patil',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
      // Student 3 (Rohan Joshi - BCA)
      {
        id: 'user-ghristu-student-3',
        organizationId: 'demo-ghristu-pune',
        departmentId: 'dept-ghristu-csa',
        email: 'rohan.joshi@ghristu-demo.in',
        passwordHash: defaultPasswordHash,
        firstName: 'Rohan',
        lastName: 'Joshi',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
      // Student 4 (Sneha Kulkarni - B.Tech CSE)
      {
        id: 'user-ghristu-student-4',
        organizationId: 'demo-ghristu-pune',
        departmentId: 'dept-ghristu-ce',
        email: 'sneha.kulkarni@ghristu-demo.in',
        passwordHash: defaultPasswordHash,
        firstName: 'Sneha',
        lastName: 'Kulkarni',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
    ];

    // Seed ORG_A Users (ADMIN, STUDENT, MENTOR)
    const orgAUsers: Omit<InMemoryUser, 'createdAt' | 'updatedAt'>[] = [
      {
        id: 'user-a-admin',
        organizationId: 'org-a-id',
        departmentId: 'dept-a-cs',
        email: 'admin@org-a.com',
        passwordHash: defaultPasswordHash,
        firstName: 'Alice',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
      {
        id: 'user-a-hod',
        organizationId: 'org-a-id',
        departmentId: 'dept-a-cs',
        email: 'hod@org-a.com',
        passwordHash: defaultPasswordHash,
        firstName: 'Helen',
        lastName: 'HOD',
        role: UserRole.HOD,
        status: UserStatus.ACTIVE,
      },
      {
        id: 'user-a-faculty',
        organizationId: 'org-a-id',
        departmentId: 'dept-a-cs',
        email: 'faculty@org-a.com',
        passwordHash: defaultPasswordHash,
        firstName: 'Fiona',
        lastName: 'Faculty',
        role: UserRole.FACULTY,
        status: UserStatus.ACTIVE,
      },
      {
        id: 'user-a-student',
        organizationId: 'org-a-id',
        departmentId: 'dept-a-cs',
        email: 'student@org-a.com',
        passwordHash: defaultPasswordHash,
        firstName: 'Sam',
        lastName: 'Student',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
      {
        id: 'user-a-student-2',
        organizationId: 'org-a-id',
        departmentId: 'dept-a-it',
        email: 'maya.student@org-a.com',
        passwordHash: defaultPasswordHash,
        firstName: 'Maya',
        lastName: 'Patel',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
      {
        id: 'user-a-student-3',
        organizationId: 'org-a-id',
        departmentId: 'dept-a-cs',
        email: 'david.student@org-a.com',
        passwordHash: defaultPasswordHash,
        firstName: 'David',
        lastName: 'Chen',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
      {
        id: 'user-a-mentor',
        organizationId: 'org-a-id',
        departmentId: 'dept-a-cs',
        email: 'mentor@org-a.com',
        passwordHash: defaultPasswordHash,
        firstName: 'Mark',
        lastName: 'Mentor',
        role: UserRole.MENTOR,
        status: UserStatus.ACTIVE,
      },
      {
        id: 'user-a-mentor-2',
        organizationId: 'org-a-id',
        departmentId: 'dept-a-it',
        email: 'sarah.mentor@org-a.com',
        passwordHash: defaultPasswordHash,
        firstName: 'Sarah',
        lastName: 'Jenkins',
        role: UserRole.MENTOR,
        status: UserStatus.ACTIVE,
      },
    ];

    // Seed ORG_B Users (ADMIN, STUDENT, MENTOR)
    const orgBUsers: Omit<InMemoryUser, 'createdAt' | 'updatedAt'>[] = [
      {
        id: 'user-b-admin',
        organizationId: 'org-b-id',
        departmentId: 'dept-b-me',
        email: 'admin@org-b.com',
        passwordHash: defaultPasswordHash,
        firstName: 'Bob',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
      {
        id: 'user-b-student',
        organizationId: 'org-b-id',
        departmentId: 'dept-b-me',
        email: 'student@org-b.com',
        passwordHash: defaultPasswordHash,
        firstName: 'Sally',
        lastName: 'Student',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
      {
        id: 'user-b-mentor',
        organizationId: 'org-b-id',
        departmentId: 'dept-b-me',
        email: 'mentor@org-b.com',
        passwordHash: defaultPasswordHash,
        firstName: 'Mona',
        lastName: 'Mentor',
        role: UserRole.MENTOR,
        status: UserStatus.ACTIVE,
      },
    ];

    // Seed Legacy Demo Accounts (ADMIN, MENTOR, STUDENT)
    const legacyUsers: Omit<InMemoryUser, 'createdAt' | 'updatedAt'>[] = [
      {
        id: 'demo-user-admin',
        organizationId: 'apex-org-demo-uuid',
        departmentId: 'dept-cse-uuid',
        email: 'admin@apex.edu',
        passwordHash: defaultPasswordHash,
        firstName: 'Arthur',
        lastName: 'Pendelton',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
      {
        id: 'demo-user-mentor',
        organizationId: 'apex-org-demo-uuid',
        departmentId: 'dept-cse-uuid',
        email: 'raj.patel@acmecloud.com',
        passwordHash: defaultPasswordHash,
        firstName: 'Rajesh',
        lastName: 'Patel',
        role: UserRole.MENTOR,
        status: UserStatus.ACTIVE,
      },
      {
        id: 'demo-user-student',
        organizationId: 'apex-org-demo-uuid',
        departmentId: 'dept-cse-uuid',
        email: 'alex.student@apex.edu',
        passwordHash: defaultPasswordHash,
        firstName: 'Alex',
        lastName: 'Morgan',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
    ];

    const allSeed = [...ghristuUsers, ...orgAUsers, ...orgBUsers, ...legacyUsers];
    for (const u of allSeed) {
      this.users.set(u.id, {
        ...u,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  public findOrgByCode(code: string): InMemoryOrg | undefined {
    for (const org of this.organizations.values()) {
      if (org.code.toLowerCase() === code.toLowerCase()) {
        return org;
      }
    }
    return undefined;
  }

  public findUserByEmailAndOrg(email: string, orgId?: string): InMemoryUser | undefined {
    const normalizedEmail = email.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === normalizedEmail) {
        if (!orgId || user.organizationId === orgId) {
          return user;
        }
      }
    }
    return undefined;
  }
}

export const authStore = new AuthStore();

export class AuthService {
  /**
   * Login with email and password, verified against organization
   */
  async login(dto: LoginRequestDto): Promise<LoginResponseData> {
    const { email, password, organizationCode } = dto;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Live Prisma Attempt
    if (await isDatabaseOnline()) {
      try {
        let orgId: string | undefined;
        if (organizationCode) {
          const dbOrg = await prisma.organization.findUnique({
            where: { code: organizationCode },
          });
          if (dbOrg) {
            orgId = dbOrg.id;
          }
        }

        const dbUser = await prisma.user.findFirst({
          where: {
            email: normalizedEmail,
            ...(orgId ? { organizationId: orgId } : {}),
          },
          include: {
            organization: true,
            department: true,
          },
        });

        if (dbUser) {
          const isMatch = await bcrypt.compare(password, dbUser.passwordHash);
          if (!isMatch) {
            throw new UnauthorizedError('Invalid email or password');
          }

          if (dbUser.status !== UserStatus.ACTIVE) {
            throw new UnauthorizedError(`Account is ${dbUser.status.toLowerCase()}. Please activate your account.`);
          }

          const normalizedRole = normalizeRole(dbUser.role);

          const token = jwt.sign(
            {
              userId: dbUser.id,
              email: dbUser.email,
              role: normalizedRole,
              organizationId: dbUser.organizationId,
              organizationCode: dbUser.organization.code,
            },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
          );

          await auditService.log({
            organizationId: dbUser.organizationId,
            userId: dbUser.id,
            actorId: dbUser.id,
            actorEmail: dbUser.email,
            actorRole: normalizedRole,
            action: 'LOGIN',
            entity: 'User',
            entityId: dbUser.id,
            details: { email: dbUser.email, role: normalizedRole },
          });

          return {
            token,
            user: {
              id: dbUser.id,
              email: dbUser.email,
              firstName: dbUser.firstName,
              lastName: dbUser.lastName,
              role: normalizedRole,
              status: dbUser.status as UserStatus,
              organizationId: dbUser.organizationId,
              organizationName: dbUser.organization.name,
              organizationCode: dbUser.organization.code,
              departmentId: dbUser.departmentId,
            },
            organization: {
              id: dbUser.organization.id,
              name: dbUser.organization.name,
              code: dbUser.organization.code,
            },
          };
        }
      } catch (dbError) {
        if (dbError instanceof UnauthorizedError) {
          throw dbError;
        }
      }
    }

    // 2. Deterministic Fallback Store (Full Multi-Tenant Parity)
    let org: InMemoryOrg | undefined;
    if (organizationCode) {
      org = authStore.findOrgByCode(organizationCode);
      if (!org) {
        throw new NotFoundError('Organization', organizationCode);
      }
    }

    const memUser = authStore.findUserByEmailAndOrg(normalizedEmail, org?.id);
    if (!memUser) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, memUser.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (memUser.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError(`Account is ${memUser.status.toLowerCase()}. Please activate your account.`);
    }

    const userOrg = authStore.organizations.get(memUser.organizationId);
    if (!userOrg) {
      throw new UnauthorizedError('User organization not found');
    }

    const normalizedRole = normalizeRole(memUser.role);

    const token = jwt.sign(
      {
        userId: memUser.id,
        email: memUser.email,
        role: normalizedRole,
        organizationId: userOrg.id,
        organizationCode: userOrg.code,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );

    await auditService.log({
      organizationId: userOrg.id,
      userId: memUser.id,
      actorId: memUser.id,
      actorEmail: memUser.email,
      actorRole: normalizedRole,
      action: 'LOGIN',
      entity: 'User',
      entityId: memUser.id,
      details: { email: memUser.email, role: normalizedRole },
    });

    return {
      token,
      user: {
        id: memUser.id,
        email: memUser.email,
        firstName: memUser.firstName,
        lastName: memUser.lastName,
        role: normalizedRole,
        status: memUser.status,
        organizationId: userOrg.id,
        organizationName: userOrg.name,
        organizationCode: userOrg.code,
        departmentId: memUser.departmentId,
      },
      organization: {
        id: userOrg.id,
        name: userOrg.name,
        code: userOrg.code,
      },
    };
  }

  /**
   * Register / Invite a new user to the organization
   */
  async inviteUser(organizationId: string, dto: InviteUserDto): Promise<InviteResponseData> {
    const { email, role, firstName, lastName, departmentId } = dto;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedRole = normalizeRole(role);

    // Validate invited role against platform roles
    if (![UserRole.STUDENT, UserRole.MENTOR, UserRole.ADMIN, UserRole.FACULTY, UserRole.HOD].includes(normalizedRole)) {
      throw new ValidationError('Invalid role for organization invite');
    }

    // Check if user already exists in this organization
    const existingMemUser = authStore.findUserByEmailAndOrg(normalizedEmail, organizationId);
    if (existingMemUser) {
      throw new ConflictError(`User with email '${normalizedEmail}' already exists in this organization`);
    }

    const userId = `user-inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const activationToken = jwt.sign(
      {
        sub: 'account_activation',
        userId,
        email: normalizedEmail,
        organizationId,
      },
      env.JWT_SECRET,
      { expiresIn: '72h' }
    );

    const newUser: InMemoryUser = {
      id: userId,
      organizationId,
      departmentId: departmentId || null,
      email: normalizedEmail,
      passwordHash: '', // Unset until activation
      firstName,
      lastName,
      role: normalizedRole,
      status: UserStatus.PENDING_VERIFICATION,
      activationToken,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    authStore.users.set(userId, newUser);

    // Attempt DB write if available
    if (await isDatabaseOnline()) {
      try {
        await prisma.user.create({
          data: {
            id: userId,
            organizationId,
            departmentId: departmentId || null,
            email: normalizedEmail,
            passwordHash: '',
            firstName,
            lastName,
            role: normalizedRole as any,
            status: UserStatus.PENDING_VERIFICATION,
          },
        });
      } catch {
        // ignore offline db
      }
    }

    return {
      userId,
      email: normalizedEmail,
      role: normalizedRole,
      status: UserStatus.PENDING_VERIFICATION,
      activationToken,
      activationUrl: `${env.FRONTEND_URL}/activate?token=${activationToken}`,
      organizationId,
    };
  }

  /**
   * Activate user account with activation token and new password
   */
  async activateAccount(dto: ActivateAccountDto): Promise<{ message: string; user: AuthenticatedUser }> {
    const { token, password } = dto;

    if (!token) {
      throw new ValidationError('Activation token is required');
    }

    if (!password || password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    let payload: { sub?: string; userId: string; email: string; organizationId: string };
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as { sub?: string; userId: string; email: string; organizationId: string };
    } catch {
      throw new UnauthorizedError('Invalid or expired activation token');
    }

    if (payload.sub !== 'account_activation') {
      throw new UnauthorizedError('Invalid token purpose');
    }

    const user = authStore.users.get(payload.userId);
    if (!user) {
      throw new NotFoundError('User', payload.userId);
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new ConflictError('Account has already been activated');
    }

    // Secure password hashing
    const passwordHash = await bcrypt.hash(password, 10);

    user.passwordHash = passwordHash;
    user.status = UserStatus.ACTIVE;
    user.activationToken = undefined;
    user.updatedAt = new Date();

    // DB update if available
    if (await isDatabaseOnline()) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            status: UserStatus.ACTIVE,
          },
        });
      } catch {
        // ignore
      }
    }

    const org = authStore.organizations.get(user.organizationId);

    return {
      message: 'Account activated successfully. You may now log in.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: UserStatus.ACTIVE,
        organizationId: user.organizationId,
        organizationName: org?.name,
        organizationCode: org?.code,
        departmentId: user.departmentId,
      },
    };
  }

  /**
   * Register a new educational institution and create the initial admin user
   */
  async registerInstitution(dto: RegisterInstitutionDto): Promise<RegisterInstitutionResponseData> {
    const {
      institutionName,
      institutionCode,
      officialEmail,
      website,
      address,
      country,
      state,
      city,
      adminFirstName,
      adminLastName,
      adminEmail,
      password,
      institutionType,
      officialEmailDomain,
      phoneNumber,
      pincode,
      accreditationDetails,
    } = dto;

    const normalizedOrgCode = institutionCode.toUpperCase().trim();
    const normalizedAdminEmail = adminEmail.toLowerCase().trim();
    const normalizedOfficialEmail = officialEmail.toLowerCase().trim();

    // Indian PIN code validation (6 digits)
    if (pincode && !/^\d{6}$/.test(pincode.trim())) {
      throw new ValidationError('Indian PIN code must be exactly 6 digits');
    }

    // Phone number validation
    if (phoneNumber && !/^(\+91[\-\s]?)?[6-9]\d{9}$/.test(phoneNumber.trim().replace(/\s+/g, ''))) {
      // allow flexible format but warn if completely non-numeric
      if (phoneNumber.replace(/\D/g, '').length < 10) {
        throw new ValidationError('Contact phone number must have at least 10 digits');
      }
    }

    // Verify org code is unique
    const existingOrg = authStore.findOrgByCode(normalizedOrgCode);
    if (existingOrg) {
      throw new ConflictError(`Institution with code '${normalizedOrgCode}' already exists`);
    }

    // Verify admin email is unique
    const existingUser = Array.from(authStore.users.values()).find(
      (u) => u.email === normalizedAdminEmail
    );
    if (existingUser) {
      throw new ConflictError(`User with email '${normalizedAdminEmail}' already exists`);
    }

    const orgId = `org-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const adminId = `user-admin-${Date.now().toString(36)}`;
    const now = new Date();

    const passwordHash = await bcrypt.hash(password, 10);

    const newOrg: InMemoryOrg = {
      id: orgId,
      code: normalizedOrgCode,
      name: institutionName.trim(),
      domain: officialEmailDomain || website || `${normalizedOrgCode.toLowerCase()}.edu.in`,
      settings: {
        academicYear: '2026-2027',
        semester: 'Semester VII',
        officialEmail: normalizedOfficialEmail,
        institutionType: institutionType || 'UNIVERSITY',
        officialEmailDomain: officialEmailDomain || normalizedOfficialEmail.split('@')[1],
        phoneNumber: phoneNumber?.trim(),
        pincode: pincode?.trim(),
        accreditationDetails: accreditationDetails?.trim(),
        address: address?.trim(),
        country: country || 'India',
        state: state?.trim(),
        city: city?.trim(),
        requireMentorEvaluation: true,
        allowStudentSelfRegistration: true,
      },
      createdAt: now,
      updatedAt: now,
    };
    authStore.organizations.set(orgId, newOrg);

    // Seed default department
    const deptId = `dept-${Date.now().toString(36)}`;
    try {
      const { tenantStore } = await import('./tenant.service.js');
      tenantStore.departments.set(deptId, {
        id: deptId,
        organizationId: orgId,
        code: 'CSE',
        name: 'Computer Science & Engineering',
        description: 'Default academic department for technical internships',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    } catch {
      // ignore
    }

    const newAdminUser: InMemoryUser = {
      id: adminId,
      organizationId: orgId,
      departmentId: deptId,
      email: normalizedAdminEmail,
      passwordHash,
      firstName: adminFirstName.trim(),
      lastName: adminLastName.trim(),
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };
    authStore.users.set(adminId, newAdminUser);

    const token = jwt.sign(
      {
        userId: adminId,
        email: normalizedAdminEmail,
        role: UserRole.ADMIN,
        organizationId: orgId,
        organizationCode: normalizedOrgCode,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );

    await auditService.log({
      organizationId: orgId,
      userId: adminId,
      actorId: adminId,
      actorEmail: normalizedAdminEmail,
      actorRole: UserRole.ADMIN,
      action: 'CREATE' as any,
      entity: 'Organization',
      entityId: orgId,
      details: { name: newOrg.name, code: newOrg.code, adminEmail: normalizedAdminEmail },
    });

    return {
      token,
      user: {
        id: adminId,
        email: normalizedAdminEmail,
        firstName: adminFirstName.trim(),
        lastName: adminLastName.trim(),
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        organizationId: orgId,
        organizationName: newOrg.name,
        organizationCode: newOrg.code,
        departmentId: deptId,
      },
      organization: {
        id: orgId,
        name: newOrg.name,
        code: newOrg.code,
      },
    };
  }

  /**
   * Terminate session / logout
   */
  logout(token?: string): LogoutResponseData {
    if (token) {
      revokeToken(token);
    }
    return {
      message: 'Logged out successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get currently authenticated user details
   */
  async getMe(userId: string, orgId: string): Promise<AuthenticatedUser> {
    const memUser = authStore.users.get(userId);
    const memOrg = authStore.organizations.get(orgId);

    if (memUser && memOrg) {
      return {
        id: memUser.id,
        email: memUser.email,
        firstName: memUser.firstName,
        lastName: memUser.lastName,
        role: memUser.role,
        status: memUser.status,
        organizationId: memOrg.id,
        organizationName: memOrg.name,
        organizationCode: memOrg.code,
        departmentId: memUser.departmentId,
      };
    }

    try {
      const dbUser = await prisma.user.findFirst({
        where: { id: userId, organizationId: orgId },
        include: { organization: true, department: true },
      });

      if (dbUser) {
        return {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          role: normalizeRole(dbUser.role),
          status: dbUser.status as UserStatus,
          organizationId: dbUser.organizationId,
          organizationName: dbUser.organization.name,
          organizationCode: dbUser.organization.code,
          departmentId: dbUser.departmentId,
        };
      }
    } catch {
      // ignore
    }

    return {
      id: userId,
      email: '',
      firstName: 'User',
      lastName: '',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      organizationId: orgId,
    };
  }
}

export const authService = new AuthService();
