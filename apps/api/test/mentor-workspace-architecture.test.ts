import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import type { Server } from 'node:http';

describe('InternOS: Mentor Workspace Architecture & Data Isolation Suite', () => {
  let server: Server;
  let baseUrl: string;
  let mentorToken: string;
  let studentToken: string;

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

    // 1. Login as Mark Mentor (Org A)
    const mentorRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'mentor@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const mentorJson = (await mentorRes.json()) as any;
    assert.equal(mentorRes.status, 200);
    mentorToken = mentorJson.data.token;

    // 2. Login as Sam Student (Org A)
    const studentRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const studentJson = (await studentRes.json()) as any;
    assert.equal(studentRes.status, 200);
    studentToken = studentJson.data.token;
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('1. Mentor Overview & People-Centric Interns Roster', () => {
    it('Mentor dashboard aggregates metrics for supervised interns', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/dashboard`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      assert.equal(json.success, true);
      const data = json.data;
      assert.ok(data.stats.assignedInterns >= 2, 'Should have at least 2 supervised interns');
      assert.ok(data.interns.some((i: any) => i.studentName.includes('Sam')), 'Must include Sam Student');
      assert.ok(data.interns.some((i: any) => i.studentName.includes('David')), 'Must include David Chen');
    });

    it('My Interns list returns people-centric roster with student entities', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/interns`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      const interns = json.data;
      const sam = interns.find((i: any) => i.studentId === 'user-a-student');
      const david = interns.find((i: any) => i.studentId === 'user-a-student-3');

      assert.ok(sam, 'Sam Student must be in interns list');
      assert.equal(sam.studentName, 'Sam Student');
      assert.equal(sam.internshipTitle, 'Full Stack Engineering Internship');

      assert.ok(david, 'David Chen must be in interns list');
      assert.equal(david.studentName, 'David Chen');
      assert.equal(david.internshipTitle, 'Cloud Infrastructure & DevOps Internship');
      assert.equal(david.progress, 80, 'David progress should be 80%');
    });
  });

  describe('2. Critical Data Isolation: Sam Student vs. David Chen', () => {
    it('Sam Student detail profile contains only Sam data without leaking David data', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/interns/user-a-student`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      const data = json.data;

      assert.equal(data.student.id, 'user-a-student');
      assert.equal(data.student.name, 'Sam Student');
      assert.equal(data.internship.companyName, 'Google Cloud Solutions');

      // Verify Sam has tasks task-101 to task-105
      const taskIds = data.tasks.map((t: any) => t.id);
      assert.ok(taskIds.includes('task-102'), 'Sam must have task-102');
      assert.ok(!taskIds.includes('task-301'), 'Sam must NOT have David task-301');

      // Verify Sam has submissions sub-101, sub-103, sub-104, sub-105
      const subIds = data.submissions.map((s: any) => s.id);
      assert.ok(subIds.includes('sub-103'), 'Sam must have sub-103');
      assert.ok(!subIds.includes('sub-301'), 'Sam must NOT have David sub-301');
    });

    it('David Chen detail profile contains only David data without leaking Sam data', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/interns/user-a-student-3`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      const data = json.data;

      assert.equal(data.student.id, 'user-a-student-3');
      assert.equal(data.student.name, 'David Chen');
      assert.equal(data.internship.companyName, 'Amazon Web Systems');

      // Verify David has tasks task-301 to task-305
      const taskIds = data.tasks.map((t: any) => t.id);
      assert.ok(taskIds.includes('task-301'), 'David must have task-301');
      assert.ok(!taskIds.includes('task-102'), 'David must NOT have Sam task-102');

      // Verify David has submissions sub-301 to sub-304
      const subIds = data.submissions.map((s: any) => s.id);
      assert.ok(subIds.includes('sub-301'), 'David must have sub-301');
      assert.ok(!subIds.includes('sub-103'), 'David must NOT have Sam sub-103');
    });
  });

  describe('3. Milestones Context & Detail Management', () => {
    it('Milestones listing displays student and internship context', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/milestones`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      const milestones = json.data;
      assert.ok(milestones.length >= 4, 'Should list milestones for supervised interns');

      milestones.forEach((m: any) => {
        assert.ok(m.studentName, 'Each milestone must identify its student');
        assert.ok(m.internshipTitle, 'Each milestone must identify its internship');
        assert.ok(m.companyName, 'Each milestone must identify its company');
      });
    });

    it('Get milestone detail by ID returns full metadata and task list', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/milestones/ms-2`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      const m = json.data;
      assert.equal(m.id, 'ms-2');
      assert.equal(m.title, 'Backend API Development');
      assert.equal(m.studentName, 'Sam Student');
      assert.ok(Array.isArray(m.tasks), 'Milestone must include tasks array');
      assert.ok(m.tasks.length >= 3, 'Milestone ms-2 should have at least 3 tasks');
    });

    it('Mentor can create a new milestone with validation', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/milestones`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mentorToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          internshipId: 'internship-a-1',
          title: 'Performance Tuning & Load Testing',
          description: 'Benchmark database query latency and integrate Redis caching.',
          dueDate: '2026-11-20',
          order: 4,
        }),
      });

      assert.equal(res.status, 201);
      const json = (await res.json()) as any;
      assert.equal(json.data.title, 'Performance Tuning & Load Testing');
      assert.equal(json.data.studentName, 'Sam Student');
    });
  });

  describe('4. Tasks Assignment & Ownership Context', () => {
    it('Tasks listing returns student, internship, and submission status', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/tasks`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      const tasks = json.data;
      assert.ok(tasks.length >= 5);

      tasks.forEach((t: any) => {
        assert.ok(t.studentName, 'Task must identify the assigned student');
        assert.ok(t.internshipTitle, 'Task must identify the internship');
        assert.ok(t.submissionStatus, 'Task must have a human-readable submission status');
      });
    });

    it('Get task detail by ID returns instructions and expected evidence', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/tasks/task-102`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      const t = json.data;
      assert.equal(t.id, 'task-102');
      assert.equal(t.title, 'Authentication API');
      assert.ok(t.expectedEvidence.includes('GitHub PR'));
    });

    it('Mentor can assign a new task to an intern', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/tasks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mentorToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          internshipId: 'internship-a-1',
          milestoneId: 'ms-2',
          title: 'GraphQL API Gateway Exploration',
          description: 'Explore GraphQL query resolvers for client dashboard data aggregation.',
          instructions: 'Implement Apollo Server route with schema stitching.',
          priority: 'MEDIUM',
          dueDate: '2026-09-30',
          learningOutcomeId: 'out-api-dev',
          expectedEvidence: 'GitHub Repository link with GraphQL playground examples',
        }),
      });

      assert.equal(res.status, 201);
      const json = (await res.json()) as any;
      assert.equal(json.data.title, 'GraphQL API Gateway Exploration');
      assert.equal(json.data.studentName, 'Sam Student');
    });
  });

  describe('5. Submissions Queue & Review Lifecycle', () => {
    it('Submissions queue clearly identifies student, internship, milestone, and task', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/submissions`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      const subs = json.data;
      assert.ok(subs.length > 0);

      subs.forEach((s: any) => {
        assert.ok(s.studentName, 'Submission must identify the student');
        assert.ok(s.internshipTitle, 'Submission must identify the internship');
        assert.ok(s.taskTitle, 'Submission must identify the task');
      });
    });

    it('Get submission by ID returns evidence artifacts and mentor feedback', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/submissions/sub-104`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      const s = json.data;
      assert.equal(s.id, 'sub-104');
      assert.ok(s.evidenceUrl, 'Should have evidence link');
      assert.ok(s.mentorFeedback, 'Should have mentor feedback');
    });

    it('Mentor accepts evidence: updates submission to ACCEPTED and task to APPROVED', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/submissions/sub-103/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mentorToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: 'Verified schema migrations and multi-tenant isolation unit tests. Approved.',
          rating: 5,
        }),
      });

      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      assert.equal(json.data.status, 'ACCEPTED');

      // Verify task status is now APPROVED
      const taskRes = await fetch(`${baseUrl}/api/v1/mentor/tasks/task-103`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      const taskJson = (await taskRes.json()) as any;
      assert.equal(taskJson.data.status, 'APPROVED');
    });

    it('Mentor requests revision: updates submission to REVISION_NEEDED and task to CHANGES_REQUESTED', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/submissions/sub-103/request-revision`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mentorToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: 'Please add database constraint tests for cross-tenant injection vectors.',
          revisionReason: 'Missing negative security test assertions.',
        }),
      });

      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      assert.equal(json.data.status, 'REVISION_NEEDED');

      // Verify task status is now CHANGES_REQUESTED
      const taskRes = await fetch(`${baseUrl}/api/v1/mentor/tasks/task-103`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      const taskJson = (await taskRes.json()) as any;
      assert.equal(taskJson.data.status, 'CHANGES_REQUESTED');
    });
  });

  describe('6. Learning Outcomes & Server-Side Filtering', () => {
    it('Learning outcomes list returns separate cards per student with student and company attribution', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/outcomes`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      const outcomes = json.data;
      assert.ok(outcomes.length >= 4, 'Should list outcomes for all supervised students');

      outcomes.forEach((o: any) => {
        assert.ok(o.studentName, 'Outcome card must identify student');
        assert.ok(o.internshipTitle, 'Outcome card must identify internship');
        assert.ok(o.companyName, 'Outcome card must identify company');
        assert.ok(Array.isArray(o.expectedEvidence), 'Must have expectedEvidence array');
        assert.ok(Array.isArray(o.studentEvidence), 'Must have studentEvidence array');
      });
    });

    it('Filters outcomes by studentId: ?studentId=user-a-student', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/outcomes?studentId=user-a-student`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      const outcomes = json.data;
      assert.ok(outcomes.length > 0);
      outcomes.forEach((o: any) => {
        assert.equal(o.studentId, 'user-a-student', 'All returned outcomes must belong to Sam Student');
      });
    });

    it('Filters outcomes by studentId: ?studentId=user-a-student-3 (David Chen)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/outcomes?studentId=user-a-student-3`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      const outcomes = json.data;
      assert.ok(outcomes.length > 0);
      outcomes.forEach((o: any) => {
        assert.equal(o.studentId, 'user-a-student-3', 'All returned outcomes must belong to David Chen');
        assert.equal(o.companyName, 'Amazon Web Systems');
      });
    });

    it('Filters outcomes by search keyword', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/outcomes?search=REST`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      const outcomes = json.data;
      assert.ok(outcomes.length > 0);
      outcomes.forEach((o: any) => {
        const text = `${o.name} ${o.code} ${o.description}`.toLowerCase();
        assert.ok(text.includes('rest'));
      });
    });
  });

  describe('7. Internship Registrations Review Workflow', () => {
    it('Mentor can list internship registrations requiring review', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/registrations`, {
        headers: { Authorization: `Bearer ${mentorToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      const registrations = json.data;
      assert.ok(Array.isArray(registrations));
      assert.ok(registrations.length > 0, 'Should have registrations for review');

      const reg = registrations[0];
      assert.ok(reg.studentName);
      assert.ok(reg.title);
      assert.ok(reg.companyName);
      assert.ok(reg.status);
    });

    it('Mentor can approve an internship registration', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/registrations/internship-reg-1/review`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mentorToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decision: 'APPROVE', comments: 'Registration verified with industry offer letter.' }),
      });

      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      assert.equal(json.data.status, 'ACTIVE');
    });
  });

  describe('8. Security & RBAC Enforcement', () => {
    it('Student cannot access mentor endpoints (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/dashboard`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert.equal(res.status, 403, 'Student should be forbidden from accessing mentor routes');
    });

    it('Unauthenticated requests are rejected (401 Unauthorized)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/mentor/dashboard`);
      assert.equal(res.status, 401);
    });
  });
});
