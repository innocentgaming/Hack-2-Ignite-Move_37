import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { app } from '../src/app.js';
import { notificationService, notificationStore } from '../src/services/notification.service.js';
import { auditService, auditStore } from '../src/services/audit.service.js';
import { documentService, documentStore } from '../src/services/document.service.js';
import { internshipStore } from '../src/services/internship.service.js';
import { workflowStore } from '../src/services/workflow.service.js';
import { workspaceStore } from '../src/services/workspace.service.js';
import { submissionStore } from '../src/services/submission.service.js';
import { completionStore } from '../src/services/completion.service.js';
import { storageService } from '../src/services/storage.service.js';
import {
  NotificationType,
  AuditAction,
  InternshipStatus,
  SubmissionStatus,
  UserRole,
} from '@internos/types';

describe('InternOS Phase 10: Notifications, Audit Logging & Document Management Suite', () => {
  let server: Server;
  let baseUrl: string;

  // Tokens
  let tokenAdminA: string;
  let tokenFacultyA: string;
  let tokenStudentA: string;
  let tokenStudentAOther: string;
  let tokenMentorA: string;
  let tokenAdminB: string;
  let tokenStudentB: string;

  // IDs
  let studentAId: string;
  let studentAOtherId: string;
  let mentorAId: string;
  let facultyAId: string;
  let adminAId: string;
  let studentBId: string;
  let testInternshipId: string;
  let testTaskId: string;
  let testSubmissionId: string;
  let testDocId: string;

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
    const dataAdminA = (await resAdminA.json()) as any;
    tokenAdminA = dataAdminA.data.token;
    adminAId = dataAdminA.data.user.id;

    // 2. Login Faculty Org A
    const resFacA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'faculty@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataFacA = (await resFacA.json()) as any;
    tokenFacultyA = dataFacA.data.token;
    facultyAId = dataFacA.data.user.id;

    // 3. Login Student Org A
    const resStudA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataStudA = (await resStudA.json()) as any;
    tokenStudentA = dataStudA.data.token;
    studentAId = dataStudA.data.user.id;

    // 4. Login Mentor Org A
    const resMenA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'mentor@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataMenA = (await resMenA.json()) as any;
    tokenMentorA = dataMenA.data.token;
    mentorAId = dataMenA.data.user.id;

    // 5. Login Admin Org B
    const resAdminB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@org-b.com', password: 'Password123!', organizationCode: 'ORG_B' }),
    });
    const dataAdminB = (await resAdminB.json()) as any;
    tokenAdminB = dataAdminB.data.token;

    // 6. Login Student Org B
    const resStudB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-b.com', password: 'Password123!', organizationCode: 'ORG_B' }),
    });
    const dataStudB = (await resStudB.json()) as any;
    tokenStudentB = dataStudB.data.token;
    studentBId = dataStudB.data.user.id;

    // 7. Create a second student in Org A for access authorization testing
    const resCreateStudent2 = await fetch(`${baseUrl}/api/v1/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAdminA}` },
      body: JSON.stringify({
        email: `student2-${Date.now()}@org-a.com`,
        firstName: 'Other',
        lastName: 'Student',
        role: 'STUDENT',
        password: 'Password123!',
      }),
    });
    const dataStud2 = (await resCreateStudent2.json()) as any;
    assert.equal(resCreateStudent2.status, 201);
    studentAOtherId = dataStud2.data.id;

    const resLoginOther = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: dataStud2.data.email, password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataLoginOther = (await resLoginOther.json()) as any;
    tokenStudentAOther = dataLoginOther.data.token;

    // Setup an active internship
    const resReg = await fetch(`${baseUrl}/api/v1/internships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStudentA}` },
      body: JSON.stringify({
        title: 'Full-Stack Distributed Systems Internship',
        role: 'Backend Engineering Intern',
        type: 'FULL_TIME',
        companyId: 'company-a-tech',
        startDate: '2026-06-01T00:00:00Z',
        endDate: '2026-10-31T00:00:00Z',
        description: 'Building microservices and secure storage APIs with TypeScript.',
      }),
    });
    const dataReg = (await resReg.json()) as any;
    assert.equal(resReg.status, 201);
    testInternshipId = dataReg.data.id;

    // Submit & Approve & Transition to ACTIVE
    await fetch(`${baseUrl}/api/v1/internships/${testInternshipId}/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });
    await fetch(`${baseUrl}/api/v1/internships/${testInternshipId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAdminA}` },
      body: JSON.stringify({ approved: true, notes: 'Phase 10 setup' }),
    });
    await fetch(`${baseUrl}/api/v1/internships/${testInternshipId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAdminA}` },
      body: JSON.stringify({ targetStatus: InternshipStatus.ACTIVE }),
    });

    // Assign Mentor to Internship
    await fetch(`${baseUrl}/api/v1/internships/${testInternshipId}/assign-mentor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAdminA}` },
      body: JSON.stringify({
        mentorId: mentorAId,
        mentorName: 'Dr. Alan Vance',
        mentorEmail: 'mentor@org-a.com',
      }),
    });

    // Assign Faculty to Internship
    await fetch(`${baseUrl}/api/v1/internships/${testInternshipId}/assign-faculty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAdminA}` },
      body: JSON.stringify({ facultyId: facultyAId }),
    });

    // Create a task
    testTaskId = `task-phase10-${Date.now()}`;
    workflowStore.tasks.set(testTaskId, {
      id: testTaskId,
      organizationId: 'org-a-id',
      instanceId: testInternshipId,
      templateStepId: 'step-milestone-1',
      title: 'Milestone Deliverable 1 - Storage Engine',
      stage: 'MID_TERM',
      type: 'SUBMISSION' as any,
      assigneeRole: UserRole.STUDENT,
      required: true,
      originalDueDate: new Date('2026-07-15'),
      currentDueDate: new Date('2026-07-15'),
      status: 'PENDING' as any,
      latePolicy: 'ALLOW_NO_PENALTY' as any,
      extensions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  // =========================================================================
  // 1. In-App Notification Creation and Listing
  // =========================================================================
  it('1. should create and retrieve in-app notifications with complete structured fields', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAdminA}` },
      body: JSON.stringify({
        recipientId: studentAId,
        type: NotificationType.TASK_DUE,
        title: 'Monthly report due tomorrow',
        message: 'Your monthly milestone progress report is due tomorrow at 11:59 PM.',
        entityType: 'Task',
        entityId: testTaskId,
      }),
    });

    assert.equal(res.status, 201);
    const data = (await res.json()) as any;
    assert.equal(data.success, true);
    const notif = data.data;

    assert.ok(notif.id);
    assert.equal(notif.recipientId, studentAId);
    assert.equal(notif.type, NotificationType.TASK_DUE);
    assert.equal(notif.title, 'Monthly report due tomorrow');
    assert.ok(notif.message.includes('monthly milestone'));
    assert.equal(notif.entityType, 'Task');
    assert.equal(notif.entityId, testTaskId);
    assert.equal(notif.isRead, false);
    assert.ok(notif.createdAt);

    // List notifications as Student A
    const listRes = await fetch(`${baseUrl}/api/v1/notifications`, {
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });
    assert.equal(listRes.status, 200);
    const listData = (await listRes.json()) as any;
    assert.equal(listData.success, true);
    assert.ok(Array.isArray(listData.data));
    assert.ok(listData.data.some((n: any) => n.id === notif.id));
  });

  // =========================================================================
  // 2. Unread Count & Mark-As-Read Operations
  // =========================================================================
  it('2. should accurately calculate unread count and support single & bulk mark-as-read operations', async () => {
    // Check initial unread count
    const countRes1 = await fetch(`${baseUrl}/api/v1/notifications/unread-count`, {
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });
    assert.equal(countRes1.status, 200);
    const countData1 = (await countRes1.json()) as any;
    const initialUnread = countData1.data.unreadCount;
    assert.ok(initialUnread > 0, 'Expected positive unread count');

    // Create a new unread notification for Student A
    const notif = await notificationService.createNotification({
      organizationId: 'org-a-id',
      recipientId: studentAId,
      type: NotificationType.REVISION_REQUESTED,
      title: 'Mentor requested revision',
      message: 'Please revise section 2 of your deliverable.',
      entityType: 'Submission',
      entityId: 'sub-test-read',
    });

    // Verify unread count increased by 1
    const countRes2 = await fetch(`${baseUrl}/api/v1/notifications/unread-count`, {
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });
    const countData2 = (await countRes2.json()) as any;
    assert.equal(countData2.data.unreadCount, initialUnread + 1);

    // Mark single notification as read
    const markRes = await fetch(`${baseUrl}/api/v1/notifications/${notif.id}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });
    assert.equal(markRes.status, 200);
    const markData = (await markRes.json()) as any;
    assert.equal(markData.data.isRead, true);

    // Verify unread count decremented
    const countRes3 = await fetch(`${baseUrl}/api/v1/notifications/unread-count`, {
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });
    const countData3 = (await countRes3.json()) as any;
    assert.equal(countData3.data.unreadCount, initialUnread);

    // Mark ALL as read
    const markAllRes = await fetch(`${baseUrl}/api/v1/notifications/mark-all-read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });
    assert.equal(markAllRes.status, 200);

    // Verify unread count is now 0
    const countRes4 = await fetch(`${baseUrl}/api/v1/notifications/unread-count`, {
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });
    const countData4 = (await countRes4.json()) as any;
    assert.equal(countData4.data.unreadCount, 0);
  });

  // =========================================================================
  // 3. Notification Isolation Across Tenants & Users
  // =========================================================================
  it('3. should strictly isolate notifications between users and across institutional tenant boundaries', async () => {
    // Create notification for Student B in Org B
    const notifB = await notificationService.createNotification({
      organizationId: 'org-b-id',
      recipientId: studentBId,
      type: NotificationType.INTERNSHIP_APPROVED,
      title: 'Org B Internship Approved',
      message: 'Your registration at Org B is approved.',
    });

    // Student A queries notifications -> MUST NOT include notifB
    const resA = await fetch(`${baseUrl}/api/v1/notifications`, {
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });
    const dataA = (await resA.json()) as any;
    assert.ok(!dataA.data.some((n: any) => n.id === notifB.id));

    // Student A attempts to mark Student B notification read -> access denied (403 or 404)
    const resCrossMark = await fetch(`${baseUrl}/api/v1/notifications/${notifB.id}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });
    assert.ok(resCrossMark.status === 403 || resCrossMark.status === 404, 'Cross-tenant notification read must fail');
  });

  // =========================================================================
  // 4. In-App Notification Lifecycle Triggers
  // =========================================================================
  it('4. should trigger in-app notifications on key lifecycle events: submission, revision, evaluation, completion', async () => {
    // 1. Submit deliverable
    const subRes = await fetch(`${baseUrl}/api/v1/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStudentA}` },
      body: JSON.stringify({
        internshipId: testInternshipId,
        taskId: testTaskId,
        title: 'Milestone Deliverable 1 - Storage Engine',
        content: 'Implemented secure storage engine with authorized streaming download.',
      }),
    });
    assert.equal(subRes.status, 201);
    const subData = (await subRes.json()) as any;
    testSubmissionId = subData.data.id;

    // 2. Mentor requests revision on submission
    const revRes = await fetch(`${baseUrl}/api/v1/submissions/${testSubmissionId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenMentorA}` },
      body: JSON.stringify({
        submissionId: testSubmissionId,
        isRevisionRequested: true,
        overallFeedback: 'Please add automated benchmarks for download throughput.',
        criteriaScores: [{ criteriaId: 'crit-1', score: 6, maxScore: 10, comments: 'Good baseline' }],
      }),
    });
    assert.equal(revRes.status, 201);

    // Verify Student A received REVISION_REQUESTED notification
    const notifsAfterRev = await notificationService.getUserNotifications('org-a-id', studentAId);
    const revNotif = notifsAfterRev.notifications.find((n) => n.type === NotificationType.REVISION_REQUESTED);
    assert.ok(revNotif, 'Student should receive revision requested notification');
    assert.ok(revNotif.title.toLowerCase().includes('revision'));

    // 2b. Student submits revision and Mentor approves it
    const revSubRes = await fetch(`${baseUrl}/api/v1/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStudentA}` },
      body: JSON.stringify({
        internshipId: testInternshipId,
        taskId: testTaskId,
        title: 'Milestone Deliverable 1 - Storage Engine (Revised)',
        content: 'Added automated benchmarks for download throughput with detailed performance metrics.',
        isRevision: true,
      }),
    });
    assert.ok([200, 201].includes(revSubRes.status));

    const approveRevRes = await fetch(`${baseUrl}/api/v1/submissions/${testSubmissionId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenMentorA}` },
      body: JSON.stringify({
        submissionId: testSubmissionId,
        feedback: 'Excellent benchmarks provided. Deliverable accepted.',
        requestRevision: false,
        score: 95,
      }),
    });
    assert.equal(approveRevRes.status, 201);

    // 3. Mentor completes final evaluation
    const evalRes = await fetch(`${baseUrl}/api/v1/completion/evaluation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenMentorA}` },
      body: JSON.stringify({
        internshipId: testInternshipId,
        technicalSkillsScore: 28,
        initiativeScore: 19,
        workQualityScore: 28,
        professionalismScore: 19,
        mentorFeedback: 'Outstanding technical performance and system architecture execution.',
        recommendation: 'HIRE_AS_FULL_TIME',
      }),
    });
    assert.equal(evalRes.status, 201);

    // Verify Student A received EVALUATION_COMPLETED notification
    const notifsAfterEval = await notificationService.getUserNotifications('org-a-id', studentAId);
    const evalNotif = notifsAfterEval.notifications.find((n) => n.type === NotificationType.EVALUATION_COMPLETED);
    assert.ok(evalNotif, 'Student should receive final evaluation completed notification');
    assert.ok(evalNotif.title.toLowerCase().includes('evaluation'));

    // Ensure all required milestone tasks for testInternshipId have accepted submissions & reviews
    const detail = internshipStore.details.get(testInternshipId)!;
    const studentTasks = Array.from(workflowStore.tasks.values()).filter(
      (t) =>
        t.organizationId === 'org-a-id' &&
        (t.instanceId === detail?.workflowInstanceId || t.instanceId === testInternshipId) &&
        t.required &&
        (t.type === 'SUBMISSION' || t.assigneeRole === 'STUDENT')
    );

    for (const [idx, st] of studentTasks.entries()) {
      if (st.id === testTaskId) continue;
      const subId = `sub-phase10-req-${idx + 1}`;
      workspaceStore.submissions.set(subId, {
        id: subId,
        organizationId: 'org-a-id',
        internshipId: testInternshipId,
        taskId: st.id,
        studentId: studentAId,
        title: `Deliverable for ${st.title}`,
        content: 'Completed technical milestone deliverable',
        status: SubmissionStatus.ACCEPTED,
        submittedAt: new Date(),
        updatedAt: new Date(),
      });

      const revId = `rev-phase10-req-${idx + 1}`;
      workspaceStore.reviews.set(revId, {
        id: revId,
        organizationId: 'org-a-id',
        submissionId: subId,
        reviewerId: mentorAId,
        reviewerName: 'Mentor A',
        reviewerRole: UserRole.MENTOR,
        feedback: 'Verified milestone acceptance',
        score: 95,
        status: 'ACCEPTED',
        createdAt: new Date(),
      });
    }

    // 4. Faculty confirms completion
    const confRes = await fetch(`${baseUrl}/api/v1/completion/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenFacultyA}` },
      body: JSON.stringify({
        internshipId: testInternshipId,
        facultyNotes: 'All institutional deliverables and evaluations successfully verified.',
        academicRecommendation: 'PASS_WITH_DISTINCTION',
        creditsAwarded: 8,
      }),
    });
    assert.equal(confRes.status, 200);

    // Verify Student A received COMPLETION_CONFIRMED notification
    const notifsAfterComp = await notificationService.getUserNotifications('org-a-id', studentAId);
    const compNotif = notifsAfterComp.notifications.find((n) => n.type === NotificationType.COMPLETION_CONFIRMED);
    assert.ok(compNotif, 'Student should receive completion confirmed notification');
    assert.ok(compNotif.title.toLowerCase().includes('completion'));
  });

  // =========================================================================
  // 5. Audit Log Recording for Institutional Operations
  // =========================================================================
  it('5. should record immutable audit logs across institutional actions (login, user create, role change, approval, evaluation, completion)', async () => {
    const { logs } = await auditService.getLogs('org-a-id');
    assert.ok(logs.length > 0);

    const loggedActions = new Set(logs.map((l) => l.action));

    // Must have recorded login
    assert.ok(loggedActions.has('LOGIN'), 'Audit log must record LOGIN events');

    // Must have recorded user create
    assert.ok(loggedActions.has('USER_CREATE'), 'Audit log must record USER_CREATE events');

    // Must have recorded internship approval
    assert.ok(loggedActions.has(AuditAction.INTERNSHIP_APPROVE) || loggedActions.has('INTERNSHIP_APPROVAL'), 'Audit log must record approval');

    // Must have recorded mentor assignment
    assert.ok(loggedActions.has(AuditAction.INTERNSHIP_ASSIGN_MENTOR) || loggedActions.has('MENTOR_ASSIGNMENT'), 'Audit log must record mentor assignment');

    // Must have recorded evaluation
    assert.ok(loggedActions.has(AuditAction.FINAL_EVALUATION_CREATE) || loggedActions.has('EVALUATION'), 'Audit log must record evaluation');

    // Must have recorded completion
    assert.ok(loggedActions.has(AuditAction.COMPLETION_CONFIRM) || loggedActions.has('COMPLETION'), 'Audit log must record completion');

    // Verify actor, timestamp, entity, entityId fields are populated
    const sampleLog = logs.find((l) => l.action === 'LOGIN');
    assert.ok(sampleLog);
    assert.ok(sampleLog.id);
    assert.ok(sampleLog.organizationId);
    assert.ok(sampleLog.createdAt);
    assert.equal(sampleLog.entity, 'User');
  });

  // =========================================================================
  // 6. Audit Metadata Sanitization (No Sensitive Data Leaks)
  // =========================================================================
  it('6. should sanitize audit log metadata to redact passwords, tokens, credentials, and authorization headers', async () => {
    // Manually trigger an audit log containing sensitive keys
    const testLog = await auditService.log({
      organizationId: 'org-a-id',
      userId: adminAId,
      action: 'SECURITY_TEST_OPERATION',
      entity: 'System',
      details: {
        username: 'alice_admin',
        password: 'SuperSecretPassword123!',
        userToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        apiKey: 'sk-live-998822334455',
        safeMetadata: 'System audit check',
      },
    });

    assert.equal(testLog.details?.username, 'alice_admin');
    assert.equal(testLog.details?.safeMetadata, 'System audit check');
    // Sensitive keys must be redacted!
    assert.equal(testLog.details?.password, '[REDACTED]');
    assert.equal(testLog.details?.userToken, '[REDACTED]');
    assert.equal(testLog.details?.apiKey, '[REDACTED]');
  });

  // =========================================================================
  // 7. Audit Log Multi-Tenant Boundary Enforcement
  // =========================================================================
  it('7. should restrict audit log inspection strictly to the callers organization', async () => {
    // Query audit logs as Org A Admin
    const resA = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
      headers: { 'Authorization': `Bearer ${tokenAdminA}` },
    });
    assert.equal(resA.status, 200);
    const dataA = (await resA.json()) as any;
    assert.ok(dataA.data.logs.every((l: any) => l.organizationId === 'org-a-id'));

    // Query audit logs as Org B Admin
    const resB = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
      headers: { 'Authorization': `Bearer ${tokenAdminB}` },
    });
    assert.equal(resB.status, 200);
    const dataB = (await resB.json()) as any;
    assert.ok(dataB.data.logs.every((l: any) => l.organizationId === 'org-b-id'));
    assert.ok(!dataB.data.logs.some((l: any) => l.organizationId === 'org-a-id'));
  });

  // =========================================================================
  // 8. Document Upload & Private Storage Key Assignment
  // =========================================================================
  it('8. should upload documents to storage, save metadata, and mark them private by default', async () => {
    const fileContent = 'PDF-1.4 Spec: Private Student Technical Architecture Documentation';
    const uploadRes = await fetch(`${baseUrl}/api/v1/documents/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStudentA}` },
      body: JSON.stringify({
        filename: 'architecture_v1.pdf',
        mimeType: 'application/pdf',
        content: fileContent,
        entityType: 'INTERNSHIP',
        entityId: testInternshipId,
      }),
    });

    assert.equal(uploadRes.status, 201);
    const uploadData = (await uploadRes.json()) as any;
    assert.equal(uploadData.success, true);
    const doc = uploadData.data;

    assert.ok(doc.id);
    testDocId = doc.id;
    assert.equal(doc.filename, 'architecture_v1.pdf');
    assert.equal(doc.mimeType, 'application/pdf');
    assert.equal(doc.ownerId, studentAId);
    assert.equal(doc.isPrivate, true, 'Documents must be private by default');
    assert.ok(doc.storageKey.startsWith('org-a-id/'));
    assert.ok(doc.size > 0);
    assert.ok(doc.uploadedAt);
    assert.equal(doc.entityRelation?.entityType, 'INTERNSHIP');
    assert.equal(doc.entityRelation?.entityId, testInternshipId);
  });

  // =========================================================================
  // 9. Document Download Authorization (Owner, Faculty, Assigned Mentor)
  // =========================================================================
  it('9. should authorize document download for the document owner, faculty coordinator, and assigned mentor', async () => {
    // 1. Owner (Student A) downloads document
    const resOwner = await fetch(`${baseUrl}/api/v1/documents/${testDocId}/download`, {
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });
    assert.equal(resOwner.status, 200);
    const textOwner = await resOwner.text();
    assert.ok(textOwner.includes('Private Student Technical Architecture'));

    // 2. Faculty Coordinator downloads document
    const resFaculty = await fetch(`${baseUrl}/api/v1/documents/${testDocId}/download`, {
      headers: { 'Authorization': `Bearer ${tokenFacultyA}` },
    });
    assert.equal(resFaculty.status, 200);
    const textFaculty = await resFaculty.text();
    assert.ok(textFaculty.includes('Private Student Technical Architecture'));

    // 3. Assigned Industry Mentor downloads document
    const resMentor = await fetch(`${baseUrl}/api/v1/documents/${testDocId}/download`, {
      headers: { 'Authorization': `Bearer ${tokenMentorA}` },
    });
    assert.equal(resMentor.status, 200);
    const textMentor = await resMentor.text();
    assert.ok(textMentor.includes('Private Student Technical Architecture'));
  });

  // =========================================================================
  // 10. Unauthorized User Document Access Rejection (403)
  // =========================================================================
  it('10. should deny document download (403 Forbidden) to unassociated student within the same organization', async () => {
    // Other Student in Org A who does not own the document and is not associated with this internship
    const resUnauthorized = await fetch(`${baseUrl}/api/v1/documents/${testDocId}/download`, {
      headers: { 'Authorization': `Bearer ${tokenStudentAOther}` },
    });

    assert.equal(resUnauthorized.status, 403);
    const errData = (await resUnauthorized.json()) as any;
    assert.equal(errData.success, false);
    assert.ok(errData.error.message.toLowerCase().includes('access denied'));
  });

  // =========================================================================
  // 11. Cross-Tenant Document Access Rejection (403)
  // =========================================================================
  it('11. should strictly block cross-tenant document metadata and download requests with HTTP 403', async () => {
    // Student from Org B attempts to inspect Org A document metadata
    const resMetaCross = await fetch(`${baseUrl}/api/v1/documents/${testDocId}`, {
      headers: { 'Authorization': `Bearer ${tokenStudentB}` },
    });
    assert.equal(resMetaCross.status, 403);

    // Student from Org B attempts to download Org A document binary
    const resDownloadCross = await fetch(`${baseUrl}/api/v1/documents/${testDocId}/download`, {
      headers: { 'Authorization': `Bearer ${tokenStudentB}` },
    });
    assert.equal(resDownloadCross.status, 403);
  });

  // =========================================================================
  // 12. Document Deletion & Storage Cleanup
  // =========================================================================
  it('12. should delete document metadata and storage file with proper authorization and tenant isolation', async () => {
    // Admin B from Org B attempts to delete Org A document -> 403
    const resDeleteCross = await fetch(`${baseUrl}/api/v1/documents/${testDocId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenAdminB}` },
    });
    assert.equal(resDeleteCross.status, 403);

    // Document Owner (Student A) deletes their own document -> 200
    const resDeleteOwner = await fetch(`${baseUrl}/api/v1/documents/${testDocId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });
    assert.equal(resDeleteOwner.status, 200);
    const delData = (await resDeleteOwner.json()) as any;
    assert.equal(delData.success, true);

    // Subsequent retrieval returns 404
    const resGetAfter = await fetch(`${baseUrl}/api/v1/documents/${testDocId}`, {
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });
    assert.equal(resGetAfter.status, 404);
  });
});
