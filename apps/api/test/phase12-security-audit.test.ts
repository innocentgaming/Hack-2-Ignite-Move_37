import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { app } from '../src/app.js';
import { internshipStore } from '../src/services/internship.service.js';
import { documentStore } from '../src/services/document.service.js';
import { workspaceStore } from '../src/services/workspace.service.js';
import { tenantStore } from '../src/services/tenant.service.js';
import { authStore } from '../src/services/auth.service.js';
import { aiStore } from '../src/services/ai/ai-analysis.service.js';
import { notificationStore } from '../src/services/notification.service.js';
import {
  InternshipStatus,
  SubmissionStatus,
  UserRole,
  UserStatus,
} from '@internos/types';

describe('InternOS Phase 12: Complete Security Audit and Hardening Suite', () => {
  let server: Server;
  let baseUrl: string;

  // Tokens for Org A
  let tokenAdminA: string;
  let tokenStudentA: string;
  let tokenFacultyA: string;

  // Tokens for Org B
  let tokenAdminB: string;
  let tokenStudentB: string;

  // Test Fixtures
  const orgAId = 'org-a-id';
  const orgBId = 'org-b-id';
  let internshipAId: string;
  let internshipBId: string;
  let docAId: string;
  let docBId: string;
  let submissionAId: string;
  let submissionBId: string;
  let notifBId: string;

  before(async () => {
    server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;

    // 1. Authenticate Org A Users
    const resAdminA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataAdminA = (await resAdminA.json()) as any;
    tokenAdminA = dataAdminA.data.token;

    const resStudentA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataStudentA = (await resStudentA.json()) as any;
    tokenStudentA = dataStudentA.data.token;

    const resFacultyA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'faculty@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataFacultyA = (await resFacultyA.json()) as any;
    tokenFacultyA = dataFacultyA.data.token;

    // 2. Authenticate Org B Users
    const resAdminB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@org-b.com', password: 'Password123!', organizationCode: 'ORG_B' }),
    });
    const dataAdminB = (await resAdminB.json()) as any;
    tokenAdminB = dataAdminB.data.token;

    const resStudentB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-b.com', password: 'Password123!', organizationCode: 'ORG_B' }),
    });
    const dataStudentB = (await resStudentB.json()) as any;
    tokenStudentB = dataStudentB.data.token;

    // 3. Seed Org A & Org B Resources for Cross-Tenant Verification
    internshipAId = 'sec-test-internship-a';
    internshipStore.details.set(internshipAId, {
      id: internshipAId,
      organizationId: orgAId,
      studentId: 'user-a-student',
      facultyId: 'user-a-faculty',
      companyId: 'company-a-1',
      title: 'Cloud Security Research Intern',
      internshipType: 'FULL_TIME',
      status: InternshipStatus.ACTIVE,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-09-01'),
      expectedOutcomes: [],
      outcomeVersion: 1,
      healthScore: 90,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    tenantStore.internships.set(internshipAId, {
      id: internshipAId,
      organizationId: orgAId,
      studentId: 'user-a-student',
      companyId: 'company-a-1',
      title: 'Cloud Security Research Intern',
      type: 'FULL_TIME',
      status: InternshipStatus.ACTIVE,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-09-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    internshipBId = 'sec-test-internship-b';
    internshipStore.details.set(internshipBId, {
      id: internshipBId,
      organizationId: orgBId,
      studentId: 'user-b-student',
      companyId: 'company-b-robotics',
      title: 'Aerospace Engineering Intern',
      internshipType: 'FULL_TIME',
      status: InternshipStatus.ACTIVE,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-09-01'),
      expectedOutcomes: [],
      outcomeVersion: 1,
      healthScore: 85,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    tenantStore.internships.set(internshipBId, {
      id: internshipBId,
      organizationId: orgBId,
      studentId: 'user-b-student',
      companyId: 'company-b-robotics',
      title: 'Aerospace Engineering Intern',
      type: 'FULL_TIME',
      status: InternshipStatus.ACTIVE,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-09-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    docAId = 'doc-a-confidential';
    documentStore.documents.set(docAId, {
      id: docAId,
      organizationId: orgAId,
      ownerId: 'user-a-student',
      storageKey: 'org-a/docs/confidential.pdf',
      filename: 'confidential_contract.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      isPrivate: true,
      uploadedAt: new Date(),
    });

    docBId = 'doc-b-confidential';
    documentStore.documents.set(docBId, {
      id: docBId,
      organizationId: orgBId,
      ownerId: 'user-b-student',
      storageKey: 'org-b/docs/b_patent.pdf',
      filename: 'proprietary_patent.pdf',
      mimeType: 'application/pdf',
      size: 2048,
      isPrivate: true,
      uploadedAt: new Date(),
    });

    submissionBId = 'sub-b-final-report';
    workspaceStore.submissions.set(submissionBId, {
      id: submissionBId,
      organizationId: orgBId,
      internshipId: internshipBId,
      taskId: 'task-b-final',
      studentId: 'user-b-student',
      currentVersion: 1,
      title: 'Autonomous Navigation Final Deliverable',
      status: SubmissionStatus.SUBMITTED,
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    aiStore.analyses.set('ai-analysis-b-1', {
      id: 'ai-analysis-b-1',
      submissionId: submissionBId,
      submissionVersion: 1,
      internshipId: internshipBId,
      organizationId: orgBId,
      analysisVersion: '1.0.0',
      promptVersion: '1.0',
      model: 'gpt-4o',
      timestamp: new Date().toISOString(),
      status: 'COMPLETED',
      extractedInfo: {
        activities: ['SLAM algorithm testing'],
        technologies: [{ name: 'ROS2', category: 'FRAMEWORK', confidence: 0.95 }],
        skills: [{ name: 'Robotics Control', category: 'TECHNICAL', confidence: 0.9 }],
        evidence: [{ claim: 'Implemented SLAM', quote: 'Wrote LiDAR node in ROS2', confidence: 0.9 }],
        outcomes: [],
      },
      confidence: 0.92,
      evidenceReferences: ['Wrote LiDAR node in ROS2'],
      isAdvisory: true,
    });
    aiStore.analysesBySubmission.set(submissionBId, [aiStore.analyses.get('ai-analysis-b-1')!]);

    notifBId = 'notif-b-private-1';
    notificationStore.notifications.set(notifBId, {
      id: notifBId,
      organizationId: orgBId,
      recipientId: 'user-b-student',
      type: 'INTERNSHIP_APPROVED',
      title: 'Confidential B Notice',
      message: 'Exclusive to Org B student',
      isRead: false,
      createdAt: new Date(),
    });
  });

  after(() => {
    server.close();
  });

  // =========================================================================
  // 1. Cross-Tenant GET Operations MUST Fail (403 Forbidden)
  // =========================================================================
  describe('1. Cross-Tenant GET Isolation', () => {
    it('Org A user cannot GET Org B internship by ID (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/internships/${internshipBId}`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      assert.equal(res.status, 403, 'Cross-tenant internship GET must return 403');
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.error.message, /Cross-tenant/i);
    });

    it('Org A user cannot GET Org B document metadata (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/documents/${docBId}`, {
        headers: { Authorization: `Bearer ${tokenAdminA}` },
      });
      assert.equal(res.status, 403, 'Cross-tenant document GET must return 403');
    });

    it('Org A user cannot GET Org B submission details (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workspaces/submissions/${submissionBId}`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      assert.equal(res.status, 403, 'Cross-tenant submission GET must return 403');
    });

    it('Org A user cannot GET Org B department users (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/departments/dept-b-me/users`, {
        headers: { Authorization: `Bearer ${tokenAdminA}` },
      });
      assert.equal(res.status, 403, 'Cross-tenant department users GET must return 403');
    });

    it('Org A user cannot GET Org B department stats (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/departments/dept-b-me/stats`, {
        headers: { Authorization: `Bearer ${tokenAdminA}` },
      });
      assert.equal(res.status, 403, 'Cross-tenant department stats GET must return 403');
    });

    it('Org A user cannot GET Org B completion prerequisites (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/completion/check/${internshipBId}`, {
        headers: { Authorization: `Bearer ${tokenFacultyA}` },
      });
      assert.equal(res.status, 403, 'Cross-tenant completion verification GET must return 403');
    });
  });

  // =========================================================================
  // 2. Cross-Tenant POST Operations MUST Fail (403 Forbidden)
  // =========================================================================
  describe('2. Cross-Tenant POST Isolation', () => {
    it('Org A user cannot POST submission for Org B internship (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/submissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenStudentA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          internshipId: internshipBId,
          taskId: 'task-b-final',
          title: 'Malicious Cross-Tenant Submission',
          content: 'This should be blocked',
        }),
      });
      assert.equal(res.status, 403, 'Cross-tenant submission POST must return 403');
    });

    it('Org A faculty cannot approve Org B internship (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/internships/${internshipBId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenFacultyA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved: true,
          reason: 'Unauthorized cross-tenant approval attempt',
        }),
      });
      assert.equal(res.status, 403, 'Cross-tenant internship approval POST must return 403');
    });

    it('Org A admin cannot assign faculty to Org B internship (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/internships/${internshipBId}/assign-faculty`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenAdminA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          facultyId: 'user-a-faculty',
        }),
      });
      assert.equal(res.status, 403, 'Cross-tenant faculty assignment POST must return 403');
    });
  });

  // =========================================================================
  // 3. Cross-Tenant PUT Operations MUST Fail (403 Forbidden)
  // =========================================================================
  describe('3. Cross-Tenant PUT Isolation', () => {
    it('Org A user cannot PUT update Org B internship (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/internships/${internshipBId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${tokenAdminA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Tampered Title Across Tenant',
        }),
      });
      assert.equal(res.status, 403, 'Cross-tenant internship PUT must return 403');
    });

    it('Org A admin cannot PUT update Org B user profile (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/users/user-b-student`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${tokenAdminA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'Hacked',
        }),
      });
      assert.equal(res.status, 403, 'Cross-tenant user update PUT must return 403');
    });

    it('Org A admin cannot PUT update Org B department (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/departments/dept-b-me`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${tokenAdminA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Compromised Mechanical Engineering',
        }),
      });
      assert.equal(res.status, 403, 'Cross-tenant department update PUT must return 403');
    });
  });

  // =========================================================================
  // 4. Cross-Tenant PATCH Operations MUST Fail (403 Forbidden)
  // =========================================================================
  describe('4. Cross-Tenant PATCH Isolation', () => {
    it('Org A user cannot PATCH read status of Org B notification (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/notifications/${notifBId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      assert.equal(res.status, 403, 'Cross-tenant notification PATCH must return 403');
    });

    it('Org A admin cannot PATCH deactivate Org B user (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/users/user-b-student/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenAdminA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: false }),
      });
      assert.equal(res.status, 403, 'Cross-tenant user status PATCH must return 403');
    });

    it('Org A admin cannot PATCH toggle Org B department active status (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/departments/dept-b-me/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenAdminA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: false }),
      });
      assert.equal(res.status, 403, 'Cross-tenant department status PATCH must return 403');
    });
  });

  // =========================================================================
  // 5. Cross-Tenant DELETE Operations MUST Fail (403 Forbidden)
  // =========================================================================
  describe('5. Cross-Tenant DELETE Isolation', () => {
    it('Org A admin cannot DELETE Org B document (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/documents/${docBId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenAdminA}` },
      });
      assert.equal(res.status, 403, 'Cross-tenant document DELETE must return 403');
    });

    it('Org A admin cannot DELETE Org B internship (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/tenants/internships/${internshipBId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenAdminA}` },
      });
      assert.equal(res.status, 403, 'Cross-tenant internship DELETE must return 403');
    });
  });

  // =========================================================================
  // 6. File Download and Upload Authorization
  // =========================================================================
  describe('6. File Access & Authorization', () => {
    it('Org A student cannot download Org B document binary (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/documents/${docBId}/download`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      assert.equal(res.status, 403, 'Cross-tenant document download must return 403');
    });

    it('Document upload strictly bounds to authenticated user tenant even if body specifies another tenant (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenStudentA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: 'hacked_doc.pdf',
          content: 'JVBERi0xLjQKJ...',
          organizationId: orgBId, // Attempt to upload into Org B
        }),
      });
      assert.equal(res.status, 403, 'Spoofed organizationId in file upload must return 403');
    });
  });

  // =========================================================================
  // 7. Analytics & AI Analysis Cross-Tenant Protection
  // =========================================================================
  describe('7. Analytics & AI Cross-Tenant Security', () => {
    it('Org A admin cannot query analytics with Org B override header (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/analytics`, {
        headers: {
          Authorization: `Bearer ${tokenAdminA}`,
          'x-organization-id': orgBId,
        },
      });
      assert.equal(res.status, 403, 'x-organization-id spoofing in analytics must return 403');
    });

    it('Org A admin cannot query analytics with Org B query param (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/analytics?organizationId=${orgBId}`, {
        headers: { Authorization: `Bearer ${tokenAdminA}` },
      });
      assert.equal(res.status, 403, 'Query parameter organizationId spoofing must return 403');
    });

    it('Org A user cannot GET AI analysis for Org B submission (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/ai/submissions/${submissionBId}/analysis`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      assert.equal(res.status, 403, 'Cross-tenant AI analysis GET must return 403');
    });

    it('Org A user cannot GET AI insights for Org B internship (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/ai/internships/${internshipBId}/insights`, {
        headers: { Authorization: `Bearer ${tokenFacultyA}` },
      });
      assert.equal(res.status, 403, 'Cross-tenant AI insights GET must return 403');
    });

    it('Org A user cannot trigger AI re-analysis on Org B submission (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/ai/submissions/${submissionBId}/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      assert.equal(res.status, 403, 'Cross-tenant AI analyze POST must return 403');
    });
  });

  // =========================================================================
  // 8. OrganizationId Tampering via Headers, Body, or Query
  // =========================================================================
  describe('8. Parameter & Header Tampering Protection', () => {
    it('Blocks x-tenant-id header tampering (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/internships`, {
        headers: {
          Authorization: `Bearer ${tokenStudentA}`,
          'x-tenant-id': orgBId,
        },
      });
      assert.equal(res.status, 403, 'x-tenant-id override must return 403');
    });

    it('Blocks x-organization-override header tampering (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/internships`, {
        headers: {
          Authorization: `Bearer ${tokenStudentA}`,
          'x-organization-override': orgBId,
        },
      });
      assert.equal(res.status, 403, 'x-organization-override must return 403');
    });

    it('Blocks tenantId query param tampering (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/internships?tenantId=${orgBId}`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      assert.equal(res.status, 403, 'tenantId query override must return 403');
    });
  });

  // =========================================================================
  // 9. IDOR & Unauthorized Role Escalation
  // =========================================================================
  describe('9. RBAC & Privilege Escalation Protection', () => {
    it('Student cannot access admin users list (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/users`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      assert.equal(res.status, 403, 'Student accessing admin/users must return 403');
    });

    it('Student cannot access institution settings (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/settings`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      assert.equal(res.status, 403, 'Student accessing admin/settings must return 403');
    });

    it('Student cannot access audit logs (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      assert.equal(res.status, 403, 'Student accessing audit logs must return 403');
    });

    it('Student cannot self-promote to ADMIN role (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/users/user-a-student`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${tokenStudentA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: UserRole.ADMIN }),
      });
      assert.equal(res.status, 403, 'Unauthorized role escalation attempt must return 403');
    });
  });

  // =========================================================================
  // 10. Disabled / Suspended User Access Protection
  // =========================================================================
  describe('10. Disabled & Suspended User Handling', () => {
    const disabledUserId = 'user-disabled-test';

    before(() => {
      authStore.users.set(disabledUserId, {
        id: disabledUserId,
        organizationId: orgAId,
        email: 'disabled.user@org-a.com',
        passwordHash: authStore.users.get('user-a-student')!.passwordHash,
        firstName: 'Disabled',
        lastName: 'Account',
        role: UserRole.STUDENT,
        status: UserStatus.INACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('Disabled user cannot login (401 Unauthorized)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'disabled.user@org-a.com',
          password: 'Password123!',
          organizationCode: 'ORG_A',
        }),
      });
      assert.equal(res.status, 401, 'Login with inactive status must return 401');
    });

    it('Active JWT token rejected immediately when user is deactivated in store (403 Forbidden)', async () => {
      // First, create a temporary active user and obtain a token
      const tempUserId = 'user-temp-deactivation-test';
      authStore.users.set(tempUserId, {
        id: tempUserId,
        organizationId: orgAId,
        email: 'temp.active@org-a.com',
        passwordHash: authStore.users.get('user-a-student')!.passwordHash,
        firstName: 'Temp',
        lastName: 'Active',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'temp.active@org-a.com',
          password: 'Password123!',
          organizationCode: 'ORG_A',
        }),
      });
      const loginData = (await loginRes.json()) as any;
      const validToken = loginData.data.token;

      // Verify token works while ACTIVE
      const accessBefore = await fetch(`${baseUrl}/api/v1/internships`, {
        headers: { Authorization: `Bearer ${validToken}` },
      });
      assert.equal(accessBefore.status, 200, 'Active user token should be accepted');

      // Now deactivate user
      authStore.users.get(tempUserId)!.status = UserStatus.INACTIVE;

      // Access should now immediately fail with 403 Forbidden
      const accessAfter = await fetch(`${baseUrl}/api/v1/internships`, {
        headers: { Authorization: `Bearer ${validToken}` },
      });
      assert.equal(accessAfter.status, 403, 'Deactivated user token must return 403');
      const errBody = await accessAfter.json();
      assert.match(errBody.error.message, /inactive|denied/i);
    });
  });

  // =========================================================================
  // 11. Security Headers, JWT Revocation & Rate Limiting
  // =========================================================================
  describe('11. Security Headers & Token Management', () => {
    it('Includes Helmet security headers on responses', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
      assert.ok(res.headers.get('x-frame-options') || res.headers.get('content-security-policy'));
    });

    it('Revoked token on logout cannot be reused (401 Unauthorized)', async () => {
      // Login to get a dedicated token for logout
      const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'student@org-a.com',
          password: 'Password123!',
          organizationCode: 'ORG_A',
        }),
      });
      const loginData = (await loginRes.json()) as any;
      const tokenToRevoke = loginData.data.token;

      // Logout
      const logoutRes = await fetch(`${baseUrl}/api/v1/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenToRevoke}` },
      });
      assert.equal(logoutRes.status, 200);

      // Reattempting protected route with revoked token fails
      const retryRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${tokenToRevoke}` },
      });
      assert.equal(retryRes.status, 401, 'Revoked token must return 401 Unauthorized');
    });

    it('Includes Rate Limit headers on auth sensitive endpoints', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'student@org-a.com',
          password: 'Password123!',
          organizationCode: 'ORG_A',
        }),
      });
      assert.equal(res.status, 200);
      assert.ok(res.headers.has('x-ratelimit-limit'), 'Must include X-RateLimit-Limit');
      assert.ok(res.headers.has('x-ratelimit-remaining'), 'Must include X-RateLimit-Remaining');
    });
  });
});
