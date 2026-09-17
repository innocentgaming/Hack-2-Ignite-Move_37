import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { app } from '../src/app.js';
import { analyticsService } from '../src/services/analytics.service.js';
import { internshipStore } from '../src/services/internship.service.js';
import { workflowStore } from '../src/services/workflow.service.js';
import { workspaceStore } from '../src/services/workspace.service.js';
import { completionStore } from '../src/services/completion.service.js';
import { tenantStore } from '../src/services/tenant.service.js';
import { authStore } from '../src/services/auth.service.js';
import { aiStore } from '../src/services/ai/ai-analysis.service.js';
import {
  InternshipStatus,
  SubmissionStatus,
  UserRole,
  OutcomeStatus,
  WorkflowStepType,
  LatePolicyType,
} from '@internos/types';

describe('InternOS Phase 11: Institutional & Department Analytics Suite', () => {
  let server: Server;
  let baseUrl: string;

  // Tokens
  let tokenAdminA: string;
  let tokenFacultyA: string;
  let tokenStudentA: string;
  let tokenAdminB: string;
  let tokenStudentB: string;

  // IDs
  let studentAId: string;
  let studentA2Id: string;
  let mentorAId: string;
  let facultyAId: string;
  let testInternship1Id: string;
  let testInternship2Id: string;
  let deptCsId: string;
  let deptEeId: string;
  let compAlphaId: string;
  let compBetaId: string;

  before(async () => {
    server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;

    // 1. Authenticate Actors
    const resAdminA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataAdminA = (await resAdminA.json()) as any;
    tokenAdminA = dataAdminA.data.token;

    const resFacA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'faculty@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataFacA = (await resFacA.json()) as any;
    tokenFacultyA = dataFacA.data.token;
    facultyAId = dataFacA.data.user.id;

    const resStudA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataStudA = (await resStudA.json()) as any;
    tokenStudentA = dataStudA.data.token;
    studentAId = dataStudA.data.user.id;

    const resMenA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'mentor@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataMenA = (await resMenA.json()) as any;
    mentorAId = dataMenA.data.user.id;

    const resAdminB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@org-b.com', password: 'Password123!', organizationCode: 'ORG_B' }),
    });
    const dataAdminB = (await resAdminB.json()) as any;
    tokenAdminB = dataAdminB.data.token;

    const resStudB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-b.com', password: 'Password123!', organizationCode: 'ORG_B' }),
    });
    const dataStudB = (await resStudB.json()) as any;
    tokenStudentB = dataStudB.data.token;

    // 2. Setup Known Database Fixtures in Org A
    // Use canonical seeded departments
    deptCsId = 'dept-a-cs';
    deptEeId = 'dept-a-ee';

    // Assign Student 1 to CS
    const s1 = authStore.users.get(studentAId);
    if (s1) {
      s1.departmentId = deptCsId;
    }

    // Create Student 2 in EE
    studentA2Id = 'user-student-a2-id';
    authStore.users.set(studentA2Id, {
      id: studentA2Id,
      organizationId: 'org-a-id',
      email: 'student2@org-a.com',
      passwordHash: 'hashed',
      firstName: 'Emily',
      lastName: 'Wong',
      role: UserRole.STUDENT,
      departmentId: deptEeId,
      status: 'ACTIVE' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Companies
    compAlphaId = 'company-alpha-id';
    compBetaId = 'company-beta-id';
    internshipStore.companies.set(compAlphaId, {
      id: compAlphaId,
      organizationId: 'org-a-id',
      name: 'AlphaCloud Systems',
      industry: 'Cloud Computing & Infrastructure',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    internshipStore.companies.set(compBetaId, {
      id: compBetaId,
      organizationId: 'org-a-id',
      name: 'BetaRobotics Corp',
      industry: 'Autonomous Robotics',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Internship 1 (Student A, CS, Active, AlphaCloud)
    testInternship1Id = 'internship-analytics-1';
    internshipStore.details.set(testInternship1Id, {
      id: testInternship1Id,
      organizationId: 'org-a-id',
      studentId: studentAId,
      companyId: compAlphaId,
      title: 'Distributed Systems & Cloud Architecture Internship',
      type: 'FULL_TIME',
      status: InternshipStatus.ACTIVE,
      startDate: new Date('2026-01-10'),
      endDate: new Date('2026-06-30'),
      facultyId: facultyAId,
      mentorId: mentorAId,
      mentor: {
        name: 'John Mentor',
        email: 'mentor@org-a.com',
        designation: 'Staff Infrastructure Architect',
      },
      expectedOutcomes: [
        {
          id: 'out-1',
          title: 'PO1-CloudNative',
          description: 'Deploy resilient containerized workloads',
          expectedEvidence: 'Architecture diagram and Kubernetes YAML',
          status: OutcomeStatus.MET,
        },
        {
          id: 'out-2',
          title: 'PO2-PerformanceOptimization',
          description: 'Measure throughput and reduce p99 latency',
          expectedEvidence: 'Benchmark metrics reports',
          status: OutcomeStatus.IN_PROGRESS,
        },
      ],
      outcomeVersion: 1,
      workflowInstanceId: 'wf-inst-analytics-1',
      stateHistory: [],
      createdAt: new Date('2026-01-05'),
      updatedAt: new Date('2026-01-05'),
    });

    // Internship 2 (Student 2, EE, Completed, BetaRobotics)
    testInternship2Id = 'internship-analytics-2';
    internshipStore.details.set(testInternship2Id, {
      id: testInternship2Id,
      organizationId: 'org-a-id',
      studentId: studentA2Id,
      companyId: compBetaId,
      title: 'Robotics Embedded Firmware Internship',
      type: 'FULL_TIME',
      status: InternshipStatus.COMPLETED,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-05-30'),
      facultyId: facultyAId,
      mentorId: mentorAId,
      mentor: {
        name: 'John Mentor',
        email: 'mentor@org-a.com',
        designation: 'Senior Robotics Lead',
      },
      expectedOutcomes: [
        {
          id: 'out-3',
          title: 'PO3-EmbeddedFirmware',
          description: 'Write real-time firmware in C/Rust',
          expectedEvidence: 'Source repository and logic analyzer traces',
          status: OutcomeStatus.MET,
        },
      ],
      outcomeVersion: 1,
      workflowInstanceId: 'wf-inst-analytics-2',
      stateHistory: [],
      createdAt: new Date('2026-01-20'),
      updatedAt: new Date('2026-05-30'),
    });

    // Tasks & Submissions for Internship 1
    const taskOnTime = 'task-ana-ontime';
    const taskOverdue = 'task-ana-overdue';

    workflowStore.tasks.set(taskOnTime, {
      id: taskOnTime,
      organizationId: 'org-a-id',
      instanceId: 'wf-inst-analytics-1',
      stepId: 'step-1',
      title: 'System Design Document',
      stage: 'MID_TERM',
      type: WorkflowStepType.SUBMISSION,
      status: 'APPROVED' as any,
      assigneeRole: UserRole.STUDENT,
      required: true,
      originalDueDate: new Date('2026-03-01'),
      currentDueDate: new Date('2026-03-01'),
      isLate: false,
      latePolicy: LatePolicyType.ALLOW_NO_PENALTY,
      extensions: [],
      createdAt: new Date('2026-01-10'),
      updatedAt: new Date('2026-01-10'),
    });

    workflowStore.tasks.set(taskOverdue, {
      id: taskOverdue,
      organizationId: 'org-a-id',
      instanceId: 'wf-inst-analytics-1',
      stepId: 'step-2',
      title: 'Monthly Progress Report 2',
      stage: 'MID_TERM',
      type: WorkflowStepType.SUBMISSION,
      status: 'PENDING' as any,
      assigneeRole: UserRole.STUDENT,
      required: true,
      originalDueDate: new Date('2026-01-15'), // Overdue!
      currentDueDate: new Date('2026-01-15'),
      isLate: false,
      latePolicy: LatePolicyType.ALLOW_NO_PENALTY,
      extensions: [],
      createdAt: new Date('2026-01-10'),
      updatedAt: new Date('2026-01-10'),
    });

    // Submissions
    const sub1Id = 'sub-ana-1';
    workspaceStore.submissions.set(sub1Id, {
      id: sub1Id,
      organizationId: 'org-a-id',
      internshipId: testInternship1Id,
      taskId: taskOnTime,
      studentId: studentAId,
      title: 'System Architecture Design Doc v1',
      content: 'Multi-region distributed storage with raft consensus',
      status: SubmissionStatus.ACCEPTED,
      submittedAt: new Date('2026-02-20'), // Submitted before March 1 -> on-time!
      updatedAt: new Date('2026-02-20'),
    });

    // Review for sub 1
    const rev1Id = 'rev-ana-1';
    workspaceStore.reviews.set(rev1Id, {
      id: rev1Id,
      organizationId: 'org-a-id',
      submissionId: sub1Id,
      reviewerId: mentorAId,
      reviewerName: 'John Mentor',
      reviewerRole: UserRole.MENTOR,
      feedback: 'Excellent design document and formal verification',
      score: 95,
      status: 'ACCEPTED',
      createdAt: new Date('2026-02-25'),
    });

    // Final Evaluation for Completed Internship 2
    completionStore.finalEvaluations.set(testInternship2Id, {
      id: 'eval-ana-2',
      organizationId: 'org-a-id',
      internshipId: testInternship2Id,
      evaluatorId: mentorAId,
      evaluatorName: 'John Mentor',
      evaluatorRole: UserRole.MENTOR,
      criteria: [
        { id: 'c1', name: 'Technical Skills', maxMarks: 30, awardedMarks: 29 },
        { id: 'c2', name: 'Work Quality', maxMarks: 30, awardedMarks: 28 },
        { id: 'c3', name: 'Initiative', maxMarks: 20, awardedMarks: 19 },
        { id: 'c4', name: 'Professionalism', maxMarks: 20, awardedMarks: 18 },
      ],
      totalMarks: 94,
      maxMarks: 100,
      percentage: 94,
      finalGrade: 'A+',
      comments: 'Outstanding performance across firmware testing',
      finalRemarks: 'Recommended for immediate full-time hire',
      submittedAt: new Date('2026-05-25').toISOString(),
      updatedAt: new Date('2026-05-25').toISOString(),
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  // =========================================================================
  // 1. Overview Metrics Calculation
  // =========================================================================
  it('1. should calculate executive overview metrics (active, completed, overdue, rates)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/analytics`, {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert.equal(res.status, 200);

    const body = (await res.json()) as any;
    assert.equal(body.success, true);
    const overview = body.data.overview;

    assert.equal(overview.totalInternships >= 2, true);
    assert.equal(overview.activeInternships >= 1, true);
    assert.equal(overview.completedInternships >= 1, true);
    assert.ok(overview.completionRate > 0, 'Completion rate must be calculated');
    assert.ok(overview.overdueSubmissions >= 1, 'Overdue submissions must be detected');
    assert.ok(overview.averageEvaluationScore >= 90, 'Average evaluation score calculated accurately');
  });

  // =========================================================================
  // 2. Department Internship Completion Breakdown
  // =========================================================================
  it('2. should calculate department-by-department completion metrics', async () => {
    const res = await fetch(`${baseUrl}/api/v1/analytics`, {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert.equal(res.status, 200);

    const body = (await res.json()) as any;
    const depts = body.data.departmentCompletion;
    assert.ok(Array.isArray(depts));

    const csDept = depts.find((d: any) => d.departmentCode === 'CS');
    const eeDept = depts.find((d: any) => d.departmentCode === 'EE');

    assert.ok(csDept, 'CS department must be present in breakdown');
    assert.ok(eeDept, 'EE department must be present in breakdown');

    assert.equal(csDept.activeInternships >= 1, true);
    assert.equal(eeDept.completedInternships >= 1, true);
    assert.equal(eeDept.completionRate, 100);
  });

  // =========================================================================
  // 3. Partner Company Distribution
  // =========================================================================
  it('3. should calculate partner company distribution with percentages', async () => {
    const res = await fetch(`${baseUrl}/api/v1/analytics`, {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert.equal(res.status, 200);

    const body = (await res.json()) as any;
    const companies = body.data.companyDistribution;
    assert.ok(Array.isArray(companies));
    assert.ok(companies.length >= 2);

    const alpha = companies.find((c: any) => c.companyName === 'AlphaCloud Systems');
    const beta = companies.find((c: any) => c.companyName === 'BetaRobotics Corp');

    assert.ok(alpha, 'AlphaCloud Systems should be in company distribution');
    assert.ok(beta, 'BetaRobotics Corp should be in company distribution');
    assert.ok(alpha.percentage > 0);
  });

  // =========================================================================
  // 4. Mentor Workload Distribution
  // =========================================================================
  it('4. should compute mentor workload with assigned mentees, active, completed, and pending reviews', async () => {
    const res = await fetch(`${baseUrl}/api/v1/analytics`, {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert.equal(res.status, 200);

    const body = (await res.json()) as any;
    const mentors = body.data.mentorWorkload;
    assert.ok(Array.isArray(mentors));

    const mentor = mentors.find((m: any) => m.mentorEmail === 'mentor@org-a.com');
    assert.ok(mentor, 'Assigned mentor should appear in workload breakdown');
    assert.ok(mentor.assignedInternships >= 2, 'Should reflect assigned internships');
    assert.ok(mentor.completedInternships >= 1, 'Should reflect completed internships');
  });

  // =========================================================================
  // 5. Submission Compliance
  // =========================================================================
  it('5. should compute submission compliance metrics (on-time rate, on-time count, overdue count)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/analytics`, {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert.equal(res.status, 200);

    const body = (await res.json()) as any;
    const comp = body.data.submissionCompliance;

    assert.ok(comp.totalSubmissions >= 1);
    assert.ok(comp.onTimeSubmissions >= 1);
    assert.ok(comp.onTimeRate > 0);
    assert.ok(comp.overdueSubmissions >= 1);
  });

  // =========================================================================
  // 6. Evaluation Grade Breakdown
  // =========================================================================
  it('6. should compute final evaluation score bands and grade distribution', async () => {
    const res = await fetch(`${baseUrl}/api/v1/analytics`, {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert.equal(res.status, 200);

    const body = (await res.json()) as any;
    const evalDist = body.data.evaluationDistribution;

    assert.equal(evalDist.totalEvaluations >= 1, true);
    assert.equal(evalDist.averageScore, 94);

    const aPlusGrade = evalDist.gradeBreakdown.find((g: any) => g.grade === 'A+');
    assert.ok(aPlusGrade);
    assert.ok(aPlusGrade.count >= 1);

    const band90to100 = evalDist.scoreBands.find((b: any) => b.band === '90-100');
    assert.ok(band90to100);
    assert.ok(band90to100.count >= 1);
  });

  // =========================================================================
  // 7. Outcome Evidence Coverage
  // =========================================================================
  it('7. should compute outcome evidence coverage across defined educational outcomes', async () => {
    const res = await fetch(`${baseUrl}/api/v1/analytics`, {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert.equal(res.status, 200);

    const body = (await res.json()) as any;
    const outcomeCov = body.data.outcomeEvidenceCoverage;

    assert.ok(outcomeCov.totalOutcomes >= 2);
    assert.ok(outcomeCov.coveredOutcomes >= 1);
    assert.ok(outcomeCov.coveragePercentage > 0);

    const po1 = outcomeCov.outcomes.find((o: any) => o.code === 'PO1-CloudNative');
    assert.ok(po1);
    assert.equal(po1.hasEvidence, true);
  });

  // =========================================================================
  // 8. Department Filter Scoping
  // =========================================================================
  it('8. should filter analytics specifically to a requested department', async () => {
    const res = await fetch(`${baseUrl}/api/v1/analytics?departmentId=${deptEeId}`, {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert.equal(res.status, 200);

    const body = (await res.json()) as any;
    assert.equal(body.data.filtersApplied.departmentId, deptEeId);

    // EE department only has 1 completed internship
    const overview = body.data.overview;
    assert.equal(overview.totalInternships, 1);
    assert.equal(overview.completedInternships, 1);
    assert.equal(overview.activeInternships, 0);
    assert.equal(overview.completionRate, 100);
  });

  // =========================================================================
  // 9. Date Range Filter Scoping
  // =========================================================================
  it('9. should filter analytics within a specific date range', async () => {
    const res = await fetch(`${baseUrl}/api/v1/analytics?startDate=2026-01-01&endDate=2026-01-15`, {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert.equal(res.status, 200);

    const body = (await res.json()) as any;
    assert.ok(body.data.filtersApplied.startDate);
    assert.ok(body.data.filtersApplied.endDate);
    assert.ok(body.data.overview.totalInternships >= 1);
  });

  // =========================================================================
  // 10. CSV Export Capability
  // =========================================================================
  it('10. should stream structured CSV export with all aggregate sections', async () => {
    const res = await fetch(`${baseUrl}/api/v1/analytics/export`, {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('text/csv'));
    assert.ok(res.headers.get('content-disposition')?.includes('attachment; filename='));

    const csvText = await res.text();
    assert.ok(csvText.includes('InternOS Institutional & Department Analytics Report'));
    assert.ok(csvText.includes('EXECUTIVE OVERVIEW METRICS'));
    assert.ok(csvText.includes('DEPARTMENT COMPLETION ROSTER'));
    assert.ok(csvText.includes('PARTNER COMPANY DISTRIBUTION'));
    assert.ok(csvText.includes('MENTOR WORKLOAD DISTRIBUTION'));
    assert.ok(csvText.includes('FINAL EVALUATION & GRADE BREAKDOWN'));
    assert.ok(csvText.includes('OUTCOME EVIDENCE COVERAGE'));
    assert.ok(csvText.includes('AlphaCloud Systems'));
    assert.ok(csvText.includes('BetaRobotics Corp'));
  });

  // =========================================================================
  // 11. Tenant Isolation & Cross-Tenant Boundary Protection
  // =========================================================================
  it('11. should strictly prevent cross-tenant analytics inspection (Org B receives only its own data)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/analytics`, {
      headers: { Authorization: `Bearer ${tokenAdminB}` },
    });
    assert.equal(res.status, 200);

    const body = (await res.json()) as any;
    // Org B should have its own analytics, NOT Org A's AlphaCloud/BetaRobotics
    const companies = body.data.companyDistribution;
    const hasAlpha = companies.some((c: any) => c.companyName === 'AlphaCloud Systems');
    assert.equal(hasAlpha, false, 'Org B must never see Org A partner companies');
  });

  // =========================================================================
  // 12. Role Authorization Security (Student Denied)
  // =========================================================================
  it('12. should reject students from accessing institutional analytics with HTTP 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/v1/analytics`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    assert.equal(res.status, 403);
  });

  // =========================================================================
  // 13. Query Performance Benchmark
  // =========================================================================
  it('13. should calculate complete institutional analytics in under 150ms', async () => {
    const start = performance.now();
    const res = await fetch(`${baseUrl}/api/v1/analytics`, {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    const duration = performance.now() - start;

    assert.equal(res.status, 200);
    assert.ok(duration < 150, `Analytics query should be fast (<150ms), took ${duration.toFixed(2)}ms`);
  });
});
