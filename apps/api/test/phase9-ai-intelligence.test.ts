import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { app } from '../src/app.js';
import { AIProvider, AIProviderResponse } from '../src/services/ai/ai-provider.interface.js';
import { aiAnalysisService, aiStore } from '../src/services/ai/ai-analysis.service.js';
import { ResponseValidator, ResponseValidationError } from '../src/services/ai/response-validator.js';
import { PromptBuilder } from '../src/services/ai/prompt-builder.js';
import { TimeoutError, defaultLLMProvider } from '../src/services/ai/llm-provider.js';
import { healthCalculationService } from '../src/services/health-calculation.service.js';
import { internshipStore } from '../src/services/internship.service.js';
import { workflowStore } from '../src/services/workflow.service.js';
import { submissionStore } from '../src/services/submission.service.js';
import { workspaceStore } from '../src/services/workspace.service.js';
import { InternshipStatus, UserRole } from '@internos/types';

describe('InternOS Phase 9: Evidence-Based AI Intelligence Layer Suite', () => {
  let server: Server;
  let baseUrl: string;

  // Tokens
  let tokenAdminA: string;
  let tokenFacultyA: string;
  let tokenStudentA: string;
  let tokenMentorA: string;
  let tokenStudentB: string;

  // Tracked entities
  let studentAId: string;
  let testInternshipId: string;
  let monthlyTaskId: string;
  let dailyDiaryTaskId: string;
  let monthlySubmissionId: string;

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

    // 2. Login Faculty Org A
    const resFacA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'faculty@org-a.com', password: 'Password123!', organizationCode: 'ORG_A' }),
    });
    const dataFacA = (await resFacA.json()) as any;
    tokenFacultyA = dataFacA.data.token;

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

    // 5. Login Student Org B (for tenant isolation tests)
    const resStudB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@org-b.com', password: 'Password123!', organizationCode: 'ORG_B' }),
    });
    const dataStudB = (await resStudB.json()) as any;
    tokenStudentB = dataStudB.data.token;

    // Setup an active internship with tasks
    const resReg = await fetch(`${baseUrl}/api/v1/internships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStudentA}` },
      body: JSON.stringify({
        title: 'Cloud Systems Full-Stack Engineering Internship',
        role: 'Cloud Engineering Intern',
        type: 'FULL_TIME',
        companyId: 'company-a-tech',
        startDate: '2026-06-01T00:00:00Z',
        endDate: '2026-10-31T00:00:00Z',
        description: 'Building microservices and automated deployment pipelines with React and Node.js.',
        expectedOutcomes: [
          {
            code: 'PO-1',
            title: 'Engineering Knowledge Application',
            description: 'Apply mathematics and system engineering principles to cloud applications.',
            expectedEvidence: 'Architecture documentation and test suites',
          },
          {
            code: 'PO-2',
            title: 'Modern Tool Usage',
            description: 'Proficiency in modern containerization and web frameworks.',
            expectedEvidence: 'Dockerfiles and React components',
          },
          {
            code: 'PO-3',
            title: 'Professional Communication',
            description: 'Document engineering architectures and write clear technical progress reports.',
            expectedEvidence: 'Monthly progress deliverable reports',
          },
        ],
      }),
    });
    const dataReg = (await resReg.json()) as any;
    assert.ok(dataReg.data, `Registration failed: ${JSON.stringify(dataReg)}`);
    testInternshipId = dataReg.data.id;

    // Submit & Approve & Transition to ACTIVE
    await fetch(`${baseUrl}/api/v1/internships/${testInternshipId}/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });
    await fetch(`${baseUrl}/api/v1/internships/${testInternshipId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAdminA}` },
      body: JSON.stringify({ approved: true, notes: 'Phase 9 test setup' }),
    });
    await fetch(`${baseUrl}/api/v1/internships/${testInternshipId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAdminA}` },
      body: JSON.stringify({ targetStatus: InternshipStatus.ACTIVE }),
    });

    // Create a Monthly Progress Task
    monthlyTaskId = `task-phase9-monthly-${Date.now()}`;
    workflowStore.tasks.set(monthlyTaskId, {
      id: monthlyTaskId,
      organizationId: 'ORG_A',
      instanceId: testInternshipId,
      templateStepId: 'step-monthly-1',
      title: 'Month 1 Technical Progress Deliverable Report',
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

    // Create a Daily Diary Task (to test skipping)
    dailyDiaryTaskId = `task-phase9-daily-${Date.now()}`;
    workflowStore.tasks.set(dailyDiaryTaskId, {
      id: dailyDiaryTaskId,
      organizationId: 'ORG_A',
      instanceId: testInternshipId,
      templateStepId: 'step-daily-1',
      title: 'Daily Standup Diary Entry - Day 14',
      stage: 'ONBOARDING',
      type: 'SUBMISSION' as any,
      assigneeRole: UserRole.STUDENT,
      required: false,
      originalDueDate: new Date('2026-06-14'),
      currentDueDate: new Date('2026-06-14'),
      status: 'PENDING' as any,
      latePolicy: 'ALLOW_NO_PENALTY' as any,
      extensions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  after(async () => {
    aiAnalysisService.setProvider(defaultLLMProvider);
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  // 1. Successful AI Analysis
  it('1. should analyze major progress deliverable and extract structured activities, technologies, skills, evidence, and outcomes', async () => {
    const reportContent = `
During this monthly milestone, I implemented a RESTful API backend using Node.js, Express, and TypeScript.
I configured PostgreSQL with Prisma ORM to manage database migrations and ensure referential integrity.
For frontend integration, I developed reusable UI components in React and styled them with Tailwind CSS.
I also set up a containerized environment using Docker and Docker Compose for local testing.
All unit tests were written and verified using Jest.
`;

    const res = await fetch(`${baseUrl}/api/v1/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStudentA}` },
      body: JSON.stringify({
        internshipId: testInternshipId,
        taskId: monthlyTaskId,
        title: 'Month 1 Technical Progress Deliverable Report',
        content: reportContent,
      }),
    });

    assert.equal(res.status, 201);
    const data = (await res.json()) as any;
    assert.equal(data.success, true);
    monthlySubmissionId = data.data.id;

    // Query AI Analysis endpoint
    const aiRes = await fetch(`${baseUrl}/api/v1/ai/submissions/${monthlySubmissionId}/analysis`, {
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });

    assert.equal(aiRes.status, 200);
    const aiData = (await aiRes.json()) as any;
    assert.equal(aiData.success, true);

    const record = aiData.data;
    assert.equal(record.status, 'COMPLETED');
    assert.equal(record.isAdvisory, true);
    assert.ok(record.confidence > 0.5, 'Expected positive confidence score');
    assert.ok(record.model.length > 0);
    assert.equal(record.promptVersion, 'v1.0-evidence-first');

    // Verify Extracted Structured JSON fields
    assert.ok(Array.isArray(record.extractedInfo.activities), 'Activities must be an array');
    assert.ok(record.extractedInfo.activities.length > 0, 'Should extract activities');
    assert.ok(Array.isArray(record.extractedInfo.technologies), 'Technologies must be an array');
    assert.ok(record.extractedInfo.technologies.some((t: any) => t.name.toLowerCase().includes('typescript') || t.name.toLowerCase().includes('react') || t.name.toLowerCase().includes('node')));
    assert.ok(Array.isArray(record.extractedInfo.skills), 'Skills must be an array');
    assert.ok(Array.isArray(record.extractedInfo.evidence), 'Evidence must be an array');
    assert.ok(record.extractedInfo.evidence.length > 0, 'Evidence quotes must be present');
    assert.ok(Array.isArray(record.extractedInfo.outcomes), 'Outcomes must be an array');
  });

  // 2. Evidence Language Enforcement
  it('2. should enforce evidence language rules: use "No evidence found in submitted work." and prohibit "Student does not know"', async () => {
    // Test ResponseValidator directly with forbidden phrasing
    const dirtyOutput = JSON.stringify({
      activities: [{ description: 'Building auth API', evidenceRef: 'Implemented auth' }],
      technologies: [{ name: 'TypeScript', category: 'Language', evidenceRef: 'TypeScript' }],
      skills: [{ name: 'Software Development', category: 'Technical', evidenceRef: 'Dev' }],
      evidence: [{ quote: 'Implemented auth', context: 'Feature dev', confidence: 0.9 }],
      outcomes: [
        {
          outcomeCode: 'PO-1',
          outcomeName: 'Engineering Knowledge',
          matchStatus: 'MATCHED',
          confidence: 0.9,
          evidenceQuote: 'Implemented auth',
          analysis: 'Demonstrated knowledge',
        },
        {
          outcomeCode: 'PO-9',
          outcomeName: 'Quantum Computing',
          matchStatus: 'NO_EVIDENCE',
          confidence: 0.0,
          evidenceQuote: 'Student does not know quantum mechanics.',
          analysis: 'Student lacks knowledge in this domain.',
        },
      ],
    });

    const { data } = ResponseValidator.validate(dirtyOutput);

    // Negative phrasing must be sanitized!
    const unevidencedOutcome = data.outcomes.find((o) => o.outcomeCode === 'PO-9');
    assert.ok(unevidencedOutcome);
    assert.equal(unevidencedOutcome.evidenceQuote, 'No evidence found in submitted work.');
    assert.ok(!unevidencedOutcome.analysis.includes('Student does not know'));
    assert.ok(!unevidencedOutcome.analysis.includes('Student lacks knowledge'));
    assert.ok(unevidencedOutcome.analysis.includes('No evidence found in submitted work.'));
  });

  // 3. MVP Input Filter: Daily Diary Excluded
  it('3. should skip daily diary entries and micro-logs from AI analysis by institutional policy', async () => {
    const res = await fetch(`${baseUrl}/api/v1/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStudentA}` },
      body: JSON.stringify({
        internshipId: testInternshipId,
        taskId: dailyDiaryTaskId,
        title: 'Daily Standup Diary Entry - Day 14',
        content: 'Attended morning standup. Worked on Jira ticket #102. Had lunch with team.',
      }),
    });

    assert.equal(res.status, 201);
    const data = (await res.json()) as any;
    const dailySubId = data.data.id;

    // Check AI Analysis
    const aiRes = await fetch(`${baseUrl}/api/v1/ai/submissions/${dailySubId}/analysis`, {
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });

    assert.equal(aiRes.status, 200);
    const aiData = (await aiRes.json()) as any;
    assert.equal(aiData.data.status, 'SKIPPED');
    assert.ok(aiData.data.errorMessage.toLowerCase().includes('daily'));
  });

  // 4. Timeout Resilience
  it('4. should handle AI provider timeout gracefully, mark status as FAILED, and leave submission intact', async () => {
    class TimeoutMockProvider implements AIProvider {
      readonly name = 'timeout-mock';
      readonly defaultModel = 'mock-timeout';
      async generateCompletion(): Promise<AIProviderResponse> {
        throw new TimeoutError('LLM Provider request timed out after 12000ms');
      }
    }

    aiAnalysisService.setProvider(new TimeoutMockProvider());

    const res = await fetch(`${baseUrl}/api/v1/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStudentA}` },
      body: JSON.stringify({
        internshipId: testInternshipId,
        title: 'Monthly Progress Report - Timeout Test',
        content: 'Substantive report describing full-stack development and automated test suites.',
      }),
    });

    // Submission MUST succeed even when AI fails!
    assert.equal(res.status, 201);
    const subData = (await res.json()) as any;
    const subId = subData.data.id;

    const aiRes = await fetch(`${baseUrl}/api/v1/ai/submissions/${subId}/analysis`, {
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });
    assert.equal(aiRes.status, 200);
    const aiData = (await aiRes.json()) as any;
    assert.equal(aiData.data.status, 'FAILED');
    assert.ok(aiData.data.errorMessage.includes('timed out'));

    // Restore provider
    aiAnalysisService.setProvider(defaultLLMProvider);
  });

  // 5. Invalid JSON Handling
  it('5. should handle invalid / malformed JSON from model gracefully, mark status as FAILED, without crashing', async () => {
    class MalformedMockProvider implements AIProvider {
      readonly name = 'malformed-mock';
      readonly defaultModel = 'mock-malformed';
      async generateCompletion(): Promise<AIProviderResponse> {
        return {
          rawContent: 'Sorry, I am an AI and cannot produce valid JSON today: { incomplete json ...',
          model: 'mock-malformed',
        };
      }
    }

    aiAnalysisService.setProvider(new MalformedMockProvider());

    const res = await fetch(`${baseUrl}/api/v1/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStudentA}` },
      body: JSON.stringify({
        internshipId: testInternshipId,
        title: 'Monthly Progress Report - Malformed JSON Test',
        content: 'Detailed report describing technical architecture and database schemas.',
      }),
    });

    assert.equal(res.status, 201);
    const subData = (await res.json()) as any;
    const subId = subData.data.id;

    const aiRes = await fetch(`${baseUrl}/api/v1/ai/submissions/${subId}/analysis`, {
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });
    assert.equal(aiRes.status, 200);
    const aiData = (await aiRes.json()) as any;
    assert.equal(aiData.data.status, 'FAILED');
    assert.ok(aiData.data.errorMessage.toLowerCase().includes('json'));

    // Restore provider
    aiAnalysisService.setProvider(defaultLLMProvider);
  });

  // 6. Provider Error Handling
  it('6. should handle upstream 500 provider errors gracefully', async () => {
    class ErrorMockProvider implements AIProvider {
      readonly name = 'error-mock';
      readonly defaultModel = 'mock-error';
      async generateCompletion(): Promise<AIProviderResponse> {
        throw new Error('LLM Provider HTTP 500: Internal Server Overload');
      }
    }

    aiAnalysisService.setProvider(new ErrorMockProvider());

    const res = await fetch(`${baseUrl}/api/v1/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStudentA}` },
      body: JSON.stringify({
        internshipId: testInternshipId,
        title: 'Monthly Progress Report - Upstream Error Test',
        content: 'Substantive report describing Docker setup and containerized deployment.',
      }),
    });

    assert.equal(res.status, 201);
    const subData = (await res.json()) as any;
    const subId = subData.data.id;

    const aiRes = await fetch(`${baseUrl}/api/v1/ai/submissions/${subId}/analysis`, {
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });
    assert.equal(aiRes.status, 200);
    const aiData = (await aiRes.json()) as any;
    assert.equal(aiData.data.status, 'FAILED');
    assert.ok(aiData.data.errorMessage.includes('500'));

    aiAnalysisService.setProvider(defaultLLMProvider);
  });

  // 7. Retry Endpoint
  it('7. should allow retry of a failed analysis via POST /api/v1/ai/submissions/:id/analyze', async () => {
    // 1. Create a submission while provider is broken
    class TemporaryFailProvider implements AIProvider {
      readonly name = 'temp-fail';
      readonly defaultModel = 'mock-temp';
      async generateCompletion(): Promise<AIProviderResponse> {
        throw new Error('Temporary provider glitch');
      }
    }

    aiAnalysisService.setProvider(new TemporaryFailProvider());

    const res = await fetch(`${baseUrl}/api/v1/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStudentA}` },
      body: JSON.stringify({
        internshipId: testInternshipId,
        title: 'Monthly Progress Report - Glitch and Retry Test',
        content: 'Detailed report describing full-stack React and Express development with PostgreSQL.',
      }),
    });
    const subData = (await res.json()) as any;
    const subId = subData.data.id;

    // Verify initial status is FAILED
    const check1 = await fetch(`${baseUrl}/api/v1/ai/submissions/${subId}/analysis`, {
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });
    const data1 = (await check1.json()) as any;
    assert.equal(data1.data.status, 'FAILED');

    // 2. Restore operational provider and trigger RETRY
    aiAnalysisService.setProvider(defaultLLMProvider);

    const retryRes = await fetch(`${baseUrl}/api/v1/ai/submissions/${subId}/analyze`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenStudentA}` },
    });

    assert.equal(retryRes.status, 200);
    const retryData = (await retryRes.json()) as any;
    assert.equal(retryData.data.status, 'COMPLETED');
    assert.ok(retryData.data.extractedInfo.technologies.length > 0);
  });

  // 8. Submission Survives AI Failure
  it('8. should ensure workflow task progresses to SUBMITTED even when AI analysis fails', async () => {
    class CrashingProvider implements AIProvider {
      readonly name = 'crash';
      readonly defaultModel = 'crash';
      async generateCompletion(): Promise<AIProviderResponse> {
        throw new Error('Catastrophic AI Provider Crash');
      }
    }
    aiAnalysisService.setProvider(new CrashingProvider());

    // Task before submission
    const taskBefore = workflowStore.tasks.get(monthlyTaskId);
    assert.ok(taskBefore);

    const res = await fetch(`${baseUrl}/api/v1/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStudentA}` },
      body: JSON.stringify({
        internshipId: testInternshipId,
        taskId: monthlyTaskId,
        title: 'Month 1 Technical Progress Deliverable Report - Survival Test',
        content: 'Implemented API endpoints with PostgreSQL and Prisma.',
        isRevision: true,
      }),
    });

    assert.ok([200, 201].includes(res.status));

    // Verify task status progressed to SUBMITTED
    const taskAfter = workflowStore.tasks.get(monthlyTaskId);
    assert.equal(taskAfter?.status, 'SUBMITTED');

    aiAnalysisService.setProvider(defaultLLMProvider);
  });

  // 9. Advisory Invariant: Zero Health Mutation
  it('9. should guarantee AI is strictly advisory: health engine calculation output is identical before and after AI analysis', async () => {
    const orgId = internshipStore.details.get(testInternshipId)!.organizationId;

    // 1. Calculate deterministic health
    const healthBefore = healthCalculationService.calculateHealth(orgId, testInternshipId);

    // 2. Run an AI analysis
    const versions = submissionStore.versions.get(monthlySubmissionId) || [];
    assert.ok(versions.length > 0);
    await aiAnalysisService.analyzeSubmission(orgId, versions[0], { force: true });

    // 3. Re-calculate deterministic health
    const healthAfter = healthCalculationService.calculateHealth(orgId, testInternshipId);

    // MUST be identical! AI cannot modify health score, reasons, or metrics
    assert.equal(healthBefore.status, healthAfter.status);
    assert.deepEqual(healthBefore.reasons, healthAfter.reasons);
    assert.equal(healthBefore.metrics.overdueTasks, healthAfter.metrics.overdueTasks);
    assert.equal(healthBefore.metrics.pendingReviews, healthAfter.metrics.pendingReviews);
  });

  // 10. Aggregated AI Insights for Faculty View
  it('10. should aggregate AI insights across internship deliverables for faculty monitoring view via GET /api/v1/ai/internships/:id/insights', async () => {
    const res = await fetch(`${baseUrl}/api/v1/ai/internships/${testInternshipId}/insights`, {
      headers: { 'Authorization': `Bearer ${tokenFacultyA}` },
    });

    assert.equal(res.status, 200);
    const data = (await res.json()) as any;
    assert.equal(data.success, true);

    const insights = data.data;
    assert.equal(insights.internshipId, testInternshipId);
    assert.equal(insights.isAdvisory, true);
    assert.ok(insights.analyzedSubmissions > 0);
    assert.ok(Array.isArray(insights.technologiesMastered));
    assert.ok(Array.isArray(insights.skillsDemonstrated));
    assert.ok(Array.isArray(insights.outcomeAttainments));
    assert.ok(insights.outcomeAttainments.some((oa: any) => oa.outcomeCode === 'PO-1' || oa.outcomeCode === 'PO-2'));
  });

  // 11. Multi-Tenant Isolation
  it('11. should block cross-tenant access to AI insights and analysis with HTTP 403 / 404', async () => {
    // Student from Org B attempting to read Org A submission analysis
    const resSub = await fetch(`${baseUrl}/api/v1/ai/submissions/${monthlySubmissionId}/analysis`, {
      headers: { 'Authorization': `Bearer ${tokenStudentB}` },
    });
    // Should be 404 (not found in Org B) or 403
    assert.ok([403, 404].includes(resSub.status));

    // Student from Org B attempting to read Org A internship insights
    const resInsights = await fetch(`${baseUrl}/api/v1/ai/internships/${testInternshipId}/insights`, {
      headers: { 'Authorization': `Bearer ${tokenStudentB}` },
    });
    assert.ok([403, 404].includes(resInsights.status));
  });
});
