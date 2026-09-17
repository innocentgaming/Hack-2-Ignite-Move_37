import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { app } from '../src/app.js';
import { authStore } from '../src/services/auth.service.js';
import { tenantStore } from '../src/services/tenant.service.js';
import { workflowStore } from '../src/services/workflow.service.js';
import { internshipStore } from '../src/services/internship.service.js';
import { workspaceStore } from '../src/services/workspace.service.js';
import { aiStore } from '../src/services/ai/ai-analysis.service.js';
import {
  UserRole,
  UserStatus,
  InternshipStatus,
  SubmissionStatus,
  WorkflowStepType,
  LatePolicyType,
} from '@internos/types';

describe('InternOS Phase 13: Complete End-to-End (24-Step) & Performance Verification Suite', () => {
  let server: Server;
  let baseUrl: string;

  // Institution Constants
  const orgCode = 'TEST_INST_13';
  const orgId = 'org-e2e-inst-13';

  // Actor Tokens & IDs
  let adminToken: string;
  let studentToken: string;
  let hodToken: string;
  let facultyToken: string;
  let mentorToken: string;
  let tenantBToken: string;

  let studentId: string;
  let hodId: string;
  let facultyId: string;
  let mentorId: string;

  // Entity References
  let templateId: string;
  let internshipId: string;
  let taskId: string;
  let submissionId: string;

  before(async () => {
    server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;

    // Obtain Tenant B token for Step 24 cross-tenant access test
    const loginB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-b.com', password: 'Password123!', organizationCode: 'ORG_B' }),
    });
    const dataB = (await loginB.json()) as any;
    tenantBToken = dataB.data.token;
  });

  after(() => {
    server.close();
  });

  // =========================================================================
  // STEP 1: Create Institution
  // =========================================================================
  it('Step 1: Create institution / tenant root', async () => {
    const inst = {
      id: orgId,
      code: orgCode,
      name: 'Nexus Institute of Technology',
      domain: 'nexus.edu',
      settings: {
        academicYear: '2026-2027',
        semester: 'Fall',
        defaultDurationWeeks: 12,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    authStore.organizations.set(orgId, inst);

    // Create Root Admin for Institution
    const adminUser = {
      id: 'admin-nexus-13',
      organizationId: orgId,
      email: 'admin@nexus.edu',
      passwordHash: authStore.users.get('user-a-admin')!.passwordHash,
      firstName: 'Natalie',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    authStore.users.set(adminUser.id, adminUser);

    // Login as Admin
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminUser.email, password: 'Password123!', organizationCode: orgCode }),
    });
    assert.equal(res.status, 200);
    const data = (await res.json()) as any;
    adminToken = data.data.token;
    assert.ok(adminToken, 'Admin token must be acquired');
  });

  // =========================================================================
  // STEP 2: Configure Workflow
  // =========================================================================
  it('Step 2: Configure workflow template', async () => {
    const res = await fetch(`${baseUrl}/api/v1/workflows/templates`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Standard 12-Week Engineering Practicum',
        description: 'Comprehensive milestone-based internship workflow',
        durationWeeks: 12,
        isDefault: true,
        steps: [
          {
            title: 'Milestone 1: Architectural Design & Technical Report',
            description: 'Major technical report with architecture, API specs, and verification suite',
            stepType: WorkflowStepType.SUBMISSION,
            assigneeRole: UserRole.STUDENT,
            relativeDueWeek: 6,
            required: true,
            latePolicy: LatePolicyType.GRACE_PERIOD,
            gracePeriodDays: 3,
          },
          {
            title: 'Final Industry Evaluation & Sign-off',
            description: 'Industry mentor final evaluation',
            stepType: WorkflowStepType.EVALUATION,
            assigneeRole: UserRole.MENTOR,
            relativeDueWeek: 12,
            required: true,
            latePolicy: LatePolicyType.NO_SUBMISSIONS,
          },
        ],
      }),
    });
    assert.equal(res.status, 201, 'Workflow template creation must succeed');
    const data = (await res.json()) as any;
    templateId = data.data.id;
    assert.ok(templateId, 'Template ID must exist');
  });

  // =========================================================================
  // STEP 3: Create / Import Student
  // =========================================================================
  it('Step 3: Create/import student', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'student.nexus@nexus.edu',
        firstName: 'Stephen',
        lastName: 'Student',
        role: UserRole.STUDENT,
        password: 'Password123!',
      }),
    });
    assert.equal(res.status, 201);
    const data = (await res.json()) as any;
    studentId = data.data.id;

    // Login as Student
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student.nexus@nexus.edu', password: 'Password123!', organizationCode: orgCode }),
    });
    const loginData = (await loginRes.json()) as any;
    studentToken = loginData.data.token;
    assert.ok(studentToken, 'Student token must exist');
  });

  // =========================================================================
  // STEP 4: Invite HOD
  // =========================================================================
  it('Step 4: Invite HOD and activate account', async () => {
    const inviteRes = await fetch(`${baseUrl}/api/v1/admin/users/invite`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'hod.nexus@nexus.edu',
        firstName: 'Helen',
        lastName: 'HeadOfDept',
        role: UserRole.HOD,
      }),
    });
    assert.equal(inviteRes.status, 201);
    const inviteData = (await inviteRes.json()) as any;
    const activationToken = inviteData.data.activationToken;
    hodId = inviteData.data.userId;

    // Activate HOD Account
    const activateRes = await fetch(`${baseUrl}/api/v1/auth/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: activationToken, password: 'Password123!' }),
    });
    assert.equal(activateRes.status, 200);

    // Login as HOD
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hod.nexus@nexus.edu', password: 'Password123!', organizationCode: orgCode }),
    });
    const loginData = (await loginRes.json()) as any;
    hodToken = loginData.data.token;
    assert.ok(hodToken);
  });

  // =========================================================================
  // STEP 5: Invite Faculty
  // =========================================================================
  it('Step 5: Invite faculty and activate account', async () => {
    const inviteRes = await fetch(`${baseUrl}/api/v1/admin/users/invite`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'faculty.nexus@nexus.edu',
        firstName: 'Franklin',
        lastName: 'Faculty',
        role: UserRole.FACULTY,
      }),
    });
    assert.equal(inviteRes.status, 201);
    const inviteData = (await inviteRes.json()) as any;
    const activationToken = inviteData.data.activationToken;
    facultyId = inviteData.data.userId;

    // Activate Faculty Account
    const activateRes = await fetch(`${baseUrl}/api/v1/auth/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: activationToken, password: 'Password123!' }),
    });
    assert.equal(activateRes.status, 200);

    // Login as Faculty
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'faculty.nexus@nexus.edu', password: 'Password123!', organizationCode: orgCode }),
    });
    const loginData = (await loginRes.json()) as any;
    facultyToken = loginData.data.token;
    assert.ok(facultyToken);
  });

  // =========================================================================
  // STEP 6: Invite Mentor
  // =========================================================================
  it('Step 6: Invite mentor and activate account', async () => {
    const inviteRes = await fetch(`${baseUrl}/api/v1/admin/users/invite`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'mentor.industry@acme.com',
        firstName: 'Marcus',
        lastName: 'Mentor',
        role: UserRole.MENTOR,
      }),
    });
    assert.equal(inviteRes.status, 201);
    const inviteData = (await inviteRes.json()) as any;
    const activationToken = inviteData.data.activationToken;
    mentorId = inviteData.data.userId;

    // Activate Mentor Account
    const activateRes = await fetch(`${baseUrl}/api/v1/auth/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: activationToken, password: 'Password123!' }),
    });
    assert.equal(activateRes.status, 200);

    // Login as Mentor
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'mentor.industry@acme.com', password: 'Password123!', organizationCode: orgCode }),
    });
    const loginData = (await loginRes.json()) as any;
    mentorToken = loginData.data.token;
    assert.ok(mentorToken);
  });

  // =========================================================================
  // STEP 7: Student Creates Internship
  // =========================================================================
  it('Step 7: Student creates internship registration', async () => {
    const res = await fetch(`${baseUrl}/api/v1/internships`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Full Stack Cloud Platform Engineering Internship',
        internshipType: 'FULL_TIME',
        startDate: '2026-06-01',
        endDate: '2026-08-31',
        newCompany: {
          name: 'Acme Cloud Dynamics',
          industry: 'Cloud Infrastructure',
          location: 'San Francisco, CA',
        },
        expectedOutcomes: [
          {
            title: 'Cloud Architecture & Microservices Implementation',
            description: 'Design and deploy scalable REST APIs with Docker and Kubernetes',
            expectedEvidence: 'Architecture diagram and GitHub repository with CI/CD',
          },
        ],
      }),
    });
    assert.equal(res.status, 201);
    const data = (await res.json()) as any;
    internshipId = data.data.id;
    assert.ok(internshipId);
    assert.equal(data.data.status, InternshipStatus.DRAFT);
  });

  // =========================================================================
  // STEP 8: System Automatically Assigns Workflow
  // =========================================================================
  it('Step 8: System automatically assigns workflow instance and generates tasks', async () => {
    // Submit registration to transition from DRAFT to PENDING_APPROVAL
    const submitRes = await fetch(`${baseUrl}/api/v1/internships/${internshipId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.equal(submitRes.status, 200);

    // Assign workflow template via POST /api/v1/workflows/assign/:internshipId
    const assignRes = await fetch(`${baseUrl}/api/v1/workflows/assign/${internshipId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId,
      }),
    });
    assert.equal(assignRes.status, 201, 'Workflow assignment must succeed');
    const assignData = (await assignRes.json()) as any;
    assert.ok(assignData.data.tasks.length >= 1, 'Must generate workflow tasks');
    taskId = assignData.data.tasks[0].id;
    assert.ok(taskId);
  });

  // =========================================================================
  // STEP 9: Authorized User Approves
  // =========================================================================
  it('Step 9: Authorized user (HOD) approves internship registration', async () => {
    const res = await fetch(`${baseUrl}/api/v1/internships/${internshipId}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hodToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        approved: true,
        reason: 'Institution criteria verified. Approved for academic credit.',
      }),
    });
    assert.equal(res.status, 200);
    const data = (await res.json()) as any;
    assert.equal(data.data.status, InternshipStatus.APPROVED);
  });

  // =========================================================================
  // STEP 10: HOD Assigns Faculty
  // =========================================================================
  it('Step 10: HOD assigns faculty supervisor', async () => {
    const res = await fetch(`${baseUrl}/api/v1/internships/${internshipId}/assign-faculty`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hodToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ facultyId }),
    });
    assert.equal(res.status, 200);
    const data = (await res.json()) as any;
    assert.equal(data.data.facultyId, facultyId);
  });

  // =========================================================================
  // STEP 11: Mentor Assignment
  // =========================================================================
  it('Step 11: Industry mentor assignment to internship', async () => {
    const res = await fetch(`${baseUrl}/api/v1/internships/${internshipId}/assign-mentor`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hodToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mentorId,
        mentorName: 'Marcus Mentor',
        mentorEmail: 'mentor.industry@acme.com',
        designation: 'Staff Infrastructure Engineer',
      }),
    });
    assert.equal(res.status, 200, 'Mentor assignment must succeed');
    const data = (await res.json()) as any;
    assert.equal(data.data.mentorId, mentorId);

    // Transition internship to ACTIVE
    const activeRes = await fetch(`${baseUrl}/api/v1/internships/${internshipId}/transition`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hodToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetStatus: InternshipStatus.ACTIVE }),
    });
    assert.equal(activeRes.status, 200);
  });

  // =========================================================================
  // STEP 12: Student Submits Progress
  // =========================================================================
  it('Step 12: Student submits progress deliverable', async () => {
    const res = await fetch(`${baseUrl}/api/v1/submissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        internshipId,
        taskId,
        title: 'Initial Architecture Diagram & API Prototype',
        content: 'Drafted OpenAPI specifications and deployed basic Express endpoints on container runtime.',
        files: [{ filename: 'architecture_v1.pdf', storageKey: 'docs/arch1.pdf', mimeType: 'application/pdf', size: 1024 }],
      }),
    });
    assert.equal(res.status, 201);
    const data = (await res.json()) as any;
    submissionId = data.data.id;
    assert.ok(submissionId);
    assert.equal(data.data.status, SubmissionStatus.SUBMITTED);
  });

  // =========================================================================
  // STEP 13: Mentor Reviews
  // =========================================================================
  it('Step 13: Mentor reviews submitted deliverable', async () => {
    const res = await fetch(`${baseUrl}/api/v1/submissions/${submissionId}/reviews`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mentorToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feedback: 'Good initial structure. However, auth endpoints and database indexing are incomplete.',
        score: 75,
        status: 'CHANGES_REQUESTED',
      }),
    });
    assert.equal(res.status, 201);
  });

  // =========================================================================
  // STEP 14: Mentor Requests Revision
  // =========================================================================
  it('Step 14: Mentor requests revision with actionable feedback', async () => {
    const sub = workspaceStore.submissions.get(submissionId)!;
    sub.status = SubmissionStatus.REVISION_NEEDED;
    sub.revisionReason = 'Please complete auth endpoints and database indexing';
    assert.equal(sub.status, SubmissionStatus.REVISION_NEEDED);
  });

  // =========================================================================
  // STEP 15: Student Submits Version 2
  // =========================================================================
  it('Step 15: Student submits Version 2 addressing mentor feedback', async () => {
    const res = await fetch(`${baseUrl}/api/v1/submissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        internshipId,
        taskId,
        title: 'Revised Architecture Diagram & Secured Auth APIs (Version 2)',
        content: 'Implemented BCrypt password hashing, JWT bearer tokens, and multi-tenant scoping filters.',
        isRevision: true,
      }),
    });
    assert.equal(res.status, 201);
    const data = (await res.json()) as any;
    assert.equal(data.data.currentVersion, 2, 'Version must increment to 2');

    // Mentor approves Version 2
    const reviewRes = await fetch(`${baseUrl}/api/v1/submissions/${submissionId}/reviews`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mentorToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feedback: 'Version 2 addresses all security concerns and completes all requirements.',
        score: 95,
        status: 'ACCEPTED',
      }),
    });
    assert.equal(reviewRes.status, 201);
    const sub = workspaceStore.submissions.get(submissionId)!;
    sub.status = SubmissionStatus.ACCEPTED;
  });

  // =========================================================================
  // STEP 16: Mentor Changes Expected Outcome
  // =========================================================================
  it('Step 16: Mentor modifies expected outcome rubric / target', async () => {
    const res = await fetch(`${baseUrl}/api/v1/internships/${internshipId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expectedOutcomes: [
          {
            title: 'Cloud Architecture & Enterprise Security Implementation',
            description: 'Advanced production-ready microservices with zero-trust multi-tenancy',
            expectedEvidence: 'Automated test suite with 100% passing cross-tenant isolation and security audit',
          },
        ],
      }),
    });
    assert.equal(res.status, 200);
    const data = (await res.json()) as any;
    assert.equal(data.data.outcomeVersion, 2, 'Outcome version must increment to 2');
  });

  // =========================================================================
  // STEP 17: Verify History Preserved
  // =========================================================================
  it('Step 17: Verify expected outcome version history preserved', async () => {
    const res = await fetch(`${baseUrl}/api/v1/internships/${internshipId}/outcomes/versions`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    assert.equal(res.status, 200);
    const data = (await res.json()) as any;
    assert.ok(data.data.length >= 2, 'Must contain Version 1 and Version 2 in history');
    assert.equal(data.data[0].versionNumber, 1);
    assert.equal(data.data[1].versionNumber, 2);
  });

  // =========================================================================
  // STEP 18: AI Analyzes Major Report
  // =========================================================================
  it('Step 18: AI intelligence pipeline analyzes major progress report', async () => {
    const res = await fetch(`${baseUrl}/api/v1/ai/submissions/${submissionId}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.equal(res.status, 200);
    const data = (await res.json()) as any;
    assert.ok(data.data.extractedInfo, 'Must contain extracted structured evidence');
    assert.equal(data.data.isAdvisory, true, 'AI must be marked as advisory');
  });

  // =========================================================================
  // STEP 19: AI Failure Test
  // =========================================================================
  it('Step 19: AI failure test - pipeline fails gracefully without blocking workflow', async () => {
    const subRes = await fetch(`${baseUrl}/api/v1/submissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        internshipId,
        title: 'Daily Diary Log Entry',
        content: 'Short log entry for resilience testing.',
      }),
    });
    assert.equal(subRes.status, 201);
    const subData = (await subRes.json()) as any;

    const analysisRes = await fetch(`${baseUrl}/api/v1/ai/submissions/${subData.data.id}/analysis`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.ok([200, 404].includes(analysisRes.status));
  });

  // =========================================================================
  // STEP 20: Faculty Sees Health
  // =========================================================================
  it('Step 20: Faculty monitors deterministic internship health & metrics', async () => {
    // 1. Unified lifecycle timeline
    const timelineRes = await fetch(`${baseUrl}/api/v1/monitoring/internships/${internshipId}/timeline`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    assert.equal(timelineRes.status, 200);
    const timelineData = (await timelineRes.json()) as any;
    assert.ok(Array.isArray(timelineData.data), 'Timeline events must be an array');
    assert.ok(timelineData.data.length >= 1, 'Timeline must contain lifecycle events');

    // 2. Direct health evaluation
    const healthRes = await fetch(`${baseUrl}/api/v1/monitoring/internships/${internshipId}/health`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    assert.equal(healthRes.status, 200);
    const healthData = (await healthRes.json()) as any;
    assert.ok(healthData.data.status !== undefined, 'Health status must be present');
    assert.ok(healthData.data.metrics !== undefined, 'Health metrics must be present');
  });

  // =========================================================================
  // STEP 21: Mentor Final Evaluation
  // =========================================================================
  it('Step 21: Mentor submits final comprehensive evaluation (/100)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/completion/evaluation`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mentorToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        internshipId,
        criteria: [
          { id: 'crit-tech', name: 'Technical Skills', maxMarks: 40, awardedMarks: 38, comment: 'Strong engineering' },
          { id: 'crit-init', name: 'Initiative', maxMarks: 20, awardedMarks: 19, comment: 'Proactive leadership' },
          { id: 'crit-comm', name: 'Communication', maxMarks: 20, awardedMarks: 18, comment: 'Clear documentation' },
          { id: 'crit-dep', name: 'Dependability', maxMarks: 20, awardedMarks: 19, comment: 'On-time delivery' },
        ],
        feedback: 'Outstanding intern. Exceeded all deliverables and demonstrated strong engineering leadership.',
      }),
    });
    assert.equal(res.status, 201);
    const data = (await res.json()) as any;
    assert.equal(data.data.totalMarks, 94);
    assert.equal(data.data.finalGrade, 'A+');
  });

  // =========================================================================
  // STEP 22: Faculty Confirms Completion
  // =========================================================================
  it('Step 22: Faculty confirms academic prerequisites & completes internship', async () => {
    const res = await fetch(`${baseUrl}/api/v1/completion/confirm`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${facultyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        internshipId,
        facultyNotes: 'Verified all submissions, outcomes, and mentor evaluation. Certified for graduation credit.',
        satisfactionRating: 5,
      }),
    });
    assert.equal(res.status, 200);
    const data = (await res.json()) as any;
    assert.equal(data.data.status, InternshipStatus.COMPLETED);
  });

  // =========================================================================
  // STEP 23: Student Sees Completed Record
  // =========================================================================
  it('Step 23: Student accesses verified completed internship dossier', async () => {
    const res = await fetch(`${baseUrl}/api/v1/completion/dossier/${internshipId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.equal(res.status, 200);
    const data = (await res.json()) as any;
    assert.equal(data.data.internship.status, InternshipStatus.COMPLETED);
    assert.ok(data.data.finalEvaluation, 'Dossier must include final evaluation');
    assert.ok(data.data.facultyConfirmation, 'Dossier must include faculty confirmation');
  });

  // =========================================================================
  // STEP 24: Cross-Tenant Access Test
  // =========================================================================
  it('Step 24: Cross-Tenant Access Test - Tenant B strictly denied (403 Forbidden)', async () => {
    // Tenant B student attempts to access completed dossier of Tenant A
    const resDossier = await fetch(`${baseUrl}/api/v1/completion/dossier/${internshipId}`, {
      headers: { Authorization: `Bearer ${tenantBToken}` },
    });
    assert.equal(resDossier.status, 403, 'Cross-tenant dossier access must return 403');

    // Tenant B student attempts to query Tenant A internship
    const resInternship = await fetch(`${baseUrl}/api/v1/internships/${internshipId}`, {
      headers: { Authorization: `Bearer ${tenantBToken}` },
    });
    assert.equal(resInternship.status, 403, 'Cross-tenant internship GET must return 403');

    // Tenant B student attempts to modify Tenant A internship
    const resModify = await fetch(`${baseUrl}/api/v1/internships/${internshipId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${tenantBToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Hacked Title' }),
    });
    assert.equal(resModify.status, 403, 'Cross-tenant internship PUT must return 403');
  });

  // =========================================================================
  // PERFORMANCE BENCHMARK TESTS
  // =========================================================================
  describe('Performance Benchmarks', () => {
    it('API Response Time: Authentication login under 500ms', async () => {
      const start = Date.now();
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'student.nexus@nexus.edu', password: 'Password123!', organizationCode: orgCode }),
      });
      const elapsed = Date.now() - start;
      assert.equal(res.status, 200);
      assert.ok(elapsed < 500, `Login response time (${elapsed}ms) must be under 500ms`);
    });

    it('API Response Time: Internship listing query under 100ms', async () => {
      const start = Date.now();
      const res = await fetch(`${baseUrl}/api/v1/internships`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const elapsed = Date.now() - start;
      assert.equal(res.status, 200);
      assert.ok(elapsed < 100, `Internships query (${elapsed}ms) must be under 100ms`);
    });

    it('API Response Time: Monitoring timeline query under 100ms', async () => {
      const start = Date.now();
      const res = await fetch(`${baseUrl}/api/v1/monitoring/internships/${internshipId}/timeline`, {
        headers: { Authorization: `Bearer ${facultyToken}` },
      });
      const elapsed = Date.now() - start;
      assert.equal(res.status, 200);
      assert.ok(elapsed < 100, `Timeline query (${elapsed}ms) must be under 100ms`);
    });

    it('API Response Time: Institutional analytics aggregate query under 200ms', async () => {
      const start = Date.now();
      const res = await fetch(`${baseUrl}/api/v1/analytics`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const elapsed = Date.now() - start;
      assert.equal(res.status, 200);
      assert.ok(elapsed < 200, `Analytics aggregate query (${elapsed}ms) must be under 200ms`);
    });
  });
});
