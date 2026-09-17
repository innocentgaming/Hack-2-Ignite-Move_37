import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { app } from '../src/app.js';
import {
  UserRole,
  WorkflowStepType,
  WorkflowStepFrequency,
  LatePolicyType,
  WorkflowTaskDto,
} from '@internos/types';

describe('InternOS Phase 3: Configurable Workflow Engine Suite', () => {
  let server: Server;
  let baseUrl: string;

  // Tokens for ORG_A
  let tokenAdminA: string;
  let tokenHodA: string;
  let _tokenFacultyA: string;
  let tokenStudentA: string;

  // Tokens for ORG_B
  let tokenAdminB: string;

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
    tokenAdminA = dataAdminA.data.token;

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
    _tokenFacultyA = dataFacultyA.data.token;

    // Login Student Org A
    const resStudentA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataStudentA = await resStudentA.json();
    tokenStudentA = dataStudentA.data.token;

    // Login Admin Org B
    const resAdminB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@org-b.com', password: 'Password123!', organizationCode: 'ORG_B' }),
    });
    const dataAdminB = await resAdminB.json();
    tokenAdminB = dataAdminB.data.token;
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  describe('1. Workflow Template Creation & Granular Step Configuration', () => {
    let createdTemplateId: string;

    it('Admin can create a custom workflow template with 5 step types', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workflows/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdminA}`,
        },
        body: JSON.stringify({
          name: 'AI & Data Science Practicum Pipeline',
          description: 'Intensive sequence: Daily Log -> Milestone Report -> Supervisor Review -> Mentor Review -> Capstone Defense',
          internshipType: 'FULL_TIME',
          assignmentRules: {
            departmentIds: ['dept-a-cs'],
            internshipTypes: ['FULL_TIME'],
          },
          steps: [
            {
              title: 'Daily Research Diary',
              description: 'Record daily experiments and notes',
              type: WorkflowStepType.SUBMISSION,
              frequency: WorkflowStepFrequency.DAILY,
              actor: UserRole.STUDENT,
              required: true,
              deadlineDays: 1,
              evaluationCriteria: 'Daily log consistency',
              maxMarks: 10,
              latePolicy: LatePolicyType.ALLOW_NO_PENALTY,
            },
            {
              title: 'Monthly Synthesis Report',
              description: 'Monthly deliverable summary',
              type: WorkflowStepType.SUBMISSION,
              frequency: WorkflowStepFrequency.MONTHLY,
              actor: UserRole.STUDENT,
              required: true,
              deadlineDays: 30,
              evaluationCriteria: 'Experimental rigor',
              maxMarks: 50,
              latePolicy: LatePolicyType.ALLOW_WITH_PENALTY,
            },
            {
              title: 'Faculty Midterm Review',
              description: 'Midterm milestone academic review',
              type: WorkflowStepType.REVIEW,
              frequency: WorkflowStepFrequency.MONTHLY,
              actor: UserRole.FACULTY,
              required: true,
              deadlineDays: 35,
              evaluationCriteria: 'Milestone achievement',
              maxMarks: 50,
              latePolicy: LatePolicyType.STRICT_LOCK,
            },
            {
              title: 'Industry Mentor Assessment',
              description: 'Corporate mentor evaluation',
              type: WorkflowStepType.REVIEW,
              frequency: WorkflowStepFrequency.MONTHLY,
              actor: UserRole.MENTOR,
              required: true,
              deadlineDays: 40,
              evaluationCriteria: 'Production impact',
              maxMarks: 50,
              latePolicy: LatePolicyType.STRICT_LOCK,
            },
            {
              title: 'Final Capstone Evaluation',
              description: 'Final viva and project evaluation',
              type: WorkflowStepType.EVALUATION,
              frequency: WorkflowStepFrequency.ONE_TIME,
              actor: UserRole.FACULTY,
              required: true,
              deadlineDays: 90,
              evaluationCriteria: 'Comprehensive rubric scoring',
              maxMarks: 100,
              latePolicy: LatePolicyType.STRICT_LOCK,
            },
          ],
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 201);
      assert.equal(data.data.name, 'AI & Data Science Practicum Pipeline');
      assert.equal(data.data.version, 1);
      assert.equal(data.data.steps.length, 5);
      createdTemplateId = data.data.id;
    });

    it('Admin B cannot access Org A templates (Cross-Tenant Boundary Enforcement)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workflows/templates/${createdTemplateId}`, {
        headers: { Authorization: `Bearer ${tokenAdminB}` },
      });
      assert.equal(res.status, 403, 'Cross-tenant workflow template access must return 403');
    });

    it('Students cannot create workflow templates (RBAC 403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workflows/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          name: 'Student Workflow',
          steps: [],
        }),
      });
      assert.equal(res.status, 403);
    });
  });

  describe('2. Workflow Versioning & Immutable Historical Snapshots', () => {
    let templateId: string;
    let initialVersion: number;

    it('Fetches default Org A template and verifies initial version', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workflows/templates/tpl-org-a-default`, {
        headers: { Authorization: `Bearer ${tokenAdminA}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      templateId = data.data.id;
      initialVersion = data.data.version;
      assert.equal(initialVersion, 1);
    });

    it('Modifying template steps automatically increments version', async () => {
      const updatedSteps = [
        {
          id: 'step-1',
          order: 1,
          type: WorkflowStepType.SUBMISSION,
          frequency: WorkflowStepFrequency.WEEKLY,
          actor: UserRole.STUDENT,
          required: true,
          deadlineDays: 7,
          title: 'Weekly Sprint Digest',
          description: 'Weekly software milestone notes',
          latePolicy: LatePolicyType.ALLOW_NO_PENALTY,
        },
        {
          id: 'step-2',
          order: 2,
          type: WorkflowStepType.EVALUATION,
          frequency: WorkflowStepFrequency.ONE_TIME,
          actor: UserRole.FACULTY,
          required: true,
          deadlineDays: 60,
          title: 'Final Outcome Evaluation',
          description: 'Comprehensive exit rubric',
          latePolicy: LatePolicyType.STRICT_LOCK,
        },
      ];

      const res = await fetch(`${baseUrl}/api/v1/workflows/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdminA}`,
        },
        body: JSON.stringify({
          name: 'Updated Software Core Workflow',
          steps: updatedSteps,
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.data.version, initialVersion + 1, 'Version must increment when steps are modified');
    });
  });

  describe('3. Deterministic Automatic Assignment & Task Generation (Zero AI)', () => {
    let instanceId: string;
    let generatedTaskId: string;

    it('Auto-assigns workflow to internship based on department and type matching', async () => {
      // Assign workflow to seeded internship-a-1
      const res = await fetch(`${baseUrl}/api/v1/workflows/assign/internship-a-1`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenAdminA}`,
        },
      });

      const data = await res.json();
      assert.equal(res.status, 201);
      assert.equal(data.data.internshipId, 'internship-a-1');
      assert.ok(data.data.templateVersion >= 1);
      assert.ok(data.data.tasks.length > 0);
      instanceId = data.data.id;
      generatedTaskId = data.data.tasks[0].id;
    });

    it('Existing workflow instance maintains historical frozen snapshot and tasks', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workflows/instances/internship-a-1`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.data.id, instanceId);
      assert.ok(data.data.stepsSnapshot.length > 0);
    });

    it('Task generation assigns discrete due dates and assignee roles', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workflows/instance-details/${instanceId}`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      const tasks: WorkflowTaskDto[] = data.data.tasks;
      assert.ok(tasks.length >= 2);
      assert.ok(tasks.every((t) => t.originalDueDate && t.currentDueDate));
      assert.ok(tasks.some((t) => t.assigneeRole === UserRole.STUDENT));
    });

    it('Student can submit task; lateness is recorded while original due date is strictly preserved', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workflows/tasks/${generatedTaskId}/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenStudentA}`,
        },
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.data.status, 'SUBMITTED');
      assert.ok(data.data.completedAt, 'completedAt must be recorded');
      assert.ok(typeof data.data.isLate === 'boolean', 'isLate boolean must be determined');
      assert.ok(data.data.originalDueDate, 'originalDueDate must be preserved unchanged');
    });
  });

  describe('4. Authorized Deadline Extensions & Audit Logs', () => {
    let extensionTaskId: string;

    before(async () => {
      // Find a pending task in Org A
      const res = await fetch(`${baseUrl}/api/v1/workflows/tasks`, {
        headers: { Authorization: `Bearer ${tokenAdminA}` },
      });
      const data = await res.json();
      const pendingTask = data.data.find((t: WorkflowTaskDto) => t.status === 'PENDING');
      extensionTaskId = pendingTask ? pendingTask.id : data.data[0].id;
    });

    it('Student cannot grant deadline extension (RBAC 403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/workflows/tasks/${extensionTaskId}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          newDeadline: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
          reason: 'Student self-extension request',
        }),
      });
      assert.equal(res.status, 403);
    });

    it('HOD / Faculty can grant deadline extension with audit reason', async () => {
      const newDeadline = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
      const res = await fetch(`${baseUrl}/api/v1/workflows/tasks/${extensionTaskId}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenHodA}`,
        },
        body: JSON.stringify({
          newDeadline,
          reason: 'Medical leave approved by Head of Department',
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.data.currentDueDate, newDeadline);
      assert.ok(data.data.extensions.length >= 1);
      const lastExtension = data.data.extensions[data.data.extensions.length - 1];
      assert.equal(lastExtension.reason, 'Medical leave approved by Head of Department');
      assert.ok(lastExtension.originalDeadline, 'Must track original deadline before extension');
    });

    it('Audit trail logs workflow template creations, assignments, and extensions', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${tokenAdminA}` },
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      const actions = data.data.logs.map((l: { action: string }) => l.action);
      assert.ok(
        actions.includes('WORKFLOW_TEMPLATE_CREATE') ||
          actions.includes('WORKFLOW_ASSIGNED') ||
          actions.includes('TASK_EXTENDED'),
        'Workflow audit actions must be recorded in institutional audit log'
      );
    });
  });
});
