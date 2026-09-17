import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { app } from '../src/app.js';
import {
  InternshipStatus,
  TaskStatus,
  SubmissionStatus,
  OutcomeStatus,
} from '@internos/types';

describe('InternOS Phase 5: Role-Specific Internship Workspaces Suite', () => {
  let server: Server;
  let baseUrl: string;

  // Tokens for ORG_A
  let _tokenAdminA: string;
  let tokenHodA: string;
  let tokenFacultyA: string;
  let tokenStudentA: string;
  let tokenMentorA: string;

  // Tokens for ORG_B
  let tokenStudentB: string;
  let tokenMentorB: string;

  // Tracked IDs
  let studentAId: string;
  let facultyAId: string;
  let mentorAId: string;
  let createdInternshipId: string;
  let generatedTaskId: string;
  let createdSubmissionId: string;

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
    _tokenAdminA = dataAdminA.data.token;

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
    facultyAId = dataFacultyA.data.user.id;

    // Login Student Org A
    const resStudentA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataStudentA = await resStudentA.json();
    tokenStudentA = dataStudentA.data.token;
    studentAId = dataStudentA.data.user.id;

    // Login Mentor Org A
    const resMentorA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'mentor@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataMentorA = await resMentorA.json();
    tokenMentorA = dataMentorA.data.token;
    mentorAId = dataMentorA.data.user.id;

    // Login Student Org B
    const resStudentB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-b.com', password: 'Password123!', organizationCode: 'ORG_B' }),
    });
    const dataStudentB = await resStudentB.json();
    tokenStudentB = dataStudentB.data.token;

    // Login Mentor Org B
    const resMentorB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'mentor@org-b.com', password: 'Password123!', organizationCode: 'ORG_B' }),
    });
    const dataMentorB = await resMentorB.json();
    tokenMentorB = dataMentorB.data.token;

    // Create an internship in ORG_A for student A
    const resCreateInternship = await fetch(`${baseUrl}/api/v1/internships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        title: 'Fullstack Research Engineer Intern',
        role: 'Fullstack Research Engineer Intern',
        internshipType: 'FULL_TIME',
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-11-30T00:00:00.000Z',
        description: 'Building microservices and role-specific workspace frontends.',
        newCompany: {
          name: 'CloudScale AI Technologies',
          industry: 'Cloud Infrastructure',
          website: 'https://cloudscale.ai',
          address: '100 Innovation Way, San Francisco, CA',
        },
        mentor: {
          name: 'Mentor Org A',
          email: 'mentor@org-a.com',
          designation: 'Staff Research Engineer',
        },
        expectedOutcomes: [
          {
            title: 'Cloud Native Microservices Architecture',
            description: 'Design and deploy robust REST and gRPC services',
            expectedEvidence: 'Repository architecture RFC and pull request links',
          },
          {
            title: 'CI/CD Automated Deployment Pipelines',
            description: 'Automate build, test, and container packaging',
            expectedEvidence: 'Passing GitHub actions pipeline runs and metrics',
          },
        ],
      }),
    });
    const dataCreated = await resCreateInternship.json();
    assert.equal(resCreateInternship.status, 201);
    createdInternshipId = dataCreated.data.id;

    // Student submits for approval
    const resSub = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenStudentA}`,
      },
    });
    assert.equal(resSub.status, 200);

    // HOD approves internship
    const resApprove = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenHodA}`,
      },
      body: JSON.stringify({
        approved: true,
        reason: 'Pre-internship qualifications validated.',
      }),
    });
    assert.equal(resApprove.status, 200);

    // Assign faculty
    const resAssignFac = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/assign-faculty`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenHodA}`,
      },
      body: JSON.stringify({
        facultyId: facultyAId,
        facultyName: 'Dr. Ada Lovelace',
      }),
    });
    assert.equal(resAssignFac.status, 200);

    // Assign mentor
    const resAssignMen = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/assign-mentor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenHodA}`,
      },
      body: JSON.stringify({
        mentorId: mentorAId,
        mentorName: 'Mentor Org A',
        mentorEmail: 'mentor@org-a.com',
        designation: 'Staff Research Engineer',
      }),
    });
    assert.equal(resAssignMen.status, 200);

    // Transition to ACTIVE
    const resActive = await fetch(`${baseUrl}/api/v1/internships/${createdInternshipId}/transition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenFacultyA}`,
      },
      body: JSON.stringify({
        targetStatus: InternshipStatus.ACTIVE,
        reason: 'Internship started officially.',
      }),
    });
    assert.equal(resActive.status, 200);
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('1. Student Workspace Dashboard & Deliverable Submissions', () => {
    it('should return complete student workspace dashboard with tasks and progress', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workspaces/student/dashboard`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.data.internship.studentId, studentAId);
      assert.equal(data.data.internship.id, createdInternshipId);
      assert.equal(data.data.internship.status, InternshipStatus.ACTIVE);
      assert.ok(Array.isArray(data.data.currentTasks));
      assert.ok(data.data.currentTasks.length > 0);
      assert.equal(data.data.outcomeProgress.total, 2);

      // Save a generated taskId for submission tests
      generatedTaskId = data.data.currentTasks[0].id;
    });

    it('should allow student to submit work linked to an internship task with evidence upload', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workspaces/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          internshipId: createdInternshipId,
          taskId: generatedTaskId,
          title: 'Weekly Sprint 1 Architecture Deliverable',
          content: 'Designed core domain models and implemented initial repository pattern.',
          evidenceUrls: ['https://storage.internos.acme.edu/evidence/sprint1-arch.pdf'],
          notes: 'Looking forward to mentor code review and architecture feedback.',
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.data.internshipId, createdInternshipId);
      assert.equal(data.data.status, SubmissionStatus.SUBMITTED);
      assert.equal(data.data.evidenceUrls[0], 'https://storage.internos.acme.edu/evidence/sprint1-arch.pdf');
      createdSubmissionId = data.data.id;
    });

    it('should show the submission when student retrieves submission list', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workspaces/submissions?internshipId=${createdInternshipId}`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.data));
      assert.ok(data.data.some((s: any) => s.id === createdSubmissionId));
    });
  });

  describe('2. Mentor Workspace, Review & Revision Workflow', () => {
    it('should return mentor dashboard showing assigned students and pending reviews', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workspaces/mentor/dashboard`, {
        headers: { Authorization: `Bearer ${tokenMentorA}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.data.assignedStudents));
      assert.ok(data.data.assignedStudents.length >= 1);
      assert.ok(data.data.assignedStudents.some((s: any) => s.studentId === studentAId));
      assert.ok(data.data.recentSubmissions.some((s: any) => s.id === createdSubmissionId));
    });

    it('should allow mentor to review submission and request revision', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workspaces/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenMentorA}`,
        },
        body: JSON.stringify({
          submissionId: createdSubmissionId,
          score: 65,
          feedback: 'Please include detailed UML class diagrams and error handling specs.',
          requestRevision: true,
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.data.submissionId, createdSubmissionId);
      assert.equal(data.data.reviewerId, mentorAId);
      assert.equal(data.data.score, 65);
    });

    it('should reflect REVISION_NEEDED in student dashboard and task status', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workspaces/student/dashboard`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.data.recentFeedback.length > 0);
      assert.ok(data.data.recentFeedback.some((f: any) => f.submissionId === createdSubmissionId && f.score === 65));

      // Verify task status transitioned to CHANGES_REQUESTED
      const updatedTask = data.data.currentTasks.find((t: any) => t.id === generatedTaskId);
      if (updatedTask) {
        assert.equal(updatedTask.status, TaskStatus.CHANGES_REQUESTED);
      }
    });

    it('should allow student to submit revised work and mentor to approve it', async () => {
      // Student resubmits
      const resResubmit = await fetch(`${baseUrl}/api/v1/workspaces/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          internshipId: createdInternshipId,
          taskId: generatedTaskId,
          title: 'Revised Sprint 1 Deliverable with UML Diagrams',
          description: 'Updated architecture specs with C4 and UML diagrams as requested.',
          evidenceUrls: [
            'https://storage.internos.acme.edu/evidence/sprint1-arch-revised.pdf',
            'https://storage.internos.acme.edu/evidence/c4-model.png',
          ],
        }),
      });
      assert.equal(resResubmit.status, 201);
      const dataResubmit = await resResubmit.json();
      const resubmissionId = dataResubmit.data.id;

      // Mentor approves revised submission
      const resApprove = await fetch(`${baseUrl}/api/v1/workspaces/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenMentorA}`,
        },
        body: JSON.stringify({
          submissionId: resubmissionId,
          score: 95,
          feedback: 'Outstanding revision. Architecture diagrams are comprehensive and sound.',
          requestRevision: false,
        }),
      });
      assert.equal(resApprove.status, 201);
    });
  });

  describe('3. Outcome Management & Historical Version Snapshots', () => {
    it('should allow mentor to modify outcomes creating an OutcomeVersion snapshot', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workspaces/internships/${createdInternshipId}/outcomes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenMentorA}`,
        },
        body: JSON.stringify({
          outcomes: [
            {
              id: 'outcome-1',
              title: 'Cloud Native Microservices Architecture',
              description: 'Design and deploy robust REST and gRPC services',
              expectedEvidence: 'Repository architecture RFC and pull request links',
              status: OutcomeStatus.COMPLETED,
            },
            {
              id: 'outcome-2',
              title: 'CI/CD Automated Deployment Pipelines',
              description: 'Automate build, test, and container packaging',
              expectedEvidence: 'Passing GitHub actions pipeline runs and metrics',
              status: OutcomeStatus.IN_PROGRESS,
            },
            {
              title: 'Distributed Tracing & OpenTelemetry',
              description: 'Implement distributed tracing across microservices',
              expectedEvidence: 'Jaeger trace dashboards and latency metrics',
              status: OutcomeStatus.NOT_STARTED,
            },
          ],
          changeReason: 'Added distributed tracing requirement to align with Q3 team deliverables',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.data.outcomeVersion, 2);
      assert.equal(data.data.expectedOutcomes.length, 3);
    });

    it('should retrieve full immutable outcome version history for the internship', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workspaces/internships/${createdInternshipId}/outcomes/history`, {
        headers: { Authorization: `Bearer ${tokenMentorA}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.data));
      assert.ok(data.data.length >= 2);
      // Historical versions are preserved
      assert.ok(data.data.some((v: any) => v.versionNumber === 1));
      assert.ok(data.data.some((v: any) => v.versionNumber === 2));
    });
  });

  describe('4. Mentor Concerns, Attention Cases & Faculty Workspace', () => {
    it('should allow mentor to raise a high-severity student concern', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workspaces/internships/${createdInternshipId}/concerns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenMentorA}`,
        },
        body: JSON.stringify({
          severity: 'HIGH',
          category: 'PERFORMANCE',
          description: 'Student missed two daily sync standups without advance notice.',
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.data.severity, 'HIGH');
      assert.equal(data.data.internshipId, createdInternshipId);
    });

    it('should display the raised concern in faculty workspace attention cases', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workspaces/faculty/dashboard`, {
        headers: { Authorization: `Bearer ${tokenFacultyA}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.data.assignedInternships.some((i: any) => i.id === createdInternshipId));
      assert.ok(data.data.activeInternshipsCount >= 1);
      assert.ok(Array.isArray(data.data.attentionCases));
      assert.ok(
        data.data.attentionCases.some(
          (c: any) => c.internshipId === createdInternshipId
        )
      );
    });
  });

  describe('5. HOD Workspace & Department Monitoring', () => {
    it('should return department monitoring statistics and faculty assignment matrix', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workspaces/hod/dashboard`, {
        headers: { Authorization: `Bearer ${tokenHodA}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.data.departmentMonitoring);
      assert.ok(data.data.departmentMonitoring.totalStudents >= 1);
      assert.ok(data.data.departmentMonitoring.active >= 1);
      assert.ok(Array.isArray(data.data.facultyAssignments));
      assert.ok(
        data.data.facultyAssignments.some((f: any) => f.facultyId === facultyAId && f.assignedCount >= 1)
      );
      assert.ok(Array.isArray(data.data.attentionCases));
    });
  });

  describe('6. Mentor Formal Evaluation & Termination Request', () => {
    it('should allow mentor to perform final evaluation with grades and recommendations', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workspaces/internships/${createdInternshipId}/evaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenMentorA}`,
        },
        body: JSON.stringify({
          overallScore: 92,
          technicalSkillsScore: 94,
          softSkillsScore: 90,
          strengths: 'Fast learner, grasps distributed systems concepts rapidly, high quality PRs.',
          areasForImprovement: 'Improve communication frequency during standups.',
          recommendation: 'STRONG_HIRE',
          generalComments: 'Would gladly mentor this student again or welcome to full-time team.',
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.data.rubricScores.overallScore, 92);
      assert.equal(data.data.finalGrade, 'STRONG_HIRE');
    });

    it('should allow retrieving evaluations for the internship', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workspaces/internships/${createdInternshipId}/evaluations`, {
        headers: { Authorization: `Bearer ${tokenMentorA}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.data));
      assert.ok(data.data.length >= 1);
    });

    it('should allow mentor to submit a formal termination request', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workspaces/internships/${createdInternshipId}/termination-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenMentorA}`,
        },
        body: JSON.stringify({
          reason: 'Simulated termination request for test verification',
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
    });
  });

  describe('7. Multi-Tenant & Role Authorization Boundaries', () => {
    it('should reject student from Org B attempting to submit to Org A internship (404/403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workspaces/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentB}`,
        },
        body: JSON.stringify({
          internshipId: createdInternshipId,
          taskId: generatedTaskId,
          title: 'Cross-tenant illegal submission',
          description: 'Hacking across tenant boundaries',
        }),
      });
      assert.ok(res.status === 403 || res.status === 404);
    });

    it('should forbid student from performing mentor reviews (403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workspaces/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          submissionId: createdSubmissionId,
          score: 100,
          feedback: 'Self-review should be rejected.',
        }),
      });
      assert.equal(res.status, 403);
    });

    it('should forbid student from raising mentor concerns (403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workspaces/internships/${createdInternshipId}/concerns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          severity: 'HIGH',
          description: 'Student attempting mentor action',
        }),
      });
      assert.equal(res.status, 403);
    });

    it('should isolate Org B mentor dashboard from Org A records', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workspaces/mentor/dashboard`, {
        headers: { Authorization: `Bearer ${tokenMentorB}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      // Should not see Org A's student or submissions
      assert.ok(!data.data.recentSubmissions.some((s: any) => s.id === createdSubmissionId));
    });
  });
});
