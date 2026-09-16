import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '@internos/prisma';
import { UnauthorizedError, NotFoundError } from '@internos/shared';
import { LoginRequestDto, LoginResponseData, UserRole, UserStatus } from '@internos/types';
import { env } from '../config/env.js';

export class AuthService {
  async login(dto: LoginRequestDto): Promise<LoginResponseData> {
    const { email, password, organizationCode } = dto;

    // First attempt to query live Prisma database
    try {
      // Find organization if specified, or search by email across organizations
      let organizationId: string | undefined;
      if (organizationCode) {
        const org = await prisma.organization.findUnique({
          where: { code: organizationCode },
        });
        if (!org) {
          throw new NotFoundError('Organization', organizationCode);
        }
        organizationId = org.id;
      }

      const user = await prisma.user.findFirst({
        where: {
          email,
          ...(organizationId ? { organizationId } : {}),
        },
        include: {
          organization: true,
          department: true,
        },
      });

      if (user) {
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          throw new UnauthorizedError('Invalid email or password');
        }

        if (user.status !== UserStatus.ACTIVE) {
          throw new UnauthorizedError(`Account is ${user.status.toLowerCase()}`);
        }

        const token = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
            organizationCode: user.organization.code,
          },
          env.JWT_SECRET,
          { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
        );

        return {
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role as UserRole,
            status: user.status as UserStatus,
            organizationId: user.organizationId,
            organizationName: user.organization.name,
            organizationCode: user.organization.code,
            departmentId: user.departmentId,
          },
          organization: {
            id: user.organization.id,
            name: user.organization.name,
            code: user.organization.code,
          },
        };
      }
    } catch (dbError) {
      console.warn('⚠️ Live database query not available or errored, evaluating demo credentials fallback:', (dbError as Error).message);
    }

    // Demo Fallback for Phase 0 initial test drive
    const demoAccounts: Record<string, { role: UserRole; name: [string, string]; dept: string }> = {
      'admin@apex.edu': { role: UserRole.INSTITUTION_ADMIN, name: ['Arthur', 'Pendelton'], dept: 'Administration' },
      'dr.sharma@apex.edu': { role: UserRole.FACULTY_SUPERVISOR, name: ['Priya', 'Sharma'], dept: 'CSE' },
      'raj.patel@acmecloud.com': { role: UserRole.INDUSTRY_MENTOR, name: ['Rajesh', 'Patel'], dept: 'Cloud Infrastructure' },
      'alex.student@apex.edu': { role: UserRole.STUDENT, name: ['Alex', 'Morgan'], dept: 'CSE' },
      'superadmin@internos.local': { role: UserRole.SUPER_ADMIN, name: ['Global', 'Admin'], dept: 'System' },
    };

    const demoUser = demoAccounts[email.toLowerCase()];
    if (demoUser && (password === 'Password123!' || password === 'admin123')) {
      const orgId = 'apex-org-demo-uuid';
      const token = jwt.sign(
        {
          userId: `demo-user-${demoUser.role.toLowerCase()}`,
          email,
          role: demoUser.role,
          organizationId: orgId,
          organizationCode: 'apex-inst',
        },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
      );

      return {
        token,
        user: {
          id: `demo-user-${demoUser.role.toLowerCase()}`,
          email,
          firstName: demoUser.name[0],
          lastName: demoUser.name[1],
          role: demoUser.role,
          status: UserStatus.ACTIVE,
          organizationId: orgId,
          organizationName: 'Apex Institute of Technology',
          organizationCode: 'apex-inst',
          departmentId: 'dept-cse-uuid',
        },
        organization: {
          id: orgId,
          name: 'Apex Institute of Technology',
          code: 'apex-inst',
        },
      };
    }

    throw new UnauthorizedError('Invalid credentials. For demo mode, use email (e.g. admin@apex.edu) and Password123!');
  }

  async getMe(userId: string, orgId: string) {
    try {
      const user = await prisma.user.findFirst({
        where: { id: userId, organizationId: orgId },
        include: {
          organization: true,
          department: true,
          studentProfile: true,
          facultyProfile: true,
          mentorProfile: true,
        },
      });

      if (user) {
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
          organizationCode: user.organization.code,
          department: user.department?.name,
          profile: user.studentProfile || user.facultyProfile || user.mentorProfile,
        };
      }
    } catch {
      // ignore
    }

    return {
      id: userId,
      organizationId: orgId,
    };
  }
}

export const authService = new AuthService();
