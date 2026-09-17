import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { app } from '../src/app.js';
import {
  InternshipStatus,
  SubmissionStatus,
  UserRole,
} from '@internos/types';
import { workflowStore } from '../src/services/workflow.service.js';
import { internshipStore } from '../src/services/internship.service.js';
import { workspaceStore } from '../src/services/workspace.service.js';
import { submissionStore } from '../src/services/submission.service.js';

describe('InternOS Phase 8: Final Evaluation & Completion Engine Suite', () => {
  let server: Server;
  let baseUrl: string;

  // Tokens for ORG_A
  let _tokenAdminA: string;
  let tokenHodA: string;
  let tokenFacultyA: string;
  let tokenStudentA: string;
  let tokenMentorA: string;

  // Tokens for ORG_B
  let tokenAdminB: string;
  let tokenStudentB: string;

  // Tracked IDs
  let studentAId: string;
  let facultyAId: string;
  let testInternshipId: string;
  let createdTaskId1: string;
  let finalEvaluationId: string;

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
    _tokenAdminA = dataAdminA.data.token;

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
    tokenMentorA = dataMentorA.data.token;

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
    tokenStudentB = dataStudentB.data.token;

    // Register internship for Student A
    const regRes = await fetch(`${baseUrl}/api/v1/internships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        title: 'Phase 8 Full Lifecycle Completion Subject',
        role: 'Cloud Architect Intern',
        type: 'FULL_TIME',
        companyId: 'company-a-tech',
        startDate: '2026-06-01T00:00:00Z',
        endDate: '2026-12-01T00:00:00Z',
        expectedOutcomes: [
          {
            title: 'Production Infrastructure Deployment',
            description: 'Deploy Kubernetes clusters and CI/CD automation',
            expectedEvidence: 'Terraform blueprints and load test report',
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

    // Assign Faculty
    await fetch(`${baseUrl}/api/v1/internships/${testInternshipId}/assign-faculty`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenHodA}`,
      },
      body: JSON.stringify({ facultyId: facultyAId, facultyName: 'Dr. Turing' }),
    });

    // Transition to ACTIVE
    const detail = internshipStore.details.get(testInternshipId)!;
    detail.status = InternshipStatus.ACTIVE;

    // Locate tasks
    const tasks = Array.from(workflowStore.tasks.values()).filter(
      (t) => t.organizationId === 'org-a-id' && (t.instanceId === detail.workflowInstanceId || t.instanceId === testInternshipId)
    );
    assert.ok(tasks.length >= 1, 'Should have workflow tasks generated');
    createdTaskId1 = tasks[0].id;
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // ==========================================
  // Incomplete Completion & Missing Condition Checks
  // ==========================================

  it('1. should report missing conditions when checking prerequisites on an incomplete internship', async () => {
    const res = await fetch(`${baseUrl}/api/v1/completion/check/${testInternshipId}`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.eligible, false);
    assert.ok(body.data.missingConditions.length >= 2);
    assert.ok(body.data.missingConditions.some((c: string) => c.includes('milestone submission missing')));
    assert.ok(body.data.missingConditions.some((c: string) => c.includes('Final mentor evaluation is not completed')));
  });

  it('2. should reject faculty confirmation with HTTP 400 when prerequisites are missing', async () => {
    const res = await fetch(`${baseUrl}/api/v1/completion/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenFacultyA}`,
      },
      body: JSON.stringify({
        internshipId: testInternshipId,
        facultyNotes: 'Premature attempt to confirm completion',
      }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.message.includes('Missing prerequisite requirements'));
  });

  // ==========================================
  // Milestone Submissions & Reviews
  // ==========================================

  it('3. should complete required milestone submissions and mentor reviews', async () => {
    // 1. Upload a file for the submission
    const fileId = 'file-comp-test-1';
    submissionStore.files.set(fileId, {
      id: fileId,
      organizationId: 'org-a-id',
      studentId: studentAId,
      internshipId: testInternshipId,
      taskId: createdTaskId1,
      originalName: 'final_architecture_diagram.png',
      size: 2048,
      mimeType: 'image/png',
      storageKey: 'org-a/final_arch.png',
      isPublic: false,
      uploadedAt: new Date(),
    });

    // 2. Student submits required milestones and mentor accepts them
    const detail = internshipStore.details.get(testInternshipId)!;
    const studentTasks = Array.from(workflowStore.tasks.values()).filter(
      (t) =>
        t.organizationId === 'org-a-id' &&
        (t.instanceId === detail.workflowInstanceId || t.instanceId === testInternshipId) &&
        t.required &&
        (t.type === 'SUBMISSION' || t.assigneeRole === 'STUDENT')
    );

    for (const [idx, st] of studentTasks.entries()) {
      const subId = `sub-comp-test-${idx + 1}`;
      workspaceStore.submissions.set(subId, {
        id: subId,
        organizationId: 'org-a-id',
        internshipId: testInternshipId,
        taskId: st.id,
        studentId: studentAId,
        title: `Deliverable for ${st.title}`,
        content: 'Deployed multi-region Kubernetes infrastructure',
        status: SubmissionStatus.ACCEPTED,
        submittedAt: new Date(),
        updatedAt: new Date(),
      });

      const revId = `rev-comp-test-${idx + 1}`;
      workspaceStore.reviews.set(revId, {
        id: revId,
        organizationId: 'org-a-id',
        submissionId: subId,
        reviewerId: 'user-a-mentor',
        reviewerName: 'John Mentor',
        reviewerRole: UserRole.MENTOR,
        feedback: 'Outstanding architecture and evidence verification',
        score: 98,
        status: 'ACCEPTED',
        createdAt: new Date(),
      });
    }

    // Check checklist: required tasks & reviews should now pass
    const res = await fetch(`${baseUrl}/api/v1/completion/check/${testInternshipId}`, {
      headers: { Authorization: `Bearer ${tokenFacultyA}` },
    });
    const body = await res.json();
    assert.equal(body.data.checks.requiredSubmissionsCompleted, true);
    assert.equal(body.data.checks.requiredReviewsCompleted, true);
    assert.equal(body.data.checks.finalEvaluationCompleted, false);
  });

  // ==========================================
  // Mentor Final Evaluation (/100) & Editing
  // ==========================================

  it('4. should allow mentor to submit final evaluation with structured criteria out of 100', async () => {
    const res = await fetch(`${baseUrl}/api/v1/completion/evaluation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenMentorA}`,
      },
      body: JSON.stringify({
        internshipId: testInternshipId,
        criteria: [
          { id: 'crit-1', name: 'Technical Proficiency & Deliverables', maxMarks: 30, awardedMarks: 29 },
          { id: 'crit-2', name: 'Professionalism & Collaboration', maxMarks: 20, awardedMarks: 19 },
          { id: 'crit-3', name: 'Problem Solving & Innovation', maxMarks: 20, awardedMarks: 18 },
          { id: 'crit-4', name: 'Documentation & Reporting Quality', maxMarks: 15, awardedMarks: 14 },
          { id: 'crit-5', name: 'Learning Outcomes Achievement', maxMarks: 15, awardedMarks: 14 },
        ],
        comments: 'Exceptional intern who demonstrated staff-level engineering execution.',
        finalRemarks: 'Highest recommendation for full-time cloud architect role upon graduation.',
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.totalMarks, 94);
    assert.equal(body.data.maxMarks, 100);
    assert.equal(body.data.percentage, 94);
    assert.equal(body.data.finalGrade, 'A+');
    finalEvaluationId = body.data.id;

    // Verifying automatic state transition to READY_FOR_COMPLETION
    const detail = internshipStore.details.get(testInternshipId)!;
    assert.equal(detail.status, InternshipStatus.READY_FOR_COMPLETION);
  });

  it('5. should allow mentor to edit/update the submitted final evaluation', async () => {
    const res = await fetch(`${baseUrl}/api/v1/completion/evaluation/${finalEvaluationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenMentorA}`,
      },
      body: JSON.stringify({
        criteria: [
          { id: 'crit-1', name: 'Technical Proficiency & Deliverables', maxMarks: 30, awardedMarks: 30 },
          { id: 'crit-2', name: 'Professionalism & Collaboration', maxMarks: 20, awardedMarks: 20 },
          { id: 'crit-3', name: 'Problem Solving & Innovation', maxMarks: 20, awardedMarks: 19 },
          { id: 'crit-4', name: 'Documentation & Reporting Quality', maxMarks: 15, awardedMarks: 15 },
          { id: 'crit-5', name: 'Learning Outcomes Achievement', maxMarks: 15, awardedMarks: 15 },
        ],
        comments: 'Perfect score earned across deliverables and cloud engineering benchmarks.',
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.totalMarks, 99);
    assert.equal(body.data.percentage, 99);
    assert.equal(body.data.finalGrade, 'A+');
  });

  // ==========================================
  // Faculty Completion Confirmation (PRD Invariant Sign-Off)
  // ==========================================

  it('6. should allow faculty to confirm completion, transitioning READY_FOR_COMPLETION -> COMPLETED', async () => {
    const res = await fetch(`${baseUrl}/api/v1/completion/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenFacultyA}`,
      },
      body: JSON.stringify({
        internshipId: testInternshipId,
        facultyNotes: 'Verified all deliverables and mentor feedback. Academic standards fully satisfied.',
        academicRecommendation: 'COMMENDED',
        creditsAwarded: 4,
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.status, InternshipStatus.COMPLETED);

    // Verify detail is now COMPLETED
    const detail = internshipStore.details.get(testInternshipId)!;
    assert.equal(detail.status, InternshipStatus.COMPLETED);
    assert.ok(detail.stateHistory.some((sh) => sh.toStatus === InternshipStatus.COMPLETED));
  });

  it('7. should forbid unauthorized roles (e.g. Student) from executing completion confirmation', async () => {
    const res = await fetch(`${baseUrl}/api/v1/completion/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        internshipId: testInternshipId,
        facultyNotes: 'Student attempting self-confirmation',
      }),
    });

    assert.equal(res.status, 403);
  });

  // ==========================================
  // Student Completed Dossier
  // ==========================================

  it('8. should return complete student dossier via GET /api/v1/completion/dossier/:id', async () => {
    const res = await fetch(`${baseUrl}/api/v1/completion/dossier/${testInternshipId}`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.internship.status, InternshipStatus.COMPLETED);
    assert.ok(body.data.company.name);
    assert.ok(body.data.student.name);
    assert.equal(body.data.finalEvaluation.finalGrade, 'A+');
    assert.equal(body.data.facultyConfirmation.academicRecommendation, 'COMMENDED');
    assert.ok(Array.isArray(body.data.evidenceFiles));
    assert.ok(Array.isArray(body.data.milestoneFeedback));
    assert.ok(Array.isArray(body.data.timeline));
  });

  // ==========================================
  // Termination Request & Institutional Approval
  // ==========================================

  it('9. should handle mentor termination request and subsequent HOD approval', async () => {
    // Register another internship for termination testing
    const regRes = await fetch(`${baseUrl}/api/v1/internships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        title: 'Internship Subject to Termination Test',
        role: 'Junior Analyst',
        type: 'FULL_TIME',
        companyId: 'company-a-tech',
        startDate: '2026-06-01T00:00:00Z',
        endDate: '2026-12-01T00:00:00Z',
        expectedOutcomes: [{ title: 'Analysis', expectedEvidence: 'Report' }],
      }),
    });
    const regData = await regRes.json();
    const termInternshipId = regData.data.id;

    // Approve & activate
    const detail = internshipStore.details.get(termInternshipId)!;
    detail.status = InternshipStatus.ACTIVE;

    // 1. Mentor requests termination
    const termReqRes = await fetch(`${baseUrl}/api/v1/completion/termination-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenMentorA}`,
      },
      body: JSON.stringify({
        internshipId: termInternshipId,
        reason: 'Host organization closed internship program due to corporate restructuring',
      }),
    });

    assert.equal(termReqRes.status, 201);
    const termReqBody = await termReqRes.json();
    assert.equal(termReqBody.data.status, 'PENDING');

    // 2. HOD approves termination
    const termDecideRes = await fetch(`${baseUrl}/api/v1/completion/terminate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenHodA}`,
      },
      body: JSON.stringify({
        internshipId: termInternshipId,
        approved: true,
        reason: 'Approved termination due to host company restructuring; student reassigned',
      }),
    });

    assert.equal(termDecideRes.status, 200);
    const termDecideBody = await termDecideRes.json();
    assert.equal(termDecideBody.data.status, InternshipStatus.TERMINATED);
    assert.equal(detail.status, InternshipStatus.TERMINATED);
  });

  // ==========================================
  // Authorized Cancellation
  // ==========================================

  it('10. should allow student to cancel their own draft internship with documented reason', async () => {
    // Register draft internship
    const regRes = await fetch(`${baseUrl}/api/v1/internships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        title: 'Draft to be Cancelled',
        role: 'Research Intern',
        type: 'PART_TIME',
        companyId: 'company-a-tech',
        startDate: '2026-08-01T00:00:00Z',
        endDate: '2026-11-01T00:00:00Z',
        expectedOutcomes: [{ title: 'Research', expectedEvidence: 'Paper' }],
      }),
    });
    const regData = await regRes.json();
    const cancelInternshipId = regData.data.id;

    const cancelRes = await fetch(`${baseUrl}/api/v1/completion/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        internshipId: cancelInternshipId,
        reason: 'Candidate accepted competing academic research grant',
      }),
    });

    assert.equal(cancelRes.status, 200);
    const cancelBody = await cancelRes.json();
    assert.equal(cancelBody.data.status, InternshipStatus.CANCELLED);

    const detail = internshipStore.details.get(cancelInternshipId)!;
    assert.equal(detail.status, InternshipStatus.CANCELLED);
  });

  it('11. should reject cancellation without reason with HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/api/v1/completion/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        internshipId: testInternshipId,
        reason: '   ',
      }),
    });

    assert.equal(res.status, 400);
  });

  it('12. should block cross-tenant dossier and prerequisite access with HTTP 403', async () => {
    // Admin B attempting to fetch Org A completed dossier
    const res = await fetch(`${baseUrl}/api/v1/completion/dossier/${testInternshipId}`, {
      headers: { Authorization: `Bearer ${tokenAdminB}` },
    });
    assert.equal(res.status, 403);

    // Student B attempting to check Org A prerequisites
    const res2 = await fetch(`${baseUrl}/api/v1/completion/check/${testInternshipId}`, {
      headers: { Authorization: `Bearer ${tokenStudentB}` },
    });
    assert.equal(res2.status, 403);
  });
});
