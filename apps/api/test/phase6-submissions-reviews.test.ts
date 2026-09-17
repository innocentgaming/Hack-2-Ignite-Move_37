import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { app } from '../src/app.js';
import {
  InternshipStatus,
  TaskStatus,
  SubmissionStatus,
} from '@internos/types';
import { workflowStore } from '../src/services/workflow.service.js';

describe('InternOS Phase 6: Versioned Submissions, Private Files & Mentor Reviews Suite', () => {
  let server: Server;
  let baseUrl: string;

  // Tokens for ORG_A
  let tokenAdminA: string;
  let tokenHodA: string;
  let _tokenFacultyA: string;
  let tokenStudentA: string;
  let tokenStudentA2: string; // Another student in Org A for unauthorized access test
  let tokenMentorA: string;

  // Tokens for ORG_B
  let tokenStudentB: string;
  let tokenMentorB: string;

  // Tracked IDs
  let _studentAId: string;
  let _studentA2Id: string;
  let mentorAId: string;
  let createdInternshipId: string;
  let onTimeTaskId: string;
  let overdueTaskId: string;
  let uploadedFileId: string;
  let createdSubmissionId: string;

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
    _tokenFacultyA = dataFacultyA.data.token;

    // 4. Login Student Org A (Primary)
    const resStudentA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataStudentA = await resStudentA.json();
    tokenStudentA = dataStudentA.data.token;
    _studentAId = dataStudentA.data.user.id;

    // 5. Create & Login Student 2 in Org A (for privacy checks)
    const resInviteStudent2 = await fetch(`${baseUrl}/api/v1/auth/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdminA}`,
      },
      body: JSON.stringify({
        email: 'student2@org-a.com',
        firstName: 'Student2',
        lastName: 'OrgA',
        role: 'STUDENT',
        departmentId: 'dept-a-1',
      }),
    });
    const dataInviteStudent2 = await resInviteStudent2.json();
    const student2Token = dataInviteStudent2.data.activationToken;

    await fetch(`${baseUrl}/api/v1/auth/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: student2Token,
        password: 'Password123!',
      }),
    });

    const resStudentA2 = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student2@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataStudentA2 = await resStudentA2.json();
    tokenStudentA2 = dataStudentA2.data.token;
    _studentA2Id = dataStudentA2.data.user.id;

    // 6. Login Mentor Org A
    const resMentorA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'mentor@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataMentorA = await resMentorA.json();
    tokenMentorA = dataMentorA.data.token;
    mentorAId = dataMentorA.data.user.id;

    // 7. Login Student Org B
    const resStudentB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-b.com', password: 'Password123!', organizationCode: 'ORG_B' }),
    });
    const dataStudentB = await resStudentB.json();
    tokenStudentB = dataStudentB.data.token;

    // 8. Login Mentor Org B
    const resMentorB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'mentor@org-b.com', password: 'Password123!', organizationCode: 'ORG_B' }),
    });
    const dataMentorB = await resMentorB.json();
    tokenMentorB = dataMentorB.data.token;

    // Setup an active internship in Org A for Student A
    const resReg = await fetch(`${baseUrl}/api/v1/internships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        title: 'Deliverables & Research Intern',
        role: 'Deliverables & Research Intern',
        internshipType: 'FULL_TIME',
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-09-01T00:00:00.000Z',
        description: 'End-to-end full stack development with structured versioning and reports',
        newCompany: {
          name: 'Phase6 Submissions Host Inc',
          industry: 'Software Engineering',
        },
        expectedOutcomes: [
          {
            title: 'Produce High-Quality Technical Reports & PPT Presentations',
            description: 'Weekly milestone submissions and slide decks',
            expectedEvidence: 'Weekly milestone submissions and slide decks',
          },
        ],
        mentor: {
          name: 'Jane Mentor',
          email: 'mentor@org-a.com',
          designation: 'Staff Engineer',
        },
      }),
    });
    const dataReg = await resReg.json();
    createdInternshipId = dataReg.data.id;

    // Submit for approval and approve to generate workflow tasks
    await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });

    await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenHodA}`,
      },
      body: JSON.stringify({
        approved: true,
        reason: 'Approved for research and deliverable evaluation',
      }),
    });

    await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/transition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdminA}`,
      },
      body: JSON.stringify({ targetState: InternshipStatus.ACTIVE }),
    });

    // Assign Faculty & Mentor to the internship
    await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/mentor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdminA}`,
      },
      body: JSON.stringify({
        mentorId: mentorAId,
        mentor: {
          name: 'Jane Mentor',
          email: 'mentor@org-a.com',
          designation: 'Staff Engineer',
        },
      }),
    });

    // Find generated tasks from workflow instance
    const resWorkspace = await fetch(`${baseUrl}/api/v1/workspaces/student/dashboard`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const dataWorkspace = await resWorkspace.json();
    const tasks = dataWorkspace.data.currentTasks;
    assert.ok(tasks && tasks.length >= 2, 'Should have generated workflow tasks');
    onTimeTaskId = tasks[0].id;
    overdueTaskId = tasks[1].id;

    // Ensure onTimeTaskId is well in the future so submission is on time
    const onTimeTask = workflowStore.tasks.get(onTimeTaskId);
    if (onTimeTask) {
      onTimeTask.currentDueDate = new Date(Date.now() + 86400000 * 14); // 14 days in future
    }

    // Modify overdueTaskId due date into the past to test late submissions
    const memTask = workflowStore.tasks.get(overdueTaskId);
    if (memTask) {
      memTask.currentDueDate = new Date(Date.now() - 86400000 * 5); // 5 days ago
    }
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  // ==========================================
  // 1. File Upload & Private File Security Tests
  // ==========================================
  describe('1. File Upload & Private File Security', () => {
    it('should allow student to upload a deliverable file privately', async () => {
      const res = await fetch(`${baseUrl}/api/v1/submissions/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          filename: 'sprint1_technical_architecture.pdf',
          mimeType: 'application/pdf',
          content: 'PDF_FILE_HEADER_BINARY_CONTENT_SIMULATION_VERSION_1',
          internshipId: createdInternshipId,
          taskId: onTimeTaskId,
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.id, 'File ID should be generated');
      assert.strictEqual(body.data.name, 'sprint1_technical_architecture.pdf');
      assert.strictEqual(body.data.mimeType, 'application/pdf');
      assert.ok(body.data.url.includes(body.data.id));

      uploadedFileId = body.data.id;
    });

    it('should reject unauthenticated file download requests (401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/submissions/files/${uploadedFileId}`);
      assert.strictEqual(res.status, 401);
    });

    it('should forbid cross-tenant user from downloading private file (403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/submissions/files/${uploadedFileId}`, {
        headers: { Authorization: `Bearer ${tokenStudentB}` },
      });
      assert.strictEqual(res.status, 403);
    });

    it('should forbid unauthorized student in same tenant from downloading private file (403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/submissions/files/${uploadedFileId}`, {
        headers: { Authorization: `Bearer ${tokenStudentA2}` },
      });
      assert.strictEqual(res.status, 403);
    });

    it('should allow the student owner to download their private file', async () => {
      const res = await fetch(`${baseUrl}/api/v1/submissions/files/${uploadedFileId}`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/pdf');
      const text = await res.text();
      assert.strictEqual(text, 'PDF_FILE_HEADER_BINARY_CONTENT_SIMULATION_VERSION_1');
    });

    it('should allow assigned industry mentor to download the student deliverable file', async () => {
      const res = await fetch(`${baseUrl}/api/v1/submissions/files/${uploadedFileId}`, {
        headers: { Authorization: `Bearer ${tokenMentorA}` },
      });
      assert.strictEqual(res.status, 200);
      const text = await res.text();
      assert.strictEqual(text, 'PDF_FILE_HEADER_BINARY_CONTENT_SIMULATION_VERSION_1');
    });

    it('should allow tenant admin to download the private file', async () => {
      const res = await fetch(`${baseUrl}/api/v1/submissions/files/${uploadedFileId}`, {
        headers: { Authorization: `Bearer ${tokenAdminA}` },
      });
      assert.strictEqual(res.status, 200);
    });
  });

  // ==========================================
  // 2. Deliverable Submissions, AI Resilience & Late Status
  // ==========================================
  describe('2. Deliverable Submissions, AI Resilience & Late Status', () => {
    it('should submit Version 1 deliverable on time and transition task to SUBMITTED', async () => {
      const res = await fetch(`${baseUrl}/api/v1/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          internshipId: createdInternshipId,
          taskId: onTimeTaskId,
          title: 'Sprint 1 Architecture Deliverable (v1)',
          content: 'Initial submission of sprint 1 architecture diagrams and database schema design.',
          fileIds: [uploadedFileId],
          evidenceUrls: ['https://github.com/innocentgaming/sample-evidence'],
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.currentVersion, 1);
      assert.strictEqual(body.data.isLate, false);
      assert.strictEqual(body.data.status, SubmissionStatus.SUBMITTED);
      assert.strictEqual(body.data.files.length, 1);
      assert.strictEqual(body.data.versions.length, 1);
      assert.strictEqual(body.data.versions[0].version, 1);

      createdSubmissionId = body.data.id;

      // Verify task status was updated to SUBMITTED
      const task = workflowStore.tasks.get(onTimeTaskId);
      assert.strictEqual(task?.status, TaskStatus.SUBMITTED);
    });

    it('AI RESILIENCE: submission transaction succeeds even when AI service is unavailable', async () => {
      // Phase0DisabledAIService throws NotImplementedError - yet submission still completes with 201!
      const res = await fetch(`${baseUrl}/api/v1/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          internshipId: createdInternshipId,
          taskId: overdueTaskId,
          title: 'Overdue Monthly Milestone Report',
          content: 'Comprehensive monthly retrospective and outcome progress evidence.',
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.currentVersion, 1);
      assert.strictEqual(body.data.isLate, true, 'Should mark isLate true for past deadline');
    });

    it('should reject a second submission on a task already submitted without revision request', async () => {
      const res = await fetch(`${baseUrl}/api/v1/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          internshipId: createdInternshipId,
          taskId: onTimeTaskId,
          title: 'Duplicate Attempt',
          content: 'This should be blocked because the first submission is still pending mentor review.',
        }),
      });

      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
    });
  });

  // ==========================================
  // 3. Structured Mentor Review & Revision Requests
  // ==========================================
  describe('3. Structured Mentor Review & Revision Requests', () => {
    it('should allow mentor to review submission with structured rubric criteria and request revision', async () => {
      const res = await fetch(`${baseUrl}/api/v1/submissions/${createdSubmissionId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenMentorA}`,
        },
        body: JSON.stringify({
          score: 65,
          feedback: 'Architecture looks promising but needs formal UML sequence diagrams and latency benchmarks.',
          requestRevision: true,
          revisionReason: 'Please attach UML sequence diagrams and benchmark results for the auth endpoints.',
          criteria: [
            { name: 'Technical Depth', score: 20, maxScore: 30, comments: 'Good foundation, needs benchmarks' },
            { name: 'Documentation Quality', score: 25, maxScore: 30, comments: 'Clear writing, add UML diagrams' },
            { name: 'Completeness', score: 20, maxScore: 40, comments: 'Incomplete API contract' },
          ],
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.status, 'CHANGES_REQUESTED');
      assert.strictEqual(body.data.score, 65);
      assert.strictEqual(body.data.criteria.length, 3);
      assert.ok(body.data.revisionReason.includes('UML sequence diagrams'));

      // Verify submission and task statuses updated
      const resSub = await fetch(`${baseUrl}/api/v1/submissions/${createdSubmissionId}`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      const subData = await resSub.json();
      assert.strictEqual(subData.data.status, SubmissionStatus.REVISION_NEEDED);
      assert.strictEqual(subData.data.revisionReason, 'Please attach UML sequence diagrams and benchmark results for the auth endpoints.');

      const task = workflowStore.tasks.get(onTimeTaskId);
      assert.strictEqual(task?.status, TaskStatus.CHANGES_REQUESTED);
    });

    it('should reject revision request if revisionReason/feedback is blank', async () => {
      const res = await fetch(`${baseUrl}/api/v1/submissions/${createdSubmissionId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenMentorA}`,
        },
        body: JSON.stringify({
          feedback: '   ',
          requestRevision: true,
        }),
      });

      assert.strictEqual(res.status, 400);
    });
  });

  // ==========================================
  // 4. Immutable Versioning & Resubmission (Version 2)
  // ==========================================
  describe('4. Immutable Versioning & Resubmission (Version 2)', () => {
    let revisionFileId: string;

    before(async () => {
      // Upload revision evidence file (UML diagram)
      const resUpload = await fetch(`${baseUrl}/api/v1/submissions/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          filename: 'auth_uml_sequence_benchmarks_v2.png',
          mimeType: 'image/png',
          content: 'PNG_BENCHMARK_IMAGE_DATA_V2',
          internshipId: createdInternshipId,
          taskId: onTimeTaskId,
        }),
      });
      const uploadData = await resUpload.json();
      revisionFileId = uploadData.data.id;
    });

    it('should create immutable Version 2 upon revision resubmission without overwriting Version 1', async () => {
      const res = await fetch(`${baseUrl}/api/v1/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          internshipId: createdInternshipId,
          taskId: onTimeTaskId,
          isRevision: true,
          title: 'Sprint 1 Architecture Deliverable (v2 with UML & Benchmarks)',
          content: 'Updated report incorporating mentor feedback: added PlantUML sequence diagrams and wrk benchmark results.',
          fileIds: [revisionFileId],
          evidenceUrls: ['https://benchmarks.internal.org/sprint1'],
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.currentVersion, 2);
      assert.strictEqual(body.data.status, SubmissionStatus.SUBMITTED);

      // Verify versions array contains BOTH Version 1 and Version 2
      assert.strictEqual(body.data.versions.length, 2);

      const v1 = body.data.versions.find((v: any) => v.version === 1);
      const v2 = body.data.versions.find((v: any) => v.version === 2);

      assert.ok(v1, 'Version 1 must exist');
      assert.ok(v2, 'Version 2 must exist');

      // VERIFY IMMUTABILITY: Version 1 content was NOT overwritten
      assert.strictEqual(v1.title, 'Sprint 1 Architecture Deliverable (v1)');
      assert.strictEqual(v1.content, 'Initial submission of sprint 1 architecture diagrams and database schema design.');
      assert.strictEqual(v1.files[0].name, 'sprint1_technical_architecture.pdf');

      // VERIFY Version 2 has new content and new file
      assert.strictEqual(v2.title, 'Sprint 1 Architecture Deliverable (v2 with UML & Benchmarks)');
      assert.strictEqual(v2.files[0].name, 'auth_uml_sequence_benchmarks_v2.png');

      // Task status should be back to SUBMITTED
      const task = workflowStore.tasks.get(onTimeTaskId);
      assert.strictEqual(task?.status, TaskStatus.SUBMITTED);
    });

    it('should allow mentor to review and approve Version 2', async () => {
      const res = await fetch(`${baseUrl}/api/v1/submissions/${createdSubmissionId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenMentorA}`,
        },
        body: JSON.stringify({
          score: 95,
          feedback: 'Excellent update! The UML diagrams and latency metrics fully address all requirements.',
          requestRevision: false,
          criteria: [
            { name: 'Technical Depth', score: 28, maxScore: 30, comments: 'Benchmarks look solid' },
            { name: 'Documentation Quality', score: 29, maxScore: 30, comments: 'UML diagrams are clear' },
            { name: 'Completeness', score: 38, maxScore: 40, comments: 'All requirements met' },
          ],
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.data.status, 'ACCEPTED');
      assert.strictEqual(body.data.score, 95);

      // Submission status transitions to ACCEPTED
      const resSub = await fetch(`${baseUrl}/api/v1/submissions/${createdSubmissionId}`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      const subData = await resSub.json();
      assert.strictEqual(subData.data.status, SubmissionStatus.ACCEPTED);

      // Task transitions to APPROVED
      const task = workflowStore.tasks.get(onTimeTaskId);
      assert.strictEqual(task?.status, TaskStatus.APPROVED);
    });
  });

  // ==========================================
  // 5. Submission Timeline & Cross-Tenant Boundary
  // ==========================================
  describe('5. Submission Timeline & Cross-Tenant Boundary', () => {
    it('should return chronological submission timeline with all versions and reviews', async () => {
      const res = await fetch(`${baseUrl}/api/v1/submissions/${createdSubmissionId}/timeline`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.data.length >= 4, 'Timeline should have v1 submit, v1 review, v2 submit, v2 approve');

      // Verify sequence of types
      const types = body.data.map((e: any) => e.type);
      assert.strictEqual(types[0], 'SUBMITTED');
      assert.ok(types.includes('REVISION_REQUESTED'));
      assert.ok(types.includes('REVISED'));
      assert.ok(types.includes('APPROVED'));
    });

    it('should forbid student from Org B from viewing Org A submission timeline (403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/submissions/${createdSubmissionId}/timeline`, {
        headers: { Authorization: `Bearer ${tokenStudentB}` },
      });

      assert.strictEqual(res.status, 403);
    });

    it('should forbid student from Org B from reviewing Org A submission (403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/submissions/${createdSubmissionId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenMentorB}`,
        },
        body: JSON.stringify({
          feedback: 'Cross-tenant review attempt',
          score: 50,
        }),
      });

      assert.strictEqual(res.status, 403);
    });
  });
});
