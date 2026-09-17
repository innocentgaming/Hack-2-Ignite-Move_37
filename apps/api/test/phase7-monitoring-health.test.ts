import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { app } from '../src/app.js';
import {
  InternshipStatus,
  SubmissionStatus,
} from '@internos/types';
import { workflowStore } from '../src/services/workflow.service.js';
import { internshipStore } from '../src/services/internship.service.js';
import { workspaceStore } from '../src/services/workspace.service.js';
import { healthCalculationService } from '../src/services/health-calculation.service.js';

describe('InternOS Phase 7: Deterministic Monitoring & Health Engine Test Suite', () => {
  let server: Server;
  let baseUrl: string;

  // Tokens for ORG_A
  let tokenAdminA: string;
  let tokenHodA: string;
  let tokenFacultyA: string;
  let tokenStudentA: string;
  let _tokenMentorA: string;

  // Tokens for ORG_B
  let tokenAdminB: string;
  let _tokenStudentB: string;

  // IDs
  let studentAId: string;
  let facultyAId: string;
  let testInternshipId: string;
  let createdTaskId1: string;
  let createdTaskId2: string;

  before(async () => {
    server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;

    // 1. Login Admin Org A
    const resAdminA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataAdminA = await resAdminA.json();
    tokenAdminA = dataAdminA.data.token;

    // 2. Login HOD Org A
    const resHodA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hod@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataHodA = await resHodA.json();
    tokenHodA = dataHodA.data.token;

    // 3. Login Faculty Org A
    const resFacultyA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'faculty@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataFacultyA = await resFacultyA.json();
    tokenFacultyA = dataFacultyA.data.token;
    facultyAId = dataFacultyA.data.user.id;

    // 4. Login Student Org A
    const resStudentA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataStudentA = await resStudentA.json();
    tokenStudentA = dataStudentA.data.token;
    studentAId = dataStudentA.data.user.id;

    // 5. Login Mentor Org A
    const resMentorA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'mentor@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataMentorA = await resMentorA.json();
    _tokenMentorA = dataMentorA.data.token;

    // 6. Login Admin Org B
    const resAdminB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@org-b.com', password: 'Password123!', organizationCode: 'ORG_B' }),
    });
    const dataAdminB = await resAdminB.json();
    tokenAdminB = dataAdminB.data.token;

    // 7. Login Student Org B
    const resStudentB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-b.com', password: 'Password123!', organizationCode: 'ORG_B' }),
    });
    const dataStudentB = await resStudentB.json();
    _tokenStudentB = dataStudentB.data.token;

    // Register an internship for Student A
    const regRes = await fetch(`${baseUrl}/api/v1/internships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        title: 'Phase 7 Health Monitoring Subject',
        role: 'Site Reliability Engineering Intern',
        type: 'FULL_TIME',
        companyId: 'company-a-tech',
        startDate: '2026-09-01T00:00:00Z',
        endDate: '2026-12-01T00:00:00Z',
        expectedOutcomes: [
          {
            title: 'Monitoring Architecture Deployment',
            description: 'Implement real-time health checks and telemetry dashboards',
            expectedEvidence: 'Prometheus dashboard and alert manager configs',
          },
        ],
      }),
    });
    const regData = await regRes.json();
    testInternshipId = regData.data.id;

    // Submit for approval
    await fetch(`${baseUrl}/api/v1/internships/${testInternshipId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });

    // Approve by HOD (generates workflow instance and tasks)
    await fetch(`${baseUrl}/api/v1/internships/${testInternshipId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenHodA}`,
      },
      body: JSON.stringify({ approved: true }),
    });

    // Assign Faculty coordinator
    await fetch(`${baseUrl}/api/v1/internships/${testInternshipId}/assign-faculty`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenHodA}`,
      },
      body: JSON.stringify({ facultyId: facultyAId, facultyName: 'Dr. Turing' }),
    });

    // Transition internship to ACTIVE
    const detail = internshipStore.details.get(testInternshipId)!;
    detail.status = InternshipStatus.ACTIVE;

    // Find generated tasks
    const tasks = Array.from(workflowStore.tasks.values()).filter(
      (t) => t.organizationId === 'org-a-id' && (t.instanceId === detail.workflowInstanceId || t.instanceId === testInternshipId)
    );
    assert.ok(tasks.length >= 2, 'Should have generated workflow tasks');
    createdTaskId1 = tasks[0].id;
    createdTaskId2 = tasks[1].id;
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // ==========================================
  // Deterministic Health Engine Tests
  // ==========================================

  it('1. should calculate ON_TRACK status deterministically when all tasks and reviews are on time', () => {
    // Set future due dates
    const task1 = workflowStore.tasks.get(createdTaskId1)!;
    const task2 = workflowStore.tasks.get(createdTaskId2)!;
    task1.currentDueDate = new Date('2026-10-15T00:00:00Z');
    task2.currentDueDate = new Date('2026-10-20T00:00:00Z');

    const result = healthCalculationService.calculateHealth('org-a-id', testInternshipId, {
      asOfDate: new Date('2026-09-10T00:00:00Z'),
    });

    assert.equal(result.status, 'ON_TRACK');
    assert.ok(result.reasons.some((r) => r.includes('All milestones, reviews, and activities on track')));
    assert.equal(result.metrics.overdueTasks, 0);
    assert.equal(result.metrics.pendingReviews, 0);

    // Verify determinism: repeat calculation returns identical status and reasons
    const repeated = healthCalculationService.calculateHealth('org-a-id', testInternshipId, {
      asOfDate: new Date('2026-09-10T00:00:00Z'),
    });
    assert.deepEqual(result, repeated);
  });

  it('2. should evaluate ATTENTION status with exact reason when milestone is 2 days overdue', () => {
    const task1 = workflowStore.tasks.get(createdTaskId1)!;
    task1.currentDueDate = new Date('2026-09-08T00:00:00Z'); // 2 days past asOfDate

    const result = healthCalculationService.calculateHealth('org-a-id', testInternshipId, {
      asOfDate: new Date('2026-09-10T00:00:00Z'),
    });

    assert.equal(result.status, 'ATTENTION');
    assert.ok(result.reasons.some((r) => r.includes(`Milestone '${task1.title}' is overdue by 2 days`)));
    assert.equal(result.metrics.overdueTasks, 1);
  });

  it('3. should evaluate CRITICAL status with exact reason when milestone is 8 days overdue (>7 days)', () => {
    const task1 = workflowStore.tasks.get(createdTaskId1)!;
    task1.currentDueDate = new Date('2026-09-02T00:00:00Z'); // 8 days past asOfDate

    const result = healthCalculationService.calculateHealth('org-a-id', testInternshipId, {
      asOfDate: new Date('2026-09-10T00:00:00Z'),
    });

    assert.equal(result.status, 'CRITICAL');
    assert.ok(result.reasons.some((r) => r.includes(`Milestone '${task1.title}' is critically overdue by 8 days`)));
  });

  it('4. should escalate to CRITICAL status when multiple milestones (>=2) are overdue', () => {
    const task1 = workflowStore.tasks.get(createdTaskId1)!;
    const task2 = workflowStore.tasks.get(createdTaskId2)!;
    task1.currentDueDate = new Date('2026-09-08T00:00:00Z'); // 2 days overdue
    task2.currentDueDate = new Date('2026-09-08T00:00:00Z'); // 2 days overdue

    const result = healthCalculationService.calculateHealth('org-a-id', testInternshipId, {
      asOfDate: new Date('2026-09-10T00:00:00Z'),
    });

    assert.equal(result.status, 'CRITICAL');
    assert.ok(result.reasons.some((r) => r.includes('Multiple overdue workflow milestones (2 tasks past due)')));
    assert.equal(result.metrics.overdueTasks, 2);
  });

  it('5. should evaluate ATTENTION status when a mentor review is pending for 4 days (>3 days)', () => {
    // Reset tasks to future
    const task1 = workflowStore.tasks.get(createdTaskId1)!;
    const task2 = workflowStore.tasks.get(createdTaskId2)!;
    task1.currentDueDate = new Date('2026-10-15T00:00:00Z');
    task2.currentDueDate = new Date('2026-10-20T00:00:00Z');

    // Add a pending submission submitted 4 days ago
    const subId = 'sub-test-pending-1';
    workspaceStore.submissions.set(subId, {
      id: subId,
      organizationId: 'org-a-id',
      internshipId: testInternshipId,
      taskId: createdTaskId1,
      studentId: studentAId,
      title: 'Bi-Weekly Activity Report',
      content: 'Completed telemetry setup',
      status: SubmissionStatus.SUBMITTED,
      submittedAt: new Date('2026-09-06T00:00:00Z'),
      updatedAt: new Date('2026-09-06T00:00:00Z'),
    });

    const result = healthCalculationService.calculateHealth('org-a-id', testInternshipId, {
      asOfDate: new Date('2026-09-10T00:00:00Z'),
    });

    assert.equal(result.status, 'ATTENTION');
    assert.ok(result.reasons.some((r) => r.includes("Mentor review pending for 'Bi-Weekly Activity Report' (4 days)")));
    assert.equal(result.metrics.pendingReviews, 1);
  });

  it('6. should evaluate CRITICAL status when a mentor review is delayed for 8 days (>7 days)', () => {
    const sub = workspaceStore.submissions.get('sub-test-pending-1')!;
    sub.submittedAt = new Date('2026-09-02T00:00:00Z'); // 8 days pending

    const result = healthCalculationService.calculateHealth('org-a-id', testInternshipId, {
      asOfDate: new Date('2026-09-10T00:00:00Z'),
    });

    assert.equal(result.status, 'CRITICAL');
    assert.ok(result.reasons.some((r) => r.includes("Mentor review critically delayed for 'Bi-Weekly Activity Report' (8 days pending)")));
  });

  it('7. should flag CRITICAL status immediately when an open CRITICAL mentor concern exists', () => {
    // Mark submission as accepted to clear review flag
    const sub = workspaceStore.submissions.get('sub-test-pending-1')!;
    sub.status = SubmissionStatus.ACCEPTED;

    // Raise critical mentor concern
    const concernId = 'concern-crit-1';
    workspaceStore.concerns.set(concernId, {
      id: concernId,
      organizationId: 'org-a-id',
      internshipId: testInternshipId,
      mentorId: 'user-a-mentor',
      mentorName: 'John Mentor',
      reason: 'Repeated unexcused absence from team standups and security briefings',
      severity: 'CRITICAL',
      status: 'OPEN',
      requestedAt: new Date('2026-09-09T00:00:00Z'),
    });

    const result = healthCalculationService.calculateHealth('org-a-id', testInternshipId, {
      asOfDate: new Date('2026-09-10T00:00:00Z'),
    });

    assert.equal(result.status, 'CRITICAL');
    assert.ok(result.reasons.some((r) => r.includes('Mentor raised critical concern: Repeated unexcused absence')));
    assert.equal(result.metrics.openConcernsCount, 1);

    // Clean up concern
    workspaceStore.concerns.delete(concernId);
  });

  it('8. should flag ATTENTION status when student has been inactive for 16 days (>14 days)', () => {
    // Reset submission to past 16 days ago
    const sub = workspaceStore.submissions.get('sub-test-pending-1')!;
    sub.submittedAt = new Date('2026-08-20T00:00:00Z');
    sub.updatedAt = new Date('2026-08-20T00:00:00Z');

    const detail = internshipStore.details.get(testInternshipId)!;
    detail.startDate = new Date('2026-08-01T00:00:00Z');
    detail.updatedAt = new Date('2026-08-20T00:00:00Z');

    const result = healthCalculationService.calculateHealth('org-a-id', testInternshipId, {
      asOfDate: new Date('2026-09-05T00:00:00Z'), // 16 days after Aug 20
    });

    assert.equal(result.status, 'ATTENTION');
    assert.ok(result.reasons.some((r) => r.includes('No submission activity in the past 16 days')));
  });

  // ==========================================
  // Monitoring API Endpoints Tests
  // ==========================================

  it('9. should return role-scoped overview metrics via GET /api/v1/monitoring/overview for ADMIN', async () => {
    const res = await fetch(`${baseUrl}/api/v1/monitoring/overview`, {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.totalInternships >= 1);
    assert.ok(typeof body.data.onTrack === 'number');
    assert.ok(typeof body.data.attention === 'number');
    assert.ok(typeof body.data.critical === 'number');
    assert.ok(typeof body.data.overdue === 'number');
    assert.ok(typeof body.data.pendingReviews === 'number');
  });

  it('10. should return scoped overview metrics for assigned FACULTY', async () => {
    const res = await fetch(`${baseUrl}/api/v1/monitoring/overview`, {
      headers: { Authorization: `Bearer ${tokenFacultyA}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.totalInternships >= 1);
  });

  it('11. should filter monitored internships via GET /api/v1/monitoring/internships', async () => {
    const res = await fetch(`${baseUrl}/api/v1/monitoring/internships?health=ALL&search=Phase 7`, {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);

    const item = body.data[0];
    assert.equal(item.internship.title, 'Phase 7 Health Monitoring Subject');
    assert.ok(item.health);
    assert.ok(['ON_TRACK', 'ATTENTION', 'CRITICAL'].includes(item.health.status));
    assert.ok(Array.isArray(item.health.reasons));
    assert.ok(item.health.metrics);
  });

  it('12. should return items in attention queue via GET /api/v1/monitoring/attention-queue', async () => {
    // Cause an overdue task so the internship appears in the attention queue
    const task1 = workflowStore.tasks.get(createdTaskId1)!;
    task1.currentDueDate = new Date('2026-01-01T00:00:00Z'); // Definitely overdue

    const res = await fetch(`${baseUrl}/api/v1/monitoring/attention-queue`, {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));

    const found = body.data.find((c: any) => c.internshipId === testInternshipId);
    assert.ok(found, 'Should find internship in attention queue');
    assert.ok(found.status === 'ATTENTION' || found.status === 'CRITICAL');
    assert.ok(found.reasons.length > 0);
    assert.ok(found.reasons.some((r: string) => r.includes('overdue')));
  });

  it('13. should return complete lifecycle timeline via GET /api/v1/monitoring/internships/:id/timeline', async () => {
    const res = await fetch(`${baseUrl}/api/v1/monitoring/internships/${testInternshipId}/timeline`, {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 3, 'Timeline should contain registration, approval, tasks');

    const eventTypes = body.data.map((e: any) => e.type);
    assert.ok(eventTypes.includes('REGISTRATION'));
    assert.ok(eventTypes.includes('WORKFLOW_TASK'));
    assert.ok(eventTypes.includes('ASSIGNMENT') || eventTypes.includes('STATE_TRANSITION'));
  });

  it('14. should retrieve single internship health via GET /api/v1/monitoring/internships/:id/health', async () => {
    const res = await fetch(`${baseUrl}/api/v1/monitoring/internships/${testInternshipId}/health`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(['ON_TRACK', 'ATTENTION', 'CRITICAL'].includes(body.data.status));
    assert.ok(Array.isArray(body.data.reasons));
  });

  it('15. should block cross-tenant access to monitoring endpoints', async () => {
    // Admin B attempting to fetch timeline of an Org A internship
    const res = await fetch(`${baseUrl}/api/v1/monitoring/internships/${testInternshipId}/timeline`, {
      headers: { Authorization: `Bearer ${tokenAdminB}` },
    });
    // Should be blocked by tenant boundary check
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  it('16. should allow Admin to get and update health evaluation thresholds', async () => {
    // 1. Get current thresholds
    const getRes = await fetch(`${baseUrl}/api/v1/monitoring/thresholds`, {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.success, true);
    assert.equal(getBody.data.maxOverdueDaysAttention, 1);

    // 2. Update thresholds
    const patchRes = await fetch(`${baseUrl}/api/v1/monitoring/thresholds`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdminA}`,
      },
      body: JSON.stringify({
        maxOverdueDaysAttention: 2,
        maxOverdueDaysCritical: 10,
      }),
    });
    assert.equal(patchRes.status, 200);
    const patchBody = await patchRes.json();
    assert.equal(patchBody.data.maxOverdueDaysAttention, 2);
    assert.equal(patchBody.data.maxOverdueDaysCritical, 10);
  });
});
