import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { app } from '../src/app.js';
import { UserRole, AuditLogDto } from '@internos/types';

describe('InternOS Phase 2: Institution Administration, User Management & CSV Import Suite', () => {
  let server: Server;
  let baseUrl: string;

  // Tokens for ORG_A
  let tokenAdminA: string;
  let tokenHodA: string;
  let tokenFacultyA: string;
  let tokenStudentA: string;

  // Tokens for ORG_B
  let tokenAdminB: string;

  before(async () => {
    server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;

    // Login Admin Org A
    const resAdminA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataAdminA = await resAdminA.json();
    assert.equal(resAdminA.status, 200);
    tokenAdminA = dataAdminA.data.token;

    // Login HOD Org A
    const resHodA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hod@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataHodA = await resHodA.json();
    tokenHodA = dataHodA.data.token;

    // Login Faculty Org A
    const resFacultyA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'faculty@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataFacultyA = await resFacultyA.json();
    tokenFacultyA = dataFacultyA.data.token;

    // Login Student Org A
    const resStudentA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataStudentA = await resStudentA.json();
    tokenStudentA = dataStudentA.data.token;

    // Login Admin Org B
    const resAdminB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@org-b.com', password: 'Password123!', organizationCode: 'ORG_B' }),
    });
    const dataAdminB = await resAdminB.json();
    tokenAdminB = dataAdminB.data.token;
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  describe('1. Department Management', () => {
    let createdDeptId: string;

    it('Admin A can create a new department', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdminA}`,
        },
        body: JSON.stringify({
          code: 'IT',
          name: 'Information Technology',
          description: 'Department of IT',
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 201);
      assert.equal(data.data.code, 'IT');
      assert.equal(data.data.name, 'Information Technology');
      assert.equal(data.data.isActive, true);
      createdDeptId = data.data.id;
    });

    it('Admin A cannot create department with duplicate code', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdminA}`,
        },
        body: JSON.stringify({
          code: 'IT',
          name: 'Another IT Dept',
        }),
      });
      assert.equal(res.status, 409);
    });

    it('Admin A can update and toggle department status', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/departments/${createdDeptId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdminA}`,
        },
        body: JSON.stringify({ isActive: false }),
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.data.isActive, false);
    });

    it('Admin A can fetch department statistics', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/departments/dept-a-cs/stats`, {
        headers: { Authorization: `Bearer ${tokenAdminA}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.data.departmentCode, 'CS');
      assert.ok(data.data.totalStudents >= 1);
    });

    it('Admin B cannot access Org A department (Tenant Boundary Enforcement)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/departments/dept-a-cs`, {
        headers: { Authorization: `Bearer ${tokenAdminB}` },
      });
      assert.equal(res.status, 403, 'Cross-tenant department read must return 403');
    });
  });

  describe('2. User Management & Secure Invitations', () => {
    let createdUserId: string;

    it('Admin A can create a user directly', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdminA}`,
        },
        body: JSON.stringify({
          email: 'newfaculty@org-a.com',
          firstName: 'Norman',
          lastName: 'NewFaculty',
          role: UserRole.FACULTY,
          departmentId: 'dept-a-cs',
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 201);
      assert.equal(data.data.email, 'newfaculty@org-a.com');
      createdUserId = data.data.id;
    });

    it('Admin A can invite a user with secure invitation token', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/users/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdminA}`,
        },
        body: JSON.stringify({
          email: 'invitedmentor@org-a.com',
          firstName: 'Ian',
          lastName: 'Invited',
          role: UserRole.MENTOR,
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 201);
      assert.ok(data.data.activationToken, 'Activation token must be generated');
      assert.equal(data.data.status, 'PENDING_VERIFICATION');
    });

    it('Admin A can update user role and status', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/users/${createdUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdminA}`,
        },
        body: JSON.stringify({
          role: UserRole.HOD,
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.data.role, UserRole.HOD);
    });

    it('Admin A can toggle user active/deactivate', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/users/${createdUserId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdminA}`,
        },
        body: JSON.stringify({ isActive: false }),
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.data.status, 'INACTIVE');
    });

    it('Student cannot create or manage users (RBAC 403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          email: 'fail@org-a.com',
          firstName: 'F',
          lastName: 'L',
          role: UserRole.STUDENT,
        }),
      });
      assert.equal(res.status, 403);
    });
  });

  describe('3. CSV Student Import Pipeline', () => {
    let validPreviewToken: string;

    it('Valid CSV is parsed and preview generated with accurate counts', async () => {
      const validCSV = `studentId,name,email,department
CS-2026-001,John Doe,johndoe@org-a.com,CS
CS-2026-002,Jane Smith,janesmith@org-a.com,CS
EE-2026-001,Robert Brown,robertb@org-a.com,EE`;

      const res = await fetch(`${baseUrl}/api/v1/admin/students/import/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdminA}`,
        },
        body: JSON.stringify({ csvContent: validCSV }),
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.data.totalRows, 3);
      assert.equal(data.data.validCount, 3);
      assert.equal(data.data.invalidCount, 0);
      assert.equal(data.data.duplicateCount, 0);
      assert.ok(data.data.previewToken);
      validPreviewToken = data.data.previewToken;
    });

    it('CSV with invalid email, missing studentId, duplicate email, and wrong department generates detailed error report', async () => {
      const mixedCSV = `studentId,name,email,department
,Missing Id,no_id@org-a.com,CS
CS-2026-099,Bad Email,bad-email-format,CS
CS-2026-100,Invalid Dept,invdept@org-a.com,NONEXISTENT_DEPT
CS-2026-101,Valid First,repeat@org-a.com,CS
CS-2026-102,Valid Second,repeat@org-a.com,CS
CS-2026-103,Existing Email,student@org-a.com,CS`;

      const res = await fetch(`${baseUrl}/api/v1/admin/students/import/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdminA}`,
        },
        body: JSON.stringify({ csvContent: mixedCSV }),
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.data.totalRows, 6);
      assert.ok(data.data.invalidCount >= 3, 'Invalid count should reflect bad rows');
      assert.ok(data.data.duplicateCount >= 2, 'Duplicates should be detected (repeat + existing user)');
      assert.ok(data.data.errorReport.length > 0, 'Error report must contain row explanations');
    });

    it('Cross-tenant department reference in CSV is rejected (Tenant Boundary Enforcement)', async () => {
      // ME is an Org B department. Org A admin importing with ME must fail validation for that row.
      const crossTenantCSV = `studentId,name,email,department
CS-2026-200,Cross Tenant Dept,crosst@org-a.com,ME`;

      const res = await fetch(`${baseUrl}/api/v1/admin/students/import/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdminA}`,
        },
        body: JSON.stringify({ csvContent: crossTenantCSV }),
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.data.validCount, 0);
      assert.equal(data.data.invalidCount, 1);
      assert.match(data.data.errorReport[0], /Does not exist in this institution/i);
    });

    it('Administrator can cancel a preview session', async () => {
      const cancelCSV = `studentId,name,email,department
CS-2026-300,Cancel Me,cancel@org-a.com,CS`;

      const resPrev = await fetch(`${baseUrl}/api/v1/admin/students/import/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdminA}`,
        },
        body: JSON.stringify({ csvContent: cancelCSV }),
      });
      const dataPrev = await resPrev.json();
      const token = dataPrev.data.previewToken;

      const resCancel = await fetch(`${baseUrl}/api/v1/admin/students/import/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdminA}`,
        },
        body: JSON.stringify({ previewToken: token }),
      });
      assert.equal(resCancel.status, 200);

      // Confirming cancelled session should fail
      const resConfirm = await fetch(`${baseUrl}/api/v1/admin/students/import/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdminA}`,
        },
        body: JSON.stringify({ previewToken: token }),
      });
      assert.equal(resConfirm.status, 404);
    });

    it('Admin B cannot confirm Org A preview session (Cross-Tenant Import Protection)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/students/import/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdminB}`,
        },
        body: JSON.stringify({ previewToken: validPreviewToken }),
      });
      assert.equal(res.status, 403, 'Cross-tenant preview confirmation must be forbidden');
    });

    it('Admin A can confirm valid preview and execute bulk insert', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/students/import/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdminA}`,
        },
        body: JSON.stringify({ previewToken: validPreviewToken }),
      });
      const data = await res.json();
      assert.equal(res.status, 201);
      assert.equal(data.data.importedCount, 3);
      assert.equal(data.data.importedUserIds.length, 3);

      // Verify newly imported student can be fetched in users list
      const resUsers = await fetch(`${baseUrl}/api/v1/admin/users?search=johndoe`, {
        headers: { Authorization: `Bearer ${tokenAdminA}` },
      });
      const usersData = await resUsers.json();
      assert.equal(resUsers.status, 200);
      assert.equal(usersData.data.users[0].email, 'johndoe@org-a.com');
    });
  });

  describe('4. Dynamic Dashboards (Backend Driven Metrics)', () => {
    it('Admin Dashboard returns dynamically computed institution metrics', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/dashboards/admin`, {
        headers: { Authorization: `Bearer ${tokenAdminA}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.ok(typeof data.data.totalStudents === 'number');
      assert.ok(typeof data.data.totalFaculty === 'number');
      assert.ok(typeof data.data.totalDepartments === 'number');
      assert.ok(typeof data.data.activeInternships === 'number');
      assert.ok(Array.isArray(data.data.departmentBreakdown));
    });

    it('HOD Dashboard returns department-specific metrics', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/dashboards/hod`, {
        headers: { Authorization: `Bearer ${tokenHodA}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.ok(data.data.departmentName);
      assert.ok(typeof data.data.totalStudents === 'number');
    });

    it('Faculty Dashboard returns assigned faculty metrics', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/dashboards/faculty`, {
        headers: { Authorization: `Bearer ${tokenFacultyA}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.ok(typeof data.data.supervisedStudentsCount === 'number');
    });
  });

  describe('5. Audit Logging & Security', () => {
    it('Admin A can retrieve audit logs recording past operations', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${tokenAdminA}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.ok(data.data.logs.length > 0);
      // Verify actions like USER_CREATE, DEPARTMENT_CREATE, STUDENTS_CSV_IMPORT exist
      const actions = data.data.logs.map((l: AuditLogDto) => l.action);
      assert.ok(actions.includes('STUDENTS_CSV_IMPORT') || actions.includes('DEPARTMENT_CREATE'));
    });

    it('Non-privileged users cannot access audit logs (RBAC 403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      assert.equal(res.status, 403);
    });
  });
});
