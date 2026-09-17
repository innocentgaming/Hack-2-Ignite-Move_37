import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import type { Server } from 'node:http';

describe('InternOS: Student Workflows, Task Lifecycle & Document Pipeline Suite', () => {
  let server: Server;
  let baseUrl: string;
  let studentAToken: string;
  let studentBToken: string;

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://localhost:${addr.port}`;
        }
        resolve();
      });
    });

    // 1. Authenticate Student A (Alex Rivera @ Org A)
    const studentARes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@org-a.com',
        password: 'Password123!',
        organizationCode: 'ORG_A',
      }),
    });
    const studentAData = await studentARes.json();
    assert.equal(studentARes.status, 200);
    studentAToken = studentAData.data.token;

    // 2. Authenticate Student B (Student @ Org B)
    const studentBRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@org-b.com',
        password: 'Password123!',
        organizationCode: 'ORG_B',
      }),
    });
    const studentBData = await studentBRes.json();
    assert.equal(studentBRes.status, 200);
    studentBToken = studentBData.data.token;
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('1. Task Statuses & Demo Data Verification', () => {
    it('Task A (task-102: Authentication API) should have PENDING/IN_PROGRESS status and no submissions', async () => {
      const res = await fetch(`${baseUrl}/api/v1/student/tasks/task-102`, {
        headers: { Authorization: `Bearer ${studentAToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.id, 'task-102');
      assert.equal(body.data.title, 'Authentication API');
      assert.equal(body.data.status, 'PENDING');
      assert.equal(body.data.expectedEvidence, 'GitHub PR, Postman test report');
      assert.equal(body.data.latestSubmission, undefined);
    });

    it('Task B (task-103: Database Schema) should have SUBMITTED status and a submitted submission', async () => {
      const res = await fetch(`${baseUrl}/api/v1/student/tasks/task-103`, {
        headers: { Authorization: `Bearer ${studentAToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.status, 'SUBMITTED');
      assert.ok(body.data.latestSubmission);
      assert.equal(body.data.latestSubmission.status, 'SUBMITTED');
    });

    it('Task C (task-104: CI/CD Pipeline) should have CHANGES_REQUESTED status with mentor feedback', async () => {
      const res = await fetch(`${baseUrl}/api/v1/student/tasks/task-104`, {
        headers: { Authorization: `Bearer ${studentAToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.status, 'CHANGES_REQUESTED');
      assert.ok(body.data.latestSubmission);
      assert.equal(body.data.latestSubmission.status, 'REVISION_NEEDED');
      assert.ok(body.data.latestSubmission.mentorFeedback.includes('invalid credentials'));
    });

    it('Task D (task-105: Deployment) should have APPROVED status with accepted evidence', async () => {
      const res = await fetch(`${baseUrl}/api/v1/student/tasks/task-105`, {
        headers: { Authorization: `Bearer ${studentAToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.status, 'APPROVED');
      assert.ok(body.data.latestSubmission);
      assert.equal(body.data.latestSubmission.status, 'ACCEPTED');
    });

    it('Non-existent task ID should return 404 Not Found', async () => {
      const res = await fetch(`${baseUrl}/api/v1/student/tasks/task-nonexistent-999`, {
        headers: { Authorization: `Bearer ${studentAToken}` },
      });
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.error.message.includes('not found'));
    });
  });

  describe('2. Security & Cross-Tenant / Cross-Student Boundaries', () => {
    it('Student B (Org B) cannot fetch Student A (Org A) task details (403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/student/tasks/task-102`, {
        headers: { Authorization: `Bearer ${studentBToken}` },
      });
      assert.equal(res.status, 403);
    });

    it('Student B (Org B) cannot submit evidence for Student A (Org A) task (403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/student/tasks/task-102/submissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${studentBToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Malicious Cross-Tenant Submission',
          description: 'Attempting to inject submission into Org A',
          evidenceType: 'GITHUB_PR',
        }),
      });
      assert.equal(res.status, 403);
    });
  });

  describe('3. Evidence Submission & Resubmission Flow', () => {
    it('Student A submits evidence for task-102, transitioning task to SUBMITTED', async () => {
      const res = await fetch(`${baseUrl}/api/v1/student/tasks/task-102/submissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${studentAToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'JWT Auth Endpoints Implementation',
          description: 'Created /auth/login and /auth/refresh with bcrypt and HMAC SHA256 tokens.',
          evidenceType: 'GITHUB_PR',
          evidenceUrl: 'https://github.com/apex-students/cloud-internos-app/pull/18',
          notes: 'Full unit test coverage with Postman collection included.',
        }),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.status, 'SUBMITTED');

      // Verify task-102 now has SUBMITTED status and attached latestSubmission
      const taskRes = await fetch(`${baseUrl}/api/v1/student/tasks/task-102`, {
        headers: { Authorization: `Bearer ${studentAToken}` },
      });
      const taskBody = await taskRes.json();
      assert.equal(taskBody.data.status, 'SUBMITTED');
      assert.equal(taskBody.data.latestSubmission.status, 'SUBMITTED');
    });

    it('Student A resubmits evidence for task-104 (previously REVISION_NEEDED), preserving feedback history', async () => {
      // 1. Fetch sub-104
      const subRes = await fetch(`${baseUrl}/api/v1/student/submissions/sub-104`, {
        headers: { Authorization: `Bearer ${studentAToken}` },
      });
      assert.equal(subRes.status, 200);
      const subBody = await subRes.json();
      assert.equal(subBody.data.status, 'REVISION_NEEDED');
      const prevFeedback = subBody.data.mentorFeedback;

      // 2. Resubmit via PATCH /api/v1/student/submissions/sub-104
      const patchRes = await fetch(`${baseUrl}/api/v1/student/submissions/sub-104`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${studentAToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'CI/CD Pipeline GitHub Actions Implementation (v2)',
          description: 'Added negative unit test cases and handled invalid credentials in auth suite.',
          evidenceType: 'GITHUB_PR',
          evidenceUrl: 'https://github.com/apex-students/cloud-internos-app/pull/15#issuecomment-updated',
        }),
      });
      assert.equal(patchRes.status, 200);

      // 3. Verify status transitioned to SUBMITTED and history preserved previous feedback
      const updatedRes = await fetch(`${baseUrl}/api/v1/student/submissions/sub-104`, {
        headers: { Authorization: `Bearer ${studentAToken}` },
      });
      const updatedBody = await updatedRes.json();
      assert.equal(updatedBody.data.status, 'SUBMITTED');
      assert.ok(updatedBody.data.history.length >= 1);
      assert.equal(updatedBody.data.history[0].mentorFeedback, prevFeedback);

      // 4. Verify task-104 transitioned from CHANGES_REQUESTED to SUBMITTED
      const taskRes = await fetch(`${baseUrl}/api/v1/student/tasks/task-104`, {
        headers: { Authorization: `Bearer ${studentAToken}` },
      });
      const taskBody = await taskRes.json();
      assert.equal(taskBody.data.status, 'SUBMITTED');
    });
  });

  describe('4. Document Pipeline & PDF Streaming', () => {
    it('Student can list documents and see Offer_Letter_OrgA.pdf with metadata', async () => {
      const res = await fetch(`${baseUrl}/api/v1/student/documents`, {
        headers: { Authorization: `Bearer ${studentAToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));

      const offerDoc = body.data.find((d: any) => d.name === 'Offer_Letter_OrgA.pdf');
      assert.ok(offerDoc, 'Offer_Letter_OrgA.pdf must exist in documents');
      assert.equal(offerDoc.type, 'application/pdf');
      assert.ok(offerDoc.url.includes('/api/v1/student/documents/'));
      assert.ok(offerDoc.downloadUrl.includes('/download'));
    });

    it('Student can view PDF with inline Content-Disposition and valid %PDF- magic bytes', async () => {
      const res = await fetch(`${baseUrl}/api/v1/student/documents/doc-a-1/view`, {
        headers: { Authorization: `Bearer ${studentAToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'application/pdf');
      assert.ok(res.headers.get('content-disposition')?.includes('inline'));

      const buffer = await res.arrayBuffer();
      const header = Buffer.from(buffer).subarray(0, 5).toString('ascii');
      assert.equal(header, '%PDF-', 'Must contain valid PDF header magic bytes');
    });

    it('Student can download PDF with attachment Content-Disposition and preserved original filename', async () => {
      const res = await fetch(`${baseUrl}/api/v1/student/documents/doc-a-1/download`, {
        headers: { Authorization: `Bearer ${studentAToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'application/pdf');
      const disp = res.headers.get('content-disposition');
      assert.ok(disp?.includes('attachment'));
      assert.ok(disp?.includes('Offer_Letter_OrgA.pdf'));

      const buffer = await res.arrayBuffer();
      const header = Buffer.from(buffer).subarray(0, 5).toString('ascii');
      assert.equal(header, '%PDF-');
    });

    it('Student cannot download documents belonging to another student/org (403/404)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/student/documents/doc-a-1/download`, {
        headers: { Authorization: `Bearer ${studentBToken}` },
      });
      assert.equal(res.status, 403);
    });

    it('Rejects uploading non-PDF documents or corrupted files missing %PDF- magic bytes', async () => {
      // 1. Invalid MIME / extension
      const badMimeRes = await fetch(`${baseUrl}/api/v1/student/documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${studentAToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: 'notes.txt',
          mimeType: 'text/plain',
          contentBase64: Buffer.from('hello world').toString('base64'),
        }),
      });
      assert.equal(badMimeRes.status, 400);

      // 2. Renamed file with fake extension but invalid magic bytes
      const badBytesRes = await fetch(`${baseUrl}/api/v1/student/documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${studentAToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: 'fake_report.pdf',
          mimeType: 'application/pdf',
          contentBase64: Buffer.from('This is not really a PDF file').toString('base64'),
        }),
      });
      assert.equal(badBytesRes.status, 400);
      const badBytesBody = await badBytesRes.json();
      assert.ok(badBytesBody.error.message.includes('valid PDF'));
    });

    it('Allows uploading valid PDF with %PDF- magic bytes and registers document', async () => {
      // Valid minimal PDF bytes
      const validPdfBytes = Buffer.from(
        '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n185\n%%EOF'
      );

      const res = await fetch(`${baseUrl}/api/v1/student/documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${studentAToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: 'Sprint_3_Progress_Report.pdf',
          mimeType: 'application/pdf',
          contentBase64: validPdfBytes.toString('base64'),
        }),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.name, 'Sprint_3_Progress_Report.pdf');
      assert.equal(body.data.type, 'application/pdf');
    });
  });
});
