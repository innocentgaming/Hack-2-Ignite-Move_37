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
} from '@internos/types';
import { env } from '../config/env.js';
import { revokeToken } from '../middleware/auth.js';

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

    // 1. Organization A
    const orgA: InMemoryOrg = {
      id: 'org-a-id',
      code: 'ORG_A',
      name: 'Organization A University',
      domain: 'org-a.edu',
    };
    this.organizations.set(orgA.id, orgA);

    // 2. Organization B
    const orgB: InMemoryOrg = {
      id: 'org-b-id',
      code: 'ORG_B',
      name: 'Organization B Institute',
      domain: 'org-b.edu',
    };
    this.organizations.set(orgB.id, orgB);

    // 3. Apex Legacy Org
    const orgApex: InMemoryOrg = {
      id: 'apex-org-demo-uuid',
      code: 'apex-inst',
      name: 'Apex Institute of Technology',
      domain: 'apex.edu',
    };
    this.organizations.set(orgApex.id, orgApex);

    // Seed ORG_A Users (ADMIN, HOD, FACULTY, STUDENT, MENTOR)
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
        firstName: 'Harold',
        lastName: 'HeadOfDept',
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
    ];

    // Seed ORG_B Users (ADMIN, HOD, FACULTY, STUDENT, MENTOR)
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
        id: 'user-b-hod',
        organizationId: 'org-b-id',
        departmentId: 'dept-b-me',
        email: 'hod@org-b.com',
        passwordHash: defaultPasswordHash,
        firstName: 'Helena',
        lastName: 'HeadOfDept',
        role: UserRole.HOD,
        status: UserStatus.ACTIVE,
      },
      {
        id: 'user-b-faculty',
        organizationId: 'org-b-id',
        departmentId: 'dept-b-me',
        email: 'faculty@org-b.com',
        passwordHash: defaultPasswordHash,
        firstName: 'Frank',
        lastName: 'Faculty',
        role: UserRole.FACULTY,
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

    // Seed Legacy Demo Accounts
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
        id: 'demo-user-faculty',
        organizationId: 'apex-org-demo-uuid',
        departmentId: 'dept-cse-uuid',
        email: 'dr.sharma@apex.edu',
        passwordHash: defaultPasswordHash,
        firstName: 'Priya',
        lastName: 'Sharma',
        role: UserRole.FACULTY,
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

    const allSeed = [...orgAUsers, ...orgBUsers, ...legacyUsers];
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
            role: normalizedRole,
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
