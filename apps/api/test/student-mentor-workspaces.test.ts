import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import type { Server } from 'node:http';

describe('InternOS: Student & Mentor Workspaces Integration Suite', () => {
  let server: Server;
  let baseUrl: string;
  let studentToken: string;
  let mentorToken: string;

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

    // 1. Authenticate Student (Alex Rivera @ Org A)
    const studentRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@org-a.com',
        password: 'Password123!',
        organizationCode: 'ORG_A',
      }),
    });
    const studentData = await studentRes.json();
    assert.equal(studentRes.status, 200);
    studentToken = studentData.data.token;

    // 2. Authenticate Mentor (Mark Mentor @ Org A)
    const mentorRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'mentor@org-a.com',
        password: 'Password123!',
        organizationCode: 'ORG_A',
      }),
    });
    const mentorData = await mentorRes.json();
    assert.equal(mentorRes.status, 200);
    mentorToken = mentorData.data.token;
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('1. Student Workspace APIs', () => {
    it('Student can fetch real aggregated dashboard metrics', async () => {
      const res = await fetch(`${baseUrl}/api/v1/student/dashboard`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.ok(data.data.studentName);
      assert.ok(data.data.outcomesSummary);
      assert.ok(Array.isArray(data.data.upcomingTasks));
      assert.ok(Array.isArray(data.data.recentSubmissions));
    });

    it('Student can fetch internship details with company and timeline', async () => {
      const res = await fetch(`${baseUrl}/api/v1/student/internship`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.ok(data.data.overview);
      assert.ok(data.data.company);
      assert.ok(data.data.mentor);
      assert.ok(Array.isArray(data.data.timeline));
    });

    it('Student can list milestones with completion progress', async () => {
      const res = await fetch(`${baseUrl}/api/v1/student/milestones`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(data.data));
      assert.ok(data.data.length > 0);
      assert.ok(data.data[0].id);
      assert.ok(data.data[0].title);
    });

    it('Student can list tasks and filter by status', async () => {
      const res = await fetch(`${baseUrl}/api/v1/student/tasks?status=ALL`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(data.data));
    });

    it('Student can submit actual evidence for an assigned task', async () => {
      // First get a pending task
      const tasksRes = await fetch(`${baseUrl}/api/v1/student/tasks`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const tasksData = await tasksRes.json();
      const pendingTask = tasksData.data[0];
      assert.ok(pendingTask, 'At least one task must exist');

      const submitRes = await fetch(`${baseUrl}/api/v1/student/tasks/${pendingTask.id}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          title: 'Automated CI/CD Pipeline Pull Request',
          description: 'Configured GitHub Actions workflow with lint and unit test stages.',
          evidenceType: 'GITHUB_PR',
          evidenceUrl: 'https://github.com/internos-org/demo-repo/pull/42',
          notes: 'Tested on staging environment successfully.',
        }),
      });
      const submitData = await submitRes.json();
      assert.equal(submitRes.status, 201);
      assert.equal(submitData.success, true);
      assert.equal(submitData.data.title, 'Automated CI/CD Pipeline Pull Request');
      assert.equal(submitData.data.status, 'SUBMITTED');
    });

    it('Student can view Outcome-Based Education (OBE) expected vs actual evidence', async () => {
      const res = await fetch(`${baseUrl}/api/v1/student/outcomes`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(data.data));
      assert.ok(data.data.length > 0);
      assert.ok(Array.isArray(data.data[0].expectedEvidence));
      assert.ok(Array.isArray(data.data[0].studentEvidence));
    });

    it('Student can view feedback ledger', async () => {
      const res = await fetch(`${baseUrl}/api/v1/student/feedback`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(data.data));
    });

    it('Student can fetch academic profile', async () => {
      const res = await fetch(`${baseUrl}/api/v1/student/profile`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.ok(data.data.rollNumber);
      assert.ok(data.data.department);
    });
  });

  describe('2. Mentor Workspace APIs', () => {
    it('Mentor can fetch aggregated dashboard metrics', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/dashboard`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.ok(data.data.stats);
      assert.ok(data.data.stats.assignedInterns >= 1);
      assert.ok(Array.isArray(data.data.interns));
    });

    it('Mentor can list assigned interns roster', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/interns`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(data.data));
      assert.ok(data.data.length > 0);
    });

    it('Mentor can fetch 7-tab comprehensive intern detail profile', async () => {
      // Fetch interns first
      const internsRes = await fetch(`${baseUrl}/api/v1/mentor/interns`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      const internsData = await internsRes.json();
      const firstIntern = internsData.data[0];

      const res = await fetch(`${baseUrl}/api/v1/mentor/interns/${firstIntern.studentId}`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.ok(data.data.student);
      assert.ok(data.data.internship);
      assert.ok(Array.isArray(data.data.milestones));
      assert.ok(Array.isArray(data.data.tasks));
      assert.ok(Array.isArray(data.data.submissions));
      assert.ok(Array.isArray(data.data.outcomes));
      assert.ok(Array.isArray(data.data.feedbacks));
      assert.ok(Array.isArray(data.data.documents));
    });

    it('Mentor can create a new Milestone for an internship', async () => {
      const internsRes = await fetch(`${baseUrl}/api/v1/mentor/interns`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      const internsData = await internsRes.json();
      const internshipId = internsData.data[0].internshipId;

      const res = await fetch(`${baseUrl}/api/v1/mentor/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mentorToken}`,
        },
        body: JSON.stringify({
          internshipId,
          title: 'Kubernetes Production Readiness',
          description: 'Deploy helm charts and verify auto-scaling policies.',
          order: 3,
          dueDate: '2026-10-15',
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 201);
      assert.equal(data.success, true);
      assert.equal(data.data.title, 'Kubernetes Production Readiness');
    });

    it('Mentor can create a Task linked to milestone and define Expected Evidence', async () => {
      const internsRes = await fetch(`${baseUrl}/api/v1/mentor/interns`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      const internsData = await internsRes.json();
      const internshipId = internsData.data[0].internshipId;

      const res = await fetch(`${baseUrl}/api/v1/mentor/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mentorToken}`,
        },
        body: JSON.stringify({
          internshipId,
          title: 'Configure Prometheus and Grafana Alerting',
          description: 'Implement alertmanager rules for high CPU and 5xx errors.',
          priority: 'HIGH',
          dueDate: '2026-10-10',
          expectedEvidence: 'Grafana dashboard snapshot and alert rule definitions in Git',
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 201);
      assert.equal(data.success, true);
      assert.equal(data.data.title, 'Configure Prometheus and Grafana Alerting');
      assert.equal(data.data.expectedEvidence, 'Grafana dashboard snapshot and alert rule definitions in Git');
    });

    it('Mentor can inspect review queue and accept submitted deliverable evidence', async () => {
      const subsRes = await fetch(`${baseUrl}/api/v1/mentor/submissions`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      const subsData = await subsRes.json();
      assert.equal(subsRes.status, 200);
      assert.ok(Array.isArray(subsData.data));
      assert.ok(subsData.data.length > 0);

      const targetSub = subsData.data[0];

      const reviewRes = await fetch(`${baseUrl}/api/v1/mentor/submissions/${targetSub.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mentorToken}`,
        },
        body: JSON.stringify({
          status: 'ACCEPTED',
          rating: 5,
          score: 5,
          feedback: 'Excellent test coverage and clean architectural abstraction.',
          strengths: 'Modular code and comprehensive documentation',
          improvements: 'Consider adding tracing headers in future iterations',
          nextAction: 'Proceed to Milestone 2 deliverables',
        }),
      });
      const reviewData = await reviewRes.json();
      assert.equal(reviewRes.status, 200);
      assert.equal(reviewData.success, true);
      assert.equal(reviewData.data.status, 'ACCEPTED');
      assert.equal(reviewData.data.mentorRating, 5);
    });

    it('Mentor can fetch feedback ledger and documents repository', async () => {
      const fbRes = await fetch(`${baseUrl}/api/v1/mentor/feedback`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      const fbData = await fbRes.json();
      assert.equal(fbRes.status, 200);
      assert.ok(Array.isArray(fbData.data));

      const docRes = await fetch(`${baseUrl}/api/v1/mentor/documents`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      const docData = await docRes.json();
      assert.equal(docRes.status, 200);
      assert.ok(Array.isArray(docData.data));
    });
  });

  describe('3. Security & Boundary Protections', () => {
    it('Student is strictly forbidden from creating milestones or reviewing submissions (403)', async () => {
      const milestoneRes = await fetch(`${baseUrl}/api/v1/mentor/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          internshipId: 'internship-a-1',
          title: 'Unauthorized Milestone',
          dueDate: '2026-10-01',
        }),
      });
      assert.equal(milestoneRes.status, 403);

      const reviewRes = await fetch(`${baseUrl}/api/v1/mentor/submissions/sub-101/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          status: 'ACCEPTED',
          feedback: 'Unauthorized review',
        }),
      });
      assert.equal(reviewRes.status, 403);
    });

    it('Unauthenticated requests are rejected with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/v1/student/dashboard`);
      assert.equal(res.status, 401);

      const mentorRes = await fetch(`${baseUrl}/api/v1/mentor/dashboard`);
      assert.equal(mentorRes.status, 401);
    });
  });
});
