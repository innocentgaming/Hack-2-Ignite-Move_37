import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { app } from '../src/app.js';
import {
  InternshipStatus,
  OutcomeVersionDto,
} from '@internos/types';

describe('InternOS Phase 4: Internship Registration & Lifecycle State Machine Suite', () => {
  let server: Server;
  let baseUrl: string;

  // Tokens for ORG_A
  let tokenAdminA: string;
  let tokenHodA: string;
  let tokenFacultyA: string;
  let tokenStudentA: string;

  // Tokens for ORG_B
  let tokenAdminB: string;
  let tokenStudentB: string;

  // Created IDs for tests
  let createdInternshipId: string;

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

    // Login Student Org B
    const resStudentB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-b.com', password: 'Password123!', organizationCode: 'ORG_B' }),
    });
    const dataStudentB = await resStudentB.json();
    tokenStudentB = dataStudentB.data.token;
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  // =========================================================================
  // 1. Registration with New and Existing Company & Structured Outcomes
  // =========================================================================
  describe('1. Student Registration & Company Directory', () => {
    it('Student can register internship with new company and structured outcomes in DRAFT', async () => {
      const payload = {
        title: 'Backend Platform Engineer Intern',
        role: 'Backend Platform Engineer Intern',
        internshipType: 'FULL_TIME',
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-11-30T00:00:00.000Z',
        description: 'Microservices architecture and event streaming',
        newCompany: {
          name: 'Stripe Payments Labs',
          industry: 'Financial Technology',
          website: 'https://stripe.com',
          address: '354 Oyster Point Blvd, South San Francisco, CA',
        },
        mentor: {
          name: 'Patrick Collison',
          email: 'pcollison@stripe.com',
          designation: 'Engineering Lead',
          phone: '+1 650-555-0144',
        },
        expectedOutcomes: [
          {
            title: 'Event-Driven Transaction Ingestion',
            description: 'Implement Kafka event stream consumer with idempotency',
            expectedEvidence: 'PR link, unit test coverage report, benchmark',
          },
          {
            title: 'Automated Audit Reconciliation',
            description: 'Build hourly ledger reconciliation script',
            expectedEvidence: 'Scheduled job logs and test assertions',
          },
        ],
      };

      const res = await fetch(`${baseUrl}/api/v1/internships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      assert.equal(res.status, 201);
      assert.equal(data.success, true);
      assert.equal(data.data.status, InternshipStatus.DRAFT);
      assert.equal(data.data.title, 'Backend Platform Engineer Intern');
      assert.equal(data.data.company.name, 'Stripe Payments Labs');
      assert.equal(data.data.expectedOutcomes.length, 2);
      assert.equal(data.data.outcomeVersion, 1);

      createdInternshipId = data.data.id;
    });

    it('Student can register internship selecting an existing company', async () => {
      // First get existing companies
      const compRes = await fetch(`${baseUrl}/api/v1/companies`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      const compData = await compRes.json();
      assert.equal(compRes.status, 200);
      assert.ok(compData.data.length > 0);
      const existingCompanyId = compData.data[0].id;

      const payload = {
        title: 'Cloud DevOps Intern',
        internshipType: 'FULL_TIME',
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
        companyId: existingCompanyId,
        expectedOutcomes: [
          {
            title: 'Infrastructure as Code',
            expectedEvidence: 'Terraform blueprint repo',
          },
        ],
      };

      const res = await fetch(`${baseUrl}/api/v1/internships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      assert.equal(res.status, 201);
      assert.equal(data.data.companyId, existingCompanyId);
    });

    it('Cross-tenant isolation: Org B student cannot access Org A internship (403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}`, {
        headers: { Authorization: `Bearer ${tokenStudentB}` },
      });
      assert.equal(res.status, 403);
    });

    it('Cross-tenant isolation: Org B admin cannot transition Org A internship (403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenAdminB}` },
      });
      assert.equal(res.status, 403);
    });
  });

  // =========================================================================
  // 2. Date Modification Rule & Outcome Versioning
  // =========================================================================
  describe('2. Date Modification & Outcome Versioning', () => {
    it('Student CAN modify dates while in DRAFT', async () => {
      const res = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          startDate: '2026-06-15T00:00:00.000Z',
          endDate: '2026-12-15T00:00:00.000Z',
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(new Date(data.data.startDate).toISOString(), '2026-06-15T00:00:00.000Z');
      assert.equal(new Date(data.data.endDate).toISOString(), '2026-12-15T00:00:00.000Z');
    });

    it('Updating expected outcomes increments outcomeVersion and creates version snapshot', async () => {
      const res = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          expectedOutcomes: [
            {
              id: 'outcome-revised-1',
              title: 'Kafka Pipeline Implementation',
              description: 'Revised scope to handle partition rebalancing',
              expectedEvidence: 'Load test dashboard and metrics snapshot',
              status: 'IN_PROGRESS',
            },
            {
              id: 'outcome-revised-2',
              title: 'Zero-Downtime Migration',
              description: 'Database schema migration runbook',
              expectedEvidence: 'Flyway script and rollback validation',
              status: 'PLANNED',
            },
            {
              id: 'outcome-revised-3',
              title: 'Distributed Tracing Integration',
              description: 'OpenTelemetry instrumentation across all services',
              expectedEvidence: 'Jaeger trace waterfall screenshot',
              status: 'PLANNED',
            },
          ],
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.data.outcomeVersion, 2);
      assert.equal(data.data.expectedOutcomes.length, 3);

      // Verify Outcome Version History endpoint
      const histRes = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/outcomes/versions`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      const histData = await histRes.json();
      assert.equal(histRes.status, 200);
      assert.equal(histData.data.length, 2);
      const v2 = histData.data.find((v: OutcomeVersionDto) => v.versionNumber === 2);
      assert.ok(v2, 'Must have recorded version snapshot 2');
      assert.equal(v2.outcomes.length, 3);
    });
  });

  // =========================================================================
  // 3. State Machine: Valid, Invalid & Unauthorized Transitions
  // =========================================================================
  describe('3. Centralized State Machine Enforcement', () => {
    it('Student can submit internship: DRAFT -> PENDING_APPROVAL', async () => {
      const res = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.data.status, InternshipStatus.PENDING_APPROVAL);
    });

    it('Student CAN still modify dates while in PENDING_APPROVAL', async () => {
      const res = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          startDate: '2026-06-20T00:00:00.000Z',
          endDate: '2026-12-20T00:00:00.000Z',
        }),
      });

      assert.equal(res.status, 200);
    });

    it('Invalid state transition rejected: PENDING_APPROVAL -> COMPLETED directly (400)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdminA}`,
        },
        body: JSON.stringify({
          targetStatus: InternshipStatus.COMPLETED,
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error.message, /Invalid state transition/);
    });

    it('Unauthorized transition rejected: Student cannot approve internship (403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          approved: true,
        }),
      });

      assert.equal(res.status, 403);
    });

    it('Approver can reject internship with reason: PENDING_APPROVAL -> REJECTED', async () => {
      const res = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenHodA}`,
        },
        body: JSON.stringify({
          approved: false,
          reason: 'Please provide more details on the weekly mentor check-in arrangement',
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.data.status, InternshipStatus.REJECTED);
      assert.equal(data.data.rejectionReason, 'Please provide more details on the weekly mentor check-in arrangement');
    });

    it('Student can re-draft from REJECTED and re-submit: REJECTED -> DRAFT -> PENDING_APPROVAL', async () => {
      // Re-draft
      const resDraft = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          targetStatus: InternshipStatus.DRAFT,
          reason: 'Addressing mentor check-in feedback',
        }),
      });
      assert.equal(resDraft.status, 200);

      // Re-submit
      const resSubmit = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      assert.equal(resSubmit.status, 200);
      const data = await resSubmit.json();
      assert.equal(data.data.status, InternshipStatus.PENDING_APPROVAL);
    });

    it('Authorized approver approves: PENDING_APPROVAL -> APPROVED, triggers automatic workflow assignment', async () => {
      const res = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenFacultyA}`,
        },
        body: JSON.stringify({
          approved: true,
          reason: 'All requirements verified by Faculty Supervisor',
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.data.status, InternshipStatus.APPROVED);
      assert.ok(data.data.workflowInstanceId, 'Must automatically assign workflow instance upon approval');
    });

    it('POST-APPROVAL DATE IMMUTABILITY: Student CANNOT modify dates after approval (400)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          startDate: '2026-08-01T00:00:00.000Z',
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error.message, /cannot modify internship start or end dates after the internship has been APPROVED/);
    });
  });

  // =========================================================================
  // 4. Assignments & Full Lifecycle Completion
  // =========================================================================
  describe('4. Faculty/Mentor Assignments & Completion Lifecycle', () => {
    it('HOD can assign Faculty Coordinator to the approved internship', async () => {
      const res = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/assign-faculty`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenHodA}`,
        },
        body: JSON.stringify({
          facultyId: 'user-a-faculty',
          facultyName: 'Dr. Ada Lovelace',
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.data.facultyId, 'user-a-faculty');
      assert.equal(data.data.facultyName, 'Dr. Ada Lovelace');
    });

    it('Can assign or update Industry Mentor contact details', async () => {
      const res = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/assign-mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenHodA}`,
        },
        body: JSON.stringify({
          mentorName: 'David Heinemeier Hansson',
          mentorEmail: 'dhh@37signals.com',
          designation: 'Chief Technology Officer',
          phone: '+1 312-555-0182',
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.data.mentor.name, 'David Heinemeier Hansson');
    });

    it('Progresses through lifecycle: APPROVED -> ACTIVE -> READY_FOR_COMPLETION -> COMPLETED', async () => {
      // 1. APPROVED -> ACTIVE
      const resActive = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenFacultyA}`,
        },
        body: JSON.stringify({
          targetStatus: InternshipStatus.ACTIVE,
          reason: 'Student completed first day orientation',
        }),
      });
      assert.equal(resActive.status, 200);
      const dataActive = await resActive.json();
      assert.equal(dataActive.data.status, InternshipStatus.ACTIVE);

      // 2. ACTIVE -> READY_FOR_COMPLETION
      const resReady = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenFacultyA}`,
        },
        body: JSON.stringify({
          targetStatus: InternshipStatus.READY_FOR_COMPLETION,
          reason: 'All monthly diaries and final project deliverables submitted',
        }),
      });
      assert.equal(resReady.status, 200);
      const dataReady = await resReady.json();
      assert.equal(dataReady.data.status, InternshipStatus.READY_FOR_COMPLETION);

      // 3. READY_FOR_COMPLETION -> COMPLETED
      const resCompleted = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenHodA}`,
        },
        body: JSON.stringify({
          targetStatus: InternshipStatus.COMPLETED,
          reason: 'Department Evaluation Committee awarded grade A',
        }),
      });
      assert.equal(resCompleted.status, 200);
      const dataCompleted = await resCompleted.json();
      assert.equal(dataCompleted.data.status, InternshipStatus.COMPLETED);
    });

    it('Audit trail logs internship lifecycle events and state transitions', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${tokenAdminA}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      const actions = data.data.logs.map((l: { action: string }) => l.action);
      assert.ok(
        actions.includes('INTERNSHIP_CREATE') ||
          actions.includes('INTERNSHIP_SUBMIT') ||
          actions.includes('INTERNSHIP_APPROVE') ||
          actions.includes('INTERNSHIP_STATE_TRANSITION'),
        'Audit logs must capture internship registration and state transitions'
      );
    });
  });
});
