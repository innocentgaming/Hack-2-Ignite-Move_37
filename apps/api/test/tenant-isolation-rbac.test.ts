import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { app } from '../src/app.js';
import { UserRole } from '@internos/types';

describe('InternOS Phase 1: Authentication, RBAC & Multi-Tenant Isolation Suite', () => {
  let server: Server;
  let baseUrl: string;

  // Tokens for ORG_A
  let tokenAdminA: string;
  let _tokenHodA: string;
  let _tokenFacultyA: string;
  let tokenStudentA: string;
  let tokenMentorA: string;

  // Tokens for ORG_B
  let tokenAdminB: string;
  let tokenStudentB: string;

  before(async () => {
    // Start ephemeral server
    server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;

    // Login Org A users
    const resAdminA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataAdminA = await resAdminA.json();
    assert.equal(resAdminA.status, 200, 'Admin A login failed');
    tokenAdminA = dataAdminA.data.token;

    const resHodA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hod@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataHodA = await resHodA.json();
    assert.equal(resHodA.status, 200, 'HOD A login failed');
    _tokenHodA = dataHodA.data.token;

    const resFacultyA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'faculty@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataFacultyA = await resFacultyA.json();
    assert.equal(resFacultyA.status, 200, 'Faculty A login failed');
    _tokenFacultyA = dataFacultyA.data.token;

    const resStudentA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataStudentA = await resStudentA.json();
    assert.equal(resStudentA.status, 200, 'Student A login failed');
    tokenStudentA = dataStudentA.data.token;

    const resMentorA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'mentor@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataMentorA = await resMentorA.json();
    assert.equal(resMentorA.status, 200, 'Mentor A login failed');
    tokenMentorA = dataMentorA.data.token;

    // Login Org B users
    const resAdminB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@org-b.com', password: 'Password123!', organizationCode: 'ORG_B' }),
    });
    const dataAdminB = await resAdminB.json();
    assert.equal(resAdminB.status, 200, 'Admin B login failed');
    tokenAdminB = dataAdminB.data.token;

    const resStudentB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-b.com', password: 'Password123!', organizationCode: 'ORG_B' }),
    });
    const dataStudentB = await resStudentB.json();
    assert.equal(resStudentB.status, 200, 'Student B login failed');
    tokenStudentB = dataStudentB.data.token;
  });

  after(() => {
    server?.close();
  });

  // ==========================================
  // Test 1: A user can access A data
  // ==========================================
  it('1. A user can access A data (Departments, Internships, Documents)', async () => {
    // Check departments
    const resDept = await fetch(`${baseUrl}/api/v1/tenants/departments`, {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert.equal(resDept.status, 200);
    const bodyDept = await resDept.json();
    assert.equal(bodyDept.success, true);
    assert.ok(bodyDept.data.length > 0);
    assert.ok(bodyDept.data.every((d: { organizationId: string }) => d.organizationId === 'org-a-id'));

    // Check internships
    const resIntern = await fetch(`${baseUrl}/api/v1/tenants/internships`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    assert.equal(resIntern.status, 200);
    const bodyIntern = await resIntern.json();
    assert.equal(bodyIntern.success, true);
    assert.ok(bodyIntern.data.every((i: { organizationId: string }) => i.organizationId === 'org-a-id'));

    // Check documents
    const resDoc = await fetch(`${baseUrl}/api/v1/tenants/documents`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    assert.equal(resDoc.status, 200);
    const bodyDoc = await resDoc.json();
    assert.equal(bodyDoc.success, true);
    assert.ok(bodyDoc.data.every((d: { organizationId: string }) => d.organizationId === 'org-a-id'));
  });

  // ==========================================
  // Test 2: B user can access B data
  // ==========================================
  it('2. B user can access B data (Departments, Internships, Documents)', async () => {
    // Check departments
    const resDept = await fetch(`${baseUrl}/api/v1/tenants/departments`, {
      headers: { Authorization: `Bearer ${tokenAdminB}` },
    });
    assert.equal(resDept.status, 200);
    const bodyDept = await resDept.json();
    assert.equal(bodyDept.success, true);
    assert.ok(bodyDept.data.length > 0);
    assert.ok(bodyDept.data.every((d: { organizationId: string }) => d.organizationId === 'org-b-id'));

    // Check internships
    const resIntern = await fetch(`${baseUrl}/api/v1/tenants/internships`, {
      headers: { Authorization: `Bearer ${tokenStudentB}` },
    });
    assert.equal(resIntern.status, 200);
    const bodyIntern = await resIntern.json();
    assert.equal(bodyIntern.success, true);
    assert.ok(bodyIntern.data.every((i: { organizationId: string }) => i.organizationId === 'org-b-id'));

    // Check documents
    const resDoc = await fetch(`${baseUrl}/api/v1/tenants/documents`, {
      headers: { Authorization: `Bearer ${tokenStudentB}` },
    });
    assert.equal(resDoc.status, 200);
    const bodyDoc = await resDoc.json();
    assert.equal(bodyDoc.success, true);
    assert.ok(bodyDoc.data.every((d: { organizationId: string }) => d.organizationId === 'org-b-id'));
  });

  // ==========================================
  // Test 3: A cannot access B (Cross-Tenant SELECT, UPDATE, DELETE, Documents)
  // ==========================================
  it('3. A cannot access B data: returns 403 Forbidden', async () => {
    // A trying to read B internship by ID (internship-b-1)
    const resIntern = await fetch(`${baseUrl}/api/v1/tenants/internships/internship-b-1`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    assert.equal(resIntern.status, 403, 'Expected 403 for cross-tenant internship read');
    const bodyIntern = await resIntern.json();
    assert.equal(bodyIntern.success, false);
    assert.equal(bodyIntern.error.code, 'TENANT_ISOLATION_VIOLATION');

    // A trying to read B document by ID (doc-b-1)
    const resDoc = await fetch(`${baseUrl}/api/v1/tenants/documents/doc-b-1`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    assert.equal(resDoc.status, 403, 'Expected 403 for cross-tenant document read');
    const bodyDoc = await resDoc.json();
    assert.equal(bodyDoc.success, false);

    // A trying to UPDATE B internship (internship-b-1)
    const resUpdate = await fetch(`${baseUrl}/api/v1/tenants/internships/internship-b-1`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${tokenAdminA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Hacked Title' }),
    });
    assert.equal(resUpdate.status, 403, 'Expected 403 for cross-tenant internship update');

    // A trying to DELETE B internship (internship-b-1)
    const resDelete = await fetch(`${baseUrl}/api/v1/tenants/internships/internship-b-1`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert.equal(resDelete.status, 403, 'Expected 403 for cross-tenant internship delete');
  });

  // ==========================================
  // Test 4: B cannot access A (Cross-Tenant SELECT, UPDATE, DELETE, Documents)
  // ==========================================
  it('4. B cannot access A data: returns 403 Forbidden', async () => {
    // B trying to read A internship by ID (internship-a-1)
    const resIntern = await fetch(`${baseUrl}/api/v1/tenants/internships/internship-a-1`, {
      headers: { Authorization: `Bearer ${tokenStudentB}` },
    });
    assert.equal(resIntern.status, 403, 'Expected 403 for cross-tenant internship read');
    const bodyIntern = await resIntern.json();
    assert.equal(bodyIntern.success, false);
    assert.equal(bodyIntern.error.code, 'TENANT_ISOLATION_VIOLATION');

    // B trying to read A document by ID (doc-a-1)
    const resDoc = await fetch(`${baseUrl}/api/v1/tenants/documents/doc-a-1`, {
      headers: { Authorization: `Bearer ${tokenStudentB}` },
    });
    assert.equal(resDoc.status, 403, 'Expected 403 for cross-tenant document read');

    // B trying to UPDATE A internship (internship-a-1)
    const resUpdate = await fetch(`${baseUrl}/api/v1/tenants/internships/internship-a-1`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${tokenAdminB}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Hacked Title from B' }),
    });
    assert.equal(resUpdate.status, 403, 'Expected 403 for cross-tenant internship update');

    // B trying to DELETE A internship (internship-a-1)
    const resDelete = await fetch(`${baseUrl}/api/v1/tenants/internships/internship-a-1`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAdminB}` },
    });
    assert.equal(resDelete.status, 403, 'Expected 403 for cross-tenant internship delete');
  });

  // ==========================================
  // Test 5: Wrong role gets 403 Forbidden
  // ==========================================
  it('5. Wrong role gets 403 Forbidden on unauthorized operations', async () => {
    // STUDENT attempting to invite a user (requires 'users:invite' permission, only ADMIN/HOD have it)
    const resInvite = await fetch(`${baseUrl}/api/v1/auth/invite`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenStudentA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'illegal@org-a.com',
        role: UserRole.STUDENT,
        firstName: 'Illegal',
        lastName: 'User',
      }),
    });
    assert.equal(resInvite.status, 403, 'Expected 403 when STUDENT tries to invite users');
    const bodyInvite = await resInvite.json();
    assert.equal(bodyInvite.success, false);
    assert.equal(bodyInvite.error.code, 'FORBIDDEN');

    // STUDENT attempting to DELETE an internship (requires 'internships:manage' permission)
    const resDelete = await fetch(`${baseUrl}/api/v1/tenants/internships/internship-a-1`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    assert.equal(resDelete.status, 403, 'Expected 403 when STUDENT tries to delete internship');

    // MENTOR attempting to create an internship (requires 'internships:create', only ADMIN/STUDENT have it)
    const resCreate = await fetch(`${baseUrl}/api/v1/tenants/internships`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenMentorA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Unauthorized Mentor Internship' }),
    });
    assert.equal(resCreate.status, 403, 'Expected 403 when MENTOR tries to create internship');
  });

  // ==========================================
  // Test 6: Unauthenticated request gets 401 Unauthorized
  // ==========================================
  it('6. Unauthenticated request gets 401 Unauthorized', async () => {
    // Missing Authorization header
    const resNoAuth = await fetch(`${baseUrl}/api/v1/tenants/current`);
    assert.equal(resNoAuth.status, 401);
    const bodyNoAuth = await resNoAuth.json();
    assert.equal(bodyNoAuth.success, false);
    assert.equal(bodyNoAuth.error.code, 'UNAUTHORIZED');

    // Malformed Authorization header
    const resBadAuth = await fetch(`${baseUrl}/api/v1/tenants/current`, {
      headers: { Authorization: 'Basic not-a-jwt' },
    });
    assert.equal(resBadAuth.status, 401);

    // Tampered token signature
    const resTampered = await fetch(`${baseUrl}/api/v1/tenants/current`, {
      headers: { Authorization: `Bearer ${tokenAdminA}.tampered` },
    });
    assert.equal(resTampered.status, 401);
  });

  // ==========================================
  // Test 7: Manipulated organizationId is ignored/rejected (returns 403)
  // ==========================================
  it('7. Manipulated organizationId in body/query/headers is rejected with 403', async () => {
    // User from Org A attempting to inject organizationId=org-b-id in query
    const resQueryManip = await fetch(`${baseUrl}/api/v1/tenants/departments?organizationId=org-b-id`, {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert.equal(resQueryManip.status, 403, 'Expected 403 when organizationId is manipulated in query');
    const bodyQuery = await resQueryManip.json();
    assert.equal(bodyQuery.error.code, 'TENANT_ISOLATION_VIOLATION');

    // User from Org A attempting to inject organizationId in body of internship creation
    const resBodyManip = await fetch(`${baseUrl}/api/v1/tenants/internships`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenAdminA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Manipulated Tenant Internship',
        organizationId: 'org-b-id', // Attacker attempts to forge tenant ID
      }),
    });
    assert.equal(resBodyManip.status, 403, 'Expected 403 when organizationId is forged in body');

    // User from Org A attempting to pass x-organization-id header for Org B
    const resHeaderManip = await fetch(`${baseUrl}/api/v1/tenants/departments`, {
      headers: {
        Authorization: `Bearer ${tokenAdminA}`,
        'x-organization-id': 'org-b-id',
      },
    });
    assert.equal(resHeaderManip.status, 403, 'Expected 403 when organizationId is forged in headers');
  });

  // ==========================================
  // Test 8 & 9 & 10: User Invite, Account Activation, and Login with new Password
  // ==========================================
  it('8, 9, 10. Admin can invite user, user activates with bcrypt password, and logs in', async () => {
    const inviteEmail = `newuser-${Date.now()}@org-a.com`;

    // 1. Admin A invites new faculty member
    const resInvite = await fetch(`${baseUrl}/api/v1/auth/invite`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenAdminA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: inviteEmail,
        role: UserRole.FACULTY,
        firstName: 'New',
        lastName: 'Professor',
      }),
    });
    assert.equal(resInvite.status, 201);
    const bodyInvite = await resInvite.json();
    assert.equal(bodyInvite.success, true);
    const activationToken = bodyInvite.data.activationToken;
    assert.ok(activationToken);

    // 2. Before activation, unactivated user cannot log in
    const resEarlyLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inviteEmail,
        password: 'TemporaryPassword123!',
        organizationCode: 'ORG_A',
      }),
    });
    assert.equal(resEarlyLogin.status, 401, 'Unactivated user should not be able to log in');

    // 3. User activates account with activation token and sets new password
    const newPassword = 'SecurePassword456!';
    const resActivate = await fetch(`${baseUrl}/api/v1/auth/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: activationToken,
        password: newPassword,
      }),
    });
    assert.equal(resActivate.status, 200);
    const bodyActivate = await resActivate.json();
    assert.equal(bodyActivate.success, true);

    // 4. Activated user logs in successfully with new password
    const resLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inviteEmail,
        password: newPassword,
        organizationCode: 'ORG_A',
      }),
    });
    assert.equal(resLogin.status, 200);
    const bodyLogin = await resLogin.json();
    assert.equal(bodyLogin.success, true);
    assert.equal(bodyLogin.data.user.email, inviteEmail);
    assert.equal(bodyLogin.data.user.role, UserRole.FACULTY);
  });

  // ==========================================
  // Test 11: Logout revokes session
  // ==========================================
  it('11. Logout revokes token and prevents subsequent access', async () => {
    // 1. Temporary login for student
    const resLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const { token: tempToken } = (await resLogin.json()).data;

    // Verify token works
    const resPre = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${tempToken}` },
    });
    assert.equal(resPre.status, 200);

    // Logout
    const resLogout = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tempToken}` },
    });
    assert.equal(resLogout.status, 200);

    // Verify revoked token fails with 401
    const resPost = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${tempToken}` },
    });
    assert.equal(resPost.status, 401, 'Revoked token must yield 401');
  });
});
